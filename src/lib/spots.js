import { supabase } from './supabaseClient'

// slugからスポットを引く。存在しない場合はnullを返す。
export async function fetchSpotBySlug(slug) {
  const { data, error } = await supabase
    .from('spots')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('スポットの取得に失敗しました', error)
    return null
  }
  return data
}

// そのスポットに投稿された写真一覧(一言を含む)
export async function fetchSpotPoses(spotId) {
  const { data, error } = await supabase
    .from('poses')
    .select('id, country_code, country_name, image_url, message, created_at')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('スポット投稿の取得に失敗しました', error)
    return []
  }
  return data
}
