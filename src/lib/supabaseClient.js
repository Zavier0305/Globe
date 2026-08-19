import { createClient } from '@supabase/supabase-js'

// デフォルト値はSupabaseのpublic anon keyで、クライアント公開前提の値です。
// 別プロジェクトを使う場合は環境変数(.env / Vercelのプロジェクト設定)で上書きしてください。
const DEFAULT_SUPABASE_URL = 'https://ichvuncoiyffzjvbmswi.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_tsHY0-6akyn5O0OtTs1GkQ_SjLjuPt8'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const POSES_TABLE = 'poses'
export const POSE_IMAGES_BUCKET = 'pose-images'
