# 世界のポーズ地球儀

React (Vite) + Tailwind CSS + react-globe.gl + Supabase で作る、世界中から届く「ポーズ写真」を地球儀にピン留めして表示するWebアプリ。

## 1. Supabaseセットアップ

このプロジェクトでは Supabase プロジェクト `sensuikan` (project_id: `ichvuncoiyffzjvbmswi`) に以下を追加済みです。別プロジェクトで動かす場合は、SQL Editor で以下を実行してください。

```sql
-- poses table
create table if not exists public.poses (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.poses enable row level security;

-- 誰でも閲覧可能(地球儀に全員分表示するため)
create policy "poses_select_all"
  on public.poses
  for select
  to anon, authenticated
  using (true);

-- 誰でも投稿可能(匿名投稿)
create policy "poses_insert_all"
  on public.poses
  for insert
  to anon, authenticated
  with check (true);

-- INSERTイベントをRealtimeで配信
alter publication supabase_realtime add table public.poses;

-- 画像保存用バケット(公開読み取り可)
insert into storage.buckets (id, name, public)
values ('pose-images', 'pose-images', true)
on conflict (id) do nothing;

create policy "pose_images_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'pose-images');

create policy "pose_images_public_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'pose-images');
```

追加機能(ひとことメッセージ・自己削除・通報)用に以下も適用済みです。

```sql
alter table public.poses add column if not exists message text;

create table if not exists public.pose_delete_tokens (
  pose_id uuid primary key references public.poses(id) on delete cascade,
  token uuid not null default gen_random_uuid()
);
alter table public.pose_delete_tokens enable row level security;
-- ポリシーなし = anon/authenticatedからは読み書き不可(security definer関数のみ)

create table if not exists public.pose_reports (
  id uuid primary key default gen_random_uuid(),
  pose_id uuid not null references public.poses(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.pose_reports enable row level security;
create policy "pose_reports_insert_all"
  on public.pose_reports for insert to anon, authenticated with check (true);

create or replace function public.create_pose(
  p_country_code text, p_country_name text, p_image_url text, p_message text default null
) returns table (id uuid, created_at timestamptz, delete_token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_created_at timestamptz; v_token uuid := gen_random_uuid();
begin
  insert into public.poses (country_code, country_name, image_url, message)
  values (p_country_code, p_country_name, p_image_url, nullif(p_message, ''))
  returning poses.id, poses.created_at into v_id, v_created_at;
  insert into public.pose_delete_tokens (pose_id, token) values (v_id, v_token);
  return query select v_id, v_created_at, v_token;
end; $$;
grant execute on function public.create_pose(text, text, text, text) to anon, authenticated;

create or replace function public.delete_own_pose(p_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_match boolean;
begin
  select exists(select 1 from public.pose_delete_tokens where pose_id = p_id and token = p_token) into v_match;
  if v_match then delete from public.poses where id = p_id; end if;
  return v_match;
end; $$;
grant execute on function public.delete_own_pose(uuid, uuid) to anon, authenticated;

create or replace function public.report_pose(p_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.pose_reports (pose_id) values (p_id);
$$;
grant execute on function public.report_pose(uuid) to anon, authenticated;
```

投稿レート制限(端末ごとに直近10分で5件まで)とモデレーション画面用に以下も適用済みです。

```sql
create table if not exists public.pose_device_ids (
  pose_id uuid primary key references public.poses(id) on delete cascade,
  device_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.pose_device_ids enable row level security;

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;
-- 管理者パスワードのハッシュを1件だけ保存(平文はDBに残さない)
insert into public.app_settings (key, value)
values ('admin_password_hash', extensions.crypt('管理者パスワード', extensions.gen_salt('bf')))
on conflict (key) do update set value = excluded.value;

-- create_poseはp_device_idを受け取りレート制限を行うよう更新済み(本文はマイグレーション履歴参照)

create or replace function public.admin_verify(p_password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hash text;
begin
  select value into v_hash from public.app_settings where key = 'admin_password_hash';
  if v_hash is null then return false; end if;
  return v_hash = extensions.crypt(p_password, v_hash);
end; $$;
grant execute on function public.admin_verify(text) to anon, authenticated;

create or replace function public.admin_list_reported_poses(p_password text)
returns table (pose_id uuid, country_name text, image_url text, message text, created_at timestamptz, report_count bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_verify(p_password) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select p.id, p.country_name, p.image_url, p.message, p.created_at, count(r.id)
    from public.poses p join public.pose_reports r on r.pose_id = p.id
    group by p.id order by count(r.id) desc, p.created_at desc;
end; $$;
grant execute on function public.admin_list_reported_poses(text) to anon, authenticated;

create or replace function public.admin_delete_pose(p_password text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.admin_verify(p_password) then raise exception 'unauthorized' using errcode = '28000'; end if;
  delete from public.poses where id = p_id;
  return true;
end; $$;
grant execute on function public.admin_delete_pose(text, uuid) to anon, authenticated;
```

不適切な投稿の削除は、`<デプロイURL>/?admin=1` の管理者パネルから、通報された投稿を確認しつつ削除できます(パスワードはSupabaseの `app_settings` テーブルにハッシュのみ保存。実際の値はチャットで受け取ってください)。Supabaseダッシュボードの Table Editor から `poses` 行を直接削除することも引き続き可能です。

## 2. 環境変数

`.env.example` を `.env` にコピーし、値を確認してください(既に `sensuikan` プロジェクトの値が入っています)。

```
VITE_SUPABASE_URL=https://ichvuncoiyffzjvbmswi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## 3. 開発

```bash
npm install
npm run dev
```

## 4. ディレクトリ構成

```
src/
  components/
    Globe.jsx          地球儀表示。国単位で投稿をまとめてピン描画(件数で大きさが変化)、
                        新着国を光らせる演出、アイドル時は自動回転+全体ビューに復帰
    CaptureModal.jsx    カメラ起動→撮影→プレビュー→国選択(位置情報から自動推定)→
                        ひとことメッセージ→確認ダイアログ→投稿
    PinDetail.jsx       ピンタップ時の拡大表示。取り消し/通報ボタン
    CountryGallery.jsx  複数投稿がある国をタップした時のサムネイル一覧
    ThumbnailStrip.jsx  画面下部の「最新投稿」横スクロール一覧
    StatsBar.jsx        投稿数・対応国数のカウンター
    QRCorner.jsx        右上のQRコード(タップで拡大、プロジェクター展示向け)
  lib/
    supabaseClient.js     Supabase初期化
    countries.js          主要国の{code, name_ja, name_en, lat, lng}対応表 + 最寄り国推定
    usePoses.js            poses取得・Realtime購読・楽観的追加をまとめたフック
    localDeleteTokens.js  自分の投稿を消すためのトークンをlocalStorageに保持(30分間有効)
    deviceId.js            投稿レート制限用の端末ID(localStorageに乱数を保持)
    sound.js               投稿成功/新着ピン時の効果音(Web Audio APIで都度合成)
  App.jsx
  main.jsx                 URLに ?admin=1 があればAdminPanelを表示
public/
  textures/   react-globe.gl用の地球テクスチャ(外部CDN非依存で同梱)
  icons/      PWAアイコン
  manifest.json
```

## 5. 追加機能

- **国別クラスタリング表示**: 同じ国に複数投稿があると1つのピンにまとまり、件数に応じてサイズが変わる。タップで一覧(CountryGallery)を表示
- **最新投稿サムネイル**: 画面下部の横スクロール一覧。タップでその国へ地球儀がフライトし、詳細を開く
- **投稿数/対応国数カウンター**: 画面上部に常時表示
- **取り消し機能**: 投稿直後のスナックバー、またはピン詳細から自分の投稿だけ削除可能(30分以内、端末のlocalStorageに保存したトークンで認証)
- **通報ボタン**: ピン詳細から通報可能。`pose_reports` テーブルに記録され、管理者が確認できる
- **ひとことメッセージ**: 投稿時に60文字までのコメントを添えられる
- **位置情報からの国自動推定**: 端末位置情報が使えれば最寄りの国を自動選択(拒否時は手動選択にフォールバック)
- **効果音**: 投稿成功時・新着ピン出現時に短いサウンドを再生(Web Audio APIで合成、外部音源なし)
- **アイドル時の自動回転復帰**: 20秒操作がなければ自動回転を再開し、全体ビューへ戻る(プロジェクター展示向け)
- **投稿レート制限**: 同一端末から直近10分で5件を超える投稿はサーバー側(DB関数)で拒否
- **管理者モデレーション画面**: `/?admin=1` にパスワードでログインし、通報された投稿だけを一覧・削除できる
- **QRコード表示**: 右上に常時表示、タップで拡大。スマホからすぐアクセスできる
- **PWA対応**: マニフェスト+アイコンで「ホーム画面に追加」が可能

## 6. 動作確認のポイント

- 地球儀が実データで表示されるか(`npm run dev` → ブラウザで確認)
- スマホ実機でカメラが起動し、撮影→プレビュー→国選択→投稿ができるか
- 投稿後、同じ端末の地球儀に即ピンが追加されるか(取り消しスナックバーも出るか)
- 別タブ/別端末でも Realtime 経由でピンが即時反映されるか(複数タブで確認)
- カメラ権限を拒否した場合に「カメラを許可してください」のフォールバックが出るか
- 同じ国に複数回投稿し、ピンが1つにまとまり件数表示・ギャラリーが機能するか
- ピン詳細から通報・取り消しが正しく動くか(取り消しは投稿した本人の端末のみ)
