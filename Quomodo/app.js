/* TrueScan: plain camera view, YOLOv8 runs silently in the browser,
   info pops up only when a known product (Celsius) is detected. */

const params = new URLSearchParams(location.search);
const CFG = {
  modelUrl: window.MODEL_URL || "model/best.onnx",
  classNames: ["Celsius energy drink"],      // order must match best.pt names
  inputSize: 640,
  conf: parseFloat(params.get("conf") || "0.30"), // min score for a frame to count as a hit
  minBoxH: 0.18,          // box must be at least 18% of the frame tall (cuts tiny false hits)
  window: 8,              // look at the last N frames...
  needHits: 4,            // ...and need this many hits to trigger
  rearmAbsentMs: 1200,    // after closing, the can must leave view this long before it can pop again
  rearmMaxMs: 6000,       // or re-arm anyway after this long
  debug: params.has("debug")
};

/* ---------------- Navigation ---------------- */
const screens = { home: $("#screen-home"), scan: $("#screen-scan"), news: $("#screen-news") };
const tabs = [...document.querySelectorAll(".tab")];
let current = "home";

function $(s) { return document.querySelector(s); }

function go(name) {
  if (name === current) return;
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("active", k === name));
  tabs.forEach(t => t.classList.toggle("active", t.dataset.screen === name));
  if (current === "scan") stopCamera();
  current = name;
  if (name === "scan") startScanner();
}
tabs.forEach(t => t.addEventListener("click", () => go(t.dataset.screen)));
$("#btn-start").addEventListener("click", () => go("scan"));

/* ---------------- Camera + model ---------------- */
const video = $("#cam");
const work = $("#work");
const wctx = work.getContext("2d", { willReadFrequently: true });
const hint = $("#scan-hint");
let stream = null, session = null, modelPromise = null;
let running = false, busy = false;
let history = [];
let state = "searching";          // searching | showing | cooldown
let cooldownStart = 0, lastHitAt = 0;
let hintTimer = null;

function setStatus(text) { $("#status-text").textContent = text; }
function setHint(text, autoHideMs) {
  hint.textContent = text;
  hint.classList.remove("hide");
  clearTimeout(hintTimer);
  if (autoHideMs) hintTimer = setTimeout(() => hint.classList.add("hide"), autoHideMs);
}

function loadModel() {
  if (!modelPromise) {
    // The engine's .wasm is fetched from our own files. Its small JS loader comes from
    // vendor/ locally, or from window.ORT_MJS_URL when the page sets one (shared link).
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
    ort.env.wasm.wasmPaths = { mjs: window.ORT_MJS_URL || new URL("vendor/ort-wasm-simd-threaded.mjs", location.href).href };
    modelPromise = fetch("vendor/ort-wasm-simd-threaded.wasm")
      .then(r => { if (!r.ok) throw new Error("engine " + r.status); return r.arrayBuffer(); })
      .then(buf => { ort.env.wasm.wasmBinary = buf; return ort.InferenceSession.create(CFG.modelUrl, { executionProviders: ["wasm"] }); });
  }
  return modelPromise;
}

async function startScanner() {
  setHint("Starting camera…");
  showPhotoMode(false);
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera api");
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
  } catch (e) {
    // No live camera here (blocked, or a shared link that can't use it): scan a photo instead
    showPhotoMode(true);
    setStatus("Photo mode");
    hint.classList.add("hide");
    if (!session) loadModel().then(s => { session = s; }).catch(modelFailed);
    return;
  }
  video.srcObject = stream;
  await video.play().catch(() => {});

  if (!session) {
    setHint("Loading scanner…"); setStatus("Loading");
    try { session = await loadModel(); }
    catch (e) { modelFailed(e); return; }
  }
  if (current !== "scan") return;
  setHint("Point at a product", 2500); setStatus("Scanning");
  history = [];
  running = true;
  loop();
}

function stopCamera() {
  running = false;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  video.srcObject = null;
  closeSheet(true);
}

function loop() {
  if (!running) return;
  if (!busy && state !== "showing" && video.readyState >= 2) {
    busy = true;
    detect().catch(err => console.error(err)).finally(() => { busy = false; });
  }
  requestAnimationFrame(loop);
}

function modelFailed(e) {
  console.error(e);
  setHint("The scanner couldn't load. Check your connection and reload.");
}

// Letterbox a video frame or photo into a 640x640 tensor (same as Ultralytics preprocessing)
function preprocess(src, vw, vh) {
  const S = CFG.inputSize;
  const scale = Math.min(S / vw, S / vh);
  const nw = Math.round(vw * scale), nh = Math.round(vh * scale);
  const dx = (S - nw) / 2, dy = (S - nh) / 2;
  wctx.fillStyle = "rgb(114,114,114)";
  wctx.fillRect(0, 0, S, S);
  wctx.drawImage(src, dx, dy, nw, nh);
  const { data } = wctx.getImageData(0, 0, S, S);
  const area = S * S;
  const f = new Float32Array(3 * area);
  for (let i = 0, p = 0; i < area; i++, p += 4) {
    f[i] = data[p] / 255;
    f[i + area] = data[p + 1] / 255;
    f[i + 2 * area] = data[p + 2] / 255;
  }
  return { tensor: new ort.Tensor("float32", f, [1, 3, S, S]), nh };
}

async function scoreFrame(src, w, h) {
  const { tensor, nh } = preprocess(src, w, h);
  const out = await session.run({ [session.inputNames[0]]: tensor });
  const o = out[session.outputNames[0]];
  const [, rows, N] = o.dims;            // [1, 4 + classes, 8400]
  const d = o.data;
  const nc = rows - 4;

  let best = 0, bestCls = -1, bestH = 0;
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < nc; c++) {
      const s = d[(4 + c) * N + i];
      if (s > best) { best = s; bestCls = c; bestH = d[3 * N + i]; }
    }
  }
  const tallEnough = bestH / nh >= CFG.minBoxH;
  const hit = best >= CFG.conf && tallEnough;
  if (CFG.debug) setHint(`score ${best.toFixed(2)} · h ${(bestH / nh).toFixed(2)} ${hit ? "HIT" : ""}`);
  return { hit, bestCls, best };
}

async function detect() {
  const { hit, bestCls } = await scoreFrame(video, video.videoWidth, video.videoHeight);
  const now = performance.now();
  if (hit) lastHitAt = now;

  if (state === "cooldown") {
    const absentLongEnough = now - lastHitAt > CFG.rearmAbsentMs;
    if (absentLongEnough || now - cooldownStart > CFG.rearmMaxMs) { state = "searching"; history = []; }
    return;
  }

  history.push(hit ? bestCls : -1);
  if (history.length > CFG.window) history.shift();
  const counts = {};
  history.forEach(c => { if (c >= 0) counts[c] = (counts[c] || 0) + 1; });
  const winner = Object.keys(counts).find(c => counts[c] >= CFG.needHits);
  if (winner !== undefined) onDetected(CFG.classNames[winner]);
}

/* ---------------- Photo mode (no live camera) ---------------- */
const photoBox = $("#photo-mode"), photoInput = $("#photo-input"), photoImg = $("#photo-img"), photoMsg = $("#photo-msg");

function showPhotoMode(on) {
  photoBox.hidden = !on;
  video.hidden = on;
  if (!on) { photoImg.hidden = true; photoImg.removeAttribute("src"); }
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];
  photoInput.value = "";
  if (!file) return;
  photoImg.src = URL.createObjectURL(file);
  photoImg.hidden = false;
  photoMsg.textContent = "Scanning photo…";
  try {
    await photoImg.decode();
    if (!session) session = await loadModel();
    // One photo, so a single confident frame is enough (slightly lower bar than live video)
    const { best, bestCls } = await scoreFrame(photoImg, photoImg.naturalWidth, photoImg.naturalHeight);
    if (best >= CFG.conf * 0.85 && bestCls >= 0) {
      photoMsg.textContent = "Take another photo";
      state = "searching";
      onDetected(CFG.classNames[bestCls]);
    } else {
      photoMsg.textContent = "No product found. Get closer, with the label facing the camera, and try again.";
    }
  } catch (e) {
    modelFailed(e);
    photoMsg.textContent = "The scanner couldn't load. Reload the page and try again.";
  }
});

/* ---------------- Result sheet ---------------- */
const sheet = $("#sheet");
const btnExpand = $("#btn-expand");
let lastProduct = null;

function onDetected(className, opts = {}) {
  const p = window.PRODUCTS[className];
  if (!p) return;
  state = "showing";
  lastProduct = p;
  renderProduct(p);
  updateNews(p);
  hint.classList.add("hide");
  if (!opts.quiet) {
    if (navigator.vibrate) navigator.vibrate([40, 40, 60]);
    const flash = $("#flash"), toast = $("#toast");
    flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
    toast.textContent = `${p.short || p.name} spotted!`;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
    saveRecent(className, p);
  }
  setTimeout(() => openSheet(), opts.quiet ? 0 : 450);
}

function openSheet() {
  if (state !== "showing") return;
  sheet.classList.remove("expanded");
  btnExpand.setAttribute("aria-expanded", "false");
  btnExpand.querySelector("span").textContent = "Show full details";
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
}

function closeSheet(silent) {
  sheet.classList.remove("open", "expanded");
  sheet.setAttribute("aria-hidden", "true");
  if (state === "showing") {
    state = "cooldown";
    cooldownStart = performance.now();
    lastHitAt = cooldownStart;
    history = [];
  }
  if (!silent && running) setHint("Point at a product", 2000);
}

$("#btn-close").addEventListener("click", () => closeSheet(false));
btnExpand.addEventListener("click", () => {
  const exp = sheet.classList.toggle("expanded");
  btnExpand.setAttribute("aria-expanded", String(exp));
  btnExpand.querySelector("span").textContent = exp ? "Hide details" : "Show full details";
  if (exp) sheet.scrollTop = 0;
});
$("#sheet-grab").addEventListener("click", () => btnExpand.click());

document.querySelectorAll(".seg-btn").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".seg-btn").forEach(x => x.classList.toggle("active", x === b));
  document.querySelectorAll(".pane").forEach(x => x.classList.toggle("active", x.id === "pane-" + b.dataset.pane));
}));

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function srcLink(url, label) {
  return url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">Source${label ? ": " + esc(label) : ""} ↗</a>` : "";
}
function issueCard(x) {
  return `<div class="card"><div class="card-top"><div><h4>${esc(x.title)}</h4><div class="when">${esc(x.when)}</div></div>
    <span class="badge ${x.badge}">${esc(x.badgeLabel)}</span></div><p>${esc(x.text)}</p>${srcLink(x.src)}</div>`;
}

function renderProduct(p) {
  $("#prod-name").textContent = p.name;
  $("#prod-sub").textContent = p.sub;
  const sc = trustScore(p);
  const g = $("#grade");
  g.textContent = sc.grade; g.className = "grade " + sc.grade;
  $("#score-line").textContent = `Trust score ${sc.score}/100 · ${sc.word}`;

  const disputed = p.claims.filter(c => c.verdict !== "true").length;
  $("#chips").innerHTML = `
    <div class="chip ${disputed ? "warn" : "ok"}"><b>${disputed}/${p.claims.length}</b><span>claims disputed</span></div>
    <div class="chip ${p.lawsuits.length ? "bad" : "ok"}"><b>${p.lawsuits.length}</b><span>lawsuits</span></div>
    <div class="chip ${p.recalls.length ? "bad" : "ok"}"><b>${p.recalls.length}</b><span>recalls</span></div>`;

  $("#pane-claims").innerHTML = p.claims.map(c => `
    <div class="card"><div class="card-top"><h4>${esc(c.claim)}</h4><span class="badge ${c.verdict}">${esc(c.verdictLabel)}</span></div>
    <p>${esc(c.text)}</p>${srcLink(c.src, c.srcLabel)}</div>`).join("") + `
    <details class="how"><summary>How the trust grade works</summary>
    <ul><li>Starts at 100</li><li>−10 for each claim that is false, dropped or misleading</li>
    <li>−6 for each settled or lost lawsuit, −3 for each pending one</li><li>−10 for each recall</li><li>−10 if the pack shrank (shrinkflation)</li></ul>
    <p style="margin-top:6px">This product: ${sc.score}/100, grade ${sc.grade}. A: 80+, B: 65+, C: 50+, D: 35+, F: under 35.</p></details>`;

  $("#pane-issues").innerHTML =
    `<div class="group-label">Lawsuits &amp; ethics</div>` + p.lawsuits.map(issueCard).join("") +
    `<div class="group-label">Recalls</div>` + p.recalls.map(issueCard).join("") +
    `<div class="group-label">Shrinkflation</div>` + issueCard(p.shrinkflation);

  const node = (t) => `<li><div class="node ${t.root ? "root" : ""} ${t.scanned ? "scanned" : ""}">
      <div class="n">${esc(t.n)}${t.scanned ? " · you scanned this" : ""}</div><div class="r">${esc(t.r)}</div></div>
      ${t.children ? `<ul>${t.children.map(node).join("")}</ul>` : ""}</li>`;
  $("#pane-tree").innerHTML =
    `<div class="group-label">Ownership</div><ul class="tree">${node(p.tree)}</ul>` +
    `<div class="group-label">Major shareholders &amp; partners</div>` +
    p.stakeholders.map(s => `<div class="node side"><div class="n">${esc(s.n)}</div><div class="r">${esc(s.r)}</div></div>`).join("") +
    srcLink(p.treeSrc, "FoodNavigator, Sep 2025");
}

/* ---------------- Trust score ---------------- */
function trustScore(p) {
  let s = 100;
  s -= 10 * p.claims.filter(c => c.verdict !== "true").length;
  p.lawsuits.forEach(l => { s -= l.badge === "info" ? 3 : 6; });
  s -= 10 * p.recalls.length;
  if (p.shrinkflation && p.shrinkflation.badge !== "true") s -= 10;
  s = Math.max(0, Math.min(100, s));
  const grade = s >= 80 ? "A" : s >= 65 ? "B" : s >= 50 ? "C" : s >= 35 ? "D" : "F";
  const word = { A: "Trustworthy", B: "Mostly fair", C: "Mixed record", D: "Be careful", F: "Poor record" }[grade];
  return { score: s, grade, word };
}

/* ---------------- Recent scans (this browser only) ---------------- */
const RECENT_KEY = "quomodo.recent";
function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } }
function saveRecent(className, p) {
  const list = loadRecent().filter(r => r.cls !== className);
  list.unshift({ cls: className, at: Date.now() });
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6))); } catch {}
  renderRecent();
}
function timeAgo(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now"; if (m < 60) return m + " min ago";
  const h = Math.round(m / 60); if (h < 24) return h + " h ago";
  return Math.round(h / 24) + " d ago";
}
function renderRecent() {
  const list = loadRecent().filter(r => window.PRODUCTS[r.cls]);
  $("#recent-count").textContent = list.length ? list.length + " saved" : "";
  $("#recent").innerHTML = list.length ? list.map(r => {
    const p = window.PRODUCTS[r.cls], sc = trustScore(p);
    return `<button class="recent-item" data-cls="${esc(r.cls)}">
      <span class="grade ${sc.grade}">${sc.grade}</span>
      <span><span class="ri-name" style="display:block">${esc(p.name)}</span><span class="ri-sub">${esc(sc.word)} · ${timeAgo(r.at)}</span></span>
      <svg class="chev" viewBox="0 0 24 24" width="20" height="20"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>`;
  }).join("") : `<div class="empty">Nothing scanned yet. Tap <b>Start scanning</b> and point at a Celsius can to try it.</div>`;
  document.querySelectorAll(".recent-item").forEach(b => b.addEventListener("click", () => {
    go("scan");
    onDetected(b.dataset.cls, { quiet: true });
  }));
}
renderRecent();

/* ---------------- News ---------------- */
const ICONS = {
  trend: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 17l6-6 4 4 7-8M15 7h5v5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  recipe: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M6 3h12l-2 18H8zM6.5 8h11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 3l3-2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  alert: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 3l10 18H2z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'
};
function updateNews(p) {
  const term = p ? p.searchTerm : "food and beverage";
  const q = encodeURIComponent;
  const items = [
    { cls: "trends", ico: ICONS.trend, title: "Trends",
      desc: p ? `Latest news and trends about ${p.name}` : "What's trending in food and drinks",
      url: `https://news.google.com/search?q=${q(term + " trends")}` },
    { cls: "recipes", ico: ICONS.recipe, title: "Recipes",
      desc: p ? `Mocktails and recipes using ${p.name}` : "Healthy drink and snack recipes",
      url: `https://www.google.com/search?q=${q((p ? term + " mocktail" : "healthy drink") + " recipes")}` },
    { cls: "recalls", ico: ICONS.alert, title: "Recalls",
      desc: p ? `Official recall notices for ${p.name} (Health Canada)` : "Official food recalls (Health Canada)",
      url: p ? `https://recalls-rappels.canada.ca/en/search/site?search_api_fulltext=${q(p.searchTerm.split(" ")[0])}`
             : "https://recalls-rappels.canada.ca/en" }
  ];
  $("#news-context").textContent = p ? `Tailored to your last scan: ${p.name}.` : "Food and drink news. Scan a product to tailor these.";
  $("#news-list").innerHTML = items.map(i => `
    <a class="news-card ${i.cls}" href="${i.url}" target="_blank" rel="noopener">
      <div class="news-ico">${i.ico}</div>
      <div><h3>${i.title}</h3><p>${esc(i.desc)}</p></div>
      <svg class="arrow" viewBox="0 0 24 24" width="22" height="22"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>`).join("");
}
updateNews(null);

// Backup for live demos: press "D" on the scan screen to force the pop-up.
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "d" && current === "scan" && state !== "showing") onDetected(CFG.classNames[0]);
});

// Start loading the model in the background so the first scan is fast
loadModel().then(s => { session = s; }).catch(() => {});
