const chapters = [
  { chapter: 1, label: "1 Nephi 1", biome: "jerusalem", x: 47.4, y: 279 },
  { chapter: 2, label: "1 Nephi 2", biome: "jerusalem", x: 77.3, y: 430 },
  { chapter: 3, label: "1 Nephi 3", biome: "jerusalem", x: 45.9, y: 586 },
  { chapter: 4, label: "1 Nephi 4", biome: "jerusalem", x: 70.8, y: 784 },
  { chapter: 5, label: "1 Nephi 5", biome: "wilderness", x: 70.5, y: 1011 },
  { chapter: 6, label: "1 Nephi 6", biome: "wilderness", x: 43.4, y: 1083 },
  { chapter: 7, label: "1 Nephi 7", biome: "wilderness", x: 70.4, y: 1198 },
  { chapter: 8, label: "1 Nephi 8", biome: "wilderness", x: 37.9, y: 1451 },
  { chapter: 9, label: "1 Nephi 9", biome: "wilderness", x: 46.1, y: 1678 },
  { chapter: 10, label: "1 Nephi 10", biome: "wilderness", x: 63.7, y: 1798 },
  { chapter: 11, label: "1 Nephi 11", biome: "coast", x: 49, y: 1899 },
  { chapter: 12, label: "1 Nephi 12", biome: "coast", x: 24.5, y: 1965 },
  { chapter: 13, label: "1 Nephi 13", biome: "coast", x: 39, y: 2057 },
  { chapter: 14, label: "1 Nephi 14", biome: "coast", x: 48.7, y: 2143 },
  { chapter: 15, label: "1 Nephi 15", biome: "coast", x: 49.4, y: 2344 },
  { chapter: 16, label: "1 Nephi 16", biome: "coast", x: 44.3, y: 2450 },
  { chapter: 17, label: "1 Nephi 17", biome: "coast", x: 56.8, y: 2603 },
  { chapter: 18, label: "1 Nephi 18", biome: "transition", x: 50.7, y: 2853 },
  { chapter: 19, label: "1 Nephi 19", biome: "jungle", x: 46.3, y: 3058 },
  { chapter: 20, label: "1 Nephi 20", biome: "jungle", x: 65.5, y: 3235 },
  { chapter: 21, label: "1 Nephi 21", biome: "jungle", x: 50.2, y: 3365 },
  { chapter: 22, label: "1 Nephi 22", biome: "jungle", x: 49.4, y: 3506 },
];

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
const routeGlow = document.querySelector("#routeGlow");
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

function markerSvg(chapter) {
  return `
    <svg class="marker-svg" viewBox="0 0 92 92" aria-hidden="true">
      <defs>
        <radialGradient id="stone-${chapter}" cx="35%" cy="25%" r="72%">
          <stop offset="0%" stop-color="#fff0ba"></stop>
          <stop offset="43%" stop-color="#c9b18a"></stop>
          <stop offset="100%" stop-color="#6f6251"></stop>
        </radialGradient>
        <linearGradient id="gold-${chapter}" x1="20%" x2="80%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#fff1a8"></stop>
          <stop offset="48%" stop-color="#d79b34"></stop>
          <stop offset="100%" stop-color="#7f4c1c"></stop>
        </linearGradient>
      </defs>
      <ellipse class="marker-ground" cx="46" cy="76" rx="34" ry="10"></ellipse>
      <circle class="marker-rim" cx="46" cy="43" r="34" fill="url(#gold-${chapter})"></circle>
      <circle class="marker-face" cx="46" cy="41" r="26" fill="url(#stone-${chapter})"></circle>
      <path class="marker-chip" d="M30 31c7-8 19-11 30-5"></path>
      <path class="marker-check" d="M30 43l10 10 22-25"></path>
    </svg>
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
    node.style.left = `${item.x}%`;
    node.style.top = `${item.y + visualYOffset}px`;
    node.setAttribute("aria-label", `${item.label}, ${statusFor(index)}`);
    node.innerHTML = markerSvg(item.chapter);
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
  traveler.style.left = `${point.x}%`;
  traveler.style.top = `${point.y + visualYOffset}px`;
  traveler.className = `explorer biome-${point.biome}${traveler.classList.contains("walking") ? " walking" : ""}`;

  chapterStatus.textContent = point.label;
  meterFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  completedText.textContent = `Chapters Completed: ${completed} / ${chapters.length}`;
  routeGlow.style.strokeDashoffset = String(100 - percent);
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
  const originX = (point.x / 100) * width;
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

renderNodes();
resizeCanvas();
setupDragScroll();
updateView(false);
drawParticles();
