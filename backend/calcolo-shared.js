const ADDIZIONALI_REGIONALI = {
  AB: { scaglioni: [{ limite: 28000, aliquota: 0.0167 }, { limite: 50000, aliquota: 0.0287 }, { limite: Infinity, aliquota: 0.0333 }] },
  BA: { scaglioni: [{ limite: Infinity, aliquota: 0.0123 }] },
  BZ: { scaglioni: [{ limite: 50000, aliquota: 0.0123 }, { limite: Infinity, aliquota: 0.0173 }] },
  CL: { scaglioni: [{ limite: Infinity, aliquota: 0.0173 }] },
  CM: { scaglioni: [{ limite: 15000, aliquota: 0.0173 }, { limite: 28000, aliquota: 0.0296 }, { limite: 50000, aliquota: 0.032 }, { limite: Infinity, aliquota: 0.0333 }] },
  ER: { scaglioni: [{ limite: 15000, aliquota: 0.0133 }, { limite: 28000, aliquota: 0.0193 }, { limite: 50000, aliquota: 0.0293 }, { limite: Infinity, aliquota: 0.0333 }] },
  FV: { scaglioni: [{ limite: 15000, aliquota: 0.007 }, { limite: Infinity, aliquota: 0.0123 }] },
  LA: { scaglioni: [{ limite: 28000, aliquota: 0.0173 }, { limite: Infinity, aliquota: 0.0333 }] },
  LI: { scaglioni: [{ limite: 28000, aliquota: 0.0123 }, { limite: 50000, aliquota: 0.0318 }, { limite: Infinity, aliquota: 0.0323 }] },
  LO: { scaglioni: [{ limite: 15000, aliquota: 0.0123 }, { limite: 28000, aliquota: 0.0158 }, { limite: 50000, aliquota: 0.0172 }, { limite: Infinity, aliquota: 0.0173 }] },
  MA: { scaglioni: [{ limite: 15000, aliquota: 0.0123 }, { limite: 28000, aliquota: 0.0153 }, { limite: 50000, aliquota: 0.017 }, { limite: Infinity, aliquota: 0.0173 }] },
  MO: { scaglioni: [{ limite: 15000, aliquota: 0.0173 }, { limite: 28000, aliquota: 0.0193 }, { limite: 50000, aliquota: 0.0333 }, { limite: Infinity, aliquota: 0.0333 }] },
  PI: { scaglioni: [{ limite: 15000, aliquota: 0.0162 }, { limite: 28000, aliquota: 0.0268 }, { limite: 50000, aliquota: 0.0331 }, { limite: Infinity, aliquota: 0.0333 }] },
  PU: { scaglioni: [{ limite: 15000, aliquota: 0.0133 }, { limite: 28000, aliquota: 0.0143 }, { limite: 50000, aliquota: 0.0163 }, { limite: Infinity, aliquota: 0.0185 }] },
  SA: { scaglioni: [{ limite: Infinity, aliquota: 0.0123 }] },
  SI: { scaglioni: [{ limite: Infinity, aliquota: 0.0123 }] },
  TN: { scaglioni: [{ limite: 50000, aliquota: 0.0123 }, { limite: Infinity, aliquota: 0.0173 }] },
  TO: { scaglioni: [{ limite: 15000, aliquota: 0.0142 }, { limite: 28000, aliquota: 0.0143 }, { limite: 50000, aliquota: 0.0332 }, { limite: Infinity, aliquota: 0.0333 }] },
  UM: { scaglioni: [{ limite: 28000, aliquota: 0.0123 }, { limite: 50000, aliquota: 0.0167 }, { limite: Infinity, aliquota: 0.0183 }] },
  VA: { scaglioni: [{ limite: Infinity, aliquota: 0.0123 }], esenzione: 15000 },
  VE: { scaglioni: [{ limite: Infinity, aliquota: 0.0123 }] },
};

function calcAddRegionale(impIRPEF, regionCode) {
  const reg = ADDIZIONALI_REGIONALI[regionCode] || { scaglioni: [{ limite: Infinity, aliquota: 0.0123 }] };
  if (reg.esenzione && impIRPEF <= reg.esenzione) return 0;
  let totale = 0, prev = 0;
  for (const { limite, aliquota } of reg.scaglioni) {
    const top = Math.min(impIRPEF, limite);
    if (top <= prev) break;
    totale += (top - prev) * aliquota;
    prev = top;
    if (impIRPEF <= limite) break;
  }
  return totale;
}

function irpef2026(imp) {
  if (imp <= 28000) return imp * 0.23;
  if (imp <= 50000) return 28000 * 0.23 + (imp - 28000) * 0.33;
  return 28000 * 0.23 + 22000 * 0.33 + (imp - 50000) * 0.43;
}

function detrLav2026(rc) {
  if (rc <= 8174) return 0;
  if (rc <= 15000) return 1955;
  if (rc <= 28000) return 1910 + 1190 * ((28000 - rc) / 13000);
  if (rc <= 50000) return 1910 * ((50000 - rc) / 22000);
  return 0;
}

function coniugeDetr(rc) {
  if (rc <= 15000) return 800;
  if (rc <= 40000) return 690 + 110 * ((40000 - rc) / 25000);
  if (rc <= 80000) return 690 * ((80000 - rc) / 40000);
  return 0;
}

function figliDetr(rc, n, ndis) {
  const coeff = 95000 + 15000 * Math.max(0, n + ndis - 1);
  let tot = 0;
  if (n > 0) tot += 950 * n * Math.max(0, (coeff - rc) / coeff);
  if (ndis > 0) tot += 1190 * ndis * Math.max(0, (coeff - rc) / coeff);
  return Math.max(0, tot);
}

function altriDetr(rc, n) {
  if (rc >= 80000 || n === 0) return 0;
  return 750 * n * ((80000 - rc) / 80000);
}

function cuneoFiscale2026(rc) {
  if (rc <= 0) return 0;
  if (rc <= 8500) return rc * 0.071;
  if (rc <= 15000) return rc * 0.053;
  if (rc <= 20000) return rc * 0.048;
  if (rc <= 32000) return 1000;
  if (rc <= 40000) return 1000 * ((40000 - rc) / 8000);
  return 0;
}

function trattamentoIntegrativo(impIRPEF, irpefL, totalDetr) {
  if (impIRPEF <= 0) return 0;
  if (impIRPEF <= 15000) return irpefL >= totalDetr - 75 ? 1200 : 0;
  if (impIRPEF <= 28000) return Math.max(0, Math.min(totalDetr - irpefL, 1200));
  return 0;
}

module.exports = {
  ADDIZIONALI_REGIONALI, calcAddRegionale,
  irpef2026, detrLav2026, coniugeDetr, figliDetr, altriDetr,
  cuneoFiscale2026, trattamentoIntegrativo,
};
