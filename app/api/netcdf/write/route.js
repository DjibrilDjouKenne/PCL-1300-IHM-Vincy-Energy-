import { spawn } from 'child_process';
import path from 'path';

const PYTHON_PATH = 'C:\\Users\\Admin\\AppData\\Local\\Python\\bin\\python.exe';

export async function POST(req) {
  const body = await req.json();

  return new Promise((resolve) => {
    const proc = spawn(PYTHON_PATH, [
      path.join(process.cwd(), 'scripts', 'write_netcdf.py'),
      JSON.stringify(body),
    ]);

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (d) => (output += d));
    proc.stderr.on('data', (d) => (errorOutput += d));

    proc.on('error', (err) => {
      console.error('SPAWN ERROR:', err);
      resolve(Response.json({ error: 'spawn failed: ' + err.message }, { status: 500 }));
    });

    proc.on('close', (code) => {
      console.log('--- Python process closed ---');
      console.log('exit code:', code);
      console.log('stdout:', JSON.stringify(output));
      console.log('stderr:', JSON.stringify(errorOutput));

      if (code !== 0 || !output.trim()) {
        resolve(Response.json({ error: errorOutput || 'empty output' }, { status: 500 }));
      } else {
        resolve(Response.json(JSON.parse(output)));
      }
    });
  });
}