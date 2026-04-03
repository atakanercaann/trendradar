import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
function isAuthorized(req:NextRequest):boolean{const secret=process.env.INGEST_SECRET;if(!secret)return false;return req.headers.get('authorization')===`Bearer ${secret}`}
export async function POST(req:NextRequest){
  if(!isAuthorized(req))return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await req.json()
  if(!Array.isArray(body?.videos)||body.videos.length===0)return NextResponse.json({error:'No videos provided'},{status:400})
  let inserted=0;const errors:string[]=[]
  for(const v of body.videos){
    try{
      const{data,error:ce}=await supabase.from('creators').upsert({handle:v.creator.handle,display_name:v.creator.handle,followers:v.creator.followers,avatar:v.creator.avatar,avatar_color:v.creator.avatar_color},{onConflict:'handle'}).select('id').single()
      if(ce)throw new Error(ce.message)
      const{error:ve}=await supabase.from('videos').insert({title:v.title,category:v.category,platform:v.platform,location:v.location,creator_id:data.id,posted_at:v.posted_at,views:v.views,likes:v.likes,comments:v.comments,shares:v.shares,saves:v.saves,vph_now:v.vph_now,vph_prev:v.vph_prev,similar_count:v.similar_count,is_active:true})
      if(ve)throw new Error(ve.message)
      inserted++
    }catch(err){errors.push(err instanceof Error?err.message:String(err))}
  }
  return NextResponse.json({inserted,errors})
}
