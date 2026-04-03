import { NextRequest, NextResponse } from 'next/server'
import type { ScoredVideo } from '@/lib/scoring'
import { fmt } from '@/lib/scoring'
export async function POST(req:NextRequest){
  const apiKey=process.env.ANTHROPIC_API_KEY
  const{video}=await req.json() as {video:ScoredVideo}
  if(!apiKey)return NextResponse.json({insight:video.scores.insight})
  const{scores}=video
  const br=Math.round(video.views/Math.max(video.creator.followers,1))
  const prompt=`You are TrendRadar, a content opportunity analyst. A ${video.category} video on ${video.platform} has been scored.\nTitle: "${video.title}"\nCreator: ${video.creator.name} (${fmt(video.creator.followers)} followers, ${br}x reach)\nStage: ${scores.stage} | Age: ${Math.round(video.ageHours)}h | VPH: ${fmt(video.vphNow)}\nScores: Trend ${Math.round(scores.trend)} | Opportunity ${Math.round(scores.opp)} | Engagement ${Math.round(scores.eng)} | Saturation ${Math.round(scores.sat)}\nWrite exactly 2 sentences explaining why this is or is not a good opportunity right now. Use the numbers. Wrap key phrases in <span> tags. No preamble.`
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:200,messages:[{role:'user',content:prompt}]})})
    if(!res.ok)return NextResponse.json({insight:video.scores.insight})
    const data=await res.json() as {content:Array<{type:string;text:string}>}
    const text=data.content.find(b=>b.type==='text')?.text??''
    return NextResponse.json({insight:text||video.scores.insight})
  }catch{return NextResponse.json({insight:video.scores.insight})}
}
