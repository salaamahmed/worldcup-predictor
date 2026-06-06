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

  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [newLeagueName, setNewLeagueName] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState('')

  // 🔥 LOAD DATA
  useEffect(() => {
    loadLeagues()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedLeague) {
      loadMembers(selectedLeague)
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
      .order('username')

    setProfiles(data || [])
  }

  async function loadMembers(leagueId: string) {
    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId)

    if (!membersData) {
      setMembers([])
      return
    }

    const userIds = membersData.map((m) => m.user_id)

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const formatted: Member[] =
      membersData.map((m) => {
        const user = profilesData?.find((p) => p.id === m.user_id)

        return {
          user_id: m.user_id,
          username: user?.username ?? 'Unknown',
        }
      })

    setMembers(formatted)
  }
  
  // ✅ CREATE LEAGUE
  async function createLeague() {
    if (!newLeagueName.trim()) return

    await supabase.from('leagues').insert({
      name: newLeagueName.trim(),
    })

    setNewLeagueName('')
    await loadLeagues()
  }

  // ❌ DELETE LEAGUE
  async function deleteLeague(id: string) {
    if (!confirm('Delete this league?')) return

    await supabase.from('leagues').delete().eq('id', id)

    if (selectedLeague === id) {
      setSelectedLeague('')
      setMembers([])
    }

    await loadLeagues()
  }

  // ➕ ADD USER
  async function addUserToLeague() {
    if (!selectedLeague || !selectedUser) return

    // 🚫 PREVENT DUPLICATE
    const exists = members.some((m) => m.user_id === selectedUser)
    if (exists) {
      alert('User already in league')
      return
    }

    await supabase.from('league_members').insert({
      league_id: selectedLeague,
      user_id: selectedUser,
    })

    setSelectedUser('')
    await loadMembers(selectedLeague)
  }

  // ➖ REMOVE USER
  async function removeUser(userId: string) {
    await supabase
      .from('league_members')
      .delete()
      .eq('league_id', selectedLeague)
      .eq('user_id', userId)

    await loadMembers(selectedLeague)
  }

  // 🔍 SEARCH FILTER
  const filteredUsers = profiles.filter((p) =>
    p.username?.toLowerCase().includes(search.toLowerCase())
  )

  // selected league details
  const selectedLeagueName =
    leagues.find((l) => l.id === selectedLeague)?.name || ''

  return (
    <div className="space-y-6">

      {/* CREATE LEAGUE */}
      <div className="border p-4 rounded-lg">
        <h2 className="font-bold mb-2">Create League</h2>

        <div className="flex gap-2">
          <input
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            placeholder="League name"
            className="border p-2 rounded w-full"
          />

          <button
            onClick={createLeague}
            className="bg-green-600 text-white px-3 rounded"
          >
            Create
          </button>
        </div>
      </div>

      {/* LEAGUES */}
      <div className="border p-4 rounded-lg">
        <h2 className="font-bold mb-2">Leagues</h2>

        {leagues.map((l) => (
          <div
            key={l.id}
            className="flex justify-between items-center mb-2"
          >
            <span>{l.name}</span>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLeague(l.id)}
                className="text-blue-600 text-sm"
              >
                Manage
              </button>

              <button
                onClick={() => deleteLeague(l.id)}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MANAGE MEMBERS */}
      {selectedLeague && (
        <div className="border p-4 rounded-lg space-y-4">

          <h2 className="font-bold text-lg">
            Managing: <span className="text-blue-600">{selectedLeagueName}</span>
          </h2>

          {/* SEARCH */}
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-full"
          />

          {/* ADD USER */}
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
              className="bg-blue-600 text-white px-3 rounded"
            >
              Add
            </button>
          </div>

          {/* MEMBERS LIST */}
          <div>
            <h3 className="font-semibold mb-2">Members</h3>

            {members.length === 0 ? (
              <p className="text-sm text-gray-500">
                No members yet
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <span>
                      {m.username}
                    </span>

                    <button
                      onClick={() => removeUser(m.user_id)}
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}