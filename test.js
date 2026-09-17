/*
 * test.js — Casi di prova eseguibili.
 *
 * Da terminale:            node test.js      (exit code 1 se qualcosa fallisce)
 * Oppure nel browser:      aggiungere <script src="test.js"></script> in
 *                          index.html e leggere la console.
 *
 * Sezioni:
 *   1. Tabella completa per Milano, senza carichi (RAL ai bordi delle regole)
 *   2. Confronto del netto nei 21 capoluoghi, RAL 30.000
 *   3. Controlli automatici: catena base, carichi familiari, addizionali
 *      regionali (clausole), addizionali comunali, integrità dei parametri
 *
 * Le RAL della sezione 1 coprono i comportamenti ai bordi:
 *   15.000  → sotto la rottura del trattamento integrativo, somma esente 5,3%
 *   16.518  → imponibile ≈ 15.000: ultimo punto in cui spetta il trattamento
 *   20.000  → somma esente 4,8%, reddito ancora ≤ 20.000
 *   30.000  → fuori dalla somma esente, ulteriore detrazione fissa 1.000 €
 *   45.000  → imponibile > 40.000: uscito anche dall'ulteriore detrazione
 *   60.000  → oltre la prima fascia di pensionabilità: 1% aggiuntivo attivo
 *   130.000 → oltre il massimale contributivo: contributi calcolati su 122.295
 *
 * I valori stampati vanno confrontati con i calcolatori online tenendo
 * conto delle semplificazioni dichiarate nel README.
 */

(function () {
  "use strict";

  // In Node carichiamo i file con require; nel browser gli script classici
  // hanno già definito i globali PARAMETRI_2026 e le funzioni di calcolo.
  var P, C;
  if (typeof module !== "undefined" && typeof require === "function") {
    P = require("./parametri-2026.js");
    C = require("./calcolo.js");
  } else {
    P = PARAMETRI_2026;
    C = {
      calcolaNetto: calcolaNetto,
      calcolaDetrazioneConiuge: calcolaDetrazioneConiuge,
      calcolaDetrazioneFigli: calcolaDetrazioneFigli,
      calcolaDetrazioneAscendenti: calcolaDetrazioneAscendenti,
      calcolaAddizionaleRegionale: calcolaAddizionaleRegionale,
      calcolaAddizionaleComunale: calcolaAddizionaleComunale,
      normalizzaFamiglia: normalizzaFamiglia,
      troncaQuattroDecimali: troncaQuattroDecimali
    };
  }

  var RAL_DI_PROVA = [15000, 16518, 20000, 30000, 45000, 60000, 130000];

  function euro(x) {
    return x.toFixed(2).replace(".", ",") + " €";
  }
  function circa(a, b, tolleranza) {
    return Math.abs(a - b) < (tolleranza === undefined ? 0.01 : tolleranza);
  }

  // --- 1. Tabella completa per Milano, senza carichi ---------------------
  console.log("=== Calcolo completo — Milano, nessun carico familiare ===\n");

  RAL_DI_PROVA.forEach(function (ral) {
    var r = C.calcolaNetto(ral, "milano", P);
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

  // --- 2. Confronto capoluoghi sul netto annuo, RAL 30.000 ---------------
  console.log("=== Confronto capoluoghi — RAL 30.000 €, nessun carico ===\n");
  Object.keys(P.COMUNI).forEach(function (codice) {
    var r = C.calcolaNetto(30000, codice, P);
    console.log("  " + (r.comune + " (" + r.regione + ")").padEnd(46) +
                " reg. " + euro(r.addizionaleRegionale).padStart(10) +
                "  com. " + euro(r.addizionaleComunale).padStart(9) +
                "  netto " + euro(r.nettoAnnuo));
  });
  console.log("");

  // --- 3. Controlli automatici -------------------------------------------
  console.log("=== Controlli automatici ===\n");
  var falliti = 0;

  function verifica(descrizione, condizione) {
    console.log((condizione ? "OK   " : "FAIL ") + descrizione);
    if (!condizione) falliti++;
  }
  function sezione(titolo) { console.log("\n-- " + titolo); }

  // 3a. Catena base (Milano, nessun carico): comportamenti ai bordi.
  sezione("Catena base");
  var r15k = C.calcolaNetto(15000, "milano", P);
  var r16518 = C.calcolaNetto(16518, "milano", P);
  var r20k = C.calcolaNetto(20000, "milano", P);
  var r30k = C.calcolaNetto(30000, "milano", P);
  var r45k = C.calcolaNetto(45000, "milano", P);
  var r60k = C.calcolaNetto(60000, "milano", P);
  var r130k = C.calcolaNetto(130000, "milano", P);

  verifica("RAL 16.518: imponibile ≈ 15.000 (punto di rottura del trattamento integrativo)",
    Math.abs(r16518.imponibile - 15000) < 1);
  verifica("RAL 16.518: trattamento integrativo pieno (1.200 €)",
    r16518.trattamentoIntegrativo === 1200);
  verifica("RAL 20.000: trattamento integrativo zero (fascia 15-28k, detrazione < lorda)",
    r20k.trattamentoIntegrativo === 0);
  verifica("RAL 15.000: somma esente al 5,3% dell'imponibile",
    circa(r15k.sommaEsente, r15k.imponibile * 0.053));
  verifica("RAL 30.000: fuori dalla somma esente (reddito > 20.000)",
    r30k.sommaEsente === 0);
  verifica("RAL 30.000: ulteriore detrazione fissa di 1.000 €",
    r30k.ulterioreDetrazione === 1000);
  verifica("RAL 45.000: imponibile > 40.000, ulteriore detrazione azzerata",
    r45k.imponibile > 40000 && r45k.ulterioreDetrazione === 0);
  verifica("RAL 45.000: nessun 1% aggiuntivo (sotto la prima fascia 56.224)",
    r45k.contributi.quotaAggiuntiva === 0);
  verifica("RAL 60.000: 1% aggiuntivo attivo sulla quota oltre 56.224",
    circa(r60k.contributi.quotaAggiuntiva, (60000 - 56224) * 0.01));
  verifica("RAL 60.000: detrazione lavoro azzerata (reddito > 50.000)",
    r60k.detrazioneLavoro === 0);
  verifica("RAL 130.000: base contributiva ferma al massimale 122.295",
    r130k.contributi.base === 122295);
  verifica("Netto crescente al crescere della RAL (nessun gradino negativo tra i casi di prova)",
    r15k.nettoAnnuo < r16518.nettoAnnuo && r16518.nettoAnnuo < r20k.nettoAnnuo &&
    r20k.nettoAnnuo < r30k.nettoAnnuo && r30k.nettoAnnuo < r45k.nettoAnnuo &&
    r45k.nettoAnnuo < r60k.nettoAnnuo && r60k.nettoAnnuo < r130k.nettoAnnuo);
  verifica("Forma compatta \"milano\" ≡ { comune: \"milano\" }",
    C.calcolaNetto(30000, { comune: "milano" }, P).nettoAnnuo === r30k.nettoAnnuo);
  verifica("Milano senza carichi: le detrazioni familiari sono zero",
    r30k.detrazioniFamiliari.totale === 0);

  // 3b. Carichi familiari (art. 12 TUIR): funzioni unitarie sul reddito.
  sezione("Carichi familiari (art. 12 TUIR)");
  var F = P.detrazioniFamiliari;
  var t4 = C.troncaQuattroDecimali;

  verifica("Coniuge, RC 10.000: 800 − 110 × 0,6666 = 726,67",
    circa(C.calcolaDetrazioneConiuge(10000, F.coniuge), 800 - 110 * t4(10000 / 15000)));
  verifica("Coniuge, RC 15.000: quoziente 1 → 690",
    C.calcolaDetrazioneConiuge(15000, F.coniuge) === 690);
  verifica("Coniuge, RC 25.000: 690 fissi",
    C.calcolaDetrazioneConiuge(25000, F.coniuge) === 690);
  verifica("Coniuge, RC 30.000: 690 + maggiorazione 20 (fascia 29.200–34.700)",
    C.calcolaDetrazioneConiuge(30000, F.coniuge) === 710);
  verifica("Coniuge, RC 34.800: 690 + maggiorazione 30 (fascia 34.700–35.000)",
    C.calcolaDetrazioneConiuge(34800, F.coniuge) === 720);
  verifica("Coniuge, RC 60.000: 690 × 0,5 = 345",
    circa(C.calcolaDetrazioneConiuge(60000, F.coniuge), 345));
  verifica("Coniuge, RC 80.001: zero",
    C.calcolaDetrazioneConiuge(80001, F.coniuge) === 0);

  function fam(o) { return C.normalizzaFamiglia(o); }
  verifica("1 figlio 21-29, RC 30.000: 950 × 0,6842 = 649,99",
    circa(C.calcolaDetrazioneFigli(30000, fam({ figliACarico: 1, figliConDetrazione: 1 }), F.figli), 950 * t4(65000 / 95000)));
  verifica("2 figli a carico di cui 1 con detrazione, RC 30.000: base 110.000 → 950 × 0,7272",
    circa(C.calcolaDetrazioneFigli(30000, fam({ figliACarico: 2, figliConDetrazione: 1 }), F.figli), 950 * t4(80000 / 110000)));
  verifica("1 figlio disabile, RC 30.000: 1.350 × 0,6842",
    circa(C.calcolaDetrazioneFigli(30000, fam({ figliACarico: 1, figliConDetrazione: 1, figliDisabili: 1 }), F.figli), 1350 * t4(65000 / 95000)));
  verifica("1 figlio al 50%, RC 30.000: metà della detrazione piena",
    circa(C.calcolaDetrazioneFigli(30000, fam({ figliACarico: 1, figliConDetrazione: 1, percentualeFigli: 0.5 }), F.figli), 950 * t4(65000 / 95000) / 2));
  verifica("1 figlio, RC 95.000: quoziente zero → nessuna detrazione",
    C.calcolaDetrazioneFigli(95000, fam({ figliACarico: 1, figliConDetrazione: 1 }), F.figli) === 0);
  verifica("2 figli a carico ma nessuno 21-29: zero (Assegno Unico, fuori perimetro)",
    C.calcolaDetrazioneFigli(30000, fam({ figliACarico: 2, figliConDetrazione: 0 }), F.figli) === 0);
  verifica("Incoerenza figliConDetrazione > figliACarico: si tronca al totale",
    circa(C.calcolaDetrazioneFigli(30000, fam({ figliACarico: 1, figliConDetrazione: 3 }), F.figli), 950 * t4(65000 / 95000)));
  verifica("1 ascendente, RC 40.000: 750 × 0,5 = 375",
    circa(C.calcolaDetrazioneAscendenti(40000, 1, F.ascendenti), 375));
  verifica("Ascendente, RC 80.000: zero",
    C.calcolaDetrazioneAscendenti(80000, 1, F.ascendenti) === 0);

  // Effetti sulla catena: IRPEF netta, trattamento integrativo, addizionali.
  var rFam = C.calcolaNetto(18000, { comune: "milano", famiglia: { coniugeACarico: true, figliACarico: 2, figliConDetrazione: 2 } }, P);
  verifica("RAL 18.000 con coniuge e 2 figli: detrazioni > lorda → IRPEF netta zero",
    rFam.irpefNetta === 0);
  verifica("RAL 18.000 con coniuge e 2 figli: trattamento integrativo pieno grazie alle detrazioni art. 12",
    rFam.trattamentoIntegrativo === 1200);
  verifica("RAL 18.000 con coniuge e 2 figli: addizionali zero perché l'IRPEF netta è zero",
    rFam.addizionaleRegionale === 0 && rFam.addizionaleComunale === 0);
  var rSolo = C.calcolaNetto(35000, "milano", P);
  var rConiuge = C.calcolaNetto(35000, { comune: "milano", famiglia: { coniugeACarico: true } }, P);
  verifica("RAL 35.000: il coniuge a carico riduce l'IRPEF netta esattamente della detrazione",
    circa(rSolo.irpefNetta - rConiuge.irpefNetta, rConiuge.detrazioniFamiliari.coniuge));

  // 3c. Addizionali regionali: clausole, sull'imponibile diretto.
  sezione("Addizionali regionali (clausole)");
  var R = P.REGIONI;
  function reg(codice, imponibile) { return C.calcolaAddizionaleRegionale(imponibile, R[codice].regionale); }

  verifica("Lombardia 30.000: 15.000×1,23% + 13.000×1,58% + 2.000×1,72% = 424,3",
    circa(reg("lombardia", 30000), 184.5 + 205.4 + 34.4));
  verifica("Valle d'Aosta 15.000: esente",
    reg("valle_aosta", 15000) === 0);
  verifica("Valle d'Aosta 15.001: 1,23% sull'intero imponibile (esenzione, non franchigia)",
    circa(reg("valle_aosta", 15001), 15001 * 0.0123));
  verifica("Friuli-VG 14.000: 0,70% sull'intero imponibile",
    circa(reg("friuli_venezia_giulia", 14000), 98));
  verifica("Friuli-VG 20.000: 1,23% sull'intero imponibile",
    circa(reg("friuli_venezia_giulia", 20000), 246));
  verifica("Umbria 28.000: aliquota base 1,23% su tutto (maggiorazioni disapplicate)",
    circa(reg("umbria", 28000), 344.4));
  verifica("Umbria 40.000: scaglioni pieni − 150 € = 1.026,5 − 150",
    circa(reg("umbria", 40000), 259.5 + 392.6 + 374.4 - 150));
  verifica("Umbria 60.000: scaglioni pieni senza detrazione = 1.671,5",
    circa(reg("umbria", 60000), 259.5 + 392.6 + 686.4 + 333));
  verifica("Lazio 28.000: 1,73% su tutto = 484,4",
    circa(reg("lazio", 28000), 484.4));
  verifica("Lazio 29.000: scaglioni − 60 = 259,5 + 466,2 − 60",
    circa(reg("lazio", 29000), 259.5 + 14000 * 0.0333 - 60));
  verifica("Lazio 31.000: scaglioni senza detrazione",
    circa(reg("lazio", 31000), 259.5 + 16000 * 0.0333));
  verifica("Trento 30.000: deduzione 30.000 → zero",
    reg("trento", 30000) === 0);
  verifica("Trento 30.001: 1,23% su tutto",
    circa(reg("trento", 30001), 30001 * 0.0123));
  verifica("Trento 60.000: 50.000×1,23% + 10.000×1,73% = 788",
    circa(reg("trento", 60000), 788));
  verifica("Bolzano 30.000: 369 − 430,50 → zero (nessun credito)",
    reg("bolzano", 30000) === 0);
  verifica("Bolzano 60.000: 788 − 430,50 − 125×10.000/25.000 = 307,5",
    circa(reg("bolzano", 60000), 788 - 430.5 - 50));
  verifica("Bolzano 100.000: 615 + 865 − 125 (tetto), senza i 430,50 (oltre 90.000)",
    circa(reg("bolzano", 100000), 615 + 865 - 125));
  verifica("Molise 60.000: 304,5 + 289,9 + 32.000×3,63% = 1.756",
    circa(reg("molise", 60000), 304.5 + 289.9 + 1161.6));
  verifica("Abruzzo 30.000: 28.000×1,67% + 2.000×2,87%",
    circa(reg("abruzzo", 30000), 467.6 + 57.4));
  verifica("Puglia 30.000 (aliquote da decreto 28/05/2026): 199,5 + 276,9 + 64,6",
    circa(reg("puglia", 30000), 199.5 + 276.9 + 64.6));

  // 3d. Addizionali comunali.
  sezione("Addizionali comunali");
  var K = P.COMUNI;
  function com(codice, imponibile) { return C.calcolaAddizionaleComunale(imponibile, K[codice]); }

  verifica("Milano 23.000: esente", com("milano", 23000) === 0);
  verifica("Milano 23.001: 0,8% sull'intero imponibile", circa(com("milano", 23001), 184.008));
  verifica("Torino 30.000: scaglioni 28.000×0,8% + 2.000×1,1% = 246", circa(com("torino", 30000), 246));
  verifica("Torino 11.790: esente", com("torino", 11790) === 0);
  verifica("Genova 60.000: 280 + 242 + 120 = 642", circa(com("genova", 60000), 642));
  verifica("Cagliari 20.000: 99 + 36 = 135", circa(com("cagliari", 20000), 15000 * 0.0066 + 5000 * 0.0072));
  verifica("Perugia 12.500: esente; 12.501: dovuta", com("perugia", 12500) === 0 && com("perugia", 12501) > 0);
  verifica("Ancona 5.000: nessuna esenzione → 40", circa(com("ancona", 5000), 40));
  verifica("Trento: non applica", com("trento", 50000) === 0);
  verifica("Bolzano: non applica", com("bolzano", 50000) === 0);
  verifica("Palermo 20.000: 1,03% = 206", circa(com("palermo", 20000), 206));
  verifica("Comune personalizzato {aliquota 0,6%, esenzione 10.000}: 9.000 → 0, 20.000 → 120",
    C.calcolaAddizionaleComunale(9000, { aliquota: 0.006, esenzione: 10000 }) === 0 &&
    circa(C.calcolaAddizionaleComunale(20000, { aliquota: 0.006, esenzione: 10000 }), 120));
  var rCustom = C.calcolaNetto(30000, { regione: "lombardia", comune: { nome: "Lodi (esempio)", aliquota: 0.006, esenzione: 10000 } }, P);
  verifica("calcolaNetto con comune personalizzato: usa la regione indicata e l'aliquota data",
    rCustom.regione === "Lombardia" && rCustom.comune === "Lodi (esempio)" &&
    circa(rCustom.addizionaleComunale, rCustom.imponibile * 0.006));
  var rSenza = C.calcolaNetto(30000, { regione: "veneto" }, P);
  verifica("calcolaNetto con sola regione: addizionale comunale zero",
    rSenza.addizionaleComunale === 0 && rSenza.addizionaleRegionale > 0);
  var erroreComune = false;
  try { C.calcolaNetto(30000, "atlantide", P); } catch (e) { erroreComune = /Comune sconosciuto/.test(e.message); }
  verifica("Comune sconosciuto → errore esplicito", erroreComune);

  // 3e. Integrità dei parametri e sanità su tutta la griglia.
  sezione("Integrità parametri e monotonia");
  var codiciRegioni = Object.keys(R);
  var codiciComuni = Object.keys(K);
  verifica("21 regioni/province autonome e 21 capoluoghi in elenco",
    codiciRegioni.length === 21 && codiciComuni.length === 21);
  verifica("Ogni comune punta a una regione esistente",
    codiciComuni.every(function (c) { return !!R[K[c].regione]; }));
  verifica("Ogni regione ha scaglioni che terminano con Infinity",
    codiciRegioni.every(function (c) {
      var s = R[c].regionale.scaglioni; return s.length > 0 && s[s.length - 1].fino === Infinity;
    }));
  verifica("Ogni comune ha aliquota, scaglioni oppure applica:false",
    codiciComuni.every(function (c) {
      var k = K[c]; return k.applica === false || typeof k.aliquota === "number" || Array.isArray(k.scaglioni);
    }));
  verifica("Ogni regione e comune riporta la fonte (commento o campo fonte)",
    codiciComuni.every(function (c) { return typeof K[c].fonte === "string" && K[c].fonte.length > 10; }));

  var monotone = true, finiti = true, dettaglio = "";
  codiciRegioni.forEach(function (c) {
    var prec = -1;
    for (var imp = 1000; imp <= 150000; imp += 500) {
      var v = reg(c, imp);
      if (!isFinite(v) || v < 0) { finiti = false; dettaglio += " " + c + "@" + imp; }
      if (v < prec - 1e-9) { monotone = false; dettaglio += " " + c + "@" + imp; }
      prec = v;
    }
  });
  codiciComuni.forEach(function (c) {
    var prec = -1;
    for (var imp = 1000; imp <= 150000; imp += 500) {
      var v = com(c, imp);
      if (!isFinite(v) || v < 0) { finiti = false; dettaglio += " " + c + "@" + imp; }
      if (v < prec - 1e-9) { monotone = false; dettaglio += " " + c + "@" + imp; }
      prec = v;
    }
  });
  verifica("Addizionali finite e non negative su tutta la griglia 1.000–150.000" + (finiti ? "" : ":" + dettaglio), finiti);
  verifica("Addizionali mai decrescenti al crescere dell'imponibile" + (monotone ? "" : ":" + dettaglio), monotone);

  var nettoMonotono = true;
  codiciComuni.forEach(function (c) {
    var prec = -Infinity;
    for (var ral = 5000; ral <= 200000; ral += 1000) {
      var n = C.calcolaNetto(ral, c, P).nettoAnnuo;
      if (n < prec) { nettoMonotono = false; dettaglio += " " + c + "@" + ral; }
      prec = n;
    }
  });
  verifica("Netto annuo mai decrescente al crescere della RAL, in tutti i capoluoghi (passo 1.000)", nettoMonotono);

  console.log("\n" + (falliti === 0 ? "Tutti i controlli superati."
                                    : falliti + " controlli FALLITI."));
  if (falliti > 0 && typeof process !== "undefined") process.exitCode = 1;
})();
