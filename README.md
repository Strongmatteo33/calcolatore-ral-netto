# Calcolatore RAL → Netto (2026)

Calcola lo stipendio netto di un lavoratore dipendente in Italia a partire dalla
RAL, per l'anno d'imposta 2026: contributi INPS, IRPEF, detrazione da lavoro,
cuneo fiscale, trattamento integrativo, addizionali regionale e comunale,
detrazioni per carichi di famiglia.

- **Tutte le regioni** e le province autonome (21 territori) con le clausole
  reali di ciascuna (esenzioni, aliquote sotto soglia, detrazioni).
- **Un capoluogo per regione** (21 comuni), più la possibilità di inserire a
  mano aliquota ed esenzione di qualsiasi altro comune.
- **Carichi familiari** (art. 12 TUIR): coniuge, figli, genitori conviventi.
- **Ogni parametro ha una fonte e una data di verifica.** Nessun valore è
  stimato. La fonte delle addizionali è l'elenco ufficiale del Dipartimento
  delle Finanze.
- Motore di calcolo in funzioni pure, senza dipendenze: gira nel browser
  (anche da `file://`) e in Node. 80 controlli automatici.

Demo: <https://calcolatore-jet.vercel.app>

## Come si usa

**Nel browser.** Apri `index.html`. Inserisci la RAL, scegli regione e comune,
indica gli eventuali carichi familiari, premi *Calcola*. La tabella mostra
ogni passaggio, dalla RAL al netto mensile a 12, 13 o 14 mensilità.

**Da Node.**

```js
var P = require("./parametri-2026.js");
var { calcolaNetto } = require("./calcolo.js");

// Forma compatta: comune in elenco, regione dedotta.
calcolaNetto(30000, "milano", P).nettoAnnuo;          // → 23425.48

// Forma completa: territorio esplicito e carichi familiari.
calcolaNetto(30000, {
  regione: "lombardia",
  comune: { nome: "Lodi", aliquota: 0.006, esenzione: 10000 },   // comune non in elenco
  famiglia: {
    coniugeACarico: true,
    figliACarico: 2,          // tutti i figli fiscalmente a carico
    figliConDetrazione: 1,    // di cui con 21–29 anni, o disabili
    figliDisabili: 0,
    percentualeFigli: 1,      // 1 oppure 0.5
    ascendentiACarico: 0
  }
}, P);
```

Il risultato riporta tutti i valori intermedi (`contributi`, `imponibile`,
`irpefLorda`, `detrazioneLavoro`, `detrazioniFamiliari`, `ulterioreDetrazione`,
`irpefNetta`, `addizionaleRegionale`, `addizionaleComunale`, `sommaEsente`,
`trattamentoIntegrativo`, `totaleTrattenute`, `nettoAnnuo`).

**Test.** `node test.js` (o `npm test`). Stampa la tabella completa per Milano,
il confronto tra i 21 capoluoghi e l'esito dei controlli; esce con codice 1 se
qualcosa fallisce.

## Perimetro

Il calcolatore modella **questo** profilo, e lo dichiara nell'interfaccia:

| Assunzione | Valore |
|---|---|
| Contratto | Lavoro dipendente privato, tempo indeterminato |
| Orario e periodo | Full time, anno intero (365 giorni di detrazione) |
| Previdenza | Iscrizione post-1995: si applica il massimale contributivo |
| Reddito complessivo | Coincide con l'imponibile da lavoro (nessun altro reddito) |
| Oneri | Nessun onere deducibile o detraibile oltre a quelli calcolati |
| Mensilità | Il netto mensile è il netto annuo diviso 12, 13 o 14 |

## Catena di calcolo

1. **Contributi INPS** a carico del lavoratore: 9,19% fino al massimale
   contributivo (122.295 €), più l'1% aggiuntivo sulla quota oltre la prima
   fascia di pensionabilità (56.224 €).
2. **Imponibile fiscale** = RAL − contributi (art. 51 co. 2 lett. a TUIR).
3. **IRPEF lorda** a scaglioni: 23% fino a 28.000, 33% fino a 50.000, 43% oltre
   (L. 199/2025).
4. **Detrazione per lavoro dipendente** (art. 13 TUIR), con la maggiorazione di
   65 € per redditi 25.000–35.000.
5. **Detrazioni per carichi di famiglia** (art. 12 TUIR): coniuge (800 → 690 →
   zero a 80.000, con le maggiorazioni per fascia), figli da 21 a 29 anni o
   disabili (950 €, +400 € se disabili, ridotti col quoziente su 95.000 €
   aumentati di 15.000 € per ogni figlio a carico oltre il primo), genitori
   conviventi (750 €).
6. **Cuneo fiscale** (L. 207/2024): somma esente in busta per redditi fino a
   20.000 € (7,1% / 5,3% / 4,8% del reddito di lavoro) e ulteriore detrazione
   per redditi 20.000–40.000 € (1.000 € fissi fino a 32.000, poi decrescente).
7. **IRPEF netta** = lorda − detrazioni, mai negativa.
8. **Trattamento integrativo** (D.L. 3/2020): 1.200 € fino a 15.000 € di
   reddito (con verifica di capienza), e fino a 28.000 € solo se le detrazioni
   art. 12 e 13 superano l'imposta lorda.
9. **Addizionale regionale** e **comunale** sull'imponibile, dovute solo se
   l'IRPEF netta è positiva. Le aliquote differenziate si applicano per
   scaglioni progressivi; esenzioni e detrazioni secondo la norma di ciascun
   ente, senza mai generare crediti.
10. **Netto** = RAL − contributi − IRPEF netta − addizionali + somma esente +
    trattamento integrativo.

I quozienti delle formule degli artt. 12 e 13 sono troncati alla quarta cifra
decimale, come prescrive il testo unico.

## Territori

Le addizionali regionali di tutti i 21 territori sono modellate con le loro
clausole effettive per il 2026, non con la sola aliquota base. Alcuni esempi
di ciò che il motore gestisce:

| Territorio | Regola 2026 |
|---|---|
| Valle d'Aosta | Esente fino a 15.000 €; sopra, 1,23% su tutto l'imponibile |
| Friuli-Venezia Giulia | 0,70% su tutto fino a 15.000 €; 1,23% su tutto oltre |
| Umbria | 1,23% su tutto fino a 28.000 €; scaglioni pieni meno 150 € tra 28.001 e 50.000 € |
| Lazio | 1,73% su tutto fino a 28.000 €; detrazione di 60 € tra 28.001 e 30.000 € |
| Trento | Deduzione di 30.000 € (esente) fino a 30.000 € di imponibile |
| Bolzano | Detrazione di 430,50 € fino a 90.000 €, più fino a 125 € oltre 50.000 € |
| Molise, Puglia | Aliquote maggiorate per disavanzo sanitario (delibere di giugno e maggio 2026) |

I comuni in elenco sono i capoluoghi di regione (Aosta, Torino, Milano,
Trento, Bolzano, Venezia, Trieste, Genova, Bologna, Firenze, Perugia, Ancona,
Roma, L'Aquila, Campobasso, Napoli, Bari, Potenza, Catanzaro, Palermo,
Cagliari), con aliquota unica o per scaglioni e soglia di esenzione. Per ogni
comune è riportata la delibera in vigore. Dove il comune non ha deliberato per
il 2026 vale l'ultima delibera pubblicata (art. 1 co. 169 L. 296/2006).

Per un comune non in elenco: scegli "Altro comune" e inserisci aliquota ed
esenzione, che trovi sul [Portale del Federalismo Fiscale][mef-com].

## Cosa non è modellato

Dichiarato qui, e nell'interfaccia dove serve, per non far passare per
completo ciò che non lo è.

- **Assegno Unico** per i figli sotto i 21 anni: è una prestazione INPS, non
  una voce di busta paga.
- **Agevolazioni regionali soggettive**: detrazioni per figli a carico
  (Trento, Bolzano, Piemonte, Campania, Puglia, Sardegna) e aliquote agevolate
  per disabilità (Veneto, Marche). Sono elencate nel campo `nonModellato` di
  ciascuna regione e mostrate sotto il risultato quando riguardano il
  territorio scelto.
- Part-time, periodi inferiori all'anno, contratti diversi dall'indeterminato
  privato (pubblico impiego, apprendistato, co.co.co.), settori con aliquote
  contributive diverse.
- Altri redditi, oneri deducibili e detraibili (mutuo, spese sanitarie,
  previdenza complementare…), fringe benefit, welfare aziendale, premi di
  risultato con imposta sostitutiva, TFR.
- Ripartizione delle detrazioni per genitori conviventi tra più contribuenti
  (si assume che il contribuente sia l'unico a farsene carico).
- Il riproporzionamento delle detrazioni ai mesi di carico.

**Un'interpretazione dichiarata.** Per la detrazione figli, la soglia di
95.000 € cresce di 15.000 € "per ogni figlio successivo al primo". Il
calcolatore conta in questo numero **tutti** i figli a carico, anche quelli
sotto i 21 anni per cui la detrazione non spetta. Le fonti consultate non
sono concordi (le istruzioni del 730 parlano di "figli che danno diritto
alla detrazione"): se preferisci la lettura restrittiva, indica in "Figli a
carico (totali)" solo quelli con detrazione. Il punto è segnato `DA
VERIFICARE` in `parametri-2026.js`.

## Fonti

Ogni valore in `parametri-2026.js` riporta la fonte e la data di verifica nel
commento che lo precede.

| Voce | Fonte | Verificato il |
|---|---|---|
| Contributi INPS, prima fascia, massimale | Circolare INPS n. 6 del 30/01/2026 | 18/08/2026 |
| Scaglioni IRPEF | Art. 11 TUIR, mod. art. 1 co. 3 L. 199/2025 (Normattiva) | 18/08/2026 |
| Detrazione lavoro dipendente | Art. 13 TUIR | 18/08/2026 |
| Cuneo fiscale | Art. 1 co. 4-9 L. 207/2024; Circolare AE 4/E del 16/05/2025 | 18/08/2026 |
| Trattamento integrativo | Art. 1 D.L. 3/2020 conv. L. 21/2020 | 18/08/2026 |
| Carichi di famiglia | Art. 12 TUIR, mod. L. 207/2024 e D.Lgs. 192/2025 | 17/09/2026 |
| Addizionali regionali | [MEF, Aliquote applicabili — elenco 2026 (CSV)][mef-reg] | 17/09/2026 |
| Addizionali comunali | [MEF, Aliquote applicabili — elenchi 2019–2026 (CSV)][mef-com] | 17/09/2026 |

[mef-reg]: https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/sceltaregione.htm
[mef-com]: https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/sceltaregione.htm

## Struttura

```
parametri-2026.js   costanti normative dell'anno, con fonte (unico file da aggiornare ogni anno)
calcolo.js          catena di calcolo, funzioni pure, senza DOM
index.html          interfaccia: collega form, calcolo e tabella
test.js             casi di prova e controlli automatici
```

### Estendere

- **Un altro comune in elenco**: aggiungi una voce a `COMUNI` con `nome`,
  `regione`, `aliquota` (o `scaglioni`), `esenzione` e `fonte`. I test di
  integrità verificano automaticamente che la regione esista e che la fonte
  sia indicata.
- **Un altro anno**: copia `parametri-2026.js` in `parametri-2027.js`,
  aggiorna i valori con le nuove fonti, e passa il nuovo oggetto a
  `calcolaNetto`. Il motore non contiene alcun numero: solo formule.

## Avvertenza

Strumento di stima, non consulenza fiscale. Il netto reale dipende dal CCNL,
dalla busta paga effettiva e da situazioni personali che non sono modellate.
Confronta sempre con il cedolino o con un professionista.

## Licenza

MIT — vedi [LICENSE](LICENSE).
