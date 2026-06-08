'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import LeagueManagement from '@/components/admin/LeagueManagement'
import Image from 'next/image'

type Match = {
  id: string
  match_number: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string | null
  kickoff_time: string
  group_name?: string | null
  resolved_home_team?: string
  resolved_away_team?: string
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

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [activeTab, setActiveTab] = useState<'matches' | 'leagues'>('matches')
  const [showUnfinishedOnly, setShowUnfinishedOnly] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null)
  const [confirmText, setConfirmText] = useState('')
  const router = useRouter()

  function showStatus(msg: string) {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(null), 2500)
  }

  function askConfirm(message: string, action: () => void) {
    setConfirmText(message)
    setConfirmAction(() => action)
  }

  async function loadMatches() {
    const { data } = await supabase
      .from('resolved_matches')
      .select('*')
      .order('kickoff_time', { ascending: true })

    setMatches(data || [])

    const initial: Record<string, { home: string; away: string }> = {}
    data?.forEach((m) => {
      initial[m.id] = {
        home: m.home_score?.toString() || '',
        away: m.away_score?.toString() || '',
      }
    })

    setScores(initial)
    setLoading(false)
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/')
        return
      }

      await loadMatches()
    }

    init()
  }, [router])

  function handleChange(id: string, type: 'home' | 'away', value: string) {
    setScores((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: value },
    }))
  }

  async function saveMatch(m: Match) {
    const home = parseInt(scores[m.id]?.home || '0', 10)
    const away = parseInt(scores[m.id]?.away || '0', 10)

    if (isNaN(home) || isNaN(away)) {
      showStatus('Enter valid scores')
      return
    }

    askConfirm(`Save result ${home} - ${away} for Match ${m.match_number}?`, async () => {
      await supabase
        .from('matches')
        .update({ home_score: home, away_score: away, status: 'finished' })
        .eq('id', m.id)

      showStatus(`Saved Match ${m.match_number}`)

      setMatches((prev) =>
        prev.map((x) =>
          x.id === m.id ? { ...x, home_score: home, away_score: away, status: 'finished' } : x
        )
      )

      setConfirmAction(null)
    })
  }

  const displayedMatches = showUnfinishedOnly
    ? matches.filter((m) => m.status !== 'finished')
    : matches

  if (loading) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">

      {/* STATUS */}
      {statusMessage && (
        <div className="w-full bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded text-sm sm:text-base">
          ✓ {statusMessage}
        </div>
      )}

      {/* CONFIRM */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white p-5 rounded-lg shadow-lg space-y-4 w-full max-w-sm">
            <p className="text-gray-800 text-sm sm:text-base">{confirmText}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border rounded text-sm">
                Cancel
              </button>
              <button onClick={confirmAction} className="px-4 py-2 bg-blue-800 text-white rounded text-sm">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Panel ⚙️</h1>
        <span className="text-xs sm:text-sm text-gray-600">Manage system</span>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'matches'
              ? 'bg-blue-800 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Matches
        </button>

        <button
          onClick={() => setActiveTab('leagues')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'leagues'
              ? 'bg-blue-800 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Leagues
        </button>
      </div>

      {/* TOGGLE */}
      {activeTab === 'matches' && (
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            Hide Completed
          </span>
          <button
            onClick={() => setShowUnfinishedOnly((prev) => !prev)}
            className={`px-3 py-2 rounded-full text-sm font-semibold ${
              showUnfinishedOnly ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {showUnfinishedOnly ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      {/* MATCHES */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {displayedMatches.map((m) => {
            const date = new Date(m.kickoff_time)
            const home = m.resolved_home_team || m.home_team
            const away = m.resolved_away_team || m.away_team

            return (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">

                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Match {m.match_number}
                    {m.group_name && ` • ${m.group_name}`}
                  </span>

                  <span className={`px-2 py-1 rounded text-xs ${
                    m.status === 'finished'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  {date.toLocaleString([], {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ({Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1]})
                </div>

                <div className="flex items-center justify-between text-center">

                  <div className="flex flex-col items-center w-1/3 gap-1">
                    <Image src={getFlag(home)} alt={home} width={28} height={28} className="rounded-full" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">{home}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={scores[m.id]?.home || ''}
                      onChange={(e) => handleChange(m.id, 'home', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded text-center text-base"
                    />
                    <span className="text-gray-700">-</span>
                    <input
                      type="number"
                      value={scores[m.id]?.away || ''}
                      onChange={(e) => handleChange(m.id, 'away', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded text-center text-base"
                    />
                  </div>

                  <div className="flex flex-col items-center w-1/3 gap-1">
                    <Image src={getFlag(away)} alt={away} width={28} height={28} className="rounded-full" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">{away}</span>
                  </div>

                </div>

                {m.status === 'finished' && (
                  <div className="text-center text-sm text-green-700 font-semibold">
                    Final: {m.home_score} - {m.away_score}
                  </div>
                )}

                <button
                  onClick={() => saveMatch(m)}
                  className="w-full h-10 bg-blue-800 text-white rounded-lg text-sm font-semibold active:scale-95 transition"
                >
                  Save Result
                </button>

              </div>
            )
          })}

        </div>
      )}

      {/* FLOAT BUTTON */}
      <button
        onClick={() =>
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        className="
          fixed bottom-20 right-4
          z-[999]
          bg-blue-800 text-white
          w-12 h-12 rounded-full
          flex items-center justify-center
          text-xl
          shadow-lg
          active:scale-95 transition
        "
      >
        ↑
      </button>

      {activeTab === 'leagues' && <LeagueManagement />}
    </div>
    
  )
}