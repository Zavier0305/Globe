export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface px-4 py-8 text-inkmuted">
      <div className="mx-auto max-w-2xl">
        <a href="/" className="mb-6 inline-block text-sm text-accent">
          ← 地球儀にもどる
        </a>

        <h1 className="mb-6 text-2xl font-bold text-ink">
          利用規約・プライバシーポリシー
        </h1>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold text-accent">利用規約</h2>

          <h3 className="mb-1 mt-4 font-semibold text-ink">1. 本規約について</h3>
          <p className="text-sm leading-relaxed">
            本規約は、「世界のポーズ地球儀」(以下「本サービス」)の利用条件を定めるものです。本サービスを利用した時点で、本規約に同意したものとみなします。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">2. サービス内容</h3>
          <p className="text-sm leading-relaxed">
            本サービスは、利用者が撮影した写真と選択した国情報を投稿し、地球儀上にピンとして表示するサービスです。投稿された写真は、本サービスにアクセスできる全ての利用者に公開されます。アカウント登録は不要です。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">3. 未成年者の利用について</h3>
          <p className="text-sm leading-relaxed">
            未成年の方が投稿する場合は、あらかじめ保護者等の同意を得たうえでご利用ください。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">4. 禁止事項</h3>
          <ul className="ml-5 list-disc text-sm leading-relaxed">
            <li>自分以外の人物が写った写真を、本人の同意なく投稿すること</li>
            <li>他者を誹謗中傷、脅迫、差別する内容を含む写真の投稿</li>
            <li>わいせつ、暴力的、その他公序良俗に反する写真の投稿</li>
            <li>他者の著作権・肖像権その他の権利を侵害する行為</li>
            <li>本サービスの運営を妨げる行為(過度な連続投稿、システムへの攻撃など)</li>
            <li>法令に違反する行為</li>
          </ul>

          <h3 className="mb-1 mt-4 font-semibold text-ink">5. 投稿の削除</h3>
          <p className="text-sm leading-relaxed">
            投稿者本人は、投稿から一定時間内であれば自分の投稿を削除できます。また、他の利用者による通報や運営による判断により、禁止事項に該当すると判断された投稿は予告なく削除される場合があります。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">6. 免責事項</h3>
          <p className="text-sm leading-relaxed">
            本サービスの利用により生じた損害について、運営者は故意または重過失がある場合を除き責任を負いません。本サービスは予告なく内容の変更、中断、終了する場合があります。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">7. 規約の変更</h3>
          <p className="text-sm leading-relaxed">
            本規約は必要に応じて変更されることがあります。変更後の規約は、本ページに掲載した時点から効力を持つものとします。
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-accent">プライバシーポリシー</h2>

          <h3 className="mb-1 mt-4 font-semibold text-ink">1. 取得する情報</h3>
          <ul className="ml-5 list-disc text-sm leading-relaxed">
            <li>投稿された写真画像</li>
            <li>選択された国の情報</li>
            <li>投稿日時</li>
            <li>投稿の取り消しに使う識別情報、連続投稿を防ぐための端末識別情報(いずれも氏名や連絡先と紐付かない乱数で、お使いの端末にのみ保存されます)</li>
            <li>位置情報(国の自動選択に利用する場合のみ。端末の設定で許可した場合に限り取得し、サーバーには詳細な位置情報自体は保存しません)</li>
          </ul>

          <h3 className="mb-1 mt-4 font-semibold text-ink">2. 利用目的</h3>
          <p className="text-sm leading-relaxed">
            取得した情報は、本サービスの提供(地球儀への表示、投稿の管理、不適切投稿への対応)のためにのみ利用します。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">3. 第三者への提供</h3>
          <p className="text-sm leading-relaxed">
            投稿された写真・国情報は、本サービスの性質上、本サービスにアクセスした全ての利用者から閲覧可能です。これ以外の目的で、取得した情報を第三者に販売・提供することはありません。なお、本サービスはSupabase・Vercel等の外部インフラ事業者上で稼働しており、これらの事業者にはサービス提供に必要な範囲でデータの保管を委託しています。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">4. 保存期間・削除</h3>
          <p className="text-sm leading-relaxed">
            投稿は、投稿者本人による削除、または運営による削除まで保存されます。削除を希望する場合は、投稿から一定時間内であればアプリ内の「取り消す」機能をご利用ください。時間が経過して削除できない場合や、他者の投稿に関するご相談は、運営までお問い合わせください。
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-ink">5. お問い合わせ</h3>
          <p className="text-sm leading-relaxed">
            本規約・プライバシーポリシーに関するお問い合わせは、本サービスの運営者までご連絡ください。
          </p>
        </section>
      </div>
    </div>
  )
}
