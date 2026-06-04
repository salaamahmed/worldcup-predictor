'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
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
}

type Prediction = {
  id: string
  predicted_home: number
  predicted_away: number
  username: string | null
  points?: number
  user_id?: string
}

function getFlag(team: string) {
  const map: Record<string, string> = {
    // Americas
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

    // Africa
    'South Africa': 'za',
    Morocco: 'ma',
    Tunisia: 'tn',
    Senegal: 'sn',
    Ghana: 'gh',
    Nigeria: 'ng',

    // Asia
    'Korea Republic': 'kr',
    Japan: 'jp',
    China: 'cn',
    Iran: 'ir',
    Qatar: 'qa',
    'Saudi Arabia': 'sa',
    Australia: 'au',

    // Europe
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

    //
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

export default function MatchDetails() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [match, setMatch] = useState<Match | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!id) return

    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id || null
      setUserId(uid)

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      setMatch(matchData)

      const { data: preds } = await supabase
        .from('predictions_with_users')
        .select('*')
        .eq('match_id', id)

      const sorted = (preds || []).sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0)
      )

      setPredictions(sorted)

      const myPred = sorted.find((p) => p.user_id === uid)
      if (myPred) {
        setHome(String(myPred.predicted_home))
        setAway(String(myPred.predicted_away))
      }
    }

    load()
  }, [id])

  // countdown
  useEffect(() => {
    if (!match?.kickoff_time) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const kickoff = new Date(match.kickoff_time).getTime()
      const diff = kickoff - now

      if (diff <= 0) {
        setTimeLeft('🔒 Locked')
        clearInterval(interval)
        return
      }

      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff / (1000 * 60)) % 60)
      const s = Math.floor((diff / 1000) % 60)

      setTimeLeft(`${h}h ${m}m ${s}s`)
    }, 1000)

    return () => clearInterval(interval)
  }, [match])

  const existing = predictions.find((p) => p.user_id === userId)

  const isLocked =
    match ? new Date(match.kickoff_time) <= new Date() : false

  async function handleSubmit() {
    if (!home || !away || !userId) return

    setSaving(true)

    const { error } = await supabase
      .from('predictions')
      .upsert(
        {
          match_id: id,
          user_id: userId,
          predicted_home: Number(home),
          predicted_away: Number(away),
        },
        {
          onConflict: 'user_id,match_id',
        }
      )

    if (error) {
      console.error(error)
      setSaving(false)
      return
    }

    setToast(existing ? 'Updated ✅' : 'Submitted ✅')

    const { data } = await supabase
      .from('predictions_with_users')
      .select('*')
      .eq('match_id', id)

    setPredictions(
      (data || []).sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    )

    setSaving(false)
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">

      {/* 🔥 MATCH HEADER */}
      {match && (
        <div className="bg-white rounded-2xl shadow p-6">

          <div className="flex items-center justify-between">

            {/* HOME */}
            <div className="flex flex-col items-center w-1/3">
              <Image src={getFlag(match.home_team)} alt="" width={48} height={48} className="rounded-full" />
              <span className="mt-2 font-semibold text-center">{match.home_team}</span>
            </div>

            {/* CENTER */}
            <div className="text-center">
              {match.status === 'finished' ? (
                <div className="text-2xl font-bold">
                  {match.home_score} - {match.away_score}
                </div>
              ) : (
                <div className="text-gray-400 font-bold">VS</div>
              )}

              <div className="text-xs text-orange-500 mt-1">
                {timeLeft}
              </div>
            </div>

            {/* AWAY */}
            <div className="flex flex-col items-center w-1/3">
              <Image src={getFlag(match.away_team)} alt="" width={48} height={48} className="rounded-full" />
              <span className="mt-2 font-semibold text-center">{match.away_team}</span>
            </div>

          </div>
        </div>
      )}

      {/* 🔥 INPUT CARD */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">

        <h2 className="font-semibold mb-4 text-center">
          {existing ? 'Update Prediction' : 'Submit Prediction'}
        </h2>

        <div className="flex items-center justify-center gap-3 mb-4">
          <input
            value={home}
            onChange={(e) => setHome(e.target.value)}
            type="number"
            className="w-20 p-2 border rounded-lg text-center text-lg"
          />
          <span className="font-bold">-</span>
          <input
            value={away}
            onChange={(e) => setAway(e.target.value)}
            type="number"
            className="w-20 p-2 border rounded-lg text-center text-lg"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || isLocked}
          className={`w-full py-3 rounded-xl text-white font-medium transition
            ${
              isLocked
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isLocked
            ? 'Prediction locked'
            : saving
            ? 'Saving...'
            : existing
            ? 'Update Prediction'
            : 'Submit Prediction'}
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow">
          {toast}
        </div>
      )}

      {/* 🔥 PREDICTIONS */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Predictions</h2>

        <div className="space-y-3">
          {predictions.map((p, i) => {
            const isMine = p.user_id === userId

            return (
              <div
                key={p.id}
                className={`flex justify-between items-center p-4 rounded-xl border bg-white
                  ${isMine ? 'border-green-500 bg-green-50' : ''}`}
              >
                <div>
                  <div className="font-medium">
                    #{i + 1} {p.username}
                  </div>

                  {isMine && (
                    <div className="text-xs text-green-600">
                      Your prediction
                    </div>
                  )}
                </div>

                <div className="font-bold text-lg">
                  {p.predicted_home} - {p.predicted_away}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}