export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-5" style={{borderBottom:'1px solid var(--border2)',background:'rgba(5,8,15,0.92)',backdropFilter:'blur(12px)'}}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:'linear-gradient(135deg,#06d6a0,#0ea5e9)'}}>??</div>
        <div>
          <div style={{fontFamily:'var(--font-head)',fontSize:20,fontWeight:800,letterSpacing:'-0.5px',color:'#fff'}}>TrendRadar</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--muted)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Content Opportunity Intelligence</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{background:'rgba(6,214,160,0.1)',border:'1px solid rgba(6,214,160,0.25)',fontFamily:'var(--font-mono)',fontSize:11,color:'var(--emerging)',letterSpacing:'0.06em'}}>
        <div className="live-dot" />Live
      </div>
    </header>
  )
}
