"use client";

import type { Team } from "./TeamSelectorContainer";

interface ClassSelectorProps {
    groupedData: Record<string, Team[]> | null;
    callback?: (id: string, name: string) => void;
}

const TeamSelector = ({ groupedData, callback }: ClassSelectorProps) => {
    return (
        <div className="relative top-24 left-0 w-fit h-fit px-1 bg-gray-800 bg-opacity-50 z-50 flex flex-col items-center justify-between">
            {groupedData ? (
                <table>
                    <tbody>
                    {Object.keys(groupedData).map((key) => (
                        <tr key={key} className="border-y-[1px] border-white">
                            <td className="text-center text-2xl font-bold pr-2 text-white">
                                {key}
                            </td>
                            {groupedData[key].map((team) => (
                                <td key={team.id} className="text-center text-lg font-bold">
                                    <button
                                        type="button"
                                        className="bg-gray-200 w-18 m-1 hover:bg-gray-300 active:bg-gray-400 text-black px-4 py-2 rounded transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (callback) {
                                                callback(String(team.id), team.name);
                                            }
                                        }}
                                    >
                                        {team.name}
                                    </button>
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center text-xl font-bold text-white p-4">
                    クラス情報を読み込んでいます...
                </div>
            )}
        </div>
    );
};

export default TeamSelector;