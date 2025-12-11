const fs = require('fs');
const path = require('path');

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const frontendPath = path.resolve(__dirname, '../src/telemetry/FEATURE_ORDER.json');
const backendCandidates = [
  path.resolve(__dirname, '../backend/FEATURE_ORDER.json'),
  path.resolve(__dirname, '../backend/app/FEATURE_ORDER.json'),
  path.resolve(__dirname, '../backend/app/constants.py'),
];

const frontend = readJSON(frontendPath);
if (!frontend) {
  console.error('FAIL: frontend FEATURE_ORDER.json not found or invalid at', frontendPath);
  process.exit(2);
}

let backend = null;
let backendPath = null;
for (const p of backendCandidates) {
  if (fs.existsSync(p)) {
    backendPath = p;
    if (p.endsWith('.json')) backend = readJSON(p);
    else if (p.endsWith('.py')) {
      const txt = fs.readFileSync(p, 'utf8');
      const m = txt.match(/FEATURE_ORDER\s*=\s*(\{[\s\S]*?\})/m);
      if (m) {
        try { backend = JSON.parse(m[1]); } catch (e) { backend = null; }
      }
    }
    break;
  }
}

if (!backend) {
  console.error('FAIL: backend FEATURE_ORDER constant not found. Searched:', backendCandidates.join(', '));
  process.exit(3);
}

const fKeys = (frontend.features || []).map(f => f.key);
const bKeys = (backend.features || []).map(f => f.key);

const same = fKeys.length === bKeys.length && fKeys.every((k,i) => k === bKeys[i]);
if (!same) {
  console.error('FAIL: feature key order mismatch between frontend and backend.');
  console.error('frontend keys:', fKeys);
  console.error('backend keys:', bKeys);
  process.exit(4);
}

console.log('PASS: frontend FEATURE_ORDER matches backend constant.');
process.exit(0);
