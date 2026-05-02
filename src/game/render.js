import { formatXp, survivorArtHtml, survivorStatsHtml } from "./helpers.js";

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
    elements.activeStats.innerHTML = "";

    elements.hpText.textContent = "0 / 0";
    elements.moraleText.textContent = "0 / 0";
    elements.insanityText.textContent = "0 / 0";

    elements.hpFill.style.width = "0%";
    elements.moraleFill.style.width = "0%";
    elements.insanityFill.style.width = "0%";
    elements.xpFill.style.width = "0%";
    elements.xpText.textContent = "0XP / 0XP";
    return;
  }

  elements.activeName.textContent = activeSurvivor.name;
  elements.activeLevel.textContent = `Level ${activeSurvivor.level}`;
  elements.activeStats.innerHTML = survivorStatsHtml(activeSurvivor);

  elements.hpText.textContent = `${activeSurvivor.hp} / ${activeSurvivor.maxHp}`;
  elements.moraleText.textContent = `${activeSurvivor.morale} / ${activeSurvivor.maxMorale}`;
  elements.insanityText.textContent = `${activeSurvivor.insanity} / ${activeSurvivor.maxInsanity}`;

  elements.hpFill.style.width = `${(activeSurvivor.hp / activeSurvivor.maxHp) * 100}%`;
  elements.moraleFill.style.width = `${(activeSurvivor.morale / activeSurvivor.maxMorale) * 100}%`;
  elements.insanityFill.style.width = `${(activeSurvivor.insanity / activeSurvivor.maxInsanity) * 100}%`;

  elements.xpFill.style.width = `${Math.min(100, (activeSurvivor.xp / activeSurvivor.nextXp) * 100)}%`;
  elements.xpText.textContent = `${formatXp(activeSurvivor.xp)}XP / ${formatXp(activeSurvivor.nextXp)}XP`;
}

export function renderRoster(state, elements, onSelectSurvivor) {
  elements.roster.innerHTML = "";

  state.survivors.forEach((survivor) => {
    const [firstName, lastName] = splitDisplayName(survivor.name);
    const card = document.createElement("div");
    card.className = `survivor-card ${state.activeId === survivor.id ? "active" : ""}`;
    card.innerHTML = `
      <div class="survivor-name">${firstName}<br>${lastName}</div>
      <div class="mini-avatar">${survivorArtHtml(survivor.gender)}</div>
      <div class="mini-stats"><span>✥ ${survivor.attack}</span><span>🛡 ${survivor.defense}</span></div>
      <div class="mini-stats"><span>🔧 ${survivor.tools}</span><span>💬 ${survivor.speech}</span><span>🔭 ${survivor.search}</span></div>
      <div class="status">${state.running && state.running.survivorId === survivor.id ? "Working" : "Idle"}</div>
      <div class="small-bars">
        <div class="small-bar"><span>❤</span><div class="bar-wrap"><span class="bar-fill red" style="width:${(survivor.hp / survivor.maxHp) * 100}%"></span></div></div>
        <div class="small-bar"><span>✊</span><div class="bar-wrap"><span class="bar-fill blue" style="width:${(survivor.morale / survivor.maxMorale) * 100}%"></span></div></div>
        <div class="small-bar"><span>🧠</span><div class="bar-wrap"><span class="bar-fill purple" style="width:${(survivor.insanity / survivor.maxInsanity) * 100}%"></span></div></div>
      </div>
      <div class="small-xp"><span class="small-xp-text">${formatXp(survivor.xp)}XP</span><span class="xp-fill" style="width:${Math.min(100, (survivor.xp / survivor.nextXp) * 100)}%"></span></div>
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
