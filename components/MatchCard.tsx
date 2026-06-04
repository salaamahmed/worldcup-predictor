'use client'

import Link from 'next/link'
import Image from 'next/image'

type Match = {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  home_score?: number | null
  away_score?: number | null
}

type Prediction = {
  match_id: string
  predicted_home: number
  predicted_away: number
  user_id: string
  points?: number
}

// FLAG MAP (unchanged)
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

  // 🔥 RESULT LOGIC
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

  return (
    <Link href={`/match/${match.id}`}>
      <div
        className={`
        relative
        bg-white rounded-xl border shadow-sm p-3 sm:p-4
        hover:shadow-lg hover:-translate-y-1
        transition duration-200 cursor-pointer
        ${getResultColor()}
      `}
      >

        {/* 🔒 LOCK OVERLAY */}
        {isLocked && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center text-sm font-semibold text-gray-600">
            🔒 Locked
          </div>
        )}

        {/* TOP */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>
            {date.toLocaleDateString()} •{' '}
            {date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          <span
            className={`
            text-xs font-semibold px-2 py-1 rounded
            ${
              match.status === 'finished'
                ? 'bg-green-100 text-green-600'
                : 'bg-blue-100 text-blue-600'
            }
          `}
          >
            {match.status}
          </span>
        </div>

        {/* TEAMS */}
        <div className="flex items-center justify-between gap-2">

          <div className="flex flex-col items-center gap-1 w-1/3">
            <Image
              src={getFlag(match.home_team)}
              alt={match.home_team}
              width={32}
              height={32}
              className="rounded-full sm:w-10 sm:h-10"
            />
            <span className="text-sm font-medium text-center">
              {match.home_team}
            </span>
          </div>

          <div className="text-center">
            {match.status === 'finished' ? (
              <div className="font-bold text-lg">
                {match.home_score} - {match.away_score}
              </div>
            ) : (
              <div className="text-center">
                {match.status === 'finished' ? (
                  <div className="font-bold text-base sm:text-lg">
                    {match.home_score} - {match.away_score}
                  </div>
                ) : (
                  <div className="text-gray-400 font-bold text-sm">VS</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Image
              src={getFlag(match.away_team)}
              alt={match.away_team}
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-sm font-medium text-center">
              {match.away_team}
            </span>
          </div>

        </div>

        {/* 🔥 PREDICTION PREVIEW */}
        {prediction && (
          <div className="mt-4 text-center border-t pt-3">
            <div className="text-xs text-gray-400">
              Your prediction
            </div>

            <div className="font-semibold text-gray-800">
              {prediction.predicted_home} - {prediction.predicted_away}
            </div>

            {/* 🏆 POINTS */}
            {match.status === 'finished' && (
              <div className="text-xs mt-1 font-semibold text-blue-600">
                {prediction.points ?? 0} pts
              </div>
            )}
          </div>
        )}

      </div>
    </Link>
  )
}