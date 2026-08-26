import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "_posts");
const PUBLIC_ROOT = path.join(ROOT, "content", "posts");
const DRAFT_ROOT = path.join(ROOT, "drafts");
const MANIFEST_PATH = path.join(ROOT, "data", "content-manifest.json");
const PUBLIC_MANIFEST_PATH = path.join(ROOT, "data", "public-content-manifest.json");
const LEGACY_ROUTES_PATH = path.join(ROOT, "data", "legacy-public-routes.json");
const REPORT_PATH = path.join(ROOT, "reports", "content-migration.json");
const EXPECTED = { sources: 137, public: 134, drafts: 3, legacyPublic: 82 };
const SITE_URL = "https://minnong511.github.io";

if (!fs.existsSync(SOURCE_ROOT) || walk(SOURCE_ROOT).length === 0) {
  if (fs.existsSync(MANIFEST_PATH) && fs.existsSync(PUBLIC_MANIFEST_PATH) && fs.existsSync(PUBLIC_ROOT)) {
    console.log("Jekyll 콘텐츠 마이그레이션이 이미 적용되어 _posts 원본이 없습니다.");
    process.exit(0);
  }
  throw new Error("마이그레이션할 _posts 디렉터리를 찾을 수 없습니다.");
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeToRoot(value) {
  return toPosix(path.relative(ROOT, value));
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    });
}

function splitFrontMatter(source) {
  const normalized = source.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    return { raw: "", body: normalized, hasFrontMatter: false };
  }

  const lines = normalized.split("\n");
  const closing = lines.indexOf("---", 1);
  if (closing < 1 || closing > 100) {
    return { raw: "", body: normalized, hasFrontMatter: false };
  }

  const raw = lines.slice(1, closing).join("\n");
  if (!/^\s*[A-Za-z_][\w-]*\s*:/m.test(raw)) {
    return { raw: "", body: normalized, hasFrontMatter: false };
  }

  return {
    raw,
    body: lines.slice(closing + 1).join("\n"),
    hasFrontMatter: true
  };
}

function splitInlineArray(value) {
  const inner = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!inner.trim()) return [];

  const items = [];
  let current = "";
  let quote = "";
  let escaped = false;

  for (const character of inner) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote === '"') {
      current += character;
      escaped = true;
      continue;
    }
    if ((character === '"' || character === "'") && (!quote || quote === character)) {
      quote = quote ? "" : character;
      current += character;
      continue;
    }
    if (character === "," && !quote) {
      items.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  items.push(current.trim());

  return items.filter(Boolean).map(parseScalar);
}

function parseScalar(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return splitInlineArray(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null" || trimmed === "~") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
}

function parseFrontMatter(raw) {
  const result = {};
  const lines = raw.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z_][\w-]*):(?:\s*(.*))?$/);
    if (!match) continue;
    const [, key, rest = ""] = match;

    if (!rest.trim()) {
      const values = [];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const item = lines[cursor].match(/^\s+-\s+(.*)$/);
        if (!item) break;
        values.push(parseScalar(item[1]));
        cursor += 1;
      }
      if (values.length) {
        result[key] = values;
        index = cursor - 1;
      } else {
        result[key] = "";
      }
      continue;
    }

    result[key] = parseScalar(rest);
  }

  return result;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function yamlArray(values) {
  return `[${values.map((value) => yamlString(value)).join(", ")}]`;
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}:\d{2}))?(?:\s*([+-]\d{2}):?(\d{2})|\s+Z)?/);
  if (!match) return "";
  const [, day, time = "00:00:00", zoneHour = "+09", zoneMinute = "00"] = match;
  return `${day} ${time} ${zoneHour}${zoneMinute}`;
}

function dayFromDate(value) {
  return String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

function buildFirstAddedDates(globalWarnings) {
  const dates = new Map();
  try {
    const output = execFileSync(
      "git",
      ["log", "--reverse", "--diff-filter=A", "--format=@@DATE:%aI", "--name-only", "--", "_posts"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 20 * 1024 * 1024 }
    );
    let currentDate = "";
    for (const rawLine of output.split("\n")) {
      const line = rawLine.trim();
      if (line.startsWith("@@DATE:")) {
        currentDate = normalizeDate(line.slice("@@DATE:".length));
      } else if (line && currentDate && line.startsWith("_posts/") && !dates.has(line)) {
        dates.set(line, currentDate);
      }
    }
  } catch (error) {
    globalWarnings.push(`Git 추가 날짜 일괄 조회 실패: ${error.message}`);
  }
  return dates;
}

function firstAddedDate(sourcePath, warnings, addedDates) {
  if (addedDates.has(sourcePath)) return addedDates.get(sourcePath);
  try {
    const output = execFileSync(
      "git",
      ["log", "--follow", "--diff-filter=A", "--format=%aI", "--", sourcePath],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).trim();
    const dates = output.split("\n").map((item) => item.trim()).filter(Boolean);
    if (dates.length) return normalizeDate(dates.at(-1));
  } catch (error) {
    warnings.push(`Git 최초 추가 날짜 조회 실패: ${error.message}`);
  }

  const stat = fs.statSync(path.join(ROOT, sourcePath));
  warnings.push("Git 최초 추가 날짜가 없어 파일 mtime을 사용했습니다.");
  return normalizeDate(stat.mtime.toISOString());
}

function outsideFenceLines(body) {
  const result = [];
  let fence = "";

  for (const line of body.split("\n")) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      const character = marker[1][0];
      if (!fence) fence = character;
      else if (fence === character) fence = "";
      continue;
    }
    if (!fence) result.push(line);
  }

  return result;
}

function cleanInlineMarkdown(value) {
  return String(value || "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_~]/g, "")
    .replace(/\\([\\`*_[\]{}()#+.!-])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTitle(body, filename) {
  const heading = outsideFenceLines(body)
    .map((line) => line.match(/^#\s+(.+?)\s*#*\s*$/)?.[1])
    .find(Boolean);
  if (heading) return { value: cleanInlineMarkdown(heading), source: "h1" };

  const stem = filename.replace(/\.md$/i, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return { value: stem.replaceAll("_", " ").trim() || "제목 없는 글", source: "filename" };
}

function isOrdinaryParagraphLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return !(
    /^#{1,6}\s/.test(trimmed)
    || /^(?:[-*+]\s|\d+[.)]\s|>\s|\|)/.test(trimmed)
    || /^(?:---+|___+|\*\*\*+)$/.test(trimmed)
    || /^<!--/.test(trimmed)
    || /^\{%/.test(trimmed)
    || /^<\/?(?:div|section|aside|figure|table|details|summary|script|style)\b/i.test(trimmed)
  );
}

function inferDescription(body, fallbackTitle, warnings) {
  const lines = outsideFenceLines(body);
  for (let index = 0; index < lines.length; index += 1) {
    if (!isOrdinaryParagraphLine(lines[index])) continue;
    const paragraph = [lines[index].trim()];
    let cursor = index + 1;
    while (cursor < lines.length && lines[cursor].trim()) {
      if (!isOrdinaryParagraphLine(lines[cursor])) break;
      paragraph.push(lines[cursor].trim());
      cursor += 1;
    }
    const cleaned = cleanInlineMarkdown(paragraph.join(" "));
    if (cleaned && cleaned !== "???") return cleaned;
  }

  warnings.push("일반 문단을 찾지 못해 제목을 description으로 사용했습니다.");
  return fallbackTitle;
}

function inferCategories(relativeSource) {
  const directories = path.posix.dirname(relativeSource.replace(/^_posts\//, ""));
  if (directories === ".") return ["Study"];
  return directories.split("/").map((item) => item.trim()).filter(Boolean);
}

function slugSegment(value, { lowercase = false } = {}) {
  let segment = String(value || "").trim();
  if (lowercase) segment = segment.toLowerCase();
  return segment
    .normalize("NFC")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}

function routeFor({ categories, date, filename }) {
  const day = dayFromDate(date);
  if (!day) throw new Error(`경로를 만들 수 없는 날짜: ${date}`);
  const [year, month, dateOfMonth] = day.split("-");
  const categoryPath = categories.map((item) => slugSegment(item, { lowercase: true })).join("/");
  const stem = filename.replace(/\.md$/i, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const slug = slugSegment(stem);
  return `/${categoryPath}/${year}/${month}/${dateOfMonth}/${slug}/`;
}

function convertLiquid(body, sourcePath) {
  let mermaidCapturesConverted = 0;
  let rawWrappersRemoved = 0;
  let brokenImageReferencesFixed = 0;

  const captureAndInclude = /{%\s*capture\s+([A-Za-z_][\w]*)\s*%}\s*\n([\s\S]*?)\n{%\s*endcapture\s*%}\s*\n\s*{%\s*include\s+library\/mermaid-diagram\.html([\s\S]*?)%}/g;
  let converted = body.replace(captureAndInclude, (whole, variable, chart, parameters) => {
    const chartVariable = parameters.match(/\bchart\s*=\s*([A-Za-z_][\w]*)/)?.[1];
    if (chartVariable !== variable) return whole;
    const title = parameters.match(/\btitle\s*=\s*"([^"]+)"/)?.[1];
    mermaidCapturesConverted += 1;
    const label = title ? `**${title}**\n\n` : "";
    return `${label}\`\`\`mermaid\n${chart.trim()}\n\`\`\``;
  });

  converted = converted.replace(/^[ \t]*{%\s*(raw|endraw)\s*%}[ \t]*\n?/gm, (whole, kind) => {
    if (kind === "raw") rawWrappersRemoved += 1;
    return "";
  });

  if (sourcePath === "_posts/Backend/JAVA/basics/2026-08-10-java-basics.md") {
    converted = converted.replace(/!\[alt text\]\(image\.png\)/g, () => {
      brokenImageReferencesFixed += 1;
      return "![alt text](/assets/base_image/image.png)";
    });
  }

  return { body: converted, mermaidCapturesConverted, rawWrappersRemoved, brokenImageReferencesFixed };
}

function buildFrontMatter(raw, metadata) {
  const lines = raw ? raw.trimEnd().split("\n") : [];
  const additions = [];
  const has = (key) => new RegExp(`^${key}:`, "m").test(raw);

  if (!has("layout")) additions.push("layout: post");
  if (!has("title")) additions.push(`title: ${yamlString(metadata.title)}`);
  if (!has("description")) additions.push(`description: ${yamlString(metadata.description)}`);
  if (!has("date")) additions.push(`date: ${yamlString(metadata.date)}`);
  if (!has("categories")) additions.push(`categories: ${yamlArray(metadata.categories)}`);
  if (!has("tags")) additions.push("tags: []");
  if (!has("legacyPath")) additions.push(`legacyPath: ${yamlString(metadata.legacyPath)}`);

  const output = [...lines, ...additions].filter((line, index) => line || index > 0).join("\n");
  return `---\n${output}\n---\n`;
}

function runJekyllBaseline(globalWarnings) {
  // Jekyll safe mode compares real paths for includes. macOS /tmp and /var are
  // symlinks, so create the staging tree below the resolved temporary path.
  const temporaryRoot = fs.realpathSync(os.tmpdir());
  const temporary = fs.mkdtempSync(path.join(temporaryRoot, "minnong-content-baseline-"));
  const source = path.join(temporary, "source");
  const destination = path.join(temporary, "site");
  fs.mkdirSync(source, { recursive: true });
  for (const name of ["_posts", "_layouts", "_includes", "assets"]) {
    fs.cpSync(path.join(ROOT, name), path.join(source, name), { recursive: true });
  }
  for (const name of ["_config.yml", "search.json", "index.md", "archive.md", "tags.md", "about.md", "search.md", "write.md"]) {
    fs.copyFileSync(path.join(ROOT, name), path.join(source, name));
  }

  const result = spawnSync(
    "bundle",
    ["exec", "jekyll", "build", "--source", source, "--config", path.join(source, "_config.yml"), "--destination", destination],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024, timeout: 60_000 }
  );

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "unknown error").trim().split("\n").slice(-4).join(" | ");
    globalWarnings.push(`Jekyll baseline build 실패: ${message}`);
    fs.rmSync(temporary, { recursive: true, force: true });
    return { succeeded: false, byTitle: new Map(), count: 0 };
  }

  try {
    const searchIndex = JSON.parse(fs.readFileSync(path.join(destination, "search.json"), "utf8"));
    const byTitle = new Map();
    for (const item of searchIndex) {
      const route = item.url;
      const htmlPath = path.join(destination, route.replace(/^\/+/, ""), "index.html");
      let canonical = `${SITE_URL}${route}`;
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, "utf8");
        const value = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
        if (value) canonical = value.replaceAll("&amp;", "&");
      }
      byTitle.set(item.title, { route, canonical });
    }
    return { succeeded: true, byTitle, count: searchIndex.length };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ensureParent(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

const report = {
  schemaVersion: 1,
  expected: EXPECTED,
  counts: {},
  transformations: {
    frontMatterAdded: 0,
    mermaidCapturesConverted: 0,
    rawWrappersRemoved: 0,
    brokenImageReferencesFixed: 0,
    mustacheTokensPreserved: 0
  },
  inferredFieldCounts: {},
  baseline: { attempted: true, succeeded: false, routes: 0, mismatches: 0 },
  warnings: [],
  errors: []
};

if (!fs.existsSync(SOURCE_ROOT)) {
  throw new Error(`Source directory not found: ${SOURCE_ROOT}`);
}

const sourceFiles = walk(SOURCE_ROOT)
  .filter((file) => /\.md$/i.test(file))
  .sort((left, right) => toPosix(left).localeCompare(toPosix(right), "ko"));

const sources = sourceFiles.map((absoluteSource) => {
  const source = relativeToRoot(absoluteSource);
  const relative = toPosix(path.relative(SOURCE_ROOT, absoluteSource));
  const text = fs.readFileSync(absoluteSource, "utf8").replaceAll("\r\n", "\n");
  const split = splitFrontMatter(text);
  const fields = parseFrontMatter(split.raw);
  const filenameDate = path.basename(absoluteSource).match(/^(\d{4}-\d{2}-\d{2})-/)?.[1] || "";
  const isCurrentJekyllPost = Boolean(filenameDate && split.hasFrontMatter && fields.published !== false);
  return { absoluteSource, source, relative, text, split, fields, filenameDate, isCurrentJekyllPost };
});

const baseline = runJekyllBaseline(report.warnings);
report.baseline.succeeded = baseline.succeeded;
report.baseline.routes = baseline.count;
const firstAddedDates = buildFirstAddedDates(report.warnings);

const manifestEntries = [];
const legacyRoutes = [];
const generated = [];
const routes = new Map();

for (const item of sources) {
  const warnings = [];
  const inferredFields = [];
  const fields = { ...item.fields };
  const converted = convertLiquid(item.split.body, item.source);
  const visibility = fields.published === false ? "draft" : "public";

  let title = typeof fields.title === "string" ? fields.title.trim() : "";
  if (!title) {
    const inferred = inferTitle(converted.body, path.basename(item.absoluteSource));
    title = inferred.value;
    inferredFields.push("title");
    warnings.push(`title을 ${inferred.source === "h1" ? "첫 H1" : "파일명"}에서 추론했습니다.`);
  }

  let description = typeof fields.description === "string" ? fields.description.trim() : "";
  if (!description) {
    description = inferDescription(converted.body, title, warnings);
    inferredFields.push("description");
  }

  let date = normalizeDate(fields.date);
  if (!date && item.filenameDate) {
    date = `${item.filenameDate} 00:00:00 +0900`;
    inferredFields.push("date");
  }
  if (!date) {
    date = firstAddedDate(item.source, warnings, firstAddedDates);
    inferredFields.push("date");
  }

  let categories = Array.isArray(fields.categories)
    ? fields.categories.map(String).map((value) => value.trim()).filter(Boolean)
    : [];
  if (!categories.length) {
    categories = inferCategories(item.source);
    inferredFields.push("categories");
  }

  const tags = Array.isArray(fields.tags)
    ? fields.tags.map(String).map((value) => value.trim()).filter(Boolean)
    : [];
  if (!Array.isArray(fields.tags)) inferredFields.push("tags");
  if (typeof fields.layout !== "string" || !fields.layout.trim()) inferredFields.push("layout");

  const computedRoute = routeFor({ categories, date, filename: path.basename(item.absoluteSource) });
  let route = computedRoute;
  let canonical = `${SITE_URL}${route}`;

  if (item.isCurrentJekyllPost && baseline.succeeded) {
    const verified = baseline.byTitle.get(title);
    if (!verified) {
      const message = `Jekyll baseline에서 기존 공개 글을 찾지 못했습니다: ${title}`;
      report.errors.push(`${item.source}: ${message}`);
      warnings.push(message);
    } else {
      route = verified.route;
      canonical = verified.canonical;
      if (computedRoute !== route) {
        report.baseline.mismatches += 1;
        warnings.push(`계산 경로(${computedRoute})와 Jekyll 경로(${route})가 달라 Jekyll 경로를 고정했습니다.`);
      }
    }
  }

  if (visibility === "public") {
    const duplicate = routes.get(route);
    if (duplicate) report.errors.push(`중복 공개 경로 ${route}: ${duplicate}, ${item.source}`);
    else routes.set(route, item.source);
  }

  const targetRoot = visibility === "draft" ? DRAFT_ROOT : PUBLIC_ROOT;
  // Nuxt Content's collection glob is `posts/**/*.md`, so normalize the one
  // legacy `.Md` extension while keeping the original source path in manifest.
  const targetRelative = item.relative.replace(/\.md$/i, ".md");
  const absoluteTarget = path.join(targetRoot, targetRelative);
  const target = relativeToRoot(absoluteTarget);
  const metadata = { title, description, date, categories, legacyPath: route };
  const frontMatter = buildFrontMatter(item.split.raw, metadata);
  const output = `${frontMatter}${converted.body.replace(/^\n+/, "").replace(/\s*$/, "")}\n`;

  const sourceMustaches = (item.text.match(/{{/g) || []).length;
  const outputMustaches = (output.match(/{{/g) || []).length;
  if (sourceMustaches !== outputMustaches) {
    report.errors.push(`${item.source}: mustache 토큰 수가 ${sourceMustaches}개에서 ${outputMustaches}개로 변경되었습니다.`);
  }
  report.transformations.mustacheTokensPreserved += outputMustaches;

  report.transformations.frontMatterAdded += item.split.hasFrontMatter ? 0 : 1;
  report.transformations.mermaidCapturesConverted += converted.mermaidCapturesConverted;
  report.transformations.rawWrappersRemoved += converted.rawWrappersRemoved;
  report.transformations.brokenImageReferencesFixed += converted.brokenImageReferencesFixed;
  inferredFields.forEach((field) => {
    report.inferredFieldCounts[field] = (report.inferredFieldCounts[field] || 0) + 1;
  });

  generated.push({ absoluteTarget, output });
  manifestEntries.push({
    source: item.source,
    target,
    visibility,
    published: visibility === "public",
    title,
    description,
    date,
    categories,
    tags,
    legacyPath: route,
    inferredFields,
    route,
    warnings,
    transformations: {
      mermaidCapturesConverted: converted.mermaidCapturesConverted,
      rawWrappersRemoved: converted.rawWrappersRemoved,
      brokenImageReferencesFixed: converted.brokenImageReferencesFixed
    }
  });

  if (item.isCurrentJekyllPost) {
    legacyRoutes.push({ source: item.source, title, path: route, canonical });
  }
}

report.counts = {
  sourceFiles: sources.length,
  publicPosts: manifestEntries.filter((item) => item.visibility === "public").length,
  drafts: manifestEntries.filter((item) => item.visibility === "draft").length,
  legacyPublicPosts: sources.filter((item) => item.isCurrentJekyllPost).length,
  inferredPublicPosts: sources.filter((item) => !item.isCurrentJekyllPost && item.fields.published !== false).length,
  manifestEntries: manifestEntries.length,
  legacyRoutes: legacyRoutes.length
};

report.documents = manifestEntries.map((entry) => ({
  source: entry.source,
  target: entry.target,
  visibility: entry.visibility,
  metadata: {
    title: entry.title,
    description: entry.description,
    date: entry.date,
    categories: entry.categories,
    tags: entry.tags,
    published: entry.published
  },
  legacyPath: entry.legacyPath,
  publicUrl: entry.visibility === "public" ? `${SITE_URL}${entry.route}` : null,
  inferredFields: entry.inferredFields,
  warnings: entry.warnings,
  transformations: entry.transformations
}));

const expectedCountKeys = {
  sources: "sourceFiles",
  public: "publicPosts",
  drafts: "drafts",
  legacyPublic: "legacyPublicPosts"
};
for (const [key, expected] of Object.entries(EXPECTED)) {
  const actualKey = expectedCountKeys[key];
  if (report.counts[actualKey] !== expected) {
    report.errors.push(`수량 불일치 ${actualKey}: expected=${expected}, actual=${report.counts[actualKey]}`);
  }
}

if (report.transformations.mermaidCapturesConverted !== 10) {
  report.errors.push(`Liquid Mermaid 변환 수 불일치: expected=10, actual=${report.transformations.mermaidCapturesConverted}`);
}
if (report.transformations.rawWrappersRemoved !== 6) {
  report.errors.push(`Liquid raw 블록 변환 수 불일치: expected=6, actual=${report.transformations.rawWrappersRemoved}`);
}
if (report.transformations.brokenImageReferencesFixed !== 1) {
  report.errors.push(`깨진 이미지 경로 수정 수 불일치: expected=1, actual=${report.transformations.brokenImageReferencesFixed}`);
}
if (baseline.succeeded && baseline.count !== EXPECTED.legacyPublic) {
  report.errors.push(`Jekyll baseline 공개 글 수 불일치: expected=${EXPECTED.legacyPublic}, actual=${baseline.count}`);
}

fs.rmSync(PUBLIC_ROOT, { recursive: true, force: true });
fs.rmSync(DRAFT_ROOT, { recursive: true, force: true });
for (const item of generated) {
  ensureParent(item.absoluteTarget);
  fs.writeFileSync(item.absoluteTarget, item.output, "utf8");
}

ensureParent(MANIFEST_PATH);
ensureParent(PUBLIC_MANIFEST_PATH);
ensureParent(LEGACY_ROUTES_PATH);
ensureParent(REPORT_PATH);
fs.writeFileSync(MANIFEST_PATH, stableJson({ schemaVersion: 1, totals: report.counts, entries: manifestEntries }), "utf8");
fs.writeFileSync(PUBLIC_MANIFEST_PATH, stableJson({
  schemaVersion: 1,
  totals: { publicPosts: report.counts.publicPosts },
  entries: manifestEntries.filter((item) => item.visibility === "public")
}), "utf8");
fs.writeFileSync(LEGACY_ROUTES_PATH, stableJson(legacyRoutes), "utf8");
fs.writeFileSync(REPORT_PATH, stableJson(report), "utf8");

console.log(`Migrated ${report.counts.sourceFiles} sources: ${report.counts.publicPosts} public, ${report.counts.drafts} drafts.`);
console.log(`Converted ${report.transformations.mermaidCapturesConverted} Liquid Mermaid blocks and removed ${report.transformations.rawWrappersRemoved} raw wrappers.`);
console.log(`Legacy routes verified: ${report.counts.legacyRoutes}; baseline mismatches: ${report.baseline.mismatches}.`);
console.log(`Warnings: ${report.warnings.length + manifestEntries.reduce((sum, item) => sum + item.warnings.length, 0)}; errors: ${report.errors.length}.`);

if (report.errors.length) process.exitCode = 1;
