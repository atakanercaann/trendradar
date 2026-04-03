import { createClient } from '@supabase/supabase-js'
export interface DbCreator { id:string; handle:string; display_name:string; followers:number; avatar:string; avatar_color:string; created_at:string }
export interface DbVideo { id:string; title:string; category:string; platform:string; creator_id:string; posted_at:string; views:number; likes:number; comments:number; shares:number; saves:number; vph_now:number; vph_prev:number; similar_count:number; location:string; is_active:boolean; created_at:string; updated_at:string; creators:DbCreator }
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)
