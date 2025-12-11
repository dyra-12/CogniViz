const fs = require('fs');
const path = require('path');

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const txt = fs.readFileSync(p,'utf8');
  const out = {};
  txt.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) return;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1,-1);
    }
    out[m[1]] = v;
  });
  return out;
}

const root = path.resolve(__dirname, '..');
const envLocal = loadEnvFile(path.join(root, '.env.local'));
const env = loadEnvFile(path.join(root, '.env'));

const envVal = envLocal.VITE_COG_LOAD_MODE || env.VITE_COG_LOAD_MODE || 'live';
const raw = String(envVal).toLowerCase();
const isSimulation = raw.includes('sim');
const expectedEmoji = isSimulation ? '🟠' : '🔵';
const expectedLabel = isSimulation ? 'Simulation Mode' : 'Live Mode';

console.log('VITE_COG_LOAD_MODE resolved to:', envVal);
console.log('Expected badge:', expectedEmoji, expectedLabel);
process.exit(0);
