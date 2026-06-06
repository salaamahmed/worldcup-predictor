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
  const [message, setMessage] = useState<string | null>(null)

  function showMessage(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }

  useEffect(() => {
    loadLeagues()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedLeague) loadMembers(selectedLeague)
  }, [selectedLeague])

  // 🔥 REALTIME
  useEffect(() => {
    if (!selectedLeague) return

    const channel = supabase
      .channel('league-members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_members',
          filter: `league_id=eq.${selectedLeague}`,
        },
        () => loadMembers(selectedLeague)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
    await supabase.from('leagues').insert({ name: newLeagueName })
    setNewLeagueName('')
    loadLeagues()
  }

  async function deleteLeague(id: string) {
    if (!confirm('Delete this league?')) return
    await supabase.from('leagues').delete().eq('id', id)
    setSelectedLeague('')
    loadLeagues()
  }

  async function addUserToLeague() {
    if (!selectedLeague || !selectedUser) return

    const user = profiles.find((p) => p.id === selectedUser)
    const leagueName =
      leagues.find((l) => l.id === selectedLeague)?.name || ''

    if (!confirm(`Add ${user?.username} to ${leagueName}?`)) return

    await supabase.from('league_members').insert({
      league_id: selectedLeague,
      user_id: selectedUser,
    })

    setSelectedUser('')
    showMessage(`Added ${user?.username} to ${leagueName}`)
    loadMembers(selectedLeague)
  }

  async function removeUser(userId: string) {
    const user = members.find((m) => m.user_id === userId)

    if (!confirm(`Remove ${user?.username}?`)) return

    await supabase
      .from('league_members')
      .delete()
      .eq('league_id', selectedLeague)
      .eq('user_id', userId)

    showMessage(`Removed ${user?.username}`)
    loadMembers(selectedLeague)
  }

  const selectedLeagueName =
    leagues.find((l) => l.id === selectedLeague)?.name || ''

  const filteredUsers = profiles.filter((p) =>
    p.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {message && (
        <div className="bg-green-100 text-green-700 p-2 rounded text-sm">
          {message}
        </div>
      )}

      <div className="border p-4 rounded-lg">
        <h2 className="font-bold mb-2">Create League</h2>
        <div className="flex gap-2">
          <input
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button onClick={createLeague} className="bg-green-600 text-white px-3 rounded">
            Create
          </button>
        </div>
      </div>

      <div className="border p-4 rounded-lg">
        <h2 className="font-bold mb-2">Leagues</h2>
        {leagues.map((l) => (
          <div key={l.id} className="flex justify-between mb-2">
            <span>{l.name}</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedLeague(l.id)} className="text-blue-600">
                Manage
              </button>
              <button onClick={() => deleteLeague(l.id)} className="text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedLeague && (
        <div className="border p-4 rounded-lg space-y-4">

          <h2 className="font-bold text-lg">
            Managing: <span className="text-blue-600">{selectedLeagueName}</span>
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

            <button onClick={addUserToLeague} className="bg-blue-600 text-white px-3 rounded">
              Add
            </button>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex justify-between border p-2 rounded">
                <span>{m.username}</span>
                <button onClick={() => removeUser(m.user_id)} className="text-red-600">
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