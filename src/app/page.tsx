'use client'
import { useEffect, useMemo, useState } from 'react'
import { type Stage, type SortKey, type ScoredVideo } from '@/lib/scoring'
import { type VideosResponse } from '@/types/api'
import Header from '@/components/Header'
import StatsBar from '@/components/StatsBar'
import FilterBar from '@/components/FilterBar'
import TrendCard from '@/components/TrendCard'
type StageFilter = Stage | 'all'
export default function Home() {
  const [activeStage,setActiveStage]=useState<StageFilter>('all')
  const [activeCategory,setActiveCategory]=useState('all')
  const [sortKey,setSortKey]=useState<SortKey>('opportunity')
  const [allScored,setAllScored]=useState<ScoredVideo[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  useEffect(()=>{
    let cancelled=false
    async function load(){
      setLoading(true);setError(null)
      try{
        const res=await fetch('/api/videos')
        if(!res.ok)throw new Error(`HTTP ${res.status}`)
        const json:VideosResponse=await res.json()
        if(json.error)throw new Error(json.error)
        if(!cancelled)setAllScored(json.videos)
      }catch(err){
        if(!cancelled)setError(err instanceof Error?err.message:'Failed to load videos')
      }finally{if(!cancelled)setLoading(false)}
    }
    load();return()=>{cancelled=true}
  },[])
  const filtered=useMemo(()=>{
    let r=[...allScored]
    if(activeStage!=='all')r=r.filter(v=>v.scores.stage===activeStage)
    if(activeCategory!=='all')r=r.filter(v=>v.category===activeCategory)
    r.sort((a,b)=>sortKey==='opportunity'?b.scores.opp-a.scores.opp:sortKey==='trend'?b.scores.trend-a.scores.trend:sortKey==='velocity'?b.scores.vel-a.scores.vel:b.scores.fresh-a.scores.fresh)
    return r
  },[allScored,activeStage,activeCategory,sortKey])
  const stats=useMemo(()=>({total:allScored.length,emerging:allScored.filter(v=>v.scores.stage==='EMERGING').length,rising:allScored.filter(v=>v.scores.stage==='RISING').length,hot:allScored.filter(v=>v.scores.stage==='HOT').length}),[allScored])
  return (
    <main>
      <Header/>
      <StatsBar {...stats}/>
      <FilterBar activeStage={activeStage} activeCategory={activeCategory} sortKey={sortKey} onStageChange={setActiveStage} onCategoryChange={setActiveCategory} onSortChange={setSortKey}/>
      <div className="flex items-center gap-5 flex-wrap px-8 pt-4 pb-1">
        <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Scores</span>
        {[{label:'Trend Score',color:'#06d6a0'},{label:'Opportunity Score',color:'#fbbf24'},{label:'Engagement Quality',color:'#38bdf8'},{label:'Reproducibility',color:'#a78bfa'}].map(i=>(
          <div key={i.label} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:i.color}}/><span style={{fontSize:11,color:'var(--muted)'}}>{i.label}</span></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6 pt-4">
        {loading?(
          Array.from({length:6}).map((_,i)=>(
            <div key={i} className="rounded-2xl" style={{background:'var(--surface)',border:'1px solid var(--border)',height:420,opacity:0.5,animation:`fadeUp 0.3s ease ${i*60}ms both`}}>
              <div style={{height:130,background:'var(--surface2)',borderRadius:'14px 14px 0 0'}}/>
              <div className="p-4 flex flex-col gap-3">{[90,60,100,70].map((w,j)=><div key={j} style={{height:12,width:`${w}%`,background:'var(--surface2)',borderRadius:4}}/>)}</div>
            </div>
          ))
        ):error?(
          <div className="col-span-full text-center py-20">
            <div className="text-4xl mb-4">??</div>
            <h3 style={{fontFamily:'var(--font-head)',fontSize:18,color:'var(--text)',marginBottom:6}}>Could not load videos</h3>
            <p style={{fontSize:13,color:'var(--muted)',marginBottom:16}}>{error}</p>
            <button onClick={()=>window.location.reload()} style={{padding:'8px 20px',borderRadius:8,background:'rgba(6,214,160,0.12)',border:'1px solid rgba(6,214,160,0.3)',color:'var(--emerging)',fontFamily:'var(--font-body)',fontSize:13,cursor:'pointer'}}>Try again</button>
          </div>
        ):filtered.length===0?(
          <div className="col-span-full text-center py-20">
            <div className="text-4xl mb-4">??</div>
            <h3 style={{fontFamily:'var(--font-head)',fontSize:18,color:'var(--text)',marginBottom:6}}>No videos match this filter</h3>
            <p style={{fontSize:13,color:'var(--muted)'}}>Try a different stage or category.</p>
          </div>
        ):(
          filtered.map((video,index)=><TrendCard key={String(video.id)} video={video} index={index}/>)
        )}
      </div>
    </main>
  )
}
