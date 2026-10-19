const { irpef2026, detrLav2026, coniugeDetr, figliDetr, altriDetr, cuneoFiscale2026, calcAddRegionale } = require('./calcolo-shared');

// Tabella stipendi Polizia di Stato — contratto 2022-2024 (valori 2025-2026 lordi annui)
// Struttura: ral = stipendio base + indennità pensionabili (soggetti a CTPS e IRPEF ordinaria)
//            indAccessorie = indennità non pensionabili (tassate al 15%, max €800/anno agevolabili)
const GRADI_POLIZIA = {
  agente:          { label: 'Agente',                         ral: 19276,  indAccessorie: 800 },
  assistente:      { label: 'Assistente',                     ral: 20800,  indAccessorie: 800 },
  ass_capo:        { label: 'Assistente Capo',                ral: 21500,  indAccessorie: 800 },
  sovrintendente:  { label: 'Sovrintendente',                 ral: 22500,  indAccessorie: 800 },
  v_sovrintendente:{ label: 'Vice Sovrintendente',            ral: 23200,  indAccessorie: 800 },
  ispettore:       { label: 'Ispettore',                      ral: 24000,  indAccessorie: 800 },
  iss_superiore:   { label: 'Ispettore Superiore',            ral: 24800,  indAccessorie: 800 },
  iss_capo:        { label: 'Ispettore Capo',                 ral: 25400,  indAccessorie: 800 },
  vice_comm:       { label: 'Vice Commissario',               ral: 26000,  indAccessorie: 800 },
  commissario:     { label: 'Commissario',                    ral: 27500,  indAccessorie: 800 },
  comm_capo:       { label: 'Commissario Capo',               ral: 29500,  indAccessorie: 800 },
  vice_questore:   { label: 'Vice Questore Aggiunto',         ral: 33000,  indAccessorie: 800 },
  questore:        { label: 'Questore',                       ral: 42000,  indAccessorie: 800 },
  custom:          { label: 'Inserisci manualmente',          ral: 0,      indAccessorie: 0   },
};

// Agevolazione D.Lgs 95/2017 art.45: detrazione aggiuntiva per personale FF.PP. su redditi ≤ €28.000
function agevolazione9517(impIRPEF) {
  if (impIRPEF <= 28000) return 458.50;
  return 0;
}

function computeNetPolizia({
  ral, mens, regionCode, comAliq,
  coniuge, figli, figliDis, altriF,
  prev, indAccessorie, anniServizio,
  mamma,
}) {
  // CTPS dipendente (Comparto Sicurezza): 8,80%
  const alqCTPS = 0.088;
  let ctps = ral * alqCTPS;
  let mammaBen = 0;
  if (mamma) { mammaBen = Math.min(ral * alqCTPS, 3000); ctps = Math.max(0, ctps - mammaBen); }

  // Indennità accessorie: tassate al 15% (flat) fino a €800/anno
  const indAcc800 = Math.min(indAccessorie, 800);   // porzione agevolata (15%)
  const indAccExtra = Math.max(0, indAccessorie - 800); // eccedenza → IRPEF ordinaria
  const impostaIndAcc = indAcc800 * 0.15;           // imposta piatta 15%

  // Previdenza complementare (Fondo Perseo Sirio o altro)
  const prevDed = Math.min(prev, 5300);

  // Imponibile IRPEF: solo componente ordinaria (no indennità accessorie agevolate)
  const impIRPEF = Math.max(0, ral + indAccExtra - ctps - prevDed);

  // IRPEF lorda e detrazioni
  const irpefL = irpef2026(impIRPEF);
  const detrLav = Math.min(irpefL, detrLav2026(impIRPEF));
  const detrCon = coniuge ? Math.min(irpefL - detrLav, coniugeDetr(impIRPEF)) : 0;
  const detrFig = figliDetr(impIRPEF, figli, figliDis);
  const detrAlt = altriDetr(impIRPEF, altriF);
  const totalDetr = detrLav + detrCon + detrFig + detrAlt;

  const irpefNetta = Math.max(0, irpefL - totalDetr);
  const cuneo = Math.min(irpefNetta, cuneoFiscale2026(impIRPEF));

  // Agevolazione D.Lgs 95/2017 specifica FF.PP.
  const agevFF = agevolazione9517(impIRPEF);
  const irpefFin = Math.max(0, irpefNetta - cuneo - agevFF);

  // Addizionali (su imponibile IRPEF ordinario)
  const addReg = calcAddRegionale(impIRPEF, regionCode);
  const addCom = impIRPEF * (comAliq / 100);

  // Netto annuo
  const ralTotale = ral + indAccessorie;
  const netto = ralTotale + mammaBen - ctps - irpefFin - impostaIndAcc - addReg - addCom;

  // TFS (Trattamento di Fine Servizio) — quota annua accantonata
  // Formula: (stipendio_pensionabile × 80%) / 12 per anno
  // La base pensionabile esclude le indennità accessorie non pensionabili
  const tfs = (ral * 0.8) / 12;

  // TFS proiezione a fine carriera (se anni di servizio > 0)
  const tfsFinale = anniServizio > 0 ? (ral * 0.8 / 12) * anniServizio : null;

  // Costo Stato (approssimativo: CTPS datore ~24,20% + TFS ~6,10%)
  const ctpsDatore = ral * 0.242;
  const costAziendale = ralTotale + ctpsDatore + tfs;

  // Aliquota effettiva
  const aliqEff = ralTotale > 0 ? ((ralTotale - netto) / ralTotale) * 100 : 0;

  return {
    ral, ralTotale, mens, ctps, mammaBen, prevDed,
    indAcc800, indAccExtra, impostaIndAcc,
    impIRPEF, irpefL, detrLav, detrCon, detrFig, detrAlt, totalDetr,
    irpefNetta, cuneo, agevFF, irpefFin,
    addReg, addCom, netto, aliqEff,
    tfs, tfsFinale, ctpsDatore, costAziendale,
  };
}

module.exports = { computeNetPolizia, GRADI_POLIZIA };
