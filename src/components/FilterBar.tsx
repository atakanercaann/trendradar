import type { Stage, SortKey } from '@/lib/scoring'
type StageFilter = Stage | 'all'
interface FilterBarProps { activeStage:StageFilter; activeCategory:string; sortKey:SortKey; onStageChange:(s:StageFilter)=>void; onCategoryChange:(c:string)=>void; onSortChange:(k:SortKey)=>void }
const PILLS=[{value:'all',label:'All',s:{background:'rgba(255,255,255,0.12)',color:'#fff'}},{value:'EMERGING',label:'?? Emerging',s:{background:'rgba(6,214,160,0.2)',borderColor:'rgba(6,214,160,0.4)',color:'var(--emerging)'}},{value:'RISING',label:'?? Rising',s:{background:'rgba(56,189,248,0.2)',borderColor:'rgba(56,189,248,0.4)',color:'var(--rising)'}},{value:'HOT',label:'?? Hot',s:{background:'rgba(249,115,22,0.2)',borderColor:'rgba(249,115,22,0.4)',color:'var(--hot)'}},{value:'PEAK',label:'?? Peak',s:{background:'rgba(167,139,250,0.2)',borderColor:'rgba(167,139,250,0.4)',color:'var(--peak)'}}]
const CATS=['all','Beauty','Fashion','Food','Lifestyle','Education','Humor','Storytelling']
const SORTS=[{value:'opportunity',label:'Opportunity Score'},{value:'trend',label:'Trend Score'},{value:'velocity',label:'Velocity'},{value:'freshness',label:'Freshness'}]
const sel:React.CSSProperties={background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-body)',fontSize:12,padding:'5px 10px',cursor:'pointer',outline:'none'}
const lbl:React.CSSProperties={fontFamily:'var(--font-mono)',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}
export default function FilterBar({activeStage,activeCategory,sortKey,onStageChange,onCategoryChange,onSortChange}:FilterBarProps){
  return (
    <div className="flex items-center gap-3 flex-wrap px-8 py-4" style={{borderBottom:'1px solid var(--border)'}}>
      <span style={lbl}>Stage</span>
      <div className="flex gap-1.5 flex-wrap">
        {PILLS.map(p=>{
          const active=activeStage===p.value
          return <button key={p.value} onClick={()=>onStageChange(p.value as StageFilter)} style={{padding:'5px 14px',borderRadius:20,border:'1px solid var(--border2)',background:'transparent',color:'var(--muted)',fontFamily:'var(--font-body)',fontSize:12,fontWeight:500,cursor:'pointer',transition:'all 0.18s',...(active?p.s:{})}}>{p.label}</button>
        })}
      </div>
      <div style={{width:1,height:24,background:'var(--border2)',margin:'0 4px'}}/>
      <span style={lbl}>Category</span>
      <select value={activeCategory} onChange={e=>onCategoryChange(e.target.value)} style={sel}>
        {CATS.map(c=><option key={c} value={c}>{c==='all'?'All Categories':c}</option>)}
      </select>
      <span style={{...lbl,marginLeft:'auto'}}>Sort by</span>
      <select value={sortKey} onChange={e=>onSortChange(e.target.value as SortKey)} style={sel}>
        {SORTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
