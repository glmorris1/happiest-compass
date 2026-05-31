const DESTINATIONS = [
  {
    id: "pirate-treasure-target",
    name: "The Treasure",
    lat: 33.251501,
    lon: -111.657607,
  },
];

const METERS_PER_MILE = 1609.344;
const FEET_PER_METER = 3.28084;
const FEET_SWITCHOVER = 2640;
const ARRIVAL_RADIUS_METERS = 3.048;
const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 2000,
  timeout: 12000,
};

const distanceValue = document.querySelector("#distanceValue");
const helperText = document.querySelector("#helperText");
const startButton = document.querySelector("#startButton");
const needle = document.querySelector("#needle");

let selectedTarget = DESTINATIONS[0];
let currentPosition = null;
let currentHeading = 0;
let hasHeading = false;
let watchId = null;
let needleRotation = 0;
let hasArrived = false;

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function shortestRotationDelta(fromDegrees, toDegrees) {
  return ((toDegrees - fromDegrees + 540) % 360) - 180;
}

function distanceMeters(from, to) {
  const earthRadiusMeters = 6371008.8;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(from, to) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

function formatDistance(meters) {
  const feet = meters * FEET_PER_METER;

  if (feet < FEET_SWITCHOVER) {
    return `${Math.round(feet).toLocaleString()} ft`;
  }

  const miles = meters / METERS_PER_MILE;
  return `${miles >= 10 ? miles.toFixed(1) : miles.toFixed(2)} mi`;
}

function getCompassHeading(event) {
  if (typeof event.webkitCompassHeading === "number") {
    return event.webkitCompassHeading;
  }

  if (typeof event.alpha === "number") {
    return normalizeDegrees(360 - event.alpha);
  }

  return null;
}

function maybeOpenArrival(distance) {
  if (hasArrived || distance > ARRIVAL_RADIUS_METERS) {
    return;
  }

  hasArrived = true;
  distanceValue.textContent = "0 ft";
  window.location.assign("arrival.html");
}

function handleLocationError(error) {
  distanceValue.textContent = "Location needed";
  distanceValue.classList.add("is-waiting");
  helperText.textContent = error.message || "Allow location access to use the compass.";
  startButton.disabled = false;
  startButton.textContent = "Start compass";
  startButton.classList.remove("is-live");
}

function render() {
  if (!currentPosition) {
    needleRotation = 0;
    needle.style.transform = "translateX(-50%) rotate(0deg)";
    return;
  }

  const distance = distanceMeters(currentPosition, selectedTarget);
  const bearing = bearingDegrees(currentPosition, selectedTarget);
  const relativeBearing = normalizeDegrees(bearing - (hasHeading ? currentHeading : 0));
  const currentNormalizedRotation = normalizeDegrees(needleRotation);
  const rotationDelta = shortestRotationDelta(currentNormalizedRotation, relativeBearing);

  needleRotation += rotationDelta;

  distanceValue.classList.remove("is-waiting");
  distanceValue.textContent = formatDistance(distance);
  needle.style.transform = `translateX(-50%) rotate(${needleRotation}deg)`;
  maybeOpenArrival(distance);
}

async function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    const result = await DeviceOrientationEvent.requestPermission();
    if (result !== "granted") {
      throw new Error("Compass permission was not granted.");
    }
  }
}

function startLocationWatch() {
  if (!navigator.geolocation) {
    throw new Error("This browser does not support GPS location.");
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      currentPosition = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      render();
    },
    handleLocationError,
    LOCATION_OPTIONS,
  );
}

async function startCompass() {
  startButton.disabled = true;
  startButton.textContent = "Starting...";

  try {
    await requestOrientationPermission();
    window.addEventListener("deviceorientation", handleOrientation, true);
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    startLocationWatch();
    startButton.textContent = "Compass active";
    startButton.classList.add("is-live");
    helperText.textContent = "Follow the needle. The chest opens when you are within 10 feet.";
  } catch (error) {
    startButton.disabled = false;
    startButton.textContent = "Start compass";
    distanceValue.textContent = "Permission needed";
    distanceValue.classList.add("is-waiting");
    helperText.textContent = error.message || "Allow GPS and motion access to continue.";
  }
}

function handleOrientation(event) {
  const heading = getCompassHeading(event);
  if (heading === null) {
    return;
  }

  currentHeading = heading;
  hasHeading = true;
  render();
}

startButton.addEventListener("click", startCompass);

render();

try {
  startLocationWatch();
} catch (error) {
  distanceValue.textContent = "Location needed";
  distanceValue.classList.add("is-waiting");
  helperText.textContent = error.message || "Allow GPS access to show your current distance.";
}
