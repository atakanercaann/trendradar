import type { ScoredVideo } from '@/lib/scoring'
export interface VideosResponse { videos: ScoredVideo[]; error?: string }
