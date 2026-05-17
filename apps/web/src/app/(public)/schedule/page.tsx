import Link from "next/link";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import MatchCard from "src/components/common/MatchCard";
import EventHero from "src/components/layouts/eventHero/EventHero";
import SubHeader from "src/components/layouts/subheader/SubHeader";

// ① import
import React from 'react'

// ② 型定義
type CourtCellProps = {
  label: string
  code: string
  active: boolean
}

type TimeSlotProps = {
  time: string
  done?: boolean
  courts: CourtCellProps[]
}

type SimpleSlotProps = {
  time: string
  label: string
  done?: boolean
}

type VenueSection =
  | { venue: string; simpleSlots: SimpleSlotProps[] }
  | { venue: string; slots: TimeSlotProps[] }

// ③ データ
const SCHEDULE: VenueSection[] = [
  {
    venue: '陸上グラウンド',
    simpleSlots: [
      { time: '08:30 - 08:50', label: '集合・出席確認', done: true },
      { time: '08:50 - 09:00', label: '開会式',         done: true },
    ],
  },
  {
    venue: '第一体育館',
    slots: [
      {
        time: '09:10 - 09:40',
        done: true,
        courts: [
          { label: 'A-1', code: '1–1\n1–2', active: false },
          { label: 'B-1', code: '2M\n2E',   active: false },
          { label: 'C-1', code: '3M\n3E',   active: false },
          { label: 'D-1', code: '4M\n4E',   active: false },
          { label: 'E-1', code: '5M\n5E',   active: false },
        ],
      },
      {
        time: '10:45 - 11:15',
        done: true,
        courts: [
          { label: 'A-1', code: '1–1\n1–2', active: false },
          { label: 'B-1', code: '2M\n2E',   active: false },
          { label: 'C-1', code: '3M\n3E',   active: false },
          { label: 'D-1', code: '4M\n4E',   active: false },
          { label: 'E-1', code: '5M\n5E',   active: false },
        ],
      },
      {
        time: '11:20 - 11:50',
        done: false,
        courts: [
          { label: 'A-1', code: '1–1\n1–2', active: true },
          { label: 'B-1', code: '2M\n2E',   active: true },
          { label: 'C-1', code: '3M\n3E',   active: true },
          { label: 'D-1', code: '4M\n4E',   active: true },
          { label: 'E-1', code: '5M\n5E',   active: true },
        ],
      },
    ],
  },
  {
    venue: '場所指定なし',
    simpleSlots: [
      { time: '12:00 - 13:05', label: '昼休憩', done: false },
    ],
  },
  {
    venue: '第一体育館',
    slots: [
      {
        time: '10:45 - 11:15',
        done: false,
        courts: [
          { label: 'A-1', code: '1–1\n1–2', active: true },
          { label: 'B-1', code: '2M\n2E',   active: true },
          { label: 'C-1', code: '3M\n3E',   active: true },
          { label: 'D-1', code: '4M\n4E',   active: true },
          { label: 'E-1', code: '5M\n5E',   active: true },
        ],
      },
      {
        time: '10:45 - 11:15',
        done: false,
        courts: [
          { label: 'A-1', code: '1–1\n1–2', active: true },
          { label: 'B-1', code: '2M\n2E',   active: true },
          { label: 'C-1', code: '3M\n3E',   active: true },
          { label: 'D-1', code: '4M\n4E',   active: true },
          { label: 'E-1', code: '5M\n5E',   active: true },
        ],
      },
      {
        time: '10:45 - 11:15',
        done: false,
        courts: [
          { label: 'A-1', code: '1–1\n1–2', active: true },
          { label: 'B-1', code: '2M\n2E',   active: true },
          { label: 'C-1', code: '3M\n3E',   active: true },
          { label: 'D-1', code: '4M\n4E',   active: true },
          { label: 'E-1', code: '5M\n5E',   active: true },
        ],
      },
    ],
  },
]

// ④ コートのマス1つ
const CourtCell = ({ label, code, active }: CourtCellProps) => (
  <div className={`rounded-lg p-2 text-center ${active ? 'bg-[#2d5a8e]' : 'bg-gray-200'}`}>
    <p className={`text-[10px] mb-1 ${active ? 'text-blue-200' : 'text-gray-400'}`}>{label}</p>
    <p className="text-sm font-semibold leading-tight whitespace-pre-line text-white">{code}</p>
  </div>
)

// ⑤ コートがある時間帯
const TimeSlot = ({ time, courts, done }: TimeSlotProps) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${done ? 'bg-gray-400 border-gray-400' : 'border-gray-400'}`} />
      <span className="text-sm text-gray-700">{time}</span>
    </div>
    <div className="pl-8">
      <div className="grid grid-cols-5 gap-2 mb-1">
        {courts.map((c) => (
          <p key={c.label} className="text-[10px] text-gray-400 text-center">{c.label}</p>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {courts.map((c, i) => <CourtCell key={i} {...c} />)}
      </div>
    </div>
  </div>
)

// ⑥ コートなしのシンプルな時間帯
const SimpleSlot = ({ time, label, done }: SimpleSlotProps) => (
  <div className="flex items-center gap-3 mb-3">
    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${done ? 'bg-gray-400 border-gray-400' : 'border-gray-400'}`} />
    <span className="text-sm text-gray-600">{time}</span>
    <span className="text-sm font-bold text-gray-800">{label}</span>
  </div>
)

// ⑦ 会場名の区切り線
const VenueDivider = ({ name }: { name: string }) => (
  <div className="flex items-center gap-3 my-6">
    <div className="flex-1 h-px bg-[#2d5a8e] opacity-30" />
    <span className="text-sm font-medium text-[#2d5a8e] whitespace-nowrap">{name}</span>
    <div className="flex-1 h-px bg-[#2d5a8e] opacity-30" />
  </div>
)

// ⑧ ページ全体
export default function Schedule() {
  return (
    <>
      {/* 種目セレクタ */}
      <SubHeader>
        <HeaderEventCardList />
      </SubHeader>

      {/* スケジュール本体 */}
      <div className="bg-white min-h-screen px-6 py-6">
        {SCHEDULE.map((section, i) => (
          <div key={i}>
            <VenueDivider name={section.venue} />
            {'simpleSlots' in section
              ? section.simpleSlots.map((s, j) => <SimpleSlot key={j} {...s} />)
              : section.slots.map((s, j) => <TimeSlot key={j} {...s} />)
            }
          </div>
        ))}
      </div>
    </>
  )
}
        

 