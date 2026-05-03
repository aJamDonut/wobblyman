import { createDefaultStatValues, normalizeSurvivorStats } from "./stats.js";

function createSurvivor(base, statOverrides) {
  return {
    ...base,
    ...createDefaultStatValues(statOverrides)
  };
}

export function createInitialState() {
  return {
    resources: { sandwich: 0, platter: 0 },
    survivorCapacity: 4,
    activeId: "ritu",
    survivors: [
      createSurvivor({
        id: "ritu",
        name: "Ritu Shadowaxe",
        level: 5,
        gender: "female",
        shirtColor: "#d94a35"
      }, {
        health: 99,
        healthMax: 100,
        healthXp: 250.7,
        morale: 49,
        moraleMax: 50,
        insanity: 0,
        insanityMax: 100,
        tools: 1,
        speech: 1,
        search: 1,
        cooking: 1
      })
    ],
    missions: {
      missions: {
        sandwich: {
          title: "MAKE SANDWICH",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Cooking XP",
          seconds: 1,
          xp: 0.35,
          statXp: { cooking: 2 },
          reward: "sandwich"
        },
        sleep: {
          title: "SLEEP",
          rewardLabel: "Sleep",
          xpLabel: "+2 Cooking XP",
          seconds: 1,
          xp: 0.35,
          statXp: { cooking: 2 },
          reward: "sleep"
        },
        platter: {
          title: "MAKE SANDWICH PLATTER",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+4.0",
          riskLabel: "LOW %",
          seconds: 45,
          xp: 4,
          reward: "platter"
        }
      },
      camp: {
        foraging: {
          title: "FORAGE SUPPLIES",
          rewardLabel: "Sandwich",
          xpLabel: "+0.5",
          seconds: 30,
          xp: 0.5,
          reward: "sandwich"
        }
      },
      "med bay": {
        triage: {
          title: "TRIAGE DUTY",
          rewardLabel: "Sandwich",
          xpLabel: "+0.7",
          seconds: 60,
          xp: 0.7,
          reward: "sandwich"
        }
      },
      library: {
        archives: {
          title: "CATALOG ARCHIVES",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+1.2",
          seconds: 90,
          xp: 1.2,
          reward: "platter"
        }
      }
    },
    selectedMissionCategory: "missions",
    running: null
  };
}

export function getSurvivorById(state, id) {
  return state.survivors.find((survivor) => survivor.id === id);
}

export function getSurvivorIndexById(state, id) {
  return state.survivors.findIndex((survivor) => survivor.id === id);
}

export function ensureValidActiveSurvivor(state) {
  if (state.survivors.length === 0) {
    state.activeId = null;
    return;
  }

  if (getSurvivorIndexById(state, state.activeId) === -1) {
    state.activeId = state.survivors[0].id;
  }
}

export function selectSurvivor(state, survivorId) {
  if (getSurvivorIndexById(state, survivorId) !== -1) {
    state.activeId = survivorId;
  }
}

export function selectNextSurvivor(state) {
  if (state.survivors.length === 0) {
    state.activeId = null;
    return;
  }

  ensureValidActiveSurvivor(state);
  const activeIndex = getSurvivorIndexById(state, state.activeId);
  const nextIndex = (activeIndex + 1) % state.survivors.length;
  state.activeId = state.survivors[nextIndex].id;
}

export function selectPreviousSurvivor(state) {
  if (state.survivors.length === 0) {
    state.activeId = null;
    return;
  }

  ensureValidActiveSurvivor(state);
  const activeIndex = getSurvivorIndexById(state, state.activeId);
  const previousIndex = (activeIndex - 1 + state.survivors.length) % state.survivors.length;
  state.activeId = state.survivors[previousIndex].id;
}

function makeSurvivorId(name, survivors) {
  const base = String(name || "survivor")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "survivor";

  let candidate = base;
  let count = 2;
  const ids = new Set(survivors.map((survivor) => survivor.id));

  while (ids.has(candidate)) {
    candidate = `${base}-${count}`;
    count += 1;
  }

  return candidate;
}

export function createRecruitTemplate(index) {
  const isMale = index % 2 === 0;
  return createSurvivor({
    name: isMale ? "Mason Drift" : "Nyra Vale",
    level: 1,
    gender: isMale ? "male" : "female",
    shirtColor: isMale ? "#5f9ecf" : "#c45f86"
  }, {
    health: 95,
    healthMax: 95,
    morale: 40,
    moraleMax: 50,
    insanity: 0,
    insanityMax: 100,
    cooking: 98,
    attack: 8,
    defense: 2,
    tools: 4,
    speech: 6,
    search: 6
  });
}

export function normalizeStateSurvivors(state) {
  state.survivors = state.survivors.map((survivor) => normalizeSurvivorStats(survivor));
}

export function addSurvivor(state, survivorInput) {
  if (state.survivors.length >= state.survivorCapacity) {
    return { ok: false, reason: "capacity" };
  }

  const recruit = {
    ...normalizeSurvivorStats(survivorInput),
    id: makeSurvivorId(survivorInput.name, state.survivors)
  };

  state.survivors.push(recruit);
  state.activeId = recruit.id;
  return { ok: true, survivor: recruit };
}

export function removeSurvivor(state, survivorId) {
  const index = getSurvivorIndexById(state, survivorId);
  if (index === -1) {
    return { ok: false, reason: "not-found" };
  }

  const removed = state.survivors.splice(index, 1)[0];
  ensureValidActiveSurvivor(state);
  return { ok: true, survivor: removed };
}
