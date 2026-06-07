export type Match = {
  id: string
  home_team: string
  away_team: string

  // ✅ ADD THESE
  resolved_home_team?: string | null
  resolved_away_team?: string | null

  kickoff_time: string
  status: string

  home_score?: number | null
  away_score?: number | null

  group_name?: string | null
  match_number: number

  venue?: string | null
  bracket_slot?: number | null
}