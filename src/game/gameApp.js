import { Components } from "./ecs/components.js";
import { World } from "./ecs/World.js";
import { GameLoop } from "./engine/GameLoop.js";
import { clock } from "./helpers.js";
import { clearPersistedState, loadPersistedState, savePersistedState } from "./persistence.js";
import { renderActive, renderMissionsCash, renderResources, renderRoster } from "./render.js";
import { createCharacterPreviewRenderer } from "./ui/characterPreviewRenderer.js";
import { createMissionCompletionPopup } from "./ui/missionCompletionPopup.js";
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
import { applyStatDelta, gainStatXp } from "./stats.js";
import { missionProgressSystem } from "./systems/missionProgressSystem.js";
import { survivorRecoverySystem } from "./systems/survivorRecoverySystem.js";

export function createGameApp() {
  const STAT_CHANGE_TICK_SECONDS = 0.25;
  const state = loadPersistedState(createInitialState());
  normalizeStateSurvivors(state);
  const world = new World();
  const gameLoop = new GameLoop();
  let saveTimer = null;

  const elements = {
    resources: document.querySelector("#resources"),
    missionsScreen: document.querySelector("#missionsScreen"),
    baseScreen: document.querySelector("#baseScreen"),
    strongholdScreen: document.querySelector("#strongholdScreen"),
    goBase: document.querySelector("#goBase"),
    goBaseFromStronghold: document.querySelector("#goBaseFromStronghold"),
    activeName: document.querySelector("#activeName"),
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
    openStrongholdBtn: document.querySelector("#openStrongholdBtn"),
    openSurvivorsBtn: document.querySelector("#openSurvivorsBtn"),
    resetGameBtn: document.querySelector("#resetGameBtn"),
    popupLayer: document.querySelector("#popupLayer"),
    actionsMenuBtn: document.querySelector("#actionsMenuBtn"),
    missionActionsOverlay: document.querySelector("#missionActionsOverlay"),
    missionActionsCloseBtn: document.querySelector("#missionActionsCloseBtn"),
    missionPanelTitle: document.querySelector("#missionPanelTitle"),
    missionsCash: document.querySelector("#missionsCash"),
    missionsList: document.querySelector("#missionsList"),
    characterPreviewPanel: document.querySelector(".character-preview-panel"),
    characterPreviewCanvas: document.querySelector("#characterPreviewCanvas"),
    characterPreviewMissionStatus: document.querySelector("#characterPreviewMissionStatus"),
    characterPreviewCaption: document.querySelector("#characterPreviewCaption"),
    characterPreviewStatus: document.querySelector("#characterPreviewStatus"),
    characterPreviewHairStyle: document.querySelector("#characterPreviewHairStyle"),
    characterPreviewEyeStyle: document.querySelector("#characterPreviewEyeStyle"),
    characterPreviewBodyType: document.querySelector("#characterPreviewBodyType"),
    characterPreviewPet: document.querySelector("#characterPreviewPet"),
    characterPreviewHolderToggle: document.querySelector("#characterPreviewHolderToggle"),
    characterPreviewPerspective: document.querySelector("#characterPreviewPerspective"),
    characterPreviewPerspectiveValue: document.querySelector("#characterPreviewPerspectiveValue"),
    characterPreviewPropTool: document.querySelector("#characterPreviewPropTool"),
    characterPreviewPropAnimation: document.querySelector("#characterPreviewPropAnimation"),
    characterPreviewPropOffsetX: document.querySelector("#characterPreviewPropOffsetX"),
    characterPreviewPropOffsetY: document.querySelector("#characterPreviewPropOffsetY"),
    characterPreviewPropOffsetZ: document.querySelector("#characterPreviewPropOffsetZ"),
    characterPreviewPropScale: document.querySelector("#characterPreviewPropScale"),
    characterPreviewPropRotation: document.querySelector("#characterPreviewPropRotation"),
    characterPreviewPropOffsetXValue: document.querySelector("#characterPreviewPropOffsetXValue"),
    characterPreviewPropOffsetYValue: document.querySelector("#characterPreviewPropOffsetYValue"),
    characterPreviewPropOffsetZValue: document.querySelector("#characterPreviewPropOffsetZValue"),
    characterPreviewPropScaleValue: document.querySelector("#characterPreviewPropScaleValue"),
    characterPreviewPropRotationValue: document.querySelector("#characterPreviewPropRotationValue"),
    characterPreviewCopyProp: document.querySelector("#characterPreviewCopyProp"),
    characterPreviewPasteProp: document.querySelector("#characterPreviewPasteProp"),
    characterPreviewPropPayload: document.querySelector("#characterPreviewPropPayload"),
    strongholdStage: document.querySelector("#strongholdStage")
  };

  const popupSystem = createPopupSystem(elements.popupLayer);
  const missionCompletionPopup = createMissionCompletionPopup(popupSystem);
  const characterPreview = createCharacterPreviewRenderer({
    canvas: elements.characterPreviewCanvas,
    statusLabel: elements.characterPreviewStatus
  });
  const previewTestAnimations = [
    "idle",
    "wave",
    "sandwich",
    "working",
    "celebrate",
    "sleep",
    "talk",
    "shower",
    "wash",
    "dig",
    "search"
  ];
  const previewHairStyles = characterPreview.getHairStyles();
  const previewEyeStyles = characterPreview.getEyeStyles();
  const previewBodyTypes = characterPreview.getBodyTypes();
  const previewPetTypes = characterPreview.getPetTypes();
  const previewPropAnimations = characterPreview.getPropAnimations();
  const mobilePreviewQuery = window.matchMedia("(max-width: 640px)");
  const previewPanelDesktopParent = elements.characterPreviewPanel?.parentElement || null;
  const previewPanelDesktopNextSibling = elements.characterPreviewPanel?.nextSibling || null;
  let previewAnimationOverride = null;
  let previewAnimationCycleIndex = -1;
  let previewHairStyleCycleIndex = Math.max(0, previewHairStyles.indexOf("hat-fedora"));
  let previewEyeStyleCycleIndex = Math.max(0, previewEyeStyles.indexOf("classic"));
  let previewBodyTypeCycleIndex = Math.max(0, previewBodyTypes.indexOf("classic"));
  let previewPetTypeCycleIndex = Math.max(0, previewPetTypes.indexOf("cat"));
  let previewPerspectiveTilt = 35;
  let previewDevToolsVisible = false;
  let selectedPropAnimation = previewPropAnimations[0] || null;
  let isMissionActionsOverlayOpen = false;
  const strongholdRenderers = [];
  let strongholdRosterSignature = "";

  function isMobileActionsPopupMode() {
    return mobilePreviewQuery.matches;
  }

  function setMissionActionsOverlayOpen(nextOpen) {
    const usesPopup = isMobileActionsPopupMode();
    const shouldOpen = usesPopup && Boolean(nextOpen);
    isMissionActionsOverlayOpen = shouldOpen;

    if (elements.actionsMenuBtn) {
      elements.actionsMenuBtn.setAttribute("aria-expanded", String(shouldOpen));
      elements.actionsMenuBtn.textContent = shouldOpen ? "Close" : "Actions";
    }

    if (elements.missionActionsOverlay) {
      elements.missionActionsOverlay.classList.toggle("show", shouldOpen);
      elements.missionActionsOverlay.setAttribute("aria-hidden", String(usesPopup ? !shouldOpen : false));
    }

    document.body.classList.toggle("mission-actions-open", shouldOpen);
  }

  function toggleMissionActionsOverlay() {
    if (!isMobileActionsPopupMode()) {
      return;
    }

    setMissionActionsOverlayOpen(!isMissionActionsOverlayOpen);
  }

  function syncPreviewDevToolsVisibility() {
    if (!elements.characterPreviewCaption) {
      return;
    }

    elements.characterPreviewCaption.hidden = !previewDevToolsVisible;
    elements.characterPreviewCaption.setAttribute("aria-hidden", String(!previewDevToolsVisible));
  }

  function syncMobilePreviewPlacement() {
    const previewPanel = elements.characterPreviewPanel;
    const statBars = elements.activeStatRows;
    if (!previewPanel || !statBars) {
      return;
    }

    if (mobilePreviewQuery.matches) {
      const profileBody = statBars.parentElement;
      if (profileBody && previewPanel.parentElement !== profileBody) {
        profileBody.insertBefore(previewPanel, statBars);
      }
      return;
    }

    if (previewPanelDesktopParent && previewPanel.parentElement !== previewPanelDesktopParent) {
      previewPanelDesktopParent.insertBefore(previewPanel, previewPanelDesktopNextSibling);
    }
  }

  function formatPropValue(value, digits = 0) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return digits > 0 ? Number(0).toFixed(digits) : "0";
    }

    return digits > 0 ? numericValue.toFixed(digits) : String(Math.round(numericValue));
  }

  function syncPropControlLabels(transform) {
    elements.characterPreviewPropOffsetXValue.textContent = formatPropValue(transform.x, 0);
    elements.characterPreviewPropOffsetYValue.textContent = formatPropValue(transform.y, 0);
    elements.characterPreviewPropOffsetZValue.textContent = formatPropValue(transform.z, 0);
    elements.characterPreviewPropScaleValue.textContent = formatPropValue(transform.scale, 2);
    elements.characterPreviewPropRotationValue.textContent = formatPropValue(transform.rotation, 0);
  }

  function syncPropPayloadForSelection() {
    if (!selectedPropAnimation) {
      elements.characterPreviewPropPayload.value = "";
      return;
    }

    elements.characterPreviewPropPayload.value = characterPreview.exportPropTransforms(selectedPropAnimation);
  }

  function syncPropControlsFromRenderer() {
    if (!selectedPropAnimation) {
      return;
    }

    const currentTransform = characterPreview.getPropTransform(selectedPropAnimation);
    if (!currentTransform) {
      return;
    }

    elements.characterPreviewPropOffsetX.value = String(currentTransform.x);
    elements.characterPreviewPropOffsetY.value = String(currentTransform.y);
    elements.characterPreviewPropOffsetZ.value = String(currentTransform.z);
    elements.characterPreviewPropScale.value = String(currentTransform.scale);
    elements.characterPreviewPropRotation.value = String(currentTransform.rotation);
    syncPropControlLabels(currentTransform);
    syncPropPayloadForSelection();
  }

  function syncPropAnimationSelectionFromCurrentAnimation() {
    const activeAnimation = characterPreview.getCurrentAnimation();
    if (!previewPropAnimations.includes(activeAnimation)) {
      return;
    }

    selectedPropAnimation = activeAnimation;
    elements.characterPreviewPropAnimation.value = selectedPropAnimation;
    syncPropControlsFromRenderer();
  }

  function applyPropControlInputs() {
    if (!selectedPropAnimation) {
      return;
    }

    characterPreview.setPropTransform(selectedPropAnimation, {
      x: Number(elements.characterPreviewPropOffsetX.value),
      y: Number(elements.characterPreviewPropOffsetY.value),
      z: Number(elements.characterPreviewPropOffsetZ.value),
      scale: Number(elements.characterPreviewPropScale.value),
      rotation: Number(elements.characterPreviewPropRotation.value)
    });

    const updatedTransform = characterPreview.getPropTransform(selectedPropAnimation);
    if (!updatedTransform) {
      return;
    }

    syncPropControlLabels(updatedTransform);
    syncPropPayloadForSelection();
  }

  async function copySelectedPropSettings() {
    if (!selectedPropAnimation) {
      toast("No prop animation available.");
      return;
    }

    const payload = characterPreview.exportPropTransforms(selectedPropAnimation);
    elements.characterPreviewPropPayload.value = payload;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(payload);
        toast(`Copied ${selectedPropAnimation} prop settings.`);
        return;
      } catch {
        // Fall through to textarea-only behavior.
      }
    }

    toast("Prop settings placed in payload box.");
  }

  function pastePropSettingsFromPayload() {
    const payload = String(elements.characterPreviewPropPayload.value || "").trim();
    if (!payload) {
      toast("Paste prop JSON into the payload box first.");
      return;
    }

    const result = characterPreview.importPropTransforms(payload);
    if (!result.ok) {
      toast("Invalid prop payload.");
      return;
    }

    if (result.applied.length === 1) {
      selectedPropAnimation = result.applied[0];
      elements.characterPreviewPropAnimation.value = selectedPropAnimation;
    }

    syncPropControlsFromRenderer();
    toast(`Applied prop settings: ${result.applied.join(", ")}.`);
  }

  function syncHairStyleLabel() {
    const activeHairStyle = previewHairStyles[previewHairStyleCycleIndex] || "classic";
    elements.characterPreviewHairStyle.textContent = activeHairStyle.toUpperCase();
  }

  function syncBodyTypeLabel() {
    const activeBodyType = previewBodyTypes[previewBodyTypeCycleIndex] || "classic";
    elements.characterPreviewBodyType.textContent = activeBodyType.toUpperCase();
  }

  function syncEyeStyleLabel() {
    const activeEyeStyle = previewEyeStyles[previewEyeStyleCycleIndex] || "classic";
    elements.characterPreviewEyeStyle.textContent = activeEyeStyle.toUpperCase();
  }

  function syncPetTypeLabel() {
    const activePetType = previewPetTypes[previewPetTypeCycleIndex] || "cat";
    elements.characterPreviewPet.textContent = activePetType.toUpperCase();
  }

  function syncPerspectiveLabel() {
    elements.characterPreviewPerspectiveValue.textContent = String(Math.round(previewPerspectiveTilt));
  }

  function syncHolderToggleLabel() {
    if (!elements.characterPreviewHolderToggle) {
      return;
    }

    const isVisible = characterPreview.getHolderVisibility();
    elements.characterPreviewHolderToggle.textContent = isVisible ? "HOLDER: ON" : "HOLDER: OFF";
    elements.characterPreviewHolderToggle.setAttribute("aria-pressed", String(isVisible));
  }

  function applyPreviewAnimationOverride() {
    if (!previewAnimationOverride) {
      syncCharacterPreview(getSurvivorById(state, state.activeId));
      syncPropAnimationSelectionFromCurrentAnimation();
      return;
    }

    characterPreview.playAnimation(previewAnimationOverride, { loop: true });
    syncPropAnimationSelectionFromCurrentAnimation();
  }

  function getSurvivorPreviewColors(survivor) {
    const palettes = {
      shirt: ["#d94a35", "#5f9ecf", "#c45f86", "#4f8754", "#b86f2f", "#6e63b7", "#2d9a8b", "#a54d63", "#8f6a46", "#3b6ea6"],
      hair: ["#1a1412", "#2a2523", "#3f2a1e", "#5c3d2b", "#6f2d28", "#7a4f2a", "#8b5e3c", "#a67c52", "#bfa079", "#c57b62", "#7f3f63", "#4a3f7a", "#355a7c", "#4d4d4d"],
      skin: ["#e2b48d", "#d8a47e", "#cf8b58", "#b17a52", "#9f6b45", "#8a5a39", "#6f472f", "#5a3a27"],
      pants: ["#303946", "#4a3f5b", "#3e4a34", "#5a4637", "#364f5c", "#4a4a4a", "#3f3560", "#42553a", "#2f4651", "#5a3d4a"],
      shoes: ["#1f2328", "#2b2b2b", "#352d27", "#2c2430", "#2a2f36", "#3a3128", "#343434", "#2d2a25"]
    };

    const legacyLightSkinRemap = {
      "#f5d6b8": "#d8a47e",
      "#efc7a5": "#cf8b58"
    };

    const seedSource = `${survivor?.id || ""}:${survivor?.name || ""}:${survivor?.gender || ""}`;
    let seed = 0;
    for (let index = 0; index < seedSource.length; index += 1) {
      seed = (seed * 33 + seedSource.charCodeAt(index)) % 2147483647;
    }

    const pickFromPalette = (palette, offset) => {
      const paletteIndex = Math.abs(seed + offset) % palette.length;
      return palette[paletteIndex];
    };

    const safeColor = (value, fallback) => {
      return typeof value === "string" && value.trim() !== "" ? value : fallback;
    };

    const safeSkinColor = (value, fallback) => {
      const resolved = safeColor(value, fallback);
      const normalized = String(resolved).trim().toLowerCase();
      return legacyLightSkinRemap[normalized] || resolved;
    };

    return {
      shirtColor: safeColor(survivor?.shirtColor, pickFromPalette(palettes.shirt, 7)),
      hairColor: safeColor(survivor?.hairColor, pickFromPalette(palettes.hair, 13)),
      skinColor: safeSkinColor(survivor?.skinColor, pickFromPalette(palettes.skin, 19)),
      pantsColor: safeColor(survivor?.pantsColor, pickFromPalette(palettes.pants, 23)),
      shoeColor: safeColor(survivor?.shoeColor, pickFromPalette(palettes.shoes, 29))
    };
  }

  function getMissionAnimationName(missionKey) {
    const missionAnimationMap = {
      workout: "pushups",
      pushups: "pushups",
      shower: "shower",
      wash: "wash",
      dig: "dig",
      search: "search",
      hunt: "hunt",
      cook: "cook"
    };

    if (missionAnimationMap[missionKey]) {
      return missionAnimationMap[missionKey];
    }

    if (missionKey === "sandwich") {
      return "sandwich";
    }

    if (missionKey === "platter") {
      return "working";
    }

    return "wave";
  }

  function hashString(input) {
    const text = String(input || "");
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) % 2147483647;
    }
    return Math.abs(hash);
  }

  function chooseStrongholdAnimation(survivor, index) {
    const groupPhotoAnimations = ["idle", "celebrate", "talk"];
    const styleSeed = hashString(`${survivor.id}:${index}`);
    return groupPhotoAnimations[styleSeed % groupPhotoAnimations.length];
  }

  function clearStrongholdRenderers() {
    while (strongholdRenderers.length > 0) {
      const renderer = strongholdRenderers.pop();
      renderer.destroy();
    }
  }

  function buildStrongholdSignature() {
    const missionKey = state.running?.key || "none";
    const missionSurvivorId = state.running?.survivorId || "none";
    return state.survivors
      .map((survivor) => {
        return [
          survivor.id,
          survivor.name,
          survivor.gender,
          survivor.shirtColor,
          survivor.hairColor,
          survivor.skinColor,
          survivor.pantsColor,
          survivor.shoeColor,
          missionSurvivorId === survivor.id ? missionKey : "idle"
        ].join("|");
      })
      .join("||");
  }

  function createStrongholdSurvivorCard(survivor, index, total) {
    const card = document.createElement("article");
    card.className = "stronghold-survivor";

    const rowWidth = Math.max(3, Math.min(8, Math.ceil(Math.sqrt(total) * 1.45)));
    const rowIndex = Math.floor(index / rowWidth);
    const rowCount = Math.ceil(total / rowWidth);
    const rowStart = rowIndex * rowWidth;
    const rowSize = Math.min(rowWidth, total - rowStart);
    const indexInRow = index - rowStart;
    const centerOffset = indexInRow - (rowSize - 1) / 2;
    const distanceFromCenter = Math.abs(centerOffset);

    const spacing = Math.max(28, 52 - rowIndex * 1.4);
    const horizontalOffset = Math.round(centerOffset * spacing);
    const rowWave = Math.sin((indexInRow + rowIndex * 0.7) * 1.4) * 12;
    const depthOffset = rowIndex * 60 + distanceFromCenter * 8 + (rowCount > 1 ? 14 : 0);
    const centerBias = -Math.round((rowCount - 1) * 30);
    const verticalOffset = Math.round(depthOffset + rowWave + centerBias);
    const scale = Math.min(1.1, Math.max(0.55, 0.72 + verticalOffset * 0.009));
    const zIndex = Math.max(1, 1000 + verticalOffset);

    card.style.setProperty("--photo-x", `${horizontalOffset}px`);
    card.style.setProperty("--photo-y", `${verticalOffset}px`);
    card.style.setProperty("--photo-scale", String(scale));
    card.style.setProperty("--photo-z", String(zIndex));
    card.style.setProperty("--photo-opacity", "1");

    const canvas = document.createElement("canvas");
    canvas.className = "stronghold-character-canvas";
    canvas.setAttribute("aria-label", `${survivor.name} stronghold preview`);
    card.appendChild(canvas);

    return { card, canvas };
  }

  function renderStrongholdScene(force = false) {
    if (!elements.strongholdStage) {
      return;
    }

    const nextSignature = buildStrongholdSignature();
    if (!force && nextSignature === strongholdRosterSignature) {
      return;
    }

    strongholdRosterSignature = nextSignature;
    clearStrongholdRenderers();
    elements.strongholdStage.innerHTML = "";

    if (state.survivors.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "stronghold-empty";
      emptyState.textContent = "No survivors available. Recruit someone to populate the stronghold stage.";
      elements.strongholdStage.appendChild(emptyState);
      return;
    }

    state.survivors.forEach((survivor, index) => {
      const { card, canvas } = createStrongholdSurvivorCard(survivor, index, state.survivors.length);
      elements.strongholdStage.appendChild(card);

      const renderer = createCharacterPreviewRenderer({ canvas, statusLabel: null });
      const styleSeed = hashString(survivor.id);
      renderer.setCharacterProperties(getSurvivorPreviewColors(survivor));
      renderer.setHairStyle(previewHairStyles[styleSeed % previewHairStyles.length] || "classic");
      renderer.setEyeStyle(previewEyeStyles[styleSeed % previewEyeStyles.length] || "classic");
      renderer.setBodyType(previewBodyTypes[styleSeed % previewBodyTypes.length] || "classic");
      renderer.setPetType(previewPetTypes[styleSeed % previewPetTypes.length] || "cat");
      renderer.setPetVisibility(false);
      renderer.setPerspectiveTilt(0);
      renderer.setPrintEffectsEnabled(false);
      renderer.setShadowProperties({ fillColor: "rgba(0,0,0,0)", strokeColor: "rgba(0,0,0,0)" });
      renderer.playAnimation(chooseStrongholdAnimation(survivor, index), { loop: true });
      strongholdRenderers.push(renderer);
    });
  }

  function syncCharacterPreview(activeSurvivor) {
    if (previewAnimationOverride) {
      characterPreview.playAnimation(previewAnimationOverride, { loop: true });
      syncPropAnimationSelectionFromCurrentAnimation();
      return;
    }

    if (!activeSurvivor) {
      characterPreview.playAnimation("idle", { loop: true });
      syncPropAnimationSelectionFromCurrentAnimation();
      return;
    }

    characterPreview.setCharacterProperties(getSurvivorPreviewColors(activeSurvivor));

    if (state.running && state.running.survivorId === activeSurvivor.id) {
      characterPreview.playAnimation(getMissionAnimationName(state.running.key), { loop: true });
      syncPropAnimationSelectionFromCurrentAnimation();
      return;
    }

    characterPreview.playAnimation("idle", { loop: true });
    syncPropAnimationSelectionFromCurrentAnimation();
  }

  function syncMissionStatusLabel(activeSurvivor) {
    if (!elements.characterPreviewMissionStatus) {
      return;
    }

    if (!state.running) {
      elements.characterPreviewMissionStatus.textContent = "Idle";
      return;
    }

    const mission = getMission(state.running.categoryKey, state.running.key);
    const missionTitle = mission?.title || "Mission";
    const runningSurvivor = getSurvivorById(state, state.running.survivorId);

    if (activeSurvivor && activeSurvivor.id === state.running.survivorId) {
      elements.characterPreviewMissionStatus.textContent = `Doing: ${missionTitle}`;
      return;
    }

    if (runningSurvivor?.name) {
      elements.characterPreviewMissionStatus.textContent = `${runningSurvivor.name}: ${missionTitle}`;
      return;
    }

    elements.characterPreviewMissionStatus.textContent = `Doing: ${missionTitle}`;
  }

  // Expose a function-call API for animation triggers during development/testing.
  window.triggerCharacterPreviewAnimation = (animationName, durationMs = 0) => {
    characterPreview.playAnimation(String(animationName || "idle"), {
      durationMs: Number(durationMs) || 0,
      loop: !durationMs
    });
  };

  window.getCharacterPreviewPropSettings = (animationName = null) => {
    return characterPreview.exportPropTransforms(animationName ? String(animationName) : null);
  };

  window.applyCharacterPreviewPropSettings = (payload) => {
    const result = characterPreview.importPropTransforms(payload);
    if (result.ok) {
      syncPropControlsFromRenderer();
    }
    return result;
  };

  elements.characterPreviewStatus.addEventListener("click", () => {
    previewAnimationCycleIndex += 1;

    if (previewAnimationCycleIndex >= previewTestAnimations.length) {
      previewAnimationCycleIndex = -1;
      previewAnimationOverride = null;
      elements.characterPreviewStatus.textContent = "AUTO";
      syncCharacterPreview(getSurvivorById(state, state.activeId));
      return;
    }

    previewAnimationOverride = previewTestAnimations[previewAnimationCycleIndex];
    applyPreviewAnimationOverride();
  });

  characterPreview.setHairStyle(previewHairStyles[previewHairStyleCycleIndex]);
  syncHairStyleLabel();
  characterPreview.setEyeStyle(previewEyeStyles[previewEyeStyleCycleIndex]);
  syncEyeStyleLabel();
  characterPreview.setBodyType(previewBodyTypes[previewBodyTypeCycleIndex]);
  syncBodyTypeLabel();
  characterPreview.setPetType(previewPetTypes[previewPetTypeCycleIndex]);
  syncPetTypeLabel();
  syncHolderToggleLabel();
  characterPreview.setPerspectiveTilt(previewPerspectiveTilt);
  syncPerspectiveLabel();
  syncPreviewDevToolsVisibility();
  syncMobilePreviewPlacement();

  if (typeof mobilePreviewQuery.addEventListener === "function") {
    mobilePreviewQuery.addEventListener("change", syncMobilePreviewPlacement);
  } else if (typeof mobilePreviewQuery.addListener === "function") {
    mobilePreviewQuery.addListener(syncMobilePreviewPlacement);
  }

  if (typeof mobilePreviewQuery.addEventListener === "function") {
    mobilePreviewQuery.addEventListener("change", () => setMissionActionsOverlayOpen(false));
  } else if (typeof mobilePreviewQuery.addListener === "function") {
    mobilePreviewQuery.addListener(() => setMissionActionsOverlayOpen(false));
  }

  setMissionActionsOverlayOpen(false);

  previewPropAnimations.forEach((animationName) => {
    const option = document.createElement("option");
    option.value = animationName;
    option.textContent = animationName.toUpperCase();
    elements.characterPreviewPropAnimation.appendChild(option);
  });

  if (selectedPropAnimation) {
    elements.characterPreviewPropAnimation.value = selectedPropAnimation;
  }
  syncPropControlsFromRenderer();

  elements.characterPreviewHairStyle.addEventListener("click", () => {
    if (previewHairStyles.length === 0) {
      return;
    }

    previewHairStyleCycleIndex = (previewHairStyleCycleIndex + 1) % previewHairStyles.length;
    characterPreview.setHairStyle(previewHairStyles[previewHairStyleCycleIndex]);
    syncHairStyleLabel();
  });

  elements.characterPreviewBodyType.addEventListener("click", () => {
    if (previewBodyTypes.length === 0) {
      return;
    }

    previewBodyTypeCycleIndex = (previewBodyTypeCycleIndex + 1) % previewBodyTypes.length;
    characterPreview.setBodyType(previewBodyTypes[previewBodyTypeCycleIndex]);
    syncBodyTypeLabel();
  });

  elements.characterPreviewEyeStyle.addEventListener("click", () => {
    if (previewEyeStyles.length === 0) {
      return;
    }

    previewEyeStyleCycleIndex = (previewEyeStyleCycleIndex + 1) % previewEyeStyles.length;
    characterPreview.setEyeStyle(previewEyeStyles[previewEyeStyleCycleIndex]);
    syncEyeStyleLabel();
  });

  elements.characterPreviewPet.addEventListener("click", () => {
    if (previewPetTypes.length === 0) {
      return;
    }

    previewPetTypeCycleIndex = (previewPetTypeCycleIndex + 1) % previewPetTypes.length;
    characterPreview.setPetType(previewPetTypes[previewPetTypeCycleIndex]);
    syncPetTypeLabel();
  });

  if (elements.characterPreviewHolderToggle) {
    elements.characterPreviewHolderToggle.addEventListener("click", () => {
      const isVisible = characterPreview.toggleHolderVisibility();
      syncHolderToggleLabel();
      toast(isVisible ? "Holder shown." : "Holder hidden.");
    });
  }

  elements.characterPreviewPerspective.addEventListener("input", () => {
    const nextTilt = Number(elements.characterPreviewPerspective.value);
    previewPerspectiveTilt = Number.isFinite(nextTilt) ? Math.max(0, Math.min(360, nextTilt)) : 0;
    characterPreview.setPerspectiveTilt(previewPerspectiveTilt);
    syncPerspectiveLabel();
  });

  elements.characterPreviewPropAnimation.addEventListener("change", () => {
    const nextAnimation = String(elements.characterPreviewPropAnimation.value || "");
    if (!previewPropAnimations.includes(nextAnimation)) {
      return;
    }

    selectedPropAnimation = nextAnimation;
    characterPreview.playAnimation(selectedPropAnimation, { loop: true });
    syncPropControlsFromRenderer();
  });

  [
    elements.characterPreviewPropOffsetX,
    elements.characterPreviewPropOffsetY,
    elements.characterPreviewPropOffsetZ,
    elements.characterPreviewPropScale,
    elements.characterPreviewPropRotation
  ].forEach((input) => {
    input.addEventListener("input", applyPropControlInputs);
  });

  elements.characterPreviewCopyProp.addEventListener("click", () => {
    copySelectedPropSettings();
  });

  elements.characterPreviewPasteProp.addEventListener("click", () => {
    pastePropSettingsFromPayload();
  });

  function getFlagValue(flagName) {
    if (typeof flagName !== "string") {
      return undefined;
    }

    return state.flags?.[flagName];
  }

  function isFlagTruthy(flagName) {
    return Boolean(getFlagValue(flagName));
  }

  function hasRequiredFlags(requiredFlags) {
    if (!Array.isArray(requiredFlags) || requiredFlags.length === 0) {
      return true;
    }

    return requiredFlags.every((flagName) => {
      if (typeof flagName !== "string" || flagName.trim() === "") {
        return false;
      }

      return isFlagTruthy(flagName);
    });
  }

  function hasHideFlags(hideFlags) {
    if (!Array.isArray(hideFlags) || hideFlags.length === 0) {
      return false;
    }

    return hideFlags.some((flagName) => {
      if (typeof flagName !== "string" || flagName.trim() === "") {
        return false;
      }

      return isFlagTruthy(flagName);
    });
  }

  function isCategoryVisibleByTabFlag(categoryKey) {
    const categoryTab = document.querySelector(`.tab[data-mission-category="${categoryKey}"]`);
    if (!categoryTab) {
      return true;
    }

    const requiredFlag = categoryTab.dataset.requiredFlag;
    return !requiredFlag || isFlagTruthy(requiredFlag);
  }

  function canSetFlagValue(value) {
    const valueType = typeof value;
    return valueType === "boolean" || valueType === "string" || valueType === "number";
  }

  function applyMissionFlags(mission) {
    const missionFlags = Array.isArray(mission?.flags) ? mission.flags : [];
    if (missionFlags.length === 0) {
      return;
    }

    if (!state.flags || typeof state.flags !== "object" || Array.isArray(state.flags)) {
      state.flags = {};
    }

    missionFlags.forEach((flagChange) => {
      if (!flagChange || typeof flagChange !== "object") {
        return;
      }

      const flagName = typeof flagChange.flagName === "string" ? flagChange.flagName.trim() : "";
      if (!flagName || !canSetFlagValue(flagChange.newValue)) {
        return;
      }

      state.flags[flagName] = flagChange.newValue;
    });
  }

  function getMissionCategories() {
    const runningCategory = state.running?.categoryKey || null;
    return Object.keys(state.missions || {}).filter(
      (categoryKey) => categoryKey === runningCategory || isCategoryVisibleByTabFlag(categoryKey)
    );
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

  function getMissionCashCost(mission) {
    if (!mission || !Number.isFinite(mission.cashCost)) {
      return 0;
    }

    return Math.max(0, Math.floor(mission.cashCost));
  }

  function getMissionCashPayout(mission) {
    if (!mission || !Number.isFinite(mission.cashPayout)) {
      return 0;
    }

    return Math.max(0, Math.floor(mission.cashPayout));
  }

  function isOneTimeMission(mission) {
    return Boolean(mission?.oneTime);
  }

  function shouldShowMissionTimer(mission) {
    return Boolean(mission?.showTimer);
  }

  function getMissionTotalSeconds(mission) {
    const cycleSeconds = Math.max(1, Math.floor(mission?.seconds || 1));
    if (isOneTimeMission(mission) || shouldShowMissionTimer(mission)) {
      return cycleSeconds;
    }

    // Default missions run effectively forever until canceled.
    return Number.MAX_SAFE_INTEGER;
  }

  function getAvailableCash() {
    return Math.max(0, Math.floor(Number(state.resources.cash) || 0));
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
    const activeCategory = state.running?.categoryKey || state.selectedMissionCategory;
    document.querySelectorAll(".tab[data-mission-category]").forEach((tab) => {
      const requiredFlag = tab.dataset.requiredFlag;
      const isVisible =
        tab.dataset.missionCategory === activeCategory ||
        !requiredFlag ||
        isFlagTruthy(requiredFlag);
      tab.hidden = !isVisible;

      if (!isVisible) {
        tab.classList.remove("active");
        return;
      }

      const isActive = tab.dataset.missionCategory === activeCategory;
      tab.classList.toggle("active", isActive);
    });
  }

  function renderMissionsList() {
    ensureValidMissionCategory();

    const runningCategoryKey = state.running?.categoryKey || null;
    const runningMissionKey = state.running?.key || null;
    const categoryKey = runningCategoryKey || state.selectedMissionCategory;
    const missionCollection = getMissionCollection(categoryKey);
    const missionEntries = Object.entries(missionCollection).filter(([missionKey, mission]) => {
      if (!runningMissionKey) {
        return hasRequiredFlags(mission?.requiredFlags) && !hasHideFlags(mission?.hideFlags);
      }

      return missionKey === runningMissionKey;
    });
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
      const oneTimeMission = isOneTimeMission(mission);

      const timerSeconds =
        runningProgress && runningProgress.categoryKey === categoryKey && runningProgress.key === missionKey
          ? runningProgress.remainingSeconds
          : mission.seconds;

      const riskMarkup = mission.riskLabel ? `<div class="low">${mission.riskLabel}</div>` : "";
      const cashCost = getMissionCashCost(mission);
      const cashPayout = getMissionCashPayout(mission);
      const rewardMarkup = mission.rewardLabel
        ? `<div class="reward"><span class="sandwich">🥪</span>${mission.rewardLabel}</div>`
        : "";
      const xpMarkup = mission.xpLabel
        ? `<div class="reward xp-chip"><span class="xp-dot">XP</span>${mission.xpLabel}</div>`
        : "";
      const rewardRowMarkup =
        rewardMarkup || riskMarkup || xpMarkup
          ? `<div class="reward-row">
            <div>
              ${rewardMarkup}
              ${riskMarkup}
            </div>
            ${xpMarkup}
          </div>`
          : "";
      const missionEconomyMarkup =
        cashCost > 0 || cashPayout > 0
          ? `<div class="mission-economy-row">${
              cashCost > 0 ? `<span class="mission-cash-chip mission-cash-cost">COST $${cashCost}</span>` : ""
            }${cashPayout > 0 ? `<span class="mission-cash-chip mission-cash-payout">PAYOUT $${cashPayout}</span>` : ""}</div>`
          : "";
      const timerMarkup = shouldShowMissionTimer(mission)
        ? `<div class="timer">⏱ ${clock(timerSeconds)}</div>`
        : "";

      missionElement.innerHTML = `
        <div>
          <h2>${mission.title}</h2>
          ${rewardRowMarkup}
          ${missionEconomyMarkup}
        </div>
        <div class="start-block"><button class="start-btn">START</button>${timerMarkup}</div>`;

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
    const availableCash = getAvailableCash();

    elements.missionsList.querySelectorAll(".mission").forEach((missionElement) => {
      const missionCategory = missionElement.dataset.missionCategory;
      const missionKey = missionElement.dataset.mission;
      const button = missionElement.querySelector(".start-btn");
      const mission = getMission(missionCategory, missionKey);
      const cashCost = getMissionCashCost(mission);

      if (!hasSurvivor) {
        button.disabled = true;
        button.textContent = "START";
        return;
      }

      if (!runningMissionKey) {
        button.disabled = cashCost > availableCash;
        button.textContent = cashCost > availableCash ? "NO CASH" : "START";
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
    renderMissionsCash(state, elements);
    renderActive(state, elements, activeSurvivor);
    renderMissionTabs();
    renderMissionsList();
    renderRoster(state, elements, onSelectSurvivor);
    updateSurvivorSummary();
    syncActionButtons();
    syncCharacterPreview(activeSurvivor);
    syncMissionStatusLabel(activeSurvivor);
    renderStrongholdScene();
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

    if (screenId !== "missionsScreen") {
      setMissionActionsOverlayOpen(false);
    }

    if (elements.openStrongholdBtn && elements.openSurvivorsBtn) {
      elements.openStrongholdBtn.classList.toggle("active", screenId === "strongholdScreen");
      elements.openSurvivorsBtn.classList.toggle("active", screenId === "baseScreen");
    }
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

    if (!hasRequiredFlags(mission.requiredFlags)) {
      toast(`${mission.title} is locked.`);
      renderAll();
      return;
    }

    if (hasHideFlags(mission.hideFlags)) {
      toast(`${mission.title} is unavailable.`);
      renderAll();
      return;
    }

    const cashCost = getMissionCashCost(mission);
    if (cashCost > getAvailableCash()) {
      toast(`Need $${cashCost} cash to start ${mission.title}.`);
      renderAll();
      return;
    }

    if (cashCost > 0) {
      state.resources.cash = Math.max(0, getAvailableCash() - cashCost);
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
        statChange: mission.statChange || mission.statChanges || null,
        reward: mission.reward,
        rewardLabel: mission.rewardLabel,
        cashCost,
        cashPayout: getMissionCashPayout(mission),
        cycleSeconds,
        cycleRemainingSeconds: cycleSeconds,
        cyclesCompleted: 0,
        totalSeconds: selectedSeconds,
        remainingSeconds: selectedSeconds,
        elapsedSeconds: 0,
        statChangeElapsedSeconds: 0
      }
    });

    state.running.entityId = missionEntityId;
    characterPreview.playAnimation(getMissionAnimationName(missionKey), { loop: true });
    setMissionActionsOverlayOpen(false);

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

    if (!hasRequiredFlags(mission.requiredFlags)) {
      toast(`${mission.title} is locked.`);
      renderAll();
      return;
    }

    if (hasHideFlags(mission.hideFlags)) {
      toast(`${mission.title} is unavailable.`);
      renderAll();
      return;
    }

    const totalSeconds = getMissionTotalSeconds(mission);
    beginMission(categoryKey, missionKey, totalSeconds);
  }

  function renderMissionTimer(categoryKey, missionKey, remainingSeconds) {
    const missionRoot = findMissionRoot(categoryKey, missionKey);
    if (!missionRoot) {
      return;
    }

    const timer = missionRoot.querySelector(".timer");
    if (!timer) {
      return;
    }

    timer.textContent = `⏱ ${clock(remainingSeconds)}`;
  }

  function completeMission(missionProgress) {
    state.running = null;
    characterPreview.playAnimation("celebrate", { durationMs: 900 });
    const mission = getMission(missionProgress.categoryKey, missionProgress.key);
    applyMissionFlags(mission);

    renderAll();

    const cycles = missionProgress.cyclesCompleted || 0;
    const missionTitle = mission?.title || "Mission";
    const fallbackText =
      cycles > 0
        ? `Completed ${missionTitle}: ${cycles} cycle${cycles === 1 ? "" : "s"}.`
        : `${missionTitle} finished with no full cycle completed.`;

    missionCompletionPopup.showCompletionInfo({
      missionTitle,
      popupTitle: mission?.popupTitle,
      popupText: mission?.popupText || fallbackText,
      popupIcon: mission?.popupIcon
    });
  }

  function applyMissionStatChangesForDuration(activeSurvivor, missionProgress, mission, durationSeconds) {
    const statChanges =
      missionProgress.statChange && typeof missionProgress.statChange === "object"
        ? missionProgress.statChange
        : missionProgress.statChanges && typeof missionProgress.statChanges === "object"
          ? missionProgress.statChanges
          : mission?.statChange || mission?.statChanges;

    if (durationSeconds <= 0) {
      return;
    }

    const tickCount = Math.max(0, Math.floor(durationSeconds / STAT_CHANGE_TICK_SECONDS));
    if (tickCount <= 0) {
      return;
    }

    const statEntries =
      statChanges && typeof statChanges === "object"
        ? Object.entries(statChanges)
        : [];
    const strainFromStatChangesPerTick = statEntries.reduce((sum, [, delta]) => {
      const amount = Number.isFinite(delta) ? Math.abs(delta) : 0;
      return sum + amount;
    }, 0);
    const strainNeeds = ["food", "sleep", "hygiene", "social", "bladder"];

    for (let tickIndex = 0; tickIndex < tickCount; tickIndex += 1) {
      statEntries.forEach(([statKey, delta]) => {
        applyStatDelta(activeSurvivor, statKey, delta);
      });

      const hasCriticalNeed = strainNeeds.some((statKey) => {
        const current = Number.isFinite(activeSurvivor[statKey]) ? activeSurvivor[statKey] : 0;
        const maxKey = `${statKey}Max`;
        const maxValue = Number.isFinite(activeSurvivor[maxKey]) ? activeSurvivor[maxKey] : 0;
        if (maxValue <= 0) {
          return false;
        }

        return current / maxValue < 0.1;
      });

      if (hasCriticalNeed) {
        const strainIncrease = strainFromStatChangesPerTick + 0.5;
        if (strainIncrease > 0) {
          applyStatDelta(activeSurvivor, "strain", strainIncrease);
        }
      } else {
        applyStatDelta(activeSurvivor, "strain", -0.5);
      }
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
    const rewardResource = missionProgress.reward;
    if (typeof rewardResource === "string" && Number.isFinite(state.resources[rewardResource])) {
      state.resources[rewardResource] += 1;
    }

    const missionCashPayout = Math.max(0, Math.floor(Number(missionProgress.cashPayout) || 0));
    if (missionCashPayout > 0) {
      state.resources.cash = getAvailableCash() + missionCashPayout;
    }

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
    onMissionTick: (missionProgress, activeDeltaSeconds) => {
      let appliedStatChange = false;
      const activeSurvivor = getSurvivorById(state, missionProgress.survivorId);
      if (activeSurvivor) {
        const mission = getMission(missionProgress.categoryKey, missionProgress.key);
        const elapsedForStatChange =
          (Number.isFinite(missionProgress.statChangeElapsedSeconds)
            ? missionProgress.statChangeElapsedSeconds
            : 0) + Math.max(0, activeDeltaSeconds || 0);
        const statChangeTicks = Math.floor(elapsedForStatChange / STAT_CHANGE_TICK_SECONDS);

        missionProgress.statChangeElapsedSeconds = elapsedForStatChange;

        if (statChangeTicks > 0) {
          const appliedDurationSeconds = statChangeTicks * STAT_CHANGE_TICK_SECONDS;
          missionProgress.statChangeElapsedSeconds =
            elapsedForStatChange - appliedDurationSeconds;

          applyMissionStatChangesForDuration(
            activeSurvivor,
            missionProgress,
            mission,
            appliedDurationSeconds,
          );
          appliedStatChange = true;
        }

        if (state.activeId === activeSurvivor.id && appliedStatChange) {
          renderActive(state, elements, activeSurvivor);
        }
      }

      renderMissionTimer(missionProgress.categoryKey, missionProgress.key, missionProgress.remainingSeconds);
      if (appliedStatChange) {
        renderRoster(state, elements, onSelectSurvivor);
      }
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
    clearStrongholdRenderers();
    characterPreview.destroy();
    gameLoop.stop();
    flushPersist();
  });

  elements.goBase.addEventListener("click", () => showScreen("baseScreen"));
  elements.goBaseFromStronghold?.addEventListener("click", () => showScreen("baseScreen"));

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

  elements.actionsMenuBtn?.addEventListener("click", () => {
    toggleMissionActionsOverlay();
  });

  elements.missionActionsCloseBtn?.addEventListener("click", () => {
    if (!isMobileActionsPopupMode()) {
      return;
    }

    setMissionActionsOverlayOpen(false);
  });

  elements.missionActionsOverlay?.addEventListener("click", (event) => {
    if (!isMobileActionsPopupMode()) {
      return;
    }

    if (event.target === elements.missionActionsOverlay || event.target?.dataset.overlayClose === "true") {
      setMissionActionsOverlayOpen(false);
    }
  });

  elements.openStrongholdBtn?.addEventListener("click", () => {
    showScreen("strongholdScreen");
    renderStrongholdScene(true);
  });

  elements.openSurvivorsBtn?.addEventListener("click", () => {
    showScreen("baseScreen");
  });

  document.querySelectorAll(".tab[data-mission-category]").forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.hidden) {
        return;
      }

      const nextCategory = tab.dataset.missionCategory;
      if (!getMissionCategories().includes(nextCategory)) {
        return;
      }

      state.selectedMissionCategory = nextCategory;
      renderAll();
    });
  });

  document.querySelectorAll(".base-tab[data-base-action='todo']").forEach((tab) => {
    tab.addEventListener("click", () => toast("Only the shown screens are implemented."));
  });

  window.addEventListener("keydown", (event) => {
    if (isMobileActionsPopupMode() && event.key === "Escape" && isMissionActionsOverlayOpen) {
      setMissionActionsOverlayOpen(false);
      return;
    }

    if (event.code === "Numpad9") {
      previewDevToolsVisible = !previewDevToolsVisible;
      syncPreviewDevToolsVisibility();
      toast(previewDevToolsVisible ? "Preview dev tools shown." : "Preview dev tools hidden.");
      return;
    }

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
