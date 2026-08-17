import fs from "node:fs";
import path from "node:path";

const POSTS_DIR = path.resolve("_posts");
const REQUIRED_FIELDS = ["layout", "title", "description", "date", "categories", "tags"];
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})-.+\.md$/;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function relative(file) {
  return path.relative(process.cwd(), file).replaceAll(path.sep, "/");
}

function field(frontMatter, name) {
  const match = frontMatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "m"));
  return match?.[1]?.replace(/^['"]|['"]$/g, "");
}

function inspectFences(lines, file, errors) {
  let openFence = null;

  lines.forEach((line, index) => {
    if (/^\s*'{3,}\w*\s*$/.test(line)) {
      errors.push(`${file}:${index + 1} 작은따옴표 코드 펜스가 있습니다. 백틱(\`\`\`)을 사용하세요.`);
    }

    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!match) return;

    const marker = match[1][0];
    if (!openFence) {
      openFence = { marker, line: index + 1 };
    } else if (openFence.marker === marker) {
      openFence = null;
    }
  });

  if (openFence) {
    errors.push(`${file}:${openFence.line} 닫히지 않은 코드 블록이 있습니다.`);
  }
}

function countBodyH1(lines) {
  let openFence = null;
  let count = 0;

  for (const line of lines) {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (match) {
      const marker = match[1][0];
      openFence = openFence === marker ? null : (openFence || marker);
      continue;
    }
    if (!openFence && /^(?:>\s*)?#\s+/.test(line)) count += 1;
  }

  return count;
}

const markdownFiles = walk(POSTS_DIR).filter((file) => file.endsWith(".md"));
const errors = [];
const warnings = [];
const activePosts = [];
const unpublishedPosts = [];
const sourceNotes = [];
const titles = new Map();

for (const absoluteFile of markdownFiles) {
  const file = relative(absoluteFile);
  const filenameDate = path.basename(file).match(DATE_PREFIX)?.[1];
  const source = fs.readFileSync(absoluteFile, "utf8").replaceAll("\r\n", "\n");
  const lines = source.split("\n");

  if (!filenameDate) {
    sourceNotes.push(file);
    continue;
  }

  if (lines[0] !== "---") {
    errors.push(`${file}:1 프론트매터 시작 구분자(---)가 없습니다.`);
    continue;
  }

  const closingLine = lines.indexOf("---", 1);
  if (closingLine < 1 || closingLine > 80) {
    errors.push(`${file}: 프론트매터 종료 구분자(---)가 없거나 너무 늦게 나옵니다.`);
    continue;
  }

  const frontMatter = lines.slice(1, closingLine).join("\n");
  const bodyLines = lines.slice(closingLine + 1);
  const body = bodyLines.join("\n").trim();
  const published = field(frontMatter, "published") !== "false";

  if (!published) {
    unpublishedPosts.push(file);
    continue;
  }

  activePosts.push(file);

  for (const name of REQUIRED_FIELDS) {
    if (!field(frontMatter, name)) errors.push(`${file}: 필수 프론트매터 '${name}' 값이 없습니다.`);
  }

  if (field(frontMatter, "layout") !== "post") {
    errors.push(`${file}: layout은 post여야 합니다.`);
  }

  const frontMatterDate = field(frontMatter, "date")?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (frontMatterDate && frontMatterDate !== filenameDate) {
    errors.push(`${file}: 파일 날짜(${filenameDate})와 프론트매터 날짜(${frontMatterDate})가 다릅니다.`);
  }

  let bodyStart = 0;
  while (bodyLines[bodyStart]?.trim() === "") bodyStart += 1;
  if (bodyLines[bodyStart] === "---") {
    const secondClose = bodyLines.indexOf("---", bodyStart + 1);
    const secondBlock = bodyLines.slice(bodyStart + 1, secondClose < 0 ? bodyStart + 12 : secondClose).join("\n");
    if (/^(layout|title|date|categories|tags):/m.test(secondBlock)) {
      errors.push(`${file}:${closingLine + bodyStart + 2} 중복 프론트매터가 본문에 있습니다.`);
    }
  }

  if (!body) errors.push(`${file}: 게시할 본문이 비어 있습니다.`);

  inspectFences(bodyLines, file, errors);

  const rawOpenCount = (body.match(/{%\s*raw\s*%}/g) || []).length;
  const rawCloseCount = (body.match(/{%\s*endraw\s*%}/g) || []).length;
  if (rawOpenCount !== rawCloseCount) {
    errors.push(`${file}: Liquid raw/endraw 블록 수가 맞지 않습니다.`);
  }

  const title = field(frontMatter, "title");
  if (title) {
    const sameTitle = titles.get(title) || [];
    sameTitle.push(file);
    titles.set(title, sameTitle);
  }

  const bodyH1Count = countBodyH1(bodyLines);
  if (bodyH1Count > 0) warnings.push(`${file}: 본문 H1 ${bodyH1Count}개`);
}

for (const [title, files] of titles) {
  if (files.length > 1) errors.push(`중복 제목 '${title}': ${files.join(", ")}`);
}

console.log(`검사: Markdown ${markdownFiles.length}개 / 공개 게시글 ${activePosts.length}개 / 비공개 ${unpublishedPosts.length}개 / 원본 메모 ${sourceNotes.length}개`);

if (warnings.length) {
  console.log(`주의: 레이아웃 제목과 별도로 본문 H1을 사용하는 게시글 ${warnings.length}개`);
  if (process.argv.includes("--verbose")) warnings.forEach((warning) => console.log(`WARN ${warning}`));
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR ${error}`));
  console.error(`실패: ${errors.length}개 오류`);
  process.exitCode = 1;
} else {
  console.log("통과: 화면을 깨뜨리는 게시글 형식 오류가 없습니다.");
}
