import { NextResponse } from 'next/server'
import { supabase, type DbVideo } from '@/lib/supabase'
import { scoreAll } from '@/lib/scoring'
import type { RawVideo, Category, Platform, Location } from '@/data/videos'
import type { VideosResponse } from '@/types/api'
function toRawVideo(row:DbVideo):RawVideo{
  const ageHours=(Date.now()-new Date(row.posted_at).getTime())/(1000*60*60)
  return{id:row.id as unknown as number,title:row.title,category:row.category as Category,platform:row.platform as Platform,creator:{name:row.creators.handle,followers:row.creators.followers,avatar:row.creators.avatar,color:row.creators.avatar_color},ageHours:Math.max(ageHours,0.1),views:row.views,likes:row.likes,comments:row.comments,shares:row.shares,saves:row.saves,vphNow:row.vph_now,vphPrev:row.vph_prev,similarCount:row.similar_count,location:row.location as Location}
}
export async function GET():Promise<NextResponse<VideosResponse>>{
  const{data,error}=await supabase.from('videos').select(`*,creators(id,handle,display_name,followers,avatar,avatar_color)`).eq('is_active',true).order('posted_at',{ascending:false})
  if(error){console.error('[/api/videos]',error.message);return NextResponse.json({videos:[],error:error.message},{status:500})}
  return NextResponse.json({videos:scoreAll((data as DbVideo[]).map(toRawVideo))})
}
