/* ============================================================
   viz.js — visualizações SVG para os slides matemáticos.
   Cada função devolve markup SVG; a revelação incremental é
   controlada por data-fragment-index nos grupos, sincronizada
   com os fragmentos do reveal.js.
   ============================================================ */

const NS = "http://www.w3.org/2000/svg";

/* ---------- util ---------- */
function el(tag, attrs = {}, children = "") {
  const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
  return `<${tag} ${a}>${children}</${tag}>`;
}

/* ============================================================
   1) PLANO 2D com vetores — usado em: feature=direção (7),
      quase-ortogonalidade (14), interferência (15).
      Origem no canto inferior-esquerdo. Coordenadas matemáticas
      convertidas para tela.
   ============================================================ */
function plane2D(opts) {
  const { w = 440, h = 380, pad = 46, id = "pl", vectors = [], showAngle = null,
          axisLabels = ["neurônio 1", "neurônio 2"], gridStep = 0 } = opts;
  const ox = pad, oy = h - pad;                 // origem em tela
  const spanX = w - pad * 1.4, spanY = h - pad * 1.7;
  const X = (x) => ox + x * spanX;               // x∈[0,1]
  const Y = (y) => oy - y * spanY;               // y∈[0,1]

  let g = "";
  // grid opcional
  if (gridStep > 0) {
    for (let t = gridStep; t < 1; t += gridStep) {
      g += el("line", { class: "gridln", x1: X(t), y1: Y(0), x2: X(t), y2: Y(1) });
      g += el("line", { class: "gridln", x1: X(0), y1: Y(t), x2: X(1), y2: Y(t) });
    }
  }
  // eixos
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: X(1.02), y2: oy, "marker-end": `url(#ah-${id})` });
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: ox, y2: Y(1.02), "marker-end": `url(#ah-${id})` });
  g += el("text", { x: X(1.0), y: oy + 26, "text-anchor": "end", fill: "#71717A", "font-size": 15 }, axisLabels[0]);
  g += el("text", { x: ox - 6, y: Y(1.0) - 8, "text-anchor": "start", fill: "#71717A", "font-size": 15 }, axisLabels[1]);

  // ângulo (arco entre dois vetores) — opcional
  if (showAngle && vectors.length >= 2) {
    const a1 = Math.atan2(-(vectors[0].y), vectors[0].x);
    const a2 = Math.atan2(-(vectors[1].y), vectors[1].x);
    const r = 54;
    const x1 = ox + r * Math.cos(a1), y1 = oy + r * Math.sin(a1);
    const x2 = ox + r * Math.cos(a2), y2 = oy + r * Math.sin(a2);
    const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
    const sweep = a2 < a1 ? 1 : 0;
    g += el("path", { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`,
      fill: "none", stroke: "#B45309", "stroke-width": 2.5,
      "data-frag": showAngle.frag ?? "" , "data-term": showAngle.term ?? "",
      class: `vterm ${showAngle.frag != null ? "vfrag" : ""}` });
    const am = (a1 + a2) / 2;
    g += el("text", { x: ox + (r + 20) * Math.cos(am), y: oy + (r + 20) * Math.sin(am) + 5,
      "text-anchor": "middle", fill: "#B45309", "font-size": 20, "font-style": "italic",
      "data-frag": showAngle.frag ?? "", "data-term": showAngle.term ?? "",
      class: `vterm ${showAngle.frag != null ? "vfrag" : ""}` }, "θ");
  }

  // vetores
  vectors.forEach((v, i) => {
    const cls = `vterm ${v.frag != null ? "vfrag" : ""}`;
    const col = v.color || "#6B21A8";
    g += el("g", { "data-frag": v.frag ?? "", "data-term": v.term ?? "", class: cls },
      el("line", { x1: ox, y1: oy, x2: X(v.x), y2: Y(v.y), stroke: col, "stroke-width": v.width || 4,
        "marker-end": `url(#vh-${id}-${i})` }) +
      (v.label ? el("text", { x: X(v.x) + (v.lx || 8), y: Y(v.y) + (v.ly || -6),
        fill: col, "font-size": 18, "font-weight": 700 }, v.label) : "")
    );
  });

  // defs de marcadores (setas)
  let defs = el("marker", { id: `ah-${id}`, markerWidth: 10, markerHeight: 10, refX: 8, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L8,3 L0,6 Z", fill: "#B8B8C0" }));
  vectors.forEach((v, i) => {
    defs += el("marker", { id: `vh-${id}-${i}`, markerWidth: 9, markerHeight: 9, refX: 6.5, refY: 3,
      orient: "auto", markerUnits: "strokeWidth" },
      el("path", { d: "M0,0 L7,3 L0,6 Z", fill: v.color || "#6B21A8" }));
  });

  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id },
    el("defs", {}, defs) + g);
}

/* ============================================================
   2) MUITOS vetores quase-ortogonais (14) — mostra que em alta
      dimensão cabem muitas direções quase perpendiculares.
   ============================================================ */
function fanVectors(opts) {
  const { w = 300, h = 300, id = "fan", n = 8, frag = null,
          colorA = "#6B21A8", colorB = "#9333EA" } = opts;
  const cx = w * 0.16, cy = h * 0.84, r = Math.min(w, h) * 0.72;
  let g = el("line", { class: "axis", x1: cx, y1: cy, x2: cx + r * 0.05, y2: cy }); // ref
  for (let k = 0; k < n; k++) {
    const ang = -(Math.PI / 2) * (k / (n - 1));   // de 0 a -90°
    const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
    g += el("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: k % 2 ? colorB : colorA,
      "stroke-width": 3, opacity: 0.9 });
  }
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: `viz ${frag != null ? "vfrag" : ""}`,
    "data-frag": frag ?? "", id }, g);
}

/* ============================================================
   3) REDE NEURAL simples com neurônio polissemântico destacável
      — usado em: polissemanticidade (11), feature=combinação (7).
   ============================================================ */
function miniNet(opts) {
  const { w = 380, h = 320, id = "net", highlight = [], litColor = "#6B21A8" } = opts;
  const layers = opts.layers || [3, 4, 2];
  const colX = layers.map((_, i) => 60 + i * ((w - 120) / (layers.length - 1)));
  const pos = [];
  layers.forEach((n, li) => {
    const gap = (h - 80) / (n + 1);
    pos[li] = [];
    for (let k = 0; k < n; k++) pos[li][k] = { x: colX[li], y: 40 + gap * (k + 1) };
  });
  let edges = "", nodes = "";
  for (let li = 0; li < layers.length - 1; li++) {
    pos[li].forEach((a) => pos[li + 1].forEach((b) => {
      edges += el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#E0E0E6", "stroke-width": 1 });
    }));
  }
  pos.forEach((col, li) => col.forEach((p, k) => {
    const key = `${li}-${k}`;
    const lit = highlight.includes(key);
    nodes += el("circle", { cx: p.x, cy: p.y, r: 13,
      fill: lit ? litColor : "#F0EAF7", stroke: lit ? litColor : "#C9B8DD", "stroke-width": 2 });
  }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, edges + nodes);
}

/* ============================================================
   4) SAE diagram — ativação (poucos neurônios) → expande em
      muitas features esparsas (poucas acesas) → reconstrói.
      Usado em: expandir não comprimir (20), fórmula SAE (21).
   ============================================================ */
function saeDiagram(opts) {
  const { w = 460, h = 300, id = "sae", litSet = [1, 4, 7], nFeat = 10,
          showRecon = true, stage = 2 } = opts;
  // stage: 0 = só entrada; 1 = entrada+encoder+features; 2 = +decoder+saída
  const xIn = 60, xFeat = w / 2, xOut = w - 60;
  const inN = 4, gapIn = (h - 60) / (inN + 1);
  let g = "";
  const inPos = [];
  for (let k = 0; k < inN; k++) { const y = 30 + gapIn * (k + 1); inPos.push({ x: xIn, y }); }
  const gapF = (h - 30) / (nFeat + 1);
  const fPos = [];
  for (let k = 0; k < nFeat; k++) { const y = 15 + gapF * (k + 1); fPos.push({ x: xFeat, y }); }

  // grupo ENCODER (entrada→features): arestas + nós de feature
  let enc = "";
  inPos.forEach((a) => fPos.forEach((b) =>
    enc += el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#EDE7F3", "stroke-width": 0.7 })));
  fPos.forEach((p, k) => {
    const lit = litSet.includes(k);
    enc += el("circle", { cx: p.x, cy: p.y, r: 8,
      fill: lit ? "#6B21A8" : "#EDEDF0", stroke: lit ? "#6B21A8" : "#D8D8DE", "stroke-width": 1.5 });
  });
  // grupo DECODER (features→saída)
  let dec = "";
  if (showRecon) {
    const oPos = [];
    for (let k = 0; k < inN; k++) { const y = 30 + gapIn * (k + 1); oPos.push({ x: xOut, y }); }
    fPos.filter((_, k) => litSet.includes(k)).forEach((a) => oPos.forEach((b) =>
      dec += el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#CDE9F0", "stroke-width": 1 })));
    oPos.forEach((p) => dec += el("circle", { cx: p.x, cy: p.y, r: 11,
      fill: "#F0F9FB", stroke: "#0891B2", "stroke-width": 2 }));
    dec += el("text", { x: xOut, y: h - 4, "text-anchor": "middle", fill: "#71717A", "font-size": 13 }, "x̂");
  }

  // desenha por estágio, marcando termos para realce
  // entrada (sempre visível a partir do stage 0)
  let inp = "";
  inPos.forEach((p) => inp += el("circle", { cx: p.x, cy: p.y, r: 11,
    fill: "#E9DEF5", stroke: "#9333EA", "stroke-width": 2 }));
  g += el("g", { class: "vterm", "data-term": "x" }, inp);
  if (stage >= 1) g += el("g", { class: "vterm", "data-term": "enc" }, enc);
  if (stage >= 2 && showRecon) g += el("g", { class: "vterm", "data-term": "dec" }, dec);

  // labels
  g += el("text", { x: xIn, y: h - 4, "text-anchor": "middle", fill: "#71717A", "font-size": 13 }, "x");
  if (stage >= 1)
    g += el("text", { x: xFeat, y: h - 4, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "f(x)");
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   5) TRANSFORMER stack + residual stream — usado em (9), (27).
   ============================================================ */
function transformerStack(opts) {
  const { w = 400, h = 360, id = "tr", nBlocks = 3, crossLayer = false } = opts;
  const topPad = 28, botPad = 46;                 // espaço p/ seta e legenda
  const streamX = w * 0.26;
  const gutter = 34;                              // vão entre stream e 1ª caixa
  const boxGap = 16;                              // vão entre Atenção e MLP
  const boxW = (w - (streamX + gutter) - boxGap - 14) / 2;
  const bh = (h - topPad - botPad) / nBlocks;     // altura de cada faixa
  const boxH = bh - 22;                           // caixa com respiro vertical
  let g = "";

  // conexões bloco<->stream primeiro (ficam ATRÁS de tudo), curtas e sutis
  for (let i = 0; i < nBlocks; i++) {
    const cy = topPad + i * bh + bh / 2;
    g += el("line", { x1: streamX, y1: cy, x2: streamX + gutter, y2: cy,
      stroke: "#D9C7EC", "stroke-width": 1.5 });
  }
  // residual stream (linha vertical grossa) — por cima das conexões
  g += el("line", { x1: streamX, y1: topPad - 6, x2: streamX, y2: h - botPad + 10,
    stroke: "#6B21A8", "stroke-width": 4, "marker-end": `url(#trah-${id})` });
  g += el("text", { x: streamX, y: h - botPad + 32, "text-anchor": "middle", fill: "#6B21A8",
    "font-size": 14, "font-style": "italic" }, "residual stream");

  // blocos (por cima do stream, então as pontas das conexões ficam escondidas sob a caixa)
  for (let i = 0; i < nBlocks; i++) {
    const y = topPad + i * bh + (bh - boxH) / 2;
    ["Atenção", "MLP"].forEach((lbl, j) => {
      const bx = streamX + gutter + j * (boxW + boxGap);
      g += el("rect", { x: bx, y, width: boxW, height: boxH, rx: 9,
        fill: "#fff", stroke: "#9333EA", "stroke-width": 1.5 });
      g += el("text", { x: bx + boxW / 2, y: y + boxH / 2 + 5, "text-anchor": "middle",
        fill: "#3F3F46", "font-size": 15 }, lbl);
    });
  }

  // cross-layer feature (atravessa várias camadas) — trilho rosa colado ao stream
  if (crossLayer) {
    const cx = streamX + 15;
    g += el("line", { x1: cx, y1: topPad + 4, x2: cx, y2: h - botPad - 4,
      stroke: "#DB2777", "stroke-width": 3 });
    for (let i = 0; i < nBlocks; i++) {
      const cy = topPad + i * bh + bh / 2;
      g += el("circle", { cx, cy, r: 5.5, fill: "#DB2777" });
    }
  }
  const defs = el("marker", { id: `trah-${id}`, markerWidth: 9, markerHeight: 9, refX: 4, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   21) TRANSFORMER + RESIDUAL STREAM como "QUADRO" — os tokens
       entram embaixo; o residual stream é um quadro/lousa vertical
       que cada camada LÊ e ESCREVE. Mostra a acumulação.
       stage: quantos passos de leitura/escrita revelar (0..nLayers)
   ============================================================ */
function transformerBoard(opts) {
  const { w = 460, h = 380, id = "tb", nLayers = 3, stage = 99 } = opts;
  const boardX = w * 0.30, boardW = w * 0.16;      // o "quadro" (faixa vertical)
  const top = 30, bot = h - 52;
  const boardTop = top, boardBot = bot;
  let g = "";
  // ---- tokens de entrada (embaixo) ----
  const toks = ["A", "capital", "da", "França"];
  const tokY = h - 26;
  const tokW = (boardX + boardW) / toks.length;
  toks.forEach((t, i) => {
    const tx = 8 + i * ((boardX + boardW - 8) / toks.length);
    g += el("rect", { x: tx, y: tokY - 16, width: (boardX + boardW - 12) / toks.length - 4, height: 22, rx: 5,
      fill: "#EDE4F7", stroke: "#9333EA", "stroke-width": 1 });
    g += el("text", { x: tx + ((boardX + boardW - 12) / toks.length - 4) / 2, y: tokY, "text-anchor": "middle",
      fill: "#6B21A8", "font-size": 11 }, t);
  });
  g += el("text", { x: (boardX + boardW) / 2, y: tokY - 24, "text-anchor": "middle", fill: "#A1A1AA", "font-size": 11 }, "tokens de entrada");
  // seta dos tokens subindo pro quadro
  g += el("line", { x1: (boardX + boardW) / 2, y1: tokY - 34, x2: boardX + boardW / 2, y2: boardBot + 4,
    stroke: "#C9B8DD", "stroke-width": 2, "marker-end": `url(#tbah-${id})` });

  // ---- o QUADRO (residual stream) ----
  g += el("rect", { x: boardX, y: boardTop, width: boardW, height: boardBot - boardTop, rx: 6,
    fill: "#F8F5FC", stroke: "#6B21A8", "stroke-width": 2.5 });
  g += el("text", { x: boardX + boardW / 2, y: boardTop - 10, "text-anchor": "middle", fill: "#6B21A8",
    "font-size": 13, "font-weight": 700 }, "o quadro");
  g += el("text", { x: boardX + boardW / 2, y: boardBot + 18, "text-anchor": "middle", fill: "#6B21A8",
    "font-size": 12, "font-style": "italic" }, "residual stream");
  // "escritos" acumulados no quadro (aparecem conforme stage)
  const layerH = (boardBot - boardTop) / nLayers;
  for (let i = 0; i < nLayers; i++) {
    if (i < stage) {
      // marca de escrita acumulada — um tracinho colorido dentro do quadro
      const yy = boardBot - (i + 0.5) * layerH;
      g += el("line", { x1: boardX + 6, y1: yy, x2: boardX + boardW - 6, y2: yy,
        stroke: i % 2 ? "#DB2777" : "#9333EA", "stroke-width": 3, opacity: 0.7 });
    }
  }

  // ---- camadas (alunos que leem e escrevem) à direita ----
  const camX = boardX + boardW + w * 0.10;
  const camW = w - camX - 12;
  for (let i = 0; i < nLayers; i++) {
    const cy = boardBot - (i + 0.5) * layerH;      // camada i alinhada à faixa i
    const active = i < stage;
    const boxH = layerH * 0.62;
    // caixa da camada
    g += el("rect", { x: camX, y: cy - boxH / 2, width: camW, height: boxH, rx: 8,
      fill: active ? "#fff" : "#FAFAFA", stroke: active ? "#9333EA" : "#D4D4D8", "stroke-width": active ? 2 : 1.2 });
    g += el("text", { x: camX + camW / 2, y: cy - 2, "text-anchor": "middle",
      fill: active ? "#3F3F46" : "#A1A1AA", "font-size": 12, "font-weight": 600 }, `Camada ${i + 1}`);
    g += el("text", { x: camX + camW / 2, y: cy + 13, "text-anchor": "middle",
      fill: active ? "#71717A" : "#C4C4CC", "font-size": 10 }, "Atenção + MLP");
    // setas LER (quadro→camada) e ESCREVER (camada→quadro)
    if (active) {
      const yRead = cy - boxH * 0.28, yWrite = cy + boxH * 0.28;
      // ler: do quadro para a camada
      g += el("line", { x1: boardX + boardW + 2, y1: yRead, x2: camX - 2, y2: yRead,
        stroke: "#059669", "stroke-width": 2, "marker-end": `url(#tbread-${id})` });
      // escrever: da camada de volta pro quadro
      g += el("line", { x1: camX - 2, y1: yWrite, x2: boardX + boardW + 2, y2: yWrite,
        stroke: "#DB2777", "stroke-width": 2, "marker-end": `url(#tbwrite-${id})` });
    }
  }
  // legenda ler/escrever (topo direito)
  if (stage > 0) {
    g += el("circle", { cx: camX, cy: top + 2, r: 4, fill: "#059669" });
    g += el("text", { x: camX + 8, y: top + 6, fill: "#059669", "font-size": 11, "font-weight": 700 }, "lê");
    g += el("circle", { cx: camX + 42, cy: top + 2, r: 4, fill: "#DB2777" });
    g += el("text", { x: camX + 50, y: top + 6, fill: "#DB2777", "font-size": 11, "font-weight": 700 }, "escreve");
  }
  const defs =
    el("marker", { id: `tbah-${id}`, markerWidth: 8, markerHeight: 8, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#C9B8DD" })) +
    el("marker", { id: `tbread-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#059669" })) +
    el("marker", { id: `tbwrite-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#DB2777" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   22) POLÍGONOS REGULARES (superposição uniforme) — features como
       vértices de um polígono regular no plano 2D. Conforme a
       esparsidade sobe, mais features → mais vértices (dígono →
       triângulo → pentágono...). Réplica didática da figura do
       Toy Models (Elhage 2022).
   ============================================================ */
function polygonSuperposition(opts) {
  const { w = 340, h = 340, id = "ps", sparsity = 0.3 } = opts;
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.32;
  // nº de features/vértices cresce com a esparsidade: 2..7
  const n = Math.round(2 + sparsity * 5);          // 2..7
  const names = { 2: "dígono (par antipodal)", 3: "triângulo", 4: "quadrado", 5: "pentágono", 6: "hexágono", 7: "heptágono" };
  let g = "";
  // círculo-guia
  g += el("circle", { cx, cy, r: R, fill: "none", stroke: "#ECECF0", "stroke-width": 1.5 });
  g += el("circle", { cx, cy, r: 3, fill: "#1A1A1A" });
  // vértices = pontas dos vetores de feature, distribuídos uniformemente
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n;   // começa no topo
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  // arestas do polígono (convex hull) — só se n>=3
  if (n >= 3) {
    let path = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
    g += el("path", { d: path, fill: "#6B21A8", "fill-opacity": 0.06, stroke: "#C9B8DD", "stroke-width": 1.5 });
  }
  // vetores (do centro a cada vértice) + ponto
  pts.forEach((p, k) => {
    const col = k % 2 ? "#9333EA" : "#6B21A8";
    g += el("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: col, "stroke-width": 3,
      "marker-end": `url(#psh-${id})`, opacity: 0.9 });
    g += el("circle", { cx: p[0], cy: p[1], r: 4, fill: col });
  });
  // rótulo do polígono
  g += el("text", { x: cx, y: h - 14, "text-anchor": "middle", fill: "#6B21A8", "font-size": 16, "font-weight": 700 },
    `${n} features → ${names[n] || n + "-gono"}`);
  const defs = el("marker", { id: `psh-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" }));
  return { svg: el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g), n, polygon: names[n] || n + "-gono" };
}

/* ============================================================
   6b) POLÍGONO DE FEATURES (enriquecido) — o achado do Toy Models:
       N features em 2D se organizam nos VÉRTICES de um polígono
       regular, maximizando o ângulo mútuo e minimizando interferência.
       Mostra: a forma (dígono→180°, triângulo→120°, quadrado→90°,
       pentágono→72°...), o ÂNGULO entre features vizinhas (arco), e
       rótulos f1..fn. Retorna { svg, n, polygon, angleDeg }.
   ============================================================ */
function polygonFeatures(opts) {
  const { w = 380, h = 380, id = "pf", n: nIn = 3 } = opts;
  const cx = w / 2, cy = h / 2 + 6, R = Math.min(w, h) * 0.30;
  const n = Math.max(2, Math.min(8, nIn));
  const names = { 2: "dígono (antípodas)", 3: "triângulo", 4: "quadrado", 5: "pentágono", 6: "hexágono", 7: "heptágono", 8: "octógono" };
  const angleDeg = Math.round(360 / n);
  let g = "";
  // círculo-guia
  g += el("circle", { cx, cy, r: R, fill: "none", stroke: "#ECECF0", "stroke-width": 1.5 });
  // vértices
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / n;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a), a]);
  }
  // aresta(s) do polígono
  if (n === 2) {
    g += el("line", { x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1],
      stroke: "#C9B8DD", "stroke-width": 1.5, "stroke-dasharray": "5 4" });
  } else {
    const path = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
    g += el("path", { d: path, fill: "#6B21A8", "fill-opacity": 0.05, stroke: "#C9B8DD", "stroke-width": 1.5 });
  }
  // arco do ângulo entre as duas primeiras features vizinhas (no centro)
  const aArc = 30;
  const a0 = pts[0][2], a1 = pts[1][2];
  const sweep = n === 2 ? 1 : 0;
  g += el("path", {
    d: `M ${cx + aArc * Math.cos(a0)} ${cy + aArc * Math.sin(a0)} A ${aArc} ${aArc} 0 0 ${sweep} ${cx + aArc * Math.cos(a1)} ${cy + aArc * Math.sin(a1)}`,
    fill: "none", stroke: "#D97706", "stroke-width": 2.5 });
  const amid = a0 + (a1 - a0) / 2;
  g += el("text", { x: cx + (aArc + 22) * Math.cos(amid), y: cy + (aArc + 22) * Math.sin(amid) + 4,
    "text-anchor": "middle", fill: "#D97706", "font-size": 15, "font-weight": 700 }, `${angleDeg}°`);
  // vetores de feature + rótulos
  pts.forEach((p, k) => {
    const col = k % 2 ? "#9333EA" : "#6B21A8";
    g += el("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: col, "stroke-width": 3.5,
      "marker-end": `url(#pfh-${id})`, opacity: 0.92 });
    // rótulo fk um pouco além da ponta
    const lx = cx + (R + 20) * Math.cos(p[2]), ly = cy + (R + 20) * Math.sin(p[2]);
    g += el("text", { x: lx, y: ly + 4, "text-anchor": "middle", fill: col, "font-size": 14, "font-weight": 700,
      "font-family": "'Playfair Display',serif" }, `f${k + 1}`);
  });
  g += el("circle", { cx, cy, r: 4, fill: "#1A1A1A" });
  const defs = el("marker", { id: `pfh-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" }));
  return { svg: el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g),
           n, polygon: names[n] || n + "-gono", angleDeg };
}

function attribGraph(opts) {
  const { w = 300, h = 380, id = "ag", nodes = [], swap = null } = opts;
  // nodes: [{label, y(0..1), out?}]
  let g = "";
  const X = w / 2;
  const ny = (t) => 40 + t * (h - 90);
  for (let i = 0; i < nodes.length - 1; i++)
    g += el("line", { x1: X, y1: ny(nodes[i].y) + 26, x2: X, y2: ny(nodes[i + 1].y) - 4,
      stroke: "#B8B8C0", "stroke-width": 2.5, "marker-end": `url(#agah-${id})` });
  nodes.forEach((nd) => {
    const out = nd.out;
    const y = ny(nd.y);
    g += el("rect", { x: X - 78, y: y - 4, width: 156, height: 46, rx: 12,
      fill: out ? "#6B21A8" : "#F3E8FC", stroke: out ? "#6B21A8" : "none", "stroke-width": 1 });
    g += el("text", { x: X, y: y + 24, "text-anchor": "middle",
      fill: out ? "#fff" : "#6B21A8", "font-size": 18, "font-weight": 700 }, nd.label);
  });
  const defs = el("marker", { id: `agah-${id}`, markerWidth: 9, markerHeight: 9, refX: 6, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#B8B8C0" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   7) SUPERPOSIÇÃO INTERATIVA — o círculo de features.
      A esparsidade (0..1) controla quantas features a rede
      "liga" e como elas se arranjam no plano 2D:
      - esparsidade baixa: só cabem 2 features ortogonais (90°)
      - esparsidade alta: várias features se distribuem em
        polígono regular, quase-ortogonais, aceitando interferência.
      Retorna SVG. Chamada a cada input do slider.
   ============================================================ */
function superposition(opts) {
  const { w = 360, h = 360, id = "sp", sparsity = 0.5 } = opts;
  const ox = w * 0.16, oy = h * 0.84, R = Math.min(w, h) * 0.66;
  // nº de features cabíveis cresce com a esparsidade: 2 → 9
  const n = Math.round(2 + sparsity * 7);          // 2..9
  // As features permanecem QUASE perpendiculares: preenchem uma faixa
  // estreita perto de 90°. Quanto mais features, mais apertadas — mas nunca
  // colapsam, porque em alta dimensão há espaço para muitas quase-ortogonais.
  // Faixa angular total ocupada cresce devagar (de ~0 até ~55°).
  const spanDeg = 8 + sparsity * 48;               // leque de 8°..56°
  const span = spanDeg * Math.PI / 180;
  const start = Math.PI / 2 - span / 2;            // centrado em 90° (eixo y = ideal)
  const step = n > 1 ? span / (n - 1) : 0;
  const stepDeg = Math.round(step * 180 / Math.PI);
  // ângulo médio ao vizinho mais próximo do "ideal 90°": quanto o leque desvia.
  // interferência ~ sen(desvio do centro) média — cresce suave de 0.
  const interfVal = Math.min(0.95, 0.5 * (1 - Math.cos(span / 2)) + (n - 2) * 0.03);
  const interf = interfVal.toFixed(2);
  let g = "";
  // quarto de círculo-guia
  g += el("path", { d: `M ${ox + R} ${oy} A ${R} ${R} 0 0 0 ${ox} ${oy - R}`,
    fill: "none", stroke: "#ECECF0", "stroke-width": 1.5 });
  g += el("line", { x1: ox, y1: oy, x2: ox + R + 16, y2: oy, stroke: "#DEDEE4", "stroke-width": 1.5 });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - R - 16, stroke: "#DEDEE4", "stroke-width": 1.5 });
  // linha tracejada no 90° ideal (referência)
  g += el("line", { x1: ox, y1: oy, x2: ox + R * Math.cos(Math.PI/2), y2: oy - R * Math.sin(Math.PI/2),
    stroke: "#D1FAE5", "stroke-width": 2, "stroke-dasharray": "4 4" });
  // setas de feature dentro do leque quase-ortogonal
  for (let k = 0; k < n; k++) {
    const a = start + k * step;
    const x = ox + R * Math.cos(a), y = oy - R * Math.sin(a);
    const col = k % 2 ? "#9333EA" : "#6B21A8";
    g += el("line", { x1: ox, y1: oy, x2: x, y2: y, stroke: col, "stroke-width": 3.5,
      "marker-end": `url(#sph-${id})`, opacity: 0.92 });
  }
  g += el("circle", { cx: ox, cy: oy, r: 4, fill: "#1A1A1A" });
  const defs = el("marker", { id: `sph-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" }));
  return { svg: el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g),
           n, minAngleDeg: stepDeg, interf };
}

/* ============================================================
   8) GRAFO DE INTERVENÇÃO CAUSAL (Dallas→Texas→Austin).
      Estado "normal" vs "intervencionado" (Texas→Califórnia).
      O nó do meio é clicável: trocar o conceito propaga a
      mudança para a saída — materializa a intervenção causal.
   ============================================================ */
function causalChain(opts) {
  const { w = 340, h = 380, id = "cc", swapped = false } = opts;
  const X = w / 2;
  const mid = swapped
    ? { label: "Califórnia", color: "#1D4ED8", bg: "#DBEAFE" }
    : { label: "Texas", color: "#6B21A8", bg: "#F3E8FC" };
  const out = swapped ? "Sacramento" : "Austin";
  const nodes = [
    { label: "Dallas", y: 0, bg: "#F3E8FC", fg: "#6B21A8" },
    { label: mid.label, y: 0.34, bg: mid.bg, fg: mid.color, clickable: true },
    { label: "+ capital", y: 0.66, bg: "#F3E8FC", fg: "#6B21A8" },
    { label: out, y: 1, out: true }
  ];
  const ny = (t) => 42 + t * (h - 120);
  let g = "";
  // arestas
  for (let i = 0; i < nodes.length - 1; i++) {
    const y1 = ny(nodes[i].y) + 26, y2 = ny(nodes[i + 1].y) - 6;
    g += el("line", { x1: X, y1, x2: X, y2, stroke: "#B8B8C0", "stroke-width": 2.5,
      "marker-end": `url(#cch-${id})` });
  }
  // nós
  nodes.forEach((nd) => {
    const y = ny(nd.y);
    const out = nd.out;
    const fill = out ? "#6B21A8" : nd.bg;
    const fg = out ? "#fff" : nd.fg;
    const cls = nd.clickable ? ` class="cc-click" data-cc="${id}" style="cursor:pointer"` : "";
    // grupo clicável (o handler fica no HTML)
    g += `<g${cls}>`;
    g += el("rect", { x: X - 82, y: y - 4, width: 164, height: 46, rx: 12,
      fill, stroke: out ? "#6B21A8" : (nd.clickable ? nd.fg : "none"),
      "stroke-width": nd.clickable ? 2 : 1 });
    g += el("text", { x: X, y: y + 24, "text-anchor": "middle", fill: fg,
      "font-size": 19, "font-weight": 700 }, nd.label);
    if (nd.clickable)
      g += el("text", { x: X, y: y + 62, "text-anchor": "middle", fill: "#71717A",
        "font-size": 13, "font-style": "italic" }, swapped ? "◑ clique para reverter" : "◑ clique para intervir");
    g += `</g>`;
  });
  const defs = el("marker", { id: `cch-${id}`, markerWidth: 9, markerHeight: 9, refX: 6, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#B8B8C0" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   9) TRADE-OFF da perda do SAE — uma gangorra entre os dois
      termos. tilt ∈ [-1,1]: -1 pende p/ reconstrução (fiel, denso),
      +1 pende p/ esparsidade (poucas features, perde detalhe).
      Marca cada lado com data-term para o realce sincronizado.
   ============================================================ */
function lossBalance(opts) {
  const { w = 380, h = 300, id = "lb", tilt = 0, highlight = null } = opts;
  const cx = w / 2, pivotY = h * 0.62, armLen = w * 0.34, armAng = tilt * 0.32; // rad
  const dx = armLen * Math.cos(armAng), dy = armLen * Math.sin(armAng);
  const lx = cx - dx, ly = pivotY + dy;   // ponta esquerda (reconstrução)
  const rx = cx + dx, ry = pivotY - dy;   // ponta direita (esparsidade)
  let g = "";
  // base/pivô
  g += el("path", { d: `M ${cx - 26} ${h - 24} L ${cx + 26} ${h - 24} L ${cx} ${pivotY + 6} Z`,
    fill: "#E5E1EA" });
  // braço
  g += el("line", { x1: lx, y1: ly, x2: rx, y2: ry, stroke: "#3F3F46", "stroke-width": 5,
    "stroke-linecap": "round" });
  g += el("circle", { cx, cy: pivotY, r: 6, fill: "#3F3F46" });
  // prato esquerdo — RECONSTRUÇÃO (azul)
  const encL = (lit) => `filter:${lit ? "drop-shadow(0 0 7px #1D4ED8)" : "none"}`;
  g += el("g", { class: "vterm", "data-term": "recon", style: encL(highlight === "recon") },
    el("line", { x1: lx, y1: ly, x2: lx, y2: ly + 26, stroke: "#94A3B8", "stroke-width": 1.5 }) +
    el("circle", { cx: lx, cy: ly + 40, r: 26, fill: "#DBEAFE", stroke: "#1D4ED8", "stroke-width": 2 }) +
    el("text", { x: lx, y: ly + 45, "text-anchor": "middle", fill: "#1D4ED8", "font-size": 13, "font-weight": 700 }, "recon.") +
    el("text", { x: lx, y: ly + 82, "text-anchor": "middle", fill: "#1D4ED8", "font-size": 12 }, "ser fiel"));
  // prato direito — ESPARSIDADE (roxo)
  g += el("g", { class: "vterm", "data-term": "sparse", style: `filter:${highlight === "sparse" ? "drop-shadow(0 0 7px #6B21A8)" : "none"}` },
    el("line", { x1: rx, y1: ry, x2: rx, y2: ry + 26, stroke: "#94A3B8", "stroke-width": 1.5 }) +
    el("circle", { cx: rx, cy: ry + 40, r: 26, fill: "#F3E8FC", stroke: "#6B21A8", "stroke-width": 2 }) +
    el("text", { x: rx, y: ry + 45, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "esparso") +
    el("text", { x: rx, y: ry + 82, "text-anchor": "middle", fill: "#6B21A8", "font-size": 12 }, "poucas feat."));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   10) ACTIVATION PATCHING — três colunas de camadas empilhadas
       (clean, corrupted, patched). Um nó destacado mostra a
       ativação transplantada da clean para a corrupted.
       state: "clean" | "corrupted" | "patched"
   ============================================================ */
function patchingDiagram(opts) {
  const { w = 150, h = 240, id = "pt", state = "clean", nLayers = 4,
          patchLayer = 2, label = "", output = "" } = opts;
  const cx = w / 2, top = 34, botLabel = h - 10;
  const gap = (botLabel - top - 20) / (nLayers - 1);
  let g = "";
  // fluxo vertical (residual)
  g += el("line", { x1: cx, y1: top, x2: cx, y2: top + gap * (nLayers - 1),
    stroke: "#D8D8DE", "stroke-width": 2 });
  // camadas
  for (let k = 0; k < nLayers; k++) {
    const y = top + gap * k;
    let fill = "#E9DEF5", stroke = "#9333EA";
    if (state === "corrupted") { fill = "#FDE2E2"; stroke = "#DC2626"; }
    if (state === "patched") {
      if (k >= patchLayer) { fill = "#E9DEF5"; stroke = "#9333EA"; }  // curado a partir do patch
      else { fill = "#FDE2E2"; stroke = "#DC2626"; }
      if (k === patchLayer) { fill = "#D1FAE5"; stroke = "#059669"; } // nó transplantado
    }
    g += el("circle", { cx, cy: y, r: 13, fill, stroke, "stroke-width": 2.2 });
    // seta de transplante no nó patch
    if (state === "patched" && k === patchLayer) {
      g += el("text", { x: cx + 20, y: y + 4, fill: "#059669", "font-size": 15, "font-weight": 700 }, "◀");
    }
  }
  // rótulo topo (input) e base (output)
  g += el("text", { x: cx, y: 18, "text-anchor": "middle", fill: "#3F3F46",
    "font-size": 13, "font-weight": 700 }, label);
  if (output) g += el("text", { x: cx, y: botLabel + 4, "text-anchor": "middle",
    fill: state === "corrupted" ? "#DC2626" : (state === "patched" ? "#059669" : "#6B21A8"),
    "font-size": 15, "font-weight": 700 }, output);
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id, style: "max-width:170px" }, g);
}

/* ============================================================
   11) LOGIT LENS — residual stream vertical; numa camada ℓ a
       ativação x_ℓ é "espiada": passa por LN e é projetada por W_U
       na distribuição de vocabulário. Termos: xL, LN, WU.
   ============================================================ */
function logitLens(opts) {
  const { w = 300, h = 300, id = "ll", peekLayer = 2, nLayers = 5 } = opts;
  const streamX = 70, top = 30, bot = h - 30;
  const gap = (bot - top) / (nLayers - 1);
  let g = "";
  // residual stream
  g += el("line", { x1: streamX, y1: top, x2: streamX, y2: bot, stroke: "#D8D8DE", "stroke-width": 3 });
  // camadas (nós), a espiada destacada como xL
  for (let k = 0; k < nLayers; k++) {
    const y = bot - k * gap;
    const isPeek = k === peekLayer;
    if (isPeek) {
      g += el("g", { class: "vterm", "data-term": "xL" },
        el("circle", { cx: streamX, cy: y, r: 13, fill: "#E9DEF5", stroke: "#6B21A8", "stroke-width": 3 }) +
        el("text", { x: streamX - 22, y: y + 5, "text-anchor": "end", fill: "#6B21A8", "font-size": 15, "font-weight": 700 }, "xₗ"));
    } else {
      g += el("circle", { cx: streamX, cy: y, r: 10, fill: "#EDEDF0", stroke: "#C9B8DD", "stroke-width": 1.5 });
    }
  }
  g += el("text", { x: streamX, y: bot + 18, "text-anchor": "middle", fill: "#71717A", "font-size": 12 }, "camadas");
  // seta de projeção lateral a partir da camada espiada
  const py = bot - peekLayer * gap;
  // caixa LN
  const lnX = streamX + 60;
  g += el("g", { class: "vterm", "data-term": "LN" },
    el("line", { x1: streamX + 13, y1: py, x2: lnX - 22, y2: py, stroke: "#0891B2", "stroke-width": 2.5, "marker-end": `url(#llh-${id})` }) +
    el("rect", { x: lnX - 22, y: py - 16, width: 44, height: 32, rx: 7, fill: "#E0F2FE", stroke: "#0891B2", "stroke-width": 2 }) +
    el("text", { x: lnX, y: py + 5, "text-anchor": "middle", fill: "#0891B2", "font-size": 13, "font-weight": 700 }, "LN"));
  // caixa W_U (unembedding)
  const wuX = lnX + 66;
  g += el("g", { class: "vterm", "data-term": "WU" },
    el("line", { x1: lnX + 22, y1: py, x2: wuX - 22, y2: py, stroke: "#DB2777", "stroke-width": 2.5, "marker-end": `url(#llh2-${id})` }) +
    el("rect", { x: wuX - 22, y: py - 16, width: 44, height: 32, rx: 7, fill: "#FCE7F3", stroke: "#DB2777", "stroke-width": 2 }) +
    el("text", { x: wuX, y: py + 5, "text-anchor": "middle", fill: "#DB2777", "font-size": 13, "font-weight": 700 }, "Wᵤ"));
  // distribuição de saída (barras)
  const dbX = wuX + 30;
  const bars = [0.5, 0.8, 0.35, 0.62];
  bars.forEach((b, i) => g += el("rect", { x: dbX, y: py - 24 + i * 13, width: 40 * b, height: 9, rx: 2,
    fill: i === 1 ? "#6B21A8" : "#D8D8DE" }));
  g += el("text", { x: dbX + 20, y: py + 40, "text-anchor": "middle", fill: "#71717A", "font-size": 11, "font-style": "italic" }, "previsão");
  const defs =
    el("marker", { id: `llh-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#0891B2" })) +
    el("marker", { id: `llh2-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#DB2777" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   12) INDIRECT EFFECT — régua de 0 a 1. Marca LD_corr (0),
       LD_clean (1) e a posição do LD_patched. Termos:
       corr, clean, patched.
   ============================================================ */
function indirectEffect(opts) {
  const { w = 340, h = 200, id = "ie", ie = 0.7 } = opts;
  const x0 = 50, x1 = w - 50, y = h / 2;
  let g = "";
  // trilho
  g += el("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: "#D8D8DE", "stroke-width": 4, "stroke-linecap": "round" });
  // extremidade 0 = corrompido
  g += el("g", { class: "vterm", "data-term": "corr" },
    el("circle", { cx: x0, cy: y, r: 9, fill: "#DC2626" }) +
    el("text", { x: x0, y: y - 20, "text-anchor": "middle", fill: "#DC2626", "font-size": 13, "font-weight": 700 }, "corrompido") +
    el("text", { x: x0, y: y + 30, "text-anchor": "middle", fill: "#DC2626", "font-size": 15, "font-weight": 700 }, "IE=0"));
  // extremidade 1 = limpo
  g += el("g", { class: "vterm", "data-term": "clean" },
    el("circle", { cx: x1, cy: y, r: 9, fill: "#6B21A8" }) +
    el("text", { x: x1, y: y - 20, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "limpo") +
    el("text", { x: x1, y: y + 30, "text-anchor": "middle", fill: "#6B21A8", "font-size": 15, "font-weight": 700 }, "IE=1"));
  // marcador do patched
  const px = x0 + (x1 - x0) * ie;
  g += el("g", { class: "vterm", "data-term": "patched" },
    el("line", { x1: px, y1: y - 26, x2: px, y2: y + 12, stroke: "#059669", "stroke-width": 3 }) +
    el("polygon", { points: `${px - 7},${y - 26} ${px + 7},${y - 26} ${px},${y - 16}`, fill: "#059669" }) +
    el("text", { x: px, y: y - 32, "text-anchor": "middle", fill: "#059669", "font-size": 13, "font-weight": 700 }, "patched"));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   13) EAP / gradiente — curva da perda L vs ativação de um elo.
       Mostra o ponto "clean", a diferença (corr-clean) no eixo,
       e a reta tangente (gradiente) cuja inclinação × Δ estima o
       efeito. Termos: delta (Δz), grad (∇L).
   ============================================================ */
function eapViz(opts) {
  const { w = 320, h = 260, id = "eap" } = opts;
  const ox = 46, oy = h - 40, pw = w - 80, ph = h - 80;
  let g = "";
  // eixos
  g += el("line", { x1: ox, y1: oy, x2: ox + pw, y2: oy, stroke: "#B8B8C0", "stroke-width": 1.5 });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - ph, stroke: "#B8B8C0", "stroke-width": 1.5 });
  g += el("text", { x: ox + pw / 2, y: oy + 26, "text-anchor": "middle", fill: "#71717A", "font-size": 12 }, "ativação do elo  z");
  g += el("text", { x: ox - 30, y: oy - ph / 2, "text-anchor": "middle", fill: "#71717A", "font-size": 12, transform: `rotate(-90 ${ox - 30} ${oy - ph / 2})` }, "perda  L");
  // curva da perda (parábola suave)
  const f = (t) => 0.9 - 1.6 * t + 1.1 * t * t;   // t em [0,1]
  let path = "";
  for (let i = 0; i <= 40; i++) { const t = i / 40; const x = ox + t * pw; const yv = oy - (f(t) * 0.6 + 0.1) * ph;
    path += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + yv.toFixed(1) + " "; }
  g += el("path", { d: path, fill: "none", stroke: "#C9B8DD", "stroke-width": 2.5 });
  // ponto clean (t=0.32) e corr (t=0.72)
  const tc = 0.32, tk = 0.72;
  const cleanX = ox + tc * pw, cleanY = oy - (f(tc) * 0.6 + 0.1) * ph;
  const corrX = ox + tk * pw, corrY = oy - (f(tk) * 0.6 + 0.1) * ph;
  // Δz no eixo x (termo delta)
  g += el("g", { class: "vterm", "data-term": "delta" },
    el("line", { x1: cleanX, y1: oy + 6, x2: corrX, y2: oy + 6, stroke: "#DC2626", "stroke-width": 2.5, "marker-end": `url(#eaph-${id})` }) +
    el("text", { x: (cleanX + corrX) / 2, y: oy + 20, "text-anchor": "middle", fill: "#DC2626", "font-size": 13, "font-weight": 700 }, "Δz"));
  // reta tangente no clean (termo grad)
  const slope = (-1.6 + 2.2 * tc) * 0.6 * ph / pw;   // derivada de f escalada
  const tanLen = 78;
  const dx = tanLen, dy = slope * tanLen;
  g += el("g", { class: "vterm", "data-term": "grad" },
    el("line", { x1: cleanX - dx * 0.5, y1: cleanY + dy * 0.5, x2: cleanX + dx, y2: cleanY - dy, stroke: "#059669", "stroke-width": 2.5 }) +
    el("text", { x: cleanX + dx + 4, y: cleanY - dy, fill: "#059669", "font-size": 13, "font-weight": 700 }, "∇L"));
  // pontos
  g += el("circle", { cx: cleanX, cy: cleanY, r: 6, fill: "#6B21A8" });
  g += el("text", { x: cleanX - 6, y: cleanY - 10, "text-anchor": "end", fill: "#6B21A8", "font-size": 12, "font-weight": 700 }, "limpo");
  g += el("circle", { cx: corrX, cy: corrY, r: 6, fill: "#DC2626" });
  g += el("text", { x: corrX + 8, y: corrY - 6, fill: "#DC2626", "font-size": 12, "font-weight": 700 }, "corr.");
  const defs = el("marker", { id: `eaph-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#DC2626" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   14) FEATURE CLOUD — nuvem de pontos coloridos por "conceito".
       state "tangled": pontos misturados, sem separação (superposição).
       state "clean": mesmos pontos agrupados em clusters nítidos (pós-SAE).
       A mesma semente de pontos, dois arranjos — a ponte visual.
   ============================================================ */
function featureCloud(opts) {
  const { w = 320, h = 300, id = "fc", state = "tangled", nPer = 7 } = opts;
  const cols = ["#6B21A8", "#0891B2", "#DB2777"];      // 3 "conceitos"
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
  // gerador pseudo-aleatório determinístico (mesma semente sempre)
  let s = 42; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  let g = "";
  const pts = [];
  cols.forEach((col, ci) => {
    for (let k = 0; k < nPer; k++) {
      if (state === "tangled") {
        // misturados: posição aleatória em todo o círculo
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), col });
      } else {
        // agrupados: cada conceito num setor, cluster apertado
        const base = (ci / cols.length) * Math.PI * 2 - Math.PI / 2;
        const ca = base, cR = R * 0.62;
        const clusterX = cx + cR * Math.cos(ca), clusterY = cy + cR * Math.sin(ca);
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R * 0.22;
        pts.push({ x: clusterX + r * Math.cos(a), y: clusterY + r * Math.sin(a), col });
      }
    }
  });
  // círculo-guia
  g += el("circle", { cx, cy, r: R + 12, fill: "none", stroke: "#F0F0F4", "stroke-width": 1.5 });
  // no estado clean, halos suaves atrás de cada cluster
  if (state === "clean") {
    cols.forEach((col, ci) => {
      const base = (ci / cols.length) * Math.PI * 2 - Math.PI / 2;
      const clusterX = cx + R * 0.62 * Math.cos(base), clusterY = cy + R * 0.62 * Math.sin(base);
      g += el("circle", { cx: clusterX, cy: clusterY, r: R * 0.3, fill: col, opacity: 0.08 });
    });
  }
  pts.forEach((p) => g += el("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 5.5,
    fill: p.col, opacity: 0.9 }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   15) MAP vs TERRITORY — um "território" orgânico e um "mapa"
       reticulado sobreposto que só captura parte dele. Metáfora
       da fidelidade: a explicação (mapa) nunca é o modelo (terr.).
   ============================================================ */
function mapTerritory(opts) {
  const { w = 340, h = 260, id = "mt" } = opts;
  let g = "";
  // território: mancha orgânica (o modelo real, complexo)
  g += el("path", { d: "M60,110 C50,70 100,45 140,55 C180,40 230,55 250,95 C285,110 285,165 250,185 C230,220 175,220 145,200 C100,215 55,190 60,150 Z",
    fill: "#EDE7F3", stroke: "#9333EA", "stroke-width": 2 });
  g += el("text", { x: 155, y: 240, "text-anchor": "middle", fill: "#6B21A8", "font-size": 14, "font-style": "italic", "font-weight": 700 }, "o modelo (território)");
  // mapa: grade regular que cobre só parte, desalinhada da mancha
  const gx = 95, gy = 70, cell = 26, nx = 5, ny = 4;
  for (let i = 0; i <= nx; i++)
    g += el("line", { x1: gx + i * cell, y1: gy, x2: gx + i * cell, y2: gy + ny * cell, stroke: "#DB2777", "stroke-width": 1.3, opacity: 0.75 });
  for (let j = 0; j <= ny; j++)
    g += el("line", { x1: gx, y1: gy + j * cell, x2: gx + nx * cell, y2: gy + j * cell, stroke: "#DB2777", "stroke-width": 1.3, opacity: 0.75 });
  g += el("text", { x: gx + (nx * cell) / 2, y: gy - 8, "text-anchor": "middle", fill: "#DB2777", "font-size": 13, "font-weight": 700 }, "nossa explicação (mapa)");
  // regiões do território FORA do mapa (o que escapa) — marcadas
  g += el("text", { x: 250, y: 130, fill: "#6B21A8", "font-size": 22 }, "?");
  g += el("text", { x: 72, y: 175, fill: "#6B21A8", "font-size": 22 }, "?");
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

if (typeof window !== "undefined") {
  window.VIZ = { plane2D, fanVectors, miniNet, saeDiagram, transformerStack, attribGraph, superposition, causalChain, lossBalance, patchingDiagram, logitLens, indirectEffect, eapViz, featureCloud, mapTerritory, patchingLive, jlCurve, vecAlgebra, normBall, ieRuler, taylorTangent, transformerBoard, polygonSuperposition, interferencia, polygonFeatures, featureOverflow, dirVsDim, featureCards, inductionCircuit };
}

/* ============================================================
   10b) ACTIVATION PATCHING INTERATIVO — dois fluxos lado a lado.
   ============================================================ */
function patchingLive(opts) {
  const { w = 340, h = 300, id = "ptl", patched = false, nLayers = 4, patchLayer = 2 } = opts;
  const top = 44, botLabel = h - 34;
  const gap = (botLabel - top - 20) / (nLayers - 1);
  const lx = w * 0.28, rx = w * 0.72;
  let g = "";
  g += el("text", { x: lx, y: 20, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "limpo (doador)");
  g += el("text", { x: lx, y: 36, "text-anchor": "middle", fill: "#71717A", "font-size": 12 }, "“…Paris”");
  g += el("text", { x: rx, y: 20, "text-anchor": "middle", fill: patched ? "#059669" : "#DC2626", "font-size": 13, "font-weight": 700 }, "corrompido");
  g += el("text", { x: rx, y: 36, "text-anchor": "middle", fill: "#71717A", "font-size": 12 }, "“…Roma”");
  [lx, rx].forEach((x) => g += el("line", { x1: x, y1: top, x2: x, y2: top + gap * (nLayers - 1), stroke: "#D8D8DE", "stroke-width": 2 }));
  for (let k = 0; k < nLayers; k++) {
    const y = top + gap * k; const isSrc = k === patchLayer;
    g += el("circle", { cx: lx, cy: y, r: 12, fill: isSrc ? "#D1FAE5" : "#E9DEF5",
      stroke: isSrc ? "#059669" : "#9333EA", "stroke-width": isSrc ? 2.6 : 2 });
  }
  for (let k = 0; k < nLayers; k++) {
    const y = top + gap * k;
    let fill = "#FDE2E2", stroke = "#DC2626";
    if (patched) {
      if (k === patchLayer) { fill = "#D1FAE5"; stroke = "#059669"; }
      else if (k > patchLayer) { fill = "#E9DEF5"; stroke = "#9333EA"; }
    }
    g += el("circle", { cx: rx, cy: y, r: 12, fill, stroke, "stroke-width": 2.2 });
  }
  const py = top + gap * patchLayer;
  if (patched) {
    g += el("line", { x1: lx + 13, y1: py, x2: rx - 13, y2: py, stroke: "#059669",
      "stroke-width": 3, "marker-end": `url(#ptlh-${id})`, "stroke-dasharray": "5 3" });
    g += el("text", { x: (lx + rx) / 2, y: py - 8, "text-anchor": "middle", fill: "#059669",
      "font-size": 12, "font-weight": 700 }, "transplante");
  } else {
    g += el("text", { x: (lx + rx) / 2, y: py + 5, "text-anchor": "middle", fill: "#B8B8C0", "font-size": 20 }, "→");
  }
  g += el("rect", { x: rx - 44, y: botLabel + 6, width: 88, height: 26, rx: 8,
    fill: patched ? "#D1FAE5" : "#FDE2E2", stroke: patched ? "#059669" : "#DC2626", "stroke-width": 2 });
  g += el("text", { x: rx, y: botLabel + 24, "text-anchor": "middle",
    fill: patched ? "#059669" : "#DC2626", "font-size": 15, "font-weight": 700 }, patched ? "Paris ✓" : "Roma ✗");
  const defs = el("marker", { id: `ptlh-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3,
    orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#059669" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   16) JOHNSON–LINDENSTRAUSS — curva N = e^(d·eps²/4) desenhada,
       com o ponto atual (d, N) destacado. Interativo via sliders
       de d e eps. Mostra o "explode exponencialmente".
   ============================================================ */
function jlCurve(opts) {
  const { w = 440, h = 300, id = "jl", d = 512, eps = 0.1 } = opts;
  const ox = 58, oy = h - 42, pw = w - 90, ph = h - 76;
  const dMax = 2000;
  // N = exp(d*eps^2/4); trabalhamos em log10 para o eixo y
  const log10N = (dd) => (dd * eps * eps / 4) / Math.LN10;
  const yMaxLog = Math.max(log10N(dMax), 6);   // teto do eixo (log10)
  let g = "";
  // eixos
  g += el("line", { x1: ox, y1: oy, x2: ox + pw, y2: oy, stroke: "#B8B8C0", "stroke-width": 1.5 });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - ph, stroke: "#B8B8C0", "stroke-width": 1.5 });
  g += el("text", { x: ox + pw / 2, y: oy + 30, "text-anchor": "middle", fill: "#71717A", "font-size": 13 }, "dimensão  d");
  g += el("text", { x: ox - 40, y: oy - ph / 2, "text-anchor": "middle", fill: "#71717A", "font-size": 13, transform: `rotate(-90 ${ox - 40} ${oy - ph / 2})` }, "nº de features (log)");
  // marcas do eixo y (potências de 10)
  for (let p = 0; p <= yMaxLog; p += Math.ceil(yMaxLog / 5)) {
    const yy = oy - (p / yMaxLog) * ph;
    g += el("line", { x1: ox - 4, y1: yy, x2: ox, y2: yy, stroke: "#B8B8C0", "stroke-width": 1 });
    g += el("text", { x: ox - 8, y: yy + 4, "text-anchor": "end", fill: "#A1A1AA", "font-size": 10 }, `10^${p}`);
  }
  // linha "d direções triviais" (referência linear) — log10(d)
  const yTrivial = oy - (Math.log10(Math.max(d, 1)) / yMaxLog) * ph;
  g += el("line", { x1: ox, y1: yTrivial, x2: ox + pw, y2: yTrivial, stroke: "#DC2626", "stroke-width": 1.2, "stroke-dasharray": "4 3", opacity: 0.6 });
  g += el("text", { x: ox + pw - 4, y: yTrivial - 5, "text-anchor": "end", fill: "#DC2626", "font-size": 11 }, "d ortogonais (trivial)");
  // curva exponencial
  let path = "";
  for (let i = 0; i <= 60; i++) {
    const dd = (i / 60) * dMax;
    const x = ox + (dd / dMax) * pw;
    const yv = oy - Math.min(log10N(dd) / yMaxLog, 1) * ph;
    path += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + yv.toFixed(1) + " ";
  }
  g += el("path", { d: path, fill: "none", stroke: "#3B4C7A", "stroke-width": 3, class: "vterm", "data-term": "curve" });
  // ponto atual (d, N)
  const px = ox + (Math.min(d, dMax) / dMax) * pw;
  const py = oy - Math.min(log10N(d) / yMaxLog, 1) * ph;
  g += el("line", { x1: px, y1: oy, x2: px, y2: py, stroke: "#3B4C7A", "stroke-width": 1, "stroke-dasharray": "3 2", opacity: 0.5 });
  g += el("circle", { cx: px, cy: py, r: 7, fill: "#3B4C7A", stroke: "#fff", "stroke-width": 2 });
  // valor de N em notação legível
  const Nlog = log10N(d);
  const Nlabel = Nlog > 6 ? `≈ 10^${Math.round(Nlog)}` : "≈ " + Math.round(Math.pow(10, Nlog)).toLocaleString();
  g += el("text", { x: Math.min(px + 10, ox + pw - 70), y: Math.max(py - 12, oy - ph + 12), fill: "#1E2A44", "font-size": 15, "font-weight": 700 }, `N ${Nlabel}` );
  g += el("text", { x: px, y: oy + 16, "text-anchor": "middle", fill: "#3B4C7A", "font-size": 12, "font-weight": 700 }, `d=${d}`);
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   17) VECTOR ALGEBRA — CADEIA INTUITIVA rei − homem + mulher = rainha.
       Uma JORNADA ponta-a-ponta: parte de "rei", subtrai a direção
       "homem", soma a direção "mulher", e cai em "rainha".
       (A frase-ponte no slide costura a coerência direção-vs-ponto:
        cada palavra é uma posição; os deslocamentos são as features.)
       step 1: ponto de partida "rei"
       step 2: − homem  (anda na direção oposta a homem)
       step 3: + mulher (anda na direção de mulher) → chega em rainha
   ============================================================ */
function vecAlgebra(opts) {
  const { w = 440, h = 360, id = "va", step = 3 } = opts;
  const pad = 46, ox = pad, oy = h - pad;
  const S = Math.min(w - pad * 2.2, h - pad * 2.2);
  // posições dos conceitos no espaço (pontos). A cadeia liga rei → p1 → rainha.
  const rei    = [0.62, 0.16];
  const homemD = [0.34, 0.10];            // direção "homem" (o que subtraímos)
  const mulherD= [0.04, 0.66];            // direção "mulher" (o que somamos)
  const p1     = [rei[0] - homemD[0], rei[1] - homemD[1]];      // rei − homem
  const rainha = [p1[0] + mulherD[0], p1[1] + mulherD[1]];      // + mulher
  const X = (v) => ox + v[0] * S;
  const Y = (v) => oy - v[1] * S;
  let g = "";
  // eixos leves (só o "espaço de ativação")
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: ox + S + 24, y2: oy, "marker-end": `url(#vaax-${id})` });
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: ox, y2: oy - S - 24, "marker-end": `url(#vaax-${id})` });
  g += el("text", { x: ox + S + 20, y: oy + 18, "text-anchor": "end", fill: "#A1A1AA", "font-size": 12, "font-style": "italic" }, "espaço de ativação");

  const pt = (v, col, txt, dx, dy, anchor) =>
    el("circle", { cx: X(v), cy: Y(v), r: 6, fill: col }) +
    el("text", { x: X(v) + (dx ?? 12), y: Y(v) + (dy ?? 5), fill: col, "font-size": 17, "font-weight": 700, "font-family": "'Playfair Display',serif", "text-anchor": anchor || "start" }, txt);
  // seta de deslocamento (a "feature" aplicada), desenhada de a→b
  const move = (a, b, col, txt, dx, dy) =>
    el("line", { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), stroke: col, "stroke-width": 4, "marker-end": `url(#vahb-${id}-${col.replace('#','')})`, "stroke-linecap": "round" }) +
    el("text", { x: (X(a)+X(b))/2 + (dx||0), y: (Y(a)+Y(b))/2 + (dy||-12), "text-anchor": "middle", fill: col, "font-size": 14, "font-weight": 700, "font-style": "italic" }, txt);

  // passo 1 — ponto de partida
  if (step >= 1) {
    g += pt(rei, "#6B21A8", "rei", 12, -4);
  }
  // passo 2 — subtrai a direção "homem"
  if (step >= 2) {
    g += move(rei, p1, "#DC2626", "− homem", 0, -12);
    g += el("circle", { cx: X(p1), cy: Y(p1), r: 4, fill: "#DC2626" });
  }
  // passo 3 — soma a direção "mulher" → chega em rainha
  if (step >= 3) {
    g += move(p1, rainha, "#0891B2", "+ mulher", -30, 4);
    // alvo real "rainha" com halo, coincidindo com o fim da cadeia
    g += el("circle", { cx: X(rainha), cy: Y(rainha), r: 13, fill: "none", stroke: "#059669", "stroke-width": 3, opacity: 0.6 });
    g += pt(rainha, "#059669", "rainha ✓", 14, 4);
  }
  const mk = (c) => el("marker", { id: `vahb-${id}-${c.replace('#','')}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: c }));
  const defs =
    mk("#DC2626") + mk("#0891B2") +
    el("marker", { id: `vaax-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#B8B8C0" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   18) L1 vs L2 GEOMETRY — curvas de nível da perda (elipses) +
       a "bola" de restrição (losango L1 / círculo L2). Mostra
       por que a solução L1 toca numa QUINA (coeficiente=0).
       mode: "l1" ou "l2".
   ============================================================ */
function normBall(opts) {
  const { w = 300, h = 300, id = "nb", mode = "l1" } = opts;
  const ox = w / 2, oy = h / 2, R = 70;
  // centro da perda (solução sem regularização), deslocado
  const cx = ox + 62, cy = oy - 46;
  let g = "";
  // eixos
  g += el("line", { x1: 24, y1: oy, x2: w - 24, y2: oy, stroke: "#B8B8C0", "stroke-width": 1.5, "marker-end": `url(#nbx-${id})` });
  g += el("line", { x1: ox, y1: h - 24, x2: ox, y2: 24, stroke: "#B8B8C0", "stroke-width": 1.5, "marker-end": `url(#nby-${id})` });
  g += el("text", { x: w - 20, y: oy + 16, fill: "#71717A", "font-size": 12 }, "β₁");
  g += el("text", { x: ox + 8, y: 30, fill: "#71717A", "font-size": 12 }, "β₂");
  // curvas de nível da perda (elipses concêntricas em torno de cx,cy)
  [1, 1.7, 2.5].forEach((k, i) => {
    g += el("ellipse", { cx, cy, rx: 30 * k, ry: 22 * k, fill: "none", stroke: "#C9B8DD", "stroke-width": 1.5, opacity: 0.8 - i * 0.15 });
  });
  g += el("circle", { cx, cy, r: 3, fill: "#6B21A8" });
  g += el("text", { x: cx + 8, y: cy - 6, fill: "#6B21A8", "font-size": 11 }, "mín. da perda");
  // bola de restrição
  if (mode === "l1") {
    // losango |β1|+|β2| = R
    g += el("polygon", { points: `${ox + R},${oy} ${ox},${oy - R} ${ox - R},${oy} ${ox},${oy + R}`,
      fill: "#3B4C7A", "fill-opacity": 0.12, stroke: "#3B4C7A", "stroke-width": 2.5 });
    // solução: toca a quina de cima (β1=0) — ponto no eixo β2
    const sx = ox, sy = oy - R;
    g += el("circle", { cx: sx, cy: sy, r: 7, fill: "#059669", stroke: "#fff", "stroke-width": 2 });
    g += el("text", { x: sx + 12, y: sy + 2, fill: "#059669", "font-size": 13, "font-weight": 700 }, "β₁ = 0 ✓");
    g += el("text", { x: ox, y: h - 8, "text-anchor": "middle", fill: "#3B4C7A", "font-size": 13, "font-weight": 700 }, "L1: quinas nos eixos → zera");
  } else {
    // círculo β1²+β2² = R²
    g += el("circle", { cx: ox, cy: oy, r: R, fill: "#3B4C7A", "fill-opacity": 0.12, stroke: "#3B4C7A", "stroke-width": 2.5 });
    // solução: toca a elipse num ponto genérico (nenhum coef exatamente 0)
    const ang = Math.atan2(cy - oy, cx - ox);
    const sx = ox + R * Math.cos(ang), sy = oy + R * Math.sin(ang);
    g += el("circle", { cx: sx, cy: sy, r: 7, fill: "#DC2626", stroke: "#fff", "stroke-width": 2 });
    g += el("text", { x: sx + 10, y: sy - 6, fill: "#DC2626", "font-size": 12, "font-weight": 700 }, "β₁,β₂ ≠ 0");
    g += el("text", { x: ox, y: h - 8, "text-anchor": "middle", fill: "#3B4C7A", "font-size": 13, "font-weight": 700 }, "L2: círculo liso → encolhe");
  }
  const defs =
    el("marker", { id: `nbx-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#B8B8C0" })) +
    el("marker", { id: `nby-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#B8B8C0" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   19) IE RULER — reta numérica com LD_corr (0), LD_clean (1) e o
       ponto LD_patched; a fração recuperada aparece como um
       segmento preenchido. Interativo: slider de LD_patched.
   ============================================================ */
function ieRuler(opts) {
  const { w = 440, h = 170, id = "ier", ldCorr = -3.1, ldClean = 6.2, ldPatched = 4.0 } = opts;
  const x0 = 60, x1 = w - 60, y = 80;
  const t = (ldPatched - ldCorr) / (ldClean - ldCorr);   // fração recuperada = IE
  const px = x0 + Math.max(0, Math.min(1, t)) * (x1 - x0);
  let g = "";
  // trilho base
  g += el("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: "#D8D8DE", "stroke-width": 6, "stroke-linecap": "round" });
  // segmento recuperado (de corr até patched)
  g += el("line", { x1: x0, y1: y, x2: px, y2: y, stroke: "#059669", "stroke-width": 6, "stroke-linecap": "round" });
  // extremos
  g += el("circle", { cx: x0, cy: y, r: 8, fill: "#DC2626" });
  g += el("text", { x: x0, y: y + 26, "text-anchor": "middle", fill: "#DC2626", "font-size": 12, "font-weight": 700 }, "corrompido");
  g += el("text", { x: x0, y: y + 40, "text-anchor": "middle", fill: "#71717A", "font-size": 11 }, `LD=${ldCorr}`);
  g += el("text", { x: x0, y: y - 16, "text-anchor": "middle", fill: "#DC2626", "font-size": 13, "font-weight": 700 }, "0");
  g += el("circle", { cx: x1, cy: y, r: 8, fill: "#6B21A8" });
  g += el("text", { x: x1, y: y + 26, "text-anchor": "middle", fill: "#6B21A8", "font-size": 12, "font-weight": 700 }, "limpo" );
  g += el("text", { x: x1, y: y + 40, "text-anchor": "middle", fill: "#71717A", "font-size": 11 }, `LD=${ldClean}`);
  g += el("text", { x: x1, y: y - 16, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "1");
  // marcador patched
  g += el("line", { x1: px, y1: y - 30, x2: px, y2: y + 10, stroke: "#059669", "stroke-width": 3 });
  g += el("polygon", { points: `${px - 7},${y - 30} ${px + 7},${y - 30} ${px},${y - 20}`, fill: "#059669" });
  g += el("text", { x: px, y: y - 36, "text-anchor": "middle", fill: "#059669", "font-size": 13, "font-weight": 700 }, `patched (LD=${ldPatched})`);
  // valor de IE
  g += el("text", { x: w / 2, y: h - 8, "text-anchor": "middle", fill: "#1E2A44", "font-size": 16, "font-weight": 700 }, `IE = ${t.toFixed(2)}  (recuperou ${Math.round(t * 100)}%)`);
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   20) TAYLOR TANGENT — curva da perda L(a) e a reta tangente no
       ponto limpo. Um deslocamento Δ mostra a aproximação linear
       (tangente) vs o valor real (curva): acerta perto, erra longe.
       Interativo: slider de Δ.
   ============================================================ */
function taylorTangent(opts) {
  const { w = 440, h = 300, id = "tt", delta = 0.4 } = opts;
  const ox = 50, oy = h - 44, pw = w - 80, ph = h - 80;
  // curva L(a): função convexa suave; ponto limpo em a0
  const f = (a) => 0.35 + 1.15 * (a - 0.3) * (a - 0.3);   // parábola, mín em 0.3
  const df = (a) => 2 * 1.15 * (a - 0.3);
  const a0 = 0.3;                       // ponto limpo (no mínimo, gradiente pequeno? não: escolher fora)
  const aClean = 0.72;                  // ponto limpo real (com gradiente != 0)
  const X = (a) => ox + a * pw;
  const Y = (v) => oy - (v * 0.62) * ph;
  let g = "";
  // eixos
  g += el("line", { x1: ox, y1: oy, x2: ox + pw, y2: oy, stroke: "#B8B8C0", "stroke-width": 1.5 });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - ph, stroke: "#B8B8C0", "stroke-width": 1.5 });
  g += el("text", { x: ox + pw / 2, y: oy + 28, "text-anchor": "middle", fill: "#71717A", "font-size": 12 }, "ativação do elo  a");
  g += el("text", { x: ox - 32, y: oy - ph / 2, "text-anchor": "middle", fill: "#71717A", "font-size": 12, transform: `rotate(-90 ${ox - 32} ${oy - ph / 2})` }, "métrica  L");
  // curva real
  let path = "";
  for (let i = 0; i <= 50; i++) { const a = (i / 50); const x = X(a), yv = Y(f(a));
    path += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + yv.toFixed(1) + " "; }
  g += el("path", { d: path, fill: "none", stroke: "#C9B8DD", "stroke-width": 2.5, class: "vterm", "data-term": "real" });
  // reta tangente no ponto limpo
  const slope = df(aClean);
  const tanX0 = 0.05, tanX1 = 0.98;
  const tanY0 = f(aClean) + slope * (tanX0 - aClean);
  const tanY1 = f(aClean) + slope * (tanX1 - aClean);
  g += el("line", { x1: X(tanX0), y1: Y(tanY0), x2: X(tanX1), y2: Y(tanY1), stroke: "#059669", "stroke-width": 2, "stroke-dasharray": "5 3", class: "vterm", "data-term": "tangent" });
  // ponto limpo
  g += el("circle", { cx: X(aClean), cy: Y(f(aClean)), r: 6, fill: "#6B21A8" });
  g += el("text", { x: X(aClean), y: Y(f(aClean)) + 22, "text-anchor": "middle", fill: "#6B21A8", "font-size": 12, "font-weight": 700 }, "limpo");
  // ponto deslocado a_clean + delta
  const aD = Math.max(0.02, Math.min(0.98, aClean + delta));
  const realV = f(aD);
  const approxV = f(aClean) + slope * (aD - aClean);
  // linhas verticais mostrando real vs aproximado
  g += el("circle", { cx: X(aD), cy: Y(realV), r: 6, fill: "#DC2626" });
  g += el("circle", { cx: X(aD), cy: Y(approxV), r: 6, fill: "#059669", "fill-opacity": 0.6 });
  // gap entre eles (erro da aproximação)
  g += el("line", { x1: X(aD), y1: Y(realV), x2: X(aD), y2: Y(approxV), stroke: "#DC2626", "stroke-width": 2, "stroke-dasharray": "2 2" });
  const err = Math.abs(realV - approxV);
  g += el("text", { x: X(aD) + 10, y: (Y(realV) + Y(approxV)) / 2, fill: "#DC2626", "font-size": 12, "font-weight": 700 }, `erro ${err.toFixed(2)}`);
  // Δ no eixo x
  g += el("line", { x1: X(aClean), y1: oy + 4, x2: X(aD), y2: oy + 4, stroke: "#3B4C7A", "stroke-width": 2, "marker-end": `url(#tth-${id})` });
  g += el("text", { x: (X(aClean) + X(aD)) / 2, y: oy + 18, "text-anchor": "middle", fill: "#3B4C7A", "font-size": 12, "font-weight": 700 }, "Δ");
  // legenda
  g += el("text", { x: ox + pw - 4, y: oy - ph + 6, "text-anchor": "end", fill: "#059669", "font-size": 11, "font-weight": 700 }, "— tangente (Taylor 1ª ordem)");
  g += el("text", { x: ox + pw - 4, y: oy - ph + 22, "text-anchor": "end", fill: "#9333EA", "font-size": 11, "font-weight": 700 }, "— L real");
  const defs = el("marker", { id: `tth-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#3B4C7A" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   25) INTERFERÊNCIA (cos θ) — recria o slide de referência:
       dois vetores dᵢ (fixo, horizontal) e dⱼ (móvel), ângulo θ
       ajustável, e o "vazamento" = |cos θ| como produto interno.
       Retorna { svg, deg, cos, leak } para alimentar o slider.
       cos 90° = 0 (ideal, ortogonal) · cos 0° = 1 (colisão total).
   ============================================================ */
function interferencia(opts) {
  const { w = 440, h = 340, id = "if", deg = 35 } = opts;
  const ox = w * 0.14, oy = h * 0.78, L = Math.min(w * 0.62, h * 0.62);
  const rad = deg * Math.PI / 180;
  const cos = Math.cos(rad);
  const leak = Math.abs(cos);
  // zona de saúde por interferência (|cos θ|): baixa=verde, média=laranja, alta=vermelho
  let zoneColor, zoneLabel;
  if (leak < 0.30)      { zoneColor = "#059669"; zoneLabel = "saudável"; }
  else if (leak < 0.65) { zoneColor = "#D97706"; zoneLabel = "tolerável"; }
  else                  { zoneColor = "#DC2626"; zoneLabel = "interferência alta"; }
  let g = "";
  // eixo leve
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: ox, y2: oy - L - 24, stroke: "#E4E4EE", "stroke-width": 2, "marker-end": `url(#ifax-${id})`, opacity: 0.5 });
  // dᵢ fixo horizontal (roxo, referência)
  g += el("line", { x1: ox, y1: oy, x2: ox + L, y2: oy, stroke: "#6B21A8", "stroke-width": 5, "marker-end": `url(#ifi-${id})` });
  g += el("text", { x: ox + L + 10, y: oy + 6, fill: "#6B21A8", "font-size": 19, "font-weight": 700 }, "dᵢ");
  // dⱼ móvel — COR reflete a zona de interferência
  const ex = ox + L * Math.cos(rad), ey = oy - L * Math.sin(rad);
  g += el("line", { x1: ox, y1: oy, x2: ex, y2: ey, stroke: zoneColor, "stroke-width": 5, "marker-end": `url(#ifj-${id})` });
  g += el("text", { x: ex + 8, y: ey - 6, fill: zoneColor, "font-size": 19, "font-weight": 700 }, "dⱼ");
  // arco do ângulo θ — também na cor da zona
  const r = 46, large = deg > 180 ? 1 : 0;
  g += el("path", { d: `M ${ox + r} ${oy} A ${r} ${r} 0 ${large} 0 ${ox + r * Math.cos(rad)} ${oy - r * Math.sin(rad)}`,
    fill: "none", stroke: zoneColor, "stroke-width": 2.5 });
  g += el("text", { x: ox + (r + 16) * Math.cos(rad / 2), y: oy - (r + 16) * Math.sin(rad / 2) + 6,
    fill: zoneColor, "font-size": 17, "font-weight": 700 }, "θ");
  // projeção (o "vazamento" de dⱼ sobre dᵢ) — barra grossa na cor da zona + tracejado
  const px = ox + L * cos;
  g += el("line", { x1: ex, y1: ey, x2: px, y2: oy, stroke: zoneColor, "stroke-width": 1.5, "stroke-dasharray": "3 3", opacity: 0.55 });
  g += el("line", { x1: ox, y1: oy, x2: px, y2: oy, stroke: zoneColor, "stroke-width": 7, opacity: 0.85, "stroke-linecap": "round" });
  g += el("text", { x: (ox + px) / 2, y: oy + 22, "text-anchor": "middle", fill: zoneColor, "font-size": 12, "font-weight": 700, "font-style": "italic" }, "vazamento");
  // selo da zona (canto sup. dir. da viz)
  g += el("rect", { x: w - 150, y: 12, width: 138, height: 26, rx: 13, fill: zoneColor, opacity: 0.12 });
  g += el("circle", { cx: w - 134, cy: 25, r: 5, fill: zoneColor });
  g += el("text", { x: w - 122, y: 30, fill: zoneColor, "font-size": 13, "font-weight": 700 }, zoneLabel);
  const defs =
    el("marker", { id: `ifi-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" })) +
    el("marker", { id: `ifj-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: zoneColor })) +
    el("marker", { id: `ifax-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#C9C9D4" }));
  return { svg: el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g),
           deg, cos: cos.toFixed(2), leak, zoneColor, zoneLabel };
}

/* ============================================================
   26) FEATURE OVERFLOW — o descompasso de contagem.
       MUITAS features nomeadas (esquerda) tentam entrar em POUCOS
       slots de dimensão (direita). Os primeiros d encaixam; o
       excedente transborda (vermelho) — "não cabem ortogonais".
       Reforça o problema antes de apresentar a superposição.
   ============================================================ */
function featureOverflow(opts) {
  const { w = 420, h = 380, id = "fo", nSlots = 4 } = opts;
  const feats = ["gato", "Paris", "plural", "ironia", "verbo",
                 "azul", "medo", "rima", "código", "cidade"];
  let g = "";
  // ---- coluna esquerda: pilha de features (muitas) ----
  const colX = w * 0.06, chipW = w * 0.34, chipH = 26, gap = 6;
  const topY = 30;
  g += el("text", { x: colX, y: topY - 10, fill: "#6B21A8", "font-size": 13, "font-weight": 700,
    "letter-spacing": "0.06em" }, `${feats.length}+ FEATURES`);
  feats.forEach((f, i) => {
    const y = topY + i * (chipH + gap);
    g += el("rect", { x: colX, y, width: chipW, height: chipH, rx: 7,
      fill: "#F3E8FC", stroke: "#C9B8DD", "stroke-width": 1 });
    g += el("text", { x: colX + chipW / 2, y: y + 17, "text-anchor": "middle",
      fill: "#6B21A8", "font-size": 13, "font-weight": 600 }, f);
  });
  // ---- coluna direita: poucos slots de dimensão ----
  const slotX = w * 0.62, slotW = w * 0.32, slotH = 40, sgap = 10;
  const slotsTop = 44;
  g += el("text", { x: slotX, y: slotsTop - 14, fill: "#0891B2", "font-size": 13, "font-weight": 700,
    "letter-spacing": "0.06em" }, `${nSlots} DIMENSÕES`);
  const slotY = (k) => slotsTop + k * (slotH + sgap);
  for (let k = 0; k < nSlots; k++) {
    g += el("rect", { x: slotX, y: slotY(k), width: slotW, height: slotH, rx: 9,
      fill: "#E3F5FA", stroke: "#0891B2", "stroke-width": 1.5 });
    g += el("text", { x: slotX + slotW / 2, y: slotY(k) + 25, "text-anchor": "middle",
      fill: "#0891B2", "font-size": 13, "font-weight": 700, "font-style": "italic" }, `dim ${k + 1}`);
  }
  // ---- setas: as primeiras nSlots encaixam (verde/ok), o resto transborda (vermelho) ----
  const chipMidY = (i) => topY + i * (chipH + gap) + chipH / 2;
  const slotMidY = (k) => slotY(k) + slotH / 2;
  feats.forEach((f, i) => {
    const fits = i < nSlots;
    const x1 = colX + chipW + 4, y1 = chipMidY(i);
    if (fits) {
      const x2 = slotX - 4, y2 = slotMidY(i);
      g += el("line", { x1, y1, x2, y2, stroke: "#059669", "stroke-width": 2, opacity: 0.7,
        "marker-end": `url(#fook-${id})` });
    } else {
      // transborda: seta curta que "bate" numa parede e vira vermelha
      const x2 = slotX - 30, y2 = y1;
      g += el("line", { x1, y1, x2, y2, stroke: "#DC2626", "stroke-width": 2, opacity: 0.8,
        "stroke-dasharray": "4 3", "marker-end": `url(#fobad-${id})` });
    }
  });
  // parede de "não cabe" + selo
  const wallX = slotX - 26;
  g += el("line", { x1: wallX, y1: slotsTop + nSlots * (slotH + sgap) - sgap + 6, x2: wallX, y2: chipMidY(nSlots) - 8,
    stroke: "#DC2626", "stroke-width": 2, "stroke-dasharray": "3 3", opacity: 0.5 });
  const overflow = feats.length - nSlots;
  g += el("rect", { x: slotX - 6, y: h - 46, width: slotW + 12, height: 30, rx: 15, fill: "#FEE2E2" });
  g += el("text", { x: slotX + slotW / 2, y: h - 26, "text-anchor": "middle", fill: "#DC2626",
    "font-size": 13, "font-weight": 700 }, `${overflow} sem espaço!`);
  const defs =
    el("marker", { id: `fook-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#059669" })) +
    el("marker", { id: `fobad-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#DC2626" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}


/* ============================================================
   27) DIREÇÃO × DIMENSÃO — desfaz a confusão do slide 05.
       Os EIXOS são as dimensões (neurônios) do espaço de ativação.
       Uma FEATURE é uma direção ARBITRÁRIA — combinação dos eixos.
   ============================================================ */
function dirVsDim(opts) {
  const { w = 420, h = 360, id = "dd" } = opts;
  const pad = 54, ox = pad, oy = h - pad;
  const S = Math.min(w - pad * 1.8, h - pad * 1.8);
  let g = "";
  g += el("line", { x1: ox, y1: oy, x2: ox + S + 22, y2: oy, stroke: "#0891B2", "stroke-width": 3, "marker-end": `url(#ddax-${id})` });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - S - 22, stroke: "#0891B2", "stroke-width": 3, "marker-end": `url(#ddax-${id})` });
  g += el("text", { x: ox + S + 8, y: oy + 24, "text-anchor": "end", fill: "#0891B2", "font-size": 14, "font-weight": 700 }, "dim 1 = neurônio");
  g += el("text", { x: ox - 10, y: oy - S - 8, fill: "#0891B2", "font-size": 14, "font-weight": 700 }, "dim 2");
  const fx = 0.82, fy = 0.66;
  const ex = ox + fx * S, ey = oy - fy * S;
  g += el("line", { x1: ex, y1: ey, x2: ex, y2: oy, stroke: "#9333EA", "stroke-width": 1.5, "stroke-dasharray": "4 3", opacity: 0.55 });
  g += el("line", { x1: ex, y1: ey, x2: ox, y2: ey, stroke: "#9333EA", "stroke-width": 1.5, "stroke-dasharray": "4 3", opacity: 0.55 });
  g += el("line", { x1: ox, y1: oy, x2: ex, y2: ey, stroke: "#6B21A8", "stroke-width": 5, "marker-end": `url(#ddf-${id})` });
  g += el("text", { x: ex + 8, y: ey - 6, fill: "#6B21A8", "font-size": 17, "font-weight": 700, "font-family": "'Playfair Display',serif" }, "\u201Crealeza\u201D");
  g += el("text", { x: ex + 8, y: ey + 13, fill: "#6B21A8", "font-size": 12, "font-style": "italic", "opacity": 0.8 }, "(uma direção)");
  g += el("text", { x: ox + S * 0.5, y: oy - S - 2, "text-anchor": "middle", fill: "#71717A", "font-size": 12, "font-style": "italic" }, "uma feature combina várias dimensões");
  const defs =
    el("marker", { id: `ddax-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#0891B2" })) +
    el("marker", { id: `ddf-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   28) FEATURE CARDS — features de SAE reais, nomeadas e legíveis.
       Cada cartão: nome da feature + mini-barra de "ativação".
       Transmite "features que a gente LÊ" (slide 14).
   ============================================================ */
function featureCards(opts) {
  const { w = 400, h = 380, id = "fk" } = opts;
  const cards = [
    { name: "Ponte Golden Gate", act: 0.94, col: "#DB2777" },
    { name: "código em Python", act: 0.81, col: "#0891B2" },
    { name: "sequências de DNA", act: 0.72, col: "#059669" },
    { name: "tom sarcástico", act: 0.63, col: "#6B21A8" },
    { name: "nomes de cidades", act: 0.55, col: "#D97706" },
  ];
  const pad = 8, topH = 22, cw = w - pad * 2, ch = 54, gap = 11;
  let g = "";
  // cabeçalho explicativo
  g += el("text", { x: pad + 2, y: 14, fill: "#71717A", "font-size": 12, "font-weight": 700, "letter-spacing": "0.04em" }, "FEATURE");
  g += el("text", { x: w - pad - 2, y: 14, "text-anchor": "end", fill: "#71717A", "font-size": 12, "font-weight": 700, "letter-spacing": "0.04em" }, "O QUANTO DISPARA");
  cards.forEach((c, i) => {
    const y = topH + pad + i * (ch + gap);
    g += el("rect", { x: pad, y, width: cw, height: ch, rx: 12, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.5 });
    // ponto colorido + nome
    g += el("circle", { cx: pad + 20, cy: y + 21, r: 7, fill: c.col });
    g += el("text", { x: pad + 36, y: y + 26, fill: "#1A1A2E", "font-size": 16, "font-weight": 700 }, c.name);
    // mini-barra de ativação
    const barX = pad + 36, barY = y + 38, barW = cw - 52;
    g += el("rect", { x: barX, y: barY, width: barW, height: 8, rx: 4, fill: "#EDEDF2" });
    g += el("rect", { x: barX, y: barY, width: barW * c.act, height: 8, rx: 4, fill: c.col });
    g += el("text", { x: pad + cw - 8, y: y + 26, "text-anchor": "end", fill: c.col, "font-size": 13, "font-weight": 700 }, `${Math.round(c.act * 100)}%`);
  });
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   29) CIRCUITO DE INDUÇÃO — o circuito canônico de NLP.
       Fita de tokens "... Harry Potter ... Harry [?]". Duas cabeças:
       (1) previous-token head liga cada token ao anterior;
       (2) induction head volta da 2ª ocorrência de "Harry" para a 1ª
       e copia o token seguinte → prevê "Potter".
       stage: 1 = só tokens; 2 = + previous-token; 3 = + induction + previsão
   ============================================================ */
function inductionCircuit(opts) {
  const { w = 460, h = 360, id = "ind", stage = 3, ablated = false } = opts;
  const toks = ["Harry", "Potter", "leu", "o", "livro", ".", "Harry", "?"];
  const n = toks.length;
  const pad = 18, rpad = 30, bw = (w - pad - rpad) / n, by = h * 0.60, bh = 40;
  const cx = (i) => pad + bw * i + bw / 2;
  let g = "";
  // fita de tokens
  toks.forEach((t, i) => {
    const isQ = t === "?";
    const isKey = (i === 0 || i === 6); // os dois "Harry"
    const x = pad + bw * i + 3;
    g += el("rect", { x, y: by, width: bw - 6, height: bh, rx: 8,
      fill: isQ ? "#FFF7ED" : (isKey && stage >= 2 ? "#F3E8FC" : "#F7F7FA"),
      stroke: isQ ? "#D97706" : (isKey && stage >= 2 ? "#6B21A8" : "#E4E4EE"), "stroke-width": isKey && stage >= 2 ? 2 : 1.2 });
    g += el("text", { x: cx(i), y: by + 25, "text-anchor": "middle",
      fill: isQ ? "#D97706" : "#1A1A2E", "font-size": 15, "font-weight": isKey ? 700 : 500,
      "font-family": "'Inter',sans-serif" }, t);
    // índice
    g += el("text", { x: cx(i), y: by + bh + 16, "text-anchor": "middle", fill: "#B8B8C0", "font-size": 11 }, `t${i}`);
  });

  // (1) previous-token head: arquinhos curtos ligando i → i-1 (acima da fita)
  if (stage >= 2) {
    for (let i = 1; i < n - 1; i++) {
      const x2 = cx(i), x1 = cx(i - 1), yTop = by - 14;
      g += el("path", { d: `M ${x1} ${by - 2} C ${x1} ${yTop - 18}, ${x2} ${yTop - 18}, ${x2} ${by - 2}`,
        fill: "none", stroke: "#0891B2", "stroke-width": 1.5, opacity: 0.5 });
    }
    g += el("text", { x: pad, y: by - 34, fill: "#0891B2", "font-size": 12, "font-weight": 700 }, "① previous-token head: “de onde eu vim?”");
  }

  // (2) induction head: arco grande do 2º "Harry" (i=6) de volta ao 1º (i=0)
  if (stage >= 3) {
    const xA = cx(6), xB = cx(0), yArc = by - 70;
    const headCol = ablated ? "#C9C9D4" : "#6B21A8";
    g += el("path", { d: `M ${xA} ${by - 4} C ${xA} ${yArc}, ${xB} ${yArc}, ${xB} ${by - 4}`,
      fill: "none", stroke: headCol, "stroke-width": 3, "marker-end": `url(#indh-${id})`,
      ...(ablated ? { "stroke-dasharray": "4 5", opacity: 0.5 } : {}) });
    g += el("text", { x: (xA + xB) / 2, y: yArc - 6, "text-anchor": "middle", fill: headCol,
      "font-size": 13, "font-weight": 700 }, ablated ? "② induction head — DESLIGADA" : "② induction head: “já vi ‘Harry’ — o que veio depois?”");
    if (ablated) {
      // X sobre o arco
      const mxx = (xA + xB) / 2, myy = yArc + 8;
      g += el("line", { x1: mxx - 12, y1: myy - 12, x2: mxx + 12, y2: myy + 12, stroke: "#DC2626", "stroke-width": 3 });
      g += el("line", { x1: mxx - 12, y1: myy + 12, x2: mxx + 12, y2: myy - 12, stroke: "#DC2626", "stroke-width": 3 });
    }
    if (!ablated) {
      // copia o token seguinte ao 1º Harry (i=1 = "Potter") para a previsão (i=7)
      const xP = cx(1), xPred = cx(7);
      g += el("path", { d: `M ${xP} ${by + bh + 4} C ${xP} ${by + bh + 40}, ${xPred} ${by + bh + 40}, ${xPred} ${by + bh + 4}`,
        fill: "none", stroke: "#059669", "stroke-width": 2.5, "stroke-dasharray": "6 4", "marker-end": `url(#indg-${id})` });
      g += el("rect", { x: pad + bw * 7 + 3, y: by, width: bw - 6, height: bh, rx: 8, fill: "#ECFDF5", stroke: "#059669", "stroke-width": 2.5 });
      g += el("text", { x: cx(7), y: by + 25, "text-anchor": "middle", fill: "#059669", "font-size": 15, "font-weight": 700 }, "Potter");
      g += el("text", { x: cx(7), y: by + bh + 54, "text-anchor": "end", fill: "#059669", "font-size": 12, "font-weight": 700, "font-style": "italic" }, "copiado → previsão");
    } else {
      // previsão quebra
      g += el("rect", { x: pad + bw * 7 + 3, y: by, width: bw - 6, height: bh, rx: 8, fill: "#FEF2F2", stroke: "#DC2626", "stroke-width": 2.5 });
      g += el("text", { x: cx(7), y: by + 25, "text-anchor": "middle", fill: "#DC2626", "font-size": 17, "font-weight": 700 }, "???");
      g += el("text", { x: cx(7), y: by + bh + 54, "text-anchor": "middle", fill: "#DC2626", "font-size": 12, "font-weight": 700, "font-style": "italic" }, "previsão quebra");
    }
  }
  const defs =
    el("marker", { id: `indh-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" })) +
    el("marker", { id: `indg-${id}`, markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#059669" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}
