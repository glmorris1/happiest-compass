const chapters = Array.from({ length: 22 }, (_, index) => ({
  chapter: index + 1,
  label: `1 Nephi ${index + 1}`,
}));

const points = [
  [14, 88],
  [25, 81],
  [42, 84],
  [58, 77],
  [47, 68],
  [30, 64],
  [18, 55],
  [34, 49],
  [52, 53],
  [69, 47],
  [82, 39],
  [68, 32],
  [50, 28],
  [32, 23],
  [18, 16],
  [34, 11],
  [54, 15],
  [74, 12],
  [86, 19],
  [76, 27],
  [88, 34],
  [72, 42],
];

const storageKey = "nephi-trail-current-chapter";
const nodesContainer = document.querySelector("#nodes");
const pathLayer = document.querySelector("#pathLayer");
const traveler = document.querySelector("#traveler");
const chapterStatus = document.querySelector("#chapterStatus");
const meterFill = document.querySelector("#meterFill");
const nextButton = document.querySelector("#nextButton");
const backButton = document.querySelector("#backButton");
const resetButton = document.querySelector("#resetButton");

let currentIndex = readSavedIndex();

function readSavedIndex() {
  const stored = Number(localStorage.getItem(storageKey));
  if (Number.isInteger(stored) && stored >= 0 && stored < chapters.length) {
    return stored;
  }

  return 0;
}

function saveIndex() {
  localStorage.setItem(storageKey, String(currentIndex));
}

function renderPath() {
  pathLayer.innerHTML = "";

  points.slice(0, -1).forEach((start, index) => {
    const end = points[index + 1];
    const segment = document.createElement("span");
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    segment.className = "path-segment";
    segment.style.left = `${start[0]}%`;
    segment.style.top = `${start[1]}%`;
    segment.style.width = `${length}%`;
    segment.style.transform = `rotate(${angle}deg)`;
    pathLayer.append(segment);
  });
}

function renderNodes() {
  nodesContainer.innerHTML = "";

  chapters.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-node";
    button.dataset.index = String(index);
    button.style.left = `${points[index][0]}%`;
    button.style.top = `${points[index][1]}%`;
    button.setAttribute("aria-label", `${item.label}, ${statusFor(index)}`);
    button.innerHTML = `<span>${item.chapter}</span>`;
    button.addEventListener("click", () => moveTo(index));
    nodesContainer.append(button);
  });
}

function statusFor(index) {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "not reached";
}

function moveTo(index) {
  if (index === currentIndex) return;

  currentIndex = index;
  saveIndex();
  traveler.classList.add("walking");
  updateView();
  window.setTimeout(() => traveler.classList.remove("walking"), 760);
}

function updateView() {
  document.querySelectorAll(".chapter-node").forEach((node, index) => {
    node.classList.toggle("done", index < currentIndex);
    node.classList.toggle("current", index === currentIndex);
    node.classList.toggle("locked", index > currentIndex);
    node.setAttribute("aria-label", `${chapters[index].label}, ${statusFor(index)}`);
  });

  document.querySelectorAll(".path-segment").forEach((segment, index) => {
    segment.classList.toggle("complete", index < currentIndex);
  });

  const point = points[currentIndex];
  traveler.style.left = `${point[0]}%`;
  traveler.style.top = `${point[1]}%`;
  chapterStatus.textContent = chapters[currentIndex].label;
  meterFill.style.width = `${(currentIndex / (chapters.length - 1)) * 100}%`;
  backButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === chapters.length - 1;
}

nextButton.addEventListener("click", () => {
  if (currentIndex < chapters.length - 1) {
    moveTo(currentIndex + 1);
  }
});

backButton.addEventListener("click", () => {
  if (currentIndex > 0) {
    moveTo(currentIndex - 1);
  }
});

resetButton.addEventListener("click", () => {
  currentIndex = 0;
  saveIndex();
  updateView();
});

renderPath();
renderNodes();
updateView();
