"use client";

import { useState } from "react";
import { teams } from "../../../../../api/src/db/schema";
import { match } from "assert";


const facilities = [
    { id: 1, name: '第一体育館A', group: `第一体育館`, type: 'gym', icon: '🏠', activeIcon: '🏢', hasBadge: true, active: true },
    { id: 2, name: '第一体育館B', group: `第一体育館`, type: 'gym', icon: '🏠', activeIcon: '🏢', hasBadge: true, active: false },
    { id: 3, name: 'テニスコートA', group: `テニスコート`, type: 'tennis' , icon: '🎾', activeIcon: '🥎', hasBadge: false, active: false},
    { id: 4, name: 'テニスコートB', group: `テニスコート`, type: 'tennis' , icon: '🎾', activeIcon: '🥎', hasBadge: false, active: false},
    { id: 5, name: '第二体育館A', group: `第二体育館`, type: 'gym', icon: '🏠', activeIcon: '🏢', hasBadge: true, active: false },
    { id: 6, name: '第二体育館B', group: `第二体育館`, type: 'gym', icon: '🏠', activeIcon: '🏢', hasBadge: true, active: false },
];

const sampleMatches = [
    { id: 1, facilityId: 1, sport: "バドミントン", status: "開始待機中", teams: "4J vs 1-1", day:"Day1", time: "10:20~", delay: "00:01:21"},
    { id: 2, facilityId: 1, sport: "バドミントン", status: "試合中", teams: "3C vs 2E", day: "Day1", time: "11:00~", delay: "00:00:00"},
    { id: 3, facilityId: 2, sport: "バスケットボール", status: "開始待機中", teams: "1-3 vs 4M", day: "Day1", time: "10:30~", delay: "00:00:00"},
    { id: 4, facilityId: 3, sport: "ソフトテニス", status: "開始待機中", teams: "2E vs 5C", day: "Day1", time: "11:45~", delay: "00:00:00"},
];


export default  function Staff() {
    const [activeId, setActiveId] = useState(1);
    const [matches, setMatches] = useState(sampleMatches);
    const handleStartMatch = (matchId: number) => {
        setMatches(prevMatches =>
            prevMatches.map(match => {
                if (match.id !== matchId) return match;
                const nextStatus = match.status === "試合中" ? "終了" : "試合中";
                return { ...match, status: nextStatus };
            })
        )
    };;

    return (
        <><div className="bg-[#4175A5] p-4 flex gap-4 overflow-x-auto shrink-0">
            {facilities.map((item) => {
                const isActive = item.id === activeId;

                return (
                    <div key={item.id} className="relative">

                        <div onClick={() => setActiveId(item.id)} className={`w-24 h-24 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isActive
                                ? `bg-white text-[#4175A5] border-white`
                                : `border-white/50 text-white hover:bg-white/10`}`}
                        >
                            <span className="text-2xl">{isActive ? item.activeIcon : item.icon}</span>
                            <span className="text-[10px] whitespace-nowrap">{item.name}</span>
                        </div>
                    </div>
                );
            })}
        </div>
        
        <div className="p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-700">
                {facilities.find((f) => f.id === activeId)?.name ||"施設"}の試合
            </h2> 

            <div className="flex flex-wrap gap-4">
                {matches
                .filter((match) => match.facilityId === activeId)
                .map((match) => (
                    <div key={match.id} className="w-[320px] bg-[#3A6B96] text-white p-4 rounded-xl flex flex-col justify-between h-[160px] shadow-sm select-none">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium tracking-wider">{match.sport}</span>
                            <div className="flex items-center gap-1.5 bg-[#2E5A82]/50 px-2 py-0.5 rounded-full">
                            <span className={`w-2 h-2 rounded-full ${match.status === "試合中" ? "bg-red-500" : match.status === "終了" ? "bg-gray-400" : "bg-[#4ADE80]"}`}></span>
                            <span className="text-[10px] text-gray-200">{match.status}</span>
                            </div>
                        </div>

                        <div className="my-1">
                            <h3 className="text-2xl font-bold tracking-wide mb-1">{match.teams}</h3>
                            <p className="text-[11px] text-gray-300 font-mono tracking-wide">
                                {match.day} <span className="ml-1">{match.time}</span>
                            </p>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                            <button
                            onClick={() => handleStartMatch(match.id)} 
                            className="w-[140px] py-1 border border-white/60 rounded-md flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors">
                            <span className="text-xs text-white leading-none">{match.status === "試合中" ? "■  終了" : "▶"}</span>
                            </button>
                            <span className="text-[10px] text-gray-300/80 font-mono">
                            遅延 {match.delay}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div></>

    );
    
}