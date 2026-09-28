const pictures = [
  { name: "Snowy Stars", key: "pictures/winter-01.png", file: "pictures/winter-01.png" },
  { name: "Snow Friend", key: "pictures/winter-02.png", file: "pictures/winter-02.png" },
  { name: "Sleigh Ride", key: "pictures/winter-03.png", file: "pictures/winter-03.png" },
  { name: "Star Magic", key: "pictures/winter-04.png", file: "pictures/winter-04.png" },
  { name: "Polar Bear", key: "pictures/winter-05.png", file: "pictures/winter-05.png" },
  { name: "Cozy Window", key: "pictures/winter-06.png", file: "pictures/winter-06.png" },
  { name: "Ice Skating", key: "pictures/winter-07.png", file: "pictures/winter-07.png" },
  { name: "Star Lantern", key: "pictures/winter-08.png", file: "pictures/winter-08.png" },
  { name: "Snow Deer", key: "pictures/winter-09.png", file: "pictures/winter-09.png" },
  { name: "Winter Party", key: "pictures/winter-10.png", file: "pictures/winter-10.png" },
  { name: "Happy Cat", key: "pictures/animal-cat.svg", file: "pictures/animal-cat.svg" },
  { name: "Happy Dog", key: "pictures/animal-dog.svg", file: "pictures/animal-dog.svg" },
  { name: "Happy Bunny", key: "pictures/animal-bunny.svg", file: "pictures/animal-bunny.svg" },
  { name: "Happy Bear", key: "pictures/animal-bear.svg", file: "pictures/animal-bear.svg" },
  { name: "Happy Elephant", key: "pictures/animal-elephant.svg", file: "pictures/animal-elephant.svg" },
  { name: "Happy Giraffe", key: "pictures/animal-giraffe.svg", file: "pictures/animal-giraffe.svg" },
  { name: "Happy Lion", key: "pictures/animal-lion.svg", file: "pictures/animal-lion.svg" },
  { name: "Happy Turtle", key: "pictures/animal-turtle.svg", file: "pictures/animal-turtle.svg" },
  { name: "Happy Owl", key: "pictures/animal-owl.svg", file: "pictures/animal-owl.svg" },
  { name: "Happy Dolphin", key: "pictures/animal-dolphin.svg", file: "pictures/animal-dolphin.svg" },
  { name: "My Plush Cat", key: "pictures/plush-cat-ipad-fixed.png", file: "pictures/plush-cat-ipad-fixed.png" }
];

const quickColors = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff"];
const colors = ["#1c1c1e", "#636366", "#ffffff", "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#30b0c7", "#007aff", "#5856d6", "#af52de", "#ff2d55", "#a2845e", "#8b5a2b", "#f7a8b8", "#9ad5ff", "#b7eaad", "#ffd6a0", "#d7c3ff", "#6b4f3a"];

const galleryView = document.getElementById("galleryView");
const coloringView = document.getElementById("coloringView");
const gallery = document.getElementById("gallery");
const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });
const lineArt = document.getElementById("lineArt");
const artboard = document.getElementById("artboard");
const workspace = document.querySelector(".workspace");
const palette = document.getElementById("colorPalette");
const moreColorBtn = document.getElementById("moreColorBtn");
const colorPopover = document.getElementById("colorPopover");
const allColorsGrid = document.getElementById("allColorsGrid");
const closeColorsBtn = document.getElementById("closeColorsBtn");
const notesPalette = document.querySelector(".notes-palette");
const titleEl = document.getElementById("pictureTitle");
const saveState = document.getElementById("saveState");
const toast = document.getElementById("toast");
const pencilModeBtn = document.getElementById("pencilModeBtn");

let selectedColor = quickColors[0];
let tool = "brush";
let brushSize = 18;
let pencilOnly = true;
let drawing = false;
let lastPoint = null;
let activePointerId = null;
let history = [];
let currentPicture = null;
let currentIndex = -1;
let resizeTimer = null;
let saveTimer = null;
let clearArmedUntil = 0;
let fingerHintShown = false;

const DB_NAME = "star-color-db";
const DB_STORE = "drawings";
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function putDrawing(id, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({ id, blob, updated: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getDrawing(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteDrawing(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getSavedKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).getAllKeys();
    req.onsuccess = () => resolve(new Set(req.result));
    req.onerror = () => reject(req.error);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1700);
}

function setSaveState(text, saving = false) {
  saveState.textContent = text;
  saveState.style.color = saving ? "#8a6d26" : "#2f9165";
}

function applyColor(color, { closePopover = false } = {}) {
  selectedColor = color;
  if (tool === "eraser") tool = "brush";
  notesPalette?.style.setProperty("--selected-color", selectedColor);
  document.querySelectorAll(".color-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.color === selectedColor));
  document.querySelectorAll(".all-color-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.color === selectedColor));
  const isQuick = quickColors.includes(selectedColor);
  moreColorBtn.classList.toggle("custom-selected", !isQuick);
  moreColorBtn.style.setProperty("--custom-color", selectedColor);
  syncToolButtons();
  if (closePopover) { colorPopover.classList.add("hidden"); moreColorBtn.setAttribute("aria-expanded", "false"); }
}
function buildPalette() {
  palette.innerHTML = "";
  quickColors.forEach((color,index) => {
    const btn=document.createElement("button"); btn.className="color-btn"+(color===selectedColor?" active":""); btn.style.background=color; btn.dataset.color=color; btn.setAttribute("aria-label",`Quick color ${index+1}`); btn.addEventListener("click",()=>applyColor(color)); palette.appendChild(btn);
  });
  applyColor(selectedColor);
}
function buildAllColors() {
  allColorsGrid.innerHTML="";
  colors.forEach((color,index)=>{ const btn=document.createElement("button"); btn.className="all-color-btn"+(color===selectedColor?" active":""); btn.style.background=color; btn.dataset.color=color; btn.setAttribute("aria-label",`Color ${index+1}`); btn.addEventListener("click",()=>applyColor(color,{closePopover:true})); allColorsGrid.appendChild(btn); });
}

async function buildGallery() {
  gallery.innerHTML = "";
  let saved = new Set();
  try { saved = await getSavedKeys(); } catch {}
  pictures.forEach((pic, index) => {
    const button = document.createElement("button");
    button.className = "picture-card" + (saved.has(pic.key) ? " saved" : "");
    button.innerHTML = `
      <div class="thumb-wrap">
        <img src="${pic.file}" alt="${pic.name}">
        <span class="number">${index + 1}</span>
        <span class="done-badge" aria-label="Started">⭐</span>
      </div>
      <span class="card-name">${pic.name}</span>`;
    button.addEventListener("click", () => openPicture(index));
    gallery.appendChild(button);
  });
}

function syncToolButtons() { notesPalette?.style.setProperty("--selected-color", selectedColor); document.querySelectorAll(".tool-btn[data-tool]").forEach(btn => btn.classList.toggle("active", btn.dataset.tool === tool)); }

function syncSizeButtons() {
  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.size) === brushSize);
  });
}

function syncPencilMode() { pencilModeBtn.classList.toggle("active", pencilOnly); pencilModeBtn.setAttribute("aria-pressed", String(pencilOnly)); pencilModeBtn.setAttribute("aria-label", pencilOnly ? "Apple Pencil only" : "Apple Pencil and finger drawing"); const label=pencilModeBtn.querySelector(".pencil-label"); if(label) label.textContent=pencilOnly?"Pencil":"+ Finger"; }

function fitArtboardToImage() {
  if (!lineArt.naturalWidth || !lineArt.naturalHeight) return;
  const box = workspace.getBoundingClientRect();
  if (!box.width || !box.height) return;

  const ratio = lineArt.naturalWidth / lineArt.naturalHeight;
  const maxW = Math.max(1, box.width - 4);
  const maxH = Math.max(1, box.height - 4);
  let width = maxW;
  let height = width / ratio;

  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }

  artboard.style.width = `${Math.floor(width)}px`;
  artboard.style.height = `${Math.floor(height)}px`;
  artboard.style.aspectRatio = `${lineArt.naturalWidth} / ${lineArt.naturalHeight}`;
}

function resizeCanvas(preserve = true) {
  const rect = artboard.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
  const newW = Math.max(1, Math.round(rect.width * dpr));
  const newH = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width === newW && canvas.height === newH) return;

  const old = document.createElement("canvas");
  old.width = canvas.width;
  old.height = canvas.height;
  if (preserve && canvas.width && canvas.height) old.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = newW;
  canvas.height = newH;
  if (preserve && old.width && old.height) {
    ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, newW, newH);
  }
}

async function restoreSavedDrawing() {
  if (!currentPicture) return;
  try {
    const record = await getDrawing(currentPicture.key);
    if (!record?.blob) { setSaveState("Ready to color ✨"); return; }
    const url = URL.createObjectURL(record.blob);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setSaveState("Saved ✓");
    };
    img.src = url;
  } catch {
    setSaveState("Ready to color ✨");
  }
}

async function openPicture(index) {
  currentIndex = index;
  currentPicture = pictures[index];
  titleEl.textContent = currentPicture.name;
  history = [];
  galleryView.classList.add("hidden");
  coloringView.classList.remove("hidden");
  lineArt.onload = async () => {
    fitArtboardToImage();
    resizeCanvas(false);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await restoreSavedDrawing();
  };
  lineArt.src = currentPicture.file;
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function backToGallery() {
  await saveCurrentDrawing();
  coloringView.classList.add("hidden");
  galleryView.classList.remove("hidden");
  await buildGallery();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function snapshot() {
  if (!canvas.width || !canvas.height) return;
  if (history.length >= 18) history.shift();
  history.push(canvas.toDataURL("image/png"));
}

function restoreDataURL(url) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    scheduleSave();
  };
  img.src = url;
}

function pointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * canvas.width / rect.width,
    y: (e.clientY - rect.top) * canvas.height / rect.height,
    pressure: e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.55,
    tiltX: e.tiltX || 0,
    tiltY: e.tiltY || 0
  };
}

function toolStyle(point) {
  const scale = canvas.width / canvas.getBoundingClientRect().width;
  const base = brushSize * scale;
  if (tool === "pencil") {
    return { width: Math.max(1.5 * scale, base * (0.22 + point.pressure * 0.42)), alpha: .88, composite: "source-over" };
  }
  if (tool === "marker") {
    return { width: base * (1.18 + point.pressure * .35), alpha: .34, composite: "source-over" };
  }
  if (tool === "eraser") {
    return { width: base * 1.75, alpha: 1, composite: "destination-out" };
  }
  return { width: base * (.58 + point.pressure * .62), alpha: .98, composite: "source-over" };
}

function drawSegment(from, to) {
  const style = toolStyle(to);
  ctx.save();
  ctx.globalCompositeOperation = style.composite;
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = selectedColor;
  ctx.lineWidth = style.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function pointerAllowed(e) {
  if (!pencilOnly) return e.pointerType === "pen" || e.pointerType === "touch" || e.pointerType === "mouse";
  return e.pointerType === "pen" || e.pointerType === "mouse";
}

canvas.addEventListener("pointerdown", (e) => {
  if (!pointerAllowed(e)) {
    if (!fingerHintShown && e.pointerType === "touch") {
      fingerHintShown = true;
      showToast("Apple Pencil mode is on ✏️");
    }
    return;
  }
  e.preventDefault();
  snapshot();
  drawing = true;
  activePointerId = e.pointerId;
  canvas.setPointerCapture?.(e.pointerId);
  lastPoint = pointFromEvent(e);
  drawSegment({ ...lastPoint, x: lastPoint.x + .01 }, lastPoint);
  setSaveState("Coloring…", true);
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || e.pointerId !== activePointerId || !pointerAllowed(e)) return;
  e.preventDefault();
  const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
  for (const ev of events) {
    const p = pointFromEvent(ev);
    drawSegment(lastPoint, p);
    lastPoint = p;
  }
});

function finishStroke(e) {
  if (e.pointerId !== activePointerId) return;
  drawing = false;
  lastPoint = null;
  activePointerId = null;
  scheduleSave();
}
canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);

function canvasToBlob() {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

async function saveCurrentDrawing() {
  if (!currentPicture || !canvas.width) return;
  clearTimeout(saveTimer);
  setSaveState("Saving…", true);
  const blob = await canvasToBlob();
  if (blob) await putDrawing(currentPicture.key, blob);
  setSaveState("Saved ✓");
}

function scheduleSave() {
  clearTimeout(saveTimer);
  setSaveState("Saving…", true);
  saveTimer = setTimeout(() => saveCurrentDrawing().catch(() => setSaveState("Saved locally")), 420);
}

async function makeFinishedBlob() {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const o = out.getContext("2d");
  o.fillStyle = "white";
  o.fillRect(0, 0, out.width, out.height);
  o.drawImage(canvas, 0, 0);
  try { if (!lineArt.complete) await lineArt.decode(); } catch {}
  o.globalCompositeOperation = "multiply";
  o.drawImage(lineArt, 0, 0, out.width, out.height);
  o.globalCompositeOperation = "source-over";
  return new Promise(resolve => out.toBlob(resolve, "image/png"));
}

async function shareFinishedPicture() {
  await saveCurrentDrawing();
  const blob = await makeFinishedBlob();
  if (!blob) return;
  const filename = `star-color-${String(currentIndex + 1).padStart(2,"0")}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: currentPicture.name });
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast("Picture saved! ⭐");
}

document.querySelectorAll(".tool-btn[data-tool]").forEach(btn => {
  btn.addEventListener("click", () => {
    tool = btn.dataset.tool;
    syncToolButtons();
  });
});

document.querySelectorAll(".size-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    brushSize = Number(btn.dataset.size);
    syncSizeButtons();
  });
});

document.getElementById("undoBtn").addEventListener("click", () => {
  const previous = history.pop();
  if (!previous) return showToast("Nothing to undo yet");
  restoreDataURL(previous);
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  const now = Date.now();
  if (now > clearArmedUntil) {
    clearArmedUntil = now + 2500;
    showToast("Tap Clear again to erase everything");
    return;
  }
  clearArmedUntil = 0;
  snapshot();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (currentPicture) await deleteDrawing(currentPicture.key).catch(() => {});
  setSaveState("Ready to color ✨");
  showToast("Page cleared");
});

pencilModeBtn.addEventListener("click", () => {
  pencilOnly = !pencilOnly;
  fingerHintShown = false;
  syncPencilMode();
  showToast(pencilOnly ? "Apple Pencil mode ON ✏️" : "Finger drawing ON 👆");
});

moreColorBtn.addEventListener("click",()=>{ const opening=colorPopover.classList.contains("hidden"); colorPopover.classList.toggle("hidden",!opening); moreColorBtn.setAttribute("aria-expanded",String(opening)); });
closeColorsBtn.addEventListener("click",()=>{ colorPopover.classList.add("hidden"); moreColorBtn.setAttribute("aria-expanded","false"); });
document.addEventListener("pointerdown",e=>{ if(!colorPopover.classList.contains("hidden")&&!e.target.closest(".notes-palette")){ colorPopover.classList.add("hidden"); moreColorBtn.setAttribute("aria-expanded","false"); }});
document.getElementById("backBtn").addEventListener("click", backToGallery);
document.getElementById("shareBtn").addEventListener("click", shareFinishedPicture);

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!coloringView.classList.contains("hidden")) {
      fitArtboardToImage();
      resizeCanvas(true);
    }
  }, 160);
});

window.addEventListener("pagehide", () => {
  if (currentPicture) saveCurrentDrawing().catch(() => {});
});

document.addEventListener("gesturestart", e => e.preventDefault(), { passive: false });
document.addEventListener("dblclick", e => {
  if (e.target.closest?.(".artboard")) e.preventDefault();
}, { passive: false });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

buildPalette();
buildAllColors();
syncToolButtons();
syncSizeButtons();
syncPencilMode();
buildGallery();
