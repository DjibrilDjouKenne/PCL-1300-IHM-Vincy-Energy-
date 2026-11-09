'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import styles from './SpectreDopplerGraph.module.css'

const MARGIN_LEFT  = { top: 16, right: 8,  bottom: 44, left: 44 }
const MARGIN_RIGHT = { top: 16, right: 12, bottom: 44, left: 12 }

/* ============================================================
   GRAPHE GAUCHE — Vitesse radiale × Altitude
   ============================================================ */
function GraphVitesse({ width, height }: { width: number; height: number }) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ref.current || width <= 0 || height <= 0) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const m = MARGIN_LEFT
    const iW = width  - m.left - m.right
    const iH = height - m.top  - m.bottom

    const xScale = d3.scaleLinear().domain([-20, 20]).range([0, iW])
    const yScale = d3.scaleLinear().domain([0, 8.60]).range([iH, 0])
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

    // Grilles
    g.append('g')
      .call(d3.axisLeft(yScale).tickValues([0,1,2,3,4,5,6,7,8]).tickSize(-iW).tickFormat(() => ''))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3') })

    g.append('g').attr('transform',`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickValues([-20,-15,-10,-5,0,5,10,15,20]).tickSize(-iH).tickFormat(() => ''))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3') })

    // Axes
    g.append('g')
      .call(d3.axisLeft(yScale).tickValues([0,1,2,3,4,5,6,7,8]).tickSize(4).tickFormat(d => `${d}`))
      .call(ax => { ax.select('.domain').attr('stroke','#CCCCCC'); ax.selectAll('.tick line').attr('stroke','#CCCCCC'); ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial') })

    g.append('g').attr('transform',`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickValues([-20,-15,-10,-5,0,5,10,15,20]).tickSize(4).tickFormat(d => `${d}`))
      .call(ax => { ax.select('.domain').attr('stroke','#CCCCCC'); ax.selectAll('.tick line').attr('stroke','#CCCCCC'); ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial') })

    // Labels
    g.append('text').attr('x',iW/2).attr('y',iH+38).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('VIT. RAD. (m/s)')
    g.append('text').attr('transform','rotate(-90)').attr('x',-iH/2).attr('y',-m.left+12).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('km (MGL)')

    // Ligne zéro
    g.append('line').attr('x1',xScale(0)).attr('y1',0).attr('x2',xScale(0)).attr('y2',iH).attr('stroke','#CCCCCC').attr('stroke-width',1).attr('stroke-dasharray','6,3')
  }, [width, height])

  return <svg ref={ref} width={width} height={height} className={styles.svg} />
}

/* ============================================================
   GRAPHE DROIT — Puissance × Altitude
   ============================================================ */
function GraphPuissance({ width, height }: { width: number; height: number }) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!ref.current || width <= 0 || height <= 0) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const m = MARGIN_RIGHT
    const iW = width  - m.left - m.right
    const iH = height - m.top  - m.bottom

    const xScale = d3.scaleLinear().domain([-30, 80]).range([0, iW])
    const yScale = d3.scaleLinear().domain([0, 8.60]).range([iH, 0])
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`)

    // Grilles
    g.append('g')
      .call(d3.axisLeft(yScale).tickValues([0,1,2,3,4,5,6,7,8]).tickSize(-iW).tickFormat(() => ''))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3') })

    g.append('g').attr('transform',`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickValues([-30,-10,10,30,50,70,80]).tickSize(-iH).tickFormat(() => ''))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('.tick line').attr('stroke','#E6E6E6').attr('stroke-dasharray','3,3') })

    // Axe X
    g.append('g').attr('transform',`translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickValues([-30,0,40,80]).tickSize(4).tickFormat(d => `${d}`))
      .call(ax => { ax.select('.domain').attr('stroke','#CCCCCC'); ax.selectAll('.tick line').attr('stroke','#CCCCCC'); ax.selectAll('.tick text').attr('font-size',10).attr('fill','#3F3F3F').attr('font-family','Arial') })

    g.append('line').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',iH).attr('stroke','#E6E6E6').attr('stroke-width',1)
    g.append('text').attr('x',iW/2).attr('y',iH+38).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#293771').attr('font-family','Arial').text('(dBµW)')
  }, [width, height])

  return <svg ref={ref} width={width} height={height} className={styles.svg} />
}

/* ============================================================
   COMPOSANT PRINCIPAL — 100% responsive (largeur ET hauteur)
   ============================================================ */
export default function SpectreDopplerGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRowRef  = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = graphRowRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ width: Math.floor(width), height: Math.floor(height) })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const wVit = Math.floor(dims.width * 0.75)
  const wPwr = Math.floor(dims.width * 0.25)

  return (
    <div className={styles.wrapper} ref={containerRef}>

      {/* Entête */}
      <div className={styles.header}>
        <div className={styles.headerChips}>
          {['DATE : 16-06-2026','TIME : 08:10:41','DIR : 110.0 – 73.0','F : 1290.0 MHz','SITE : 632','ALT : 430 m']
            .map(c => <span key={c} className={styles.chip}>{c}</span>)}
        </div>
        <div className={styles.headerParams}>
          IPP : 100 µs &nbsp;|&nbsp; NCI : 29 &nbsp;|&nbsp; NFFT : 128 &nbsp;|&nbsp;
          NSP : 50 &nbsp;|&nbsp; NHTS : 70 &nbsp;|&nbsp; PW : 2500 ns &nbsp;|&nbsp; COD.NUM : 0
        </div>
      </div>

      {/* Zone graphes — flex:1 prend tout l'espace restant */}
      <div className={styles.graphRow} ref={graphRowRef}>
        {dims.width > 0 && dims.height > 0 && (
          <>
            <GraphVitesse   width={wVit} height={dims.height} />
            <GraphPuissance width={wPwr} height={dims.height} />
          </>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navBar}>
        <button className={styles.navBtn}>‹</button>
        <span className={styles.navInfo}>Faisceau E — AZ 110° EL 73°</span>
        <button className={styles.navBtn}>›</button>
      </div>

    </div>
  )
}
