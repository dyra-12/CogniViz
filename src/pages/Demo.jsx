import React, { useEffect } from 'react';
import { useSimStream } from '../hooks/useSimStream';

const Gauge = ({ value, classLabel }) => {
  const percentage = Math.round(value * 100);
  const color = classLabel === 'High' ? '#ef4444' : '#3b82f6';
  
  return (
    <div style={{ width: 200, height: 200, borderRadius: '50%', border: `8px solid ${color}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.3s ease' }}>
      <div style={{ position: 'absolute', bottom: 10, fontSize: 12, color: '#666' }}>Cognitive Load</div>
      <div style={{ fontSize: 28, fontWeight: 600, color }}>{percentage}%</div>
    </div>
  );
};

const TopFactors = ({ factors }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Top 3 factors</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {factors.map((f) => (
          <li key={f.name} style={{ marginBottom: 4 }}>
            {f.name} <span style={{ color: '#888', fontSize: '0.9em' }}>({Math.round(f.value * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ExplanationBanner = ({ text, classLabel }) => {
  const bgColor = classLabel === 'High' ? '#FEE2E2' : '#F0F4FF';
  const textColor = classLabel === 'High' ? '#991B1B' : '#1F3B7A';
  const borderColor = classLabel === 'High' ? '#FECACA' : '#D6E0FF';
  
  return (
    <div style={{ background: bgColor, color: textColor, border: `1px solid ${borderColor}`, padding: '10px 12px', borderRadius: 8, fontSize: 14, transition: 'all 0.3s ease' }}>
      {text}
    </div>
  );
};

const ModeBadge = () => {
  const mode = import.meta.env.VITE_COG_LOAD_MODE;
  const isSimulation = String(mode).toLowerCase() === 'simulation';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '120px', marginBottom: '16px' }}>
      {isSimulation && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF5E6', color: '#9A5B00', border: '1px solid #FFD8A8', borderRadius: 999, padding: '6px 16px', fontSize: 15, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <span style={{ fontSize: 18 }}>🟠</span> Simulation Mode
        </span>
      )}
    </div>
  );
};

export default function Demo() {
  const debugTelemetry = String(import.meta.env.VITE_ENABLE_DEBUG_TELEMETRY || '').toLowerCase() === 'true';
  const streamData = useSimStream();

  useEffect(() => {
    if (debugTelemetry) {
      // Minimal debug logging respecting env flag
      // eslint-disable-next-line no-console
      console.log('[Demo] Telemetry: view_demo', {
        mode: import.meta.env.VITE_COG_LOAD_MODE,
        at: new Date().toISOString(),
      });
    }
  }, [debugTelemetry]);
  
  // Show loading state until stream starts
  if (!streamData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
        <div style={{ fontSize: 16, color: '#888' }}>Loading simulation...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc', padding: 24 }}>
      <div style={{ width: 720, maxWidth: '92vw', minHeight: 420, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'center' }}>
          <Gauge value={streamData.probs.high} classLabel={streamData.class} />
          <TopFactors factors={streamData.shapTop} />
        </div>
        <ModeBadge />
        <div style={{ marginTop: 20 }}>
          <ExplanationBanner text={streamData.text} classLabel={streamData.class} />
        </div>
      </div>
    </div>
  );
}
