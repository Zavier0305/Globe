// 主要50カ国の対応表(ISO2コード / 各言語名 / 代表地点の緯度経度=首都付近)
export const COUNTRIES = [
  { code: 'JP', name_ja: '日本', name_en: 'Japan', name_zh: '日本', name_ko: '일본', name_es: 'Japón', lat: 35.6762, lng: 139.6503 },
  { code: 'US', name_ja: 'アメリカ合衆国', name_en: 'United States', name_zh: '美国', name_ko: '미국', name_es: 'Estados Unidos', lat: 38.9072, lng: -77.0369 },
  { code: 'CA', name_ja: 'カナダ', name_en: 'Canada', name_zh: '加拿大', name_ko: '캐나다', name_es: 'Canadá', lat: 45.4215, lng: -75.6972 },
  { code: 'MX', name_ja: 'メキシコ', name_en: 'Mexico', name_zh: '墨西哥', name_ko: '멕시코', name_es: 'México', lat: 19.4326, lng: -99.1332 },
  { code: 'BR', name_ja: 'ブラジル', name_en: 'Brazil', name_zh: '巴西', name_ko: '브라질', name_es: 'Brasil', lat: -15.7939, lng: -47.8828 },
  { code: 'AR', name_ja: 'アルゼンチン', name_en: 'Argentina', name_zh: '阿根廷', name_ko: '아르헨티나', name_es: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { code: 'CL', name_ja: 'チリ', name_en: 'Chile', name_zh: '智利', name_ko: '칠레', name_es: 'Chile', lat: -33.4489, lng: -70.6693 },
  { code: 'PE', name_ja: 'ペルー', name_en: 'Peru', name_zh: '秘鲁', name_ko: '페루', name_es: 'Perú', lat: -12.0464, lng: -77.0428 },
  { code: 'CO', name_ja: 'コロンビア', name_en: 'Colombia', name_zh: '哥伦比亚', name_ko: '콜롬비아', name_es: 'Colombia', lat: 4.7110, lng: -74.0721 },
  { code: 'GB', name_ja: 'イギリス', name_en: 'United Kingdom', name_zh: '英国', name_ko: '영국', name_es: 'Reino Unido', lat: 51.5074, lng: -0.1278 },
  { code: 'FR', name_ja: 'フランス', name_en: 'France', name_zh: '法国', name_ko: '프랑스', name_es: 'Francia', lat: 48.8566, lng: 2.3522 },
  { code: 'DE', name_ja: 'ドイツ', name_en: 'Germany', name_zh: '德国', name_ko: '독일', name_es: 'Alemania', lat: 52.5200, lng: 13.4050 },
  { code: 'IT', name_ja: 'イタリア', name_en: 'Italy', name_zh: '意大利', name_ko: '이탈리아', name_es: 'Italia', lat: 41.9028, lng: 12.4964 },
  { code: 'ES', name_ja: 'スペイン', name_en: 'Spain', name_zh: '西班牙', name_ko: '스페인', name_es: 'España', lat: 40.4168, lng: -3.7038 },
  { code: 'PT', name_ja: 'ポルトガル', name_en: 'Portugal', name_zh: '葡萄牙', name_ko: '포르투갈', name_es: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { code: 'NL', name_ja: 'オランダ', name_en: 'Netherlands', name_zh: '荷兰', name_ko: '네덜란드', name_es: 'Países Bajos', lat: 52.3676, lng: 4.9041 },
  { code: 'BE', name_ja: 'ベルギー', name_en: 'Belgium', name_zh: '比利时', name_ko: '벨기에', name_es: 'Bélgica', lat: 50.8503, lng: 4.3517 },
  { code: 'CH', name_ja: 'スイス', name_en: 'Switzerland', name_zh: '瑞士', name_ko: '스위스', name_es: 'Suiza', lat: 46.9480, lng: 7.4474 },
  { code: 'AT', name_ja: 'オーストリア', name_en: 'Austria', name_zh: '奥地利', name_ko: '오스트리아', name_es: 'Austria', lat: 48.2082, lng: 16.3738 },
  { code: 'SE', name_ja: 'スウェーデン', name_en: 'Sweden', name_zh: '瑞典', name_ko: '스웨덴', name_es: 'Suecia', lat: 59.3293, lng: 18.0686 },
  { code: 'NO', name_ja: 'ノルウェー', name_en: 'Norway', name_zh: '挪威', name_ko: '노르웨이', name_es: 'Noruega', lat: 59.9139, lng: 10.7522 },
  { code: 'DK', name_ja: 'デンマーク', name_en: 'Denmark', name_zh: '丹麦', name_ko: '덴마크', name_es: 'Dinamarca', lat: 55.6761, lng: 12.5683 },
  { code: 'FI', name_ja: 'フィンランド', name_en: 'Finland', name_zh: '芬兰', name_ko: '핀란드', name_es: 'Finlandia', lat: 60.1699, lng: 24.9384 },
  { code: 'PL', name_ja: 'ポーランド', name_en: 'Poland', name_zh: '波兰', name_ko: '폴란드', name_es: 'Polonia', lat: 52.2297, lng: 21.0122 },
  { code: 'CZ', name_ja: 'チェコ', name_en: 'Czechia', name_zh: '捷克', name_ko: '체코', name_es: 'Chequia', lat: 50.0755, lng: 14.4378 },
  { code: 'GR', name_ja: 'ギリシャ', name_en: 'Greece', name_zh: '希腊', name_ko: '그리스', name_es: 'Grecia', lat: 37.9838, lng: 23.7275 },
  { code: 'IE', name_ja: 'アイルランド', name_en: 'Ireland', name_zh: '爱尔兰', name_ko: '아일랜드', name_es: 'Irlanda', lat: 53.3498, lng: -6.2603 },
  { code: 'RU', name_ja: 'ロシア', name_en: 'Russia', name_zh: '俄罗斯', name_ko: '러시아', name_es: 'Rusia', lat: 55.7558, lng: 37.6173 },
  { code: 'UA', name_ja: 'ウクライナ', name_en: 'Ukraine', name_zh: '乌克兰', name_ko: '우크라이나', name_es: 'Ucrania', lat: 50.4501, lng: 30.5234 },
  { code: 'TR', name_ja: 'トルコ', name_en: 'Turkey', name_zh: '土耳其', name_ko: '튀르키예', name_es: 'Turquía', lat: 39.9334, lng: 32.8597 },
  { code: 'EG', name_ja: 'エジプト', name_en: 'Egypt', name_zh: '埃及', name_ko: '이집트', name_es: 'Egipto', lat: 30.0444, lng: 31.2357 },
  { code: 'ZA', name_ja: '南アフリカ', name_en: 'South Africa', name_zh: '南非', name_ko: '남아프리카공화국', name_es: 'Sudáfrica', lat: -25.7479, lng: 28.2293 },
  { code: 'NG', name_ja: 'ナイジェリア', name_en: 'Nigeria', name_zh: '尼日利亚', name_ko: '나이지리아', name_es: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { code: 'KE', name_ja: 'ケニア', name_en: 'Kenya', name_zh: '肯尼亚', name_ko: '케냐', name_es: 'Kenia', lat: -1.2921, lng: 36.8219 },
  { code: 'MA', name_ja: 'モロッコ', name_en: 'Morocco', name_zh: '摩洛哥', name_ko: '모로코', name_es: 'Marruecos', lat: 34.0209, lng: -6.8416 },
  { code: 'IL', name_ja: 'イスラエル', name_en: 'Israel', name_zh: '以色列', name_ko: '이스라엘', name_es: 'Israel', lat: 31.7683, lng: 35.2137 },
  { code: 'SA', name_ja: 'サウジアラビア', name_en: 'Saudi Arabia', name_zh: '沙特阿拉伯', name_ko: '사우디아라비아', name_es: 'Arabia Saudita', lat: 24.7136, lng: 46.6753 },
  { code: 'AE', name_ja: 'アラブ首長国連邦', name_en: 'United Arab Emirates', name_zh: '阿拉伯联合酋长国', name_ko: '아랍에미리트', name_es: 'Emiratos Árabes Unidos', lat: 24.4539, lng: 54.3773 },
  { code: 'IN', name_ja: 'インド', name_en: 'India', name_zh: '印度', name_ko: '인도', name_es: 'India', lat: 28.6139, lng: 77.2090 },
  { code: 'PK', name_ja: 'パキスタン', name_en: 'Pakistan', name_zh: '巴基斯坦', name_ko: '파키스탄', name_es: 'Pakistán', lat: 33.6844, lng: 73.0479 },
  { code: 'BD', name_ja: 'バングラデシュ', name_en: 'Bangladesh', name_zh: '孟加拉国', name_ko: '방글라데시', name_es: 'Bangladés', lat: 23.8103, lng: 90.4125 },
  { code: 'CN', name_ja: '中国', name_en: 'China', name_zh: '中国', name_ko: '중국', name_es: 'China', lat: 39.9042, lng: 116.4074 },
  { code: 'KR', name_ja: '韓国', name_en: 'South Korea', name_zh: '韩国', name_ko: '대한민국', name_es: 'Corea del Sur', lat: 37.5665, lng: 126.9780 },
  { code: 'TW', name_ja: '台湾', name_en: 'Taiwan', name_zh: '台湾', name_ko: '대만', name_es: 'Taiwán', lat: 25.0330, lng: 121.5654 },
  { code: 'HK', name_ja: '香港', name_en: 'Hong Kong', name_zh: '香港', name_ko: '홍콩', name_es: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { code: 'TH', name_ja: 'タイ', name_en: 'Thailand', name_zh: '泰国', name_ko: '태국', name_es: 'Tailandia', lat: 13.7563, lng: 100.5018 },
  { code: 'VN', name_ja: 'ベトナム', name_en: 'Vietnam', name_zh: '越南', name_ko: '베트남', name_es: 'Vietnam', lat: 21.0278, lng: 105.8342 },
  { code: 'PH', name_ja: 'フィリピン', name_en: 'Philippines', name_zh: '菲律宾', name_ko: '필리핀', name_es: 'Filipinas', lat: 14.5995, lng: 120.9842 },
  { code: 'ID', name_ja: 'インドネシア', name_en: 'Indonesia', name_zh: '印度尼西亚', name_ko: '인도네시아', name_es: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { code: 'MY', name_ja: 'マレーシア', name_en: 'Malaysia', name_zh: '马来西亚', name_ko: '말레이시아', name_es: 'Malasia', lat: 3.1390, lng: 101.6869 },
  { code: 'SG', name_ja: 'シンガポール', name_en: 'Singapore', name_zh: '新加坡', name_ko: '싱가포르', name_es: 'Singapur', lat: 1.3521, lng: 103.8198 },
  { code: 'AU', name_ja: 'オーストラリア', name_en: 'Australia', name_zh: '澳大利亚', name_ko: '호주', name_es: 'Australia', lat: -35.2809, lng: 149.1300 },
  { code: 'NZ', name_ja: 'ニュージーランド', name_en: 'New Zealand', name_zh: '新西兰', name_ko: '뉴질랜드', name_es: 'Nueva Zelanda', lat: -41.2865, lng: 174.7762 },
]

export function findCountry(code) {
  return COUNTRIES.find((c) => c.code === code)
}

const NAME_KEY_BY_LANG = {
  ja: 'name_ja',
  en: 'name_en',
  'zh-Hans': 'name_zh',
  ko: 'name_ko',
  es: 'name_es',
}

// 表示言語に応じた国名を返す(未対応の国コードの場合はフォールバックを使う)
export function countryDisplayName(country, lang, fallback) {
  if (!country) return fallback || ''
  const key = NAME_KEY_BY_LANG[lang] || 'name_ja'
  return country[key] || country.name_ja || fallback || ''
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
