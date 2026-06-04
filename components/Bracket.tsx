'use client'

import { Match } from '@/types/match'

type Props = {
  matches: Match[]
}

type SideProps = {
  r32: Match[]
  r16: Match[]
  qf: Match[]
  sf: Match[]
  reverse?: boolean
}

type ColumnProps = {
  matches: Match[]
  gap: string
  highlight?: boolean
}

type MatchWithLineProps = {
  match: Match
  highlight?: boolean
}

export default function Bracket({ matches }: Props) {
  const get = (round: string) =>
    matches
      .filter((m) => m.group_name === round)
      .sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0))

  const r32 = get('Round of 32')
  const r16 = get('Round of 16')
  const qf = get('Quarter Final')
  const sf = get('Semi Final')
  const final = get('Final')[0]
  const third = get('Third Place')[0]

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-center gap-20 py-10 min-w-[1400px]">

        {/* LEFT SIDE */}
        <Side
          r32={r32.slice(0, 8)}
          r16={r16.slice(0, 4)}
          qf={qf.slice(0, 2)}
          sf={sf.slice(0, 1)}
        />

        {/* CENTER */}
        <div className="flex flex-col items-center justify-center gap-16">
          <h2 className="font-bold text-lg">Final 🏆</h2>
          {final && <MatchBox match={final} highlight />}

          <h2 className="font-bold text-lg mt-6">Third Place 🥉</h2>
          {third && <MatchBox match={third} />}
        </div>

        {/* RIGHT SIDE */}
        <Side
          r32={r32.slice(8, 16)}
          r16={r16.slice(4, 8)}
          qf={qf.slice(2, 4)}
          sf={sf.slice(1, 2)}
          reverse
        />
      </div>
    </div>
  )
}

/* ================= SIDE ================= */

function Side({ r32, r16, qf, sf, reverse = false }: SideProps) {
  return (
    <div className={`flex gap-12 ${reverse ? 'flex-row-reverse' : ''}`}>

      <Column matches={r32} gap="gap-6" />
      <Column matches={r16} gap="gap-12 mt-6" />
      <Column matches={qf} gap="gap-20 mt-16" />
      <Column matches={sf} gap="gap-32 mt-32" highlight />

    </div>
  )
}

/* ================= COLUMN ================= */

function Column({ matches, gap, highlight = false }: ColumnProps) {
  return (
    <div className={`flex flex-col ${gap} items-center`}>
      {matches.map((m) => (
        <MatchWithLine key={m.id} match={m} highlight={highlight} />
      ))}
    </div>
  )
}

/* ================= MATCH + LINE ================= */

function MatchWithLine({ match, highlight }: MatchWithLineProps) {
  return (
    <div className="flex items-center">

      <MatchBox match={match} highlight={highlight} />

      {/* SVG CONNECTOR */}
      <svg width="40" height="60" className="ml-1">
        <line
          x1="0"
          y1="30"
          x2="40"
          y2="30"
          stroke="#999"
          strokeWidth="2"
        />
      </svg>

    </div>
  )
}

/* ================= MATCH BOX ================= */

function MatchBox({ match, highlight = false }: { match: Match; highlight?: boolean }) {
  const homeWin =
    match.status === 'FINISHED' &&
    match.home_score !== null &&
    match.away_score !== null &&
    match.home_score > match.away_score

  const awayWin =
    match.status === 'FINISHED' &&
    match.home_score !== null &&
    match.away_score !== null &&
    match.away_score > match.home_score

  return (
    <div
      className={`
        bg-white border rounded p-2 w-44 text-sm shadow
        transition-all duration-300
        ${highlight ? 'border-yellow-400 shadow-lg scale-105' : ''}
      `}
    >
      <div className="flex justify-between">
        <span className={homeWin ? 'text-green-600 font-bold' : ''}>
          {match.home_team}
        </span>
        <span>{match.home_score ?? '-'}</span>
      </div>

      <div className="flex justify-between">
        <span className={awayWin ? 'text-green-600 font-bold' : ''}>
          {match.away_team}
        </span>
        <span>{match.away_score ?? '-'}</span>
      </div>
    </div>
  )
}