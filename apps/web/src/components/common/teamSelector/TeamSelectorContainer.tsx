"use client";

import { useMemo } from "react";
import { useSportsFestData} from "../../../hooks/useSportsFestData";
import TeamSelector from "./TeamSelector";

export interface Team {
    id: number;
    name: string;
}

type OrganizedTeams = Record<string, Team[]>;

interface ClassSelectorContainerProps {
    callback?: (id: string, name: string) => void;
}

export const TeamSelectorContainer = ({ callback }: ClassSelectorContainerProps) => {
    // カスタムフックからチーム一覧を取得
    const { teams } = useSportsFestData();

    // グルーピングロジックの実行とメモ化
    const groupedData = useMemo(() => {
        if (!teams || !Array.isArray(teams) || teams.length === 0) return null;

        const organizedTeams = teams.reduce((acc: OrganizedTeams, team: Team) => {
            const firstLetter = team.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(team);
            return acc;
        }, {});

        // 要素数が1つのグループは「他」にまとめる
        const otherGroups: Team[] = [];
        for (const key in organizedTeams) {
            if (organizedTeams[key].length === 1) {
                otherGroups.push(organizedTeams[key][0]);
                delete organizedTeams[key];
            }
        }

        if (otherGroups.length > 0) {
            organizedTeams["他"] = otherGroups;
        }

        return organizedTeams;
    }, [teams]); // teamsが更新された場合のみ再計算

    return <TeamSelector groupedData={groupedData} callback={callback} />;
};