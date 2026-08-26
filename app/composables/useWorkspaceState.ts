import type {
  FontSizePreference,
  SidebarView,
  ThemePreference,
  WorkspaceBookmark,
  WorkspaceTab,
} from '~/types/content'

const STORAGE_KEYS = {
  theme: 'minnong-theme',
  fontSize: 'minnong-font-size',
  tabs: 'minnong-tabs-v2',
  sidebarView: 'ide-sidebar-view',
  folders: 'ide-folders-v2',
  contextVisible: 'ide-context-visible',
  panelWidths: 'ide-panel-widths',
  bookmarks: 'ide-bookmarks',
} as const

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
}

export function useWorkspaceState() {
  const sidebarOpen = useState<boolean>('ide:sidebar-open', () => false)
  const mobileContextOpen = useState<boolean>('ide:mobile-context-open', () => false)
  const contextVisible = useState<boolean>('ide:context-visible', () => true)
  const activeSidebar = useState<SidebarView>('ide:active-sidebar', () => 'explorer')
  const theme = useState<ThemePreference>('ide:theme', () => 'dark')
  const fontSize = useState<FontSizePreference>('ide:font-size', () => 'medium')
  const tabs = useState<WorkspaceTab[]>('ide:tabs', () => [])
  const bookmarks = useState<WorkspaceBookmark[]>('ide:bookmarks', () => [])
  const folderState = useState<Record<string, boolean>>('ide:folders', () => ({}))
  const panelWidths = useState('ide:panel-widths', () => ({ explorer: 280, context: 300 }))
  const paletteOpen = useState<boolean>('ide:palette-open', () => false)
  const hydrated = useState<boolean>('ide:persistence-hydrated', () => false)

  function showSidebar(view: SidebarView) {
    if (activeSidebar.value === view && sidebarOpen.value) {
      sidebarOpen.value = false
      return
    }
    activeSidebar.value = view
    sidebarOpen.value = true
  }

  function addTab(tab: WorkspaceTab) {
    const url = tab.url || '/'
    const existing = tabs.value.find(item => item.url === url)
    if (existing) existing.title = tab.title || existing.title
    else tabs.value = [...tabs.value, { url, title: tab.title || 'untitled' }].slice(-6)
  }

  function closeTab(url: string) {
    tabs.value = tabs.value.filter(item => item.url !== url)
  }

  function toggleBookmark(bookmark: WorkspaceBookmark) {
    const exists = bookmarks.value.some(item => item.url === bookmark.url)
    bookmarks.value = exists
      ? bookmarks.value.filter(item => item.url !== bookmark.url)
      : [bookmark, ...bookmarks.value.filter(item => item.url !== bookmark.url)].slice(0, 30)
  }

  function setFolder(key: string, open: boolean) {
    folderState.value = { ...folderState.value, [key]: open }
  }

  function setTheme(next: ThemePreference) {
    theme.value = next
  }

  function setFontSize(next: FontSizePreference) {
    fontSize.value = next
  }

  return {
    sidebarOpen,
    mobileContextOpen,
    contextVisible,
    activeSidebar,
    theme,
    fontSize,
    tabs,
    bookmarks,
    folderState,
    panelWidths,
    paletteOpen,
    hydrated,
    showSidebar,
    addTab,
    closeTab,
    toggleBookmark,
    setFolder,
    setTheme,
    setFontSize,
  }
}

export function useWorkspacePersistence() {
  const workspace = useWorkspaceState()
  if (!import.meta.client) return workspace

  function applyTheme(value: ThemePreference) {
    document.documentElement.dataset.theme = value
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = value === 'light' ? '#f2f4f6' : '#090a0c'
  }

  function applyFontSize(value: FontSizePreference) {
    document.documentElement.dataset.fontSize = value
  }

  onMounted(() => {
    if (!workspace.hydrated.value) {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme)
      const savedFont = localStorage.getItem(STORAGE_KEYS.fontSize)
      const savedView = localStorage.getItem(STORAGE_KEYS.sidebarView)
      workspace.theme.value = savedTheme === 'light' ? 'light' : 'dark'
      workspace.fontSize.value = ['small', 'medium', 'large'].includes(savedFont || '')
        ? savedFont as FontSizePreference
        : 'medium'
      workspace.activeSidebar.value = ['explorer', 'search', 'source', 'run', 'about'].includes(savedView || '')
        ? savedView as SidebarView
        : 'explorer'
      workspace.contextVisible.value = localStorage.getItem(STORAGE_KEYS.contextVisible) !== 'false'
      const currentTabs = workspace.tabs.value
      const savedTabs = readJson<WorkspaceTab[]>(STORAGE_KEYS.tabs, [])
        .filter(tab => tab && tab.url)
        .slice(-6)
      workspace.tabs.value = [...savedTabs, ...currentTabs]
        .filter((tab, index, values) => values.findIndex(item => item.url === tab.url) === index)
        .slice(-6)
      workspace.bookmarks.value = readJson<WorkspaceBookmark[]>(STORAGE_KEYS.bookmarks, [])
        .filter(item => item && item.url)
        .slice(0, 30)
      workspace.folderState.value = readJson<Record<string, boolean>>(STORAGE_KEYS.folders, {})
      const widths = readJson<Record<string, number>>(STORAGE_KEYS.panelWidths, {})
      workspace.panelWidths.value = {
        explorer: Math.max(220, Math.min(420, Number(widths.explorer) || 280)),
        context: Math.max(220, Math.min(420, Number(widths.context) || 300)),
      }
      workspace.hydrated.value = true
    }
    applyTheme(workspace.theme.value)
    applyFontSize(workspace.fontSize.value)
  })

  watch(workspace.theme, value => {
    if (!workspace.hydrated.value) return
    applyTheme(value)
    localStorage.setItem(STORAGE_KEYS.theme, value)
  })
  watch(workspace.fontSize, value => {
    if (!workspace.hydrated.value) return
    applyFontSize(value)
    localStorage.setItem(STORAGE_KEYS.fontSize, value)
  })
  watch(workspace.activeSidebar, (value) => {
    if (workspace.hydrated.value) localStorage.setItem(STORAGE_KEYS.sidebarView, value)
  })
  watch(workspace.contextVisible, (value) => {
    if (workspace.hydrated.value) localStorage.setItem(STORAGE_KEYS.contextVisible, String(value))
  })
  watch(workspace.tabs, (value) => {
    if (workspace.hydrated.value) writeJson(STORAGE_KEYS.tabs, value)
  }, { deep: true })
  watch(workspace.bookmarks, (value) => {
    if (workspace.hydrated.value) writeJson(STORAGE_KEYS.bookmarks, value)
  }, { deep: true })
  watch(workspace.folderState, (value) => {
    if (workspace.hydrated.value) writeJson(STORAGE_KEYS.folders, value)
  }, { deep: true })
  watch(workspace.panelWidths, (value) => {
    if (workspace.hydrated.value) writeJson(STORAGE_KEYS.panelWidths, value)
  }, { deep: true })

  return workspace
}
