import React, { useEffect } from 'react';

const Gauge = () => {
  return (
    <div style={{ width: 200, height: 200, borderRadius: '50%', border: '8px solid #ddd', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', bottom: 10, fontSize: 12, color: '#666' }}>Cognitive Load</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>62%</div>
    </div>
  );
};

const TopFactors = () => {
  const factors = ['Task switching', 'Time pressure', 'Information density'];
  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Top 3 factors</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {factors.map((f) => (
          <li key={f} style={{ marginBottom: 4 }}>{f}</li>
        ))}
      </ul>
    </div>
  );
};

const ExplanationBanner = () => {
  return (
    <div style={{ background: '#F0F4FF', color: '#1F3B7A', border: '1px solid #D6E0FF', padding: '10px 12px', borderRadius: 8, fontSize: 14 }}>
      This demo shows a simulated cognitive load and contributing factors.
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc', padding: 24 }}>
      <div style={{ width: 720, maxWidth: '92vw', minHeight: 420, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'center' }}>
          <Gauge />
          <TopFactors />
        </div>
        <ModeBadge />
        <div style={{ marginTop: 20 }}>
          <ExplanationBanner />
        </div>
      </div>
    </div>
  );
}
