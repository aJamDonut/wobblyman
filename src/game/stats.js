const STAT_DISPLAY_TYPES = {
  BAR: "bar",
  INT: "int"
};

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function toNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export const survivorStatDefinitions = [
  {
    key: "health",
    label: "Health",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "❤",
    toneClass: "red",
    recoverPerTick: 1,
    showInRosterBar: true
  },
  {
    key: "morale",
    label: "Morale",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "✊",
    toneClass: "blue",
    recoverPerTick: 1,
    showInRosterBar: true
  },
  {
    key: "sleep",
    label: "Sleep",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "✊",
    toneClass: "#f1f1f1",
    recoverPerTick: 1,
    showInRosterBar: true,
    showInHeader: true
  },
  {
    key: "insanity",
    label: "Insanity",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 0,
    icon: "🧠",
    toneClass: "purple",
    showInRosterBar: true
  },
  {
    key: "cooking",
    label: "Cooking",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "🍳",
    showInHeader: true
  },
  {
    key: "attack",
    label: "Attack",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 10,
    icon: "✥",
    showInHeader: true
  },
  {
    key: "defense",
    label: "Defense",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 5,
    icon: "🛡",
    showInHeader: true
  },
  {
    key: "tools",
    label: "Tools",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 5,
    icon: "🔧",
    showInHeader: true
  },
  {
    key: "speech",
    label: "Speech",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 5,
    icon: "💬",
    showInHeader: true
  },
  {
    key: "search",
    label: "Search",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 5,
    icon: "🔭",
    showInHeader: true
  }
];

export function getStatHiddenKeys(statKey) {
  return {
    max: `${statKey}Max`,
    xp: `${statKey}Xp`
  };
}

function getLegacyAliases(statKey) {
  if (statKey === "health") {
    return { value: "hp", max: "maxHp" };
  }

  const capped = capitalize(statKey);
  return { value: statKey, max: `max${capped}` };
}

export function createDefaultStatValues(overrides = {}) {
  const values = {};

  survivorStatDefinitions.forEach((definition) => {
    const { key, lowest, highest, default: defaultValue } = definition;
    const { max, xp } = getStatHiddenKeys(key);

    const rawValue = toNumber(overrides[key], defaultValue);
    const rawMax = toNumber(overrides[max], rawValue);
    const rawXp = toNumber(overrides[xp], 0);

    values[max] = clamp(rawMax, lowest, highest);
    values[key] = clamp(rawValue, lowest, values[max]);
    values[xp] = Math.max(0, rawXp);
  });

  return values;
}

export function normalizeSurvivorStats(survivor) {
  const hydratedOverrides = { ...survivor };

  survivorStatDefinitions.forEach((definition) => {
    const { key } = definition;
    const { max, xp } = getStatHiddenKeys(key);
    const aliases = getLegacyAliases(key);

    if (!Number.isFinite(hydratedOverrides[key]) && Number.isFinite(hydratedOverrides[aliases.value])) {
      hydratedOverrides[key] = hydratedOverrides[aliases.value];
    }

    if (!Number.isFinite(hydratedOverrides[max]) && Number.isFinite(hydratedOverrides[aliases.max])) {
      hydratedOverrides[max] = hydratedOverrides[aliases.max];
    }

    if (!Number.isFinite(hydratedOverrides[xp])) {
      hydratedOverrides[xp] = 0;
    }
  });

  return {
    ...survivor,
    ...createDefaultStatValues(hydratedOverrides)
  };
}

export function getSurvivorDisplayStats(displayType) {
  return survivorStatDefinitions.filter((definition) => definition.displayType === displayType);
}

export { STAT_DISPLAY_TYPES };