let defaultChapters = [];

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

let chapters = [];
let selectedIndex = 0;
let dragState = null;

function cloneChapters(source) {
  return source.map((item) => ({ ...item }));
}

async function loadChapters() {
  try {
    const response = await fetch(`nodes.json?v=story-map-1`, { cache: "no-cache" });
    if (!response.ok) throw new Error("Node layout unavailable.");
    const data = await response.json();
    if (!Array.isArray(data) || data.length !== 22) throw new Error("Node layout must contain 22 chapters.");
    return data.map(normalizeChapter);
  } catch {
    return window.NEPHI_CHAPTERS.map(normalizeChapter);
  }
}

function normalizeChapter(chapter) {
  return {
    ...chapter,
    label: chapter.label || `1 Nephi ${chapter.chapter}`,
    x: Number(chapter.x),
    y: Number(chapter.y),
  };
}

function markerMarkup(chapter) {
  return `
    <img class="node-state node-unlocked" src="assets/node-assets/unlocked.webp" alt="" loading="lazy" decoding="async">
    <img class="node-state node-current" src="assets/node-assets/current.webp" alt="" loading="lazy" decoding="async">
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
    node.innerHTML = markerMarkup(item.chapter);
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
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
    node.dataset.coords = `${formatX(point.x)}, ${Math.round(point.y)}`;
    node.classList.toggle("is-selected", index === selectedIndex);
  });

  const selected = chapters[selectedIndex];
  selectedLabel.textContent = selected.label;
  positionLabel.textContent = `x ${formatX(selected.x)}, y ${Math.round(selected.y)}`;
}

function formatX(value) {
  return `${Math.round(value)}px`;
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
  const rawX = event.clientX - rect.left;
  const rawY = event.clientY - rect.top;
  const snap = snapToggle.checked;
  const nextX = clamp(snap ? Math.round(rawX / 10) * 10 : rawX, 36, rect.width - 36);
  const nextY = clamp(snap ? Math.round(rawY / 10) * 10 : rawY, 80, rect.height - 80);

  chapters[dragState.index].x = Math.round(nextX);
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
    x: Math.round(x),
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
        x: normalizeIncomingX(incoming.x),
        y: clamp(Math.round(Number(incoming.y)), 80, mapWorld.clientHeight - 80),
      };
    });

    selectedIndex = 0;
    updateNodes();
    exportLayout();
  } catch (error) {
    layoutOutput.value = `${layoutOutput.value}\n\nImport error: ${error.message}`;
  }
}

function normalizeIncomingX(value) {
  const numeric = Number(value);
  if (numeric <= 100) return clamp(Math.round((numeric / 100) * mapWorld.clientWidth), 36, mapWorld.clientWidth - 36);
  return clamp(Math.round(numeric), 36, mapWorld.clientWidth - 36);
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

async function init() {
  defaultChapters = await loadChapters();
  chapters = cloneChapters(defaultChapters);
  renderNodes();
  exportLayout();
}

init();
