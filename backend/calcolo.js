const {
  calcAddRegionale, irpef2026, detrLav2026, coniugeDetr,
  figliDetr, altriDetr, cuneoFiscale2026, trattamentoIntegrativo,
} = require('./calcolo-shared');

function computeNet({ ral, mens, tipo, regionCode, comAliq, coniuge, figli, figliDis, altriF, prev, fringe, premio, impatriati, mamma }) {
  const alqINPS = tipo === 'appr' ? 0.0584 : 0.0919;
  let inps = ral * alqINPS + (tipo !== 'appr' && ral > 55448 ? (ral - 55448) * 0.01 : 0);
  let mammaBen = 0;
  if (mamma) { mammaBen = Math.min(ral * alqINPS, 3000); inps = Math.max(0, inps - mammaBen); }

  const alqINPSDatore = tipo === 'appr' ? 0.1161 : 0.2898;
  const inpsDatore = ral * alqINPSDatore;
  const tfr = ral / 13.5;
  const costAziendale = ral + inpsDatore + tfr;

  const fringeEsente = Math.min(fringe, 1000);
  const fringeImp = Math.max(0, fringe - 1000);
  const prevDed = Math.min(prev, 5300);

  let impIRPEF = Math.max(0, ral + fringeImp - inps - prevDed);
  let impEsente = 0;
  if (impatriati) { impEsente = Math.min(impIRPEF, 600000) * 0.5; impIRPEF = Math.max(0, impIRPEF - impEsente); }

  const irpefL = irpef2026(impIRPEF);
  const detrLav = Math.min(irpefL, detrLav2026(impIRPEF));
  const detrCon = coniuge ? Math.min(irpefL - detrLav, coniugeDetr(impIRPEF)) : 0;
  const detrFig = figliDetr(impIRPEF, figli, figliDis);
  const detrAlt = altriDetr(impIRPEF, altriF);
  const totalDetr = detrLav + detrCon + detrFig + detrAlt;

  const irpefNetta = Math.max(0, irpefL - totalDetr);
  const cuneo = Math.min(irpefNetta, cuneoFiscale2026(impIRPEF));
  const irpefFin = irpefNetta - cuneo;
  const ti = trattamentoIntegrativo(impIRPEF, irpefL, totalDetr);

  const addReg = calcAddRegionale(impIRPEF, regionCode);
  const addCom = impIRPEF * (comAliq / 100);
  const premioTax = premio * 0.05;
  const netto = ral + fringeEsente + mammaBen + ti - inps - irpefFin - addReg - addCom - premioTax;

  let cuneoNote = '';
  if (impIRPEF <= 8500) cuneoNote = `Cuneo: bonus 7,1% del reddito.`;
  else if (impIRPEF <= 15000) cuneoNote = `Cuneo: bonus 5,3% del reddito.`;
  else if (impIRPEF <= 20000) cuneoNote = `Cuneo: bonus 4,8% del reddito.`;
  else if (impIRPEF <= 32000) cuneoNote = `Cuneo: detrazione aggiuntiva fissa €1.000/anno (€83/mese).`;
  else if (impIRPEF <= 40000) cuneoNote = `Cuneo: detrazione decrescente — €1.000 × (40.000 − RC) / 8.000.`;
  else cuneoNote = `Oltre €40.000 di imponibile: nessun beneficio cuneo fiscale 2026.`;

  return {
    ral, mens, inps, mammaBen, prevDed, impIRPEF, impEsente,
    irpefL, detrLav, detrCon, detrFig, detrAlt, totalDetr,
    irpefNetta, cuneo, irpefFin, ti,
    addReg, addCom, premioTax,
    netto, fringeEsente, fringeImp,
    tfr, inpsDatore, costAziendale,
    cuneoNote,
  };
}

module.exports = { computeNet };
