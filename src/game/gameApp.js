import { Components } from "./ecs/components.js";
import { World } from "./ecs/World.js";
import { GameLoop } from "./engine/GameLoop.js";
import { clock } from "./helpers.js";
import { loadPersistedState, savePersistedState } from "./persistence.js";
import { renderActive, renderResources, renderRoster } from "./render.js";
import {
  addSurvivor,
  createInitialState,
  createRecruitTemplate,
  ensureValidActiveSurvivor,
  getSurvivorById,
  removeSurvivor,
  selectNextSurvivor,
  selectPreviousSurvivor,
  selectSurvivor
} from "./state.js";
import { missionProgressSystem } from "./systems/missionProgressSystem.js";
import { survivorRecoverySystem } from "./systems/survivorRecoverySystem.js";

export function createGameApp() {
  const state = loadPersistedState(createInitialState());
  const world = new World();
  const gameLoop = new GameLoop();
  let saveTimer = null;

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
    toast: document.querySelector("#toast"),
    survivorsSummary: document.querySelector("#survivorsSummary"),
    survivorCountChip: document.querySelector("#survivorCountChip"),
    prevSurvivorBtn: document.querySelector("#prevSurvivorBtn"),
    nextSurvivorBtn: document.querySelector("#nextSurvivorBtn"),
    addSurvivorBtn: document.querySelector("#addSurvivorBtn"),
    removeSurvivorBtn: document.querySelector("#removeSurvivorBtn"),
    goMissionsBtn: document.querySelector("#goMissionsBtn")
  };

  const missionRoots = new Map(
    [...document.querySelectorAll(".mission")].map((missionElement) => [missionElement.dataset.mission, missionElement])
  );

  function onSelectSurvivor(survivorId) {
    selectSurvivor(state, survivorId);
    renderAll();
    showScreen("missionsScreen");
  }

  function updateSurvivorSummary() {
    elements.survivorsSummary.textContent = `Survivors: ${state.survivors.length}/${state.survivorCapacity}`;
    elements.survivorCountChip.textContent = String(state.survivors.length);
  }

  function syncActionButtons() {
    const hasSurvivor = Boolean(getSurvivorById(state, state.activeId));

    document.querySelectorAll(".start-btn").forEach((button) => {
      button.disabled = !hasSurvivor || Boolean(state.running);
    });

    elements.prevSurvivorBtn.disabled = !hasSurvivor;
    elements.nextSurvivorBtn.disabled = !hasSurvivor;
    elements.removeSurvivorBtn.disabled = !hasSurvivor || Boolean(state.running);
    elements.addSurvivorBtn.disabled = state.survivors.length >= state.survivorCapacity;
    elements.goMissionsBtn.disabled = !hasSurvivor;
  }

  function renderAll() {
    ensureValidActiveSurvivor(state);
    const activeSurvivor = getSurvivorById(state, state.activeId);
    renderResources(state, elements);
    renderActive(state, elements, activeSurvivor);
    renderRoster(state, elements, onSelectSurvivor);
    updateSurvivorSummary();
    syncActionButtons();
    queuePersist();
  }

  function queuePersist() {
    if (saveTimer !== null) {
      return;
    }

    saveTimer = setTimeout(() => {
      saveTimer = null;
      savePersistedState(state);
    }, 120);
  }

  function flushPersist() {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    savePersistedState(state);
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
    if (!activeSurvivor) {
      toast("No survivor selected.");
      return;
    }

    const button = missionRoot.querySelector(".start-btn");
    state.running = { key, survivorId: activeSurvivor.id };
    button.disabled = true;
    button.textContent = "WORKING";

    world.createEntity({
      [Components.MissionProgress]: {
        key,
        survivorId: activeSurvivor.id,
        xp: mission.xp,
        reward: mission.reward,
        totalSeconds: mission.seconds,
        remainingSeconds: mission.seconds,
        elapsedSeconds: 0
      }
    });

    renderMissionTimer(key, mission.seconds);
    renderAll();
  }

  function renderMissionTimer(missionKey, remainingSeconds) {
    const missionRoot = missionRoots.get(missionKey);
    if (!missionRoot) {
      return;
    }

    missionRoot.querySelector(".timer").textContent = `⏱ ${clock(remainingSeconds)}`;
  }

  function completeMission(missionProgress) {
    const activeSurvivor = getSurvivorById(state, missionProgress.survivorId);
    if (!activeSurvivor) {
      return;
    }

    activeSurvivor.xp += missionProgress.xp;
    activeSurvivor.morale = Math.max(0, activeSurvivor.morale - (missionProgress.key === "platter" ? 2 : 1));
    state.resources[missionProgress.reward] += 1;

    while (activeSurvivor.xp >= activeSurvivor.nextXp) {
      activeSurvivor.xp -= activeSurvivor.nextXp;
      activeSurvivor.level += 1;
      activeSurvivor.nextXp = Math.round(activeSurvivor.nextXp * 1.28);
      activeSurvivor.maxHp += 5;
      activeSurvivor.hp = activeSurvivor.maxHp;
    }

    state.running = null;

    const missionRoot = missionRoots.get(missionProgress.key);
    if (missionRoot) {
      const button = missionRoot.querySelector(".start-btn");
      button.disabled = false;
      button.textContent = "START";
    }

    renderMissionTimer(missionProgress.key, missionProgress.totalSeconds);
    renderAll();
    toast(
      `${activeSurvivor.name} completed ${missionProgress.key === "platter" ? "Sandwich Platter" : "Sandwich"}.`
    );
  }

  gameLoop.addSystem(missionProgressSystem, {
    onMissionTick: (missionProgress) => {
      renderMissionTimer(missionProgress.key, missionProgress.remainingSeconds);
      renderRoster(state, elements, onSelectSurvivor);
    },
    onMissionComplete: completeMission
  });

  gameLoop.addSystem(survivorRecoverySystem, {
    state,
    onStateChanged: renderAll
  });

  gameLoop.start(world);

  window.addEventListener("beforeunload", () => {
    gameLoop.stop();
    flushPersist();
  });

  elements.goBase.addEventListener("click", () => showScreen("baseScreen"));

  elements.prevSurvivorBtn.addEventListener("click", () => {
    selectPreviousSurvivor(state);
    renderAll();
  });

  elements.nextSurvivorBtn.addEventListener("click", () => {
    selectNextSurvivor(state);
    renderAll();
  });

  elements.addSurvivorBtn.addEventListener("click", () => {
    const recruit = createRecruitTemplate(state.survivors.length);
    const result = addSurvivor(state, recruit);

    if (!result.ok) {
      toast("Survivor capacity reached.");
      return;
    }

    renderAll();
    toast(`${result.survivor.name} joined the base.`);
  });

  elements.removeSurvivorBtn.addEventListener("click", () => {
    if (state.running) {
      toast("Cannot dismiss while a mission is active.");
      return;
    }

    const activeSurvivor = getSurvivorById(state, state.activeId);
    if (!activeSurvivor) {
      toast("No survivor selected.");
      return;
    }

    const result = removeSurvivor(state, activeSurvivor.id);
    if (!result.ok) {
      toast("Unable to dismiss survivor.");
      return;
    }

    renderAll();
    toast(`${result.survivor.name} left the base.`);
  });

  elements.goMissionsBtn.addEventListener("click", () => {
    showScreen("missionsScreen");
  });

  document.querySelectorAll(".mission").forEach((missionElement) => {
    missionElement
      .querySelector(".start-btn")
      .addEventListener("click", () => startMission(missionElement.dataset.mission, missionElement));
  });

  document.querySelectorAll(".base-tab, .tab").forEach((tab) => {
    tab.addEventListener("click", () => toast("Only the shown screens are implemented."));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      selectPreviousSurvivor(state);
      renderAll();
    }

    if (event.key === "ArrowRight") {
      selectNextSurvivor(state);
      renderAll();
    }
  });

  renderAll();
}
