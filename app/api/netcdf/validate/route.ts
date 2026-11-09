import { NextRequest, NextResponse } from 'next/server'
import { spawn }                     from 'child_process'
import { writeFile, unlink }         from 'fs/promises'
import path                          from 'path'
import os                            from 'os'

/* ============================================================
   POST /api/netcdf/validate
   Body : FormData { file: File, type: string }
   Retourne : { dims, vars, meta, payload? } ou { error }
   ============================================================ */
export async function POST(req: NextRequest) {
  let tmpPath = ''
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    // Sécurité extension
    const ext = path.extname(file.name).toLowerCase()
    if (!['.nc', '.nc4', '.cdf'].includes(ext))
      return NextResponse.json({ error: `Extension non autorisée : ${ext}` }, { status: 400 })

    // Écriture temporaire
    const buf = Buffer.from(await file.arrayBuffer())
    tmpPath   = path.join(os.tmpdir(), `vis_${Date.now()}${ext}`)
    await writeFile(tmpPath, buf)

    const scriptPath = path.join(process.cwd(), 'scripts', 'read_netcdf.py')

    const json = await new Promise<string>((resolve, reject) => {
      let out = '', err = ''
      const proc = spawn('python', [scriptPath, tmpPath], { timeout: 30_000 })
      proc.stdout.on('data', c => { out += c.toString() })
      proc.stderr.on('data', c => { err += c.toString() })
      proc.on('close', code => {
        if (code !== 0 && !out.startsWith('{')) reject(new Error(err.slice(0, 300)))
        else resolve(out.trim())
      })
      proc.on('error', e => reject(new Error(`Python: ${e.message}`)))
    })

    const data = JSON.parse(json)
    if (data.error) return NextResponse.json({ error: data.error }, { status: 500 })

    // Résumé pour validation côté client
    return NextResponse.json({
      dims:    data.dims,
      vars:    data.vars ?? Object.keys(data).filter(k => !['meta','dims','altitudes','times'].includes(k) && Array.isArray(data[k])),
      meta:    data.meta,
      payload: data,        // payload complet transmis au viewer
    })

  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  } finally {
    if (tmpPath) unlink(tmpPath).catch(() => {})
  }
}
