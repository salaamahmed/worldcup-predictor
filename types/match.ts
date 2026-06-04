export type Match = {
  id: string

  home_team: string
  away_team: string

  home_score: number | null
  away_score: number | null

  kickoff_time: string   // ✅ FIXED
  status: 'SCHEDULED' | 'FINISHED' | 'LIVE'  // ✅ FIXED

  group_name: string | null

  // optional fields (safe for bracket)
  next_match_id?: string | null
  bracket_slot?: number | null
}