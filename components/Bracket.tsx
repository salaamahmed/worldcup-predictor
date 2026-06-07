'use client'

import { Match } from '@/types/match'

type Props = {
  matches: Match[]
}

/* ================= HELPERS ================= */

function getTeam(match: Match, side: 'home' | 'away') {
  return side === 'home'
    ? match.resolved_home_team ?? match.home_team
    : match.resolved_away_team ?? match.away_team
}

function isWinner(match: Match, side: 'home' | 'away') {
  if (match.status?.toLowerCase() !== 'finished') return false

  if (side === 'home') {
    return (match.home_score ?? 0) > (match.away_score ?? 0)
  }

  return (match.away_score ?? 0) > (match.home_score ?? 0)
}

/* ================= MAIN ================= */

export default function Bracket({ matches }: Props) {
  const get = (round: string) =>
    matches
      .filter((m) => m.group_name === round)
      .sort((a, b) => (a.bracket_slot || 0) - (b.bracket_slot || 0))

  const r16 = get('Round of 16')
  const qf = get('Quarter Final')
  const sf = get('Semi Final')
  const final = get('Final')[0]
  const third = get('Third Place')[0]

  return (
    <div className="overflow-x-auto py-10">
      <div className="min-w-[1200px] flex justify-center gap-16">

        {/* LEFT SIDE */}
        <BracketSide
          r16={r16.slice(0, 4)}
          qf={qf.slice(0, 2)}
          sf={sf.slice(0, 1)}
        />

        {/* CENTER */}
        <div className="flex flex-col items-center justify-center gap-10">
          <RoundTitle title="Final 🏆" />
          {final && <MatchCard match={final} highlight />}

          <RoundTitle title="Third Place 🥉" />
          {third && <MatchCard match={third} />}
        </div>

        {/* RIGHT SIDE */}
        <BracketSide
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

type SideProps = {
  r16: Match[]
  qf: Match[]
  sf: Match[]
  reverse?: boolean
}

function BracketSide({ r16, qf, sf, reverse = false }: SideProps) {
  return (
    <div className={`flex gap-10 ${reverse ? 'flex-row-reverse' : ''}`}>
      <RoundColumn matches={r16} gap="gap-6" />
      <RoundColumn matches={qf} gap="gap-16 mt-6" />
      <RoundColumn matches={sf} gap="gap-32 mt-20" highlight />
    </div>
  )
}

/* ================= COLUMN ================= */

type ColumnProps = {
  matches: Match[]
  gap: string
  highlight?: boolean
}

function RoundColumn({ matches, gap, highlight = false }: ColumnProps) {
  return (
    <div className={`flex flex-col ${gap}`}>
      {matches.map((m) => (
        <MatchWithConnector key={m.id} match={m} highlight={highlight} />
      ))}
    </div>
  )
}

/* ================= MATCH + CONNECTOR ================= */

type MatchWithConnectorProps = {
  match: Match
  highlight?: boolean
}

function MatchWithConnector({ match, highlight }: MatchWithConnectorProps) {
  return (
    <div className="flex items-center">
      <MatchCard match={match} highlight={highlight} />
      <div className="w-8 h-[2px] bg-gray-400 ml-1" />
    </div>
  )
}

/* ================= MATCH CARD ================= */

type MatchCardProps = {
  match: Match
  highlight?: boolean
}

function MatchCard({ match, highlight = false }: MatchCardProps) {
  return (
    <div
      className={`
        w-48 bg-white border rounded-lg p-2 text-sm shadow
        transition
        ${highlight ? 'border-yellow-400 shadow-lg scale-105' : ''}
      `}
    >
      <TeamRow match={match} side="home" />
      <TeamRow match={match} side="away" />
    </div>
  )
}

/* ================= TEAM ROW ================= */

type TeamRowProps = {
  match: Match
  side: 'home' | 'away'
}

function TeamRow({ match, side }: TeamRowProps) {
  const team = getTeam(match, side)
  const score = side === 'home' ? match.home_score : match.away_score
  const win = isWinner(match, side)

  return (
    <div className="flex justify-between">
      <span className={win ? 'text-green-600 font-bold' : ''}>
        {team}
      </span>
      <span>{score ?? '-'}</span>
    </div>
  )
}

/* ================= TITLE ================= */

function RoundTitle({ title }: { title: string }) {
  return (
    <div className="text-center font-bold text-lg text-gray-800">
      {title}
    </div>
  )
}