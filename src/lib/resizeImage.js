const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

// アップロード前にブラウザ側で長辺1600pxまで縮小し、常にJPEGへ再エンコードする。
// (通信量・Storage容量の節約に加え、iPhoneのHEIC写真などブラウザの<img>で
// 直接表示できない形式が、そのままアップロードされて誰にも表示できなくなる
// 事故を防ぐため、既に小さい画像でも再エンコードを省略しない)
export async function resizeImageFile(file) {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  )
  if (!blob) return file

  const newName = file.name.replace(/\.\w+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg' })
}
