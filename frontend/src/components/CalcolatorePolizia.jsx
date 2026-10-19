import React, { useState, useEffect, useCallback } from 'react';
import NumInput from './NumInput.jsx';

const fmt = n => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = n => n.toFixed(1) + '%';

const REGIONI = [
  { code: 'AB', label: 'Abruzzo' }, { code: 'BA', label: 'Basilicata' },
  { code: 'BZ', label: 'Bolzano' }, { code: 'CL', label: 'Calabria' },
  { code: 'CM', label: 'Campania' }, { code: 'ER', label: 'Emilia-Romagna' },
  { code: 'FV', label: 'Friuli Venezia Giulia' }, { code: 'LA', label: 'Lazio' },
  { code: 'LI', label: 'Liguria' }, { code: 'LO', label: 'Lombardia' },
  { code: 'MA', label: 'Marche' }, { code: 'MO', label: 'Molise' },
  { code: 'PI', label: 'Piemonte' }, { code: 'PU', label: 'Puglia' },
  { code: 'SA', label: 'Sardegna' }, { code: 'SI', label: 'Sicilia' },
  { code: 'TN', label: 'Trento' }, { code: 'TO', label: 'Toscana' },
  { code: 'UM', label: 'Umbria' }, { code: 'VA', label: "Valle d'Aosta" },
  { code: 'VE', label: 'Veneto' },
];

const GRADI = [
  { code: 'agente',          label: 'Agente',                      ral: 19276,  indAccessorie: 800 },
  { code: 'assistente',      label: 'Assistente',                  ral: 20800,  indAccessorie: 800 },
  { code: 'ass_capo',        label: 'Assistente Capo',             ral: 21500,  indAccessorie: 800 },
  { code: 'sovrintendente',  label: 'Sovrintendente',              ral: 22500,  indAccessorie: 800 },
  { code: 'v_sovr',          label: 'Vice Sovrintendente',         ral: 23200,  indAccessorie: 800 },
  { code: 'ispettore',       label: 'Ispettore',                   ral: 24000,  indAccessorie: 800 },
  { code: 'iss_sup',         label: 'Ispettore Superiore',         ral: 24800,  indAccessorie: 800 },
  { code: 'iss_capo',        label: 'Ispettore Capo',              ral: 25400,  indAccessorie: 800 },
  { code: 'vice_comm',       label: 'Vice Commissario',            ral: 26000,  indAccessorie: 800 },
  { code: 'commissario',     label: 'Commissario',                 ral: 27500,  indAccessorie: 800 },
  { code: 'comm_capo',       label: 'Commissario Capo',            ral: 29500,  indAccessorie: 800 },
  { code: 'vice_questore',   label: 'Vice Questore Aggiunto',      ral: 33000,  indAccessorie: 800 },
  { code: 'questore',        label: 'Questore',                    ral: 42000,  indAccessorie: 800 },
  { code: 'custom',          label: 'Inserisci manualmente',       ral: 0,      indAccessorie: 0   },
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
  infoBox: { background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1E40AF', margin: '.5rem 0', lineHeight: 1.6 },
  badge: { display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500, background: '#DBEAFE', color: '#1E3A8A', marginLeft: 6 },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' },
};

const DEFAULTS = {
  grado: 'agente', ral: 19276, mens: 13,
  regionCode: 'LO', comAliq: 0.5,
  coniuge: 0, figli: 0, figliDis: 0, altriF: 0,
  prev: 0, indAccessorie: 800, anniServizio: 20, mamma: false,
};

export default function CalcolatorePolizia() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGrado = (code) => {
    const g = GRADI.find(g => g.code === code);
    if (!g) return;
    setForm(f => ({
      ...f,
      grado: code,
      ...(code !== 'custom' ? { ral: g.ral, indAccessorie: g.indAccessorie } : {}),
    }));
  };

  const calcola = useCallback(async () => {
    const res = await fetch('/api/calcola-polizia', {
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
      <div style={s.infoBox}>
        <strong>Polizia di Stato — Comparto Sicurezza</strong><br />
        Calcolo basato su: CTPS 8,80% (dipendente) · TFS anziché TFR · Tassazione agevolata 15% su indennità accessorie fino a €800/a · Agevolazione D.Lgs. 95/2017 (max €458,50/a per redditi ≤ €28.000) · Contratto 2022-2024.
      </div>

      <div style={s.slbl}>Grado e retribuzione</div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.label}>Grado</label>
          <select style={s.input} value={form.grado} onChange={e => handleGrado(e.target.value)}>
            {GRADI.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Stipendio + ind. pensionabili (€/anno)</label>
          <NumInput style={s.input} value={form.ral} onChange={v => set('ral', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Ind. accessorie non pensionabili (€/anno)</label>
          <NumInput style={s.input} value={form.indAccessorie} onChange={v => set('indAccessorie', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Mensilità</label>
          <select style={s.input} value={form.mens} onChange={e => set('mens', parseInt(e.target.value))}>
            <option value={12}>12</option>
            <option value={13}>13</option>
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
            <option value={0}>No</option><option value={1}>Sì</option>
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

      <div style={s.slbl}>Previdenza e TFS</div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.label}>Prev. complementare Fondo Perseo Sirio (€/anno, max 5.300)</label>
          <NumInput style={s.input} value={form.prev} onChange={v => set('prev', v)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Anni di servizio (per proiezione TFS)</label>
          <NumInput style={s.input} value={form.anniServizio} onChange={v => set('anniServizio', Math.round(v))} />
        </div>
      </div>
      <div style={s.g2}>
        <div style={s.field}>
          <label style={s.toggleRow}>
            <input type="checkbox" checked={form.mamma} onChange={e => set('mamma', e.target.checked)} />
            Bonus mamme (esonero CTPS max €3.000/a)
          </label>
        </div>
      </div>

      {r && (
        <>
          <div style={s.slbl}>Risultato 2026</div>
          <div style={s.stats}>
            <div style={s.stat}><div style={s.statL}>Netto annuo</div><div style={{ ...s.statV, color: '#0F6E56' }}>{fmt(r.netto)}</div></div>
            <div style={s.stat}><div style={s.statL}>Netto mensile</div><div style={{ ...s.statV, color: '#0F6E56' }}>{fmt(r.netto / r.mens)}</div></div>
            <div style={s.stat}><div style={s.statL}>TFS annuo accantonato</div><div style={{ ...s.statV, color: '#7C3AED' }}>{fmt(r.tfs)}</div></div>
            {r.tfsFinale && <div style={s.stat}><div style={s.statL}>TFS totale fine carriera ({form.anniServizio} anni)</div><div style={{ ...s.statV, color: '#5B21B6' }}>{fmt(r.tfsFinale)}</div></div>}
            <div style={s.stat}><div style={s.statL}>CTPS dipendente</div><div style={{ ...s.statV, color: '#993C1D' }}>{fmt(r.ctps)}</div></div>
            <div style={s.stat}><div style={s.statL}>IRPEF + add.</div><div style={{ ...s.statV, color: '#993C1D' }}>{fmt(r.irpefFin + r.addReg + r.addCom)}</div></div>
            <div style={s.stat}><div style={s.statL}>Tass. ind. accessorie (15%)</div><div style={{ ...s.statV, color: '#993C1D' }}>{fmt(r.impostaIndAcc)}</div></div>
            <div style={s.stat}><div style={s.statL}>Aliquota effettiva</div><div style={{ ...s.statV, color: '#185FA5' }}>{pct(r.aliqEff)}</div></div>
          </div>

          <div style={s.slbl}>Dettaglio calcolo</div>
          <div style={s.bd}>
            <div style={s.br}><span style={s.lbl}>Stipendio + ind. pensionabili (soggetti a CTPS)</span><span style={s.val}>{fmt(r.ral)}</span></div>
            <div style={s.br}><span style={s.lbl}>Ind. accessorie agevolate (15%, fino a €800/a)<span style={s.badge}>15%</span></span><span style={s.val}>{fmt(r.indAcc800)}</span></div>
            {r.indAccExtra > 0 && <div style={s.br}><span style={s.lbl}>Ind. accessorie eccedenti €800 (IRPEF ordinaria)</span><span style={s.val}>{fmt(r.indAccExtra)}</span></div>}
            <div style={s.brTot}><span style={s.lbl}>Totale lordo</span><span style={s.val}>{fmt(r.ralTotale)}</span></div>

            <div style={s.br}><span style={s.lbl}>Contributi CTPS dipendente (8,80%)</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.ctps)}</span></div>
            {r.mammaBen > 0 && <div style={s.br}><span style={s.lbl}>Bonus mamme (esonero CTPS)</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.mammaBen)}</span></div>}
            {r.prevDed > 0 && <div style={s.br}><span style={s.lbl}>Deduzione prev. complementare (Fondo Perseo)</span><span style={s.val}>- {fmt(r.prevDed)}</span></div>}
            <div style={s.brTot}><span style={s.lbl}>Imponibile IRPEF (componente ordinaria)</span><span style={s.val}>{fmt(r.impIRPEF)}</span></div>

            <div style={s.br}><span style={s.lbl}>IRPEF lorda (scaglioni 2026)</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.irpefL)}</span></div>
            <div style={s.br}><span style={s.lbl}>Detrazione lavoro dipendente</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.detrLav)}</span></div>
            {r.detrCon > 0 && <div style={s.br}><span style={s.lbl}>Detrazione coniuge a carico</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.detrCon)}</span></div>}
            {r.detrFig > 0 && <div style={s.br}><span style={s.lbl}>Detrazione figli a carico</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.detrFig)}</span></div>}
            {r.detrAlt > 0 && <div style={s.br}><span style={s.lbl}>Detrazione altri familiari</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.detrAlt)}</span></div>}
            <div style={s.br}><span style={s.lbl}>IRPEF netta</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.irpefNetta)}</span></div>
            {r.cuneo > 0 && <div style={s.br}><span style={s.lbl}>Cuneo fiscale 2026</span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.cuneo)}</span></div>}
            {r.agevFF > 0 && <div style={s.br}><span style={s.lbl}>Agevolazione FF.PP. D.Lgs. 95/2017<span style={s.badge}>Polizia</span></span><span style={{ ...s.val, color: '#0F6E56' }}>+ {fmt(r.agevFF)}</span></div>}
            <div style={s.br}><span style={s.lbl}>Addizionale regionale</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.addReg)}</span></div>
            <div style={s.br}><span style={s.lbl}>Addizionale comunale</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.addCom)}</span></div>
            <div style={s.br}><span style={s.lbl}>Imposta ind. accessorie (15% flat su {fmt(r.indAcc800)})</span><span style={{ ...s.val, color: '#993C1D' }}>- {fmt(r.impostaIndAcc)}</span></div>

            <div style={s.brTot}><span style={s.lbl}>Netto annuo stimato</span><span style={{ ...s.val, color: '#0F6E56' }}>{fmt(r.netto)}</span></div>
            <div style={s.brTot}><span style={s.lbl}>Netto mensile (su {r.mens} mensilità)</span><span style={{ ...s.val, color: '#0F6E56' }}>{fmt(r.netto / r.mens)}</span></div>
            <div style={{ ...s.brTot, borderBottom: 'none', borderTop: '1px solid #e5e7eb' }}>
              <span style={s.lbl}>TFS accantonato (base pensionabile × 80% / 12) — liquidato a fine servizio</span>
              <span style={{ ...s.val, color: '#7C3AED' }}>{fmt(r.tfs)}/anno</span>
            </div>
          </div>

          <p style={s.note}>
            Stime 2026. Contratto Comparto Sicurezza 2022-2024. CTPS 8,80% (D.P.R. 1032/1973 e succ.). TFS calcolato su base pensionabile (stipendio + ind. pensionabili) × 80% ÷ 12 per anno — liquidato dal datore entro 2 anni da cessazione (L.296/2006). Agevolazione D.Lgs. 95/2017 art.45: €458,50 per redditi ≤ €28.000. Ind. accessorie: tassazione agevolata 15% fino a €800/anno. Non include straordinari, missioni, assegni familiari INPS.
          </p>
        </>
      )}
    </div>
  );
}
