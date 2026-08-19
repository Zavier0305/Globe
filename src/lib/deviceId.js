const STORAGE_KEY = 'pose-device-id'

// 投稿レート制限のために端末を識別する乱数ID(個人情報ではない、localStorageのみに保存)
export function getDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}
