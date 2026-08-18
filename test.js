/*
 * test.js — Casi di prova eseguibili.
 *
 * Da terminale:            node test.js
 * Oppure nel browser:      aggiungere <script src="test.js"></script> in
 *                          index.html e leggere la console.
 *
 * Le RAL scelte coprono i comportamenti ai bordi:
 *   15.000  → sotto la rottura del trattamento integrativo, somma esente 5,3%
 *   16.518  → imponibile ≈ 15.000: ultimo punto in cui spetta il trattamento
 *   20.000  → somma esente 4,8%, reddito ancora ≤ 20.000
 *   30.000  → fuori dalla somma esente, ulteriore detrazione fissa 1.000 €
 *   45.000  → imponibile > 40.000: uscito anche dall'ulteriore detrazione
 *   60.000  → oltre la prima fascia di pensionabilità: 1% aggiuntivo attivo
 *   130.000 → oltre il massimale contributivo: contributi calcolati su 122.295
 *
 * I valori stampati vanno confrontati con i calcolatori online (es.
 * nettostipendio, tuttocalcolo) tenendo conto delle semplificazioni
 * dichiarate nel README.
 */

(function () {
  "use strict";

  // In Node carichiamo i file con require; nel browser gli script classici
  // hanno già definito i globali PARAMETRI_2026 e calcolaNetto.
  var parametri, calcolaNetto_;
  if (typeof module !== "undefined" && typeof require === "function") {
    parametri = require("./parametri-2026.js");
    calcolaNetto_ = require("./calcolo.js").calcolaNetto;
  } else {
    parametri = PARAMETRI_2026;
    calcolaNetto_ = calcolaNetto;
  }

  var RAL_DI_PROVA = [15000, 16518, 20000, 30000, 45000, 60000, 130000];

  function euro(x) {
    return x.toFixed(2).replace(".", ",") + " €";
  }

  // --- Tabella completa per Milano (territorio di default) ---------------
  console.log("=== Calcolo completo — Milano ===\n");

  RAL_DI_PROVA.forEach(function (ral) {
    var r = calcolaNetto_(ral, "milano", parametri);
    console.log("RAL " + euro(ral));
    console.log("  Contributi INPS          " + euro(r.contributi.totale) +
                (r.contributi.quotaAggiuntiva > 0 ? "  (di cui 1% aggiuntivo: " + euro(r.contributi.quotaAggiuntiva) + ")" : "") +
                (r.contributi.base < ral ? "  [base al massimale: " + euro(r.contributi.base) + "]" : ""));
    console.log("  Imponibile fiscale       " + euro(r.imponibile));
    console.log("  IRPEF lorda              " + euro(r.irpefLorda));
    console.log("  Detrazione lavoro dip.   " + euro(r.detrazioneLavoro));
    console.log("  Ulteriore detr. (cuneo)  " + euro(r.ulterioreDetrazione));
    console.log("  IRPEF netta              " + euro(r.irpefNetta));
    console.log("  Addizionale regionale    " + euro(r.addizionaleRegionale));
    console.log("  Addizionale comunale     " + euro(r.addizionaleComunale));
    console.log("  Somma esente (cuneo)     " + euro(r.sommaEsente));
    console.log("  Trattamento integrativo  " + euro(r.trattamentoIntegrativo));
    console.log("  Netto annuo              " + euro(r.nettoAnnuo) +
                "  (" + (r.nettoAnnuo / ral * 100).toFixed(1) + "% della RAL)");
    console.log("  Netto mensile            ÷12: " + euro(r.nettoAnnuo / 12) +
                "  |  ÷13: " + euro(r.nettoAnnuo / 13) +
                "  |  ÷14: " + euro(r.nettoAnnuo / 14));
    console.log("");
  });

  // --- Confronto Milano / Roma sul netto annuo ---------------------------
  console.log("=== Confronto territori — netto annuo ===\n");
  RAL_DI_PROVA.forEach(function (ral) {
    var mi = calcolaNetto_(ral, "milano", parametri);
    var rm = calcolaNetto_(ral, "roma", parametri);
    console.log("RAL " + euro(ral) + "  →  Milano " + euro(mi.nettoAnnuo) +
                "  |  Roma " + euro(rm.nettoAnnuo) +
                "  (differenza " + euro(mi.nettoAnnuo - rm.nettoAnnuo) + ")");
  });
  console.log("");

  // --- Controlli automatici sui comportamenti ai bordi -------------------
  console.log("=== Controlli automatici ===\n");
  var falliti = 0;

  function verifica(descrizione, condizione) {
    console.log((condizione ? "OK   " : "FAIL ") + descrizione);
    if (!condizione) falliti++;
  }

  var r15k = calcolaNetto_(15000, "milano", parametri);
  var r16518 = calcolaNetto_(16518, "milano", parametri);
  var r20k = calcolaNetto_(20000, "milano", parametri);
  var r30k = calcolaNetto_(30000, "milano", parametri);
  var r45k = calcolaNetto_(45000, "milano", parametri);
  var r60k = calcolaNetto_(60000, "milano", parametri);
  var r130k = calcolaNetto_(130000, "milano", parametri);

  verifica("RAL 16.518: imponibile ≈ 15.000 (punto di rottura del trattamento integrativo)",
    Math.abs(r16518.imponibile - 15000) < 1);
  verifica("RAL 16.518: trattamento integrativo pieno (1.200 €)",
    r16518.trattamentoIntegrativo === 1200);
  verifica("RAL 20.000: trattamento integrativo zero (fascia 15-28k, detrazione < lorda)",
    r20k.trattamentoIntegrativo === 0);
  verifica("RAL 15.000: somma esente al 5,3% dell'imponibile",
    Math.abs(r15k.sommaEsente - r15k.imponibile * 0.053) < 0.01);
  verifica("RAL 30.000: fuori dalla somma esente (reddito > 20.000)",
    r30k.sommaEsente === 0);
  verifica("RAL 30.000: ulteriore detrazione fissa di 1.000 €",
    r30k.ulterioreDetrazione === 1000);
  verifica("RAL 45.000: imponibile > 40.000, ulteriore detrazione azzerata",
    r45k.imponibile > 40000 && r45k.ulterioreDetrazione === 0);
  verifica("RAL 45.000: nessun 1% aggiuntivo (sotto la prima fascia 56.224)",
    r45k.contributi.quotaAggiuntiva === 0);
  verifica("RAL 60.000: 1% aggiuntivo attivo sulla quota oltre 56.224",
    Math.abs(r60k.contributi.quotaAggiuntiva - (60000 - 56224) * 0.01) < 0.01);
  verifica("RAL 60.000: detrazione lavoro azzerata (reddito > 50.000)",
    r60k.detrazioneLavoro === 0);
  verifica("RAL 130.000: base contributiva ferma al massimale 122.295",
    r130k.contributi.base === 122295);
  verifica("Netto crescente al crescere della RAL (nessun gradino negativo tra i casi di prova)",
    r15k.nettoAnnuo < r16518.nettoAnnuo && r16518.nettoAnnuo < r20k.nettoAnnuo &&
    r20k.nettoAnnuo < r30k.nettoAnnuo && r30k.nettoAnnuo < r45k.nettoAnnuo &&
    r45k.nettoAnnuo < r60k.nettoAnnuo && r60k.nettoAnnuo < r130k.nettoAnnuo);

  console.log("\n" + (falliti === 0 ? "Tutti i controlli superati."
                                    : falliti + " controlli FALLITI."));
})();
