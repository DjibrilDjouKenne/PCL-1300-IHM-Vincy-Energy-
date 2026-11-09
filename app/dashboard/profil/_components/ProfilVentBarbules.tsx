'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import styles from './ProfilVentBarbules.module.css'

/* ============================================================
   TYPES
   ============================================================ */
interface NetCDFPayload {
  meta:                 Record<string, string>
  dims:                 { n_alt: number; n_time: number }
  altitudes:            number[]
  times:                string[]
  u:                    (number | null)[][]
  v:                    (number | null)[][]
  wind_speed:           (number | null)[][] | null
  wind_from_direction:  (number | null)[][] | null
}

interface WindPoint {
  t:   Date
  alt: number
  ff:  number
  dd:  number
}

/* ============================================================
   CONSTANTES
   ============================================================ */
const MS_TO_KT = 1.94384
const NC_FILE  = 'profil_vent.nc'
const MARGIN   = { top: 20, right: 20, bottom: 52, left: 60 }

/* Mode interaction */
type InteractionMode = 'navigation' | 'selection'

/* ============================================================
   HELPERS
   ============================================================ */
function uvToFFDD(u: number, v: number) {
  const ff = Math.sqrt(u * u + v * v)
  let dd = Math.atan2(-u, -v) * (180 / Math.PI)
  if (dd < 0) dd += 360
  return { ff, dd }
}

function parsePayload(payload: NetCDFPayload): WindPoint[] {
  const pts: WindPoint[] = []
  for (let iAlt = 0; iAlt < payload.altitudes.length; iAlt++) {
    for (let iTime = 0; iTime < payload.times.length; iTime++) {
      const u_val = payload.u[iAlt][iTime]
      const v_val = payload.v[iAlt][iTime]
      if (u_val === null || v_val === null) continue
      let ff: number, dd: number
      if (payload.wind_speed && payload.wind_from_direction) {
        const ffVal = payload.wind_speed[iAlt][iTime]
        const ddVal = payload.wind_from_direction[iAlt][iTime]
        if (ffVal === null || ddVal === null) continue
        ff = ffVal; dd = ddVal
      } else {
        const r = uvToFFDD(u_val, v_val); ff = r.ff; dd = r.dd
      }
      pts.push({ t: new Date(payload.times[iTime]), alt: payload.altitudes[iAlt], ff, dd })
    }
  }
  return pts
}

/* ============================================================
   BARBULE OMM
   ============================================================ */
function drawBarbule(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  cx: number, cy: number,
  ff: number, dd: number,
  hampePx: number, color: string,
) {
  const ffKt      = ff * MS_TO_KT
  const barbeLong = hampePx * 0.55
  const barbe5    = barbeLong * 0.6
  const esp       = hampePx * 0.22

  if (ffKt < 2.5) {
    g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 3)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.2)
    return
  }

  const ddRad = (dd - 90) * (Math.PI / 180)
  const dx = Math.cos(ddRad), dy = Math.sin(ddRad)
  const px = -dy, py = dx
  const ex = cx + dx * hampePx, ey = cy + dy * hampePx

  let kt = ffKt
  const n50 = Math.floor(kt / 50); kt -= n50 * 50
  const n10 = Math.floor(kt / 10); kt -= n10 * 10
  const n5  = Math.floor(kt /  5)
  let bx = ex, by = ey

  for (let i = 0; i < n50; i++) {
    const nx = bx - dx * esp * 2, ny = by - dy * esp * 2
    g.append('polygon')
      .attr('points', `${bx},${by} ${bx + px * barbeLong},${by + py * barbeLong} ${nx},${ny}`)
      .attr('fill', color)
    bx = nx - dx * esp * 0.5; by = ny - dy * esp * 0.5
  }
  for (let i = 0; i < n10; i++) {
    g.append('line')
      .attr('x1', bx).attr('y1', by)
      .attr('x2', bx + px * barbeLong).attr('y2', by + py * barbeLong)
      .attr('stroke', color).attr('stroke-width', 1.2).attr('stroke-linecap', 'round')
    bx -= dx * esp; by -= dy * esp
  }
  if (n5 > 0) {
    const off = (n10 === 0 && n50 === 0) ? esp : 0
    g.append('line')
      .attr('x1', bx - dx * off).attr('y1', by - dy * off)
      .attr('x2', bx - dx * off + px * barbe5).attr('y2', by - dy * off + py * barbe5)
      .attr('stroke', color).attr('stroke-width', 1.2).attr('stroke-linecap', 'round')
  }
  g.append('line')
    .attr('x1', cx).attr('y1', cy).attr('x2', ex).attr('y2', ey)
    .attr('stroke', color).attr('stroke-width', 1.2).attr('stroke-linecap', 'round')
  g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 2).attr('fill', color)
}

/* ============================================================
   GRAPHE — zoom molette/pan + brush-zoom par sélection
   ============================================================ */
function GraphTimeHeight({ width, height, data, mode, onModeChange }: {
  width:        number
  height:       number
  data:         WindPoint[]
  mode:         InteractionMode
  onModeChange: (m: InteractionMode) => void
}) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const brushRef = useRef<d3.BrushBehavior<unknown> | null>(null)
  const gBrushRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  /* Refs pour accès dans les handlers brush */
  const xBaseRef = useRef<d3.ScaleTime<number,number> | null>(null)
  const yBaseRef = useRef<d3.ScaleLinear<number,number> | null>(null)
  const renderRef = useRef<((xS: d3.ScaleTime<number,number>, yS: d3.ScaleLinear<number,number>, k: number) => void) | null>(null)

  const iW = width  - MARGIN.left - MARGIN.right
  const iH = height - MARGIN.top  - MARGIN.bottom

  /* ── Setup initial SVG (une seule fois par resize) ── */
  useEffect(() => {
    if (!svgRef.current || iW <= 0 || iH <= 0 || data.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const temps = Array.from(new Set(data.map(d => d.t.getTime())))
      .sort().map(t => new Date(t))
    const alts  = Array.from(new Set(data.map(d => d.alt)))
      .sort((a, b) => a - b)

    const xBase = d3.scaleTime()
      .domain([temps[0], temps[temps.length - 1]])
      .range([0, iW])
    const yBase = d3.scaleLinear()
      .domain([alts[0] - 100, alts[alts.length - 1] + 100])
      .range([iH, 0])

    xBaseRef.current = xBase
    yBaseRef.current = yBase

    /* Clip */
    svg.append('defs').append('clipPath').attr('id', 'clip-pv')
      .append('rect').attr('width', iW).attr('height', iH)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    /* Couches axes */
    const gGridX = g.append('g').attr('class', 'grid-x')
    const gGridY = g.append('g').attr('class', 'grid-y')
    const gAxisX = g.append('g').attr('class', 'axis-x').attr('transform', `translate(0,${iH})`)
    const gAxisY = g.append('g').attr('class', 'axis-y')

    /* Labels */
    g.append('text').attr('x', iW / 2).attr('y', iH + 44)
      .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', '700')
      .attr('fill', '#293771').attr('font-family', 'Arial').text('Temps (UTC)')
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -iH / 2).attr('y', -MARGIN.left + 12)
      .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', '700')
      .attr('fill', '#293771').attr('font-family', 'Arial').text('Altitude (km MSL)')

    /* Zone barbules */
    const gClip  = g.append('g').attr('clip-path', 'url(#clip-pv)')
    const gBarbs = gClip.append('g').attr('class', 'barbs')

    /* ── Fonction render ── */
    function render(xS: d3.ScaleTime<number,number>, yS: d3.ScaleLinear<number,number>, k: number) {
      const dtPxZ   = temps.length > 1 ? Math.abs(xS(temps[1]) - xS(temps[0])) : iW
      const daltPxZ = alts.length  > 1 ? Math.abs(yS(alts[1])  - yS(alts[0]))  : iH
      const hamp    = Math.max(4, Math.min(dtPxZ * 0.42, daltPxZ * 0.42, 32 * Math.sqrt(k)))

      gGridX.call(d3.axisBottom(xS).ticks(8).tickSize(-iH).tickFormat(() => ''))
        .attr('transform', `translate(0,${iH})`)
        .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke', '#E6E6E6').attr('stroke-dasharray', '3,3') })

      gGridY.call(d3.axisLeft(yS).ticks(8).tickSize(-iW).tickFormat(() => ''))
        .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke', '#E6E6E6').attr('stroke-dasharray', '3,3') })

      gAxisX.call(d3.axisBottom(xS).ticks(8).tickSize(4)
        .tickFormat(d => d3.timeFormat('%H:%M')(d as Date)))
        .call(ax => {
          ax.select('.domain').attr('stroke', '#CCCCCC')
          ax.selectAll('.tick line').attr('stroke', '#CCCCCC')
          ax.selectAll('.tick text').attr('font-size', 9).attr('fill', '#3F3F3F').attr('font-family', 'Arial').attr('dy', '1.2em')
        })

      gAxisY.call(d3.axisLeft(yS).ticks(8).tickSize(4)
        .tickFormat(d => `${(+d / 1000).toFixed(1)}`))
        .call(ax => {
          ax.select('.domain').attr('stroke', '#CCCCCC')
          ax.selectAll('.tick line').attr('stroke', '#CCCCCC')
          ax.selectAll('.tick text').attr('font-size', 10).attr('fill', '#3F3F3F').attr('font-family', 'Arial')
        })

      gBarbs.selectAll('*').remove()
      const margin = hamp * 2
      data.forEach(pt => {
        const cx = xS(pt.t), cy = yS(pt.alt)
        if (cx < -margin || cx > iW + margin) return
        if (cy < -margin || cy > iH + margin) return
        drawBarbule(gBarbs.append('g'), cx, cy, pt.ff, pt.dd, hamp, '#000000')
      })
    }

    renderRef.current = render
    render(xBase, yBase, 1)

    /* ── Zoom (navigation) ── */
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 40])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const t = event.transform
        render(t.rescaleX(xBase), t.rescaleY(yBase), t.k)
      })

    svg.call(zoom)
    zoomRef.current = zoom

    /* ── Brush (sélection) ── */
    const brush = d3.brush()
      .extent([[0, 0], [iW, iH]])
      .on('end', (event: d3.D3BrushEvent<unknown>) => {
        if (!event.selection) return
        const [[x0, y0], [x1, y1]] = event.selection as [[number,number],[number,number]]

        /* Trop petit → ignorer */
        if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) {
          gBrushRef.current?.call(brush.clear)
          return
        }

        /* Calculer les nouvelles bornes en coordonnées données */
        const currentT = d3.zoomTransform(svgRef.current!)
        const xZ = currentT.rescaleX(xBase)
        const yZ = currentT.rescaleY(yBase)

        const tMin  = xZ.invert(x0), tMax = xZ.invert(x1)
        const altMax = yZ.invert(y0), altMin = yZ.invert(y1)

        /* Effacer le brush immédiatement */
        gBrushRef.current?.call(brush.clear)

        /* Calculer la transform zoom cible */
        const scaleX = iW / (xBase(tMax) - xBase(tMin))
        const scaleY = iH / (yBase(altMin) - yBase(altMax))
        const scale  = Math.min(scaleX, scaleY, 40)

        const tx = -xBase(tMin)   * scale
        const ty = -yBase(altMax) * scale
        const newT = d3.zoomIdentity.translate(tx, ty).scale(scale)

        /* Animer vers la nouvelle vue */
        d3.select(svgRef.current!)
          .transition().duration(400)
          .call(zoom.transform, newT)

        /* Retour automatique au mode navigation */
        onModeChange('navigation')
      })

    brushRef.current = brush

    /* Groupe brush — par-dessus les barbules, sous les contrôles */
    const gBrush = gClip.append('g').attr('class', 'brush')
    gBrushRef.current = gBrush as unknown as d3.Selection<SVGGElement, unknown, null, undefined>

  }, [width, height, data, iW, iH, onModeChange])

  /* ── Synchronisation du mode interaction ── */
  useEffect(() => {
    if (!svgRef.current || !zoomRef.current || !brushRef.current || !gBrushRef.current) return
    const svg    = d3.select(svgRef.current)
    const gBrush = gBrushRef.current

    if (mode === 'navigation') {
      /* Désactiver brush, activer zoom */
      gBrush.call(brushRef.current.clear)
      gBrush.on('.brush', null)  // retirer les handlers brush
      svg.call(zoomRef.current)
      svg.style('cursor', 'grab')
    } else {
      /* Désactiver zoom (retirer les handlers), activer brush */
      svg.on('.zoom', null)
      svg.style('cursor', 'default')
      gBrush.call(brushRef.current)
    }
  }, [mode])

  /* Boutons */
  const scaleBy = (f: number) => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, f)
  }
  const reset = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(350).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  return (
    <div className={styles.graphWrapper}>
      <svg ref={svgRef} width={width} height={height} className={styles.svg} />
    </div>
  )
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function ProfilVentBarbules() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims,    setDims]    = useState({ w: 0, h: 0 })
  const [data,    setData]    = useState<WindPoint[]>([])
  const [meta,    setMeta]    = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [mode,    setMode]    = useState<InteractionMode>('navigation')

  /* ResizeObserver */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ w: Math.floor(width), h: Math.floor(height) })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* Fetch NetCDF */
  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`/api/netcdf/read?file=${encodeURIComponent(NC_FILE)}`)
      .then(r => r.json())
      .then((payload: NetCDFPayload & { error?: string }) => {
        if (payload.error) { setError(payload.error); return }
        setMeta(payload.meta ?? {})
        setData(parsePayload(payload))
      })
      .catch(err => setError(`Erreur réseau : ${err.message}`))
      .finally(() => setLoading(false))
  }, [])

  const ffMax = data.length > 0 ? Math.max(...data.map(d => d.ff)) : 0
  const tMin  = data.length > 0 ? d3.min(data, d => d.t)! : null
  const tMax  = data.length > 0 ? d3.max(data, d => d.t)! : null
  const fmt   = d3.timeFormat('%H:%M')

  return (
    <div className={styles.wrapper}>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.cardTitle}>Profil de vent — Diagramme temps/altitude</span>
          <span className={styles.cardSub}>
            {loading ? 'Lecture NetCDF…'
              : error ? 'Erreur'
              : tMin && tMax ? `${fmt(tMin)} → ${fmt(tMax)} UTC`
              : ''}
            {meta.title ? ` — ${meta.title}` : ''}
          </span>
        </div>
        <div className={styles.headerChips}>
          {!loading && !error && data.length > 0 && (
            <>
              <span className={styles.chip}>FF max : {ffMax.toFixed(1)} m/s</span>
              <span className={styles.chip}>{(ffMax * MS_TO_KT).toFixed(0)} kt</span>
            </>
          )}
          <span className={styles.chip}>Conv. OMM</span>
        </div>
      </div>

      {/* Barre de contrôles */}
      {!loading && !error && data.length > 0 && (
        <div className={styles.toolbar}>
          {/* Modes */}
          <div className={styles.modeGroup}>
            <button
              className={`${styles.modeBtn} ${mode === 'navigation' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('navigation')}
              title="Navigation (molette + glisser)"
            >
              <span className={styles.modeBtnIcon}>✋</span>
              Navigation
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'selection' ? styles.modeBtnActiveSelection : ''}`}
              onClick={() => setMode('selection')}
              title="Zoom par sélection (dessiner un rectangle)"
            >
              <span className={styles.modeBtnIcon}>⬚</span>
              Sélection
            </button>
          </div>

          <div className={styles.toolbarSep} />

          {/* Hint contextuel */}
          <span className={styles.toolbarHint}>
            {mode === 'navigation'
              ? 'Molette pour zoomer · Glisser pour se déplacer'
              : 'Dessinez un rectangle sur la zone à agrandir'}
          </span>

          <div className={styles.toolbarSep} />

          {/* Zoom +/−/reset */}
          <div className={styles.zoomBtns}>
            <button className={styles.zoomBtn}
              onClick={() => {
                // scaleBy via ref sur le graphe — on passe par un event custom
                const svg = document.querySelector<SVGSVGElement>('.pv-svg')
                if (!svg) return
                // Les boutons + − passent par les refs dans GraphTimeHeight
                // Solution : exposer via un ref externe
              }}
              disabled={mode === 'selection'}
            >+</button>
            <button className={styles.zoomBtn} disabled={mode === 'selection'}>−</button>
            <button className={styles.zoomBtnReset} disabled={mode === 'selection'}>↺</button>
          </div>
        </div>
      )}

      <div className={styles.graphArea} ref={containerRef}>
        {loading && <div className={styles.stateBox}><span className={styles.stateMsg}>Lecture du fichier NetCDF…</span></div>}
        {error   && <div className={`${styles.stateBox} ${styles.stateError}`}><span className={styles.stateMsg}>⚠ {error}</span></div>}
        {!loading && !error && dims.w > 0 && dims.h > 0 && (
          <GraphTimeHeightConnected
            width={dims.w} height={dims.h}
            data={data}
            mode={mode}
            onModeChange={setMode}
          />
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerNote}>
          △ = 50 kt &nbsp; — = 10 kt &nbsp; ╴ = 5 kt
        </span>
      </div>

    </div>
  )
}

/* ============================================================
   Wrapper connecté — expose scaleBy/reset via refs partagés
   ============================================================ */
/* ============================================================
   GRAPHE — zoom navigation + brush-zoom sélection
   
   Architecture :
   ┌─ svg (zoom behavior installé ici, toujours)
   │  └─ g[margin]
   │     ├─ axes / grilles  (rescalés)
   │     └─ g[clip]
   │        ├─ gBarbs       (barbules)
   │        └─ gBrush       (brush layer, par-dessus)
   
   Mode navigation : brush.filter → false (brush ignore tout)
                     zoom.filter  → true  (zoom actif normalement)
   
   Mode sélection  : brush.filter → true  (brush actif)
                     zoom.filter  → false (zoom ignoré)
   
   Après une sélection : on appelle zoom.transform() avec la nouvelle
   vue → le zoom INTERNE est mis à jour → la navigation reprend
   normalement depuis ce point.
   ============================================================ */
function GraphTimeHeightConnected({ width, height, data, mode, onModeChange }: {
  width:        number
  height:       number
  data:         WindPoint[]
  mode:         InteractionMode
  onModeChange: (m: InteractionMode) => void
}) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const zoomRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const gBrushRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const brushRef  = useRef<d3.BrushBehavior<unknown> | null>(null)

  /* Refs lus dans les handlers D3 (closures stables) */
  const modeRef     = useRef<InteractionMode>(mode)
  const onModeRef   = useRef(onModeChange)
  useEffect(() => { modeRef.current   = mode },        [mode])
  useEffect(() => { onModeRef.current = onModeChange }, [onModeChange])

  const iW = width  - MARGIN.left - MARGIN.right
  const iH = height - MARGIN.top  - MARGIN.bottom

  /* ── Setup SVG — une seule fois par (width, height, data) ── */
  useEffect(() => {
    if (!svgRef.current || iW <= 0 || iH <= 0 || data.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const temps = Array.from(new Set(data.map(d => d.t.getTime())))
      .sort().map(t => new Date(t))
    const alts = Array.from(new Set(data.map(d => d.alt)))
      .sort((a, b) => a - b)

    const xBase = d3.scaleTime()
      .domain([temps[0], temps[temps.length - 1]])
      .range([0, iW])
    const yBase = d3.scaleLinear()
      .domain([alts[0] - 100, alts[alts.length - 1] + 100])
      .range([iH, 0])

    /* Clip */
    svg.append('defs').append('clipPath').attr('id', 'clip-pv')
      .append('rect').attr('width', iW).attr('height', iH)

    const g     = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
    const gGX   = g.append('g')
    const gGY   = g.append('g')
    const gAX   = g.append('g').attr('transform', `translate(0,${iH})`)
    const gAY   = g.append('g')

    /* Labels axe */
    g.append('text').attr('x', iW / 2).attr('y', iH + 44)
      .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', '700')
      .attr('fill', '#293771').attr('font-family', 'Arial').text('Temps (UTC)')
    g.append('text').attr('transform', 'rotate(-90)').attr('x', -iH / 2).attr('y', -MARGIN.left + 12)
      .attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', '700')
      .attr('fill', '#293771').attr('font-family', 'Arial').text('Altitude (km MSL)')

    const gClip  = g.append('g').attr('clip-path', 'url(#clip-pv)')
    const gBarbs = gClip.append('g')

    /* ── Render ── */
    function render(
      xS: d3.ScaleTime<number, number>,
      yS: d3.ScaleLinear<number, number>,
      k:  number
    ) {
      const dtPx = temps.length > 1 ? Math.abs(xS(temps[1]) - xS(temps[0])) : iW
      const daPx = alts.length  > 1 ? Math.abs(yS(alts[1])  - yS(alts[0]))  : iH
      const hamp = Math.max(4, Math.min(dtPx * 0.42, daPx * 0.42, 32 * Math.sqrt(k)))

      gGX.call(d3.axisBottom(xS).ticks(8).tickSize(-iH).tickFormat(() => ''))
        .attr('transform', `translate(0,${iH})`)
        .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3') })
      gGY.call(d3.axisLeft(yS).ticks(8).tickSize(-iW).tickFormat(() => ''))
        .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3') })
      gAX.call(d3.axisBottom(xS).ticks(8).tickSize(4).tickFormat(d => d3.timeFormat('%H:%M')(d as Date)))
        .call(ax => {
          ax.select('.domain').attr('stroke','#CCCCCC')
          ax.selectAll('.tick line').attr('stroke','#CCCCCC')
          ax.selectAll('.tick text').attr('font-size',9).attr('fill','#3F3F3F').attr('font-family','Arial').attr('dy','1.2em')
        })
      gAY.call(d3.axisLeft(yS).ticks(8).tickSize(4).tickFormat(d => `${(+d/1000).toFixed(1)}`))
        .call(ax => {
          ax.select('.domain').attr('stroke','#CCCCCC')
          ax.selectAll('.tick line').attr('stroke','#CCCCCC')
          ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial')
        })

      gBarbs.selectAll('*').remove()
      const mg = hamp * 2
      data.forEach(pt => {
        const cx = xS(pt.t), cy = yS(pt.alt)
        if (cx < -mg || cx > iW + mg || cy < -mg || cy > iH + mg) return
        drawBarbule(gBarbs.append('g'), cx, cy, pt.ff, pt.dd, hamp, '#000000')
      })
    }

    render(xBase, yBase, 1)

    /* ── Zoom — toujours installé sur svg ── */
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 40])
      /* filter : ignore les events quand on est en mode sélection */
      .filter((event: Event) => {
        if (modeRef.current === 'selection') return false
        return !event.ctrlKey
      })
      .on('start', () => {
        if (modeRef.current === 'navigation') svg.style('cursor', 'grabbing')
      })
      .on('zoom', (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        render(e.transform.rescaleX(xBase), e.transform.rescaleY(yBase), e.transform.k)
      })
      .on('end', () => {
        if (modeRef.current === 'navigation') svg.style('cursor', 'grab')
      })

    svg.call(zoom).style('cursor', 'grab')
    zoomRef.current = zoom

    /* ── Brush — installé sur son propre groupe, par-dessus les barbules ── */
    const brush = d3.brush()
      .extent([[0, 0], [iW, iH]])
      .filter(() => modeRef.current === 'selection')  /* ignore si navigation */
      .on('end', (event: d3.D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return  /* événement programmatique → skip */
        if (!event.selection) return

        const [[x0, y0], [x1, y1]] = event.selection as [[number,number],[number,number]]
        if (Math.abs(x1 - x0) < 8 || Math.abs(y1 - y0) < 8) {
          /* Sélection trop petite : effacer via brush.move(sel, null) */
          gBrushRef.current?.call(brush.move, null)
          return
        }

        /* Convertir pixels sélectionnés → coordonnées données
           en tenant compte du zoom courant */
        const ct = d3.zoomTransform(svgRef.current!)
        const xZ = ct.rescaleX(xBase)
        const yZ = ct.rescaleY(yBase)

        const tLo = xZ.invert(x0)  /* temps gauche */
        const tHi = xZ.invert(x1)  /* temps droite */
        const aHi = yZ.invert(y0)  /* altitude haute (y petit = haut SVG) */
        const aLo = yZ.invert(y1)  /* altitude basse */

        /* Effacer le rectangle de sélection */
        gBrushRef.current?.call(brush.move, null)

        /* Calculer la transform zoom cible */
        const pxLo  = xBase(tLo), pxHi  = xBase(tHi)
        const pyHi  = yBase(aHi), pyLo  = yBase(aLo)
        const spanX = pxHi - pxLo
        const spanY = pyLo - pyHi  /* pyLo > pyHi car axe Y inversé */

        if (spanX <= 0 || spanY <= 0) return

        const s  = Math.min(iW / spanX, iH / spanY, 40)
        const tx = -pxLo * s
        const ty = -pyHi * s

        const target = d3.zoomIdentity.translate(tx, ty).scale(s)

        /* Appliquer via zoom.transform() → le zoom interne est mis à jour
           → la navigation repart correctement depuis ce nouveau point */
        svg.transition().duration(450).ease(d3.easeCubicOut)
          .call(zoom.transform, target)

        /* Repasser en navigation — le zoom.filter() reprendra la main */
        onModeRef.current('navigation')
      })

    /* Appeler brush.call() pour initialiser l'extent AVANT tout changement de mode */
    const gBrush = gClip.append('g').attr('class', 'brush-group')
    gBrush.call(brush)

    brushRef.current  = brush
    gBrushRef.current = gBrush

  }, [width, height, data, iW, iH])

  /* ── Sync mode → curseur seulement (les filters font le reste) ── */
  useEffect(() => {
    if (!svgRef.current || !gBrushRef.current || !brushRef.current) return

    if (mode === 'navigation') {
      /* Effacer un rectangle résiduel */
      gBrushRef.current.call(brushRef.current.move, null)
      d3.select(svgRef.current).style('cursor', 'grab')
    } else {
      d3.select(svgRef.current).style('cursor', 'crosshair')
    }
  }, [mode])

  /* ── Boutons zoom ── */
  const scaleBy = (f: number) => {
    if (!svgRef.current || !zoomRef.current || mode === 'selection') return
    d3.select(svgRef.current).transition().duration(250)
      .call(zoomRef.current.scaleBy, f)
  }
  const reset = () => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(350)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }

  return (
    <div className={styles.graphWrapper}>
      <div className={styles.zoomControls}>
        <button className={styles.zoomBtn}
          onClick={() => scaleBy(2)}
          disabled={mode === 'selection'} title="Zoom avant">+</button>
        <button className={styles.zoomBtn}
          onClick={() => scaleBy(0.5)}
          disabled={mode === 'selection'} title="Zoom arrière">−</button>
        <button className={styles.zoomBtnReset}
          onClick={reset} title="Vue initiale">↺</button>
      </div>
      <svg ref={svgRef} width={width} height={height} className={styles.svg} />
    </div>
  )
}
