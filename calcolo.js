/*
 * calcolo.js — Catena di calcolo RAL → netto, anno d'imposta 2026.
 *
 * Solo funzioni pure: nessun riferimento al DOM, nessuno stato condiviso.
 * Ogni funzione riceve esplicitamente i parametri normativi (l'oggetto
 * PARAMETRI_2026 o sue sezioni), così è testabile in isolamento.
 *
 * Assunzioni del perimetro (vedi README): dipendente privato, tempo
 * indeterminato full time, anno intero, nessun carico familiare né altri
 * oneri, iscrizione previdenziale post-1995 (il massimale si applica),
 * reddito complessivo coincidente con l'imponibile da lavoro.
 *
 * File caricato come script classico: espone funzioni globali.
 */

/* Tronca un numero alla quarta cifra decimale. L'art. 13 TUIR prescrive di
 * assumere il quoziente delle formule "nelle prime quattro cifre decimali". */
function troncaQuattroDecimali(x) {
  return Math.floor(x * 10000) / 10000;
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

/* 3. IRPEF lorda a scaglioni progressivi: ogni aliquota si applica solo
 * alla quota di imponibile che ricade nel proprio scaglione. */
function calcolaIrpefLorda(imponibile, scaglioni) {
  var imposta = 0;
  var pavimento = 0; // limite inferiore dello scaglione corrente
  for (var i = 0; i < scaglioni.length; i++) {
    var quota = Math.min(imponibile, scaglioni[i].fino) - pavimento;
    if (quota <= 0) break;
    imposta += quota * scaglioni[i].aliquota;
    pavimento = scaglioni[i].fino;
  }
  return imposta;
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
 * complessivo, non sulla RAL: 15.000 € di reddito ≈ 16.518 € di RAL. */
function calcolaTrattamentoIntegrativo(redditoComplessivo, irpefLorda, detrazioneLavoro, ti) {
  if (redditoComplessivo <= ti.sogliaFascia1) {
    // Verifica di capienza: imposta lorda superiore alla detrazione
    // spettante diminuita di 75 €. Su anno intero: 1.955 − 75 = 1.880 €,
    // cioè il valore pre-riforma — il −75 € serve proprio a neutralizzare
    // l'aumento della detrazione (1.880 → 1.955) in questa verifica.
    return irpefLorda > (detrazioneLavoro - ti.franchigiaCapienza) ? ti.importoAnnuo : 0;
  }
  if (redditoComplessivo <= ti.sogliaFascia2) {
    // Fascia 15.000–28.000: spetta solo se la somma delle detrazioni
    // (qui la sola art. 13, dato il perimetro) supera l'imposta lorda,
    // per la differenza, con tetto a 1.200 €. Con le assunzioni di questo
    // prototipo la detrazione art. 13 non supera MAI l'imposta lorda in
    // questa fascia (a 15.000 €: detrazione ~3.100 vs lorda 3.450; il
    // divario cresce col reddito): il risultato è sempre zero. Non è un
    // limite del calcolatore, è il risultato corretto per un lavoratore
    // senza carichi familiari né altri oneri detraibili.
    return Math.max(0, Math.min(ti.importoAnnuo, detrazioneLavoro - irpefLorda));
  }
  return 0; // oltre 28.000 € non spetta
}

/* 8-9. Addizionali regionale e comunale, sull'imponibile IRPEF.
 * Sono dovute solo se per l'anno risulta dovuta l'IRPEF al netto delle
 * detrazioni (art. 50 co. 2 D.Lgs. 446/1997; art. 1 D.Lgs. 360/1998):
 * con IRPEF netta zero, le addizionali sono zero. */
function calcolaAddizionaleRegionale(imponibile, regionale) {
  // Clausola "aliquota unica sotto soglia" (es. Lazio 2026: 1,73% su tutto
  // l'imponibile se non supera 28.000 €).
  var unica = regionale.aliquotaUnicaSottoSoglia;
  if (unica && imponibile <= unica.soglia) {
    return imponibile * unica.aliquota;
  }

  // Calcolo progressivo a scaglioni (stessa meccanica dell'IRPEF).
  var importo = calcolaIrpefLorda(imponibile, regionale.scaglioni);

  // Clausola "detrazione per fascia" (es. Lazio 2026: −60 € per imponibili
  // 28.001–30.000; non può generare crediti).
  var df = regionale.detrazionePerFascia;
  if (df && imponibile > df.oltre && imponibile <= df.finoA) {
    importo = Math.max(0, importo - df.importo);
  }
  return importo;
}

function calcolaAddizionaleComunale(imponibile, territorio) {
  // La soglia è un'esenzione totale, non una franchigia: sotto la soglia
  // non si paga nulla, sopra si paga sull'intero imponibile.
  if (imponibile <= territorio.esenzioneComunale) return 0;
  return imponibile * territorio.aliquotaComunale;
}

function calcolaAddizionali(imponibile, territorio, irpefNetta) {
  if (irpefNetta <= 0) {
    return { regionale: 0, comunale: 0 };
  }
  return {
    regionale: calcolaAddizionaleRegionale(imponibile, territorio.regionale),
    comunale: calcolaAddizionaleComunale(imponibile, territorio)
  };
}

/* Orchestratore: esegue l'intera catena e restituisce tutti i valori
 * intermedi (servono alla tabella di output riga per riga).
 *
 * Ordine scelto e motivazione:
 *   contributi → imponibile → IRPEF lorda → detrazioni (art. 13 +
 *   ulteriore detrazione cuneo) → IRPEF netta → addizionali → crediti
 *   (somma esente + trattamento integrativo) sommati al netto.
 * La somma esente NON entra prima del calcolo IRPEF: per la Circolare AE
 * 4/E/2025 non riduce l'imponibile, è un importo aggiuntivo esente.
 *
 * Il netto mensile (12/13/14 mensilità) è una semplice divisione del netto
 * annuo: è presentazione, non calcolo, e resta a carico dell'interfaccia.
 */
function calcolaNetto(ral, codiceTerritorio, parametri) {
  var territorio = parametri.TERRITORI[codiceTerritorio];
  if (!territorio) {
    throw new Error("Territorio sconosciuto: " + codiceTerritorio);
  }

  var contributi = calcolaContributi(ral, parametri.contributi);
  var imponibile = calcolaImponibile(ral, contributi.totale);

  // Nel perimetro del prototipo il reddito complessivo e il reddito di
  // lavoro dipendente coincidono entrambi con l'imponibile fiscale.
  var redditoComplessivo = imponibile;

  var irpefLorda = calcolaIrpefLorda(imponibile, parametri.irpef.scaglioni);
  var detrazioneLavoro = calcolaDetrazioneLavoro(redditoComplessivo, parametri.detrazioneLavoro);
  var cuneo = calcolaCuneoFiscale(redditoComplessivo, imponibile, parametri.cuneo);

  // 5. IRPEF netta: lorda meno le detrazioni dall'imposta, con floor a zero.
  var irpefNetta = Math.max(0, irpefLorda - detrazioneLavoro - cuneo.ulterioreDetrazione);

  var trattamentoIntegrativo = calcolaTrattamentoIntegrativo(
    redditoComplessivo, irpefLorda, detrazioneLavoro, parametri.trattamentoIntegrativo
  );

  var addizionali = calcolaAddizionali(imponibile, territorio, irpefNetta);

  var totaleTrattenute = contributi.totale + irpefNetta +
                         addizionali.regionale + addizionali.comunale;

  // 10. Netto annuo: RAL meno le trattenute, più i crediti erogati in busta.
  var nettoAnnuo = ral - totaleTrattenute + cuneo.sommaEsente + trattamentoIntegrativo;

  return {
    ral: ral,
    territorio: territorio.nome,
    contributi: contributi,                       // {base, quotaOrdinaria, quotaAggiuntiva, totale}
    imponibile: imponibile,
    irpefLorda: irpefLorda,
    detrazioneLavoro: detrazioneLavoro,
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
    calcolaContributi: calcolaContributi,
    calcolaImponibile: calcolaImponibile,
    calcolaIrpefLorda: calcolaIrpefLorda,
    calcolaDetrazioneLavoro: calcolaDetrazioneLavoro,
    calcolaSommaEsente: calcolaSommaEsente,
    calcolaUlterioreDetrazione: calcolaUlterioreDetrazione,
    calcolaCuneoFiscale: calcolaCuneoFiscale,
    calcolaTrattamentoIntegrativo: calcolaTrattamentoIntegrativo,
    calcolaAddizionali: calcolaAddizionali,
    calcolaNetto: calcolaNetto
  };
}
