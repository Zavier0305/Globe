import { supabase } from './supabaseClient'

// slugからコロニーを引く。存在しない場合はnullを返す。
export async function fetchColonyBySlug(slug) {
  const { data, error } = await supabase
    .from('colonies')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('コロニーの取得に失敗しました', error)
    return null
  }
  return data
}

// そのコロニーに投稿された写真一覧(一言を含む)
export async function fetchColonyPoses(colonyId) {
  const { data, error } = await supabase
    .from('poses')
    .select('id, country_code, country_name, image_url, message, created_at')
    .eq('colony_id', colonyId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('コロニー投稿の取得に失敗しました', error)
    return []
  }
  return data
}
