"use client";

import { useState } from "react";
import Image from "next/image";
import { MatchWithEventIdType } from "../../types/SportsFestDataTypes";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { formatStatusLabel, formatTimeLabel } from "../../lib/matchUtils";
import { ProgressBar } from "./ProgressBar";
import Modal from "./Modal"; // 前回作成した汎用モーダル

type MatchCardProps = {
    match: MatchWithEventIdType;
    showVenueLabel?: boolean;
    showStatusLabel?: boolean;
    showProgress?: boolean;
    isWatchlisted?: boolean;
    className?: string;
};

const MatchCard = ({
                       match,
                       showVenueLabel = true,
                       showStatusLabel = true,
                       showProgress = true,
                       isWatchlisted = false,
                       className = "",
                   }: MatchCardProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isLoading, dayLabelConverter, getEvent, getLocation, getMatchTeamsLabel } = useSportsFestData();

    if (isLoading) return null;

    // データ解決
    const event = getEvent(match.eventId);
    const color = event?.color ?? "#FFFFFF";
    const eventName = event?.name ?? "";
    const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime));
    const timeLabel = formatTimeLabel(match.scheduledStartTime);
    const venue = match.locationId ? getLocation(match.locationId) : null;
    const statusLabel = formatStatusLabel(match.status);
    const teamsNames = getMatchTeamsLabel(match.participants);

    return (
        <>
            <article
                role="button"
                tabIndex={0}
                className={`flex h-24 w-full cursor-pointer flex-col justify-center gap-1 rounded-[10px] px-4 py-2 text-white shadow-[0_0_2px_rgba(0,0,0,0.08)] transition-transform active:scale-[0.98] ${className}`}
                style={{ backgroundColor: color }}
                onClick={() => setIsModalOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
            >
                <div className="flex h-[17px] w-full items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Image
                            src={isWatchlisted ? "/icons/watchlist-on-icon.svg" : "/icons/watchlist-off-icon.svg"}
                            alt=""
                            width={10}
                            height={13}
                            className="h-[13px] w-[10px] shrink-0"
                            onClick={(e) => {
                                e.stopPropagation(); // ウォッチリスト操作時にモーダルが開くのを防ぐ
                                /* TODO: ウォッチリスト追加ロジック */
                            }}
                        />
                        <p className="truncate text-[8px] font-medium leading-normal">{eventName}</p>
                    </div>
                    {showVenueLabel && venue?.name && (
                        <p className="min-w-0 flex-1 truncate text-right text-[8px] leading-normal">{venue.name}</p>
                    )}
                </div>

                <p className="truncate text-base leading-normal font-bold">{teamsNames}</p>

                <div className="flex w-full items-center justify-between gap-3 text-white">
                    <p className="min-w-0 truncate text-[10px] leading-normal">
                        <span>{dayLabel}</span>
                        <span className="ml-2">{timeLabel}</span>
                    </p>
                    {showStatusLabel && statusLabel && (
                        <p className="shrink-0 text-right text-[8px] leading-normal">{statusLabel}</p>
                    )}
                </div>

                {showProgress && match.status === "Playing" && (
                    <ProgressBar
                        scheduledStartTime={match.scheduledStartTime}
                        scheduledEndTime={match.scheduledEndTime}
                        startedAt={match.startedAt}
                    />
                )}
            </article>

            {/* 試合詳細モーダル */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${eventName}`}
            >
                <div className="space-y-6">
                    {/* ヘッダー: 試合IDとステータス */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-500">#{match.id}</span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {statusLabel}
            </span>
                    </div>

                    {/* 対戦チーム（メイン表示） */}
                    <div className="text-center py-4">
                        <h3 className="text-2xl font-bold text-dark">{teamsNames}</h3>
                    </div>

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
                        </div>
                    </div>

                    {/* 備考（仕様書 F-MR11） */}
                    {match.note && (
                        <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400 mb-1">備考</p>
                            <p className="text-sm text-dark leading-relaxed">{match.note}</p>
                        </div>
                    )}

                    {/* 地図表示（仕様書 2.1.6 プレースホルダ） */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
                        {/* ここに将来的に会場マップのピン刺しコンポーネントを配置 */}
                        <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                            会場マップ（開発中）
                        </div>
                    </div>

                    {/* ボタン類 */}
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full rounded-md bg-dark py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    >
                        閉じる
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default MatchCard;