'use client'

/* ============================================================
   SpectreDopplerViewer — version visualisation
   Identique au composant dashboard mais :
   - les données viennent des props (payload NetCDF)
   - pas de useRadar (contexte non dispo dans visualisation)
   ============================================================ */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import styles from './SpectreDopplerViewer.module.css'

interface Props { payload: Record<string, unknown> }

/* ── Paramètres extraits du payload ── */
function parsePayload(p: Record<string, unknown>) {
  const altitudes = (p.altitudes as number[]) ?? []
  const spectra   = (p.spectra   as number[][]) ?? (p.u as number[][]) ?? []
  const velocity  = (p.velocity  as number[]) ??
    Array.from({ length: spectra[0]?.length ?? 128 }, (_, j) => -20 + (j / ((spectra[0]?.length ?? 128) - 1)) * 40)
  const power     = (p.power as number[] | null) ?? null

  const N = spectra.length
  const M = spectra[0]?.length ?? 128
  const resEch  = altitudes.length > 1 ? altitudes[1] - altitudes[0] : 150
  const altDebut = altitudes[0] ?? 1413
  const vitMax   = Math.abs(velocity[velocity.length - 1])

  const pwr = power ?? spectra.map(row => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length
    return 10 * Math.log10(Math.max(mean, 1e-9))
  })

  return { altitudes, spectra, velocity, pwr, N, M, resEch, altDebut, vitMax }
}

const ML = { top: 18, right: 8,  bottom: 46, left: 52 }
const MR = { top: 18, right: 16, bottom: 46, left: 10 }
const K_COURBES = 0.82
const K_PWR     = 0.88

const COLORMAP_PALETTE   = ['#060622','#0a1a6e','#0055c8','#00aadc','#00e0c8','#a0f020','#f8d000','#f86000','#d01010']
const CONTOUR_THRESHOLDS = [0.2, 0.4, 0.6, 0.8]

type LayerKey = 'courbes' | 'colormap' | 'contours'
const LAYERS = [
  { key: 'courbes'  as LayerKey, label: 'Courbes',  color: '#293771' },
  { key: 'colormap' as LayerKey, label: 'Colormap', color: '#3EAABC' },
  { key: 'contours' as LayerKey, label: 'Contours', color: '#55B187' },
]

interface TooltipState { visible: boolean; x: number; y: number; lines: string[] }
function Tooltip({ state }: { state: TooltipState }) {
  if (!state.visible) return null
  return (
    <div className={styles.tooltip} style={{ left: state.x + 14, top: state.y - 10 }}>
      {state.lines.map((l, i) => <div key={i} className={styles.tooltipLine}>{l}</div>)}
    </div>
  )
}

/* ── Graphe gauche ── */
function GraphSpectre({ width, height, layers, showTooltip, spectra, velocity, altitudes, N, M, resEch, altDebut, vitMax }: {
  width: number; height: number
  layers: Record<LayerKey, boolean>; showTooltip: boolean
  spectra: number[][]; velocity: number[]; altitudes: number[]
  N: number; M: number; resEch: number; altDebut: number; vitMax: number
}) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const zoomRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const gDataRef  = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gGridXRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gGridYRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gAxisXRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gAxisYRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const xBaseRef  = useRef<d3.ScaleLinear<number,number> | null>(null)
  const yBaseRef  = useRef<d3.ScaleLinear<number,number> | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, lines: [] })

  const iW = width  - ML.left - ML.right
  const iH = height - ML.top  - ML.bottom
  const altMin = altitudes[0] ?? altDebut
  const altMax = (altitudes[altitudes.length - 1] ?? altDebut) + resEch

  const rescaleAxes = useCallback((xS: d3.ScaleLinear<number,number>, yS: d3.ScaleLinear<number,number>) => {
    if (!gGridXRef.current || !gGridYRef.current || !gAxisXRef.current || !gAxisYRef.current) return
    gGridXRef.current.call(d3.axisBottom(xS).ticks(8).tickSize(-iH).tickFormat(()=>'')).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3')})
    gGridYRef.current.call(d3.axisLeft(yS).ticks(6).tickSize(-iW).tickFormat(()=>'')).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3')})
    gAxisXRef.current.call(d3.axisBottom(xS).ticks(8).tickSize(4).tickFormat(d=>`${d}`)).call(ax=>{ax.select('.domain').attr('stroke','#CCCCCC');ax.selectAll('.tick line').attr('stroke','#CCCCCC');ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial')})
    gAxisYRef.current.call(d3.axisLeft(yS).ticks(6).tickSize(4).tickFormat(d=>`${(+d/1000).toFixed(1)}`)).call(ax=>{ax.select('.domain').attr('stroke','#CCCCCC');ax.selectAll('.tick line').attr('stroke','#CCCCCC');ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial')})
  }, [iH, iW])

  useEffect(() => {
    if (!svgRef.current || iW <= 0 || iH <= 0 || spectra.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const xBase = d3.scaleLinear().domain([-vitMax, vitMax]).range([0, iW])
    const yBase = d3.scaleLinear().domain([altMin, altMax]).range([iH, 0])
    xBaseRef.current = xBase; yBaseRef.current = yBase

    svg.append('defs').append('clipPath').attr('id','clip-sdv').append('rect').attr('width',iW).attr('height',iH)
    const g = svg.append('g').attr('transform',`translate(${ML.left},${ML.top})`)

    const gGridX = g.append('g').attr('transform',`translate(0,${iH})`)
    const gGridY = g.append('g')
    const gAxisX = g.append('g').attr('transform',`translate(0,${iH})`)
    const gAxisY = g.append('g')
    gGridXRef.current=gGridX; gGridYRef.current=gGridY; gAxisXRef.current=gAxisX; gAxisYRef.current=gAxisY

    g.append('text').attr('x',iW/2).attr('y',iH+38).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('VIT. RAD. (m/s)')
    g.append('text').attr('transform','rotate(-90)').attr('x',-iH/2).attr('y',-ML.left+12).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('Altitude (km MSL)')

    const gClip = g.append('g').attr('clip-path','url(#clip-sdv)')
    const gData = gClip.append('g')
    gDataRef.current = gData

    const colorScale = d3.scaleSequential().domain([0,1]).interpolator(d3.interpolateRgbBasis(COLORMAP_PALETTE))
    const cellW = iW / M, cellH = iH / N

    if (layers.colormap) {
      spectra.forEach((row, iAlt) => {
        const maxVal = Math.max(...row)
        const y0 = yBase(altitudes[iAlt]) - cellH / 2
        row.forEach((val, iVit) => {
          const x0 = xBase(velocity[iVit]) - cellW / 2
          gData.append('rect').attr('x',x0).attr('y',y0).attr('width',cellW+0.5).attr('height',cellH+0.5).attr('fill',colorScale(maxVal>0?val/maxVal:0)).attr('opacity',0.75)
        })
      })
    }

    if (layers.contours) {
      const flatData = new Array(N * M)
      spectra.forEach((row, iAlt) => {
        const maxVal = Math.max(...row)
        row.forEach((val, iVit) => { flatData[(N-1-iAlt)*M+iVit] = maxVal>0?val/maxVal:0 })
      })
      const contourPaths = d3.contours().size([M, N]).thresholds(CONTOUR_THRESHOLDS)(flatData)
      const xC = d3.scaleLinear().domain([0,M]).range([0,iW])
      const yC = d3.scaleLinear().domain([0,N]).range([0,iH])
      const cColorScale = d3.scaleSequential().domain([0.2,0.8]).interpolator(d3.interpolateViridis)
      contourPaths.forEach(cp => {
        gData.append('path').datum(cp).attr('d',d3.geoPath(d3.geoTransform({point(px,py){this.stream.point(xC(px),yC(py))}})))
          .attr('fill','none').attr('stroke',cColorScale(cp.value)).attr('stroke-width',1.5).attr('opacity',0.9)
      })
    }

    if (layers.courbes) {
      const courseColorScale = d3.scaleSequential().domain([0,N-1]).interpolator(d3.interpolateRgbBasis(['#293771','#3EAABC','#55B187']))
      spectra.forEach((row, i) => {
        const maxVal = Math.max(...row)
        if (maxVal === 0) return
        const base = yBase(altitudes[i]) + cellH / 2
        const pts = velocity.map((v, j) => [xBase(v), base-(row[j]/maxVal)*cellH*K_COURBES] as [number,number])
        const d = [`M ${pts[0][0]} ${base}`,`L ${pts.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}`,`L ${pts[pts.length-1][0]} ${base}`,'Z'].join(' ')
        gData.append('path').attr('d',d).attr('fill',courseColorScale(i)).attr('fill-opacity',0.18)
        gData.append('path').attr('d',d).attr('fill','none').attr('stroke',courseColorScale(i)).attr('stroke-width',1).attr('opacity',0.85)
        gData.append('line').attr('x1',0).attr('y1',base).attr('x2',iW).attr('y2',base).attr('stroke','#E6E6E6').attr('stroke-width',0.5)
      })
    }

    gData.append('line').attr('x1',xBase(0)).attr('y1',0).attr('x2',xBase(0)).attr('y2',iH).attr('stroke','#CCCCCC').attr('stroke-width',1).attr('stroke-dasharray','6,3')
    rescaleAxes(xBase, yBase)

    /* Tooltip conditionnel */
    const overlay = g.append('rect').attr('width',iW).attr('height',iH).attr('fill','none').attr('pointer-events','all').style('cursor','crosshair')
    if (showTooltip) {
      overlay.on('mousemove', function(event: MouseEvent) {
        if (!xBaseRef.current || !yBaseRef.current || !zoomRef.current) return
        const ct = d3.zoomTransform(svgRef.current!)
        const xZ = ct.rescaleX(xBaseRef.current), yZ = ct.rescaleY(yBaseRef.current)
        const [mx, my] = d3.pointer(event)
        const vit = xZ.invert(mx), alt = yZ.invert(my)
        const iAlt = Math.max(0, Math.min(N-1, Math.round((alt-altDebut)/resEch)))
        const iVit = Math.max(0, Math.min(M-1, Math.round((vit+vitMax)/(2*vitMax)*(M-1))))
        const svgRect = svgRef.current!.getBoundingClientRect()
        setTooltip({ visible: true, x: event.clientX-svgRect.left, y: event.clientY-svgRect.top,
          lines: [`Vit. rad. : ${vit.toFixed(2)} m/s`, `Altitude  : ${Math.round(alt)} m MSL`, `Porte     : ${iAlt+1} / ${N}`, `Amplitude : ${spectra[iAlt]?.[iVit]?.toFixed(6) ?? '-'}`] })
      }).on('mouseleave', () => setTooltip(t => ({ ...t, visible: false })))
    }

    /* Zoom */
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 30])
      .on('zoom', (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const t = e.transform
        gData.attr('transform', t.toString())
        rescaleAxes(t.rescaleX(xBase), t.rescaleY(yBase))
      })
    svg.call(zoom).style('cursor','grab')
    zoomRef.current = zoom
  }, [width, height, layers, showTooltip, spectra, velocity, altitudes, N, M, resEch, altDebut, vitMax, iW, iH, altMin, altMax, rescaleAxes])

  const scaleBy = (f: number) => { if (!svgRef.current||!zoomRef.current) return; d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, f) }
  const reset   = () => { if (!svgRef.current||!zoomRef.current) return; d3.select(svgRef.current).transition().duration(350).call(zoomRef.current.transform, d3.zoomIdentity) }

  return (
    <div className={styles.graphWrapper}>
      <div className={styles.zoomControls}>
        <button className={styles.zoomBtn} onClick={()=>scaleBy(2)}>+</button>
        <button className={styles.zoomBtn} onClick={()=>scaleBy(0.5)}>−</button>
        <button className={styles.zoomBtnReset} onClick={reset}>↺</button>
      </div>
      <svg ref={svgRef} width={width} height={height} className={styles.svg} />
      <Tooltip state={tooltip} />
    </div>
  )
}

/* ── Graphe droit ── */
function GraphPuissance({ width, height, showTooltip, pwr, altitudes, resEch, altDebut }: {
  width: number; height: number; showTooltip: boolean
  pwr: number[]; altitudes: number[]; resEch: number; altDebut: number
}) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const zoomRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const gDataRef  = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gGridXRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gGridYRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const gAxisXRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const xBaseRef  = useRef<d3.ScaleLinear<number,number> | null>(null)
  const yBaseRef  = useRef<d3.ScaleLinear<number,number> | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, lines: [] })

  const iW = width  - MR.left - MR.right
  const iH = height - MR.top  - MR.bottom
  const PUISSANCES = pwr.map((p, i) => ({ alt: altitudes[i] ?? altDebut + i * resEch, pwr: p }))
  const pMin = Math.floor((d3.min(PUISSANCES, d=>d.pwr)??-30)/5)*5
  const pMax = Math.ceil( (d3.max(PUISSANCES, d=>d.pwr)??20)/5)*5
  const pPad = (pMax-pMin)*(1-K_PWR)/2
  const altMin = altitudes[0] ?? altDebut
  const altMax = (altitudes[altitudes.length-1] ?? altDebut) + resEch

  const rescaleAxes = useCallback((xS: d3.ScaleLinear<number,number>, yS: d3.ScaleLinear<number,number>) => {
    if (!gGridXRef.current||!gGridYRef.current||!gAxisXRef.current) return
    gGridXRef.current.call(d3.axisBottom(xS).ticks(4).tickSize(-iH).tickFormat(()=>'')).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3')})
    gGridYRef.current.call(d3.axisLeft(yS).ticks(6).tickSize(-iW).tickFormat(()=>'')).call(ax=>{ax.select('.domain').remove();ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3')})
    gAxisXRef.current.call(d3.axisBottom(xS).ticks(4).tickSize(4).tickFormat(d=>`${d}`)).call(ax=>{ax.select('.domain').attr('stroke','#CCCCCC');ax.selectAll('.tick line').attr('stroke','#CCCCCC');ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial')})
  }, [iH, iW])

  useEffect(() => {
    if (!svgRef.current||iW<=0||iH<=0) return
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove()
    const xBase = d3.scaleLinear().domain([pMin-pPad, pMax+pPad]).range([0,iW])
    const yBase = d3.scaleLinear().domain([altMin, altMax]).range([iH,0])
    xBaseRef.current=xBase; yBaseRef.current=yBase

    const g = svg.append('g').attr('transform',`translate(${MR.left},${MR.top})`)
    const gGridY = g.append('g')
    const gGridX = g.append('g').attr('transform',`translate(0,${iH})`)
    const gAxisX = g.append('g').attr('transform',`translate(0,${iH})`)
    gGridXRef.current=gGridX; gGridYRef.current=gGridY; gAxisXRef.current=gAxisX

    svg.append('defs').append('clipPath').attr('id','clip-pwrv').append('rect').attr('width',iW).attr('height',iH)
    const gClip = g.append('g').attr('clip-path','url(#clip-pwrv)')
    const gData = gClip.append('g')
    gDataRef.current = gData

    const area = d3.area<{alt:number;pwr:number}>().x0(xBase(pMin-pPad)).x1(d=>xBase(d.pwr)).y(d=>yBase(d.alt)).curve(d3.curveMonotoneY)
    const line = d3.line<{alt:number;pwr:number}>().x(d=>xBase(d.pwr)).y(d=>yBase(d.alt)).curve(d3.curveMonotoneY)
    gData.append('path').datum(PUISSANCES).attr('fill','#3EAABC').attr('fill-opacity',0.15).attr('d',area)
    gData.append('path').datum(PUISSANCES).attr('fill','none').attr('stroke','#3EAABC').attr('stroke-width',1.8).attr('d',line)
    gData.selectAll('.dot').data(PUISSANCES).join('circle').attr('cx',d=>xBase(d.pwr)).attr('cy',d=>yBase(d.alt)).attr('r',2).attr('fill','#3EAABC').attr('opacity',0.6)

    g.append('line').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',iH).attr('stroke','#E6E6E6').attr('stroke-width',1)
    g.append('text').attr('x',iW/2).attr('y',iH+38).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('Puissance (dBµW)')
    rescaleAxes(xBase, yBase)

    const overlayPwr = g.append('rect').attr('width',iW).attr('height',iH).attr('fill','none').attr('pointer-events','all').style('cursor','crosshair')
    if (showTooltip) {
      overlayPwr.on('mousemove', function(event: MouseEvent) {
        if (!yBaseRef.current||!zoomRef.current) return
        const t = d3.zoomTransform(svgRef.current!), yZ = t.rescaleY(yBaseRef.current)
        const [,my] = d3.pointer(event), alt = yZ.invert(my)
        const iAlt = Math.max(0, Math.min(PUISSANCES.length-1, Math.round((alt-altDebut)/resEch)))
        const svgRect = svgRef.current!.getBoundingClientRect()
        setTooltip({ visible:true, x:event.clientX-svgRect.left-140, y:event.clientY-svgRect.top,
          lines:[`Altitude  : ${Math.round(alt)} m MSL`,`Porte     : ${iAlt+1}`,`Puissance : ${PUISSANCES[iAlt]?.pwr.toFixed(2)} dBµW`] })
      }).on('mouseleave', () => setTooltip(t=>({...t,visible:false})))
    }

    const zoom = d3.zoom<SVGSVGElement,unknown>().scaleExtent([0.5,30])
      .on('zoom',(e:d3.D3ZoomEvent<SVGSVGElement,unknown>)=>{const t=e.transform;gData.attr('transform',t.toString());rescaleAxes(t.rescaleX(xBase),t.rescaleY(yBase))})
    svg.call(zoom).style('cursor','grab'); zoomRef.current=zoom
  }, [width, height, showTooltip, PUISSANCES.length, pMin, pMax, pPad, altMin, altMax, resEch, altDebut, iW, iH, rescaleAxes])

  const scaleBy=(f:number)=>{if(!svgRef.current||!zoomRef.current)return;d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy,f)}
  const reset=()=>{if(!svgRef.current||!zoomRef.current)return;d3.select(svgRef.current).transition().duration(350).call(zoomRef.current.transform,d3.zoomIdentity)}

  return (
    <div className={styles.graphWrapper}>
      <div className={styles.zoomControls}>
        <button className={styles.zoomBtn} onClick={()=>scaleBy(2)}>+</button>
        <button className={styles.zoomBtn} onClick={()=>scaleBy(0.5)}>−</button>
        <button className={styles.zoomBtnReset} onClick={reset}>↺</button>
      </div>
      <svg ref={svgRef} width={width} height={height} className={styles.svg} />
      <Tooltip state={tooltip} />
    </div>
  )
}

/* ── Légendes ── */
function LegendColormap({ dataMin, dataMax }: { dataMin: number; dataMax: number }) {
  const id = 'grad-cm-v'
  const stops = COLORMAP_PALETTE.map((c,i)=><stop key={i} offset={`${(i/(COLORMAP_PALETTE.length-1))*100}%`} stopColor={c}/>)
  return (
    <div className={styles.legendBlock}>
      <span className={styles.legendBlockTitle}>Colormap — amplitude brute</span>
      <div className={styles.legendColormapRow}>
        <span className={styles.legendVal}>{dataMin.toFixed(4)}</span>
        <svg width={180} height={12} style={{display:'block'}}>
          <defs><linearGradient id={id} x1="0" x2="1" y1="0" y2="0">{stops}</linearGradient></defs>
          <rect x={0} y={0} width={180} height={12} fill={`url(#${id})`} rx={3}/>
        </svg>
        <span className={styles.legendVal}>{dataMax.toFixed(4)}</span>
      </div>
    </div>
  )
}
function LegendContours() {
  const cScale = d3.scaleSequential().domain([0.2,0.8]).interpolator(d3.interpolateViridis)
  return (
    <div className={styles.legendBlock}>
      <span className={styles.legendBlockTitle}>Contours — seuils normalisés par porte</span>
      <div className={styles.legendContoursRow}>
        {CONTOUR_THRESHOLDS.map(t=>(
          <div key={t} className={styles.legendContourItem}>
            <svg width={28} height={12}><line x1={0} y1={6} x2={28} y2={6} stroke={cScale(t)} strokeWidth={2.5} strokeLinecap="round"/></svg>
            <span className={styles.legendVal}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Composant principal ── */
export default function SpectreDopplerViewer({ payload }: Props) {
  const leftRef  = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const [leftDims,  setLeft]  = useState({ w: 0, h: 0 })
  const [rightDims, setRight] = useState({ w: 0, h: 0 })
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ courbes: true, colormap: false, contours: false })
  const [showTooltip, setShowTooltip] = useState(false)
  const toggleLayer = (key: LayerKey) => setLayers(prev => ({ ...prev, [key]: !prev[key] }))

  const { altitudes, spectra, velocity, pwr, N, M, resEch, altDebut, vitMax } = useMemo(() => parsePayload(payload), [payload])
  const dataMin = useMemo(() => Math.min(...spectra.map(r=>Math.min(...r))), [spectra])
  const dataMax = useMemo(() => Math.max(...spectra.map(r=>Math.max(...r))), [spectra])

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      entries.forEach(e => {
        const { width, height } = e.contentRect
        if (e.target === leftRef.current)  setLeft ({ w: Math.floor(width), h: Math.floor(height) })
        else                               setRight({ w: Math.floor(width), h: Math.floor(height) })
      })
    })
    if (leftRef.current)  obs.observe(leftRef.current)
    if (rightRef.current) obs.observe(rightRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div className={styles.wrapper}>
      {/* Toggles */}
      <div className={styles.toggleRow}>
        {LAYERS.map(cfg => (
          <button key={cfg.key}
            className={`${styles.toggleBtn} ${layers[cfg.key] ? styles.toggleOn : ''}`}
            style={layers[cfg.key] ? { borderColor: cfg.color, color: cfg.color } : undefined}
            onClick={() => toggleLayer(cfg.key)}
          >
            <span className={styles.toggleDot} style={{ background: layers[cfg.key] ? cfg.color : '#CCCCCC' }}/>
            {cfg.label}
          </button>
        ))}
        <div className={styles.toggleSep} />
        <button
          className={`${styles.toggleBtn} ${showTooltip ? styles.toggleOn : ''}`}
          style={showTooltip ? { borderColor: '#F7BA38', color: '#c9920a' } : undefined}
          onClick={() => setShowTooltip(v => !v)}
        >
          <span className={styles.toggleDot} style={{ background: showTooltip ? '#F7BA38' : '#CCCCCC' }}/>
          Survol
        </button>
      </div>

      {/* Graphes */}
      <div className={styles.graphRow}>
        <div className={styles.graphLeft} ref={leftRef}>
          {leftDims.w > 0 && leftDims.h > 0 && (
            <GraphSpectre width={leftDims.w} height={leftDims.h}
              layers={layers} showTooltip={showTooltip}
              spectra={spectra} velocity={velocity} altitudes={altitudes}
              N={N} M={M} resEch={resEch} altDebut={altDebut} vitMax={vitMax} />
          )}
        </div>
        <div className={styles.graphRight} ref={rightRef}>
          {rightDims.w > 0 && rightDims.h > 0 && (
            <GraphPuissance width={rightDims.w} height={rightDims.h}
              showTooltip={showTooltip}
              pwr={pwr} altitudes={altitudes} resEch={resEch} altDebut={altDebut} />
          )}
        </div>
      </div>

      {/* Légendes */}
      {(layers.colormap || layers.contours) && (
        <div className={styles.legendsRow}>
          {layers.colormap && <LegendColormap dataMin={dataMin} dataMax={dataMax} />}
          {layers.contours && <LegendContours />}
        </div>
      )}
    </div>
  )
}
