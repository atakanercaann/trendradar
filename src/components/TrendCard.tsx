'use client'
import { useEffect, useState } from 'react'
import type { ScoredVideo } from '@/lib/scoring'
import { fmt } from '@/lib/scoring'
const STAGE_STYLE:Record<string,{bg:string;color:string;border:string}>={EMERGING:{bg:'rgba(6,214,160,0.2)',color:'#06d6a0',border:'rgba(6,214,160,0.3)'},RISING:{bg:'rgba(56,189,248,0.2)',color:'#38bdf8',border:'rgba(56,189,248,0.3)'},HOT:{bg:'rgba(249,115,22,0.2)',color:'#f97316',border:'rgba(249,115,22,0.3)'},PEAK:{bg:'rgba(167,139,250,0.2)',color:'#a78bfa',border:'rgba(167,139,250,0.3)'},SATURATED:{bg:'rgba(107,114,128,0.2)',color:'#6b7280',border:'rgba(107,114,128,0.3)'},DECLINING:{bg:'rgba(239,68,68,0.2)',color:'#ef4444',border:'rgba(239,68,68,0.3)'}}
const THUMB:Record<string,[string,string]>={Beauty:['#7c3aed','#a855f7'],Fashion:['#be185d','#ec4899'],Food:['#c2410c','#f97316'],Education:['#1d4ed8','#3b82f6'],Lifestyle:['#065f46','#10b981'],Humor:['#b45309','#fbbf24'],Storytelling:['#1e3a5f','#38bdf8']}
function ScoreBar({label,value,color,delay}:{label:string;value:number;color:string;delay:number}){
  const [w,setW]=useState(0)
  useEffect(()=>{const t=setTimeout(()=>setW(value),delay);return()=>clearTimeout(t)},[value,delay])
  return (
    <div className="flex items-center gap-2">
      <span style={{fontFamily:'var(--font-body)',fontSize:11,color:'var(--muted)',width:118,flexShrink:0}}>{label}</span>
      <div style={{flex:1,height:5,background:'rgba(255,255,255,0.07)',borderRadius:4,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:4,width:`${w}%`,background:color,transition:'width 1s cubic-bezier(0.25,1,0.5,1)'}}/>
      </div>
      <span style={{fontFamily:'var(--font-mono)',fontSize:12,width:28,textAlign:'right',color,flexShrink:0}}>{Math.round(value)}</span>
    </div>
  )
}
export default function TrendCard({video,index}:{video:ScoredVideo;index:number}){
  const {scores}=video
  const colors=THUMB[video.category]??['#1e293b','#334155']
  const st=STAGE_STYLE[scores.stage]??STAGE_STYLE.PEAK
  const ageLabel=video.ageHours<24?`${Math.round(video.ageHours)}h ago`:`${Math.round(video.ageHours/24)}d ago`
  const d=index*60
  const [insight,setInsight]=useState(scores.insight)
  const [insightLoading,setInsightLoading]=useState(false)
  useEffect(()=>{
    let cancelled=false
    async function go(){
      setInsightLoading(true)
      try{
        const res=await fetch('/api/insight',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({video})})
        if(!res.ok)return
        const data=await res.json() as {insight:string}
        if(!cancelled&&data.insight)setInsight(data.insight)
      }finally{if(!cancelled)setInsightLoading(false)}
    }
    go();return()=>{cancelled=true}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[video.id])
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{background:'var(--surface)',border:'1px solid var(--border)',animation:`fadeUp 0.4s ease ${d}ms both`,transition:'border-color 0.2s,transform 0.2s'}} onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--border2)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='var(--border)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
      <div className="relative h-32 flex items-end px-3 pb-2.5" style={{background:`linear-gradient(135deg,${colors[0]},${colors[1]})`}}>
        <div className="absolute top-2.5 left-3 flex gap-1.5">
          <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',background:st.bg,color:st.color,border:`1px solid ${st.border}`}}>{scores.stage}</span>
          <span style={{padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:600,textTransform:'uppercase',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.1)'}}>{video.category}</span>
        </div>
        <div className="absolute top-2.5 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)'}}>{video.platform==='TikTok'?'??':'??'}</div>
        <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{video.platform}</span>
      </div>
      <div className="flex flex-col gap-3 p-4 flex-1">
        <h3 style={{fontFamily:'var(--font-head)',fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.35}}>{video.title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background:`${video.creator.color}22`,color:video.creator.color}}>{video.creator.avatar}</div>
          <span style={{fontSize:12,color:'var(--muted)'}}>{video.creator.name}</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--dim)',marginLeft:'auto'}}>{fmt(video.creator.followers)} followers</span>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {[{k:'Views',v:fmt(video.views)},{k:'Likes',v:fmt(video.likes)},{k:'Comments',v:fmt(video.comments)},{k:'Shares',v:fmt(video.shares)},{k:'Saves ?',v:fmt(video.saves),h:true}].map(m=>(
            <div key={m.k} className="flex flex-col items-center gap-0.5 min-w-[42px]">
              <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:500,color:m.h?'var(--opp)':'#fff'}}>{m.v}</span>
              <span style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{m.k}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <ScoreBar label="Trend Score" value={scores.trend} color="#06d6a0" delay={d}/>
          <ScoreBar label="Opportunity" value={scores.opp} color="#fbbf24" delay={d+80}/>
          <ScoreBar label="Engagement Quality" value={scores.eng} color="#38bdf8" delay={d+160}/>
          <ScoreBar label="Reproducibility" value={scores.repro} color="#a78bfa" delay={d+240}/>
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',borderLeft:'2px solid var(--emerging)',borderRadius:'0 6px 6px 0',padding:'8px 10px',fontSize:12,color:'#94a3b8',lineHeight:1.6,opacity:insightLoading?0.5:1,transition:'opacity 0.4s ease'}} dangerouslySetInnerHTML={{__html:insight}}/>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{borderTop:'1px solid var(--border)'}}>
        <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--muted)'}}>? {ageLabel} · {fmt(video.vphNow)}/hr</span>
        <button className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg" style={{background:'rgba(6,214,160,0.12)',border:'1px solid rgba(6,214,160,0.25)',color:'var(--emerging)',fontFamily:'var(--font-body)',cursor:'pointer'}} onClick={()=>alert(`Adapt This — coming soon!\n\n"${video.title}"\nOpportunity: ${Math.round(scores.opp)}/100`)}>Adapt This ?</button>
      </div>
    </div>
  )
}
