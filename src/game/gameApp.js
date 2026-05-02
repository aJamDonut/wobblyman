import { Components } from "./ecs/components.js";
import { World } from "./ecs/World.js";
import { GameLoop } from "./engine/GameLoop.js";
import { clock } from "./helpers.js";
import { clearPersistedState, loadPersistedState, savePersistedState } from "./persistence.js";
import { renderActive, renderResources, renderRoster } from "./render.js";
import { createMissionTimerPopup } from "./ui/missionTimerPopup.js";
import { createPopupSystem } from "./ui/popupSystem.js";
import {
  addSurvivor,
  createInitialState,
  createRecruitTemplate,
  ensureValidActiveSurvivor,
  getSurvivorById,
  normalizeStateSurvivors,
  removeSurvivor,
  selectNextSurvivor,
  selectPreviousSurvivor,
  selectSurvivor
} from "./state.js";
import { missionProgressSystem } from "./systems/missionProgressSystem.js";
import { survivorRecoverySystem } from "./systems/survivorRecoverySystem.js";

export function createGameApp() {
  const state = loadPersistedState(createInitialState());
  normalizeStateSurvivors(state);
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
    activeStatRows: document.querySelector("#activeStatRows"),
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
    goMissionsBtn: document.querySelector("#goMissionsBtn"),
    resetGameBtn: document.querySelector("#resetGameBtn"),
    popupLayer: document.querySelector("#popupLayer")
  };

  const popupSystem = createPopupSystem(elements.popupLayer);
  const missionTimerPopup = createMissionTimerPopup(popupSystem);

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
    const runningMissionKey = state.running?.key || null;

    document.querySelectorAll(".mission").forEach((missionElement) => {
      const missionKey = missionElement.dataset.mission;
      const button = missionElement.querySelector(".start-btn");

      if (!hasSurvivor) {
        button.disabled = true;
        button.textContent = "START";
        return;
      }

      if (!runningMissionKey) {
        button.disabled = false;
        button.textContent = "START";
        return;
      }

      if (runningMissionKey === missionKey) {
        button.disabled = false;
        button.textContent = "CANCEL";
        return;
      }

      button.disabled = true;
      button.textContent = "WORKING";
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

  function resetStateInPlace(nextState) {
    Object.keys(state).forEach((key) => {
      delete state[key];
    });

    Object.assign(state, nextState);
  }

  function resetGame() {
    const missionEntities = world.getEntitiesWith([Components.MissionProgress]);
    missionEntities.forEach((entityId) => {
      world.removeEntity(entityId);
    });

    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    clearPersistedState();
    resetStateInPlace(createInitialState());
    normalizeStateSurvivors(state);
    renderAll();
    toast("Game reset.");
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

  function beginMission(key, missionRoot, totalSeconds) {
    const selectedSeconds = Math.max(1, Math.floor(totalSeconds));
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
    button.textContent = "CANCEL";

    const missionEntityId = world.createEntity({
      [Components.MissionProgress]: {
        key,
        survivorId: activeSurvivor.id,
        xp: mission.xp,
        reward: mission.reward,
        totalSeconds: selectedSeconds,
        remainingSeconds: selectedSeconds,
        elapsedSeconds: 0
      }
    });

    state.running.entityId = missionEntityId;

    renderMissionTimer(key, selectedSeconds);
    renderAll();
  }

  function cancelMission() {
    if (!state.running) {
      return;
    }

    const { key, entityId } = state.running;
    if (Number.isInteger(entityId)) {
      world.removeEntity(entityId);
    } else {
      const missionEntities = world.getEntitiesWith([Components.MissionProgress]);
      missionEntities.forEach((missionEntityId) => {
        const progress = world.getComponent(missionEntityId, Components.MissionProgress);
        if (progress?.key === key) {
          world.removeEntity(missionEntityId);
        }
      });
    }

    state.running = null;
    renderMissionTimer(key, state.missions[key].seconds);
    renderAll();
    toast("Mission canceled.");
  }

  async function startMission(key, missionRoot) {
    if (state.running) {
      toast("A survivor is already on a mission.");
      return;
    }

    const mission = state.missions[key];
    const activeSurvivor = getSurvivorById(state, state.activeId);
    if (!mission || !activeSurvivor) {
      toast("No survivor selected.");
      return;
    }

    const result = await missionTimerPopup.selectDuration({
      missionKey: key,
      defaultSeconds: mission.seconds
    });

    if (!result || !result.confirmed) {
      return;
    }

    beginMission(key, missionRoot, result.seconds);
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

    activeSurvivor.healthXp += missionProgress.xp;
    activeSurvivor.morale = Math.max(0, activeSurvivor.morale - (missionProgress.key === "platter" ? 2 : 1));
    state.resources[missionProgress.reward] += 1;

    const getLevelXpTarget = () => Math.max(10, Math.round(17 * Math.pow(1.28, Math.max(0, activeSurvivor.level - 1))));

    while (activeSurvivor.healthXp >= getLevelXpTarget()) {
      activeSurvivor.healthXp -= getLevelXpTarget();
      activeSurvivor.level += 1;
      activeSurvivor.healthMax = Math.min(1000, activeSurvivor.healthMax + 5);
      activeSurvivor.health = activeSurvivor.healthMax;
    }

    state.running = null;

    renderMissionTimer(missionProgress.key, state.missions[missionProgress.key].seconds);
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

  elements.resetGameBtn.addEventListener("click", () => {
    resetGame();
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
    missionElement.querySelector(".start-btn").addEventListener("click", () => {
      if (state.running?.key === missionElement.dataset.mission) {
        cancelMission();
        return;
      }

      startMission(missionElement.dataset.mission, missionElement);
    });
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
