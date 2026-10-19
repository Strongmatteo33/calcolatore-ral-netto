import React, { useMemo } from 'react';
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';

const fmt = n => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

const NODE_COLORS = {
  'Costo Aziendale': '#4B5563',
  'RAL (Lordo)':     '#374151',
  'INPS Datore':     '#7F1D1D',
  'TFR':             '#92400E',
  'INPS Dip.':       '#DC2626',
  'IRPEF':           '#D97706',
  'Addizionali':     '#CA8A04',
  'Netto':           '#16A34A',
};

const W     = 900;
const H     = 820;
const PAD_L = 240;  // spazio label sinistra
const PAD_R = 260;  // spazio label destra
const PAD_T = 40;   // spazio label top (INPS Dip. può sforare in alto)

// Deconflict label Y positions: spinge le label distanziate di almeno MIN_GAP
const LABEL_H  = 56;  // altezza occupata da nome + valore (font grandi)
const MIN_GAP  = 12;  // gap minimo tra label
const MIN_STEP = LABEL_H + MIN_GAP;

function deconflict(items) {
  // items: array di { id, naturalY } — restituisce { id, y }
  const sorted = [...items].sort((a, b) => a.naturalY - b.naturalY);
  // passa forward
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.y - prev.y < MIN_STEP) curr.y = prev.y + MIN_STEP;
  }
  // passa backward (per centrare il gruppo)
  for (let i = sorted.length - 2; i >= 0; i--) {
    const next = sorted[i + 1];
    const curr = sorted[i];
    if (next.y - curr.y < MIN_STEP) curr.y = next.y - MIN_STEP;
  }
  return sorted;
}

export default function SankeyChart({ r }) {
  const layout = useMemo(() => {
    if (!r) return null;
    const nettoBase = Math.max(0, r.ral - r.inps - r.irpefFin - r.addReg - r.addCom);

    const nodeList = [
      { id: 0, name: 'Costo Aziendale' },
      { id: 1, name: 'RAL (Lordo)' },
      { id: 2, name: 'INPS Datore' },
      { id: 3, name: 'TFR' },
      { id: 4, name: 'INPS Dip.' },
      { id: 5, name: 'IRPEF' },
      { id: 6, name: 'Addizionali' },
      { id: 7, name: 'Netto' },
    ];

    const linkList = [
      { source: 0, target: 1, value: r.ral },
      { source: 0, target: 2, value: r.inpsDatore },
      { source: 0, target: 3, value: r.tfr },
      { source: 1, target: 4, value: r.inps },
      { source: 1, target: 5, value: r.irpefFin },
      { source: 1, target: 6, value: r.addReg + r.addCom },
      { source: 1, target: 7, value: nettoBase },
    ].filter(l => l.value > 0);

    const gen = sankey()
      .nodeId(d => d.id)
      .nodeAlign(sankeyLeft)
      .nodeWidth(32)
      .nodePadding(16)
      .extent([[0, 0], [W, H]]);

    return gen({
      nodes: nodeList.map(d => ({ ...d })),
      links: linkList.map(d => ({ ...d })),
    });
  }, [r]);

  if (!layout) return null;

  const { nodes, links } = layout;
  const linkPath = sankeyLinkHorizontal();

  // Separa nodi sinistra/destra
  const leftNodes  = nodes.filter(n => n.x0 < W / 2);
  const rightNodes = nodes.filter(n => n.x0 >= W / 2);

  // Calcola le label destra con deconflitto
  const rightLabels = deconflict(
    rightNodes.map(n => ({ id: n.id, naturalY: (n.y0 + n.y1) / 2, y: (n.y0 + n.y1) / 2 }))
  );
  const labelYMap = Object.fromEntries(rightLabels.map(l => [l.id, l.y]));

  const FONT_NAME   = '600 26px system-ui,sans-serif';
  const FONT_VAL    = '22px system-ui,sans-serif';
  const FONT_L_NAME = '500 24px system-ui,sans-serif';
  const FONT_L_VAL  = '20px system-ui,sans-serif';

  return (
    <div style={{ margin: '1.25rem 0', overflowX: 'auto' }}>
      <svg
        viewBox={`${-PAD_L} ${-PAD_T} ${W + PAD_L + PAD_R} ${H + PAD_T}`}
        style={{ width: '100%', minWidth: 520, display: 'block' }}
      >
        {/* ── Flussi ── */}
        {links.map((link, i) => (
          <path
            key={i}
            d={linkPath(link)}
            fill="none"
            stroke={NODE_COLORS[link.target.name] ?? '#94A3B8'}
            strokeWidth={Math.max(1, link.width)}
            strokeOpacity={0.35}
          />
        ))}

        {/* ── Nodi ── */}
        {nodes.map(node => {
          const color = NODE_COLORS[node.name] ?? '#6B7280';
          return (
            <rect
              key={node.id}
              x={node.x0} y={node.y0}
              width={node.x1 - node.x0} height={node.y1 - node.y0}
              fill={color} rx={3}
            />
          );
        })}

        {/* ── Label sinistra ── */}
        {leftNodes.map(node => {
          const midY = (node.y0 + node.y1) / 2;
          return (
            <g key={node.id}>
              <text x={node.x0 - 10} y={midY - 12} textAnchor="end"
                fill="#1F2937" style={{ font: FONT_L_NAME }}>
                {node.name}
              </text>
              <text x={node.x0 - 10} y={midY + 16} textAnchor="end"
                fill="#6B7280" style={{ font: FONT_L_VAL }}>
                {fmt(node.value)}
              </text>
            </g>
          );
        })}

        {/* ── Label destra con deconflitto ── */}
        {rightNodes.map(node => {
          const color   = NODE_COLORS[node.name] ?? '#6B7280';
          const nodeMid = (node.y0 + node.y1) / 2;
          const labelY  = labelYMap[node.id];
          const labelX  = node.x1 + 12;
          const lineX0  = node.x1 + 4;
          const lineX1  = node.x1 + 10;
          const label   = node.name === 'Netto' ? 'Totale Percepito' : node.name;

          return (
            <g key={node.id}>
              {/* Linea di connessione nodo → label */}
              <line
                x1={lineX0} y1={nodeMid}
                x2={lineX1} y2={labelY}
                stroke={color} strokeWidth={1.5} strokeOpacity={0.6}
              />
              <text x={labelX} y={labelY - 12} textAnchor="start"
                fill={color} style={{ font: FONT_NAME }}>
                {label}
              </text>
              <text x={labelX} y={labelY + 18} textAnchor="start"
                fill="#6B7280" style={{ font: FONT_VAL }}>
                {fmt(node.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
