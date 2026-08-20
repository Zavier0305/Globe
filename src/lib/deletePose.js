import { supabase, POSE_IMAGES_BUCKET } from './supabaseClient'

async function removeStorageFile(path) {
  if (!path) return
  const { error } = await supabase.storage.from(POSE_IMAGES_BUCKET).remove([path])
  if (error) {
    // DB側は既に削除済みなので致命的ではない。孤児ファイルとして残るのみ。
    console.error('Storageファイルの削除に失敗しました', error)
  }
}

// 投稿者本人による削除。delete_own_poseが成功したらstorageのファイルも削除する。
export async function deleteOwnPose(poseId, token) {
  const { data, error } = await supabase.rpc('delete_own_pose', {
    p_id: poseId,
    p_token: token,
  })
  const result = Array.isArray(data) ? data[0] : data
  if (error || !result?.deleted) {
    return { success: false }
  }
  await removeStorageFile(result.storage_path)
  await removeStorageFile(result.thumbnail_storage_path)
  return { success: true }
}

// 管理者による強制削除
export async function adminDeletePose(password, poseId) {
  const { data, error } = await supabase.rpc('admin_delete_pose', {
    p_password: password,
    p_id: poseId,
  })
  const result = Array.isArray(data) ? data[0] : data
  if (error || !result?.deleted) {
    return { success: false }
  }
  await removeStorageFile(result.storage_path)
  await removeStorageFile(result.thumbnail_storage_path)
  return { success: true }
}
