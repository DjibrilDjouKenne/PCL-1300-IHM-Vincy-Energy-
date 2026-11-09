import { NextRequest, NextResponse } from 'next/server'
import { spawn }                     from 'child_process'
import path                          from 'path'

/* ============================================================
   GET /api/netcdf/read?file=mon_fichier.nc
   - file : nom du fichier dans /public/ (obligatoire)
   ============================================================ */
export async function GET(req: NextRequest) {

  /* Paramètre ?file= */
  const filename = req.nextUrl.searchParams.get('file')

  if (!filename) {
    return NextResponse.json(
      { error: 'Paramètre "file" manquant. Usage : /api/netcdf/read?file=profil.nc' },
      { status: 400 }
    )
  }

  /* Sécurité : on n'autorise que les .nc et .cdf, pas de path traversal */
  const safeName = path.basename(filename)
  if (!/\.(nc|cdf|nc4)$/i.test(safeName)) {
    return NextResponse.json(
      { error: 'Extension non autorisée — seuls .nc, .nc4, .cdf sont acceptés' },
      { status: 400 }
    )
  }

  /* Chemins absolus */
  const rootDir    = process.cwd()
  const scriptPath = path.join(rootDir, 'scripts', 'read_netcdf.py')
  const filePath   = path.join(rootDir, 'public',  safeName)
const PYTHON_PATH = "C:\\Users\\DIBLIL\\AppData\\Local\\Python\\bin\\python.exe"


  /* Exécution du script Python */
  const json = await new Promise<string>((resolve, reject) => {
    let stdout = ''
    let stderr = ''

    const proc = spawn(PYTHON_PATH, [scriptPath, filePath], {
      timeout: 30_000, // 30s max
    })

    proc.stdout.on('data', chunk => { stdout += chunk.toString() })
    proc.stderr.on('data', chunk => { stderr += chunk.toString() })
    
    proc.on('close', code => {
      if (code !== 0 && !stdout.startsWith('{')) {
        reject(new Error(`Python exit ${code} — ${stderr.slice(0, 300)}`))
      } else {
        resolve(stdout.trim())
      }
    })

    proc.on('error', err => {
      reject(new Error(`Impossible de lancer Python : ${err.message}`))
    })
  }).catch(err => {
    return JSON.stringify({ error: err.message })
  })

  /* Parse et retourne */
  try {
    const data = JSON.parse(json)
    if (data.error) {
      return NextResponse.json(data, { status: 500 })
    }
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Réponse Python non parsable', raw: json.slice(0, 500) },
      { status: 500 }
    )
  }
}
