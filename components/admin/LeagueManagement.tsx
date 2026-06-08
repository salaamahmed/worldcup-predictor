'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type League = {
  id: string
  name: string
}

type Profile = {
  id: string
  username: string | null
}

type Member = {
  user_id: string
  username: string
}

export default function LeagueManagement() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [members, setMembers] = useState<Member[]>([])

  const [selectedLeague, setSelectedLeague] = useState('')
  const [newLeagueName, setNewLeagueName] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState('')

  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null)
  const [confirmText, setConfirmText] = useState('')

  function showStatus(msg: string) {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(null), 2500)
  }

  function askConfirm(message: string, action: () => void) {
    setConfirmText(message)
    setConfirmAction(() => action)
  }

  useEffect(() => {
    loadLeagues()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedLeague) loadMembers(selectedLeague)
  }, [selectedLeague])

  async function loadLeagues() {
    const { data } = await supabase.from('leagues').select('*')
    setLeagues(data || [])
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
    setProfiles(data || [])
  }

  async function loadMembers(leagueId: string) {
    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId)

    if (!membersData) return setMembers([])

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')

    const formatted = membersData.map((m) => ({
      user_id: m.user_id,
      username:
        profilesData?.find((p) => p.id === m.user_id)?.username || 'Unknown',
    }))

    setMembers(formatted)
  }

  async function createLeague() {
    if (!newLeagueName.trim()) return

    await supabase.from('leagues').insert({
      name: newLeagueName.trim(),
    })

    showStatus(`Created league "${newLeagueName}"`)
    setNewLeagueName('')
    loadLeagues()
  }

  async function deleteLeague(id: string) {
    const leagueName = leagues.find((l) => l.id === id)?.name

    askConfirm(`Delete league "${leagueName}"?`, async () => {
      await supabase.from('leagues').delete().eq('id', id)

      if (selectedLeague === id) {
        setSelectedLeague('')
        setMembers([])
      }

      showStatus(`Deleted league ${leagueName}`)
      loadLeagues()
      setConfirmAction(null)
    })
  }

  async function addUserToLeague() {
    if (!selectedLeague || !selectedUser) return

    const user = profiles.find((p) => p.id === selectedUser)
    const leagueName =
      leagues.find((l) => l.id === selectedLeague)?.name || ''

    const exists = members.some((m) => m.user_id === selectedUser)
    if (exists) {
      showStatus('User already in league')
      return
    }

    askConfirm(`Add ${user?.username} to ${leagueName}?`, async () => {
      await supabase.from('league_members').insert({
        league_id: selectedLeague,
        user_id: selectedUser,
      })

      showStatus(`Added ${user?.username} to ${leagueName}`)
      setSelectedUser('')
      loadMembers(selectedLeague)
      setConfirmAction(null)
    })
  }

  async function removeUser(userId: string) {
    const user = members.find((m) => m.user_id === userId)
    const leagueName =
      leagues.find((l) => l.id === selectedLeague)?.name || ''

    askConfirm(`Remove ${user?.username}?`, async () => {
      await supabase
        .from('league_members')
        .delete()
        .eq('league_id', selectedLeague)
        .eq('user_id', userId)

      showStatus(`Removed ${user?.username} from ${leagueName}`)
      loadMembers(selectedLeague)
      setConfirmAction(null)
    })
  }

  const selectedLeagueName =
    leagues.find((l) => l.id === selectedLeague)?.name || ''

  const filteredUsers = profiles
    .filter((p) =>
      p.username?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => !members.some((m) => m.user_id === p.id))

  return (
    <div className="space-y-6">

      {/* STATUS */}
      {statusMessage && (
        <div className="w-full bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded text-sm sm:text-base font-medium">
          ✓ {statusMessage}
        </div>
      )}

      {/* CONFIRM */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white p-5 rounded-lg shadow-lg space-y-4 w-full max-w-sm">
            <p className="text-gray-800 text-sm sm:text-base">{confirmText}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border rounded text-sm font-medium text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={confirmAction}
                className="px-4 py-2 bg-blue-800 text-white rounded text-sm font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LEAGUE */}
      <div className="border border-gray-400 p-4 rounded-xl bg-white shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
          Create League
        </h2>

        <div className="flex gap-2">
          <input
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            placeholder="League name"
            className="border border-gray-300 p-2.5 rounded-lg w-full text-sm text-gray-900 placeholder-gray-400"
          />

          <button
            onClick={createLeague}
            className="bg-green-800 text-white px-4 rounded-lg text-sm font-semibold active:scale-95"
          >
            Create
          </button>
        </div>
      </div>

      {/* LEAGUES */}
      <div className="border border-gray-400 p-4 rounded-xl bg-white shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
          Leagues
        </h2>

        {leagues.map((l) => (
          <div key={l.id} className="flex justify-between items-center mb-3">

            <span className="text-sm sm:text-base font-medium text-gray-900">
              {l.name}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLeague(l.id)}
                className="bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
              >
                Manage
              </button>

              <button
                onClick={() => deleteLeague(l.id)}
                className="bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MEMBERS */}
      {selectedLeague && (
        <div className="border border-gray-400 p-4 rounded-xl bg-white shadow-sm space-y-4">

          <h2 className="font-semibold text-sm sm:text-base text-gray-900">
            Managing:{' '}
            <span className="text-blue-800 font-semibold">
              {selectedLeagueName}
            </span>
          </h2>

          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-2.5 rounded-lg w-full text-sm text-gray-900 placeholder-gray-400"
          />

          <div className="flex gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="border border-gray-300 p-2.5 rounded-lg w-full text-sm text-gray-900"
            >
              <option value="">Select user</option>
              {filteredUsers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
            </select>

            <button
              onClick={addUserToLeague}
              className="bg-blue-800 text-white px-4 rounded-lg text-sm font-semibold"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex justify-between items-center border border-gray-400 p-3 rounded-lg"
              >
                <span className="text-sm sm:text-base text-gray-900 font-medium">
                  {m.username}
                </span>

                <button
                  onClick={() => removeUser(m.user_id)}
                  className="bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}