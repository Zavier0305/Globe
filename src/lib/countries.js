// 主要50カ国の対応表(ISO2コード / 日本語名 / 英語名 / 代表地点の緯度経度=首都付近)
export const COUNTRIES = [
  { code: 'JP', name_ja: '日本', name_en: 'Japan', lat: 35.6762, lng: 139.6503 },
  { code: 'US', name_ja: 'アメリカ合衆国', name_en: 'United States', lat: 38.9072, lng: -77.0369 },
  { code: 'CA', name_ja: 'カナダ', name_en: 'Canada', lat: 45.4215, lng: -75.6972 },
  { code: 'MX', name_ja: 'メキシコ', name_en: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { code: 'BR', name_ja: 'ブラジル', name_en: 'Brazil', lat: -15.7939, lng: -47.8828 },
  { code: 'AR', name_ja: 'アルゼンチン', name_en: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { code: 'CL', name_ja: 'チリ', name_en: 'Chile', lat: -33.4489, lng: -70.6693 },
  { code: 'PE', name_ja: 'ペルー', name_en: 'Peru', lat: -12.0464, lng: -77.0428 },
  { code: 'CO', name_ja: 'コロンビア', name_en: 'Colombia', lat: 4.7110, lng: -74.0721 },
  { code: 'GB', name_ja: 'イギリス', name_en: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { code: 'FR', name_ja: 'フランス', name_en: 'France', lat: 48.8566, lng: 2.3522 },
  { code: 'DE', name_ja: 'ドイツ', name_en: 'Germany', lat: 52.5200, lng: 13.4050 },
  { code: 'IT', name_ja: 'イタリア', name_en: 'Italy', lat: 41.9028, lng: 12.4964 },
  { code: 'ES', name_ja: 'スペイン', name_en: 'Spain', lat: 40.4168, lng: -3.7038 },
  { code: 'PT', name_ja: 'ポルトガル', name_en: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { code: 'NL', name_ja: 'オランダ', name_en: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { code: 'BE', name_ja: 'ベルギー', name_en: 'Belgium', lat: 50.8503, lng: 4.3517 },
  { code: 'CH', name_ja: 'スイス', name_en: 'Switzerland', lat: 46.9480, lng: 7.4474 },
  { code: 'AT', name_ja: 'オーストリア', name_en: 'Austria', lat: 48.2082, lng: 16.3738 },
  { code: 'SE', name_ja: 'スウェーデン', name_en: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { code: 'NO', name_ja: 'ノルウェー', name_en: 'Norway', lat: 59.9139, lng: 10.7522 },
  { code: 'DK', name_ja: 'デンマーク', name_en: 'Denmark', lat: 55.6761, lng: 12.5683 },
  { code: 'FI', name_ja: 'フィンランド', name_en: 'Finland', lat: 60.1699, lng: 24.9384 },
  { code: 'PL', name_ja: 'ポーランド', name_en: 'Poland', lat: 52.2297, lng: 21.0122 },
  { code: 'CZ', name_ja: 'チェコ', name_en: 'Czechia', lat: 50.0755, lng: 14.4378 },
  { code: 'GR', name_ja: 'ギリシャ', name_en: 'Greece', lat: 37.9838, lng: 23.7275 },
  { code: 'IE', name_ja: 'アイルランド', name_en: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { code: 'RU', name_ja: 'ロシア', name_en: 'Russia', lat: 55.7558, lng: 37.6173 },
  { code: 'UA', name_ja: 'ウクライナ', name_en: 'Ukraine', lat: 50.4501, lng: 30.5234 },
  { code: 'TR', name_ja: 'トルコ', name_en: 'Turkey', lat: 39.9334, lng: 32.8597 },
  { code: 'EG', name_ja: 'エジプト', name_en: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { code: 'ZA', name_ja: '南アフリカ', name_en: 'South Africa', lat: -25.7479, lng: 28.2293 },
  { code: 'NG', name_ja: 'ナイジェリア', name_en: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { code: 'KE', name_ja: 'ケニア', name_en: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { code: 'MA', name_ja: 'モロッコ', name_en: 'Morocco', lat: 34.0209, lng: -6.8416 },
  { code: 'IL', name_ja: 'イスラエル', name_en: 'Israel', lat: 31.7683, lng: 35.2137 },
  { code: 'SA', name_ja: 'サウジアラビア', name_en: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { code: 'AE', name_ja: 'アラブ首長国連邦', name_en: 'United Arab Emirates', lat: 24.4539, lng: 54.3773 },
  { code: 'IN', name_ja: 'インド', name_en: 'India', lat: 28.6139, lng: 77.2090 },
  { code: 'PK', name_ja: 'パキスタン', name_en: 'Pakistan', lat: 33.6844, lng: 73.0479 },
  { code: 'BD', name_ja: 'バングラデシュ', name_en: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  { code: 'CN', name_ja: '中国', name_en: 'China', lat: 39.9042, lng: 116.4074 },
  { code: 'KR', name_ja: '韓国', name_en: 'South Korea', lat: 37.5665, lng: 126.9780 },
  { code: 'TW', name_ja: '台湾', name_en: 'Taiwan', lat: 25.0330, lng: 121.5654 },
  { code: 'HK', name_ja: '香港', name_en: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { code: 'TH', name_ja: 'タイ', name_en: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { code: 'VN', name_ja: 'ベトナム', name_en: 'Vietnam', lat: 21.0278, lng: 105.8342 },
  { code: 'PH', name_ja: 'フィリピン', name_en: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { code: 'ID', name_ja: 'インドネシア', name_en: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { code: 'MY', name_ja: 'マレーシア', name_en: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  { code: 'SG', name_ja: 'シンガポール', name_en: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { code: 'AU', name_ja: 'オーストラリア', name_en: 'Australia', lat: -35.2809, lng: 149.1300 },
  { code: 'NZ', name_ja: 'ニュージーランド', name_en: 'New Zealand', lat: -41.2865, lng: 174.7762 },
]

export function findCountry(code) {
  return COUNTRIES.find((c) => c.code === code)
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// 端末の緯度経度から、対応表の中で最も近い国を推定する(簡易ジオコーディング代わり)
export function findNearestCountry(lat, lng) {
  let nearest = null
  let minDist = Infinity
  for (const c of COUNTRIES) {
    const d = haversineDistance(lat, lng, c.lat, c.lng)
    if (d < minDist) {
      minDist = d
      nearest = c
    }
  }
  return nearest
}
