const STORAGE_KEY = 'pose-delete-tokens'
const UNDO_WINDOW_MS = 30 * 60 * 1000 // 投稿から30分以内だけ取り消し可能

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorageが使えない環境では取り消し機能を諦める
  }
}

export function saveDeleteToken(poseId, token) {
  const map = readAll()
  map[poseId] = { token, savedAt: Date.now() }
  writeAll(map)
}

export function getDeleteToken(poseId) {
  const map = readAll()
  const entry = map[poseId]
  if (!entry) return null
  if (Date.now() - entry.savedAt > UNDO_WINDOW_MS) return null
  return entry.token
}

export function removeDeleteToken(poseId) {
  const map = readAll()
  delete map[poseId]
  writeAll(map)
}
