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
    const bw = 176, fs = nd.label.length > 16 ? 13 : 16;
    g += el("rect", { x: X - bw / 2, y: y - 4, width: bw, height: 46, rx: 12,
      fill: out ? "#6B21A8" : "#F3E8FC", stroke: out ? "#6B21A8" : "none", "stroke-width": 1 });
    g += el("text", { x: X, y: y + 25, "text-anchor": "middle",
      fill: out ? "#fff" : "#6B21A8", "font-size": fs, "font-weight": 700 }, nd.label);
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
  const streamX = 62, top = 40, bot = h - 44;
  const gap = (bot - top) / (nLayers - 1);
  let g = "";
  // previsão em formação por camada (rasa → profunda): converge para "Paris"
  const perLayer = [
    [["the", 0.22], ["a", 0.18], ["it", 0.12], ["Paris", 0.05]],
    [["city", 0.24], ["the", 0.16], ["Paris", 0.15], ["France", 0.10]],
    [["Paris", 0.34], ["France", 0.20], ["city", 0.12], ["Lyon", 0.08]],
    [["Paris", 0.61], ["France", 0.14], ["Lyon", 0.06], ["city", 0.04]],
    [["Paris", 0.88], ["Lyon", 0.04], ["France", 0.03], ["Nice", 0.02]],
  ];
  const dist = perLayer[Math.min(peekLayer, perLayer.length - 1)];
  // residual stream
  g += el("line", { x1: streamX, y1: top, x2: streamX, y2: bot, stroke: "#D8D8DE", "stroke-width": 3 });
  for (let k = 0; k < nLayers; k++) {
    const y = bot - k * gap;
    const isPeek = k === peekLayer;
    if (isPeek) {
      g += el("circle", { cx: streamX, cy: y, r: 13, fill: "#E9DEF5", stroke: "#6B21A8", "stroke-width": 3 });
      g += el("text", { x: streamX, y: y + 4, "text-anchor": "middle", fill: "#6B21A8", "font-size": 11, "font-weight": 700 }, "L" + k);
    } else {
      g += el("circle", { cx: streamX, cy: y, r: 9, fill: "#EDEDF0", stroke: "#C9B8DD", "stroke-width": 1.5 });
      g += el("text", { x: streamX, y: y + 3.5, "text-anchor": "middle", fill: "#A99BC0", "font-size": 9 }, "L" + k);
    }
  }
  g += el("text", { x: streamX, y: bot + 20, "text-anchor": "middle", fill: "#71717A", "font-size": 11 }, "camadas");
  g += el("text", { x: streamX, y: top - 18, "text-anchor": "middle", fill: "#71717A", "font-size": 11, "font-style": "italic" }, "profundas");
  const py = bot - peekLayer * gap;
  // LN → W_U em sequência
  const lnX = streamX + 52;
  g += el("line", { x1: streamX + 13, y1: py, x2: lnX - 18, y2: py, stroke: "#0891B2", "stroke-width": 2.5, "marker-end": `url(#llh-${id})` });
  g += el("rect", { x: lnX - 18, y: py - 14, width: 36, height: 28, rx: 6, fill: "#E0F2FE", stroke: "#0891B2", "stroke-width": 2 });
  g += el("text", { x: lnX, y: py + 4, "text-anchor": "middle", fill: "#0891B2", "font-size": 12, "font-weight": 700 }, "LN");
  const wuX = lnX + 54;
  g += el("line", { x1: lnX + 18, y1: py, x2: wuX - 18, y2: py, stroke: "#DB2777", "stroke-width": 2.5, "marker-end": `url(#llh2-${id})` });
  g += el("rect", { x: wuX - 18, y: py - 14, width: 36, height: 28, rx: 6, fill: "#FCE7F3", stroke: "#DB2777", "stroke-width": 2 });
  g += el("text", { x: wuX, y: py + 4, "text-anchor": "middle", fill: "#DB2777", "font-size": 12, "font-weight": 700 }, "Wᵤ");
  // --- painel de previsão REAL em formação (barras de tokens, muda por camada) ---
  const pbX = wuX + 30, pbY = 44, pbW = w - pbX - 16, pbH = h - 88;
  g += el("rect", { x: pbX, y: pbY, width: pbW, height: pbH, rx: 10, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.5 });
  g += el("text", { x: pbX + 12, y: pbY + 20, fill: "#71717A", "font-size": 10.5, "font-weight": 800, "letter-spacing": "0.03em" }, "PREVISÃO NA CAMADA L" + peekLayer);
  const rowY = pbY + 34, rh = 26, maxBar = pbW - 90;
  dist.forEach((d, i) => {
    const [tok, p] = d;
    const y = rowY + i * rh;
    const isTop = tok === "Paris";
    const col = isTop ? "#6B21A8" : "#C9C9D4";
    g += el("text", { x: pbX + 12, y: y + 12, fill: isTop ? "#6B21A8" : "#3A3A48", "font-size": 12, "font-weight": isTop ? 700 : 500 }, tok);
    g += el("rect", { x: pbX + 58, y: y + 2, width: Math.max(4, maxBar * p), height: 13, rx: 3, fill: col });
    g += el("text", { x: pbX + 58 + Math.max(4, maxBar * p) + 5, y: y + 13, fill: col, "font-size": 10, "font-weight": 700 }, Math.round(p * 100) + "%");
  });
  // legenda do estado
  const conf = dist[0][0] === "Paris" ? dist[0][1] : 0;
  const stateTxt = peekLayer <= 1 ? "palpite vago…" : conf >= 0.8 ? "resposta decidida ✓" : "“Paris” emergindo…";
  const scol = peekLayer <= 1 ? "#D97706" : conf >= 0.8 ? "#059669" : "#6B21A8";
  g += el("text", { x: pbX + 12, y: pbY + pbH - 12, fill: scol, "font-size": 12, "font-weight": 700 }, stateTxt);
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

function featureRead(opts) {
  const { w = 400, h = 392, id = "fr", labeled = false } = opts;
  let g = "";
  // 1) a feature crua: só um número
  g += el("rect", { x: 10, y: 8, width: w - 20, height: 40, rx: 10, fill: "#F3F0F9", stroke: "#9333EA", "stroke-width": 1.5 });
  g += el("text", { x: 24, y: 25, fill: "#6B21A8", "font-size": 12, "font-weight": 800, "letter-spacing": ".03em" }, "FEATURE #4517");
  g += el("text", { x: 24, y: 40, fill: "#71717A", "font-size": 11.5 }, "só um vetor — não sabemos o que significa");
  g += el("text", { x: w - 24, y: 33, "text-anchor": "end", fill: "#9333EA", "font-size": 17, "font-weight": 800 }, "?");
  // seta
  g += el("text", { x: w / 2, y: 66, "text-anchor": "middle", fill: "#71717A", "font-size": 12, "font-style": "italic" }, "olhamos os trechos que MAIS a ativam ↓");
  // 2) top-activating examples (trechos reais, palavra-gatilho destacada)
  const ex = [
    { pre: "…vista da ", hot: "ponte Golden Gate", post: " ao pôr do sol", act: 0.97 },
    { pre: "atravessar a ", hot: "Golden Gate", post: " de bicicleta é…", act: 0.89 },
    { pre: "…a icônica ", hot: "ponte vermelha de São Francisco", post: "…", act: 0.71 },
  ];
  const y0 = 78, rh = 52, rg = 10;
  ex.forEach((e, i) => {
    const y = y0 + i * (rh + rg);
    g += el("rect", { x: 10, y, width: w - 20, height: rh, rx: 9, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.3 });
    // barra de ativação à esquerda
    g += el("rect", { x: 10, y, width: 5, height: rh, rx: 2, fill: "#DB2777", opacity: 0.35 + e.act * 0.65 });
    g += el("text", { x: 24, y: y + 19, fill: "#71717A", "font-size": 10.5, "font-weight": 700 }, "trecho do corpus · ativação " + Math.round(e.act * 100) + "%");
    // texto com destaque na palavra-gatilho
    g += el("text", { x: 24, y: y + 39, "font-size": 12.5 },
      el("tspan", { fill: "#6B6B72" }, e.pre) +
      el("tspan", { fill: "#DB2777", "font-weight": 700 }, e.hot) +
      el("tspan", { fill: "#6B6B72" }, e.post));
  });
  // 3) o rótulo que emerge
  const ly = y0 + 3 * (rh + rg) + 4;
  if (labeled) {
    g += el("rect", { x: 10, y: ly, width: w - 20, height: 46, rx: 10, fill: "#FCE7F3", stroke: "#DB2777", "stroke-width": 2 });
    g += el("text", { x: 24, y: ly + 19, fill: "#9D174D", "font-size": 11, "font-weight": 800, "letter-spacing": ".03em" }, "PADRÃO → RÓTULO");
    g += el("text", { x: 24, y: ly + 37, fill: "#1A1A2E", "font-size": 15, "font-weight": 700 }, "“ponte Golden Gate” 🌉");
    g += el("text", { x: w - 24, y: ly + 30, "text-anchor": "end", fill: "#DB2777", "font-size": 22 }, "✓");
  } else {
    g += el("rect", { x: 10, y: ly, width: w - 20, height: 46, rx: 10, fill: "#FAFAFA", stroke: "#D8D8DE", "stroke-width": 1.5, "stroke-dasharray": "5 4" });
    g += el("text", { x: w / 2, y: ly + 28, "text-anchor": "middle", fill: "#B8B8C0", "font-size": 13, "font-style": "italic" }, "clique para nomear o padrão");
  }
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

function acdcCriterion(opts) {
  const { w = 400, h = 392, id = "acc", edge = 0 } = opts;
  const tau = 0.05;
  // arestas de teste referenciam nós reais do grafo (mesma topologia da acdcPrune)
  const edges = [
    { from: "h3", to: "saída", a: 3, b: 6, kl: 0.004, keep: false },
    { from: "h2", to: "h4",    a: 2, b: 4, kl: 0.210, keep: true },
    { from: "h1", to: "h5",    a: 1, b: 5, kl: 0.012, keep: false },
  ];
  const e = edges[edge % edges.length];
  let g = "";
  // ===== mini-grafo da rede (topo), com a aresta em teste destacada =====
  const nodes = [
    { x: 0.5, y: 0.10, lab: "entrada" },
    { x: 0.22, y: 0.42, lab: "h1" }, { x: 0.5, y: 0.42, lab: "h2" }, { x: 0.78, y: 0.42, lab: "h3" },
    { x: 0.32, y: 0.76, lab: "h4" }, { x: 0.68, y: 0.76, lab: "h5" },
    { x: 0.5, y: 1.0, lab: "saída" },
  ];
  const grTop = 8, grH = 150, grW = 150, grX = 8;
  const X = (n) => grX + n.x * grW;
  const Y = (n) => grTop + n.y * grH;
  const allEdges = [[0,1],[0,2],[0,3],[1,4],[2,4],[2,5],[3,5],[4,6],[5,6],[1,5],[3,4]];
  allEdges.forEach(([a, bIdx]) => {
    const isTest = (a === e.a && bIdx === e.b);
    const na = nodes[a], nb = nodes[bIdx];
    if (isTest) {
      g += el("line", { x1: X(na), y1: Y(na) + 9, x2: X(nb), y2: Y(nb) - 9,
        stroke: e.keep ? "#DC2626" : "#059669", "stroke-width": 3.5 });
    } else {
      g += el("line", { x1: X(na), y1: Y(na) + 9, x2: X(nb), y2: Y(nb) - 9, stroke: "#D8D8E0", "stroke-width": 1.3, opacity: 0.7 });
    }
  });
  nodes.forEach((n, i) => {
    const isIO = i === 0 || i === nodes.length - 1;
    const onTest = (i === e.a || i === e.b);
    g += el("circle", { cx: X(n), cy: Y(n), r: 11, fill: isIO ? "#6B21A8" : (onTest ? "#F3E8FC" : "#F7F7FA"),
      stroke: onTest ? (e.keep ? "#DC2626" : "#059669") : "#C9B8DD", "stroke-width": onTest ? 2.5 : 1.5 });
    g += el("text", { x: X(n), y: Y(n) + 3.5, "text-anchor": "middle", fill: isIO ? "#fff" : "#6B21A8", "font-size": 8.5, "font-weight": 700 }, n.lab);
  });
  g += el("text", { x: grX + grW / 2, y: grTop + grH + 16, "text-anchor": "middle", fill: "#6B21A8", "font-size": 11.5, "font-weight": 800 }, "testando  " + e.from + " → " + e.to);

  // ===== teste da aresta (à direita do grafo) =====
  const rx = grX + grW + 18, rw = w - rx - 12;
  // duas mini-distribuições empilhadas
  const boxW = rw, boxH = 60, by = grTop + 4;
  const drawDist = (y, title, bars, col) => {
    let s = el("rect", { x: rx, y, width: boxW, height: boxH, rx: 8, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.3 });
    s += el("text", { x: rx + 8, y: y + 15, fill: "#71717A", "font-size": 10, "font-weight": 700 }, title);
    const bw = 16, base = y + boxH - 10, maxh = 26, x0 = rx + 14;
    bars.forEach((v, i) => {
      const bx = x0 + i * (bw + 12);
      s += el("rect", { x: bx, y: base - v * maxh, width: bw, height: v * maxh, rx: 3, fill: col });
      s += el("text", { x: bx + bw / 2, y: base + 8, "text-anchor": "middle", fill: "#A0A0AA", "font-size": 7.5 }, ["Paris", "Roma", "Lyon"][i]);
    });
    return s;
  };
  g += drawDist(by, "saída COM a aresta", [0.7, 0.2, 0.1], "#6B21A8");
  const distNo = e.keep ? [0.35, 0.45, 0.2] : [0.68, 0.21, 0.11];
  g += drawDist(by + boxH + 10, "saída SEM a aresta", distNo, e.keep ? "#DC2626" : "#059669");

  // KL vs τ (abaixo do grafo, largura toda)
  const my = grTop + grH + 44;
  g += el("text", { x: 12, y: my, fill: "#3A3A48", "font-size": 12.5 }, "mudança na saída (KL):");
  g += el("text", { x: 176, y: my, fill: e.keep ? "#DC2626" : "#059669", "font-size": 15, "font-weight": 800 }, e.kl.toFixed(3));
  g += el("text", { x: 260, y: my, fill: "#71717A", "font-size": 12 }, "τ = " + tau.toFixed(2));
  // barra visual
  const gx = 12, gw = w - gx - 12, gy = my + 12, scale = 0.25;
  g += el("rect", { x: gx, y: gy, width: gw, height: 14, rx: 7, fill: "#EDEDF2" });
  g += el("rect", { x: gx, y: gy, width: Math.min(gw, gw * (e.kl / scale)), height: 14, rx: 7, fill: e.keep ? "#DC2626" : "#059669" });
  const tauX = gx + gw * (tau / scale);
  g += el("line", { x1: tauX, y1: gy - 6, x2: tauX, y2: gy + 20, stroke: "#1A1A2E", "stroke-width": 2, "stroke-dasharray": "3 2" });
  g += el("text", { x: tauX, y: gy - 9, "text-anchor": "middle", fill: "#1A1A2E", "font-size": 9, "font-weight": 700 }, "τ");
  // veredito
  const vy = gy + 30;
  g += el("rect", { x: 12, y: vy, width: w - 24, height: 38, rx: 9,
    fill: e.keep ? "#FEF2F2" : "#ECFDF5", stroke: e.keep ? "#DC2626" : "#059669", "stroke-width": 2 });
  g += el("text", { x: w / 2, y: vy + 24, "text-anchor": "middle", fill: e.keep ? "#DC2626" : "#059669", "font-size": 13.5, "font-weight": 700 },
    e.keep ? "KL > τ → essencial: MANTÉM ✓" : "KL < τ → irrelevante: CORTA ✂");
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

function saeAnatomy(opts) {
  const { w = 440, h = 392, id = "san", highlight = 1 } = opts;
  // encoder: h -> features esparsas; decoder: cada feature tem um vetor (coluna) = direção
  const feats = [
    { name: "f1", col: "#B8B8C0", act: 0.0 },
    { name: "Golden Gate", col: "#DB2777", act: 0.9 },
    { name: "f3", col: "#B8B8C0", act: 0.0 },
    { name: "f4", col: "#B8B8C0", act: 0.15 },
  ];
  let g = "";
  const cx = w / 2;
  // 1) ativação h (entrada)
  g += el("rect", { x: cx - 40, y: 8, width: 80, height: 26, rx: 7, fill: "#EDE7F6", stroke: "#6B21A8", "stroke-width": 1.5 });
  g += el("text", { x: cx, y: 25, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "ativação h");
  g += el("text", { x: cx, y: 50, "text-anchor": "middle", fill: "#71717A", "font-size": 11, "font-style": "italic" }, "ENCODER: quais features estão ativas?");
  g += el("path", { d: `M${cx},34 L${cx},40`, stroke: "#B8B8C0", "stroke-width": 1.5, "marker-end": `url(#san-a-${id})` });
  // 2) vetor esparso de features
  const fy = 72, rowH = 30, gap = 8, lx = 30, lw = 150;
  feats.forEach((f, i) => {
    const y = fy + i * (rowH + gap);
    const on = f.act > 0.01;
    const hl = i === highlight;
    g += el("rect", { x: lx, y, width: lw, height: rowH, rx: 7,
      fill: hl ? "#FCE7F3" : (on ? "#F5F3FA" : "#FAFAFA"), stroke: hl ? f.col : (on ? "#C4B5DD" : "#E4E4EE"), "stroke-width": hl ? 2.5 : 1.5 });
    g += el("text", { x: lx + 10, y: y + 20, fill: on ? (hl ? "#9D174D" : "#4A4A55") : "#B8B8C0", "font-size": 12.5, "font-weight": on ? 700 : 400 }, f.name);
    // barrinha de ativação
    g += el("rect", { x: lx + 96, y: y + 10, width: 44, height: 9, rx: 4, fill: "#E4E4EE" });
    if (on) g += el("rect", { x: lx + 96, y: y + 10, width: 44 * f.act, height: 9, rx: 4, fill: f.col });
  });
  g += el("text", { x: lx, y: fy + 4 * (rowH + gap) + 8, fill: "#71717A", "font-size": 10.5 }, "vetor esparso: quase tudo 0");
  // 3) decoder: cada feature ativa tem um VETOR (coluna) = direção
  const dx = 250, dw = w - dx - 20;
  g += el("text", { x: dx + 53, y: fy + 10, "text-anchor": "middle", fill: "#71717A", "font-size": 10.5, "font-style": "italic" }, "DECODER");
  g += el("text", { x: dx + 53, y: fy + 24, "text-anchor": "middle", fill: "#71717A", "font-size": 10, "font-style": "italic" }, "vetor d por feature");
  // destacar a coluna-decoder da feature em highlight
  const f = feats[highlight];
  const colY = fy + 34, colH = 122;
  g += el("rect", { x: dx + 30, y: colY, width: 46, height: colH, rx: 8, fill: "#FCE7F3", stroke: f.col, "stroke-width": 2.5 });
  g += el("text", { x: dx + 53, y: colY - 6, "text-anchor": "middle", fill: f.col, "font-size": 11, "font-weight": 800 }, "d");
  // "números" do vetor
  const vals = [0.8, -0.3, 0.6, -0.1, 0.4, 0.2];
  vals.forEach((v, i) => {
    g += el("text", { x: dx + 53, y: colY + 20 + i * 19, "text-anchor": "middle", fill: "#9D174D", "font-size": 11 }, v.toFixed(1));
  });
  // seta ligando a feature destacada -> sua coluna decoder
  const srcY = fy + highlight * (rowH + gap) + rowH / 2;
  g += el("path", { d: `M${lx + lw + 4},${srcY} C ${dx - 20},${srcY} ${dx + 10},${colY + colH / 2} ${dx + 28},${colY + colH / 2}`,
    fill: "none", stroke: f.col, "stroke-width": 2, "stroke-dasharray": "4 3", "marker-end": `url(#san-b-${id})` });
  // conclusão embaixo
  const cy2 = colY + colH + 20;
  g += el("rect", { x: 20, y: cy2, width: w - 40, height: 40, rx: 9, fill: "#F5EEFC", stroke: "#9333EA", "stroke-width": 2 });
  g += el("text", { x: w / 2, y: cy2 + 17, "text-anchor": "middle", fill: "#6B21A8", "font-size": 12.5, "font-weight": 700 }, "essa coluna do decoder É a direção d");
  g += el("text", { x: w / 2, y: cy2 + 33, "text-anchor": "middle", fill: "#6B21A8", "font-size": 12.5, "font-weight": 700 }, "que somamos no steering ✓");
  const defs =
    el("marker", { id: `san-a-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#B8B8C0" })) +
    el("marker", { id: `san-b-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: f.col }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

if (typeof window !== "undefined") {
  function transformerArch(opts) {
    // Arquitetura fiel ao "Attention is All You Need" (Vaswani et al., 2017),
    // com o RESIDUAL STREAM em destaque (a espinha vertical onde as ativações vivem;
    // os componentes leem e escrevem nela — visão do "A Mathematical Framework").
    const { w = 400, h = 560, id = "tf" } = opts;
    let g = "";
    const cx = w * 0.40, boxW = 150, bx = cx - boxW / 2;
    const rsX = bx + boxW + 30;   // x do residual stream (faixa vertical à direita da pilha)
    const block = (y, hgt, label, fill, stroke, tcol, fs, lines) => {
      let s = el("rect", { x: bx, y, width: boxW, height: hgt, rx: 7, fill, stroke, "stroke-width": 1.5 });
      if (lines) {
        lines.forEach((ln, i) => { s += el("text", { x: cx, y: y + hgt / 2 - (lines.length - 1) * 7 + i * 14 + (fs || 12) * 0.35, "text-anchor": "middle", fill: tcol || "#2A2A32", "font-size": fs || 12, "font-weight": 700 }, ln); });
      } else {
        s += el("text", { x: cx, y: y + hgt / 2 + (fs || 12) * 0.35, "text-anchor": "middle", fill: tcol || "#2A2A32", "font-size": fs || 12, "font-weight": 600 }, label);
      }
      return s;
    };
    const conn = (y1, y2) => el("line", { x1: cx, y1, x2: cx, y2, stroke: "#B8B8C0", "stroke-width": 1.5, "marker-end": `url(#tfar-${id})` });

    // ------- geometria vertical (de baixo p/ cima) -------
    const bottomY = h - 30;
    const tokY = bottomY - 28;
    const embY = tokY - 46;
    const blkBot = embY - 26;
    const innerBot = blkBot - 12;
    const mhaY = innerBot - 40;
    const an1Y = mhaY - 26;
    const ffY = an1Y - 36;
    const an2Y = ffY - 26;
    const blkTop = an2Y - 14, blkH = blkBot - blkTop;   // topo do bloco ABRAÇA os componentes (sem vazio)
    const linY = blkTop - 30, smY = linY - 26;

    // ======= RESIDUAL STREAM (desenhado primeiro, ao fundo) =======
    const rsTop = smY + 10, rsBot = embY + 11;
    g += el("rect", { x: rsX - 9, y: rsTop, width: 18, height: rsBot - rsTop, rx: 9, fill: "#F3E8FC", stroke: "#9333EA", "stroke-width": 2 });
    // setinhas de fluxo subindo dentro do stream
    for (let yy = rsBot - 16; yy > rsTop + 10; yy -= 34) {
      g += el("line", { x1: rsX, y1: yy, x2: rsX, y2: yy - 12, stroke: "#9333EA", "stroke-width": 1.6, "marker-end": `url(#tfrs-${id})`, opacity: 0.55 });
    }
    g += el("text", { x: rsX + 16, y: (rsTop + rsBot) / 2 - 6, fill: "#6B21A8", "font-size": 12, "font-weight": 800, transform: `rotate(90 ${rsX + 16} ${(rsTop + rsBot) / 2})` }, "residual stream");

    // helper: componente LÊ do stream (entra) e ESCREVE no stream (volta)
    const readWrite = (compY, compH) => {
      const midY = compY + compH / 2;
      // leitura: stream → componente (entra pela direita do bloco)
      g += el("path", { d: `M ${rsX - 9} ${midY + 6} L ${bx + boxW} ${midY + 6}`, fill: "none", stroke: "#0891B2", "stroke-width": 1.3, "marker-end": `url(#tfrd-${id})`, opacity: 0.85 });
      // escrita: componente → stream (volta, "add")
      g += el("path", { d: `M ${bx + boxW} ${midY - 6} L ${rsX - 9} ${midY - 6}`, fill: "none", stroke: "#D9A441", "stroke-width": 1.3, "marker-end": `url(#tfwr-${id})`, opacity: 0.9 });
    };

    // ------- entrada -------
    g += el("text", { x: cx, y: bottomY + 2, "text-anchor": "middle", fill: "#71717A", "font-size": 10.5, "font-style": "italic" }, "“A capital da França é ___”");
    g += block(tokY, 22, "tokens de entrada", "#F3F3F5", "#D8D8DE", "#3A3A48", 10.5);
    g += conn(bottomY - 8, tokY + 24);
    g += block(embY, 22, "Input Embedding", "#EDE7F6", "#9333EA", "#6B21A8", 10.5);
    g += conn(tokY, embY + 24);
    g += el("circle", { cx: bx - 18, cy: embY + 11, r: 10, fill: "#FFF", stroke: "#0891B2", "stroke-width": 1.5 });
    g += el("text", { x: bx - 18, y: embY + 15, "text-anchor": "middle", fill: "#0891B2", "font-size": 13, "font-weight": 700 }, "+");
    g += el("text", { x: bx - 18, y: embY - 6, "text-anchor": "middle", fill: "#0369A1", "font-size": 7.5 }, "Positional");
    g += el("text", { x: bx - 18, y: embY + 2, "text-anchor": "middle", fill: "#0369A1", "font-size": 7.5 }, "Encoding");
    g += el("line", { x1: bx - 8, y1: embY + 11, x2: bx, y2: embY + 11, stroke: "#0891B2", "stroke-width": 1.2 });
    // embedding "injeta" o vetor inicial no stream
    g += el("path", { d: `M ${bx + boxW} ${embY + 11} L ${rsX - 9} ${embY + 11}`, fill: "none", stroke: "#9333EA", "stroke-width": 1.6, "marker-end": `url(#tfwr-${id})` });

    // ======= bloco Transformer (N×) =======
    g += el("rect", { x: bx - 10, y: blkTop, width: (rsX + 12) - (bx - 10), height: blkH, rx: 12, fill: "none", stroke: "#9333EA", "stroke-width": 1.5, "stroke-dasharray": "6 4", opacity: 0.55 });
    g += el("text", { x: bx - 22, y: blkTop + blkH / 2, "text-anchor": "middle", fill: "#6B21A8", "font-size": 14, "font-weight": 800, transform: `rotate(-90 ${bx - 22} ${blkTop + blkH / 2})` }, "N ×");

    // Multi-Head Attention (lê+escreve no stream)
    g += block(mhaY, 40, "", "#FCE7F3", "#DB2777", "#9D174D", 10.5, ["Multi-Head", "Attention"]);
    g += readWrite(mhaY, 40);
    // Add & Norm 1
    g += block(an1Y, 18, "Add & Norm", "#FEF3E2", "#D97706", "#B45309", 9.5);
    // Feed Forward (lê+escreve no stream)
    g += block(ffY, 28, "Feed Forward", "#E3F5FA", "#0891B2", "#0369A1", 10.5);
    g += readWrite(ffY, 28);
    // Add & Norm 2
    g += block(an2Y, 18, "Add & Norm", "#FEF3E2", "#D97706", "#B45309", 9.5);

    // ======= saída: Linear + Softmax (leem o stream final) =======
    g += block(linY, 18, "Linear", "#EDE7F6", "#9333EA", "#6B21A8", 10);
    g += el("path", { d: `M ${rsX - 9} ${linY + 9} L ${bx + boxW} ${linY + 9}`, fill: "none", stroke: "#0891B2", "stroke-width": 1.3, "marker-end": `url(#tfrd-${id})`, opacity: 0.85 });
    g += block(smY, 18, "Softmax", "#EDE7F6", "#9333EA", "#6B21A8", 10);
    g += conn(linY, smY + 20);
    g += el("text", { x: cx, y: smY - 8, "text-anchor": "middle", fill: "#059669", "font-size": 11, "font-weight": 700 }, "→ próximo token: “Paris”");

    // legenda leitura/escrita (canto inferior direito)
    const lgY = tokY + 4;
    g += el("line", { x1: rsX - 4, y1: lgY, x2: rsX + 12, y2: lgY, stroke: "#0891B2", "stroke-width": 1.3, "marker-end": `url(#tfrd-${id})` });
    g += el("text", { x: rsX + 16, y: lgY + 3, fill: "#0369A1", "font-size": 8.5 }, "lê");
    g += el("line", { x1: rsX + 12, y1: lgY + 13, x2: rsX - 4, y2: lgY + 13, stroke: "#D9A441", "stroke-width": 1.3, "marker-end": `url(#tfwr-${id})` });
    g += el("text", { x: rsX + 16, y: lgY + 16, fill: "#B45309", "font-size": 8.5 }, "escreve");

    // CALLOUT: o stream é um vetor de ativações ("só números")
    const calX = rsX + 24;
    const calY = an1Y - 4;
    g += el("line", { x1: rsX + 9, y1: calY + 14, x2: calX - 3, y2: calY + 14, stroke: "#111", "stroke-width": 1.2, "stroke-dasharray": "3 2" });
    g += el("rect", { x: calX, y: calY, width: w - calX - 4, height: 42, rx: 7, fill: "#FCFBFE", stroke: "#111", "stroke-width": 1.3 });
    g += el("text", { x: calX + 7, y: calY + 15, fill: "#111", "font-size": 9, "font-weight": 700 }, "hₗ (o stream)");
    g += el("text", { x: calX + 7, y: calY + 27, fill: "#71717A", "font-size": 8 }, "[0.7, −1.2,");
    g += el("text", { x: calX + 7, y: calY + 37, fill: "#71717A", "font-size": 8 }, "0.3, …]");

    const defs =
      el("marker", { id: `tfar-${id}`, markerWidth: 8, markerHeight: 8, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#B8B8C0" })) +
      el("marker", { id: `tfrs-${id}`, markerWidth: 7, markerHeight: 7, refX: 4.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#9333EA" })) +
      el("marker", { id: `tfrd-${id}`, markerWidth: 7, markerHeight: 7, refX: 4.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#0891B2" })) +
      el("marker", { id: `tfwr-${id}`, markerWidth: 7, markerHeight: 7, refX: 4.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#D9A441" }));
    return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
  }

  window.VIZ = { transformerArch, plane2D, fanVectors, miniNet, saeDiagram, transformerStack, attribGraph, superposition, causalChain, lossBalance, patchingDiagram, logitLens, indirectEffect, eapViz, featureCloud, mapTerritory, patchingLive, jlCurve, vecAlgebra, normBall, ieRuler, taylorTangent, transformerBoard, polygonSuperposition, interferencia, polygonFeatures, featureOverflow, dirVsDim, featureCards, inductionCircuit, patchMap, steeringViz, steeringExample, ablationViz, saeSteeringPanel, appsViz, attributionPatching, acdcPrune, causalScrubbing, probingViz, dlaViz, featureRead, acdcCriterion, saeAnatomy, attrPatchSteps };
}

/* ============================================================
   10b) ACTIVATION PATCHING INTERATIVO — dois fluxos lado a lado.
   ============================================================ */
function patchingLive(opts) {
  const { w = 340, h = 300, id = "ptl", patched = false, nLayers = 4, patchLayer = 2 } = opts;
  const top = 92, botLabel = h - 30;
  const gap = (botLabel - top - 20) / (nLayers - 1);
  const lx = w * 0.26, rx = w * 0.74;
  let g = "";
  // --- prompts REAIS completos no topo, para o exemplo se explicar sozinho ---
  // stream esquerdo: prompt limpo
  g += el("rect", { x: lx - 78, y: 8, width: 156, height: 46, rx: 8, fill: "#F5EEFC", stroke: "#9333EA", "stroke-width": 1.5 });
  g += el("text", { x: lx, y: 22, "text-anchor": "middle", fill: "#6B21A8", "font-size": 10, "font-weight": 800, "letter-spacing": ".04em" }, "PROMPT LIMPO");
  g += el("text", { x: lx, y: 37, "text-anchor": "middle", fill: "#3A3A48", "font-size": 11 }, "“A capital da");
  g += el("text", { x: lx, y: 49, "text-anchor": "middle", fill: "#3A3A48", "font-size": 11 }, "França é ___”");
  // stream direito: prompt corrompido
  g += el("rect", { x: rx - 78, y: 8, width: 156, height: 46, rx: 8, fill: "#FDF0F0", stroke: "#DC2626", "stroke-width": 1.5 });
  g += el("text", { x: rx, y: 22, "text-anchor": "middle", fill: "#DC2626", "font-size": 10, "font-weight": 800, "letter-spacing": ".04em" }, "PROMPT CORROMPIDO");
  g += el("text", { x: rx, y: 37, "text-anchor": "middle", fill: "#3A3A48", "font-size": 11 }, "“A capital da");
  g += el("text", { x: rx, y: 49, "text-anchor": "middle", fill: "#3A3A48", "font-size": 11 }, "Itália é ___”");
  // rótulo das colunas de camadas
  g += el("text", { x: lx, y: 74, "text-anchor": "middle", fill: "#9333EA", "font-size": 10.5, "font-weight": 700 }, "camadas ↓");
  g += el("text", { x: rx, y: 74, "text-anchor": "middle", fill: "#9333EA", "font-size": 10.5, "font-weight": 700 }, "camadas ↓");
  // streams verticais
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
    g += el("line", { x1: lx + 15, y1: py, x2: rx - 18, y2: py, stroke: "#059669",
      "stroke-width": 3, "marker-end": `url(#ptlh-${id})`, "stroke-dasharray": "5 3" });
    g += el("text", { x: (lx + rx) / 2, y: py - 10, "text-anchor": "middle", fill: "#059669",
      "font-size": 11, "font-weight": 700 }, "copia a ativação");
    g += el("text", { x: (lx + rx) / 2, y: py + 22, "text-anchor": "middle", fill: "#059669",
      "font-size": 10, "font-style": "italic" }, "da camada " + patchLayer);
  } else {
    g += el("text", { x: (lx + rx) / 2, y: py - 8, "text-anchor": "middle", fill: "#B8B8C0", "font-size": 11, "font-style": "italic" }, "clique para");
    g += el("text", { x: (lx + rx) / 2, y: py + 6, "text-anchor": "middle", fill: "#B8B8C0", "font-size": 22 }, "→");
  }
  // saída de cada stream
  g += el("text", { x: lx, y: botLabel + 8, "text-anchor": "middle", fill: "#059669", "font-size": 13, "font-weight": 700 }, "→ Paris ✓");
  g += el("rect", { x: rx - 46, y: botLabel - 8, width: 92, height: 26, rx: 8,
    fill: patched ? "#D1FAE5" : "#FDE2E2", stroke: patched ? "#059669" : "#DC2626", "stroke-width": 2 });
  g += el("text", { x: rx, y: botLabel + 10, "text-anchor": "middle",
    fill: patched ? "#059669" : "#DC2626", "font-size": 14, "font-weight": 700 }, patched ? "→ Paris ✓" : "→ Roma ✗");
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
  // conceitos são VETORES (setas da origem). A cadeia: rei − homem + mulher = rainha.
  const rei    = [0.62, 0.16];
  const homemD = [0.34, 0.10];            // direção "homem" (subtraída)
  const mulherD= [0.04, 0.66];            // direção "mulher" (somada)
  const p1     = [rei[0] - homemD[0], rei[1] - homemD[1]];      // rei − homem
  const rainha = [p1[0] + mulherD[0], p1[1] + mulherD[1]];      // + mulher
  const X = (v) => ox + v[0] * S;
  const Y = (v) => oy - v[1] * S;
  let g = "";
  // eixos leves (o "espaço de ativação")
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: ox + S + 24, y2: oy, "marker-end": `url(#vaax-${id})` });
  g += el("line", { class: "axis", x1: ox, y1: oy, x2: ox, y2: oy - S - 24, "marker-end": `url(#vaax-${id})` });
  g += el("text", { x: ox + S + 20, y: oy + 18, "text-anchor": "end", fill: "#A1A1AA", "font-size": 12, "font-style": "italic" }, "espaço de ativação");

  // vetor da origem até v (um CONCEITO = uma direção)
  const vec = (v, col, txt, dx, dy, wgt) =>
    el("line", { x1: ox, y1: oy, x2: X(v), y2: Y(v), stroke: col, "stroke-width": wgt || 4,
      "marker-end": `url(#vahb-${id}-${col.replace('#','')})`, "stroke-linecap": "round" }) +
    el("text", { x: X(v) + (dx ?? 12), y: Y(v) + (dy ?? 5), fill: col, "font-size": 17, "font-weight": 700,
      "font-family": "'Playfair Display',serif" }, txt);
  // deslocamento encadeado a→b (a "feature" aplicada), tracejado para distinguir da direção-conceito
  const move = (a, b, col, txt, dx, dy) =>
    el("line", { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), stroke: col, "stroke-width": 3, "stroke-dasharray": "6 4",
      "marker-end": `url(#vahb-${id}-${col.replace('#','')})`, "stroke-linecap": "round" }) +
    el("text", { x: (X(a)+X(b))/2 + (dx||0), y: (Y(a)+Y(b))/2 + (dy||-12), "text-anchor": "middle", fill: col,
      "font-size": 14, "font-weight": 700, "font-style": "italic" }, txt);

  // passo 1 — "rei" como VETOR da origem
  if (step >= 1) {
    g += vec(rei, "#6B21A8", "rei", 12, -4);
  }
  // passo 2 — subtrai a direção "homem" (deslocamento a partir da ponta de rei)
  if (step >= 2) {
    g += move(rei, p1, "#DC2626", "− homem", 0, -12);
  }
  // passo 3 — soma a direção "mulher" → chega na ponta de "rainha"
  if (step >= 3) {
    g += move(p1, rainha, "#0891B2", "+ mulher", -30, 4);
    // "rainha" é o VETOR resultante da origem até o fim da cadeia
    g += vec(rainha, "#059669", "rainha ✓", 14, 4);
    g += el("circle", { cx: X(rainha), cy: Y(rainha), r: 13, fill: "none", stroke: "#059669", "stroke-width": 2.5, opacity: 0.5 });
  }
  const mk = (c) => el("marker", { id: `vahb-${id}-${c.replace('#','')}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: c }));
  const defs =
    mk("#6B21A8") + mk("#DC2626") + mk("#0891B2") + mk("#059669") +
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
  const { w = 420, h = 380, id = "fo", crammed = true } = opts;
  // espaço 2D (d=2): só cabem 2 direções PERFEITAMENTE ortogonais.
  // com muitas features, elas são espremidas em direções QUASE-ortogonais (interferem).
  const cx = w / 2, cy = h * 0.50, R = Math.min(w, h) * 0.32;
  let g = "";
  g += el("text", { x: cx, y: 22, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 800, "letter-spacing": ".03em" }, "ESPAÇO DE d = 2 DIMENSÕES");
  // eixos (as 2 dimensões / neurônios)
  g += el("line", { x1: cx - R - 20, y1: cy, x2: cx + R + 20, y2: cy, stroke: "#D8D8DE", "stroke-width": 1.5 });
  g += el("line", { x1: cx, y1: cy + R + 20, x2: cx, y2: cy - R - 20, stroke: "#D8D8DE", "stroke-width": 1.5 });
  const arrow = (ang, col, lab, wgt, dash) => {
    const x2 = cx + R * Math.cos(ang), y2 = cy - R * Math.sin(ang);
    let s = el("line", { x1: cx, y1: cy, x2, y2, stroke: col, "stroke-width": wgt || 3.5,
      "marker-end": `url(#foa-${id}-${col.replace('#','')})`, "stroke-linecap": "round", "stroke-dasharray": dash || "none" });
    s += el("text", { x: x2 + (Math.cos(ang) >= 0 ? 6 : -6), y: y2 + (Math.sin(ang) >= 0 ? -6 : 14),
      "text-anchor": Math.cos(ang) >= 0 ? "start" : "end", fill: col, "font-size": 12, "font-weight": 700 }, lab);
    return s;
  };
  // 2 direções ORTOGONAIS (cabem limpas) — verde
  g += arrow(0, "#059669", "gato", 4);
  g += arrow(Math.PI / 2, "#059669", "Paris", 4);
  if (crammed) {
    // features EXTRAS espremidas em ângulos apertados → quase-ortogonais (interferem)
    const extras = [
      { a: 0.30, l: "azul" }, { a: 0.62, l: "plural" },
      { a: 1.02, l: "ironia" }, { a: 1.30, l: "medo" },
    ];
    extras.forEach((e) => g += arrow(e.a, "#DC2626", e.l, 2.5, "5 3"));
    g += el("path", { d: `M ${cx + 42} ${cy} A 42 42 0 0 0 ${cx + 42 * Math.cos(1.30)} ${cy - 42 * Math.sin(1.30)}`,
      fill: "none", stroke: "#DC2626", "stroke-width": 1.5, opacity: 0.5, "stroke-dasharray": "2 2" });
    g += el("text", { x: cx + 50, y: cy - 34, fill: "#DC2626", "font-size": 10, "font-style": "italic" }, "ângulos");
    g += el("text", { x: cx + 50, y: cy - 22, fill: "#DC2626", "font-size": 10, "font-style": "italic" }, "apertados");
  }
  const ly = h - 40;
  g += el("circle", { cx: 24, cy: ly, r: 5, fill: "#059669" });
  g += el("text", { x: 34, y: ly + 4, fill: "#3A3A48", "font-size": 12 }, "d ortogonais (não interferem)");
  g += el("circle", { cx: 24, cy: ly + 20, r: 5, fill: "#DC2626" });
  g += el("text", { x: 34, y: ly + 24, fill: "#3A3A48", "font-size": 12 }, "extras: quase-ortogonais (interferem)");
  const cols = ["#059669", "#DC2626"];
  const defs = cols.map((c) => el("marker", { id: `foa-${id}-${c.replace('#','')}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: c }))).join("");
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
  g += el("line", { x1: ox, y1: oy, x2: ox + S + 22, y2: oy, stroke: "#C4C4CE", "stroke-width": 2, "marker-end": `url(#ddax-${id})` });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - S - 22, stroke: "#C4C4CE", "stroke-width": 2, "marker-end": `url(#ddax-${id})` });
  g += el("text", { x: ox - 8, y: oy + 22, fill: "#A1A1AA", "font-size": 10, "font-style": "italic" }, "(eixos = dimensões)");
  const fx = 0.82, fy = 0.66;
  const ex = ox + fx * S, ey = oy - fy * S;
  g += el("line", { x1: ex, y1: ey, x2: ex, y2: oy, stroke: "#9333EA", "stroke-width": 1.5, "stroke-dasharray": "4 3", opacity: 0.55 });
  g += el("line", { x1: ex, y1: ey, x2: ox, y2: ey, stroke: "#9333EA", "stroke-width": 1.5, "stroke-dasharray": "4 3", opacity: 0.55 });
  g += el("line", { x1: ox, y1: oy, x2: ex, y2: ey, stroke: "#6B21A8", "stroke-width": 5, "marker-end": `url(#ddf-${id})` });
  g += el("text", { x: ex + 8, y: ey - 6, fill: "#6B21A8", "font-size": 17, "font-weight": 700, "font-family": "'Playfair Display',serif" }, "\u201Crealeza\u201D");
  g += el("text", { x: ex + 8, y: ey + 13, fill: "#6B21A8", "font-size": 12, "font-style": "italic", "opacity": 0.8 }, "(uma direção)");
  g += el("text", { x: ox + S * 0.5, y: oy - S - 2, "text-anchor": "middle", fill: "#71717A", "font-size": 12, "font-style": "italic" }, "a feature é diagonal — combina as dimensões");
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

/* ============================================================
   30) PATCH MAP — nota de recuperação por camada (activation
       patching camada a camada). Barras horizontais; a camada com
       o pico é onde a informação mora. Slide 22.
   ============================================================ */
function patchMap(opts) {
  const { w = 380, h = 340, id = "pm" } = opts;
  // recuperação por camada (0..1) com um pico nítido no meio
  const rec = [0.05, 0.12, 0.28, 0.91, 0.66, 0.30, 0.14, 0.08];
  const nL = rec.length;
  const pad = 16, labW = 62, top = 30, bh = 26, gap = 8;
  const trackX = pad + labW, trackW = w - trackX - 60;
  let g = "";
  g += el("text", { x: pad, y: 16, fill: "#71717A", "font-size": 12, "font-weight": 700, "letter-spacing": "0.04em" }, "CAMADA");
  g += el("text", { x: w - 8, y: 16, "text-anchor": "end", fill: "#71717A", "font-size": 12, "font-weight": 700, "letter-spacing": "0.04em" }, "RECUPERAÇÃO");
  const peak = rec.indexOf(Math.max(...rec));
  rec.forEach((v, k) => {
    const y = top + k * (bh + gap);
    const isPeak = k === peak;
    g += el("text", { x: pad, y: y + 18, fill: isPeak ? "#059669" : "#71717A", "font-size": 13, "font-weight": isPeak ? 700 : 500 }, `L${k}`);
    // trilho
    g += el("rect", { x: trackX, y: y + 3, width: trackW, height: bh - 6, rx: 6, fill: "#EDEDF2" });
    // barra
    const col = isPeak ? "#059669" : "#C9B8DD";
    g += el("rect", { x: trackX, y: y + 3, width: trackW * v, height: bh - 6, rx: 6, fill: col });
    g += el("text", { x: trackX + trackW * v + 8, y: y + 18, fill: col, "font-size": 12, "font-weight": 700 }, `${Math.round(v * 100)}%`);
    if (isPeak) {
      g += el("text", { x: trackX + trackW * v + 44, y: y + 18, fill: "#059669", "font-size": 12, "font-weight": 700, "font-style": "italic" }, "← aqui!");
    }
  });
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   30) STEERING (activation addition) — em vez de copiar a ativação
       inteira (patching), SOMA um múltiplo de uma direção de feature
       ao vetor de ativação, empurrando a saída na direção do conceito.
       h' = h + α·d_feature.  Slider controla α → readout do efeito.
       Retorna { svg, alpha, effect } para o slider.
   ============================================================ */
function steeringViz(opts) {
  const { w = 440, h = 360, id = "st", alpha = 1.0 } = opts;
  // nível de intensidade a partir de alpha
  const lvl = alpha < 0.5 ? 0 : alpha < 1.5 ? 1 : 2;
  const zone = [
    { col: "#71717A", tag: "sem efeito", txt: "“Acho que talvez dê pra ajudar com isso.”" },
    { col: "#059669", tag: "efeito visível", txt: "“Será um prazer ajudá-lo com esta questão.”" },
    { col: "#DC2626", tag: "domina a saída", txt: "“Prezado senhor, tenho a honra de vos prestar assistência.”" },
  ][lvl];
  let g = "";
  // --- painel superior: mini-diagrama vetorial (compacto) ---
  const ox = 40, oy = 150, S = 108;
  g += el("line", { x1: ox, y1: oy, x2: ox + S + 14, y2: oy, stroke: "#E4E4EE", "stroke-width": 2, opacity: 0.7 });
  g += el("line", { x1: ox, y1: oy, x2: ox, y2: oy - S - 14, stroke: "#E4E4EE", "stroke-width": 2, opacity: 0.7 });
  const hx = 0.34, hy = 0.30, hX = ox + hx * S, hY = oy - hy * S;
  g += el("line", { x1: ox, y1: oy, x2: hX, y2: hY, stroke: "#6B21A8", "stroke-width": 3.5, "marker-end": `url(#sth-${id})` });
  g += el("text", { x: hX - 4, y: hY + 16, fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "h");
  const dfx = 0.62, dfy = 0.44, dn = Math.hypot(dfx, dfy), ux = dfx / dn, uy = dfy / dn;
  const scale = 0.40;
  const px = hx + alpha * scale * ux, py = hy + alpha * scale * uy;
  const pX = ox + px * S, pY = oy - py * S;
  g += el("line", { x1: hX, y1: hY, x2: pX, y2: pY, stroke: zone.col, "stroke-width": 3, "stroke-dasharray": "5 3", "marker-end": `url(#std-${id})` });
  g += el("text", { x: (hX + pX) / 2 + 4, y: (hY + pY) / 2 - 8, fill: zone.col, "font-size": 12, "font-weight": 700, "font-style": "italic" }, "α·d");
  g += el("circle", { cx: pX, cy: pY, r: 4.5, fill: zone.col });
  g += el("text", { x: pX + 7, y: pY - 3, fill: zone.col, "font-size": 13, "font-weight": 700 }, "h′");
  g += el("text", { x: ox + 4, y: 20, fill: "#71717A", "font-size": 12, "font-style": "italic" }, "direção “formalidade”");
  // barra de intensidade α (à direita do diagrama)
  const barX = ox + S + 60, barTop = 42, barH = 96, barW = 16;
  g += el("text", { x: barX + barW / 2, y: barTop - 10, "text-anchor": "middle", fill: "#71717A", "font-size": 11, "font-weight": 700 }, "α");
  g += el("rect", { x: barX, y: barTop, width: barW, height: barH, rx: 8, fill: "#EDEDF2" });
  const fillH = Math.min(1, alpha / 3) * barH;
  g += el("rect", { x: barX, y: barTop + barH - fillH, width: barW, height: fillH, rx: 8, fill: zone.col });
  // --- painel inferior: TEXTO GERADO (o exemplo real, muda com α) ---
  const py0 = 210, pw = w - 32, ph = h - py0 - 16;
  g += el("rect", { x: 16, y: py0, width: pw, height: ph, rx: 12, fill: "#FCFBFE", stroke: zone.col, "stroke-width": 2 });
  g += el("rect", { x: 16, y: py0, width: 6, height: ph, rx: 3, fill: zone.col });
  g += el("text", { x: 32, y: py0 + 24, fill: zone.col, "font-size": 12, "font-weight": 800, "letter-spacing": "0.04em" }, "SAÍDA DO MODELO");
  g += el("rect", { x: pw - 76, y: py0 + 12, width: 78, height: 20, rx: 10, fill: zone.col, opacity: 0.14 });
  g += el("text", { x: pw - 37, y: py0 + 26, "text-anchor": "middle", fill: zone.col, "font-size": 11, "font-weight": 700 }, zone.tag);
  // texto quebrado em linhas
  const words = zone.txt.split(" ");
  let line = "", ly = py0 + 50; const maxc = 34;
  words.forEach((word) => {
    if ((line + " " + word).length > maxc) {
      g += el("text", { x: 32, y: ly, fill: "#2A2A38", "font-size": 15 }, line);
      line = word; ly += 22;
    } else line = line ? line + " " + word : word;
  });
  if (line) g += el("text", { x: 32, y: ly, fill: "#2A2A38", "font-size": 15 }, line);
  const defs =
    el("marker", { id: `sth-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#6B21A8" })) +
    el("marker", { id: `std-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: zone.col }));
  return { svg: el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g),
           alpha, effect: ["sutil", "visível", "domina a saída"][lvl] };
}

/* ============================================================
   31) STEERING EXAMPLE — três níveis de intensidade mostrando a
       saída ficando cada vez mais dominada pelo conceito injetado.
       Ilustra "botão de conceito" (ex.: Golden Gate) do fraco ao forte.
   ============================================================ */
function steeringExample(opts) {
  const { w = 400, h = 360, id = "se" } = opts;
  const rows = [
    { lvl: "α = 0", tag: "original", col: "#71717A", txt: "“Uma boa receita de pão começa com farinha e água…”" },
    { lvl: "α baixo", tag: "leve", col: "#059669", txt: "“Uma boa receita de pão — como as vendidas perto da Golden Gate — começa com…”" },
    { lvl: "α alto", tag: "domina", col: "#DC2626", txt: "“A Ponte Golden Gate! A majestosa Ponte Golden Gate de São Francisco…”" },
  ];
  const pad = 8, cw = w - pad * 2, rh = 104, gap = 12;
  let g = "";
  rows.forEach((r, i) => {
    const y = pad + i * (rh + gap);
    g += el("rect", { x: pad, y, width: cw, height: rh, rx: 12, fill: "#FCFBFE", stroke: r.col, "stroke-width": 1.5 });
    // barra de intensidade lateral
    g += el("rect", { x: pad, y, width: 6, height: rh, rx: 3, fill: r.col });
    g += el("text", { x: pad + 18, y: y + 24, fill: r.col, "font-size": 14, "font-weight": 700 }, r.lvl);
    g += el("rect", { x: pad + 88, y: y + 12, width: 60, height: 18, rx: 9, fill: r.col, opacity: 0.14 });
    g += el("text", { x: pad + 118, y: y + 25, "text-anchor": "middle", fill: r.col, "font-size": 11, "font-weight": 700 }, r.tag);
    // texto quebrado em linhas
    const words = r.txt.split(" ");
    let line = "", ly = y + 50; const maxc = 40;
    words.forEach((word) => {
      if ((line + " " + word).length > maxc) {
        g += el("text", { x: pad + 18, y: ly, fill: "#3A3A48", "font-size": 13 }, line);
        line = word; ly += 18;
      } else line = line ? line + " " + word : word;
    });
    if (line) g += el("text", { x: pad + 18, y: ly, fill: "#3A3A48", "font-size": 13 }, line);
  });
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   32) ABLATION — cadeia de 3 componentes; clicar desliga cada um
       e mostra o efeito na tarefa (barra de desempenho).
       componentes necessários derrubam muito o desempenho ao sair.
   ============================================================ */
function ablationViz(opts) {
  const { w = 420, h = 380, id = "ab", off = -1 } = opts;
  // cada componente = um papel REAL no circuito, com COR e os tokens que ele conecta
  const comps = [
    { name: "subject head", col: "#0891B2", role: "lê o país (“França”)", broke: true,
      short: "subject", carries: "a leitura do sujeito “França”", links: [[2, 2]] },
    { name: "cabeça-de-fato", col: "#6B21A8", role: "traz o fato do país → capital", broke: true,
      short: "fato", carries: "a ligação “França → Paris”", links: [[2, 4]] },
    { name: "cabeça neutra", col: "#94969C", role: "não participa (controle)", broke: false,
      short: "cabeça neutra", carries: "nada relevante para esta tarefa", links: [] },
  ];
  const pad = 16, colW = (w - pad * 2) / 3, top = 46;
  let g = "";
  g += el("text", { x: w / 2, y: 16, "text-anchor": "middle", fill: "#6B21A8", "font-size": 13, "font-weight": 700 }, "▸ clique numa head para ligar/desligar");
  comps.forEach((c, i) => {
    const cx = pad + colW * i + colW / 2;
    const isOff = off === i;
    const boxW = colW - 10, boxH = 62, bx = cx - boxW / 2, by = top;
    g += `<g class="abl-box" data-abl="${id}" data-i="${i}" style="cursor:pointer">`;
    g += el("rect", { x: bx, y: by + 3, width: boxW, height: boxH, rx: 11, fill: isOff ? "#E4E4EA" : c.col, opacity: isOff ? 0.5 : 0.2 });
    g += el("rect", { x: bx, y: by, width: boxW, height: boxH, rx: 11,
      fill: isOff ? "#F3F3F5" : "#fff", stroke: isOff ? "#C9C9D4" : c.col, "stroke-width": 2.5,
      ...(isOff ? { "stroke-dasharray": "5 4" } : {}) });
    // faixa de cor no topo (legenda visual do papel)
    g += el("rect", { x: bx, y: by, width: boxW, height: 5, rx: 2, fill: isOff ? "#C9C9D4" : c.col });
    g += el("circle", { cx: bx + 13, cy: by + 18, r: 4.5, fill: isOff ? "#C9C9D4" : "#059669" });
    g += el("text", { x: bx + 22, y: by + 22, fill: isOff ? "#A1A1AA" : "#059669", "font-size": 9, "font-weight": 700 }, isOff ? "OFF" : "ON");
    // nome (quebra em 2 linhas se preciso)
    const nm = c.name.split(" ");
    if (nm.length > 1 && c.name.length > 14) {
      g += el("text", { x: cx, y: by + 40, "text-anchor": "middle", fill: isOff ? "#A1A1AA" : c.col, "font-size": 12, "font-weight": 700 }, nm[0]);
      g += el("text", { x: cx, y: by + 53, "text-anchor": "middle", fill: isOff ? "#A1A1AA" : c.col, "font-size": 12, "font-weight": 700 }, nm.slice(1).join(" "));
    } else {
      g += el("text", { x: cx, y: by + 46, "text-anchor": "middle", fill: isOff ? "#A1A1AA" : c.col, "font-size": 12.5, "font-weight": 700 }, c.name);
    }
    if (isOff) {
      g += el("line", { x1: cx - 12, y1: by + 31 - 8, x2: cx + 12, y2: by + 31 + 10, stroke: "#DC2626", "stroke-width": 3 });
      g += el("line", { x1: cx - 12, y1: by + 31 + 10, x2: cx + 12, y2: by + 31 - 8, stroke: "#DC2626", "stroke-width": 3 });
    }
    g += `</g>`;
  });
  // --- efeito REAL na frase (dentro da viz), com a cor do papel destacando o que ele faz ---
  const active = off >= 0 ? comps[off] : null;
  const broke = active && active.broke;
  const py0 = top + 92, pw = w - pad * 2, ph = h - py0 - 14;
  g += el("rect", { x: pad, y: py0, width: pw, height: ph, rx: 12, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.5 });
  // fita de tokens
  const toks = ["A", "capital", "da", "França", "é"];
  const tx0 = pad + 16, ty = py0 + 40, tbw = 50, tbh = 26;
  const cxTok = (i) => tx0 + i * (tbw + 4) + tbw / 2;
  // arco colorido do papel ativo (o que ele conecta), desenhado ACIMA da fita
  if (active && active.links.length) {
    active.links.forEach(([a, bIdx]) => {
      const xA = cxTok(a), xB = cxTok(bIdx), yArc = ty - 16;
      g += el("path", { d: `M ${xA} ${ty - 2} C ${xA} ${yArc - 14}, ${xB} ${yArc - 14}, ${xB} ${ty - 2}`,
        fill: "none", stroke: broke ? "#C9C9D4" : active.col, "stroke-width": 2.5,
        "marker-end": `url(#ablh-${id})`, ...(broke ? { "stroke-dasharray": "4 4" } : {}) });
    });
  }
  g += el("text", { x: tx0, y: py0 + 22, fill: "#71717A", "font-size": 11, "font-weight": 700, "letter-spacing": "0.03em" }, "A MESMA FRASE DO CIRCUITO");
  toks.forEach((t, i) => {
    const x = tx0 + i * (tbw + 4);
    // realça os tokens que o papel ativo conecta
    const inLink = active && active.links.some(([a, bI]) => a === i || bI === i);
    const tcol = inLink ? (broke ? "#C9C9D4" : active.col) : "#E4E4EE";
    g += el("rect", { x, y: ty, width: tbw, height: tbh, rx: 6, fill: inLink && !broke ? active.col + "22" : "#F7F7FA", stroke: tcol, "stroke-width": inLink ? 2 : 1 });
    g += el("text", { x: x + tbw / 2, y: ty + 17, "text-anchor": "middle", fill: "#3A3A48", "font-size": 12, "font-weight": i === 3 ? 700 : 500 }, t);
  });
  const arrowX = tx0 + toks.length * (tbw + 4);
  g += el("text", { x: arrowX + 3, y: ty + 18, fill: "#B8B8C0", "font-size": 15 }, "→");
  const predCol = broke ? "#DC2626" : "#059669";
  g += el("rect", { x: arrowX + 20, y: ty, width: 62, height: tbh, rx: 6, fill: broke ? "#FEF2F2" : "#ECFDF5", stroke: predCol, "stroke-width": 2 });
  g += el("text", { x: arrowX + 51, y: ty + 17, "text-anchor": "middle", fill: predCol, "font-size": 13, "font-weight": 700 }, broke ? "???" : "Paris");
  // linha explicando o papel ativo (na cor dele)
  let roleLine = "tudo ligado — o circuito prevê “Paris”";
  if (active) roleLine = `${active.name}: ${active.role}`;
  g += el("text", { x: tx0, y: py0 + 84, fill: active ? (broke ? "#DC2626" : "#059669") : "#71717A", "font-size": 12.5, "font-weight": 700 }, active ? "SEM ESSA HEAD:" : "");
  const info = active ? (broke ? `some “${active.carries}” → previsão QUEBRA` : `${active.carries} → previsão intacta`) : "";
  const iwords = info.split(" "); let il = "", ily = py0 + 102;
  iwords.forEach((wd) => { if ((il + " " + wd).length > 52) { g += el("text", { x: tx0, y: ily, fill: "#3A3A48", "font-size": 12 }, il); il = wd; ily += 16; } else il = il ? il + " " + wd : wd; });
  if (il) g += el("text", { x: tx0, y: ily, fill: "#3A3A48", "font-size": 12 }, il);
  const defs = el("marker", { id: `ablh-${id}`, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: broke ? "#C9C9D4" : (active ? active.col : "#6B21A8") }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   33) SAE STEERING PANEL — fecha o arco: as features INTERPRETÁVEIS
       do SAE (Bloco 3) viram os BOTÕES de steering (Bloco 5).
       Um painel de features nomeadas; a ativa empurra a geração e o
       texto de saída reflete a feature escolhida. active = índice.
   ============================================================ */
function saeSteeringPanel(opts) {
  const { w = 460, h = 380, id = "sp", active = 0 } = opts;
  const feats = [
    { name: "ponte Golden Gate", col: "#DB2777", ang: 38, out: "“…que me lembra a majestosa Golden Gate.”" },
    { name: "formalidade", col: "#6B21A8", ang: 68, out: "“Prezado senhor, tenho a honra de informar…”" },
    { name: "tom otimista", col: "#059669", ang: 12, out: "“…e tenho certeza de que vai dar tudo certo!”" },
    { name: "linguagem técnica", col: "#0891B2", ang: -22, out: "“…conforme o parâmetro instanciado no runtime.”" },
  ];
  const pad = 14, rowH = 32, gap = 6, top = 26;
  const listW = w * 0.48;
  let g = "";
  g += el("text", { x: pad, y: 15, fill: "#71717A", "font-size": 10.5, "font-weight": 700, "letter-spacing": "0.03em" }, "FEATURE DO SAE = VETOR d");
  feats.forEach((f, i) => {
    const y = top + i * (rowH + gap);
    const on = i === active;
    g += `<g class="sae-btn" data-sae="${id}" data-i="${i}" style="cursor:pointer">`;
    g += el("rect", { x: pad, y, width: listW - pad, height: rowH, rx: 8,
      fill: on ? f.col : "#F7F7FA", stroke: on ? f.col : "#E4E4EE", "stroke-width": 2, opacity: on ? 0.14 : 1 });
    if (on) g += el("rect", { x: pad, y, width: listW - pad, height: rowH, rx: 8, fill: "none", stroke: f.col, "stroke-width": 2 });
    g += el("circle", { cx: pad + 15, cy: y + rowH / 2, r: 6, fill: on ? f.col : "#D4D4DC" });
    g += el("circle", { cx: pad + 15 + (on ? 4 : -4), cy: y + rowH / 2, r: 4, fill: "#fff" });
    g += el("text", { x: pad + 30, y: y + rowH / 2 + 4, fill: on ? f.col : "#71717A", "font-size": 11.5, "font-weight": 700 }, f.name);
    g += `</g>`;
  });
  const f = feats[active];
  const rad = f.ang * Math.PI / 180;
  // --- MECANISMO: h + α·d = h'  (vetores explícitos) ---
  const gx = listW + 16, gyTop = top - 4, gw = w - gx - pad, gh = 168;
  const ocx = gx + 14, ocy = gyTop + gh - 14, R = Math.min(gw - 40, gh - 30);
  g += el("text", { x: gx, y: gyTop - 6, fill: "#71717A", "font-size": 10, "font-weight": 700, "letter-spacing": "0.03em" }, "A OPERAÇÃO NO ESPAÇO");
  // eixos
  g += el("line", { x1: ocx, y1: ocy, x2: ocx + R, y2: ocy, stroke: "#ECECF1", "stroke-width": 1.5 });
  g += el("line", { x1: ocx, y1: ocy, x2: ocx, y2: ocy - R, stroke: "#ECECF1", "stroke-width": 1.5 });
  // vetor h (ativação original) — fixo, apontando p/ cima-direita suave
  const hLen = R * 0.5, hAng = 72 * Math.PI / 180;
  const hx = ocx + hLen * Math.cos(hAng), hy = ocy - hLen * Math.sin(hAng);
  g += el("line", { x1: ocx, y1: ocy, x2: hx, y2: hy, stroke: "#1A1A1A", "stroke-width": 2.5, "marker-end": `url(#sph-h-${id})` });
  g += el("text", { x: hx - 8, y: hy - 4, fill: "#1A1A1A", "font-size": 11, "font-weight": 700 }, "h");
  // vetor α·d (a direção da feature), partindo da ponta de h
  const dLen = R * 0.5;
  const dx = hx + dLen * Math.cos(rad), dy = hy - dLen * Math.sin(rad);
  g += el("line", { x1: hx, y1: hy, x2: dx, y2: dy, stroke: f.col, "stroke-width": 3, "stroke-dasharray": "5 3", "marker-end": `url(#sph-d-${id})` });
  g += el("text", { x: (hx + dx) / 2 + 4, y: (hy + dy) / 2 - 4, fill: f.col, "font-size": 11, "font-weight": 700 }, "α·d");
  // vetor resultante h' = h + α·d
  g += el("line", { x1: ocx, y1: ocy, x2: dx, y2: dy, stroke: f.col, "stroke-width": 2, opacity: 0.4 });
  g += el("circle", { cx: dx, cy: dy, r: 4, fill: f.col });
  g += el("text", { x: dx + 5, y: dy - 4, fill: f.col, "font-size": 11, "font-weight": 800 }, "h′");
  // origem
  g += el("circle", { cx: ocx, cy: ocy, r: 3, fill: "#1A1A1A" });
  // --- painel de saída (reflete a feature ativa) ---
  const py0 = top + gh + 10, pw = w - pad * 2, ph = h - py0 - 12;
  g += el("rect", { x: pad, y: py0, width: pw, height: ph, rx: 12, fill: "#FCFBFE", stroke: f.col, "stroke-width": 2 });
  g += el("rect", { x: pad, y: py0, width: 6, height: ph, rx: 3, fill: f.col });
  g += el("text", { x: pad + 16, y: py0 + 20, fill: f.col, "font-size": 10.5, "font-weight": 800, "letter-spacing": "0.03em" }, "SAÍDA COM h′ (empurrada pela feature)");
  const words = f.out.split(" ");
  let line = "", ly = py0 + 42; const maxc = 46;
  words.forEach((word) => {
    if ((line + " " + word).length > maxc) {
      g += el("text", { x: pad + 16, y: ly, fill: "#2A2A38", "font-size": 13.5 }, line);
      line = word; ly += 19;
    } else line = line ? line + " " + word : word;
  });
  if (line) g += el("text", { x: pad + 16, y: ly, fill: "#2A2A38", "font-size": 13.5 }, line);
  const defs =
    el("marker", { id: `sph-h-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: "#1A1A1A" })) +
    el("marker", { id: `sph-d-${id}`, markerWidth: 7, markerHeight: 7, refX: 5.5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L7,3 L0,6 Z", fill: f.col }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   34) APPS — três aplicações canônicas como cartões ilustrados.
       Estático: segurança, detecção de engano, edição de conhecimento.
   ============================================================ */
function appsViz(opts) {
  const { w = 400, h = 380, id = "ap" } = opts;
  const apps = [
    { icon: "🛡️", name: "Segurança", col: "#DC2626", desc: "desligar circuitos nocivos" },
    { icon: "🔍", name: "Detecção de engano", col: "#0891B2", desc: "o modelo “sabe” que mente?" },
    { icon: "✏️", name: "Edição de conhecimento", col: "#059669", desc: "corrigir um fato sem retreinar" },
  ];
  const pad = 10, cw = w - pad * 2, ch = 108, gap = 14;
  let g = "";
  apps.forEach((a, i) => {
    const y = pad + i * (ch + gap);
    g += el("rect", { x: pad, y, width: cw, height: ch, rx: 14, fill: "#FCFBFE", stroke: a.col, "stroke-width": 1.5 });
    g += el("rect", { x: pad, y, width: 6, height: ch, rx: 3, fill: a.col });
    g += el("text", { x: pad + 26, y: y + 46, "font-size": 30 }, a.icon);
    g += el("text", { x: pad + 68, y: y + 40, fill: a.col, "font-size": 18, "font-weight": 700 }, a.name);
    g += el("text", { x: pad + 68, y: y + 66, fill: "#3A3A48", "font-size": 14 }, a.desc);
  });
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   35) ATTRIBUTION PATCHING — aproxima o activation patching via
       gradientes. Patching EXATO: 1 forward por componente (lento,
       exato). Attribution: 1 forward + 1 backward → estima TODOS de
       uma vez (rápido, aproximado). Toggle mode: "exact" vs "attr".
   ============================================================ */
function attrPatchSteps(opts) {
  // Passo a passo do attribution patching, com FLUXO HORIZONTAL (forward → à direita,
  // backward ← à esquerda) e um EXEMPLO NUMÉRICO REAL do gradiente.
  const { w = 470, h = 400, id = "aps", step = 0 } = opts;
  let g = "";
  const bx = 24, bw = w - 48;
  // barra de passos no topo
  const steps = ["1 · forward", "2 · backward", "3 · estimativa"];
  const sw = 140, sgap = 10, stotal = steps.length * sw + (steps.length - 1) * sgap, sx0 = (w - stotal) / 2;
  steps.forEach((s, i) => {
    const x = sx0 + i * (sw + sgap), on = i <= step, cur = i === step;
    g += el("rect", { x, y: 8, width: sw, height: 28, rx: 8, fill: cur ? "#6B21A8" : on ? "#F3E8FC" : "#F3F3F5", stroke: on ? "#6B21A8" : "#E4E4EE", "stroke-width": 1.5 });
    g += el("text", { x: x + sw / 2, y: 26, "text-anchor": "middle", fill: cur ? "#fff" : on ? "#6B21A8" : "#A1A1AA", "font-size": 12, "font-weight": 700 }, s);
  });
  // ---- a rede desenhada da ESQUERDA para a DIREITA: entrada → camadas → m ----
  const layTop = 52, rowGap = 34, nRows = 3;
  const colX = [bx + 40, bx + 150, bx + 260];       // 3 camadas (colunas)
  const outX = bx + bw - 34;                          // saída m à direita
  const rowY = (r) => layTop + 18 + r * rowGap;
  const nodeXY = (c, r) => [colX[c], rowY(r)];
  // caixa da métrica m à direita (o "placar")
  const mY = rowY(1);
  g += el("rect", { x: outX - 30, y: mY - 26, width: 60, height: 52, rx: 9, fill: "#FCF7FF", stroke: "#6B21A8", "stroke-width": 2 });
  g += el("text", { x: outX, y: mY - 8, "text-anchor": "middle", fill: "#6B21A8", "font-size": 15, "font-weight": 800 }, "m");
  g += el("text", { x: outX, y: mY + 9, "text-anchor": "middle", fill: "#6B21A8", "font-size": 9 }, "placar");
  g += el("text", { x: outX, y: mY + 20, "text-anchor": "middle", fill: "#6B21A8", "font-size": 9 }, "de Paris");
  // arestas entre colunas (e da última coluna → m)
  for (let c = 0; c < 3; c++) for (let r = 0; r < nRows; r++) {
    const [x1, y1] = nodeXY(c, r);
    if (c < 2) {
      for (let r2 = 0; r2 < nRows; r2++) {
        const [x2, y2] = nodeXY(c + 1, r2);
        let col = "#E4E4EE", wd = 1;
        if (step === 1 && Math.abs(r - r2) <= 1) { col = "#F0B8B8"; wd = 1.4; }
        g += el("line", { x1, y1, x2, y2, stroke: col, "stroke-width": wd, opacity: 0.7 });
      }
    } else {
      g += el("line", { x1, y1, x2: outX - 30, y2: mY, stroke: step === 1 ? "#F0B8B8" : "#E4E4EE", "stroke-width": 1.2, opacity: 0.7 });
    }
  }
  // nós
  for (let c = 0; c < 3; c++) for (let r = 0; r < nRows; r++) {
    const [x, y] = nodeXY(c, r);
    const eff = Math.max(0, 1 - (Math.abs(r - 1) + Math.abs(c - 1)) / 2.6);
    let fill = "#F3F3F5", stroke = "#D8D8DE";
    if (step === 0) { fill = "#EDE7F6"; stroke = "#9333EA"; }
    else if (step === 1) { fill = "#FBEBEB"; stroke = "#DC2626"; }
    else { fill = `rgba(5,150,105,${0.12 + eff * 0.72})`; stroke = eff > 0.4 ? "#059669" : "#C9E8D8"; }
    g += el("circle", { cx: x, cy: y, r: 12, fill, stroke, "stroke-width": 2 });
  }
  // rótulo "aₗ" num nó de exemplo (o componente que vamos acompanhar)
  const exC = 1, exR = 1, [exX, exY] = nodeXY(exC, exR);
  g += el("circle", { cx: exX, cy: exY, r: 12, fill: "none", stroke: "#111", "stroke-width": 2, "stroke-dasharray": "3 2" });
  g += el("text", { x: exX, y: exY - 18, "text-anchor": "middle", fill: "#111", "font-size": 11, "font-weight": 700 }, "componente aₗ");
  // seta de fluxo HORIZONTAL: forward → (esq p/ dir), backward ← (dir p/ esq)
  const flowY = layTop + 3 * rowGap + 6;
  if (step === 0) {
    g += el("line", { x1: bx + 8, y1: flowY, x2: outX, y2: flowY, stroke: "#9333EA", "stroke-width": 3, "marker-end": `url(#aps-fwd-${id})` });
    g += el("text", { x: (bx + outX) / 2, y: flowY - 6, "text-anchor": "middle", fill: "#6B21A8", "font-size": 11, "font-weight": 700 }, "forward  →  (entrada até o placar m)");
  } else if (step === 1) {
    g += el("line", { x1: outX, y1: flowY, x2: bx + 8, y2: flowY, stroke: "#DC2626", "stroke-width": 3, "marker-end": `url(#aps-bwd-${id})` });
    g += el("text", { x: (bx + outX) / 2, y: flowY - 6, "text-anchor": "middle", fill: "#DC2626", "font-size": 11, "font-weight": 700 }, "backward  ←  (m volta pela rede)");
  }
  // ---- painel explicativo embaixo (muda por passo), com EXEMPLO NUMÉRICO ----
  const py = flowY + 22, pinH = 132;
  g += el("rect", { x: bx, y: py, width: bw, height: pinH, rx: 10, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.5 });
  const T = (x, y, t, col, size, wt, style) => el("text", { x, y, fill: col || "#3A3A48", "font-size": size || 12, ...(wt ? { "font-weight": wt } : {}), ...(style ? { "font-style": style } : {}) }, t);
  if (step === 0) {
    g += T(bx + 14, py + 24, "Rodo o prompt uma vez e leio o placar m", "#6B21A8", 12.5, 800);
    g += T(bx + 14, py + 46, "m = quão mais provável o modelo acha “Paris” do que “Roma”.", "#3A3A48", 12);
    // exemplo numérico do placar
    g += el("rect", { x: bx + 14, y: py + 60, width: bw - 28, height: 56, rx: 8, fill: "#F7F7FA" });
    g += T(bx + 28, py + 82, "logit(“Paris”) = 8.2      logit(“Roma”) = 1.5", "#3A3A48", 12, 700);
    g += T(bx + 28, py + 104, "m = 8.2 − 1.5 = ", "#3A3A48", 12.5, 700);
    g += T(bx + 136, py + 104, "6.7", "#059669", 13.5, 800);
    g += T(bx + 170, py + 104, "→ guardo a ativação aₗ de cada peça", "#71717A", 11, null, "italic");
  } else if (step === 1) {
    g += T(bx + 14, py + 24, "Um backward pass → daqui saem os gradientes", "#DC2626", 12.5, 800);
    g += T(bx + 14, py + 46, "o gradiente ∂m/∂aₗ mede: se eu cutucar a ativação aₗ,", "#3A3A48", 12);
    g += T(bx + 14, py + 63, "quanto o placar m sobe ou desce? Um número por peça.", "#3A3A48", 12);
    g += el("rect", { x: bx + 14, y: py + 74, width: bw - 28, height: 46, rx: 8, fill: "#FDF2F2" });
    g += T(bx + 26, py + 92, "⚠ pesos CONGELADOS — não é treino.", "#B91C1C", 12, 800);
    g += T(bx + 26, py + 109, "é o mesmo backward, mas o gradiente é LIDO, não aplicado.", "#8A2B2B", 11);
  } else {
    g += T(bx + 14, py + 24, "Multiplico: gradiente × (quanto aₗ mudaria)", "#059669", 12.5, 800);
    g += T(bx + 14, py + 48, "efeito ≈ ∂m/∂aₗ · (aₗ do corrompido − aₗ do limpo)", "#3A3A48", 12);
    g += el("rect", { x: bx + 14, y: py + 62, width: bw - 28, height: 56, rx: 8, fill: "#F0FAF5" });
    g += T(bx + 28, py + 84, "efeito ≈ 3.0 · (0.1 − 0.9)", "#3A3A48", 12.5, 700);
    g += T(bx + 214, py + 84, "= 3.0 · (−0.8)", "#3A3A48", 12.5, 700);
    g += T(bx + 28, py + 106, "= ", "#3A3A48", 13, 700);
    g += T(bx + 44, py + 106, "−2.4", "#059669", 14, 800);
    g += T(bx + 94, py + 106, "→ patchar essa peça derruba o placar de Paris", "#059669", 10.5, null, "italic");
  }
  const defs =
    el("marker", { id: `aps-fwd-${id}`, markerWidth: 8, markerHeight: 8, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#9333EA" })) +
    el("marker", { id: `aps-bwd-${id}`, markerWidth: 8, markerHeight: 8, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#DC2626" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

function attributionPatching(opts) {
  const { w = 460, h = 360, id = "atp", mode = "exact" } = opts;
  const isAttr = mode === "attr";
  const cols = 5, rows = 4; // grade de componentes (camada × posição)
  const gx = 20, gy = 96, cell = 34, gapc = 8;
  let g = "";
  // título do modo
  g += el("text", { x: w / 2, y: 20, "text-anchor": "middle", fill: isAttr ? "#059669" : "#6B21A8", "font-size": 15, "font-weight": 700 },
    isAttr ? "Attribution patching (aproximado)" : "Activation patching (exato)");
  // custo — chip
  g += el("rect", { x: w / 2 - 118, y: 32, width: 236, height: 26, rx: 13, fill: isAttr ? "#ECFDF5" : "#F3E8FC" });
  g += el("text", { x: w / 2, y: 49, "text-anchor": "middle", fill: isAttr ? "#059669" : "#6B21A8", "font-size": 12.5, "font-weight": 700 },
    isAttr ? "1 forward + 1 backward → todos de uma vez" : `${cols * rows} forward passes (1 por componente)`);
  // grade de componentes
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gx + c * (cell + gapc), y = gy + r * (cell + gapc);
      // efeito "verdadeiro" de cada componente (heatmap) — um pico no meio
      const dist = Math.abs(c - 2) + Math.abs(r - 1.5);
      const effect = Math.max(0, 1 - dist / 4);
      let fill, stroke = "none";
      if (isAttr) {
        // attribution: todos preenchidos de uma vez (heatmap), leve ruído de aproximação
        const approx = Math.min(1, effect * (0.82 + 0.18 * Math.sin(idx * 2.3)));
        fill = effect > 0.05 ? `rgba(5,150,105,${0.15 + approx * 0.75})` : "#F3F3F5";
      } else {
        // exact: só os já "testados" (os 3 primeiros) estão preenchidos; resto vazio (fila)
        if (idx < 3) fill = `rgba(107,33,168,${0.2 + effect * 0.75})`;
        else { fill = "#F7F7FA"; stroke = "#E4E4EE"; }
      }
      g += el("rect", { x, y, width: cell, height: cell, rx: 6, fill, stroke, "stroke-width": stroke === "none" ? 0 : 1 });
      idx++;
    }
  }
  // no modo exact, seta "testando um por um"
  if (!isAttr) {
    const ax = gx + 3 * (cell + gapc) - 4, ay = gy + 1 * (cell + gapc) + cell / 2;
    g += el("text", { x: ax + 2, y: ay + 5, fill: "#6B21A8", "font-size": 18, "font-weight": 700 }, "→");
    g += el("text", { x: gx, y: gy + rows * (cell + gapc) + 18, fill: "#8B8B96", "font-size": 12, "font-style": "italic" }, "testando o próximo… (a fila continua)");
  } else {
    g += el("text", { x: gx, y: gy + rows * (cell + gapc) + 18, fill: "#059669", "font-size": 12, "font-style": "italic" }, "todos estimados de um golpe — mas é aproximação");
  }
  // legenda de heatmap
  const lx = gx + cols * (cell + gapc) + 16, ly = gy + 4;
  g += el("text", { x: lx, y: ly - 2, fill: "#71717A", "font-size": 10.5, "font-weight": 700 }, "efeito");
  for (let k = 0; k < 5; k++) {
    const col = isAttr ? `rgba(5,150,105,${0.2 + k * 0.2})` : `rgba(107,33,168,${0.2 + k * 0.2})`;
    g += el("rect", { x: lx, y: ly + 6 + k * 16, width: 14, height: 14, rx: 3, fill: col });
  }
  g += el("text", { x: lx + 20, y: ly + 18, fill: "#8B8B96", "font-size": 10 }, "alto");
  g += el("text", { x: lx + 20, y: ly + 6 + 4 * 16 + 11, fill: "#8B8B96", "font-size": 10 }, "baixo");
  // --- exemplo REAL: qual previsão está sendo medida + o componente de maior efeito ---
  const taskY = gy + rows * (cell + gapc) + 34;
  g += el("rect", { x: gx, y: taskY, width: w - gx * 2, height: 46, rx: 9, fill: "#FCFBFE", stroke: "#E4E4EE", "stroke-width": 1.5 });
  g += el("text", { x: gx + 12, y: taskY + 17, fill: "#71717A", "font-size": 10, "font-weight": 700, "letter-spacing": "0.03em" }, "MEDINDO O EFEITO SOBRE: “capital da França → Paris”");
  g += el("text", { x: gx + 12, y: taskY + 36, fill: "#3A3A48", "font-size": 12 }, "maior efeito:");
  const hlCol = isAttr ? "#059669" : "#6B21A8";
  g += el("rect", { x: gx + 96, y: taskY + 24, width: 128, height: 18, rx: 5, fill: isAttr ? "#ECFDF5" : "#F3E8FC", stroke: hlCol, "stroke-width": 1.5 });
  g += el("text", { x: gx + 160, y: taskY + 37, "text-anchor": "middle", fill: hlCol, "font-size": 11, "font-weight": 700 }, "head 9.6 (L3)");
  g += el("text", { x: gx + 234, y: taskY + 37, fill: hlCol, "font-size": 11, "font-weight": 700 }, isAttr ? "≈ +0.58 (estim.)" : "= +0.61 (exato)");
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   36) ACDC — Automated Circuit Discovery. Começa com o grafo
       computacional COMPLETO (todas as conexões) e vai PODANDO
       iterativamente as que não importam, até sobrar o circuito.
       step 0 = grafo cheio; step cresce → poda; step final = circuito.
   ============================================================ */
function acdcPrune(opts) {
  const { w = 460, h = 400, id = "acdc", step = 0 } = opts;
  // step 0..3 = poda correta; step 4 = CONTRA-EXEMPLO: cortar uma aresta essencial
  const wrongCut = step >= 4;
  const graphH = h - 96; // reserva espaço embaixo para a caixa da tarefa
  // nós em 3 camadas
  const nodes = [
    { x: 0.5, y: 0.10, lab: "entrada" },
    { x: 0.22, y: 0.40, lab: "h1" }, { x: 0.5, y: 0.40, lab: "h2" }, { x: 0.78, y: 0.40, lab: "h3" },
    { x: 0.30, y: 0.72, lab: "h4" }, { x: 0.70, y: 0.72, lab: "h5" },
    { x: 0.5, y: 0.96, lab: "saída" },
  ];
  // arestas: [de, para, essencial?]  — as essenciais formam o circuito final
  const edges = [
    [0,1,false],[0,2,true],[0,3,false],
    [1,4,false],[2,4,true],[2,5,false],[3,5,false],
    [4,6,true],[5,6,false],
    [1,5,false],[3,4,false],[0,4,false],[2,6,false],
  ];
  const nonEss = edges.filter(e => !e[2]);
  const effStep = wrongCut ? 3 : step; // no contra-exemplo, parte do circuito já podado
  const prunedCount = Math.round((effStep / 3) * nonEss.length);
  let pruned = 0;
  const X = (n) => 20 + n.x * (w - 40);
  const Y = (n) => 16 + n.y * (graphH - 40);
  // no contra-exemplo, a aresta essencial cortada é a [2,4] (h2→h4)
  const cutEss = wrongCut ? [2, 4] : null;
  let g = "";
  edges.forEach((e) => {
    const [a, bIdx, ess] = e;
    let show = true, faded = false;
    if (!ess) {
      if (pruned < prunedCount) { show = false; pruned++; }
      else faded = effStep > 0;
    }
    // contra-exemplo: a aresta essencial cortada aparece tracejada vermelha
    const isCut = cutEss && a === cutEss[0] && bIdx === cutEss[1];
    if (!show && !isCut) return;
    const na = nodes[a], nb = nodes[bIdx];
    if (isCut) {
      g += el("line", { x1: X(na), y1: Y(na) + 13, x2: X(nb), y2: Y(nb) - 13,
        stroke: "#DC2626", "stroke-width": 3, "stroke-dasharray": "5 4", opacity: 0.5 });
      // X vermelho no meio
      const mx = (X(na) + X(nb)) / 2, my = (Y(na) + Y(nb)) / 2;
      g += el("line", { x1: mx - 9, y1: my - 9, x2: mx + 9, y2: my + 9, stroke: "#DC2626", "stroke-width": 3 });
      g += el("line", { x1: mx - 9, y1: my + 9, x2: mx + 9, y2: my - 9, stroke: "#DC2626", "stroke-width": 3 });
      return;
    }
    g += el("line", { x1: X(na), y1: Y(na) + 13, x2: X(nb), y2: Y(nb) - 13,
      stroke: ess ? "#6B21A8" : "#D8D8E0", "stroke-width": ess ? 3 : 1.5,
      opacity: ess ? 1 : (faded ? 0.4 : 0.7) });
  });
  nodes.forEach((n, i) => {
    const isIO = i === 0 || i === nodes.length - 1;
    const inCircuit = [0, 2, 4, 6].includes(i);
    const dim = (effStep >= 3 && !inCircuit);
    g += el("circle", { cx: X(n), cy: Y(n), r: 15,
      fill: isIO ? "#6B21A8" : (dim ? "#F3F3F5" : "#F3E8FC"),
      stroke: dim ? "#D8D8E0" : "#6B21A8", "stroke-width": 2, opacity: dim ? 0.5 : 1 });
    g += el("text", { x: X(n), y: Y(n) + 4, "text-anchor": "middle",
      fill: isIO ? "#fff" : (dim ? "#B8B8C0" : "#6B21A8"), "font-size": 10.5, "font-weight": 700 }, n.lab);
  });
  // banda de estado (logo abaixo do grafo, acima da caixa da tarefa)
  const labels = ["grafo completo — todas as conexões", "podando conexões sem efeito…", "quase lá — restam as que importam", "circuito descoberto ✓"];
  const stateTxt = wrongCut ? "e se cortássemos uma aresta ESSENCIAL?" : labels[Math.min(step, 3)];
  const lcol = wrongCut ? "#DC2626" : (step >= 3 ? "#059669" : "#6B21A8");
  const bandY = graphH + 2;
  g += el("rect", { x: w / 2 - 165, y: bandY, width: 330, height: 22, rx: 11, fill: wrongCut ? "#FEF2F2" : (step >= 3 ? "#ECFDF5" : "#F3E8FC") });
  g += el("text", { x: w / 2, y: bandY + 15, "text-anchor": "middle", fill: lcol, "font-size": 12.5, "font-weight": 700 }, stateTxt);
  // --- exemplo REAL: a tarefa "capital da França → Paris" ---
  const taskY = h - 52;
  const broke = wrongCut;
  const perf = broke ? 0.31 : [1.0, 0.99, 0.98, 0.97][Math.min(step, 3)];
  const pcol = broke ? "#DC2626" : "#059669";
  g += el("rect", { x: 20, y: taskY, width: w - 40, height: 44, rx: 9, fill: "#FCFBFE", stroke: broke ? "#F0C9C9" : "#E4E4EE", "stroke-width": 1.5 });
  g += el("text", { x: 30, y: taskY + 16, fill: "#71717A", "font-size": 10, "font-weight": 700, "letter-spacing": "0.03em" }, "TAREFA: “A capital da França é ___”");
  g += el("rect", { x: 30, y: taskY + 24, width: 150, height: 12, rx: 6, fill: "#EDEDF2" });
  g += el("rect", { x: 30, y: taskY + 24, width: 150 * perf, height: 12, rx: 6, fill: pcol });
  g += el("text", { x: 188, y: taskY + 34, fill: pcol, "font-size": 11, "font-weight": 700 }, `${Math.round(perf * 100)}%`);
  g += el("text", { x: 232, y: taskY + 28, fill: "#3A3A48", "font-size": 12 }, "prevê");
  g += el("rect", { x: 274, y: taskY + 17, width: 62, height: 22, rx: 6, fill: broke ? "#FEF2F2" : "#ECFDF5", stroke: pcol, "stroke-width": 1.5 });
  g += el("text", { x: 305, y: taskY + 32, "text-anchor": "middle", fill: pcol, "font-size": 12, "font-weight": 700 }, broke ? "???" : "Paris ✓");
  const note = broke ? "QUEBROU — era essencial" : (step >= 3 ? "só o essencial" : step > 0 ? "segue igual" : "");
  g += el("text", { x: 346, y: taskY + 32, fill: broke ? "#DC2626" : "#8B8B96", "font-size": 10, "font-weight": broke ? 700 : 400, "font-style": "italic" }, note);
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   37) CAUSAL SCRUBBING — testa se a HIPÓTESE de circuito está certa.
       Se a hipótese diz que só certos caminhos importam, então trocar
       (resample) as ativações IRRELEVANTES por ativações de OUTROS
       inputs não deve derrubar o desempenho. Se derrubar, hipótese
       incompleta. mode: "good" (hipótese certa) vs "bad" (incompleta).
   ============================================================ */
function causalScrubbing(opts) {
  const { w = 460, h = 360, id = "cs", mode = "good" } = opts;
  const bad = mode === "bad";
  let g = "";
  // --- exemplo REAL: a hipótese sobre o circuito de "França → Paris" ---
  g += el("rect", { x: 20, y: 8, width: w - 40, height: 42, rx: 9, fill: "#F5EEFC", stroke: "#9333EA", "stroke-width": 1.5 });
  g += el("text", { x: 32, y: 24, fill: "#6B21A8", "font-size": 10.5, "font-weight": 800, "letter-spacing": ".03em" }, "HIPÓTESE (tarefa “capital da França → Paris”)");
  g += el("text", { x: 32, y: 40, fill: "#3A3A48", "font-size": 12 }, bad
    ? "“basta a cabeça-de-fato” — e ignora o MLP que guarda o país"
    : "“a cabeça-de-fato + o MLP do país importam; o resto, não”");
  // duas colunas de componentes: essenciais (mantidos) e irrelevantes (resampled)
  const comps = bad
    ? [ { lab: "cabeça-de-fato (L9)", keep: true },
        { lab: "MLP do país (troco!)", keep: false },
        { lab: "resto (resample)", keep: false } ]
    : [ { lab: "MLP do país (L5)", keep: true },
        { lab: "cabeça-de-fato (L9)", keep: true },
        { lab: "resto (resample)", keep: false },
        { lab: "resto (resample)", keep: false } ];
  const bx = 30, by = 62, bw = 210, bh = 34, gap = 8;
  comps.forEach((c, i) => {
    const y = by + i * (bh + gap);
    g += el("rect", { x: bx, y, width: bw, height: bh, rx: 8,
      fill: c.keep ? "#F3E8FC" : "#FFF7ED", stroke: c.keep ? "#6B21A8" : "#D97706", "stroke-width": 2 });
    g += el("text", { x: bx + 12, y: y + 22, fill: c.keep ? "#6B21A8" : "#D97706", "font-size": 12.5, "font-weight": 700 }, c.lab);
    if (!c.keep) {
      g += el("text", { x: bx + bw + 12, y: y + 22, fill: "#D97706", "font-size": 15, "font-weight": 700 }, "⇄");
      g += el("rect", { x: bx + bw + 30, y: y + 5, width: 96, height: bh - 10, rx: 6, fill: "#FEF3E2", stroke: "#D97706", "stroke-width": 1.5, "stroke-dasharray": "4 3" });
      g += el("text", { x: bx + bw + 78, y: y + 22, "text-anchor": "middle", fill: "#D97706", "font-size": 10.5, "font-weight": 700 }, "outro texto");
    } else {
      g += el("text", { x: bx + bw + 12, y: y + 22, fill: "#059669", "font-size": 12.5, "font-weight": 700 }, "✓ mantém");
    }
  });
  // medidor: a previsão de "Paris" sobrevive ao scrubbing?
  const perf = bad ? 0.34 : 0.96;
  const barX = bx, barY = by + comps.length * (bh + gap) + 16, barW = w - bx * 2, barH = 26;
  g += el("text", { x: barX, y: barY - 8, fill: "#3A3A48", "font-size": 12.5, "font-weight": 700 }, "ainda prevê “Paris”? (após o scrubbing)");
  g += el("rect", { x: barX, y: barY, width: barW, height: barH, rx: 8, fill: "#EDEDF2" });
  const pcol = perf > 0.8 ? "#059669" : "#DC2626";
  g += el("rect", { x: barX, y: barY, width: barW * perf, height: barH, rx: 8, fill: pcol });
  g += el("text", { x: barX + barW * perf - 8, y: barY + 19, "text-anchor": "end", fill: "#fff", "font-size": 13, "font-weight": 700 }, `${Math.round(perf * 100)}%`);
  // veredito
  const verdict = bad
    ? "caiu → faltava o MLP do país: hipótese INCOMPLETA"
    : "se manteve → a hipótese do circuito se sustenta ✓";
  g += el("text", { x: barX, y: barY + barH + 24, fill: pcol, "font-size": 13, "font-weight": 700 }, verdict);
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}

/* ============================================================
   38) PROBING — treina um classificador LINEAR sobre as ativações
       para testar se uma informação está codificada ali. Mostra
       pontos de 2 classes no espaço de ativação e um hiperplano que
       (mode "yes") separa bem ou (mode "no") não separa.
   ============================================================ */
function probingViz(opts) {
  // Passo a passo do MÉTODO de probing (não o resultado): dataset rotulado → passa pelo
  // modelo (texto vira ativação) → treina o probe → mede acurácia.
  const { w = 440, h = 340, id = "pr", step = 0 } = opts;
  let g = "";
  const pad = 16;
  // dataset rotulado: frases que EU já sei o rótulo (passado/presente)
  const rows = [
    { txt: "Ela viajou a Roma", lab: "passado", col: "#6B21A8" },
    { txt: "Nós comemos cedo",  lab: "passado", col: "#6B21A8" },
    { txt: "O trem parte agora", lab: "presente", col: "#D97706" },
    { txt: "Eu vejo o filme",   lab: "presente", col: "#D97706" },
  ];
  // barra de passos no topo
  const steps = ["1 · dataset", "2 · ativações", "3 · treina probe", "4 · mede"];
  const sw = (w - pad * 2 - 18) / 4, sy = 8;
  steps.forEach((s, i) => {
    const x = pad + i * (sw + 6), on = i <= step, cur = i === step;
    g += el("rect", { x, y: sy, width: sw, height: 26, rx: 7, fill: cur ? "#6B21A8" : on ? "#F3E8FC" : "#F3F3F5", stroke: on ? "#6B21A8" : "#E4E4EE", "stroke-width": 1.3 });
    g += el("text", { x: x + sw / 2, y: sy + 17, "text-anchor": "middle", fill: cur ? "#fff" : on ? "#6B21A8" : "#A1A1AA", "font-size": 10.5, "font-weight": 700 }, s);
  });
  const bodyY = 46;
  // ------- PASSO 1: dataset rotulado (texto + rótulo que já conheço) -------
  if (step === 0) {
    g += el("text", { x: pad, y: bodyY + 8, fill: "#6B21A8", "font-size": 12, "font-weight": 800 }, "Um dataset cujo rótulo eu JÁ conheço");
    g += el("text", { x: pad, y: bodyY + 24, fill: "#71717A", "font-size": 11 }, "(o ground truth — eu que rotulei)");
    rows.forEach((r, i) => {
      const y = bodyY + 40 + i * 40;
      g += el("rect", { x: pad, y, width: w - pad * 2 - 96, height: 30, rx: 7, fill: "#F7F7FA", stroke: "#E4E4EE", "stroke-width": 1 });
      g += el("text", { x: pad + 12, y: y + 19, fill: "#3A3A48", "font-size": 12.5 }, "“" + r.txt + "”");
      g += el("text", { x: w - pad - 84, y: y + 15, fill: "#B8B8C0", "font-size": 14 }, "→");
      g += el("rect", { x: w - pad - 66, y: y + 3, width: 66, height: 24, rx: 6, fill: r.col + "1A", stroke: r.col, "stroke-width": 1.3 });
      g += el("text", { x: w - pad - 33, y: y + 19, "text-anchor": "middle", fill: r.col, "font-size": 11.5, "font-weight": 700 }, r.lab);
    });
  }
  // ------- PASSO 2: cada frase passa pelo modelo → vira ATIVAÇÃO -------
  else if (step === 1) {
    g += el("text", { x: pad, y: bodyY + 8, fill: "#6B21A8", "font-size": 12, "font-weight": 800 }, "Passo cada frase pelo modelo");
    g += el("text", { x: pad, y: bodyY + 24, fill: "#71717A", "font-size": 11 }, "a entrada do probe NÃO é texto — é a ativação da camada");
    const midY = bodyY + 90;
    // frase
    g += el("rect", { x: pad, y: midY - 16, width: 120, height: 32, rx: 7, fill: "#F7F7FA", stroke: "#E4E4EE", "stroke-width": 1 });
    g += el("text", { x: pad + 60, y: midY + 4, "text-anchor": "middle", fill: "#3A3A48", "font-size": 11.5 }, "“Ela viajou…”");
    // modelo
    const mx = pad + 150;
    g += el("path", { d: `M ${pad + 122} ${midY} L ${mx - 4} ${midY}`, stroke: "#B8B8C0", "stroke-width": 2, "marker-end": `url(#pr-ar-${id})` });
    g += el("rect", { x: mx, y: midY - 26, width: 92, height: 52, rx: 9, fill: "#EDE7F6", stroke: "#9333EA", "stroke-width": 1.5 });
    g += el("text", { x: mx + 46, y: midY - 4, "text-anchor": "middle", fill: "#6B21A8", "font-size": 11, "font-weight": 700 }, "modelo");
    g += el("text", { x: mx + 46, y: midY + 12, "text-anchor": "middle", fill: "#6B21A8", "font-size": 9.5 }, "camada 10");
    // ativação (vetor de números)
    const ax = mx + 92 + 30;
    g += el("path", { d: `M ${mx + 92} ${midY} L ${ax - 4} ${midY}`, stroke: "#B8B8C0", "stroke-width": 2, "marker-end": `url(#pr-ar-${id})` });
    g += el("rect", { x: ax, y: midY - 30, width: 92, height: 60, rx: 8, fill: "#FCFBFE", stroke: "#6B21A8", "stroke-width": 1.5 });
    g += el("text", { x: ax + 46, y: midY - 15, "text-anchor": "middle", fill: "#6B21A8", "font-size": 9.5, "font-weight": 700 }, "ativação h");
    ["0.7", "-1.2", "0.3", "…"].forEach((v, i) => {
      g += el("text", { x: ax + 46, y: midY - 1 + i * 12, "text-anchor": "middle", fill: "#71717A", "font-size": 9.5 }, v);
    });
    g += el("text", { x: pad, y: bodyY + 190, fill: "#3A3A48", "font-size": 11.5, "font-style": "italic" }, "agora o dataset é: (ativação h, rótulo) — repito para todas as frases");
  }
  // ------- PASSO 3: treina um classificador linear sobre as ativações -------
  else if (step === 2) {
    g += el("text", { x: pad, y: bodyY + 8, fill: "#6B21A8", "font-size": 12, "font-weight": 800 }, "Treino um classificador simples");
    g += el("text", { x: pad, y: bodyY + 24, fill: "#71717A", "font-size": 11 }, "ativação → probe → palpite; erra, ajusta os pesos, repete" );
    const midY = bodyY + 92;
    // h
    g += el("rect", { x: pad, y: midY - 18, width: 74, height: 36, rx: 7, fill: "#FCFBFE", stroke: "#6B21A8", "stroke-width": 1.5 });
    g += el("text", { x: pad + 37, y: midY + 5, "text-anchor": "middle", fill: "#6B21A8", "font-size": 12, "font-weight": 700 }, "ativação h");
    // probe
    const px = pad + 104;
    g += el("path", { d: `M ${pad + 76} ${midY} L ${px - 4} ${midY}`, stroke: "#B8B8C0", "stroke-width": 2, "marker-end": `url(#pr-ar-${id})` });
    g += el("rect", { x: px, y: midY - 22, width: 88, height: 44, rx: 9, fill: "#E3F5FA", stroke: "#0891B2", "stroke-width": 1.5 });
    g += el("text", { x: px + 44, y: midY - 2, "text-anchor": "middle", fill: "#0369A1", "font-size": 11.5, "font-weight": 700 }, "probe");
    g += el("text", { x: px + 44, y: midY + 12, "text-anchor": "middle", fill: "#0369A1", "font-size": 9 }, "linear");
    // palpite vs verdade
    const gx = px + 88 + 26;
    g += el("path", { d: `M ${px + 88} ${midY} L ${gx - 4} ${midY}`, stroke: "#B8B8C0", "stroke-width": 2, "marker-end": `url(#pr-ar-${id})` });
    g += el("rect", { x: gx, y: midY - 20, width: 96, height: 40, rx: 8, fill: "#FEF2F2", stroke: "#DC2626", "stroke-width": 1.5 });
    g += el("text", { x: gx + 48, y: midY - 4, "text-anchor": "middle", fill: "#DC2626", "font-size": 10.5, "font-weight": 700 }, "diz: presente");
    g += el("text", { x: gx + 48, y: midY + 11, "text-anchor": "middle", fill: "#6B21A8", "font-size": 10.5 }, "era: passado");
    // loop de ajuste
    g += el("path", { d: `M ${px + 44} ${midY + 22} C ${px + 44} ${midY + 54}, ${pad + 37} ${midY + 54}, ${pad + 37} ${midY + 20}`,
      fill: "none", stroke: "#DC2626", "stroke-width": 1.8, "stroke-dasharray": "4 3", "marker-end": `url(#pr-ar-${id})` });
    g += el("text", { x: (px + pad) / 2 + 4, y: midY + 66, "text-anchor": "middle", fill: "#DC2626", "font-size": 10.5, "font-style": "italic" }, "erro → ajusta os pesos → repete milhares de vezes");
  }
  // ------- PASSO 4: mede a acurácia num conjunto de teste -------
  else {
    g += el("text", { x: pad, y: bodyY + 8, fill: "#6B21A8", "font-size": 12, "font-weight": 800 }, "Meço a acurácia em frases novas");
    g += el("text", { x: pad, y: bodyY + 24, fill: "#71717A", "font-size": 11 }, "predição do probe  vs  rótulo verdadeiro");
    const acc = 0.94;
    const bx = pad, byy = bodyY + 52, bw = w - pad * 2, bh = 30;
    g += el("rect", { x: bx, y: byy, width: bw, height: bh, rx: 8, fill: "#EDEDF2" });
    g += el("rect", { x: bx, y: byy, width: bw * acc, height: bh, rx: 8, fill: "#059669" });
    g += el("text", { x: bx + bw * acc - 10, y: byy + 20, "text-anchor": "end", fill: "#fff", "font-size": 14, "font-weight": 800 }, "94%");
    g += el("text", { x: bx, y: byy + 58, fill: "#059669", "font-size": 13, "font-weight": 800 }, "acurácia alta →");
    g += el("text", { x: bx, y: byy + 78, fill: "#3A3A48", "font-size": 12.5 }, "a noção de “tempo verbal” ESTÁ codificada nesta camada.");
    g += el("rect", { x: bx, y: byy + 92, width: bw, height: 40, rx: 8, fill: "#FEF9F0", stroke: "#E5C889", "stroke-width": 1.2 });
    g += el("text", { x: bx + 12, y: byy + 108, fill: "#B45309", "font-size": 11, "font-weight": 700 }, "cuidado:");
    g += el("text", { x: bx + 12, y: byy + 124, fill: "#8A5A1B", "font-size": 11 }, "codificado ≠ o modelo realmente USAR essa informação.");
  }
  const defs = el("marker", { id: `pr-ar-${id}`, markerWidth: 8, markerHeight: 8, refX: 5, refY: 3, orient: "auto", markerUnits: "strokeWidth" }, el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#B8B8C0" }));
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, el("defs", {}, defs) + g);
}

/* ============================================================
   39) DIRECT LOGIT ATTRIBUTION (DLA) — decompõe o logit final do
       token correto na contribuição ADITIVA de cada componente.
       Barras divergentes: quem empurra a favor (verde) e contra
       (vermelho) a previsão "Paris".
   ============================================================ */
function dlaViz(opts) {
  const { w = 440, h = 340, id = "dla", sel = 0 } = opts;
  const comps = [
    { name: "head 9.6 (mover)", v: 0.62 },
    { name: "head 10.2", v: 0.28 },
    { name: "MLP 11", v: 0.14 },
    { name: "head 8.1", v: -0.09 },
    { name: "head 7.4", v: -0.18 },
  ];
  const c = comps[sel];
  let g = "";
  // === painel superior: o MÉTODO para o componente selecionado ===
  const pad = 14;
  g += el("rect", { x: pad, y: 6, width: w - pad * 2, height: 92, rx: 10, fill: "#FCFBFE", stroke: "#9333EA", "stroke-width": 1.5 });
  g += el("text", { x: pad + 12, y: 24, fill: "#6B21A8", "font-size": 11, "font-weight": 800, "letter-spacing": ".03em" }, "COMO SE MEDE (para " + c.name + ")");
  // saída do componente (vetor)
  g += el("rect", { x: pad + 12, y: 34, width: 96, height: 30, rx: 6, fill: "#EDE7F6", stroke: "#9333EA", "stroke-width": 1.3 });
  g += el("text", { x: pad + 60, y: 47, "text-anchor": "middle", fill: "#6B21A8", "font-size": 10, "font-weight": 700 }, "saída do");
  g += el("text", { x: pad + 60, y: 59, "text-anchor": "middle", fill: "#6B21A8", "font-size": 10, "font-weight": 700 }, "componente");
  g += el("text", { x: pad + 118, y: 53, "text-anchor": "middle", fill: "#3A3A48", "font-size": 15, "font-weight": 700 }, "·");
  // direção do token Potter (unembedding)
  g += el("rect", { x: pad + 130, y: 34, width: 104, height: 30, rx: 6, fill: "#FCE7F3", stroke: "#DB2777", "stroke-width": 1.3 });
  g += el("text", { x: pad + 182, y: 47, "text-anchor": "middle", fill: "#9D174D", "font-size": 10, "font-weight": 700 }, "direção “Paris”");
  g += el("text", { x: pad + 182, y: 59, "text-anchor": "middle", fill: "#9D174D", "font-size": 10, "font-weight": 700 }, "(unembedding)");
  g += el("text", { x: pad + 244, y: 53, "text-anchor": "middle", fill: "#3A3A48", "font-size": 15, "font-weight": 700 }, "=");
  // resultado
  const rc = c.v >= 0 ? "#059669" : "#DC2626";
  g += el("rect", { x: pad + 256, y: 34, width: 80, height: 30, rx: 6, fill: c.v >= 0 ? "#ECFDF5" : "#FEF2F2", stroke: rc, "stroke-width": 1.8 });
  g += el("text", { x: pad + 296, y: 54, "text-anchor": "middle", fill: rc, "font-size": 15, "font-weight": 800 }, (c.v >= 0 ? "+" : "") + c.v.toFixed(2));
  g += el("text", { x: pad + 12, y: 84, fill: "#71717A", "font-size": 10.5, "font-style": "italic" }, "projeta a saída do componente na direção do token → seu voto no logit");
  // === gráfico de barras (todos os componentes) — clicável ===
  const top = 128, rowH = 30, gap = 9, midX = pad + (w - pad * 2) * 0.46, scale = 150;
  g += el("text", { x: pad, y: top - 14, fill: "#71717A", "font-size": 11, "font-weight": 700, "letter-spacing": "0.03em" }, "VOTO DE CADA COMPONENTE NO LOGIT DE “Paris”");
  g += el("line", { x1: midX, y1: top - 2, x2: midX, y2: top + comps.length * (rowH + gap) - gap + 2, stroke: "#C9C9D4", "stroke-width": 1.5 });
  comps.forEach((cc, i) => {
    const y = top + i * (rowH + gap);
    const pos = cc.v >= 0, barW = Math.abs(cc.v) * scale, bx = pos ? midX : midX - barW;
    const isSel = i === sel;
    const col = pos ? "#059669" : "#DC2626";
    g += `<g class="dla-row" data-dla="${id}" data-i="${i}" style="cursor:pointer">`;
    // faixa de seleção
    g += el("rect", { x: pad, y: y - 3, width: w - pad * 2, height: rowH + 6, rx: 6, fill: isSel ? "#F3E8FC" : "transparent" });
    g += el("rect", { x: bx, y, width: barW, height: rowH, rx: 6, fill: col, opacity: isSel ? 1 : 0.55, stroke: isSel ? col : "none", "stroke-width": 2 });
    if (pos) g += el("text", { x: midX - 10, y: y + rowH / 2 + 4, "text-anchor": "end", fill: "#3A3A48", "font-size": 11.5, "font-weight": isSel ? 700 : 600 }, cc.name);
    else g += el("text", { x: midX + 10, y: y + rowH / 2 + 4, fill: "#3A3A48", "font-size": 11.5, "font-weight": isSel ? 700 : 600 }, cc.name);
    g += el("text", { x: pos ? bx + barW + 6 : bx - 6, y: y + rowH / 2 + 4, "text-anchor": pos ? "start" : "end", fill: col, "font-size": 11.5, "font-weight": 700 }, (pos ? "+" : "") + cc.v.toFixed(2));
    g += `</g>`;
  });
  const ly = top + comps.length * (rowH + gap) + 6;
  g += el("text", { x: pad, y: ly + 4, fill: "#059669", "font-size": 11, "font-weight": 700 }, "→ a favor de Paris");
  g += el("text", { x: w - pad, y: ly + 4, "text-anchor": "end", fill: "#DC2626", "font-size": 11, "font-weight": 700 }, "contra ←");
  return el("svg", { viewBox: `0 0 ${w} ${h}`, class: "viz", id }, g);
}
