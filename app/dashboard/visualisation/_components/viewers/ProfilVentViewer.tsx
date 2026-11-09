'use client'

/* ============================================================
   ProfilVentViewer — version visualisation
   Identique au composant profil/ProfilVentBarbules mais :
   - données viennent des props (payload NetCDF)
   - barbules noires (#000000)
   - zoom molette + brush-zoom par sélection
   ============================================================ */

import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import styles from './ProfilVentViewer.module.css'

interface Props { payload: Record<string, unknown> }

interface WindPoint { t: Date; alt: number; ff: number; dd: number }
type InteractionMode = 'navigation' | 'selection'

const MS_TO_KT = 1.94384
const MARGIN   = { top: 20, right: 20, bottom: 52, left: 60 }
const BARBULE_COLOR = '#000000'

function uvToFFDD(u: number, v: number) {
  const ff = Math.sqrt(u * u + v * v)
  let dd = Math.atan2(-u, -v) * (180 / Math.PI)
  if (dd < 0) dd += 360
  return { ff, dd }
}

function parsePayload(p: Record<string, unknown>): WindPoint[] {
  const altitudes = p.altitudes as number[]
  const times     = p.times     as string[]
  const u         = p.u         as (number|null)[][]
  const v         = p.v         as (number|null)[][]
  const ff_       = p.wind_speed          as (number|null)[][] | null
  const dd_       = p.wind_from_direction as (number|null)[][] | null
  const pts: WindPoint[] = []
  for (let iA = 0; iA < altitudes.length; iA++) {
    for (let iT = 0; iT < times.length; iT++) {
      const uv = u[iA][iT], vv = v[iA][iT]
      if (uv === null || vv === null) continue
      let ff: number, dd: number
      if (ff_ && dd_) {
        const fv = ff_[iA][iT], dv = dd_[iA][iT]
        if (fv === null || dv === null) continue
        ff = fv; dd = dv
      } else { const r = uvToFFDD(uv, vv); ff = r.ff; dd = r.dd }
      pts.push({ t: new Date(times[iT]), alt: altitudes[iA], ff, dd })
    }
  }
  return pts
}

function drawBarbule(g: d3.Selection<SVGGElement, unknown, null, undefined>, cx: number, cy: number, ff: number, dd: number, hamp: number) {
  const ffKt = ff * MS_TO_KT, bL = hamp * 0.55, b5 = bL * 0.6, esp = hamp * 0.22
  if (ffKt < 2.5) { g.append('circle').attr('cx',cx).attr('cy',cy).attr('r',3).attr('fill','none').attr('stroke',BARBULE_COLOR).attr('stroke-width',1.2); return }
  const ddRad = (dd-90)*(Math.PI/180), dx=Math.cos(ddRad), dy=Math.sin(ddRad), px=-dy, py=dx
  const ex=cx+dx*hamp, ey=cy+dy*hamp
  let kt=ffKt, n50=Math.floor(kt/50); kt-=n50*50; let n10=Math.floor(kt/10); kt-=n10*10; const n5=Math.floor(kt/5)
  let bx=ex, by=ey
  for(let i=0;i<n50;i++){const nx=bx-dx*esp*2,ny=by-dy*esp*2;g.append('polygon').attr('points',`${bx},${by} ${bx+px*bL},${by+py*bL} ${nx},${ny}`).attr('fill',BARBULE_COLOR);bx=nx-dx*esp*.5;by=ny-dy*esp*.5}
  for(let i=0;i<n10;i++){g.append('line').attr('x1',bx).attr('y1',by).attr('x2',bx+px*bL).attr('y2',by+py*bL).attr('stroke',BARBULE_COLOR).attr('stroke-width',1.2).attr('stroke-linecap','round');bx-=dx*esp;by-=dy*esp}
  if(n5>0){const off=(n10===0&&n50===0)?esp:0;g.append('line').attr('x1',bx-dx*off).attr('y1',by-dy*off).attr('x2',bx-dx*off+px*b5).attr('y2',by-dy*off+py*b5).attr('stroke',BARBULE_COLOR).attr('stroke-width',1.2).attr('stroke-linecap','round')}
  g.append('line').attr('x1',cx).attr('y1',cy).attr('x2',ex).attr('y2',ey).attr('stroke',BARBULE_COLOR).attr('stroke-width',1.2).attr('stroke-linecap','round')
  g.append('circle').attr('cx',cx).attr('cy',cy).attr('r',2).attr('fill',BARBULE_COLOR)
}

function Graph({ width, height, data, mode, onModeChange }: {
  width: number; height: number; data: WindPoint[]
  mode: InteractionMode; onModeChange: (m: InteractionMode) => void
}) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const zoomRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const brushRef  = useRef<d3.BrushBehavior<unknown> | null>(null)
  const gBrushRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const modeRef   = useRef<InteractionMode>(mode)
  const onModeRef = useRef(onModeChange)
  useEffect(() => { modeRef.current   = mode },        [mode])
  useEffect(() => { onModeRef.current = onModeChange }, [onModeChange])

  const iW = width  - MARGIN.left - MARGIN.right
  const iH = height - MARGIN.top  - MARGIN.bottom

  useEffect(() => {
    if (!svgRef.current || iW <= 0 || iH <= 0 || data.length === 0) return
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove()

    const temps = Array.from(new Set(data.map(d=>d.t.getTime()))).sort().map(t=>new Date(t))
    const alts  = Array.from(new Set(data.map(d=>d.alt))).sort((a,b)=>a-b)

    const xBase = d3.scaleTime().domain([temps[0], temps[temps.length-1]]).range([0, iW])
    const yBase = d3.scaleLinear().domain([alts[0]-100, alts[alts.length-1]+100]).range([iH, 0])

    svg.append('defs').append('clipPath').attr('id','clip-pvv').append('rect').attr('width',iW).attr('height',iH)
    const g = svg.append('g').attr('transform',`translate(${MARGIN.left},${MARGIN.top})`)
    const gGX=g.append('g'), gGY=g.append('g')
    const gAX=g.append('g').attr('transform',`translate(0,${iH})`), gAY=g.append('g')

    g.append('text').attr('x',iW/2).attr('y',iH+44).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('Temps (UTC)')
    g.append('text').attr('transform','rotate(-90)').attr('x',-iH/2).attr('y',-MARGIN.left+12).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('Altitude (km MSL)')

    const gClip=g.append('g').attr('clip-path','url(#clip-pvv)')
    const gBarbs=gClip.append('g')

    function render(xS: d3.ScaleTime<number,number>, yS: d3.ScaleLinear<number,number>, k: number) {
      const dtPx=temps.length>1?Math.abs(xS(temps[1])-xS(temps[0])):iW
      const daPx=alts.length>1?Math.abs(yS(alts[1])-yS(alts[0])):iH
      const hamp=Math.max(4,Math.min(dtPx*.42,daPx*.42,32*Math.sqrt(k)))
      gGX.call(d3.axisBottom(xS).ticks(8).tickSize(-iH).tickFormat(()=>'')).attr('transform',`translate(0,${iH})`).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3')})
      gGY.call(d3.axisLeft(yS).ticks(8).tickSize(-iW).tickFormat(()=>'')).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3')})
      gAX.call(d3.axisBottom(xS).ticks(8).tickSize(4).tickFormat(d=>d3.timeFormat('%H:%M')(d as Date))).call(ax=>{ax.select('.domain').attr('stroke','#CCCCCC');ax.selectAll('.tick line').attr('stroke','#CCCCCC');ax.selectAll('.tick text').attr('font-size',9).attr('fill','#3F3F3F').attr('font-family','Arial').attr('dy','1.2em')})
      gAY.call(d3.axisLeft(yS).ticks(8).tickSize(4).tickFormat(d=>`${(+d/1000).toFixed(1)}`)).call(ax=>{ax.select('.domain').attr('stroke','#CCCCCC');ax.selectAll('.tick line').attr('stroke','#CCCCCC');ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial')})
      gBarbs.selectAll('*').remove()
      const mg=hamp*2
      data.forEach(pt=>{
        const cx=xS(pt.t), cy=yS(pt.alt)
        if(cx<-mg||cx>iW+mg||cy<-mg||cy>iH+mg) return
        drawBarbule(gBarbs.append('g'),cx,cy,pt.ff,pt.dd,hamp)
      })
    }

    render(xBase, yBase, 1)

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5,40])
      .filter((event: Event) => modeRef.current !== 'selection' && !(event as MouseEvent).ctrlKey)
      .on('start',()=>{ if(modeRef.current==='navigation') svg.style('cursor','grabbing') })
      .on('zoom',(e:d3.D3ZoomEvent<SVGSVGElement,unknown>)=>{ render(e.transform.rescaleX(xBase),e.transform.rescaleY(yBase),e.transform.k) })
      .on('end',()=>{ if(modeRef.current==='navigation') svg.style('cursor','grab') })
    svg.call(zoom).style('cursor','grab')
    zoomRef.current = zoom

    const brush = d3.brush().extent([[0,0],[iW,iH]])
      .filter(()=>modeRef.current==='selection')
      .on('end',(event:d3.D3BrushEvent<unknown>)=>{
        if(!event.sourceEvent||!event.selection) return
        const [[x0,y0],[x1,y1]] = event.selection as [[number,number],[number,number]]
        if(Math.abs(x1-x0)<8||Math.abs(y1-y0)<8){ gBrushRef.current?.call(brush.move,null); return }
        const ct=d3.zoomTransform(svgRef.current!)
        const xZ=ct.rescaleX(xBase), yZ=ct.rescaleY(yBase)
        const tLo=xZ.invert(x0), tHi=xZ.invert(x1)
        const aHi=yZ.invert(y0), aLo=yZ.invert(y1)
        gBrushRef.current?.call(brush.move,null)
        const spanX=xBase(tHi)-xBase(tLo), spanY=yBase(aLo)-yBase(aHi)
        if(spanX<=0||spanY<=0) return
        const s=Math.min(iW/spanX,iH/spanY,40)
        const tx=-xBase(tLo)*s, ty=-yBase(aHi)*s
        d3.select(svgRef.current!).transition().duration(450).ease(d3.easeCubicOut).call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(s))
        onModeRef.current('navigation')
      })

    const gBrush = gClip.append('g').attr('class','brush-group')
    gBrush.call(brush)
    gBrush.attr('pointer-events','none')
    brushRef.current = brush
    gBrushRef.current = gBrush

  }, [width, height, data, iW, iH])

  useEffect(() => {
    if(!svgRef.current||!gBrushRef.current||!brushRef.current) return
    if(mode==='navigation'){
      gBrushRef.current.attr('pointer-events','none')
      gBrushRef.current.call(brushRef.current.move,null)
      d3.select(svgRef.current).style('cursor','grab')
    } else {
      gBrushRef.current.attr('pointer-events','all')
      d3.select(svgRef.current).style('cursor','crosshair')
    }
  }, [mode])

  const scaleBy=(f:number)=>{ if(!svgRef.current||!zoomRef.current||mode==='selection') return; d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy,f) }
  const reset=()=>{ if(!svgRef.current||!zoomRef.current) return; d3.select(svgRef.current).transition().duration(350).call(zoomRef.current.transform,d3.zoomIdentity) }

  return (
    <div className={styles.graphWrapper}>
      <div className={styles.zoomControls}>
        <button className={styles.zoomBtn} onClick={()=>scaleBy(2)} disabled={mode==='selection'}>+</button>
        <button className={styles.zoomBtn} onClick={()=>scaleBy(0.5)} disabled={mode==='selection'}>−</button>
        <button className={styles.zoomBtnReset} onClick={reset}>↺</button>
      </div>
      <svg ref={svgRef} width={width} height={height} className={styles.svg} />
    </div>
  )
}

export default function ProfilVentViewer({ payload }: Props) {
  const cRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [mode, setMode] = useState<InteractionMode>('navigation')

  /* useMemo pour éviter de recalculer les données à chaque render */
  const data = useMemo(() => parsePayload(payload), [payload])

  useEffect(() => {
    const el = cRef.current; if (!el) return
    const obs = new ResizeObserver(e => {
      const { width, height } = e[0].contentRect
      setDims({ w: Math.floor(width), h: Math.floor(height) })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className={styles.wrapper}>

      {/* Toolbar modes */}
      <div className={styles.toolbar}>
        <div className={styles.modeGroup}>
          <button
            className={`${styles.modeBtn} ${mode === 'navigation' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('navigation')}
            title="Navigation — molette + glisser"
          >
            <span>✋</span> Navigation
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'selection' ? styles.modeBtnActiveSelection : ''}`}
            onClick={() => setMode('selection')}
            title="Zoom par sélection — dessiner un rectangle"
          >
            <span>⬚</span> Sélection
          </button>
        </div>
        <div className={styles.toolbarSep} />
        <span className={styles.toolbarHint}>
          {mode === 'navigation'
            ? 'Molette pour zoomer · Glisser pour se déplacer'
            : 'Dessinez un rectangle sur la zone à agrandir'}
        </span>
      </div>

      {/* Zone graphe */}
      <div className={styles.graphArea} ref={cRef}>
        {dims.w > 0 && dims.h > 0 && (
          <Graph
            width={dims.w} height={dims.h}
            data={data}
            mode={mode}
            onModeChange={setMode}
          />
        )}
      </div>

      <div className={styles.footer}>
        △ = 50 kt &nbsp; — = 10 kt &nbsp; ╴ = 5 kt
      </div>

    </div>
  )
}
