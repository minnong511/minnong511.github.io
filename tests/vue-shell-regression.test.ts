import fs from 'node:fs'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const root = process.cwd()

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}

describe('Explorer SSR defaults', () => {
  const state = new Map<string, { value: unknown }>()

  beforeEach(() => {
    state.clear()
    vi.resetModules()
    vi.stubGlobal('useState', <T>(key: string, initializer: () => T) => {
      if (!state.has(key)) state.set(key, { value: initializer() })
      return state.get(key)
    })
  })

  it('starts with the sidebar closed before client persistence hydrates', async () => {
    const { useWorkspaceState } = await import('../app/composables/useWorkspaceState')
    const workspace = useWorkspaceState()

    expect(workspace.sidebarOpen.value).toBe(false)
    expect(workspace.activeSidebar.value).toBe('explorer')
    expect(workspace.hydrated.value).toBe(false)
  })

  it('renders the collapsed shell class from the closed state', () => {
    const layout = fs.readFileSync(path.join(root, 'app/layouts/default.vue'), 'utf8')

    expect(layout).toContain("'sidebar-collapsed': !workspace.sidebarOpen.value")
    expect(layout).toContain("'explorer-open': workspace.sidebarOpen.value")
  })
})

describe('/write/ removal', () => {
  it('does not expose a Vue page or navigation link for the removed editor', () => {
    expect(fs.existsSync(path.join(root, 'app/pages/write.vue'))).toBe(false)

    const appFiles = walk(path.join(root, 'app'))
      .filter(file => /\.(?:vue|ts)$/.test(file))
    const routeReference = /(?:to|href)=["']\/write\/?["']|navigateTo\(\s*["']\/write\/?["']|router\.(?:push|replace)\(\s*["']\/write\/?["']/

    for (const file of appFiles) {
      const source = fs.readFileSync(file, 'utf8')
      expect(source, path.relative(root, file)).not.toMatch(routeReference)
    }
  })
})
