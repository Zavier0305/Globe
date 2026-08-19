// ISO 3166-1 alpha-2コードから国旗絵文字を生成する(リージョナルインジケーター記号の組み合わせ)
export function flagEmoji(code) {
  if (!code || code.length !== 2) return '🏳️'
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}
