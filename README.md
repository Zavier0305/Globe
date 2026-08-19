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

不適切な投稿の削除は、Supabaseダッシュボードの Table Editor から `poses` 行を直接削除して運用してください(専用の承認画面は今回のスコープ外)。

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
    Globe.jsx        地球儀表示、poses一覧をピン描画、新着ピンを光らせる演出、Realtime購読
    CaptureModal.jsx  カメラ起動→撮影→プレビュー→国選択→投稿
    PinDetail.jsx     ピンタップ時の拡大表示モーダル
  lib/
    supabaseClient.js Supabase初期化
    countries.js      主要国の{code, name_ja, name_en, lat, lng}対応表
  App.jsx
  main.jsx
```

## 5. 動作確認のポイント

- 地球儀がダミー/実データで表示されるか(`npm run dev` → ブラウザで確認)
- スマホ実機でカメラが起動し、撮影→プレビュー→国選択→投稿ができるか
- 投稿後、同じ端末の地球儀に即ピンが追加されるか
- 別タブ/別端末でも Realtime 経由でピンが即時反映されるか(複数タブで確認)
- カメラ権限を拒否した場合に「カメラを許可してください」のフォールバックが出るか
