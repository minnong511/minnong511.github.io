import type { Part, Position } from './model'

export interface Face { points: string, color: string, shade: number }
export function project([x, y, z]: Position): [number, number] {
  return [300 + x * 34 - z * 23, 287 - y * 31 + x * 9 + z * 13]
}
export function diagramParts(parts: Part[], cutaway: boolean): Part[] {
  return parts.flatMap((part) => {
    if (!cutaway || part.kind === 'wire') return [part]
    const lower = part.position[2] - part.size[2] / 2
    const upper = Math.min(0, part.position[2] + part.size[2] / 2)
    if (upper <= lower) return []
    return [{ ...part, position: [part.position[0], part.position[1], (lower + upper) / 2] as Position, size: [part.size[0], part.size[1], upper - lower] as Position }]
  }).sort((a, b) => a.position[1] - b.position[1] || a.position[2] - b.position[2])
}
export function faces(part: Part): Face[] {
  const [x, y, z] = part.position
  const [w, h, d] = part.size.map(n => n / 2) as Position
  const point = (a: number, b: number, c: number) => project([x + a * w, y + b * h, z + c * d]).join(',')
  return [
    { points: [point(-1, -1, 1), point(1, -1, 1), point(1, 1, 1), point(-1, 1, 1)].join(' '), color: part.color, shade: 0.86 },
    { points: [point(1, -1, -1), point(1, -1, 1), point(1, 1, 1), point(1, 1, -1)].join(' '), color: part.color, shade: 0.69 },
    { points: [point(-1, 1, -1), point(1, 1, -1), point(1, 1, 1), point(-1, 1, 1)].join(' '), color: part.color, shade: 1 },
  ]
}
