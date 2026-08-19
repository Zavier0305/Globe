const STORAGE_KEY = 'pose-sound-enabled'

export function isSoundEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === null ? true : v === '1'
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // localStorageが使えない環境では設定を保持しない
  }
}
