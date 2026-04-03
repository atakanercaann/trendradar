interface StatProps { value:number; label:string; valueColor?:string }
function Stat({value,label,valueColor}:StatProps){
  return <div className="flex flex-col gap-0.5"><span style={{fontFamily:'var(--font-mono)',fontSize:18,fontWeight:500,color:valueColor??'#fff'}}>{value}</span><span style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</span></div>
}
export default function StatsBar({total,emerging,rising,hot}:{total:number;emerging:number;rising:number;hot:number}){
  return (
    <div className="flex items-center gap-8 px-8 py-3.5" style={{background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
      <Stat value={total} label="Videos Tracked"/>
      <Stat value={emerging} label="Emerging" valueColor="var(--emerging)"/>
      <Stat value={rising} label="Rising" valueColor="var(--rising)"/>
      <Stat value={hot} label="Hot Right Now" valueColor="var(--hot)"/>
    </div>
  )
}
