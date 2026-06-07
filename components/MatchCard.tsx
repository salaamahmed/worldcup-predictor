'use client'

import Link from 'next/link'
import Image from 'next/image'

type Match = {
  id: string
  match_number: number
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  home_score?: number | null
  away_score?: number | null
  group_name?: string | null
}

type Prediction = {
  match_id: string
  predicted_home: number
  predicted_away: number
  user_id: string
  points?: number
}

function getFlag(team: string) {
  const map: Record<string, string> = {
    Mexico: 'mx',
    Canada: 'ca',
    USA: 'us',
    Brazil: 'br',
    Argentina: 'ar',
    Uruguay: 'uy',
    Paraguay: 'py',
    Chile: 'cl',
    Colombia: 'co',
    Peru: 'pe',
    Haiti: 'ht',

    'South Africa': 'za',
    Morocco: 'ma',
    Tunisia: 'tn',
    Senegal: 'sn',
    Ghana: 'gh',
    Nigeria: 'ng',

    'Korea Republic': 'kr',
    Japan: 'jp',
    China: 'cn',
    Iran: 'ir',
    Qatar: 'qa',
    'Saudi Arabia': 'sa',
    Australia: 'au',

    Czechia: 'cz',
    Germany: 'de',
    France: 'fr',
    Spain: 'es',
    Italy: 'it',
    Netherlands: 'nl',
    Belgium: 'be',
    Portugal: 'pt',
    Switzerland: 'ch',
    Croatia: 'hr',
    'Bosnia and Herzegovina': 'ba',
    Scotland: 'gb-sct',
    Türkiye: 'tr',

    Curaçao: 'cw',
    "Côte d'Ivoire": 'ci',
    Ecuador: 'ec',
    Sweden: 'se',
    Egypt: 'eg',
    'Cabo Verde': 'cv',
    'IR Iran': 'ir',
    'New Zealand': 'nz',
    Iraq: 'iq',
    Norway: 'no',
    Algeria: 'dz',
    Austria: 'at',
    Jordan: 'jo',
    'Congo DR': 'cg',
    England: 'gb-eng',
    Panama: 'pa',
    Uzbekistan: 'uz',
  }

  return `https://flagcdn.com/w40/${map[team] || 'un'}.png`
}

export default function MatchCard({
  match,
  prediction,
}: {
  match: Match
  prediction?: Prediction
}) {
  const date = new Date(match.kickoff_time)

  const isLocked =
    match.status === 'finished' ||
    new Date(match.kickoff_time) <= new Date()

  function getResultColor() {
    if (!prediction || match.status !== 'finished') return ''

    const exact =
      prediction.predicted_home === match.home_score &&
      prediction.predicted_away === match.away_score

    const correctResult =
      (prediction.predicted_home > prediction.predicted_away &&
        match.home_score! > match.away_score!) ||
      (prediction.predicted_home < prediction.predicted_away &&
        match.home_score! < match.away_score!) ||
      (prediction.predicted_home === prediction.predicted_away &&
        match.home_score === match.away_score)

    if (exact) return 'border-green-500 bg-green-50'
    if (correctResult) return 'border-yellow-500 bg-yellow-50'
    return 'border-red-500 bg-red-50'
  }

  const baseClass = `
    relative
    bg-white rounded-xl border shadow-sm
    p-3 sm:p-4
    active:scale-[0.98] hover:shadow-md cursor-pointer transition
    ${getResultColor()}
  `

  return (
    <Link href={`/match/${match.id}`}>
      <div className={baseClass}>

        {/* 🔒 LOCK OVERLAY (visual only now) */}
        {isLocked && (
          <div className="
            absolute inset-0 rounded-xl
            bg-white/60 backdrop-blur-[1px]
            flex items-center justify-center
            text-sm font-semibold text-gray-800
            z-10
          ">
            🔒 Locked
          </div>
        )}

        {/* TOP INFO */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            Match {match.match_number}
            {match.group_name && ` • ${match.group_name}`}
          </span>

          <span
            className={`px-2 py-1 rounded text-xs ${
              match.status === 'finished'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {match.status}
          </span>
        </div>

        <div className="flex justify-between text-[11px] text-gray-500 mb-2">
          <span>
            {date.toLocaleDateString()} •{' '}
            {date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

        </div>

        {/* TEAMS */}
        <div className="flex items-center justify-between">

          {/* HOME */}
          <div className="flex flex-col items-center w-1/3 gap-1">
            <Image
              src={getFlag(match.home_team)}
              alt={match.home_team}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xs font-semibold text-gray-900 text-center">
              {match.home_team}
            </span>
          </div>

          {/* SCORE / VS */}
          <div className="text-center">
            {match.status === 'finished' ? (
              <div className="font-bold text-lg sm:text-xl text-gray-900">
                {match.home_score} - {match.away_score}
              </div>
            ) : (
              <div className="text-gray-400 font-bold text-xs sm:text-sm">
                VS
              </div>
            )}
          </div>

          {/* AWAY */}
          <div className="flex flex-col items-center w-1/3 gap-1">
            <Image
              src={getFlag(match.away_team)}
              alt={match.away_team}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xs font-semibold text-gray-900 text-center">
              {match.away_team}
            </span>
          </div>

        </div>

        {/* PREDICTION */}
        {prediction && (
          <div className="mt-3 pt-2 border-t text-center">
            <div className="text-xs text-gray-500 mb-1">
              Your prediction
            </div>

            <div className="font-semibold text-sm sm:text-sm text-gray-500">
              {prediction.predicted_home} - {prediction.predicted_away}
            </div>

            {match.status === 'finished' && (
              <div className="text-[11px] mt-1 sm:text-sm font-semibold text-blue-800">
                {prediction.points ?? 0} pts
              </div>
            )}
          </div>
        )}

      </div>
    </Link>
  )
}