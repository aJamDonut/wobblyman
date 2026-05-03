import { formatXp, survivorArtHtml } from "./helpers.js";
import { STAT_DISPLAY_TYPES, getStatHiddenKeys, getStatXpTarget, getSurvivorDisplayStats } from "./stats.js";

function toSafeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function chunk(list, size) {
  const chunks = [];
  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }
  return chunks;
}

function splitDisplayName(fullName) {
  const parts = String(fullName || "Unknown").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return ["UNKNOWN", "SURVIVOR"];
  }

  const first = parts[0].toUpperCase();
  const second = (parts[1] || "SURVIVOR").toUpperCase();
  return [first, second];
}

export function renderResources(state, elements) {
  elements.resources.innerHTML = `
    <div class="res">🥪 ${state.resources.sandwich}</div>
    <div class="res">🍱 ${state.resources.platter}</div>`;
}

export function renderActive(state, elements, activeSurvivor) {
  if (!activeSurvivor) {
    elements.activeName.textContent = "No Survivors";
    elements.activeLevel.textContent = "Level -";
    elements.activeStatRows.innerHTML = "<div class=\"stat-empty\">No stat data</div>";
    elements.xpFill.style.width = "0%";
    elements.xpText.textContent = "0XP / 0XP";
    return;
  }

  elements.activeName.textContent = activeSurvivor.name;
  elements.activeLevel.textContent = `Level ${activeSurvivor.level}`;

  const barRows = getSurvivorDisplayStats(STAT_DISPLAY_TYPES.BAR)
    .map((definition) => {
      const current = toSafeNumber(activeSurvivor[definition.key]);
      const { max } = getStatHiddenKeys(definition.key);
      const maxValue = Math.max(1, toSafeNumber(activeSurvivor[max], 1));
      const fillPercent = Math.min(100, (current / maxValue) * 100);

      return `
        <div class="dynamic-stat dynamic-stat-bar">
          <div class="icon-big">${definition.icon}</div>
          <div>
            <div class="label">${definition.label.toUpperCase()}</div>
            <div class="bar-wrap"><span class="bar-fill ${definition.toneClass || ""}" style="width:${fillPercent}%"></span></div>
          </div>
          <!-- <div class="bar-value">${current} / ${maxValue}</div>-->
        </div>`;
    })
    .join("");

  const intRows = getSurvivorDisplayStats(STAT_DISPLAY_TYPES.INT)
    .map((definition) => {
      const value = toSafeNumber(activeSurvivor[definition.key]);
      const { xp } = getStatHiddenKeys(definition.key);
      const xpCurrent = toSafeNumber(activeSurvivor[xp]);
      const xpTarget = getStatXpTarget(definition.key, value);
      const xpPercent =
        value >= definition.highest
          ? 100
          : Math.min(100, Math.max(0, (xpCurrent / Math.max(1, xpTarget)) * 100));
      const xpSummary = value >= definition.highest ? "XP MAX" : `${formatXp(xpCurrent)} / ${formatXp(xpTarget)} XP`;

      return `
        <div class="dynamic-int">
          <span class="dynamic-int-label">${definition.icon} ${definition.label}</span>
          <div class="dynamic-int-value-wrap">
            <b>${value}</b>
            <small>${xpSummary}</small>
            <span class="dynamic-int-xp"><i style="width:${xpPercent}%"></i></span>
          </div>
        </div>`;
    })
    .join("");

  elements.activeStatRows.innerHTML = `${barRows}<div class="dynamic-int-grid">${intRows}</div>`;

  const xpTotal = Math.max(10, Math.round(17 * Math.pow(1.28, Math.max(0, activeSurvivor.level - 1))));
  const xpCurrent = toSafeNumber(activeSurvivor.healthXp);
  elements.xpFill.style.width = `${Math.min(100, (xpCurrent / xpTotal) * 100)}%`;
  elements.xpText.textContent = `${formatXp(xpCurrent)}XP / ${formatXp(xpTotal)}XP`;
}

export function renderRoster(state, elements, onSelectSurvivor) {
  elements.roster.innerHTML = "";

  const rosterBarStats = getSurvivorDisplayStats(STAT_DISPLAY_TYPES.BAR).filter((definition) => definition.showInRosterBar);
  const rosterIntStats = getSurvivorDisplayStats(STAT_DISPLAY_TYPES.INT);
  const rosterIntRows = chunk(rosterIntStats, 3);

  state.survivors.forEach((survivor) => {
    const [firstName, lastName] = splitDisplayName(survivor.name);
    const intMarkup = rosterIntRows
      .map(
        (statRow) =>
          `<div class="mini-stats">${statRow
            .map((definition) => `<span>${definition.icon} ${toSafeNumber(survivor[definition.key])}</span>`)
            .join("")}</div>`
      )
      .join("");

    const barMarkup = rosterBarStats
      .map((definition) => {
        const { max } = getStatHiddenKeys(definition.key);
        const current = toSafeNumber(survivor[definition.key]);
        const maxValue = Math.max(1, toSafeNumber(survivor[max], 1));
        const fillPercent = Math.min(100, (current / maxValue) * 100);
        return `<div class="small-bar"><span>${definition.icon}</span><div class="bar-wrap"><span class="bar-fill ${definition.toneClass || ""}" style="width:${fillPercent}%"></span></div></div>`;
      })
      .join("");

    const xpTotal = Math.max(10, Math.round(17 * Math.pow(1.28, Math.max(0, survivor.level - 1))));
    const xpCurrent = toSafeNumber(survivor.healthXp);

    const card = document.createElement("div");
    card.className = `survivor-card ${state.activeId === survivor.id ? "active" : ""}`;
    card.innerHTML = `
      <div class="survivor-name">${firstName}<br>${lastName}</div>
      <div class="mini-avatar">${survivorArtHtml(survivor.gender)}</div>
      ${intMarkup}
      <div class="status">${state.running && state.running.survivorId === survivor.id ? "Working" : "Idle"}</div>
      <div class="small-bars">
        ${barMarkup}
      </div>
      <div class="small-xp"><span class="small-xp-text">${formatXp(xpCurrent)}XP</span><span class="xp-fill" style="width:${Math.min(100, (xpCurrent / xpTotal) * 100)}%"></span></div>
      <div class="level">LVL ${survivor.level}</div>`;

    card.addEventListener("click", () => onSelectSurvivor(survivor.id));
    elements.roster.appendChild(card);
  });

  while (elements.roster.children.length < 4) {
    const empty = document.createElement("div");
    empty.className = "survivor-card empty";
    elements.roster.appendChild(empty);
  }
}
