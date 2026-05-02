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

export function getStatDefinition(statKey) {
  return survivorStatDefinitions.find((definition) => definition.key === statKey) || null;
}

export function getStatXpTarget(statKey, statLevel) {
  const definition = getStatDefinition(statKey);
  if (!definition) {
    return 0;
  }

  const normalizedLevel = Math.max(
    definition.lowest,
    toNumber(statLevel, definition.default)
  );
  const scaledLevel = Math.max(0, normalizedLevel - definition.lowest);

  return Math.max(
    8,
    Math.round(12 + scaledLevel * 0.35 + Math.pow(scaledLevel, 1.08) * 0.05)
  );
}

export function gainStatXp(survivor, statKey, xpAmount) {
  if (!survivor) {
    return 0;
  }

  const definition = getStatDefinition(statKey);
  if (!definition) {
    return 0;
  }

  const amount = Math.max(0, toNumber(xpAmount, 0));
  if (amount <= 0) {
    return 0;
  }

  const { key, highest, displayType } = definition;
  const { max, xp } = getStatHiddenKeys(key);

  if (!Number.isFinite(survivor[key])) {
    survivor[key] = definition.default;
  }

  if (!Number.isFinite(survivor[xp])) {
    survivor[xp] = 0;
  }

  if (displayType === STAT_DISPLAY_TYPES.BAR && !Number.isFinite(survivor[max])) {
    survivor[max] = Math.max(survivor[key], definition.default);
  }

  survivor[xp] += amount;

  let levelsGained = 0;
  while (survivor[key] < highest) {
    const targetXp = getStatXpTarget(key, survivor[key]);
    if (survivor[xp] < targetXp) {
      break;
    }

    survivor[xp] -= targetXp;
    survivor[key] = Math.min(highest, survivor[key] + 1);

    if (displayType === STAT_DISPLAY_TYPES.BAR) {
      survivor[max] = Math.min(highest, Math.max(survivor[max], survivor[key]));
      survivor[key] = Math.min(survivor[key], survivor[max]);
    }

    levelsGained += 1;
  }

  if (survivor[key] >= highest) {
    survivor[xp] = 0;
  }

  return levelsGained;
}

export { STAT_DISPLAY_TYPES };