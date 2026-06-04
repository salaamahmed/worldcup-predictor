'use client'

import { Match } from '@/types/match'

export default function Podium({
  finalMatch,
  thirdPlaceMatch
}: {
  finalMatch: Match | null
  thirdPlaceMatch: Match | null
}) {
  if (!finalMatch || finalMatch.status !== 'FINISHED') return null

  const champion =
    finalMatch.home_score! > finalMatch.away_score!
      ? finalMatch.home_team
      : finalMatch.away_team

  const runnerUp =
    finalMatch.home_score! > finalMatch.away_score!
      ? finalMatch.away_team
      : finalMatch.home_team

  const third =
    thirdPlaceMatch?.status === 'FINISHED'
      ? (thirdPlaceMatch.home_score! > thirdPlaceMatch.away_score!
        ? thirdPlaceMatch.home_team
        : thirdPlaceMatch.away_team)
      : 'TBD'

  return (
    <div className="bg-white p-6 rounded shadow mb-6 text-center">
      <h2 className="text-xl font-bold mb-4">🏆 Podium</h2>

      <div className="flex justify-center gap-6">
        <div>🥈 {runnerUp}</div>
        <div className="font-bold text-yellow-600">🏆 {champion}</div>
        <div>🥉 {third}</div>
      </div>
    </div>
  )
}