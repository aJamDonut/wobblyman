export function formatXp(value) {
  return Number.isInteger(value) ? value : Math.round(value * 100) / 100;
}

export function clock(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function survivorArtHtml(gender = "female") {
  const maleClass = gender === "male" ? "male" : "";
  return `<div class="survivor-art ${maleClass}"><i class="hair"></i><i class="head"></i><i class="torso"></i><i class="arm-l"></i><i class="arm-r"></i><i class="leg-l"></i><i class="leg-r"></i><i class="shoe-l"></i><i class="shoe-r"></i></div>`;
}
