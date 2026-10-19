const express = require('express');
const cors = require('cors');
const { computeNet } = require('./calcolo');
const { computeNetPolizia, GRADI_POLIZIA } = require('./calcolo-polizia');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/calcola', (req, res) => {
  const {
    ral = 30000, mens = 13, tipo = 'std',
    regionCode = 'LO', comAliq = 0.5,
    coniuge = 0, figli = 0, figliDis = 0, altriF = 0,
    prev = 0, fringe = 0, premio = 0,
    impatriati = false, mamma = false,
  } = req.body;
  res.json(computeNet({ ral, mens, tipo, regionCode, comAliq, coniuge, figli, figliDis, altriF, prev, fringe, premio, impatriati, mamma }));
});

app.get('/api/proiezione', (req, res) => {
  const regionCode = req.query.regionCode || 'LO';
  const comAliq = parseFloat(req.query.comAliq) || 0.5;
  const mens = parseInt(req.query.mens) || 13;
  const rals = [10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 60000, 80000, 100000];
  const risultati = rals.map(ral => {
    const r = computeNet({ ral, mens, tipo: 'std', regionCode, comAliq, coniuge: 0, figli: 0, figliDis: 0, altriF: 0, prev: 0, fringe: 0, premio: 0, impatriati: false, mamma: false });
    return { ral, netto: r.netto, nettoMensile: r.netto / mens, aliqEff: (ral - r.netto) / ral * 100 };
  });
  res.json(risultati);
});

app.post('/api/calcola-polizia', (req, res) => {
  const {
    ral = 19276, mens = 13, regionCode = 'LO', comAliq = 0.5,
    coniuge = 0, figli = 0, figliDis = 0, altriF = 0,
    prev = 0, indAccessorie = 800, anniServizio = 0, mamma = false,
  } = req.body;
  res.json(computeNetPolizia({ ral, mens, regionCode, comAliq, coniuge, figli, figliDis, altriF, prev, indAccessorie, anniServizio, mamma }));
});

app.get('/api/gradi-polizia', (req, res) => {
  res.json(GRADI_POLIZIA);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend in ascolto su http://localhost:${PORT}`));
