import Link from "next/link";
import {MatchDetailView} from "../../../../components/layouts/publicMatch/MatchDetailView";
import {Metadata} from "next";
import {cache} from "react";
import {api} from "../../../../lib/api/client";
import { resolvePrereqMatchOutcomeLabel } from "../../../../lib/participantSourceLabel";

type Props = {
    params: Promise<{ match_id: string }>;
};
const getServerMatchData = cache(async (matchId: number) => {
    try {
        // マスタデータを取得
        const res = await api.api.public.master.$get();
        if (!res.ok) return null;

        const masterData = await res.json();

        // 対象の試合を検索
        const match = masterData.matches.find((m) => m.id === matchId);
        if (!match) return null;

        // 種目・ブロック(フェーズ)を解決
        const block = masterData.blocks.find((b) => b.id === match.eventBlockId);
        const event = masterData.events.find((e) => e.id === block?.eventId);

        // 対戦チーム名の解決 (useSportsFestData の getMatchTeamsLabel と同じロジック)
        const teamNames = match.participants.map((p) => {
            if (p.teamId) {
                return masterData.teams.find((t) => t.id === p.teamId)?.name ?? "不明なチーム";
            }
            if (p.prereqMatchId) {
                const prereqMatch = masterData.matches.find((m) => m.id === p.prereqMatchId);
                const { sideLabel, unknownSideLabel } = resolvePrereqMatchOutcomeLabel(p)
                return prereqMatch?.name ? `${prereqMatch.name}の${sideLabel}` : unknownSideLabel
            }
            if (p.prereqBlockId) {
                const prereqBlock = masterData.blocks.find((b) => b.id === p.prereqBlockId);
                const rankText = p.prereqRank ? ` ${p.prereqRank}位` : " 代表";
                return prereqBlock?.name ? `${prereqBlock.name}${rankText}` : `未定の${rankText}`;
            }
            return "未定";
        });

        return {
            eventName: event?.name ?? "種目未定",
            phase: block?.name ?? "フェーズ未定",
            matchName: match.name ?? "",
            teamsNames: teamNames.join(' vs ') || "対戦カード未定",
        };
    } catch (error) {
        console.error("サーバーサイドでのマスタデータ取得エラー:", error);
        return null;
    }
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { match_id } = await params;
    const matchId = parseInt(match_id, 10);

    // サーバーサイドで実際のデータを取得
    const matchData = await getServerMatchData(matchId);

    // 取得に失敗した場合のフォールバック
    if (!matchData) {
        return {
            title: "試合速報 - 体育大会App",
            description: "試合の詳細情報を確認できます。",
        };
    }

    // "バスケットボール 1-1 vs 1-2 - 試合速報" のようなタイトルを生成
    const title = `${matchData.eventName} ${matchData.teamsNames} - 試合速報`;

    // "予選Aブロック ① のリアルタイム試合速報..." のような説明文
    const phaseLabel = matchData.matchName
        ? `${matchData.phase} ${matchData.matchName}`
        : matchData.phase;
    const description = `令和8年度体育大会: ${phaseLabel} のリアルタイム試合速報・結果確認ページです。`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            url: process.env.NEXT_PUBLIC_BASE_URL + `/match/${matchId}`,
            siteName: "R8体育大会App",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function MatchDetailPage({
                                                  params,
                                              }: {
    params: Promise<{ match_id: string }>;
}) {

    const {match_id} = await params;
    const matchId = parseInt(match_id, 10);

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-6">
                <Link href="/"
                      className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-dark">
                    ← 戻る
                </Link>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <MatchDetailView matchId={matchId}/>
            </div>
        </main>
    );
}
