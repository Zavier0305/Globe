const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82
const THUMBNAIL_DIMENSION = 240
const THUMBNAIL_QUALITY = 0.7

async function toResizedFile(file, maxDimension, quality, suffix) {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  )
  if (!blob) return file

  const newName = file.name.replace(/\.\w+$/, '') + suffix + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg' })
}

// アップロード前にブラウザ側で長辺1600pxまで縮小し、常にJPEGへ再エンコードする。
// (通信量・Storage容量の節約に加え、iPhoneのHEIC写真などブラウザの<img>で
// 直接表示できない形式が、そのままアップロードされて誰にも表示できなくなる
// 事故を防ぐため、既に小さい画像でも再エンコードを省略しない)
export async function resizeImageFile(file) {
  return toResizedFile(file, MAX_DIMENSION, JPEG_QUALITY, '')
}

// 地球儀のピンやサムネイル一覧など、小さく表示するだけの箇所専用の軽量版。
// フル解像度の画像をそのまま小さいサイズで表示すると、投稿数が増えるほど
// ブラウザが同時にデコードして保持する画像データが膨らみ、モバイル端末では
// 「メモリー不足のため操作を完了できません」といったクラッシュの原因になる。
// 表示サイズに見合った小さな画像を別途アップロードして使い分ける。
export async function createThumbnailFile(file) {
  return toResizedFile(file, THUMBNAIL_DIMENSION, THUMBNAIL_QUALITY, '-thumb')
}
