import React, { useState, useEffect, useCallback } from 'react';
import NumInput from './NumInput.jsx';

const fmt = n => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = n => n.toFixed(1) + '%';

const REGIONI = [
  { code: 'LO', label: 'Lombardia' },
  { code: 'LA', label: 'Lazio' },
  { code: 'CM', label: 'Campania' },
  { code: 'TO', label: 'Toscana' },
  { code: 'PI', label: 'Piemonte' },
  { code: 'ER', label: 'Emilia-Romagna' },
  { code: 'VE', label: 'Veneto' },
  { code: 'CL', label: 'Calabria' },
];

const s = {
  slbl: { fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.1rem 0 .4rem', paddingBottom: 5, borderBottom: '0.5px solid #e5e7eb' },
  g3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: '.75rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: 12, color: '#6b7280' },
  input: { width: '100%', fontSize: 13, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 6 },
  projWrap: { margin: '1.25rem 0' },
  projRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 4 },
  projLbl: { minWidth: 80, color: '#6b7280', textAlign: 'right', fontSize: 11 },
  projBarOuter: { flex: 1, height: 18, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  projBarInner: { height: '100%', background: '#1D9E75', borderRadius: 3, transition: 'width .3s' },
  projVal: { minWidth: 100, fontWeight: 500, fontSize: 11, color: '#0F6E56' },
  note: { fontSize: 11, color: '#6b7280', marginTop: 6, lineHeight: 1.45 },
};

export default function ProiezioneRAL() {
  const [form, setForm] = useState({ regionCode: 'LO', comAliq: 0.5, mens: 13 });
  const [rows, setRows] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const carica = useCallback(async () => {
    const params = new URLSearchParams({ regionCode: form.regionCode, comAliq: form.comAliq, mens: form.mens });
    const res = await fetch(`/api/proiezione?${params}`);
    setRows(await res.json());
  }, [form]);

  useEffect(() => { carica(); }, [form]);

  const maxNetto = rows.length ? Math.max(...rows.map(r => r.netto)) : 1;

  return (
    <div>
      <div style={s.slbl}>Parametri proiezione</div>
      <div style={s.g3}>
        <div style={s.field}>
          <label style={s.label}>Regione</label>
          <select style={s.input} value={form.regionCode} onChange={e => set('regionCode', e.target.value)}>
            {REGIONI.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Add. comunale (%)</label>
          <NumInput style={s.input} value={form.comAliq} onChange={v => set('comAliq', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Mensilità</label>
          <select style={s.input} value={form.mens} onChange={e => set('mens', parseInt(e.target.value))}>
            <option value={12}>12</option>
            <option value={13}>13</option>
            <option value={14}>14</option>
          </select>
        </div>
      </div>

      <div style={s.slbl}>Proiezione netto per fascia RAL</div>
      <div style={s.projWrap}>
        {rows.map(row => (
          <div key={row.ral} style={s.projRow}>
            <div style={s.projLbl}>{fmt(row.ral)}</div>
            <div style={s.projBarOuter}>
              <div style={{ ...s.projBarInner, width: `${(row.netto / maxNetto) * 100}%` }} />
            </div>
            <div style={s.projVal}>
              {fmt(row.nettoMensile)}<span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>/mese · {pct(row.aliqEff)}</span>
            </div>
          </div>
        ))}
      </div>
      <p style={s.note}>Calcolo con parametri base (no impatriati, no figli, contratto standard). Addizionali regionali progressive 2026. Cuneo fiscale e trattamento integrativo applicati automaticamente.</p>
    </div>
  );
}
