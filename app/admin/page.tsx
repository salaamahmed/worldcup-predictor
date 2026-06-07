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

  // ✅ NEW (optional, from resolved_matches view)
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
  const [scores, setScores] = useState<
    Record<string, { home: string; away: string }>
  >({})
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
    // ✅ IMPORTANT: read from resolved_matches view
    const { data, error } = await supabase
      .from('resolved_matches')
      .select('*')
      .order('kickoff_time', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

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
      [id]: {
        ...prev[id],
        [type]: value,
      },
    }))
  }

  async function saveMatch(m: Match) {
    const home = parseInt(scores[m.id]?.home || '0', 10)
    const away = parseInt(scores[m.id]?.away || '0', 10)

    if (isNaN(home) || isNaN(away)) {
      showStatus('Enter valid scores')
      return
    }

    askConfirm(
      `Save result ${home} - ${away} for Match ${m.match_number}?`,
      async () => {
        const { data, error } = await supabase
          .from('matches')
          .update({
            home_score: home,
            away_score: away,
            status: 'finished',
          })
          .eq('id', m.id)
          .select()

        if (error || !data || data.length === 0) {
          console.error(error)
          showStatus('Not authorized')
          return
        }

        showStatus(`Saved Match ${m.match_number}`)

        setMatches((prev) =>
          prev.map((x) =>
            x.id === m.id
              ? {
                  ...x,
                  home_score: home,
                  away_score: away,
                  status: 'finished',
                }
              : x
          )
        )

        setConfirmAction(null)
      }
    )
  }

  const totalMatches = matches.length

  const displayedMatches = showUnfinishedOnly
    ? matches.filter((m) => m.status !== 'finished')
    : matches

  if (loading) return null

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {statusMessage && (
        <div className="w-full bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded">
          ✓ {statusMessage}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
            <p>{confirmText}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-3 py-1 border rounded">
                Cancel
              </button>
              <button onClick={confirmAction} className="px-3 py-1 bg-blue-600 text-white rounded">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel ⚙️</h1>
        <span className="text-sm text-gray-500">Manage system</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-lg font-bold">{totalMatches}</div>
          <div className="text-xs text-gray-500">Matches</div>
        </div>

        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-lg font-bold">⚙️</div>
          <div className="text-xs text-gray-500">Admin Active</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('matches')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'matches' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Match Management
        </button>

        <button onClick={() => setActiveTab('leagues')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'leagues' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          League Management
        </button>
      </div>

      {activeTab === 'matches' && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold">Hide Completed Matches</span>
          <button
            onClick={() => setShowUnfinishedOnly((prev) => !prev)}
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              showUnfinishedOnly ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {showUnfinishedOnly ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {displayedMatches.map((m) => {
            const date = new Date(m.kickoff_time)

            // ✅ USE RESOLVED TEAMS
            const home = m.resolved_home_team || m.home_team
            const away = m.resolved_away_team || m.away_team

            return (
              <div key={m.id} className="bg-white rounded-xl border shadow-sm p-4 space-y-3">

                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    Match {m.match_number}
                    {m.group_name && ` • ${m.group_name}`}
                  </span>

                  <span className={`px-2 py-1 rounded text-xs ${
                    m.status === 'finished'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <div className="text-xs text-gray-400">
                  {date.toLocaleDateString()} •{' '}
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex items-center justify-between text-center">

                  <div className="flex flex-col items-center w-1/3 gap-1">
                    <Image src={getFlag(home)} alt={home} width={28} height={28} className="rounded-full" />
                    <span className="text-xs font-semibold">{home}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={scores[m.id]?.home || ''}
                      onChange={(e) => handleChange(m.id, 'home', e.target.value)}
                      className="w-12 border rounded text-center"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={scores[m.id]?.away || ''}
                      onChange={(e) => handleChange(m.id, 'away', e.target.value)}
                      className="w-12 border rounded text-center"
                    />
                  </div>

                  <div className="flex flex-col items-center w-1/3 gap-1">
                    <Image src={getFlag(away)} alt={away} width={28} height={28} className="rounded-full" />
                    <span className="text-xs font-semibold">{away}</span>
                  </div>

                </div>

                {m.status === 'finished' && (
                  <div className="text-center text-sm text-green-600 font-semibold">
                    Final: {m.home_score} - {m.away_score}
                  </div>
                )}

                <button
                  onClick={() => saveMatch(m)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Result
                </button>

              </div>
            )
          })}

        </div>
      )}

      {activeTab === 'leagues' && <LeagueManagement />}
    </div>
  )
}