import { clock } from "./helpers.js";
import { renderActive, renderResources, renderRoster } from "./render.js";
import { createInitialState, getSurvivorById } from "./state.js";

export function createGameApp() {
  const state = createInitialState();

  const elements = {
    resources: document.querySelector("#resources"),
    missionsScreen: document.querySelector("#missionsScreen"),
    baseScreen: document.querySelector("#baseScreen"),
    goBase: document.querySelector("#goBase"),
    activeName: document.querySelector("#activeName"),
    activeStats: document.querySelector("#activeStats"),
    activeLevel: document.querySelector("#activeLevel"),
    hpFill: document.querySelector("#hpFill"),
    hpText: document.querySelector("#hpText"),
    moraleFill: document.querySelector("#moraleFill"),
    moraleText: document.querySelector("#moraleText"),
    insanityFill: document.querySelector("#insanityFill"),
    insanityText: document.querySelector("#insanityText"),
    xpFill: document.querySelector("#xpFill"),
    xpText: document.querySelector("#xpText"),
    roster: document.querySelector("#roster"),
    toast: document.querySelector("#toast")
  };

  function renderAll() {
    const activeSurvivor = getSurvivorById(state, state.activeId);
    renderResources(state, elements);
    renderActive(state, elements, activeSurvivor);
    renderRoster(state, elements, (survivorId) => {
      state.activeId = survivorId;
      renderAll();
      showScreen("missionsScreen");
    });
  }

  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });
    document.querySelector(`#${screenId}`).classList.add("active");
  }

  function toast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => elements.toast.classList.remove("show"), 1800);
  }

  function startMission(key, missionRoot) {
    if (state.running) {
      toast("A survivor is already on a mission.");
      return;
    }

    const mission = state.missions[key];
    const activeSurvivor = getSurvivorById(state, state.activeId);
    const button = missionRoot.querySelector(".start-btn");
    const timer = missionRoot.querySelector(".timer");

    let remaining = mission.seconds;
    state.running = { key, survivorId: activeSurvivor.id };
    button.disabled = true;
    button.textContent = "WORKING";

    updateTimer();

    const interval = setInterval(() => {
      remaining -= 1;
      updateTimer();

      if (remaining <= 0) {
        clearInterval(interval);
        completeMission();
      }
    }, 1000);

    function updateTimer() {
      timer.textContent = `⏱ ${clock(remaining)}`;
      renderRoster(state, elements, (survivorId) => {
        state.activeId = survivorId;
        renderAll();
        showScreen("missionsScreen");
      });
    }

    function completeMission() {
      activeSurvivor.xp += mission.xp;
      activeSurvivor.morale = Math.max(0, activeSurvivor.morale - (key === "platter" ? 2 : 1));
      state.resources[mission.reward] += 1;

      while (activeSurvivor.xp >= activeSurvivor.nextXp) {
        activeSurvivor.xp -= activeSurvivor.nextXp;
        activeSurvivor.level += 1;
        activeSurvivor.nextXp = Math.round(activeSurvivor.nextXp * 1.28);
        activeSurvivor.maxHp += 5;
        activeSurvivor.hp = activeSurvivor.maxHp;
      }

      state.running = null;
      button.disabled = false;
      button.textContent = "START";
      timer.textContent = `⏱ ${clock(mission.seconds)}`;

      renderAll();
      toast(`${activeSurvivor.name} completed ${key === "platter" ? "Sandwich Platter" : "Sandwich"}.`);
    }
  }

  elements.goBase.addEventListener("click", () => showScreen("baseScreen"));

  document.querySelectorAll(".mission").forEach((missionElement) => {
    missionElement
      .querySelector(".start-btn")
      .addEventListener("click", () => startMission(missionElement.dataset.mission, missionElement));
  });

  document.querySelectorAll(".base-tab, .tab").forEach((tab) => {
    tab.addEventListener("click", () => toast("Only the shown screens are implemented."));
  });

  renderAll();
}
