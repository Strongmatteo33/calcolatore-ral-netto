/*
 * calcolo.js — Catena di calcolo RAL → netto, anno d'imposta 2026.
 *
 * Solo funzioni pure: nessun riferimento al DOM, nessuno stato condiviso.
 * Ogni funzione riceve esplicitamente i parametri normativi (l'oggetto
 * PARAMETRI_2026 o sue sezioni), così è testabile in isolamento.
 *
 * Assunzioni del perimetro (vedi README): dipendente privato, tempo
 * indeterminato full time, anno intero, nessun altro reddito né onere
 * deducibile/detraibile oltre a quelli calcolati qui, iscrizione
 * previdenziale post-1995 (il massimale si applica), reddito complessivo
 * coincidente con l'imponibile da lavoro.
 *
 * File caricato come script classico: espone funzioni globali.
 */

/* Tronca un numero alla quarta cifra decimale. Gli artt. 12 e 13 TUIR
 * prescrivono di assumere i quozienti "nelle prime quattro cifre decimali". */
function troncaQuattroDecimali(x) {
  return Math.floor(x * 10000) / 10000;
}

/* Applica aliquote per scaglioni progressivi: ogni aliquota si applica solo
 * alla quota di base che ricade nel proprio scaglione. Usata per l'IRPEF e
 * per le addizionali con aliquote differenziate. */
function calcolaPerScaglioni(base, scaglioni) {
  var importo = 0;
  var pavimento = 0; // limite inferiore dello scaglione corrente
  for (var i = 0; i < scaglioni.length; i++) {
    var quota = Math.min(base, scaglioni[i].fino) - pavimento;
    if (quota <= 0) break;
    importo += quota * scaglioni[i].aliquota;
    pavimento = scaglioni[i].fino;
  }
  return importo;
}

/* 1. Contributi previdenziali a carico del lavoratore.
 * 9,19% sulla RAL fino al massimale contributivo, più l'1% aggiuntivo sulla
 * quota eccedente la prima fascia di pensionabilità. Oltre il massimale
 * (iscritti post-1995) non si versa nulla: la base è min(RAL, massimale). */
function calcolaContributi(ral, contributi) {
  var base = Math.min(ral, contributi.massimaleContributivo);
  var quotaOrdinaria = base * contributi.aliquotaLavoratore;
  var eccedenza = Math.max(0, base - contributi.primaFasciaPensionabile);
  var quotaAggiuntiva = eccedenza * contributi.aliquotaAggiuntiva;
  return {
    base: base,
    quotaOrdinaria: quotaOrdinaria,
    quotaAggiuntiva: quotaAggiuntiva,
    totale: quotaOrdinaria + quotaAggiuntiva
  };
}

/* 2. Imponibile fiscale: i contributi obbligatori sono interamente
 * deducibili (art. 51 co. 2 lett. a TUIR). Nel nostro perimetro coincide
 * con il reddito complessivo, usato per tutte le soglie successive. */
function calcolaImponibile(ral, totaleContributi) {
  return ral - totaleContributi;
}

/* 3. IRPEF lorda a scaglioni progressivi. */
function calcolaIrpefLorda(imponibile, scaglioni) {
  return calcolaPerScaglioni(imponibile, scaglioni);
}

/* 4. Detrazione per lavoro dipendente (art. 13 co. 1 TUIR), su base annua
 * (365 giorni di detrazione). Azzerata oltre 50.000 € di reddito.
 * Attenzione alla formula della terza fascia: è 1.910 × quoziente, SENZA
 * l'addendo 1.190 (che appartiene alla formula della seconda fascia). */
function calcolaDetrazioneLavoro(reddito, detrazioneLavoro) {
  var d = detrazioneLavoro;
  var importo;

  if (reddito <= d.fascia1.sogliaMax) {
    importo = d.fascia1.importo;
  } else if (reddito <= d.fascia2.sogliaMax) {
    var q2 = troncaQuattroDecimali((d.fascia2.sogliaMax - reddito) / d.fascia2.denominatore);
    importo = d.fascia2.base + d.fascia2.incremento * q2;
  } else if (reddito <= d.fascia3.sogliaMax) {
    var q3 = troncaQuattroDecimali((d.fascia3.sogliaMax - reddito) / d.fascia3.denominatore);
    importo = d.fascia3.base * q3;
  } else {
    importo = 0;
  }

  // Maggiorazione di 65 € (co. 1-bis) per 25.000 < reddito ≤ 35.000:
  // importo fisso, non ragguagliato ai giorni.
  var m = d.maggiorazione;
  if (reddito > m.redditoMin && reddito <= m.redditoMax) {
    importo += m.importo;
  }
  return importo;
}

/* 5a. Detrazione per coniuge a carico (art. 12 co. 1 lett. a e b TUIR).
 * Tre fasce sul reddito complessivo, con quozienti troncati a quattro
 * decimali, più le maggiorazioni fisse per le fasce strette 29.000–35.200. */
function calcolaDetrazioneConiuge(reddito, coniuge) {
  var importo;
  if (reddito <= coniuge.fascia1.sogliaMax) {
    var q1 = troncaQuattroDecimali(reddito / coniuge.fascia1.denominatore);
    importo = coniuge.fascia1.base - coniuge.fascia1.decremento * q1;
  } else if (reddito <= coniuge.fascia2.sogliaMax) {
    importo = coniuge.fascia2.importo;
  } else if (reddito <= coniuge.fascia3.sogliaMax) {
    var q3 = troncaQuattroDecimali((coniuge.fascia3.sogliaMax - reddito) / coniuge.fascia3.denominatore);
    importo = q3 > 0 ? coniuge.fascia3.base * q3 : 0;
  } else {
    return 0;
  }
  for (var i = 0; i < coniuge.maggiorazioni.length; i++) {
    var mg = coniuge.maggiorazioni[i];
    if (reddito > mg.oltre && reddito <= mg.finoA) {
      importo += mg.importo;
      break;
    }
  }
  return importo;
}

/* 5b. Detrazione per figli a carico (art. 12 co. 1 lett. c TUIR).
 * Spetta solo per i figli da 21 a 29 anni, o disabili di qualsiasi età
 * (i minori di 21 anni sono coperti dall'Assegno Unico). Il numero
 * complessivo di figli a carico alza però la base di 15.000 € per ogni
 * figlio oltre il primo, e quindi il quoziente per tutti.
 *   figliACarico        n, tutti i figli fiscalmente a carico
 *   figliConDetrazione  m ≤ n, quelli per cui la detrazione spetta
 *   figliDisabili       k ≤ m, quelli con maggiorazione di 400 €
 *   percentualeFigli    1 (100%) o 0,5 (50%, ripartizione tra genitori) */
function calcolaDetrazioneFigli(reddito, famiglia, figli) {
  var n = famiglia.figliACarico;
  var m = Math.min(famiglia.figliConDetrazione, n);
  var k = Math.min(famiglia.figliDisabili, m);
  if (m <= 0) return 0;

  var base = figli.redditoBase + figli.incrementoPerFiglioSuccessivo * (n - 1);
  var q = troncaQuattroDecimali((base - reddito) / base);
  if (q <= 0) return 0;

  var teorica = (m - k) * figli.importoBase + k * (figli.importoBase + figli.maggiorazioneDisabile);
  return teorica * q * famiglia.percentualeFigli;
}

/* 5c. Detrazione per ascendenti conviventi a carico (art. 12 co. 1 lett. d
 * TUIR): 750 € ciascuno, ridotti col quoziente (80.000 − RC) / 80.000.
 * Si assume che il contribuente sia l'unico a farsene carico. */
function calcolaDetrazioneAscendenti(reddito, numero, ascendenti) {
  if (numero <= 0) return 0;
  var q = troncaQuattroDecimali((ascendenti.redditoAzzeramento - reddito) / ascendenti.redditoAzzeramento);
  if (q <= 0) return 0;
  return numero * ascendenti.importo * q;
}

/* Riempie con i default (nessun carico) i campi non indicati e forza numeri
 * interi non negativi, così il resto della catena non deve difendersi. */
function normalizzaFamiglia(famiglia) {
  famiglia = famiglia || {};
  function intero(x) { x = parseInt(x, 10); return isFinite(x) && x > 0 ? x : 0; }
  return {
    coniugeACarico: !!famiglia.coniugeACarico,
    figliACarico: intero(famiglia.figliACarico),
    figliConDetrazione: intero(famiglia.figliConDetrazione),
    figliDisabili: intero(famiglia.figliDisabili),
    percentualeFigli: famiglia.percentualeFigli === 0.5 ? 0.5 : 1,
    ascendentiACarico: intero(famiglia.ascendentiACarico)
  };
}

/* Wrapper: tutte le detrazioni art. 12, con il dettaglio per la tabella. */
function calcolaDetrazioniFamiliari(reddito, famiglia, parametriFamiliari) {
  var coniuge = famiglia.coniugeACarico
    ? calcolaDetrazioneConiuge(reddito, parametriFamiliari.coniuge) : 0;
  var figli = calcolaDetrazioneFigli(reddito, famiglia, parametriFamiliari.figli);
  var ascendenti = calcolaDetrazioneAscendenti(reddito, famiglia.ascendentiACarico, parametriFamiliari.ascendenti);
  return { coniuge: coniuge, figli: figli, ascendenti: ascendenti, totale: coniuge + figli + ascendenti };
}

/* 6a. Cuneo fiscale — somma esente (art. 1 co. 4-5 L. 207/2024).
 * Spetta se il reddito complessivo non supera 20.000 €. La percentuale si
 * individua in base al reddito di lavoro dipendente e si applica all'INTERO
 * reddito di lavoro, non a scaglioni. Per la Circolare AE 4/E/2025 è una
 * somma aggiuntiva erogata in busta che non concorre alla formazione del
 * reddito: NON riduce l'imponibile, si somma al netto (vedi calcolaNetto). */
function calcolaSommaEsente(redditoComplessivo, redditoLavoro, sommaEsente) {
  if (redditoComplessivo > sommaEsente.sogliaRedditoComplessivo) return 0;
  for (var i = 0; i < sommaEsente.fasce.length; i++) {
    if (redditoLavoro <= sommaEsente.fasce[i].finoARedditoLavoro) {
      return redditoLavoro * sommaEsente.fasce[i].percentuale;
    }
  }
  return 0; // irraggiungibile: l'ultima fascia arriva a Infinity
}

/* 6b. Cuneo fiscale — ulteriore detrazione (art. 1 co. 6 L. 207/2024).
 * Agisce a valle, sull'imposta lorda: 1.000 € fissi per redditi
 * 20.000–32.000, poi decrescente fino ad azzerarsi a 40.000. */
function calcolaUlterioreDetrazione(redditoComplessivo, ulterioreDetrazione) {
  var u = ulterioreDetrazione;
  if (redditoComplessivo <= u.redditoMin || redditoComplessivo > u.redditoAzzeramento) {
    return 0;
  }
  if (redditoComplessivo <= u.sogliaImportoFisso) {
    return u.importoFisso;
  }
  return u.importoFisso * (u.redditoAzzeramento - redditoComplessivo) /
         (u.redditoAzzeramento - u.sogliaImportoFisso);
}

/* Wrapper che tiene insieme le due misure del cuneo, per leggibilità
 * dell'orchestratore e della tabella di output. */
function calcolaCuneoFiscale(redditoComplessivo, redditoLavoro, cuneo) {
  return {
    sommaEsente: calcolaSommaEsente(redditoComplessivo, redditoLavoro, cuneo.sommaEsente),
    ulterioreDetrazione: calcolaUlterioreDetrazione(redditoComplessivo, cuneo.ulterioreDetrazione)
  };
}

/* 7. Trattamento integrativo (art. 1 D.L. 3/2020): è un CREDITO che si
 * somma al netto, non riduce l'imposta. Le soglie sono sul reddito
 * complessivo, non sulla RAL: 15.000 € di reddito ≈ 16.518 € di RAL.
 * "detrazioniFamiliari" è il totale art. 12: entra nella verifica della
 * seconda fascia perché la norma elenca le detrazioni art. 12 co. 1 e
 * art. 13 co. 1 (l'ulteriore detrazione del cuneo NON è nell'elenco). */
function calcolaTrattamentoIntegrativo(redditoComplessivo, irpefLorda, detrazioneLavoro, detrazioniFamiliari, ti) {
  if (redditoComplessivo <= ti.sogliaFascia1) {
    // Verifica di capienza: imposta lorda superiore alla detrazione
    // spettante diminuita di 75 €. Su anno intero: 1.955 − 75 = 1.880 €,
    // cioè il valore pre-riforma — il −75 € serve proprio a neutralizzare
    // l'aumento della detrazione (1.880 → 1.955) in questa verifica.
    return irpefLorda > (detrazioneLavoro - ti.franchigiaCapienza) ? ti.importoAnnuo : 0;
  }
  if (redditoComplessivo <= ti.sogliaFascia2) {
    // Fascia 15.000–28.000: spetta solo se la somma delle detrazioni
    // (art. 13 + art. 12, dato il perimetro) supera l'imposta lorda, per la
    // differenza, con tetto a 1.200 €. Senza carichi familiari la sola
    // detrazione art. 13 non supera MAI l'imposta lorda in questa fascia
    // (a 15.000 €: detrazione ~3.100 vs lorda 3.450; il divario cresce col
    // reddito): il risultato è zero. Con coniuge o figli a carico può
    // invece spettare.
    return Math.max(0, Math.min(ti.importoAnnuo, detrazioneLavoro + detrazioniFamiliari - irpefLorda));
  }
  return 0; // oltre 28.000 € non spetta
}

/* 8. Addizionale regionale, sull'imponibile IRPEF. Meccanica generale
 * descritta in parametri-2026.js (sezione REGIONI): esenzione totale,
 * aliquota unica sotto soglia, scaglioni progressivi, detrazioni fisse per
 * fascia e detrazione progressiva. Nessuna clausola genera crediti. */
function calcolaAddizionaleRegionale(imponibile, regionale) {
  if (regionale.esenzione && imponibile <= regionale.esenzione) return 0;

  var importo;
  var unica = regionale.aliquotaUnicaSottoSoglia;
  if (unica && imponibile <= unica.soglia) {
    importo = imponibile * unica.aliquota;
  } else {
    importo = calcolaPerScaglioni(imponibile, regionale.scaglioni);
  }

  var detrazioni = regionale.detrazioni || [];
  for (var i = 0; i < detrazioni.length; i++) {
    var d = detrazioni[i];
    var sopraMin = d.oltre === undefined || imponibile > d.oltre;
    var sottoMax = d.finoA === undefined || imponibile <= d.finoA;
    if (sopraMin && sottoMax) importo -= d.importo;
  }

  var dp = regionale.detrazioneProgressiva;
  if (dp && imponibile > dp.oltre) {
    importo -= Math.min(dp.massimo, dp.importo * (imponibile - dp.oltre) / dp.denominatore);
  }
  return Math.max(0, importo);
}

/* 9. Addizionale comunale, sull'imponibile IRPEF. La soglia è un'esenzione
 * totale, non una franchigia: sotto la soglia non si paga nulla, sopra si
 * paga sull'intero imponibile (ad aliquota unica o per scaglioni). */
function calcolaAddizionaleComunale(imponibile, comune) {
  if (comune.applica === false) return 0;
  if (comune.esenzione && imponibile <= comune.esenzione) return 0;
  if (comune.scaglioni) return calcolaPerScaglioni(imponibile, comune.scaglioni);
  return imponibile * (comune.aliquota || 0);
}

/* Le addizionali sono dovute solo se per l'anno risulta dovuta l'IRPEF al
 * netto delle detrazioni (art. 50 co. 2 D.Lgs. 446/1997; art. 1 D.Lgs.
 * 360/1998): con IRPEF netta zero, le addizionali sono zero. */
function calcolaAddizionali(imponibile, regione, comune, irpefNetta) {
  if (irpefNetta <= 0) {
    return { regionale: 0, comunale: 0 };
  }
  return {
    regionale: calcolaAddizionaleRegionale(imponibile, regione.regionale),
    comunale: calcolaAddizionaleComunale(imponibile, comune)
  };
}

/* Traduce le opzioni di territorio in oggetti regione/comune.
 * Forme accettate:
 *   "milano"                                   → comune in elenco, regione dedotta
 *   { comune: "milano" }                       → idem
 *   { regione: "lombardia", comune: {...} }    → comune non in elenco, con
 *       campi aliquota/scaglioni/esenzione/applica come in COMUNI
 *   { regione: "lombardia" }                   → nessuna addizionale comunale */
function risolviTerritorio(opzioni, parametri) {
  if (typeof opzioni === "string") opzioni = { comune: opzioni };
  opzioni = opzioni || {};

  var comune;
  if (typeof opzioni.comune === "string") {
    comune = parametri.COMUNI[opzioni.comune];
    if (!comune) throw new Error("Comune sconosciuto: " + opzioni.comune);
  } else if (opzioni.comune && typeof opzioni.comune === "object") {
    comune = opzioni.comune;
    if (!comune.nome) comune = Object.assign({ nome: "Altro comune" }, comune);
  } else {
    comune = { nome: "Nessuno", applica: false };
  }

  var codiceRegione = opzioni.regione || comune.regione;
  var regione = parametri.REGIONI[codiceRegione];
  if (!regione) throw new Error("Regione sconosciuta: " + codiceRegione);

  return { regione: regione, comune: comune };
}

/* Orchestratore: esegue l'intera catena e restituisce tutti i valori
 * intermedi (servono alla tabella di output riga per riga).
 *
 *   ral       retribuzione annua lorda
 *   opzioni   territorio (vedi risolviTerritorio) e, opzionale, "famiglia"
 *             (vedi normalizzaFamiglia)
 *   parametri l'oggetto PARAMETRI_<anno>
 *
 * Ordine scelto e motivazione:
 *   contributi → imponibile → IRPEF lorda → detrazioni (art. 13 + art. 12 +
 *   ulteriore detrazione cuneo) → IRPEF netta → addizionali → crediti
 *   (somma esente + trattamento integrativo) sommati al netto.
 * La somma esente NON entra prima del calcolo IRPEF: per la Circolare AE
 * 4/E/2025 non riduce l'imponibile, è un importo aggiuntivo esente.
 *
 * Il netto mensile (12/13/14 mensilità) è una semplice divisione del netto
 * annuo: è presentazione, non calcolo, e resta a carico dell'interfaccia.
 */
function calcolaNetto(ral, opzioni, parametri) {
  var territorio = risolviTerritorio(opzioni, parametri);
  var famiglia = normalizzaFamiglia(typeof opzioni === "object" && opzioni ? opzioni.famiglia : null);

  var contributi = calcolaContributi(ral, parametri.contributi);
  var imponibile = calcolaImponibile(ral, contributi.totale);

  // Nel perimetro del calcolatore il reddito complessivo e il reddito di
  // lavoro dipendente coincidono entrambi con l'imponibile fiscale.
  var redditoComplessivo = imponibile;

  var irpefLorda = calcolaIrpefLorda(imponibile, parametri.irpef.scaglioni);
  var detrazioneLavoro = calcolaDetrazioneLavoro(redditoComplessivo, parametri.detrazioneLavoro);
  var detrazioniFamiliari = calcolaDetrazioniFamiliari(redditoComplessivo, famiglia, parametri.detrazioniFamiliari);
  var cuneo = calcolaCuneoFiscale(redditoComplessivo, imponibile, parametri.cuneo);

  // 5. IRPEF netta: lorda meno le detrazioni dall'imposta, con floor a zero.
  var irpefNetta = Math.max(0, irpefLorda - detrazioneLavoro - detrazioniFamiliari.totale - cuneo.ulterioreDetrazione);

  var trattamentoIntegrativo = calcolaTrattamentoIntegrativo(
    redditoComplessivo, irpefLorda, detrazioneLavoro, detrazioniFamiliari.totale,
    parametri.trattamentoIntegrativo
  );

  var addizionali = calcolaAddizionali(imponibile, territorio.regione, territorio.comune, irpefNetta);

  var totaleTrattenute = contributi.totale + irpefNetta +
                         addizionali.regionale + addizionali.comunale;

  // 10. Netto annuo: RAL meno le trattenute, più i crediti erogati in busta.
  var nettoAnnuo = ral - totaleTrattenute + cuneo.sommaEsente + trattamentoIntegrativo;

  return {
    ral: ral,
    regione: territorio.regione.nome,
    comune: territorio.comune.nome,
    territorio: territorio.comune.nome,           // alias storico
    famiglia: famiglia,
    contributi: contributi,                       // {base, quotaOrdinaria, quotaAggiuntiva, totale}
    imponibile: imponibile,
    irpefLorda: irpefLorda,
    detrazioneLavoro: detrazioneLavoro,
    detrazioniFamiliari: detrazioniFamiliari,     // {coniuge, figli, ascendenti, totale}
    ulterioreDetrazione: cuneo.ulterioreDetrazione,
    irpefNetta: irpefNetta,
    addizionaleRegionale: addizionali.regionale,
    addizionaleComunale: addizionali.comunale,
    sommaEsente: cuneo.sommaEsente,
    trattamentoIntegrativo: trattamentoIntegrativo,
    totaleTrattenute: totaleTrattenute,
    nettoAnnuo: nettoAnnuo
  };
}

// Compatibilità Node.js per test.js (nel browser restano funzioni globali).
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    troncaQuattroDecimali: troncaQuattroDecimali,
    calcolaPerScaglioni: calcolaPerScaglioni,
    calcolaContributi: calcolaContributi,
    calcolaImponibile: calcolaImponibile,
    calcolaIrpefLorda: calcolaIrpefLorda,
    calcolaDetrazioneLavoro: calcolaDetrazioneLavoro,
    calcolaDetrazioneConiuge: calcolaDetrazioneConiuge,
    calcolaDetrazioneFigli: calcolaDetrazioneFigli,
    calcolaDetrazioneAscendenti: calcolaDetrazioneAscendenti,
    calcolaDetrazioniFamiliari: calcolaDetrazioniFamiliari,
    normalizzaFamiglia: normalizzaFamiglia,
    calcolaSommaEsente: calcolaSommaEsente,
    calcolaUlterioreDetrazione: calcolaUlterioreDetrazione,
    calcolaCuneoFiscale: calcolaCuneoFiscale,
    calcolaTrattamentoIntegrativo: calcolaTrattamentoIntegrativo,
    calcolaAddizionaleRegionale: calcolaAddizionaleRegionale,
    calcolaAddizionaleComunale: calcolaAddizionaleComunale,
    calcolaAddizionali: calcolaAddizionali,
    risolviTerritorio: risolviTerritorio,
    calcolaNetto: calcolaNetto
  };
}
