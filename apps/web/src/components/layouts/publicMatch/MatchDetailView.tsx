"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useSportsFestData } from "../../../hooks/useSportsFestData";
import { useWatchlist } from "../../../hooks/useWatchlist";
import { formatStatusLabel, formatTimeLabel, getMatchStartDelayMinutes } from "../../../lib/matchUtils";
import { MapViewer, MapPin } from "../../map/MapViewer"; 

type MatchDetailViewProps = {
    matchId: number;
};

export const MatchDetailView = ({ matchId }: MatchDetailViewProps) => {
    const {
        isLoading,
        dayLabelConverter,
        getEvent,
        getLocation,
        getMatchTeamsLabel,
        getMatch,
        maps // ★ useSportsFestData から maps (マップマスタ) を取得
    } = useSportsFestData();

    const { isWatched, toggleWatchlist } = useWatchlist();
    const [isCopied, setIsCopied] = useState(false);

    // 試合データの特定とマスタのデータ解決
    const match = getMatch(matchId);

    const venue = useMemo(() => {
        return match?.locationId ? getLocation(match.locationId) : null;
    }, [match?.locationId, getLocation]);

    // ★ 会場が所属しているマップ画像のメタデータを特定
    const venueMap = useMemo(() => {
        if (!venue || !maps) return null;
        return maps.find(m => m.id === venue.mapId);
    }, [venue, maps]);

    // ★ MapViewerに渡す「その会場のピン（1箇所だけハイライト）」を生成
    const singlePin = useMemo((): MapPin[] => {
        if (!venue) return [];
        return [{
            id: venue.id,
            label: venue.name,
            xRatio: venue.xRatio,
            yRatio: venue.yRatio,
            isHighlighted: true // 詳細画面なのでプライマリカラーで目立たせる
        }];
    }, [venue]);

    if (isLoading) return <div className="py-8 text-center text-sm text-gray-500">読み込み中...</div>;
    if (!match) return <div className="py-8 text-center text-sm text-gray-500">試合データが見つかりませんでした。</div>;

    const event = getEvent(match.eventId);
    const eventName = event?.name ?? "";
    const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime));
    const timeLabel = formatTimeLabel(match.scheduledStartTime);
    const statusLabel = formatStatusLabel(match.status);
    const teamsNames = getMatchTeamsLabel(match.participants);
    const watched = isWatched(matchId);
    const headerLabel = match.name ?? `#${match.id}`;
    const delayMinutes = getMatchStartDelayMinutes(match);
    const isResultVisible = match.status === "Finished" || match.status === "Completed";
    const sortedParticipants = [...(match.participants ?? [])].sort((left, right) => {
        const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
        const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;
        return leftRank - rightRank;
    });

    // 共有処理
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/match/${matchId}`;
        const shareData = {
            title: `試合 #${matchId} 速報 - 体育大会App`,
            text: `${eventName} 「${teamsNames}」の試合状況をチェック！`,
            url: shareUrl,
        };

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log(err); }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="space-y-6 text-dark relative">
            {/* ヘッダー情報 */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toggleWatchlist(matchId)}
                        className="p-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-transform"
                        aria-label="ウォッチリストを切り替え"
                    >
                        <Image
                            src={watched ? "/icons/watchlist-on-icon.svg" : "/icons/watchlist-off-icon.svg"}
                            alt={watched ? "ウォッチリスト登録済" : "ウォッチリスト未登録"}
                            width={22}
                            height={22}
                            className="invert-75"
                        />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">試合名</span>
                        <span className="text-sm font-mono font-bold text-gray-600">{headerLabel}</span>
                    </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-dark px-3 py-1 text-xs font-bold text-white">
                    {statusLabel}
                </span>
            </div>

            {/* 対戦チーム（メイン表示） */}
            <div className="text-center py-2">
                <p className="text-xs text-gray-400">{eventName} {match.name && `・ ${match.name}`}</p>
                <h3 className="text-2xl font-bold mt-1 text-dark">{teamsNames}</h3>
            </div>

            {isResultVisible && sortedParticipants.length > 0 && (
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
                    <div className="grid grid-cols-[52px_1fr_56px] gap-2 border-b border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                        <span>順位</span>
                        <span>所属</span>
                        <span className="text-right">点</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {sortedParticipants.map((participant) => (
                            <div
                                key={participant.id}
                                className="grid grid-cols-[52px_1fr_56px] items-center gap-2 px-3 py-2 text-sm text-dark"
                            >
                                <span>{participant.rank ?? "-"}</span>
                                <span className="truncate">{getMatchTeamsLabel([participant])}</span>
                                <span className="text-right">{participant.score ?? "-"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 試合情報グリッド */}
            <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-4">
                <div>
                    <p className="text-[10px] text-gray-400">会場</p>
                    <p className="text-sm font-medium text-dark">{venue?.name || "未定"}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400">時刻</p>
                    <p className="text-sm font-medium text-dark">
                        {dayLabel} {timeLabel}
                    </p>
                    {delayMinutes !== null && (
                        <p className="mt-1 text-xs font-bold text-red-600">{delayMinutes}分遅延</p>
                    )}
                </div>
            </div>

            {/* 備考（仕様書 F-MR11） */}
            {match.note && (
                <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] text-gray-400 mb-1">備考</p>
                    <p className="text-sm text-dark leading-relaxed">{match.note}</p>
                </div>
            )}

            {/* ★ プレースホルダーから「本物のマップコンポーネント」へ差し替え */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 shadow-inner bg-gray-50">
                {venueMap ? (
                    <MapViewer
                        imageUrl={venueMap.filePath}
                        imageWidth={venueMap.width}
                        imageHeight={venueMap.height}
                        pins={singlePin}
                        currentPos={null} // 詳細画面では、迷子防止のため会場ピンの強調に集中（GPSは表示しない）
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 text-xs p-4 text-center">
                        会場マップデータが登録されていません。
                    </div>
                )}
            </div>

            {/* 共有ボタン領域 */}
            <div className="pt-2">
                <button
                    onClick={handleShare}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 text-sm font-bold text-dark transition-colors hover:bg-gray-200 active:scale-[0.98]"
                >
                    {isCopied ? (
                        <>
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            URLをコピーしました
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            この試合をシェア
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
