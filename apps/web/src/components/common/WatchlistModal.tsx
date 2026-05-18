"use client";

import React, { useMemo } from "react";
import Modal from "./Modal"; // 汎用モーダル
import { MatchCardList } from "./MatchCardList"; // 試合カード一覧
import { useWatchlist } from "../../hooks/useWatchlist";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import Image from "next/image";

type WatchlistModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const WatchlistModal = ({ isOpen, onClose }: WatchlistModalProps) => {
    const { watchedIds } = useWatchlist();
    const { getMatch, isLoading } = useSportsFestData();

    // ウォッチリストのIDから実際の試合データを取得し、開始時刻順に並び替え
    const watchedMatches = useMemo(() => {
        return watchedIds
            .map((id) => getMatch(id))
            .filter((match): match is NonNullable<typeof match> => match !== undefined)
            .sort((a, b) => {
                return new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime();
            });
    }, [watchedIds, getMatch]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="ウォッチリスト"
            maxWidthClass="max-w-md" // スマホで綺麗に見えるサイズに制限
        >
            {isLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                    読み込み中...
                </div>
            ) : watchedMatches.length > 0 ? (
                <div className="py-2">
                    {/* MatchCardList を使って試合カードを縦に並べて描画 */}
                    <MatchCardList matches={watchedMatches} />
                </div>
            ) : (
                <div className="pb-12 flex flex-col items-center justify-center text-center">
                    <Image
                        src="/icons/watchlist-items-icon.svg"
                        alt="ウォッチリストのアイコン"
                        width={48}
                        height={48}
                        className={"invert-75"}
                        aria-hidden="true"
                    />
                    <p className="text-sm font-bold text-gray-500 my-1">登録されている試合はありません</p>
                    
                    <div className="text-xs text-gray-400">
                        <p className="text-xs text-gray-400 inline-block">
                            試合カード左上の
                        </p>
                        <Image
                            src={"/icons/watchlist-off-icon.svg"}
                            alt=""
                            width={8}
                            height={9}
                            className="invert-50 inline-block mx-1 mb-1"
                        />
                        <p className="text-xs text-gray-400 inline-block">
                            ボタンを押して、
                        </p>
                        <p className="text-xs text-gray-400">
                            気になる試合をウォッチリストに追加しましょう!
                        </p>
                    </div>
                </div>
            )}
        </Modal>
    );
};