// Adapt saved LaTeX delimiters before Markdown can interpret '=' as a heading.
// Keep front matter, fenced examples and inline code literal.
export function normalizeMathDelimiters(source: string): string {
  const frontMatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] || ''
  const body = source.slice(frontMatter.length)
  function convert(text: string) {
    return text.split(/(`+[^\n]*?`+)/g).map((part, index) => index % 2 ? part : part
      .replace(/^ {0,3}\\\[[ \t]*\r?\n([\s\S]*?)\r?\n {0,3}\\\][ \t]*$/gm, (_, math: string) => `\n$$\n${math}\n$$\n`)
      .replace(/\\\(([^\n]*?)\\\)/g, (_, math: string) => `$$${math}$$`)
    ).join('')
  }
  let result = frontMatter
  let prose = ''
  let fence = ''
  for (const line of body.match(/[^\n]*\n|[^\n]+$/g) || []) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fence) {
      result += line
      if (marker && marker[1]![0] === fence[0] && marker[1]!.length >= fence.length && !line.slice(marker[0].length).trim()) fence = ''
    } else if (marker) {
      result += convert(prose) + line
      prose = ''
      fence = marker[1]!
    } else {
      prose += line
    }
  }
  return result + convert(prose)
}
