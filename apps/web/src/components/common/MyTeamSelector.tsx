"use client";

import React from "react";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { useMyTeam } from "../../hooks/useMyTeam";

export const MyTeamSelector = () => {
    const { teams, isLoading } = useSportsFestData();
    const { myTeamId, saveMyTeam, isLoaded } = useMyTeam();

    // マスタデータ読み込み中、またはLocalStorage読み込み中はスケルトンを表示
    if (isLoading || !isLoaded) {
        return (
            <div className="w-full animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-4 h-28"></div>
        );
    }

    // チームを名前順などでソートしておく
    const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    return (
        <div className="w-full rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-dark mb-1 flex items-center gap-1.5">
                自クラス (応援チーム) の設定
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                クラスを登録すると、対戦表やタイムライン上で自分のクラスの試合がハイライトされ、見つけやすくなります。
            </p>

            <div className="relative">
                <select
                    value={myTeamId ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        const teamId = val ? Number.parseInt(val, 10) : null;
                        saveMyTeam(Number.isInteger(teamId) ? teamId : null);
                    }}
                    className="w-full appearance-none rounded-sm border border-gray-300 bg-gray-50 p-3 pr-10 text-sm font-bold text-dark transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">未選択</option>
                    {sortedTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.name}
                        </option>
                    ))}
                </select>
                {/* セレクトボックスの右側アイコン */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
