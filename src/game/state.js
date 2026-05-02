export function createInitialState() {
  return {
    resources: { sandwich: 0, platter: 0 },
    survivorCapacity: 4,
    activeId: "ritu",
    survivors: [
      {
        id: "ritu",
        name: "Ritu Shadowaxe",
        level: 5,
        hp: 99,
        maxHp: 100,
        morale: 49,
        maxMorale: 50,
        insanity: 0,
        maxInsanity: 100,
        xp: 250.7,
        nextXp: 324,
        attack: 11,
        defense: 1,
        tools: 9,
        speech: 5,
        search: 5,
        gender: "female"
      },
      {
        id: "abhi",
        name: "Abhishek Ironshield",
        level: 1,
        hp: 100,
        maxHp: 100,
        morale: 50,
        maxMorale: 50,
        insanity: 0,
        maxInsanity: 100,
        xp: 2.65,
        nextXp: 17,
        attack: 11,
        defense: 1,
        tools: 5,
        speech: 5,
        search: 5,
        gender: "male"
      }
    ],
    missions: {
      sandwich: { seconds: 5, xp: 0.35, reward: "sandwich" },
      platter: { seconds: 45, xp: 4, reward: "platter" }
    },
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
  return {
    name: isMale ? "Mason Drift" : "Nyra Vale",
    level: 1,
    hp: 95,
    maxHp: 95,
    morale: 40,
    maxMorale: 50,
    insanity: 0,
    maxInsanity: 100,
    xp: 0,
    nextXp: 18,
    attack: 8,
    defense: 2,
    tools: 4,
    speech: 6,
    search: 6,
    gender: isMale ? "male" : "female"
  };
}

export function addSurvivor(state, survivorInput) {
  if (state.survivors.length >= state.survivorCapacity) {
    return { ok: false, reason: "capacity" };
  }

  const recruit = {
    ...survivorInput,
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
