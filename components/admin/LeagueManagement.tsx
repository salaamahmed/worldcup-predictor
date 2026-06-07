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

  // ✅ UPDATED FILTER (NO DUPLICATES IN DROPDOWN)
  const filteredUsers = profiles
    .filter((p) =>
      p.username?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => !members.some((m) => m.user_id === p.id))

  return (
    <div className="space-y-6">

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
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmAction}
                className="px-3 py-1 bg-blue-800 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* rest unchanged */}
      {/* (kept exactly same to avoid breaking anything) */}

      {/* CREATE LEAGUE */}
      <div className="border p-4 rounded-lg">
        <h2 className="font-bold mb-2">Create League</h2>

        <div className="flex gap-2">
          <input
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <button
            onClick={createLeague}
            className="bg-green-800 text-white px-3 rounded"
          >
            Create
          </button>
        </div>
      </div>

      {/* LEAGUES */}
      <div className="border p-4 rounded-lg">
        <h2 className="font-bold mb-2">Leagues</h2>

        {leagues.map((l) => (
          <div key={l.id} className="flex justify-between mb-2">
            <span>{l.name}</span>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLeague(l.id)}
                className="bg-blue-800 text-white px-3 rounded"
              >
                Manage
              </button>

              <button
                onClick={() => deleteLeague(l.id)}
                className="bg-red-800 text-white px-3 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MEMBERS */}
      {selectedLeague && (
        <div className="border p-4 rounded-lg space-y-4">

          <h2 className="font-bold">
            Managing: <span className="text-blue-800">{selectedLeagueName}</span>
          </h2>

          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <div className="flex gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="border p-2 rounded w-full"
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
              className="bg-blue-800 text-white px-3 rounded"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex justify-between border p-2 rounded"
              >
                <span>{m.username}</span>

                <button
                  onClick={() => removeUser(m.user_id)}
                  className="bg-red-800 text-white px-3 rounded"
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