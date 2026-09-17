/*
 * parametri-2026.js — Costanti normative per l'anno d'imposta 2026.
 *
 * Ogni voce riporta fonte e data di verifica. Nessun valore è stimato:
 * dove un dato non fosse verificabile sarebbe marcato "DA VERIFICARE".
 *
 * Date di verifica:
 *   - contributi, IRPEF, detrazione lavoro, cuneo, trattamento integrativo:
 *     18/08/2026;
 *   - detrazioni per carichi di famiglia, REGIONI e COMUNI: 17/09/2026,
 *     sugli elenchi ufficiali del Dipartimento delle Finanze (MEF), Portale
 *     del Federalismo Fiscale, "Addizionale regionale/comunale all'IRPEF —
 *     Aliquote applicabili", elenco 2026 in formato CSV.
 *
 * File caricato come script classico: espone l'oggetto globale PARAMETRI_2026.
 */

var PARAMETRI_2026 = {

  // ---------------------------------------------------------------------
  // Contributi previdenziali a carico del lavoratore (dipendente privato)
  // Fonte: Circolare INPS n. 6 del 30/01/2026. Verificato il 18/08/2026.
  // ---------------------------------------------------------------------
  contributi: {
    // Aliquota IVS quota lavoratore (FPLD). L'aliquota complessiva è 33%,
    // di cui 23,81% a carico del datore. Valore strutturale, invariato.
    aliquotaLavoratore: 0.0919,

    // Aliquota aggiuntiva (art. 3-ter D.L. 384/1992) sulla quota di
    // retribuzione eccedente la prima fascia di pensionabilità.
    aliquotaAggiuntiva: 0.01,

    // Prima fascia di retribuzione pensionabile 2026 (nel 2025: 55.448 €).
    // Fonte: Circolare INPS n. 6/2026.
    primaFasciaPensionabile: 56224,

    // Massimale contributivo 2026 per gli iscritti a forme pensionistiche
    // obbligatorie dal 1/1/1996 (nel 2025: 120.607 €). Oltre questo importo
    // non sono dovuti contributi IVS. Fonte: Circolare INPS n. 6/2026.
    massimaleContributivo: 122295
  },

  // ---------------------------------------------------------------------
  // IRPEF — scaglioni e aliquote 2026
  // Fonte: art. 11 TUIR come modificato dall'art. 1 co. 3 L. 199/2025
  // (Legge di Bilancio 2026): seconda aliquota dal 35% al 33%.
  // Verificato su Normattiva il 18/08/2026.
  // ---------------------------------------------------------------------
  irpef: {
    scaglioni: [
      { fino: 28000,    aliquota: 0.23 },
      { fino: 50000,    aliquota: 0.33 },
      { fino: Infinity, aliquota: 0.43 }
    ]
  },

  // ---------------------------------------------------------------------
  // Detrazione per redditi di lavoro dipendente (art. 13 co. 1 TUIR)
  // Fonte: art. 13 TUIR (importo base 1.955 € strutturale ex L. 207/2024,
  // invariato dalla L. 199/2025). Verificato il 18/08/2026.
  // Nota: il quoziente delle formule si assume nelle prime quattro cifre
  // decimali (troncamento), come da testo dell'articolo.
  // ---------------------------------------------------------------------
  detrazioneLavoro: {
    // Reddito complessivo ≤ 15.000 €: importo fisso.
    fascia1: { sogliaMax: 15000, importo: 1955 },

    // 15.000 < RC ≤ 28.000: 1.910 + 1.190 × (28.000 − RC) / 13.000
    fascia2: { sogliaMax: 28000, base: 1910, incremento: 1190, denominatore: 13000 },

    // 28.000 < RC ≤ 50.000: 1.910 × (50.000 − RC) / 22.000
    // (azzerata a 50.000 €; sopra vale zero)
    fascia3: { sogliaMax: 50000, base: 1910, denominatore: 22000 },

    // Maggiorazione di 65 € per 25.000 < RC ≤ 35.000 (art. 13 co. 1-bis),
    // in vigore anche nel 2026: nessuna abrogazione da parte della L. 199/2025.
    // Verificato il 18/08/2026 (fonti concordanti; nessuna modifica normativa).
    maggiorazione: { redditoMin: 25000, redditoMax: 35000, importo: 65 }
  },

  // ---------------------------------------------------------------------
  // Detrazioni per carichi di famiglia (art. 12 co. 1 TUIR)
  // Fonte: art. 12 TUIR nel testo vigente al 2026, come modificato da
  // L. 207/2024 (art. 1 co. 11: figli solo da 21 a 29 anni salvo disabilità;
  // altri familiari limitati agli ascendenti conviventi) e D.Lgs. 192/2025
  // (co. 4-ter). Nessuna modifica dalla L. 199/2025. Verificato il 17/09/2026.
  // Il "reddito complessivo" delle formule coincide, nel perimetro di
  // questo calcolatore, con l'imponibile fiscale.
  // Regola dei quozienti (co. 4): si assumono le prime quattro cifre
  // decimali; quoziente ≤ 0 → nessuna detrazione; quoziente = 1 (coniuge)
  // → 690 €.
  // ---------------------------------------------------------------------
  detrazioniFamiliari: {
    coniuge: {
      // RC ≤ 15.000: 800 − 110 × (RC / 15.000)
      fascia1: { sogliaMax: 15000, base: 800, decremento: 110, denominatore: 15000 },
      // 15.000 < RC ≤ 40.000: 690 € fissi (più maggiorazione per fascia)
      fascia2: { sogliaMax: 40000, importo: 690 },
      // 40.000 < RC ≤ 80.000: 690 × (80.000 − RC) / 40.000; oltre: zero
      fascia3: { sogliaMax: 80000, base: 690, denominatore: 40000 },
      // Maggiorazioni (co. 1 lett. b): importi fissi per fasce strette.
      // Gli estremi sono "superiore a … e fino a …".
      maggiorazioni: [
        { oltre: 29000, finoA: 29200, importo: 10 },
        { oltre: 29200, finoA: 34700, importo: 20 },
        { oltre: 34700, finoA: 35000, importo: 30 },
        { oltre: 35000, finoA: 35100, importo: 20 },
        { oltre: 35100, finoA: 35200, importo: 10 }
      ]
    },

    figli: {
      // 950 € per ciascun figlio a carico di età ≥ 21 anni e < 30 anni,
      // oppure di qualsiasi età se con disabilità (L. 104/1992).
      // Per i figli < 21 anni non spetta: sono coperti dall'Assegno Unico
      // (D.Lgs. 230/2021), che è fuori dal perimetro di questo calcolatore.
      importoBase: 950,
      maggiorazioneDisabile: 400,           // → 1.350 € per figlio disabile
      etaMin: 21,
      etaMaxEsclusa: 30,
      // Formula: importo × (B − RC) / B, con B = 95.000 + 15.000 × (n − 1).
      // INTERPRETAZIONE ADOTTATA (DA VERIFICARE su una fonte ufficiale):
      // n è il numero complessivo di figli fiscalmente a carico, compresi
      // quelli sotto i 21 anni per cui la detrazione non spetta. Le fonti
      // consultate il 17/09/2026 divergono: alcune riportano la formula
      // delle istruzioni 730 ("più figli che danno diritto alla
      // detrazione"), altre la lettura della Circ. AE 4/E/2022 (rilevano
      // anche i minori di 21 anni). Chi preferisce la lettura restrittiva
      // indica in figliACarico solo i figli con detrazione: il motore non
      // impone nulla.
      redditoBase: 95000,
      incrementoPerFiglioSuccessivo: 15000
    },

    // Altri familiari a carico: dal 2025 solo gli ascendenti conviventi.
    // 750 × (80.000 − RC) / 80.000, ripartita pro quota tra gli aventi diritto.
    ascendenti: { importo: 750, redditoAzzeramento: 80000 },

    // Limiti di reddito del familiare per essere "a carico" (co. 2).
    // Servono solo alla documentazione: il calcolatore chiede all'utente
    // il numero di familiari già qualificati come a carico.
    limitiRedditoFamiliare: { generale: 2840.51, figliFinoA24Anni: 4000 }
  },

  // ---------------------------------------------------------------------
  // Cuneo fiscale (art. 1 co. 4-9 L. 207/2024, misura strutturale;
  // invariata dalla L. 199/2025). Meccanismo operativo: Circolare AE
  // n. 4/E del 16/05/2025. Verificato il 18/08/2026.
  // ---------------------------------------------------------------------
  cuneo: {
    // Somma esente: spetta se il reddito complessivo ≤ 20.000 €.
    // È una somma AGGIUNTIVA erogata in busta paga che non concorre alla
    // formazione del reddito: NON riduce l'imponibile IRPEF.
    // La percentuale si individua in base al reddito di lavoro dipendente
    // e si applica all'INTERO reddito di lavoro (non a scaglioni).
    sommaEsente: {
      sogliaRedditoComplessivo: 20000,
      fasce: [
        { finoARedditoLavoro: 8500,     percentuale: 0.071 },
        { finoARedditoLavoro: 15000,    percentuale: 0.053 },
        { finoARedditoLavoro: Infinity, percentuale: 0.048 }
      ]
    },

    // Ulteriore detrazione dall'imposta lorda:
    // 1.000 € fissi per 20.000 < RC ≤ 32.000;
    // 1.000 × (40.000 − RC) / 8.000 per 32.000 < RC ≤ 40.000;
    // zero oltre 40.000. Le soglie 32.000 e 40.000 sono i due punti della
    // stessa formula (fine dell'importo fisso / azzeramento).
    ulterioreDetrazione: {
      redditoMin: 20000,
      sogliaImportoFisso: 32000,
      importoFisso: 1000,
      redditoAzzeramento: 40000
    }
  },

  // ---------------------------------------------------------------------
  // Trattamento integrativo (art. 1 D.L. 3/2020, conv. L. 21/2020)
  // Fonte: testo vigente 2026; verificato il 18/08/2026.
  // È un CREDITO: si somma al netto, non riduce l'imposta.
  // ---------------------------------------------------------------------
  trattamentoIntegrativo: {
    importoAnnuo: 1200,
    sogliaFascia1: 15000,   // reddito complessivo, non RAL
    sogliaFascia2: 28000,

    // Verifica di capienza (fascia ≤ 15.000): l'imposta lorda deve superare
    // la detrazione art. 13 co. 1 lett. a) SPETTANTE diminuita di 75 €.
    // La norma non "congela" il valore 2023 (1.880 €): usa la detrazione
    // vigente (1.955 €) meno 75 €, che numericamente coincide con 1.880 €
    // su anno intero. Il −75 € fu introdotto dal D.Lgs. 216/2023 proprio
    // per neutralizzare l'aumento 1.880 → 1.955 nella verifica.
    franchigiaCapienza: 75
  },

  // ---------------------------------------------------------------------
  // REGIONI — addizionale regionale all'IRPEF, anno d'imposta 2026.
  //
  // Fonte unica: elenco 2026 del Portale del Federalismo Fiscale (MEF),
  // "Addizionale regionale all'IRPEF — Aliquote applicabili", CSV
  // scaricato e verificato il 17/09/2026. Tra parentesi la data di
  // pubblicazione MEF di ciascuna scheda e la norma regionale citata.
  //
  // Meccanica comune (art. 6 co. 1 D.Lgs. 68/2011): le aliquote
  // differenziate si applicano per scaglioni progressivi, con gli stessi
  // limiti degli scaglioni IRPEF (15.000 / 28.000 / 50.000). Le clausole
  // aggiuntive sono descritte da questi campi, tutti opzionali:
  //   esenzione               imponibile ≤ soglia → addizionale zero
  //   aliquotaUnicaSottoSoglia imponibile ≤ soglia → aliquota su TUTTO
  //                            l'imponibile (non a scaglioni)
  //   detrazioni[]            importo fisso sottratto se oltre < imp ≤ finoA
  //                            (omettere "oltre" o "finoA" per lasciare
  //                            l'estremo aperto)
  //   detrazioneProgressiva   importo × (imp − oltre) / denominatore,
  //                            con tetto "massimo", se imp > oltre
  // Nessuna clausola può generare un credito: il risultato ha floor a 0.
  //
  // Le agevolazioni legate a figli, disabilità o altre condizioni
  // soggettive NON sono modellate e sono elencate in "nonModellato" per
  // trasparenza (vedi README, "Cosa non è modellato").
  // ---------------------------------------------------------------------
  REGIONI: {

    valle_aosta: {
      nome: "Valle d'Aosta",
      // MEF 19/01/2026 — art. 1 L.R. 29 del 23/12/2025.
      // Reddito complessivo ≤ 15.000 € esente; sopra, 1,23% sull'intero
      // imponibile.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0123 }],
        esenzione: 15000
      }
    },

    piemonte: {
      nome: "Piemonte",
      // MEF 29/01/2026 — L.R. 4 del 28/03/2022; L.R. 16 del 06/08/2025.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0162 },
          { fino: 28000,    aliquota: 0.0268 },
          { fino: 50000,    aliquota: 0.0331 },
          { fino: Infinity, aliquota: 0.0333 }
        ]
      },
      nonModellato: "Detrazione di 100 € per figlio per contribuenti con più di due figli a carico; 500 € per ciascun figlio con disabilità (L. 104/1992)."
    },

    liguria: {
      nome: "Liguria",
      // MEF 28/01/2026 — L.R. 17 del 09/10/2024 art. 2-bis, mod. L.R. 3 del
      // 31/03/2025; L.R. 3 del 17/03/2022 art. 1.
      regionale: {
        scaglioni: [
          { fino: 28000,    aliquota: 0.0123 },
          { fino: 50000,    aliquota: 0.0318 },
          { fino: Infinity, aliquota: 0.0323 }
        ]
      }
    },

    lombardia: {
      nome: "Lombardia",
      // MEF 28/01/2026 — art. 72 co. 1 L.R. 10 del 14/07/2003.
      // (L'"aliquota unica 1,23%" riportata da alcune fonti è errata:
      // 1,23% è solo il primo scaglione.)
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0123 },
          { fino: 28000,    aliquota: 0.0158 },
          { fino: 50000,    aliquota: 0.0172 },
          { fino: Infinity, aliquota: 0.0173 }
        ]
      }
    },

    trento: {
      nome: "Provincia autonoma di Trento",
      // MEF 22/01/2026 — art. 1 co. 2-quater, 2-sexies e 3-bis L.P. 13 del
      // 23/12/2019, mod. L.P. 11 del 29/12/2025.
      // Deduzione di 30.000 € per imponibili ≤ 30.000 €: equivale a
      // un'esenzione totale sotto quella soglia.
      regionale: {
        scaglioni: [
          { fino: 50000,    aliquota: 0.0123 },
          { fino: Infinity, aliquota: 0.0173 }
        ],
        esenzione: 30000
      },
      nonModellato: "Detrazione di 246 € per ogni figlio a carico (art. 12 co. 2 TUIR) per imponibili ≤ 50.000 €."
    },

    bolzano: {
      nome: "Provincia autonoma di Bolzano",
      // MEF 29/01/2026 — art. 21-sexiesdecies L.P. 9 del 11/08/1998.
      // a) detrazione 430,50 € per imponibili ≤ 90.000 €;
      // b) per imponibili > 50.000 €: 125 × (imp − 50.000) / 25.000, max 125 €.
      // Cumulabili, senza credito d'imposta.
      regionale: {
        scaglioni: [
          { fino: 50000,    aliquota: 0.0123 },
          { fino: Infinity, aliquota: 0.0173 }
        ],
        detrazioni: [{ finoA: 90000, importo: 430.5 }],
        detrazioneProgressiva: { oltre: 50000, importo: 125, denominatore: 25000, massimo: 125 }
      },
      nonModellato: "Detrazione di 340 € per ogni figlio a carico (anche < 21 e > 30 anni) per imponibili ≤ 90.000 €."
    },

    veneto: {
      nome: "Veneto",
      // MEF 22/01/2026 — art. 1 co. 5 L.R. 19/2005, mod. art. 9 L.R. 30/2022.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0123 }]
      },
      nonModellato: "Aliquota agevolata 0,90% per contribuenti disabili o con familiare disabile a carico, con imponibile ≤ 50.000 €."
    },

    friuli_venezia_giulia: {
      nome: "Friuli-Venezia Giulia",
      // MEF 19/01/2026 — art. 1 co. 5 L.R. 14 del 25/07/2012; art. 1 co. 727
      // L. 207/2024. Imponibile ≤ 15.000 €: 0,70% sull'intero importo;
      // oltre: 1,23% sull'intero importo.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0123 }],
        aliquotaUnicaSottoSoglia: { soglia: 15000, aliquota: 0.0070 }
      }
    },

    emilia_romagna: {
      nome: "Emilia-Romagna",
      // MEF 19/01/2026 — art. 2 L.R. 19 del 20/12/2006, mod. art. 2 co. 1
      // L.R. 1 del 31/03/2025, coordinata con L.R. 9 del 25/07/2025.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0133 },
          { fino: 28000,    aliquota: 0.0193 },
          { fino: 50000,    aliquota: 0.0278 },
          { fino: Infinity, aliquota: 0.0333 }
        ]
      }
    },

    toscana: {
      nome: "Toscana",
      // MEF 30/01/2026 — art. 1 L.R. 48 del 28/12/2023.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0142 },
          { fino: 28000,    aliquota: 0.0143 },
          { fino: 50000,    aliquota: 0.0332 },
          { fino: Infinity, aliquota: 0.0333 }
        ]
      }
    },

    umbria: {
      nome: "Umbria",
      // MEF 19/01/2026 — art. 1 L.R. 2 del 11/04/2025.
      // Per imponibili ≤ 28.000 € le maggiorazioni dei primi due scaglioni
      // non si applicano: resta l'aliquota base 1,23% sull'intero
      // imponibile. Per 28.001–50.000 €: scaglioni pieni meno 150 €.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0173 },
          { fino: 28000,    aliquota: 0.0302 },
          { fino: 50000,    aliquota: 0.0312 },
          { fino: Infinity, aliquota: 0.0333 }
        ],
        aliquotaUnicaSottoSoglia: { soglia: 28000, aliquota: 0.0123 },
        detrazioni: [{ oltre: 28000, finoA: 50000, importo: 150 }]
      }
    },

    marche: {
      nome: "Marche",
      // MEF 22/01/2026 — art. 1 L.R. 5 del 23/03/2022; art. 1 co. 728 L. 207/2024.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0123 },
          { fino: 28000,    aliquota: 0.0153 },
          { fino: 50000,    aliquota: 0.0170 },
          { fino: Infinity, aliquota: 0.0173 }
        ]
      },
      nonModellato: "Aliquota 1,23% sull'intero imponibile (≤ 50.000 €) per contribuenti con figli disabili a carico."
    },

    lazio: {
      nome: "Lazio",
      // MEF 22/01/2026 — L.R. 20 del 31/12/2025, art. 2. Due scaglioni
      // (1,73% fino a 15.000, 3,33% oltre) con due clausole di favore:
      // imponibile ≤ 28.000 → 1,73% sull'intero imponibile;
      // imponibile 28.001–30.000 → detrazione di 60 €.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0173 },
          { fino: Infinity, aliquota: 0.0333 }
        ],
        aliquotaUnicaSottoSoglia: { soglia: 28000, aliquota: 0.0173 },
        detrazioni: [{ oltre: 28000, finoA: 30000, importo: 60 }]
      }
    },

    abruzzo: {
      nome: "Abruzzo",
      // MEF 28/01/2026 — art. 1 co. 8 L.R. 44 del 12/12/2006; art. 1 co. 1
      // L.R. 9 del 04/04/2025.
      regionale: {
        scaglioni: [
          { fino: 28000,    aliquota: 0.0167 },
          { fino: 50000,    aliquota: 0.0287 },
          { fino: Infinity, aliquota: 0.0333 }
        ]
      }
    },

    molise: {
      nome: "Molise",
      // MEF 19/06/2026 (scheda n. 2227, che sostituisce la n. 2186 del
      // 29/01/2026) — art. 2 L.R. 9/2013; art. 1 co. 174 L. 311/2004
      // (maggiorazione automatica per disavanzo sanitario); L.R. 5 del
      // 15/12/2023. Il 3,63% supera il tetto ordinario del 3,33% proprio
      // per effetto della maggiorazione da piano di rientro.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0203 },
          { fino: 28000,    aliquota: 0.0223 },
          { fino: Infinity, aliquota: 0.0363 }
        ]
      }
    },

    campania: {
      nome: "Campania",
      // MEF 29/01/2026 — L.R. 4 del 16/01/2014; L.R. 31 del 28/12/2021;
      // L.R. 7 del 30/03/2022.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0173 },
          { fino: 28000,    aliquota: 0.0296 },
          { fino: 50000,    aliquota: 0.0320 },
          { fino: Infinity, aliquota: 0.0333 }
        ]
      },
      nonModellato: "Per imponibili ≤ 28.000 €: detrazione di 30 € per figlio con almeno due figli a carico; 40 € per ogni figlio disabile a carico."
    },

    puglia: {
      nome: "Puglia",
      // MEF 29/05/2026 (scheda n. 2207, che sostituisce la n. 2178 del
      // 28/01/2026) — Decreto n. 3 del 28/05/2026 del Presidente della
      // Regione quale Commissario ad acta (art. 1 co. 174 L. 311/2004):
      // aliquote rideterminate per il disavanzo sanitario 2025.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0133 },
          { fino: 28000,    aliquota: 0.0213 },
          { fino: 50000,    aliquota: 0.0323 },
          { fino: Infinity, aliquota: 0.0333 }
        ]
      },
      nonModellato: "Detrazione di 20 € per figlio per contribuenti con più di tre figli a carico, +375 € per ogni figlio disabile (art. 3 L.R. 40/2015)."
    },

    basilicata: {
      nome: "Basilicata",
      // MEF 29/01/2026 — art. 6 D.Lgs. 68/2011; art. 50 D.Lgs. 446/1997.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0123 }]
      }
    },

    calabria: {
      nome: "Calabria",
      // MEF 29/01/2026 — art. 1 L.R. 30 del 07/08/2002, mod. L.R. 1 del
      // 11/01/2006; art. 29 co. 14 D.L. 216/2011.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0173 }]
      }
    },

    sicilia: {
      nome: "Sicilia",
      // MEF 29/01/2026 — art. 1 L.R. 12 del 02/05/2007; art. 1 co. 10-quater
      // L.R. 4 del 09/02/2015; art. 8 L.R. 15 del 11/08/2017.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0123 }]
      }
    },

    sardegna: {
      nome: "Sardegna",
      // MEF 29/01/2026 — art. 2 co. 1 e 1-bis L.R. 48/2018; art. 1 L.R. 13
      // del 11/07/2022.
      regionale: {
        scaglioni: [{ fino: Infinity, aliquota: 0.0123 }]
      },
      nonModellato: "Detrazione di 200 € per ogni figlio minorenne a carico (+100 € se disabile) per imponibili ≤ 50.000 €."
    }
  },

  // ---------------------------------------------------------------------
  // COMUNI — addizionale comunale all'IRPEF, anno d'imposta 2026.
  // Un capoluogo per regione (per Trentino-Alto Adige: Trento e Bolzano).
  //
  // Fonte unica: elenchi 2019–2026 del Portale del Federalismo Fiscale
  // (MEF), "Addizionale comunale all'IRPEF — Aliquote applicabili", CSV
  // scaricati e verificati il 17/09/2026. Dove il comune non ha adottato
  // una nuova delibera per il 2026 vale l'ultima delibera pubblicata
  // (art. 1 co. 169 L. 296/2006: proroga automatica); la delibera citata
  // è quella in vigore.
  //
  // Campi:
  //   aliquota    aliquota unica sull'intero imponibile, oppure
  //   scaglioni   aliquote per scaglioni progressivi (art. 1 co. 11
  //               D.L. 138/2011: stessi limiti degli scaglioni IRPEF)
  //   esenzione   imponibile ≤ soglia → addizionale zero. È un'esenzione
  //               TOTALE, non una franchigia: sopra la soglia si paga
  //               sull'intero imponibile. Zero = nessuna esenzione.
  //   applica     false se il comune non applica l'addizionale
  //
  // Per un comune non in elenco l'interfaccia permette di inserire
  // aliquota ed esenzione a mano ("Altro comune").
  // ---------------------------------------------------------------------
  COMUNI: {
    aosta:      { nome: "Aosta",      regione: "valle_aosta",           aliquota: 0.005,  esenzione: 9999.99,
                  fonte: "Delib. C.C. n. 32 del 17/03/2021 (confermata 2025; nessuna nuova delibera 2026)" },
    torino:     { nome: "Torino",     regione: "piemonte",              esenzione: 11790,
                  scaglioni: [{ fino: 28000, aliquota: 0.008 }, { fino: 50000, aliquota: 0.011 }, { fino: Infinity, aliquota: 0.012 }],
                  fonte: "Delib. C.C. n. 195 del 29/03/2022 (confermata 2025 ex art. 1 co. 751 L. 207/2024; nessuna nuova delibera 2026)" },
    milano:     { nome: "Milano",     regione: "lombardia",             aliquota: 0.008,  esenzione: 23000,
                  fonte: "Delib. C.C. n. 46 del 28/09/2020 (confermata 2025; nessuna nuova delibera 2026). Il valore 21.000 € circolante è pre-2020." },
    trento:     { nome: "Trento",     regione: "trento",                applica: false,
                  fonte: "Nessuna delibera in elenco MEF 2019–2026: il comune non applica l'addizionale" },
    bolzano:    { nome: "Bolzano",    regione: "bolzano",               applica: false,
                  fonte: "Delib. n. 100 del 27/10/2016, \"non applica\" (confermata 2025)" },
    venezia:    { nome: "Venezia",    regione: "veneto",                aliquota: 0.008,  esenzione: 10000,
                  fonte: "Delib. C.C. n. 67 del 20/12/2023 (confermata 2025; nessuna nuova delibera 2026)" },
    trieste:    { nome: "Trieste",    regione: "friuli_venezia_giulia", aliquota: 0.008,  esenzione: 12500,
                  fonte: "Delib. C.C. n. 33 del 03/08/2015 (confermata 2025; nessuna nuova delibera 2026)" },
    genova:     { nome: "Genova",     regione: "liguria",               esenzione: 14000,
                  scaglioni: [{ fino: 28000, aliquota: 0.010 }, { fino: 50000, aliquota: 0.011 }, { fino: Infinity, aliquota: 0.012 }],
                  fonte: "Delib. C.C. n. 55 del 19/12/2024 (nessuna nuova delibera 2026)" },
    bologna:    { nome: "Bologna",    regione: "emilia_romagna",        aliquota: 0.008,  esenzione: 15000,
                  fonte: "Delib. C.C. n. 354/2016 del 22/12/2016 (confermata 2025; nessuna nuova delibera 2026)" },
    firenze:    { nome: "Firenze",    regione: "toscana",               aliquota: 0.002,  esenzione: 25000,
                  fonte: "Delib. C.C. n. 47 del 28/07/2014 (confermata 2025; nessuna nuova delibera 2026)" },
    perugia:    { nome: "Perugia",    regione: "umbria",                aliquota: 0.008,  esenzione: 12500,
                  fonte: "Delib. C.C. n. 110 del 25/11/2013 (confermata 2025; nessuna nuova delibera 2026). Esenzione riferita al reddito complessivo art. 8 TUIR" },
    ancona:     { nome: "Ancona",     regione: "marche",                aliquota: 0.008,  esenzione: 0,
                  fonte: "Delib. C.C. n. 176 del 21/12/2007 (confermata 2025; nessuna nuova delibera 2026)" },
    roma:       { nome: "Roma",       regione: "lazio",                 aliquota: 0.009,  esenzione: 14000,
                  fonte: "Delib. A.C. n. 186 del 19/12/2024 (nessuna nuova delibera 2026). 0,9% = 0,5% ordinario + 0,4% gestione commissariale; il valore 12.000 € circolante è pre-2025" },
    laquila:    { nome: "L'Aquila",   regione: "abruzzo",               aliquota: 0.006,  esenzione: 15000,
                  fonte: "Delib. C.C. n. 17 del 03/03/2008 (confermata 2025; nessuna nuova delibera 2026)" },
    campobasso: { nome: "Campobasso", regione: "molise",                aliquota: 0.008,  esenzione: 0,
                  fonte: "Delib. C.C. n. 42 del 29/12/2023 (confermata 2025; nessuna nuova delibera 2026)" },
    napoli:     { nome: "Napoli",     regione: "campania",              aliquota: 0.010,  esenzione: 12000,
                  fonte: "Delib. C.C. n. 143 del 29/12/2023 (confermata 2025; nessuna nuova delibera 2026)" },
    bari:       { nome: "Bari",       regione: "puglia",                aliquota: 0.008,  esenzione: 15000,
                  fonte: "Delib. C.C. n. 42 del 31/07/2012 (confermata 2025; nessuna nuova delibera 2026)" },
    potenza:    { nome: "Potenza",    regione: "basilicata",            esenzione: 0,
                  scaglioni: [{ fino: 50000, aliquota: 0.008 }, { fino: Infinity, aliquota: 0.010 }],
                  fonte: "Delib. C.C. n. 12 del 11/03/2025 (nessuna nuova delibera 2026)" },
    catanzaro:  { nome: "Catanzaro",  regione: "calabria",              aliquota: 0.008,  esenzione: 0,
                  fonte: "Delib. C.C. n. 51 del 30/07/2015 (confermata 2025; nessuna nuova delibera 2026)" },
    palermo:    { nome: "Palermo",    regione: "sicilia",               aliquota: 0.0103, esenzione: 0,
                  fonte: "Delib. n. 137 del 15/04/2026 (aliquota maggiorata ex piano di riequilibrio; 2025: 1,014%)" },
    cagliari:   { nome: "Cagliari",   regione: "sardegna",              esenzione: 10000,
                  scaglioni: [{ fino: 15000, aliquota: 0.0066 }, { fino: 28000, aliquota: 0.0072 }, { fino: 50000, aliquota: 0.0078 }, { fino: Infinity, aliquota: 0.008 }],
                  fonte: "Delib. C.C. n. 69 del 30/05/2022 (confermata 2025 ex art. 1 co. 751 L. 207/2024; nessuna nuova delibera 2026)" }
  }
};

// Compatibilità Node.js per test.js (nel browser resta un normale globale).
if (typeof module !== "undefined" && module.exports) {
  module.exports = PARAMETRI_2026;
}
