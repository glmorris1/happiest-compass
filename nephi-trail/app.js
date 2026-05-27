let chapters = [];

const storageKey = "nephi-journey-current-chapter";
const nodesContainer = document.querySelector("#nodes");
const mapWorld = document.querySelector("#mapWorld");
const mapScroll = document.querySelector("#mapScroll");
const traveler = document.querySelector("#traveler");
const chapterStatus = document.querySelector("#chapterStatus");
const meterFill = document.querySelector("#meterFill");
const progressPercent = document.querySelector("#progressPercent");
const completedText = document.querySelector("#completedText");
const nextButton = document.querySelector("#nextButton");
const backButton = document.querySelector("#backButton");
const resetButton = document.querySelector("#resetButton");
const effectsCanvas = document.querySelector("#effectsCanvas");
const effectsContext = effectsCanvas.getContext("2d");
const visualYOffset = 0;

let currentIndex = readSavedIndex();
let particles = [];
let dragState = null;

function readSavedIndex() {
  const saved = Number(localStorage.getItem(storageKey));
  return Number.isInteger(saved) && saved >= 0 && saved < chapters.length ? saved : 0;
}

function saveIndex() {
  localStorage.setItem(storageKey, String(currentIndex));
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
    <img class="node-state node-locked" src="assets/node-assets/locked.webp" alt="" loading="lazy" decoding="async">
    <img class="node-state node-unlocked" src="assets/node-assets/unlocked.webp" alt="" loading="lazy" decoding="async">
    <img class="node-state node-current" src="assets/node-assets/current.webp" alt="" loading="lazy" decoding="async">
    <img class="node-state node-completed" src="assets/node-assets/completed.webp" alt="" loading="lazy" decoding="async">
    <span class="marker-number">${chapter}</span>
  `;
}

function renderNodes() {
  nodesContainer.innerHTML = "";

  chapters.forEach((item, index) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `chapter-node biome-${item.biome}`;
    node.dataset.index = String(index);
    node.style.left = `${item.x}px`;
    node.style.top = `${item.y + visualYOffset}px`;
    node.setAttribute("aria-label", `${item.label}, ${statusFor(index)}`);
    node.innerHTML = markerMarkup(item.chapter);
    node.addEventListener("click", () => moveTo(index));
    nodesContainer.append(node);
  });
}

function statusFor(index) {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "locked";
}

function moveTo(index) {
  if (index === currentIndex) return;

  const wasForward = index > currentIndex;
  currentIndex = index;
  saveIndex();
  traveler.classList.add("walking");
  updateView(true);

  if (wasForward) {
    burstAt(chapters[index]);
  }

  window.setTimeout(() => traveler.classList.remove("walking"), 820);
}

function updateView(animateCamera = false) {
  const completed = currentIndex;
  const percent = Math.round((completed / (chapters.length - 1)) * 100);

  document.querySelectorAll(".chapter-node").forEach((node, index) => {
    node.classList.toggle("is-completed", index < currentIndex);
    node.classList.toggle("is-current", index === currentIndex);
    node.classList.toggle("is-locked", index > currentIndex);
    node.setAttribute("aria-label", `${chapters[index].label}, ${statusFor(index)}`);
  });

  const point = chapters[currentIndex];
  traveler.style.left = `${point.x}px`;
  traveler.style.top = `${point.y + visualYOffset}px`;
  traveler.className = `explorer biome-${point.biome}${traveler.classList.contains("walking") ? " walking" : ""}`;

  chapterStatus.textContent = point.label;
  meterFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  completedText.textContent = `Chapters Completed: ${completed} / ${chapters.length}`;
  backButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === chapters.length - 1;

  centerOn(point, animateCamera);
}

function centerOn(point, smooth = true) {
  const viewportHeight = mapScroll.clientHeight;
  const target = Math.max(0, point.y + visualYOffset - viewportHeight * 0.48);
  mapScroll.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
}

function burstAt(point) {
  const width = mapWorld.clientWidth;
  const originX = point.x;
  const originY = point.y + visualYOffset;

  for (let index = 0; index < 26; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * (1.2 + Math.random() * 2.6),
      vy: Math.sin(angle) * (1.2 + Math.random() * 2.6) - 1.4,
      life: 52 + Math.random() * 22,
      maxLife: 74,
      size: 3 + Math.random() * 5,
      hue: Math.random() > 0.45 ? "#f6d36a" : "#7bd67d",
    });
  }
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  effectsCanvas.width = mapWorld.clientWidth * ratio;
  effectsCanvas.height = mapWorld.clientHeight * ratio;
  effectsCanvas.style.width = `${mapWorld.clientWidth}px`;
  effectsCanvas.style.height = `${mapWorld.clientHeight}px`;
  effectsContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawParticles() {
  effectsContext.clearRect(0, 0, mapWorld.clientWidth, mapWorld.clientHeight);
  particles = particles.filter((particle) => particle.life > 0);

  particles.forEach((particle) => {
    particle.life -= 1;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.035;

    const alpha = Math.max(0, particle.life / particle.maxLife);
    effectsContext.globalAlpha = alpha;
    effectsContext.fillStyle = particle.hue;
    effectsContext.beginPath();
    effectsContext.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    effectsContext.fill();
  });

  effectsContext.globalAlpha = 1;
  requestAnimationFrame(drawParticles);
}

function setupDragScroll() {
  mapScroll.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragState = {
      pointerId: event.pointerId,
      y: event.clientY,
      scrollTop: mapScroll.scrollTop,
      velocity: 0,
      lastY: event.clientY,
      lastTime: performance.now(),
    };
    mapScroll.setPointerCapture(event.pointerId);
    mapScroll.classList.add("is-dragging");
  });

  mapScroll.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const now = performance.now();
    const dy = event.clientY - dragState.y;
    mapScroll.scrollTop = dragState.scrollTop - dy;
    dragState.velocity = (event.clientY - dragState.lastY) / Math.max(1, now - dragState.lastTime);
    dragState.lastY = event.clientY;
    dragState.lastTime = now;
  });

  mapScroll.addEventListener("pointerup", endDrag);
  mapScroll.addEventListener("pointercancel", endDrag);
}

function endDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const velocity = dragState.velocity * -900;
  mapScroll.classList.remove("is-dragging");
  dragState = null;

  if (Math.abs(velocity) > 60) {
    mapScroll.scrollBy({ top: velocity, behavior: "smooth" });
  }
}

nextButton.addEventListener("click", () => {
  if (currentIndex < chapters.length - 1) moveTo(currentIndex + 1);
});

backButton.addEventListener("click", () => {
  if (currentIndex > 0) moveTo(currentIndex - 1);
});

resetButton.addEventListener("click", () => {
  currentIndex = 0;
  saveIndex();
  updateView(true);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  updateView(false);
});

async function init() {
  chapters = await loadChapters();
  currentIndex = Math.min(currentIndex, chapters.length - 1);
  renderNodes();
  resizeCanvas();
  setupDragScroll();
  updateView(false);
  drawParticles();
}

init();
