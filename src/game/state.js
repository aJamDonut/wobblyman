export function createInitialState() {
  return {
    resources: { sandwich: 0, platter: 0 },
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
