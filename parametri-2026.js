/*
 * parametri-2026.js — Costanti normative per l'anno d'imposta 2026.
 *
 * Ogni voce riporta fonte e data di verifica. Nessun valore è stimato:
 * dove un dato non fosse verificabile sarebbe marcato "DA VERIFICARE".
 * Tutti i valori sono stati verificati il 18/08/2026.
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
  // Territori. Aggiungere un territorio = aggiungere una entry qui:
  // la logica di calcolo non cambia.
  // Le addizionali si applicano sull'imponibile IRPEF e sono dovute solo
  // se per l'anno risulta dovuta l'IRPEF al netto delle detrazioni
  // (art. 50 co. 2 D.Lgs. 446/1997; art. 1 D.Lgs. 360/1998).
  // ---------------------------------------------------------------------
  TERRITORI: {

    milano: {
      nome: "Milano",
      regione: "Lombardia",

      // Addizionale regionale Lombardia: a scaglioni progressivi.
      // Fonte: art. 72 L.R. Lombardia 10/2003, mod. L.R. 5/2022; nessuna
      // nuova delibera per il 2026 (proroga automatica). Verificato il
      // 18/08/2026 sulla pagina istituzionale di Regione Lombardia.
      // (L'"aliquota unica 1,23%" riportata da alcune fonti è errata:
      // 1,23% è solo il primo scaglione.)
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0123 },
          { fino: 28000,    aliquota: 0.0158 },
          { fino: 50000,    aliquota: 0.0172 },
          { fino: Infinity, aliquota: 0.0173 }
        ]
      },

      // Addizionale comunale Milano: 0,80%, esenzione totale fino a
      // 23.000 € di imponibile (sopra la soglia si paga sull'intero
      // imponibile, non è una franchigia). Soglia a 23.000 € dal 2020
      // (Delib. C.C. n. 46 del 28/09/2020, mai modificata; il valore
      // 21.000 € circolante è pre-2020). Verificato il 18/08/2026 sul
      // Portale del Federalismo Fiscale (MEF).
      aliquotaComunale: 0.008,
      esenzioneComunale: 23000
    },
    // Esempio per altri comuni:
    // Crescendo conviene trattare le regioni come ente assestante rispetto
    // al comune per non dover ripetere le regioni per ogni comune.
    roma: {
      nome: "Roma",
      regione: "Lazio",

      // Addizionale regionale Lazio 2026: struttura NUOVA rispetto al 2025
      // (L.R. Lazio n. 20 del 31/12/2025, art. 2). Due scaglioni:
      // 1,73% fino a 15.000 e 3,33% oltre, con due clausole di favore:
      // - imponibile ≤ 28.000 → 1,73% sull'intero imponibile;
      // - imponibile 28.001–30.000 → detrazione di 60 € dall'addizionale.
      // Verificato il 18/08/2026 sul testo di legge regionale.
      regionale: {
        scaglioni: [
          { fino: 15000,    aliquota: 0.0173 },
          { fino: Infinity, aliquota: 0.0333 }
        ],
        aliquotaUnicaSottoSoglia: { soglia: 28000, aliquota: 0.0173 },
        detrazionePerFascia: { oltre: 28000, finoA: 30000, importo: 60 }
      },

      // Addizionale comunale Roma: 0,90% (0,5% ordinario + 0,4% gestione
      // commissariale), esenzione totale fino a 14.000 € di imponibile.
      // Soglia a 14.000 € dal 2025 (Delib. A.C. n. 186 del 19/12/2024;
      // il valore 12.000 € circolante è pre-2025). Verificato il
      // 18/08/2026 su Roma Capitale e Portale del Federalismo Fiscale.
      aliquotaComunale: 0.009,
      esenzioneComunale: 14000
    }
  }
};

// Compatibilità Node.js per test.js (nel browser resta un normale globale).
if (typeof module !== "undefined" && module.exports) {
  module.exports = PARAMETRI_2026;
}
