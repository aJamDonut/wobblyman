import { Components } from "./ecs/components.js";
import { World } from "./ecs/World.js";
import { GameLoop } from "./engine/GameLoop.js";
import { clock } from "./helpers.js";
import { clearPersistedState, loadPersistedState, savePersistedState } from "./persistence.js";
import { renderActive, renderResources, renderRoster } from "./render.js";
import { createMissionTimerPopup } from "./ui/missionTimerPopup.js";
import { createCharacterPreviewRenderer } from "./ui/characterPreviewRenderer.js";
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
import { gainStatXp } from "./stats.js";
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
    popupLayer: document.querySelector("#popupLayer"),
    missionPanelTitle: document.querySelector("#missionPanelTitle"),
    missionsList: document.querySelector("#missionsList"),
    characterPreviewCanvas: document.querySelector("#characterPreviewCanvas"),
    characterPreviewStatus: document.querySelector("#characterPreviewStatus")
  };

  const popupSystem = createPopupSystem(elements.popupLayer);
  const missionTimerPopup = createMissionTimerPopup(popupSystem);
  const characterPreview = createCharacterPreviewRenderer({
    canvas: elements.characterPreviewCanvas,
    statusLabel: elements.characterPreviewStatus
  });

  function getSurvivorPreviewColors(survivor) {
    const hasShirtColor = typeof survivor?.shirtColor === "string" && survivor.shirtColor.trim() !== "";
    const defaultShirtColor = survivor?.gender === "male" ? "#5f9ecf" : "#d94a35";

    return {
      shirtColor: hasShirtColor ? survivor.shirtColor : defaultShirtColor,
      hairColor: survivor?.gender === "male" ? "#2a2523" : "#6f2d28",
      skinColor: survivor?.gender === "male" ? "#b17a52" : "#cf8b58",
      pantsColor: survivor?.gender === "male" ? "#303946" : "#4a3f5b"
    };
  }

  function getMissionAnimationName(missionKey) {
    if (missionKey === "sandwich") {
      return "sandwich";
    }

    if (missionKey === "platter") {
      return "working";
    }

    return "wave";
  }

  function syncCharacterPreview(activeSurvivor) {
    if (!activeSurvivor) {
      characterPreview.playAnimation("idle", { loop: true });
      return;
    }

    characterPreview.setCharacterProperties(getSurvivorPreviewColors(activeSurvivor));

    if (state.running && state.running.survivorId === activeSurvivor.id) {
      characterPreview.playAnimation(getMissionAnimationName(state.running.key), { loop: true });
      return;
    }

    characterPreview.playAnimation("idle", { loop: true });
  }

  // Expose a function-call API for animation triggers during development/testing.
  window.triggerCharacterPreviewAnimation = (animationName, durationMs = 0) => {
    characterPreview.playAnimation(String(animationName || "idle"), {
      durationMs: Number(durationMs) || 0,
      loop: !durationMs
    });
  };

  function getMissionCategories() {
    return Object.keys(state.missions || {});
  }

  function ensureValidMissionCategory() {
    const categories = getMissionCategories();
    if (categories.length === 0) {
      state.selectedMissionCategory = null;
      return;
    }

    if (!state.selectedMissionCategory || !categories.includes(state.selectedMissionCategory)) {
      state.selectedMissionCategory = categories[0];
    }
  }

  function getMissionCollection(categoryKey) {
    const collection = state.missions?.[categoryKey];
    return collection && typeof collection === "object" ? collection : {};
  }

  function getMission(categoryKey, missionKey) {
    return getMissionCollection(categoryKey)[missionKey] || null;
  }

  function findMissionRoot(categoryKey, missionKey) {
    return [...elements.missionsList.querySelectorAll(".mission")].find(
      (missionElement) =>
        missionElement.dataset.missionCategory === categoryKey && missionElement.dataset.mission === missionKey
    );
  }

  function getRunningMissionProgress() {
    if (!state.running) {
      return null;
    }

    if (Number.isInteger(state.running.entityId)) {
      return world.getComponent(state.running.entityId, Components.MissionProgress) || null;
    }

    const missionEntityIds = world.getEntitiesWith([Components.MissionProgress]);
    for (const missionEntityId of missionEntityIds) {
      const progress = world.getComponent(missionEntityId, Components.MissionProgress);
      if (!progress) {
        continue;
      }

      if (progress.categoryKey === state.running.categoryKey && progress.key === state.running.key) {
        return progress;
      }
    }

    return null;
  }

  function renderMissionTabs() {
    document.querySelectorAll(".tab[data-mission-category]").forEach((tab) => {
      const isActive = tab.dataset.missionCategory === state.selectedMissionCategory;
      tab.classList.toggle("active", isActive);
    });
  }

  function renderMissionsList() {
    ensureValidMissionCategory();

    const categoryKey = state.selectedMissionCategory;
    const missionCollection = getMissionCollection(categoryKey);
    const missionEntries = Object.entries(missionCollection);
    const categoryTitle = String(categoryKey || "missions").toUpperCase();
    const runningProgress = getRunningMissionProgress();

    elements.missionPanelTitle.textContent = categoryTitle;
    elements.missionsList.innerHTML = "";

    if (missionEntries.length === 0) {
      elements.missionsList.innerHTML = '<div class="card mission-empty">No missions in this category yet.</div>';
      return;
    }

    missionEntries.forEach(([missionKey, mission]) => {
      const missionElement = document.createElement("div");
      missionElement.className = "card mission";
      missionElement.dataset.missionCategory = categoryKey;
      missionElement.dataset.mission = missionKey;

      const timerSeconds =
        runningProgress && runningProgress.categoryKey === categoryKey && runningProgress.key === missionKey
          ? runningProgress.remainingSeconds
          : mission.seconds;

      const riskMarkup = mission.riskLabel ? `<div class="low">${mission.riskLabel}</div>` : "";

      missionElement.innerHTML = `
        <div>
          <h2>${mission.title}</h2>
          <div class="provides">Provides</div>
          <div class="reward-row">
            <div>
              <div class="reward"><span class="sandwich">🥪</span>${mission.rewardLabel}</div>
              ${riskMarkup}
            </div>
            <div class="reward xp-chip"><span class="xp-dot">XP</span>${mission.xpLabel}</div>
          </div>
        </div>
        <div class="start-block"><button class="start-btn">START</button><div class="timer">⏱ ${clock(timerSeconds)}</div></div>`;

      missionElement.querySelector(".start-btn").addEventListener("click", () => {
        if (state.running?.categoryKey === categoryKey && state.running?.key === missionKey) {
          cancelMission();
          return;
        }

        startMission(categoryKey, missionKey);
      });

      elements.missionsList.appendChild(missionElement);
    });
  }

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
    const runningMissionCategory = state.running?.categoryKey || null;
    const runningMissionKey = state.running?.key || null;

    elements.missionsList.querySelectorAll(".mission").forEach((missionElement) => {
      const missionCategory = missionElement.dataset.missionCategory;
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

      if (runningMissionCategory === missionCategory && runningMissionKey === missionKey) {
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
    ensureValidMissionCategory();
    ensureValidActiveSurvivor(state);
    const activeSurvivor = getSurvivorById(state, state.activeId);
    renderResources(state, elements);
    renderActive(state, elements, activeSurvivor);
    renderMissionTabs();
    renderMissionsList();
    renderRoster(state, elements, onSelectSurvivor);
    updateSurvivorSummary();
    syncActionButtons();
    syncCharacterPreview(activeSurvivor);
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

  function beginMission(categoryKey, missionKey, totalSeconds) {
    if (state.running) {
      toast("A survivor is already on a mission.");
      return;
    }

    const mission = getMission(categoryKey, missionKey);
    const activeSurvivor = getSurvivorById(state, state.activeId);
    if (!mission || !activeSurvivor) {
      toast("No survivor selected.");
      return;
    }

    const cycleSeconds = Math.max(1, Math.floor(mission.seconds || 1));
    const selectedSeconds = Math.max(cycleSeconds, Math.floor(totalSeconds));

    state.running = { categoryKey, key: missionKey, survivorId: activeSurvivor.id };

    const missionEntityId = world.createEntity({
      [Components.MissionProgress]: {
        categoryKey,
        key: missionKey,
        survivorId: activeSurvivor.id,
        xp: mission.xp,
        statXp: mission.statXp || null,
        reward: mission.reward,
        rewardLabel: mission.rewardLabel,
        cycleSeconds,
        cycleRemainingSeconds: cycleSeconds,
        cyclesCompleted: 0,
        totalSeconds: selectedSeconds,
        remainingSeconds: selectedSeconds,
        elapsedSeconds: 0
      }
    });

    state.running.entityId = missionEntityId;
    characterPreview.playAnimation(getMissionAnimationName(missionKey), { loop: true });

    renderMissionTimer(categoryKey, missionKey, selectedSeconds);
    renderAll();
  }

  function cancelMission() {
    if (!state.running) {
      return;
    }

    const { categoryKey, key, entityId } = state.running;
    if (Number.isInteger(entityId)) {
      world.removeEntity(entityId);
    } else {
      const missionEntities = world.getEntitiesWith([Components.MissionProgress]);
      missionEntities.forEach((missionEntityId) => {
        const progress = world.getComponent(missionEntityId, Components.MissionProgress);
        if (progress?.categoryKey === categoryKey && progress?.key === key) {
          world.removeEntity(missionEntityId);
        }
      });
    }

    state.running = null;
    characterPreview.playAnimation("idle", { loop: true });
    renderAll();
    toast("Mission canceled.");
  }

  async function startMission(categoryKey, missionKey) {
    if (state.running) {
      toast("A survivor is already on a mission.");
      return;
    }

    const mission = getMission(categoryKey, missionKey);
    const activeSurvivor = getSurvivorById(state, state.activeId);
    if (!mission || !activeSurvivor) {
      toast("No survivor selected.");
      return;
    }

    const result = await missionTimerPopup.selectDuration({
      missionKey,
      missionTitle: mission.title,
      defaultSeconds: mission.seconds
    });

    if (!result || !result.confirmed) {
      return;
    }

    beginMission(categoryKey, missionKey, result.seconds);
  }

  function renderMissionTimer(categoryKey, missionKey, remainingSeconds) {
    const missionRoot = findMissionRoot(categoryKey, missionKey);
    if (!missionRoot) {
      return;
    }

    missionRoot.querySelector(".timer").textContent = `⏱ ${clock(remainingSeconds)}`;
  }

  function completeMission(missionProgress) {
    state.running = null;
    characterPreview.playAnimation("celebrate", { durationMs: 900 });

    renderAll();

    const mission = getMission(missionProgress.categoryKey, missionProgress.key);
    const cycles = missionProgress.cyclesCompleted || 0;
    if (cycles > 0) {
      toast(`Completed ${mission?.title || "mission"}: ${cycles} cycle${cycles === 1 ? "" : "s"}.`);
    } else {
      toast(`${mission?.title || "Mission"} finished with no full cycle completed.`);
    }
  }

  function applyMissionCycleRewards(missionProgress) {
    const activeSurvivor = getSurvivorById(state, missionProgress.survivorId);
    if (!activeSurvivor) {
      return;
    }

    const mission = getMission(missionProgress.categoryKey, missionProgress.key);

    activeSurvivor.healthXp += missionProgress.xp;

    const statXpAwards =
      missionProgress.statXp && typeof missionProgress.statXp === "object"
        ? missionProgress.statXp
        : mission?.statXp;

    if (statXpAwards && typeof statXpAwards === "object") {
      Object.entries(statXpAwards).forEach(([statKey, xpAmount]) => {
        gainStatXp(activeSurvivor, statKey, xpAmount);
      });
    }

    activeSurvivor.morale = Math.max(0, activeSurvivor.morale - (missionProgress.key === "platter" ? 2 : 1));
    state.resources[missionProgress.reward] += 1;

    if (missionProgress.key === "sandwich") {
      characterPreview.playAnimation("celebrate", { durationMs: 550 });
    }

    const getLevelXpTarget = () => Math.max(10, Math.round(17 * Math.pow(1.28, Math.max(0, activeSurvivor.level - 1))));

    while (activeSurvivor.healthXp >= getLevelXpTarget()) {
      activeSurvivor.healthXp -= getLevelXpTarget();
      activeSurvivor.level += 1;
      activeSurvivor.healthMax = Math.min(1000, activeSurvivor.healthMax + 5);
      activeSurvivor.health = activeSurvivor.healthMax;
    }

    renderAll();
  }

  gameLoop.addSystem(missionProgressSystem, {
    onMissionTick: (missionProgress) => {
      renderMissionTimer(missionProgress.categoryKey, missionProgress.key, missionProgress.remainingSeconds);
      renderRoster(state, elements, onSelectSurvivor);
    },
    onMissionCycleComplete: applyMissionCycleRewards,
    onMissionComplete: completeMission
  });

  gameLoop.addSystem(survivorRecoverySystem, {
    state,
    onStateChanged: renderAll
  });

  gameLoop.start(world);

  window.addEventListener("beforeunload", () => {
    characterPreview.destroy();
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

  document.querySelectorAll(".tab[data-mission-category]").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.selectedMissionCategory = tab.dataset.missionCategory;
      renderAll();
    });
  });

  document.querySelectorAll(".base-tab").forEach((tab) => {
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
