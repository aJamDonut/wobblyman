import { createDefaultStatValues, normalizeSurvivorStats } from "./stats.js";

function createSurvivor(base, statOverrides) {
  return {
    ...base,
    ...createDefaultStatValues(statOverrides),
  };
}

function withMissionStatChanges(missionCategories) {
  return Object.fromEntries(
    Object.entries(missionCategories).map(
      ([categoryKey, missionCollection]) => {
        const mappedMissions = Object.fromEntries(
          Object.entries(missionCollection).map(([missionKey, mission]) => {
            const hasStatChange =
              mission?.statChange && typeof mission.statChange === "object";
            const hasLegacyStatChanges =
              mission?.statChanges && typeof mission.statChanges === "object";
            return [
              missionKey,
              {
                ...mission,
                statChange: hasStatChange
                  ? mission.statChange
                  : hasLegacyStatChanges
                    ? mission.statChanges
                    : null,
              },
            ];
          }),
        );

        return [categoryKey, mappedMissions];
      },
    ),
  );
}

export function createInitialState() {
  return {
    resources: { sandwich: 0, platter: 0 },
    survivorCapacity: 4,
    activeId: "ritu",
    survivors: [
      createSurvivor(
        {
          id: "ritu",
          name: "Ritu Shadowaxe",
          level: 5,
          gender: "female",
          shirtColor: "#d94a35",
        },
        {
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
          cooking: 1,
        },
      ),
    ],
    missions: withMissionStatChanges({
      missions: {
        workout: {
          title: "WORKOUT",
          rewardLabel: "Workout",
          xpLabel: "+1 Physical XP",
          seconds: 1,
          xp: 0.35,
          statXp: { physical: 2 },
          statChange: {
            sleep: -0.1,
            food: -0.1,
          },
        },
        pushups: {
          title: "PUSHUPS",
          rewardLabel: "Training",
          xpLabel: "+3 Physical XP",
          seconds: 14,
          xp: 0.6,
          statXp: { physical: 3 },
          statChange: {
            sleep: -0.2,
            food: -0.1,
          },
        },
        shower: {
          title: "SHOWER",
          rewardLabel: "Refresh",
          xpLabel: "+3 Hygiene XP",
          seconds: 16,
          xp: 0.55,
          statXp: { hygiene: 3 },
          statChange: {
            hygiene: 0.5,
            social: 0.1,
          },
        },
        wash: {
          title: "WASH UP",
          rewardLabel: "Clean Gear",
          xpLabel: "+2 Hygiene XP, +1 Knowledge XP",
          seconds: 18,
          xp: 0.6,
          statXp: { hygiene: 2, knowledge: 1 },
          reward: "sandwich",
        },
        dig: {
          title: "DIG TRENCH",
          rewardLabel: "Supplies",
          xpLabel: "+2 Physical XP, +1 Business XP",
          seconds: 22,
          xp: 0.75,
          statXp: { physical: 2, business: 1 },
          reward: "sandwich",
        },
        search: {
          title: "SEARCH AREA",
          rewardLabel: "Findings",
          xpLabel: "+3 Knowledge XP, +1 Speech XP",
          seconds: 24,
          xp: 0.8,
          statXp: { knowledge: 3, speech: 1 },
          reward: "sandwich",
        },
        hunt: {
          title: "HUNT TRAIL",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+2 Physical XP, +2 Knowledge XP",
          seconds: 40,
          xp: 1.3,
          statXp: { physical: 2, knowledge: 2 },
          reward: "platter",
        },
        cook: {
          title: "COOK MEAL",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Cooking XP, +1 Social XP",
          seconds: 20,
          xp: 0.75,
          statXp: { cooking: 3, social: 1 },
          reward: "sandwich",
        },
        sandwich: {
          title: "MAKE SANDWICH",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Cooking XP",
          seconds: 1,
          xp: 0.35,
          statXp: { cooking: 2 },
          reward: "sandwich",
        },
        sleep: {
          title: "SLEEP",
          rewardLabel: "Snacks",
          xpLabel: "+3 Sleep XP, +1 Knowledge XP",
          seconds: 10,
          xp: 0.5,
          statXp: { sleep: 3, knowledge: 1 },
          reward: "sandwich",
        },
        platter: {
          title: "MAKE SANDWICH PLATTER",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+4 Cooking XP, +2 Business XP",
          riskLabel: "LOW %",
          seconds: 45,
          xp: 4,
          statXp: { cooking: 4, business: 2 },
          reward: "platter",
        },
        brewCoffee: {
          title: "BREW BASE COFFEE",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Cooking XP, +1 Food XP",
          seconds: 18,
          xp: 0.7,
          statXp: { cooking: 2, food: 1 },
          reward: "sandwich",
        },
        rationPrep: {
          title: "RATION PREP",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Cooking XP, +1 Business XP",
          seconds: 28,
          xp: 1,
          statXp: { cooking: 3, business: 1 },
          reward: "sandwich",
        },
        campfireSongs: {
          title: "CAMPFIRE SONGS",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Music XP, +2 Social XP",
          seconds: 36,
          xp: 1.1,
          statXp: { music: 3, social: 2 },
          reward: "sandwich",
        },
        pepTalk: {
          title: "PEP TALK CIRCLE",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Speech XP, +2 Social XP",
          seconds: 34,
          xp: 1.1,
          statXp: { speech: 3, social: 2 },
          reward: "sandwich",
        },
        fieldSketch: {
          title: "FIELD SKETCH NOTES",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Art XP, +1 Knowledge XP",
          seconds: 38,
          xp: 1.15,
          statXp: { art: 3, knowledge: 1 },
          reward: "sandwich",
        },
        hygieneDrill: {
          title: "HYGIENE DRILL",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Hygiene XP, +1 Speech XP",
          seconds: 26,
          xp: 0.95,
          statXp: { hygiene: 3, speech: 1 },
          reward: "sandwich",
        },
        restRotation: {
          title: "REST ROTATION",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Sleep XP, +1 Social XP",
          seconds: 32,
          xp: 1,
          statXp: { sleep: 3, social: 1 },
          reward: "sandwich",
        },
      },
      camp: {
        foraging: {
          title: "FORAGE SUPPLIES",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Knowledge XP, +1 Food XP",
          seconds: 30,
          xp: 0.5,
          statXp: { knowledge: 2, food: 1 },
          reward: "sandwich",
        },
        waterRun: {
          title: "WATER RUN",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Food XP, +1 Bladder XP",
          seconds: 22,
          xp: 0.75,
          statXp: { food: 2, bladder: 1 },
          reward: "sandwich",
        },
        woodChop: {
          title: "CHOP FIREWOOD",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Business XP, +1 Food XP",
          seconds: 40,
          xp: 1.25,
          statXp: { business: 2, food: 1 },
          reward: "sandwich",
        },
        tentRepair: {
          title: "PATCH TENTS",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Art XP, +2 Knowledge XP",
          seconds: 44,
          xp: 1.3,
          statXp: { art: 2, knowledge: 2 },
          reward: "sandwich",
        },
        compostShift: {
          title: "COMPOST SHIFT",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Hygiene XP, +1 Knowledge XP",
          seconds: 33,
          xp: 1.05,
          statXp: { hygiene: 3, knowledge: 1 },
          reward: "sandwich",
        },
        watchtowerDuty: {
          title: "WATCHTOWER DUTY",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Speech XP, +2 Social XP",
          seconds: 48,
          xp: 1.45,
          statXp: { speech: 3, social: 2 },
          reward: "sandwich",
        },
        campConcert: {
          title: "CAMP CONCERT",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+4 Music XP, +2 Social XP",
          seconds: 65,
          xp: 2.1,
          statXp: { music: 4, social: 2 },
          reward: "platter",
        },
        kitchenLine: {
          title: "KITCHEN LINE",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Cooking XP, +1 Business XP",
          seconds: 46,
          xp: 1.4,
          statXp: { cooking: 3, business: 1 },
          reward: "sandwich",
        },
        salvageSort: {
          title: "SALVAGE SORT",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Business XP, +2 Knowledge XP",
          seconds: 44,
          xp: 1.35,
          statXp: { business: 2, knowledge: 2 },
          reward: "sandwich",
        },
      },
      "med bay": {
        triage: {
          title: "TRIAGE DUTY",
          rewardLabel: "Sandwich",
          xpLabel: "+2 Knowledge XP, +2 Speech XP",
          seconds: 60,
          xp: 0.7,
          statXp: { knowledge: 2, speech: 2 },
          reward: "sandwich",
        },
        sanitizeGear: {
          title: "SANITIZE GEAR",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Hygiene XP",
          seconds: 38,
          xp: 1.2,
          statXp: { hygiene: 4 },
          reward: "sandwich",
        },
        restWatch: {
          title: "REST WATCH",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Sleep XP, +2 Social XP",
          seconds: 52,
          xp: 1.55,
          statXp: { sleep: 3, social: 2 },
          reward: "sandwich",
        },
        moraleCare: {
          title: "MORALE COUNSELING",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Speech XP, +1 Social XP",
          seconds: 58,
          xp: 1.7,
          statXp: { speech: 4, social: 1 },
          reward: "sandwich",
        },
        recordVitals: {
          title: "RECORD VITALS",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Knowledge XP, +1 Business XP",
          seconds: 41,
          xp: 1.3,
          statXp: { knowledge: 3, business: 1 },
          reward: "sandwich",
        },
        cleanWard: {
          title: "CLEAN RECOVERY WARD",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Hygiene XP, +1 Sleep XP",
          seconds: 47,
          xp: 1.45,
          statXp: { hygiene: 4, sleep: 1 },
          reward: "sandwich",
        },
        medWorkshop: {
          title: "MEDICINE WORKSHOP",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+5 Knowledge XP, +2 Speech XP",
          riskLabel: "MID %",
          seconds: 85,
          xp: 3,
          statXp: { knowledge: 5, speech: 2 },
          reward: "platter",
        },
        patientRounds: {
          title: "PATIENT ROUNDS",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Speech XP, +2 Knowledge XP",
          seconds: 57,
          xp: 1.75,
          statXp: { speech: 3, knowledge: 2 },
          reward: "sandwich",
        },
      },
      library: {
        archives: {
          title: "CATALOG ARCHIVES",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+3 Knowledge XP, +1 Business XP",
          seconds: 90,
          xp: 1.2,
          statXp: { knowledge: 3, business: 1 },
          reward: "platter",
        },
        mapStudy: {
          title: "MAP STUDY",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Knowledge XP, +1 Speech XP",
          seconds: 37,
          xp: 1.1,
          statXp: { knowledge: 3, speech: 1 },
          reward: "sandwich",
        },
        oralHistory: {
          title: "ORAL HISTORY CIRCLE",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Speech XP, +2 Social XP",
          seconds: 49,
          xp: 1.5,
          statXp: { speech: 3, social: 2 },
          reward: "sandwich",
        },
        posterDesign: {
          title: "POSTER DESIGN",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Art XP, +1 Business XP",
          seconds: 56,
          xp: 1.75,
          statXp: { art: 4, business: 1 },
          reward: "sandwich",
        },
        musicTheory: {
          title: "MUSIC THEORY STUDY",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Music XP, +1 Knowledge XP",
          seconds: 54,
          xp: 1.7,
          statXp: { music: 4, knowledge: 1 },
          reward: "sandwich",
        },
        speechPractice: {
          title: "SPEECH PRACTICE",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Speech XP, +1 Social XP",
          seconds: 45,
          xp: 1.35,
          statXp: { speech: 4, social: 1 },
          reward: "sandwich",
        },
        codeLedger: {
          title: "LEDGER DECODING",
          rewardLabel: "Sandwich",
          xpLabel: "+3 Knowledge XP, +2 Business XP",
          seconds: 62,
          xp: 2,
          statXp: { knowledge: 3, business: 2 },
          reward: "sandwich",
        },
        archiveRestoration: {
          title: "ARCHIVE RESTORATION",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+5 Art XP, +2 Knowledge XP",
          riskLabel: "MID %",
          seconds: 96,
          xp: 3.4,
          statXp: { art: 5, knowledge: 2 },
          reward: "platter",
        },
        debateClub: {
          title: "DEBATE CLUB",
          rewardLabel: "Sandwich",
          xpLabel: "+4 Speech XP, +1 Knowledge XP",
          seconds: 53,
          xp: 1.65,
          statXp: { speech: 4, knowledge: 1 },
          reward: "sandwich",
        },
      },
    }),
    selectedMissionCategory: "missions",
    running: null,
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
  const previousIndex =
    (activeIndex - 1 + state.survivors.length) % state.survivors.length;
  state.activeId = state.survivors[previousIndex].id;
}

function makeSurvivorId(name, survivors) {
  const base =
    String(name || "survivor")
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
  return createSurvivor(
    {
      name: isMale ? "Mason Drift" : "Nyra Vale",
      level: 1,
      gender: isMale ? "male" : "female",
      shirtColor: isMale ? "#5f9ecf" : "#c45f86",
    },
    {
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
      search: 6,
    },
  );
}

export function normalizeStateSurvivors(state) {
  state.survivors = state.survivors.map((survivor) =>
    normalizeSurvivorStats(survivor),
  );
}

export function addSurvivor(state, survivorInput) {
  if (state.survivors.length >= state.survivorCapacity) {
    return { ok: false, reason: "capacity" };
  }

  const recruit = {
    ...normalizeSurvivorStats(survivorInput),
    id: makeSurvivorId(survivorInput.name, state.survivors),
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
