import React, { useState, useEffect, useCallback } from 'react';
import NumInput from './NumInput.jsx';
import SankeyChart from './SankeyChart.jsx';

const fmt = n => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = n => n.toFixed(1) + '%';

const REGIONI = [
  { code: 'AB', label: 'Abruzzo' },
  { code: 'BA', label: 'Basilicata' },
  { code: 'BZ', label: 'Bolzano' },
  { code: 'CL', label: 'Calabria' },
  { code: 'CM', label: 'Campania' },
  { code: 'ER', label: 'Emilia-Romagna' },
  { code: 'FV', label: 'Friuli Venezia Giulia' },
  { code: 'LA', label: 'Lazio' },
  { code: 'LI', label: 'Liguria' },
  { code: 'LO', label: 'Lombardia' },
  { code: 'MA', label: 'Marche' },
  { code: 'MO', label: 'Molise' },
  { code: 'PI', label: 'Piemonte' },
  { code: 'PU', label: 'Puglia' },
  { code: 'SA', label: 'Sardegna' },
  { code: 'SI', label: 'Sicilia' },
  { code: 'TN', label: 'Trento' },
  { code: 'TO', label: 'Toscana' },
  { code: 'UM', label: 'Umbria' },
  { code: 'VA', label: "Valle d'Aosta" },
  { code: 'VE', label: 'Veneto' },
];

const s = {
  slbl: { fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.1rem 0 .4rem', paddingBottom: 5, borderBottom: '0.5px solid #e5e7eb' },
  g2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: '.75rem' },
  g3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: '.75rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: 12, color: '#6b7280' },
  input: { width: '100%', fontSize: 13, padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 6 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(0,1fr))', gap: 8, margin: '1rem 0' },
  stat: { background: '#f9fafb', borderRadius: 8, padding: '10px 12px' },
  statL: { fontSize: 11, color: '#6b7280', marginBottom: 3 },
  statV: { fontSize: 19, fontWeight: 500 },
  bd: { border: '0.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: '.75rem' },
  br: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 13px', borderBottom: '0.5px solid #e5e7eb', fontSize: 12.5 },
  brTot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 13px', borderBottom: '0.5px solid #e5e7eb', fontSize: 12.5, background: '#f9fafb', fontWeight: 500 },
  lbl: { color: '#6b7280', flex: 1, paddingRight: 8 },
  val: { fontWeight: 500, minWidth: 80, textAlign: 'right', fontSize: 12.5 },
  note: { fontSize: 11, color: '#6b7280', marginTop: 6, lineHeight: 1.45 },
  infoBox: { background: '#f9fafb', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#6b7280', margin: '.5rem 0', lineHeight: 1.5 },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginBottom: '.5rem' },
  leg: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280' },
  legDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' },
};

const DEFAULTS = {
  ral: 30000, mens: 13, tipo: 'std', regionCode: 'LO', comAliq: 0.5,
  coniuge: 0, figli: 0, figliDis: 0, altriF: 0,
  prev: 0, fringe: 0, premio: 0, impatriati: false, mamma: false,
};

export default function CalcolatoreRAL() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcola = useCallback(async () => {
    const res = await fetch('/api/calcola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setResult(await res.json());
  }, [form]);

  useEffect(() => { calcola(); }, [form]);

  const r = result;

  return (
    <div>
      <div style={s.slbl}>Retribuzione</div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.label}>RAL annua lorda (€)</label>
          <NumInput style={s.input} value={form.ral} onChange={v => set('ral', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Mensilità CCNL</label>
          <select style={s.input} value={form.mens} onChange={e => set('mens', parseInt(e.target.value))}>
            <option value={12}>12 mensilità</option>
            <option value={13}>13 mensilità</option>
            <option value={14}>14 mensilità</option>
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Tipo contratto</label>
          <select style={s.input} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="std">Dipendente standard</option>
            <option value="appr">Apprendistato (INPS 5,84%)</option>
          </select>
        </div>
      </div>

      <div style={s.slbl}>Regione e comune</div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.label}>Regione</label>
          <select style={s.input} value={form.regionCode} onChange={e => set('regionCode', e.target.value)}>
            {REGIONI.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Addizionale comunale (%)</label>
          <NumInput style={s.input} value={form.comAliq} onChange={v => set('comAliq', v)} />
        </div>
      </div>

      <div style={s.slbl}>Situazione familiare</div>
      <div style={s.g3}>
        <div style={s.field}>
          <label style={s.label}>Coniuge a carico</label>
          <select style={s.input} value={form.coniuge} onChange={e => set('coniuge', parseInt(e.target.value))}>
            <option value={0}>No</option>
            <option value={1}>Sì</option>
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Figli 21-30 anni (n°)</label>
          <NumInput style={s.input} value={form.figli} onChange={v => set('figli', Math.round(v))} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Figli disabili (n°)</label>
          <NumInput style={s.input} value={form.figliDis} onChange={v => set('figliDis', Math.round(v))} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Altri familiari (n°)</label>
          <NumInput style={s.input} value={form.altriF} onChange={v => set('altriF', Math.round(v))} />
        </div>
      </div>

      <div style={s.slbl}>Benefit e agevolazioni</div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.label}>Previdenza complementare (€/anno, max 5.300)</label>
          <NumInput style={s.input} value={form.prev} onChange={v => set('prev', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Fringe benefit (€/anno, esenti fino a 1.000)</label>
          <NumInput style={s.input} value={form.fringe} onChange={v => set('fringe', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Premio di risultato (€/anno, tass. 5%)</label>
          <NumInput style={s.input} value={form.premio} onChange={v => set('premio', v)} />
        </div>
      </div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.toggleRow}>
            <input type="checkbox" checked={form.impatriati} onChange={e => set('impatriati', e.target.checked)} />
            Regime impatriati (50% esenzione)
          </label>
        </div>
        <div style={s.field}>
          <label style={s.toggleRow}>
            <input type="checkbox" checked={form.mamma} onChange={e => set('mamma', e.target.checked)} />
            Bonus mamme (≥2 figli, esonero INPS max €3.000/a)
          </label>
        </div>
      </div>

      {r && (
        <>
          <div style={s.slbl}>Risultato 2026</div>
          <div style={s.stats}>
            <div style={s.stat}><div style={s.statL}>Netto annuo</div><div style={{ ...s.statV, color: '#0F6E56' }}>{fmt(r.netto)}</div></div>
            <div style={s.stat}><div style={s.statL}>Netto mensile</div><div style={{ ...s.statV, color: '#0F6E56' }}>{fmt(r.netto / r.mens)}</div></div>
            <div style={s.stat}><div style={s.statL}>TFR annuo</div><div style={{ ...s.statV, color: '#7C3AED' }}>{fmt(r.tfr)}</div></div>
            <div style={s.stat}><div style={s.statL}>Costo azienda</div><div style={{ ...s.statV, color: '#1E40AF' }}>{fmt(r.costAziendale)}</div></div>
            <div style={s.stat}><div style={s.statL}>INPS dipendente</div><div style={{ ...s.statV, color: '#993C1D' }}>{fmt(r.inps)}</div></div>
            <div style={s.stat}><div style={s.statL}>IRPEF + add.</div><div style={{ ...s.statV, color: '#993C1D' }}>{fmt(r.irpefFin + r.addReg + r.addCom)}</div></div>
            <div style={s.stat}><div style={s.statL}>Cuneo fiscale</div><div style={{ ...s.statV, color: '#854F0B' }}>{fmt(r.cuneo)}</div></div>
            <div style={s.stat}><div style={s.statL}>Aliquota effettiva</div><div style={{ ...s.statV, color: '#185FA5' }}>{pct(r.ral > 0 ? (r.ral - r.netto) / r.ral * 100 : 0)}</div></div>
          </div>

          <div style={s.slbl}>Grafico di flusso</div>
          <div style={s.legend}>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#A7F3D0' }} />RAL</div>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#BFDBFE' }} />INPS Datore</div>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#DDD6FE' }} />TFR</div>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#1D9E75' }} />Netto</div>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#D85A30' }} />INPS Dip.</div>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#BA7517' }} />IRPEF</div>
            <div style={s.leg}><div style={{ ...s.legDot, background: '#7F77DD' }} />Addiz.</div>
          </div>
          <SankeyChart r={r} />

          <div style={s.slbl}>Dettaglio calcolo</div>
          <div style={s.bd}>
            <div style={s.br}><span style={s.lbl}>RAL lorda + imponibile benefit</span><span style={s.val}>{fmt(r.ral + (r.fringeImp || 0))}</span></div>
            <div style={s.br}><span style={s.lbl}>Contributi INPS dipendente</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.inps)}</span></div>
            {r.mammaBen > 0 && <div style={s.br}><span style={s.lbl}>Bonus mamme (esonero INPS)</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.mammaBen)}</span></div>}
            {r.prevDed > 0 && <div style={s.br}><span style={s.lbl}>Deduzione prev. complementare</span><span style={s.val}>- {fmt(r.prevDed)}</span></div>}
            {r.impEsente > 0 && <div style={s.br}><span style={s.lbl}>Esenzione regime impatriati</span><span style={s.val}>- {fmt(r.impEsente)} (50% esente)</span></div>}
            <div style={s.brTot}><span style={s.lbl}>Imponibile IRPEF</span><span style={s.val}>{fmt(r.impIRPEF)}</span></div>
            <div style={s.br}><span style={s.lbl}>IRPEF lorda (scaglioni 2026)</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.irpefL)}</span></div>
            <div style={s.br}><span style={s.lbl}>Detrazione lavoro dipendente</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.detrLav)}</span></div>
            <div style={s.br}><span style={s.lbl}>Detrazione coniuge a carico</span><span style={{ ...s.val, color: r.detrCon > 0 ? '#0F6E56' : undefined }}>{r.detrCon > 0 ? '+ ' + fmt(r.detrCon) : '—'}</span></div>
            <div style={s.br}><span style={s.lbl}>Detrazione figli (21-30 a.) + disabili</span><span style={{ ...s.val, color: r.detrFig > 0 ? '#0F6E56' : undefined }}>{r.detrFig > 0 ? '+ ' + fmt(r.detrFig) : '—'}</span></div>
            <div style={s.br}><span style={s.lbl}>Detrazione altri familiari</span><span style={{ ...s.val, color: r.detrAlt > 0 ? '#0F6E56' : undefined }}>{r.detrAlt > 0 ? '+ ' + fmt(r.detrAlt) : '—'}</span></div>
            <div style={s.br}><span style={s.lbl}>IRPEF netta</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.irpefNetta)}</span></div>
            <div style={s.br}><span style={s.lbl}>Cuneo fiscale 2026</span><span style={{ ...s.val, color: r.cuneo > 0 ? '#0F6E56' : undefined }}>{r.cuneo > 0 ? '+ ' + fmt(r.cuneo) : '—'}</span></div>
            {r.ti > 0 && <div style={s.br}><span style={s.lbl}>Trattamento integrativo (bonus IRPEF)</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.ti)}</span></div>}
            <div style={s.br}><span style={s.lbl}>Addizionale regionale</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.addReg)}</span></div>
            <div style={s.br}><span style={s.lbl}>Addizionale comunale</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.addCom)}</span></div>
            {r.premioTax > 0 && <div style={s.br}><span style={s.lbl}>Tassazione premio di risultato (5%)</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.premioTax)}</span></div>}
            <div style={s.brTot}><span style={s.lbl}>Netto annuo stimato</span><span style={{ ...s.val, color: '#0F6E56' }}>{fmt(r.netto)}</span></div>
            <div style={s.brTot}><span style={s.lbl}>Netto mensile (su {r.mens} mensilità)</span><span style={{ ...s.val, color: '#0F6E56' }}>{fmt(r.netto / r.mens)}</span></div>
            <div style={{ ...s.brTot, borderBottom: 'none', borderTop: '1px solid #e5e7eb' }}>
              <span style={s.lbl}>TFR accantonato (RAL ÷ 13,5) — non in busta</span>
              <span style={{ ...s.val, color: '#7C3AED' }}>{fmt(r.tfr)}/anno · {fmt(r.tfr / r.mens)}/mese</span>
            </div>
          </div>

          {r.cuneoNote && <div style={s.infoBox}>{r.cuneoNote}</div>}
          <p style={s.note}>Stime basate sulla normativa 2026 (Legge di Bilancio 2025, L.207/2024). Addizionali regionali progressive per tutti i 21 territori. TFR accantonato dal datore (RAL÷13,5), liquidato alla fine del rapporto. Non include detrazioni 730, mutuo, spese mediche. Per figli under 21 l'Assegno Unico è erogato direttamente da INPS.</p>
        </>
      )}
    </div>
  );
}
