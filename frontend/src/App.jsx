import React, { useState } from 'react';
import CalcolatoreRAL from './components/CalcolatoreRAL.jsx';
import ProiezioneRAL from './components/ProiezioneRAL.jsx';
import CalcolatorePolizia from './components/CalcolatorePolizia.jsx';

const s = {
  wrap: { padding: '1rem 0', maxWidth: 800, margin: '0 auto' },
  tabs: { display: 'flex', gap: 6, marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab: { fontSize: 13, padding: '7px 16px', borderRadius: 20, border: '0.5px solid #d1d5db', background: 'transparent', color: '#6b7280', cursor: 'pointer' },
  tabOn: { background: '#f3f4f6', color: '#111827', borderColor: '#9ca3af', fontWeight: 500 },
};

const TABS = [
  { id: 'main',    label: 'Calcolatore RAL' },
  { id: 'proj',    label: 'Proiezione per RAL' },
  { id: 'polizia', label: 'Polizia di Stato' },
];

export default function App() {
  const [tab, setTab] = useState('main');

  return (
    <div style={s.wrap}>
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={tab === t.id ? { ...s.tab, ...s.tabOn } : s.tab} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'main'    && <CalcolatoreRAL />}
      {tab === 'proj'    && <ProiezioneRAL />}
      {tab === 'polizia' && <CalcolatorePolizia />}
    </div>
  );
}
