import { createDefaultStatValues, normalizeSurvivorStats } from "./stats.js";

function createSurvivor(base, statOverrides) {
  return {
    ...base,
    ...createDefaultStatValues(statOverrides),
  };
}

const SHIRT_COLORS = [
  "#d94a35",
  "#5f9ecf",
  "#c45f86",
  "#4f8754",
  "#b86f2f",
  "#6e63b7",
  "#2d9a8b",
  "#a54d63",
  "#8f6a46",
  "#3b6ea6",
];

const HAIR_COLORS = [
  "#1a1412",
  "#2a2523",
  "#3f2a1e",
  "#5c3d2b",
  "#6f2d28",
  "#7a4f2a",
  "#8b5e3c",
  "#a67c52",
  "#bfa079",
  "#c57b62",
  "#7f3f63",
  "#4a3f7a",
  "#355a7c",
  "#4d4d4d",
];

const SKIN_COLORS = [
  "#e2b48d",
  "#d8a47e",
  "#cf8b58",
  "#b17a52",
  "#9f6b45",
  "#8a5a39",
  "#6f472f",
  "#5a3a27",
];

const LEGACY_LIGHT_SKIN_REMAP = {
  "#f5d6b8": "#d8a47e",
  "#efc7a5": "#cf8b58",
};

function sanitizeSkinColor(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  return LEGACY_LIGHT_SKIN_REMAP[normalized] || value;
}

const PANTS_COLORS = [
  "#303946",
  "#4a3f5b",
  "#3e4a34",
  "#5a4637",
  "#364f5c",
  "#4a4a4a",
  "#3f3560",
  "#42553a",
  "#2f4651",
  "#5a3d4a",
];

const SHOE_COLORS = [
  "#1f2328",
  "#2b2b2b",
  "#352d27",
  "#2c2430",
  "#2a2f36",
  "#3a3128",
  "#343434",
  "#2d2a25",
];

function pickPaletteColor(palette, seed) {
  const safeSeed = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0;
  return palette[safeSeed % palette.length];
}

function createPaletteForIndex(index) {
  const baseSeed = Number.isFinite(index) ? Math.abs(Math.floor(index)) : 0;
  return {
    shirtColor: pickPaletteColor(SHIRT_COLORS, baseSeed * 7 + 1),
    hairColor: pickPaletteColor(HAIR_COLORS, baseSeed * 11 + 3),
    skinColor: pickPaletteColor(SKIN_COLORS, baseSeed * 5 + 2),
    pantsColor: pickPaletteColor(PANTS_COLORS, baseSeed * 13 + 4),
    shoeColor: pickPaletteColor(SHOE_COLORS, baseSeed * 17 + 6),
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

function withMissionEconomy(missionCategories) {
  return Object.fromEntries(
    Object.entries(missionCategories).map(([categoryKey, missionCollection]) => {
      const mappedMissions = Object.fromEntries(
        Object.entries(missionCollection).map(([missionKey, mission]) => {
          const cashCost = Number.isFinite(mission.cashCost)
            ? Math.max(0, mission.cashCost)
            : 0;
          const cashPayout = Number.isFinite(mission.cashPayout)
            ? Math.max(0, mission.cashPayout)
            : 0;

          return [
            missionKey,
            {
              ...mission,
              cashCost,
              cashPayout,
            },
          ];
        }),
      );

      return [categoryKey, mappedMissions];
    }),
  );
}

export function createInitialState() {
  return {
    resources: { sandwich: 0, platter: 0, cash: 25 },
    survivorCapacity: 100,
    activeId: "ritu",
    survivors: [
      createSurvivor(
        {
          id: "ritu",
          name: "Ritu Shadowaxe",
          level: 5,
          gender: "female",
          ...createPaletteForIndex(0),
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
    missions: withMissionEconomy(withMissionStatChanges({
      home: {
        buyCatalog: {
          title: "BUY CATALOG",
          seconds: 0.1,
          xp: 0.35,
          cashCost: 10,
          oneTime: true,
          popupTitle: "Catalog Purchased",
          popupText: "You bought the catalog. New options are now available.",
          popupIcon: "📚",
          flags: [{ flagName: "hasCatalog", newValue: true }],
          hideFlags: ["hasCatalog"]
        },
        workout: {
          title: "WORKOUT",
          seconds: 1,
          xp: 0.35,
          statXp: { physical: 2 },
          statChange: {
            sleep: -0.1,
            food: -0.1,
            hygiene: -0.5,
          },
        },
        read: {
          title: "READ",
          seconds: 10,
          xp: 0.5,
          statXp: { sleep: 3, knowledge: 1 },
        },
        shower: {
          title: "SHOWER",
          seconds: 16,
          xp: 0.55,
          statChange: {
            hygiene: 0.5,
            social: 0.1,
          },
        },
        eat: {
          title: "EAT",
          seconds: 16,
          xp: 0.55,
          animation: "sandwich",
          statChange: {
            food: 0.5,
          },
        },
        sleep: {
          title: "SLEEP",
          seconds: 10,
          xp: 0.5,
          statXp: { sleep: 3, knowledge: 1 },
        }
      },
      catalog: {
        phone: {
          title: "BUY PHONE",
          seconds: 10,
          xp: 0.35,
          oneTime: true,
          cashCost: 10,
          popupTitle: "Phone Purchased",
          popupText: "You bought a phone and unlocked new contacts.",
          popupIcon: "📱",
          flags: [{ flagName: "hasPhone", newValue: true }],
          hideFlags: ["hasPhone"]
        }
      },
      phone: {
        job: {
          title: "FIND JOB",
          seconds: 10,
          xp: 0.35,
          oneTime: true,
          popupTitle: "Job Locked In",
          popupText: "You found steady work and unlocked the Work tab.",
          popupIcon: "💼",
          flags: [{ flagName: "hasJob", newValue: true }],
          hideFlags: ["hasJob"]
        }
      },
      work: {
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
          cashPayout: 2,
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
          cashCost: 10,
          cashPayout: 16,
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
          cashPayout: 5,
          reward: "sandwich",
        },
      },
      mall: {
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
          cashPayout: 3,
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
          cashCost: 14,
          cashPayout: 24,
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
      business: {
        archives: {
          title: "CATALOG ARCHIVES",
          rewardLabel: "Sandwich Platter",
          xpLabel: "+3 Knowledge XP, +1 Business XP",
          seconds: 90,
          xp: 1.2,
          statXp: { knowledge: 3, business: 1 },
          cashPayout: 6,
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
          cashPayout: 8,
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
          cashCost: 18,
          cashPayout: 30,
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
    })),
    flags: {},
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
  const palette = createPaletteForIndex(index + 1);
  return createSurvivor(
    {
      name: isMale ? "Mason Drift" : "Nyra Vale",
      level: 1,
      gender: isMale ? "male" : "female",
      ...palette,
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
    normalizeSurvivorStats({
      ...survivor,
      skinColor: sanitizeSkinColor(survivor.skinColor),
    }),
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
