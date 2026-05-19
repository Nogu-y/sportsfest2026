"use client";

import React, { useState } from "react";
import { useStaffMatches, StaffMatch, MatchStatus } from "../../../hooks/useStaffMatches";

// ==========================================
// 施設トグルセレクター (マルチセレクト対応)
// ==========================================
const FacilitySelector = ({
                              facilities,
                              activeIds,
                              onToggle,
                          }: {
    facilities: any[];
    activeIds: number[];
    onToggle: (id: number) => void;
}) => (
    <div className="bg-[#4175A5] p-4 flex gap-3 overflow-x-auto shrink-0 scrollbar-none shadow-inner">
        {facilities.map((item) => {
            const isActive = activeIds.includes(item.id);
            return (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={`h-10 px-5 border rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0 text-xs font-bold ${
                        isActive
                            ? "bg-white text-[#4175A5] border-white shadow-lg"
                            : "border-white/30 text-white/70 hover:bg-white/10"
                    }`}
                >
                    {item.name}
                </button>
            );
        })}
    </div>
);

// ==========================================
// 会場ごとの垂直カラム (Figmaレイアウト)
// ==========================================
const VenueColumn = ({
                         name,
                         matches,
                         onStatusUpdate,
                     }: {
    name: string;
    matches: StaffMatch[];
    onStatusUpdate: (matchId: number, currentStatus: MatchStatus) => Promise<void>;
}) => (
    <div className="flex flex-col w-[340px] shrink-0 border-r border-gray-200 h-full bg-white/50">
        {/* カラムヘッダー */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
            <h2 className="text-sm font-black text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#4175A5] rounded-full"></span>
                {name}
                <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
          {matches.length}
        </span>
            </h2>
        </div>

        {/* 試合リスト (垂直スクロール) */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto h-full scrollbar-thin">
            {matches.map((match) => (
                <AdminMatchCard key={match.id} match={match} onStatusUpdate={onStatusUpdate} />
            ))}
            {matches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <p className="text-xs font-bold">試合なし</p>
                </div>
            )}
        </div>
    </div>
);

// ==========================================
// 試合カード (前回をベースに微調整)
// ==========================================
const AdminMatchCard = ({
                            match,
                            onStatusUpdate,
                        }: {
    match: StaffMatch;
    onStatusUpdate: (matchId: number, currentStatus: MatchStatus) => Promise<void>;
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const handleUpdate = async () => {
        setIsUpdating(true);
        await onStatusUpdate(match.id, match.status);
        setIsUpdating(false);
    };

    const isPlaying = match.status === "試合中";
    const isFinished = match.status === "終了";

    return (
        <div className={`w-full p-4 rounded-xl flex flex-col justify-between h-[160px] shadow-sm select-none border transition-all ${
            isPlaying ? "bg-[#3A6B96] text-white border-transparent" : "bg-white text-dark border-gray-200"
        }`}>
            <div className="flex justify-between items-center">
        <span className={`text-[11px] font-bold tracking-wider ${isPlaying ? "text-white" : "text-gray-500"}`}>
          {match.sport}
        </span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isPlaying ? "bg-black/20" : "bg-gray-100"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-red-400 animate-pulse" : isFinished ? "bg-gray-400" : "bg-green-500"}`}></span>
                    <span className={`text-[9px] font-bold ${isPlaying ? "text-gray-200" : "text-gray-500"}`}>{match.status}</span>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-black tracking-tight truncate mb-1">{match.teams}</h3>
                <p className={`text-[10px] font-mono ${isPlaying ? "text-blue-100" : "text-gray-400"}`}>
                    {match.day} <span className="ml-1">{match.time}</span>
                </p>
            </div>

            <div className="flex justify-between items-end mt-2">
                <button
                    onClick={handleUpdate}
                    disabled={isUpdating || isFinished}
                    className={`w-[120px] py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 ${
                        isPlaying
                            ? "bg-white text-[#3A6B96] shadow-md"
                            : isFinished
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    {isUpdating ? "..." : isPlaying ? "終了" : "開始"}
                </button>
                <span className={`text-[9px] font-mono ${isPlaying ? "text-blue-200" : "text-gray-300"}`}>
          {match.delay}
        </span>
            </div>
        </div>
    );
};

// ==========================================
// メインレイアウト
// ==========================================
export default function Staff() {
    const {
        facilities,
        activeFacilityIds,
        toggleFacilityId,
        matchesByFacility,
        handleStatusUpdate,
        isLoading,
    } = useStaffMatches();

    return (
        <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
            {/* 会場セレクター (トグル式) */}
            <FacilitySelector
                facilities={facilities}
                activeIds={activeFacilityIds}
                onToggle={toggleFacilityId}
            />

            {/* カラムレイアウト (Figma再現) */}
            <div className="flex flex-1 overflow-x-auto overflow-y-hidden bg-white shadow-inner">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 font-bold animate-pulse">
                        LOADING DASHBOARD...
                    </div>
                ) : (
                    facilities
                        .filter(f => activeFacilityIds.includes(f.id))
                        .map((facility) => (
                            <VenueColumn
                                key={facility.id}
                                name={facility.name}
                                matches={matchesByFacility.get(facility.id) || []}
                                onStatusUpdate={handleStatusUpdate}
                            />
                        ))
                )}

                {!isLoading && activeFacilityIds.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        会場を選択してください
                    </div>
                )}
            </div>
        </div>
    );
}