import Link from "next/link";
import { MatchDetailView } from "../../../../components/layouts/publicMatch/MatchDetailView";

export default async function MatchDetailPage({
                                                  params,
                                              }: {
    params: Promise<{ match_id: string }>;
}) {
    // Next.js 15 の仕様に合わせて params を await で解決
    const { match_id } = await params;
    const matchId = parseInt(match_id, 10);

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-dark">
                    ← 戻る
                </Link>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <MatchDetailView matchId={matchId} />
            </div>
        </main>
    );
}