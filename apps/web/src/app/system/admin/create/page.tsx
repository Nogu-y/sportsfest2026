import Link from 'next/link'

const links = [
  {
    href: '/system/admin/create/events',
    title: 'イベント入力補助',
    description: 'イベント定義を UI で積み上げ、JSON / CSV として出力します。',
  },
  {
    href: '/system/admin/create/matches',
    title: '試合計画入力補助',
    description: '試合計画を UI で積み上げ、Import / 編集 / プレビュー / 出力を行います。',
  },
  {
    href: '/system/admin/create/event-blocks',
    title: 'ブロック入力補助',
    description: 'イベントブロックを UI で積み上げ、参照候補選択または手入力で出力します。',
  },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">System Admin / Create Helper</p>
          <h1 className="mt-2 text-2xl font-semibold">入力補助ページ</h1>
          <p className="mt-2 text-sm text-slate-600">
            手入力が重いマスタ向けに、UI で積み上げてファイル出力する補助ページです。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
            >
              <h2 className="text-lg font-semibold">{link.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{link.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
