const defaultChapters = [
  { chapter: 1, label: "1 Nephi 1", biome: "jerusalem", x: 23, y: 285 },
  { chapter: 2, label: "1 Nephi 2", biome: "jerusalem", x: 42, y: 395 },
  { chapter: 3, label: "1 Nephi 3", biome: "jerusalem", x: 61, y: 500 },
  { chapter: 4, label: "1 Nephi 4", biome: "jerusalem", x: 73, y: 635 },
  { chapter: 5, label: "1 Nephi 5", biome: "wilderness", x: 67, y: 1000 },
  { chapter: 6, label: "1 Nephi 6", biome: "wilderness", x: 45, y: 1105 },
  { chapter: 7, label: "1 Nephi 7", biome: "wilderness", x: 28, y: 1218 },
  { chapter: 8, label: "1 Nephi 8", biome: "wilderness", x: 37, y: 1350 },
  { chapter: 9, label: "1 Nephi 9", biome: "wilderness", x: 58, y: 1480 },
  { chapter: 10, label: "1 Nephi 10", biome: "wilderness", x: 75, y: 1610 },
  { chapter: 11, label: "1 Nephi 11", biome: "coast", x: 70, y: 1905 },
  { chapter: 12, label: "1 Nephi 12", biome: "coast", x: 48, y: 1995 },
  { chapter: 13, label: "1 Nephi 13", biome: "coast", x: 31, y: 2105 },
  { chapter: 14, label: "1 Nephi 14", biome: "coast", x: 39, y: 2235 },
  { chapter: 15, label: "1 Nephi 15", biome: "coast", x: 60, y: 2350 },
  { chapter: 16, label: "1 Nephi 16", biome: "coast", x: 74, y: 2465 },
  { chapter: 17, label: "1 Nephi 17", biome: "coast", x: 50, y: 2585 },
  { chapter: 18, label: "1 Nephi 18", biome: "transition", x: 25, y: 2880 },
  { chapter: 19, label: "1 Nephi 19", biome: "jungle", x: 43, y: 3020 },
  { chapter: 20, label: "1 Nephi 20", biome: "jungle", x: 67, y: 3150 },
  { chapter: 21, label: "1 Nephi 21", biome: "jungle", x: 48, y: 3310 },
  { chapter: 22, label: "1 Nephi 22", biome: "jungle", x: 75, y: 3460 },
];

const draftKey = "nephi-node-editor-draft";
const nodesContainer = document.querySelector("#nodes");
const mapWorld = document.querySelector("#mapWorld");
const mapScroll = document.querySelector("#mapScroll");
const selectedLabel = document.querySelector("#selectedLabel");
const positionLabel = document.querySelector("#positionLabel");
const layoutOutput = document.querySelector("#layoutOutput");
const snapToggle = document.querySelector("#snapToggle");
const exportButton = document.querySelector("#exportButton");
const copyButton = document.querySelector("#copyButton");
const importButton = document.querySelector("#importButton");
const saveDraftButton = document.querySelector("#saveDraftButton");
const loadDraftButton = document.querySelector("#loadDraftButton");
const resetButton = document.querySelector("#resetButton");

let chapters = cloneChapters(defaultChapters);
let selectedIndex = 0;
let dragState = null;

function cloneChapters(source) {
  return source.map((item) => ({ ...item }));
}

function markerSvg(chapter) {
  return `
    <svg class="marker-svg" viewBox="0 0 92 92" aria-hidden="true">
      <defs>
        <radialGradient id="editor-stone-${chapter}" cx="35%" cy="25%" r="72%">
          <stop offset="0%" stop-color="#fff0ba"></stop>
          <stop offset="43%" stop-color="#c9b18a"></stop>
          <stop offset="100%" stop-color="#6f6251"></stop>
        </radialGradient>
        <linearGradient id="editor-gold-${chapter}" x1="20%" x2="80%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#fff1a8"></stop>
          <stop offset="48%" stop-color="#d79b34"></stop>
          <stop offset="100%" stop-color="#7f4c1c"></stop>
        </linearGradient>
      </defs>
      <ellipse class="marker-ground" cx="46" cy="76" rx="34" ry="10"></ellipse>
      <circle class="marker-rim" cx="46" cy="43" r="34" fill="url(#editor-gold-${chapter})"></circle>
      <circle class="marker-face" cx="46" cy="41" r="26" fill="url(#editor-stone-${chapter})"></circle>
      <path class="marker-chip" d="M30 31c7-8 19-11 30-5"></path>
    </svg>
    <span class="marker-number">${chapter}</span>
  `;
}

function renderNodes() {
  nodesContainer.innerHTML = "";

  chapters.forEach((item, index) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `chapter-node editor-node biome-${item.biome}`;
    node.dataset.index = String(index);
    node.innerHTML = markerSvg(item.chapter);
    node.setAttribute("aria-label", `Drag ${item.label}`);
    node.addEventListener("pointerdown", startDrag);
    node.addEventListener("click", () => selectNode(index));
    nodesContainer.append(node);
  });

  updateNodes();
}

function updateNodes() {
  document.querySelectorAll(".editor-node").forEach((node, index) => {
    const point = chapters[index];
    node.style.left = `${point.x}%`;
    node.style.top = `${point.y}px`;
    node.dataset.coords = `${formatX(point.x)}, ${Math.round(point.y)}`;
    node.classList.toggle("is-selected", index === selectedIndex);
  });

  const selected = chapters[selectedIndex];
  selectedLabel.textContent = selected.label;
  positionLabel.textContent = `x ${formatX(selected.x)}, y ${Math.round(selected.y)}`;
}

function formatX(value) {
  return `${Number(value.toFixed(1))}%`;
}

function startDrag(event) {
  const node = event.currentTarget;
  const index = Number(node.dataset.index);
  selectNode(index);
  node.setPointerCapture(event.pointerId);
  dragState = { node, index, pointerId: event.pointerId };
  mapScroll.classList.add("is-dragging");
  event.preventDefault();
}

function moveDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const rect = mapWorld.getBoundingClientRect();
  const rawX = ((event.clientX - rect.left) / rect.width) * 100;
  const rawY = event.clientY - rect.top;
  const snap = snapToggle.checked;
  const nextX = clamp(snap ? Math.round(rawX / 2) * 2 : rawX, 5, 95);
  const nextY = clamp(snap ? Math.round(rawY / 10) * 10 : rawY, 80, rect.height - 80);

  chapters[dragState.index].x = Number(nextX.toFixed(1));
  chapters[dragState.index].y = Math.round(nextY);
  updateNodes();
}

function endDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  dragState = null;
  mapScroll.classList.remove("is-dragging");
  exportLayout();
}

function selectNode(index) {
  selectedIndex = index;
  updateNodes();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function exportLayout() {
  const data = chapters.map(({ chapter, label, biome, x, y }) => ({
    chapter,
    label,
    biome,
    x: Number(x.toFixed(1)),
    y: Math.round(y),
  }));

  layoutOutput.value = JSON.stringify(data, null, 2);
}

function importLayout() {
  try {
    const parsed = JSON.parse(layoutOutput.value);
    if (!Array.isArray(parsed) || parsed.length !== 22) {
      throw new Error("Layout must contain exactly 22 chapters.");
    }

    chapters = defaultChapters.map((fallback, index) => {
      const incoming = parsed.find((item) => Number(item.chapter) === fallback.chapter) || parsed[index];
      return {
        ...fallback,
        x: clamp(Number(incoming.x), 5, 95),
        y: clamp(Math.round(Number(incoming.y)), 80, 3600),
      };
    });

    selectedIndex = 0;
    updateNodes();
    exportLayout();
  } catch (error) {
    layoutOutput.value = `${layoutOutput.value}\n\nImport error: ${error.message}`;
  }
}

async function copyLayout() {
  exportLayout();
  layoutOutput.select();

  try {
    await navigator.clipboard.writeText(layoutOutput.value);
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = "Copy JSON";
    }, 1200);
  } catch {
    document.execCommand("copy");
  }
}

function saveDraft() {
  exportLayout();
  localStorage.setItem(draftKey, layoutOutput.value);
  saveDraftButton.textContent = "Saved";
  window.setTimeout(() => {
    saveDraftButton.textContent = "Save Draft";
  }, 1200);
}

function loadDraft() {
  const draft = localStorage.getItem(draftKey);
  if (!draft) return;
  layoutOutput.value = draft;
  importLayout();
}

function resetLayout() {
  chapters = cloneChapters(defaultChapters);
  selectedIndex = 0;
  updateNodes();
  exportLayout();
}

document.addEventListener("pointermove", moveDrag);
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);
exportButton.addEventListener("click", exportLayout);
copyButton.addEventListener("click", copyLayout);
importButton.addEventListener("click", importLayout);
saveDraftButton.addEventListener("click", saveDraft);
loadDraftButton.addEventListener("click", loadDraft);
resetButton.addEventListener("click", resetLayout);

renderNodes();
exportLayout();
