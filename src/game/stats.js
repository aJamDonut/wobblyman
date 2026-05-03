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
    key: "food",
    label: "Food",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "🍽️",
    toneClass: "#f1f1f1",
    recoverPerTick: 0,
    showInRosterBar: true,
    showInHeader: true
  },
  {
    key: "sleep",
    label: "Sleep",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "💤",
    toneClass: "#f1f1f1",
    recoverPerTick: 0,
    showInRosterBar: true,
    showInHeader: true
  },
  {
    key: "hygiene",
    label: "Hygiene",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "🛁",
    toneClass: "#f1f1f1",
    recoverPerTick: 0,
    showInRosterBar: true,
    showInHeader: true
  },
  {
    key: "social",
    label: "Social",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "💕",
    toneClass: "#f1f1f1",
    recoverPerTick: 0,
    showInRosterBar: true,
    showInHeader: true
  },
  {
    key: "bladder",
    label: "Bladder",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 100,
    icon: "🚽",
    toneClass: "#f1f1f1",
    recoverPerTick: 0,
    showInRosterBar: true,
    showInHeader: true
  },
  
  {
    key: "strain",
    label: "Strain",
    displayType: STAT_DISPLAY_TYPES.BAR,
    lowest: 0,
    highest: 1000,
    default: 0,
    defaultMax: 1000,
    icon: "😵",
    toneClass: "#f1f1f1",
    recoverPerTick: 0,
    showInRosterBar: true,
    showInHeader: true
  },
  {
    key: "cooking",
    label: "Cooking",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 1,
    icon: "🥣",
    showInHeader: true
  },
  {
    key: "physical",
    label: "Physical",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 1,
    icon: "💪",
    showInHeader: true
  },
  {
    key: "speech",
    label: "Speech",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 1,
    icon: "💬",
    showInHeader: true
  },
  {
    key: "business",
    label: "Business",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 1,
    icon: "💼",
    showInHeader: true
  },
  {
    key: "art",
    label: "Art",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 1,
    icon: "🎨",
    showInHeader: true
  },
  {
    key: "knowledge",
    label: "Knowledge",
    displayType: STAT_DISPLAY_TYPES.INT,
    lowest: 0,
    highest: 1000,
    default: 1,
    icon: "🧠",
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
    const {
      key,
      lowest,
      highest,
      default: defaultValue,
      defaultMax,
      displayType
    } = definition;
    const { max, xp } = getStatHiddenKeys(key);

    const fallbackMax = Number.isFinite(defaultMax) ? defaultMax : defaultValue;
    const rawValue = toNumber(overrides[key], defaultValue);
    const rawMax = toNumber(overrides[max], fallbackMax);
    const rawXp = toNumber(overrides[xp], 0);

    const safeMax =
      displayType === STAT_DISPLAY_TYPES.INT
        ? Math.max(rawMax, rawValue)
        : rawMax;

    values[max] = clamp(safeMax, lowest, highest);
    values[key] = clamp(rawValue, lowest, values[max]);
    values[xp] = Math.max(0, rawXp);
  });

  return values;
}

export function normalizeSurvivorStats(survivor) {
  const hydratedOverrides = { ...survivor };

  survivorStatDefinitions.forEach((definition) => {
    const { key, defaultMax, lowest, highest, displayType } = definition;
    const { max, xp } = getStatHiddenKeys(key);
    const aliases = getLegacyAliases(key);

    if (!Number.isFinite(hydratedOverrides[key]) && Number.isFinite(hydratedOverrides[aliases.value])) {
      hydratedOverrides[key] = hydratedOverrides[aliases.value];
    }

    if (!Number.isFinite(hydratedOverrides[max]) && Number.isFinite(hydratedOverrides[aliases.max])) {
      hydratedOverrides[max] = hydratedOverrides[aliases.max];
    }

    if (
      displayType === STAT_DISPLAY_TYPES.BAR
      && Number.isFinite(defaultMax)
      && toNumber(hydratedOverrides[max], lowest) <= lowest
    ) {
      hydratedOverrides[max] = clamp(defaultMax, lowest, highest);
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
    } else {
      // Keep hidden max in sync for persisted INT stats so reload normalization cannot down-clamp.
      survivor[max] = Math.min(highest, Math.max(toNumber(survivor[max], definition.default), survivor[key]));
    }

    levelsGained += 1;
  }

  if (survivor[key] >= highest) {
    survivor[xp] = 0;
  }

  return levelsGained;
}

export function applyStatDelta(survivor, statKey, deltaAmount) {
  if (!survivor) {
    return 0;
  }

  const definition = getStatDefinition(statKey);
  if (!definition) {
    return 0;
  }

  const delta = toNumber(deltaAmount, 0);
  if (delta === 0) {
    return 0;
  }

  const {
    key,
    lowest,
    highest,
    default: defaultValue,
    defaultMax,
    displayType
  } = definition;
  const { max } = getStatHiddenKeys(key);

  if (!Number.isFinite(survivor[key])) {
    survivor[key] = defaultValue;
  }

  if (displayType === STAT_DISPLAY_TYPES.BAR) {
    const fallbackMax = Number.isFinite(defaultMax) ? defaultMax : defaultValue;
    if (!Number.isFinite(survivor[max]) || survivor[max] <= lowest) {
      survivor[max] = clamp(fallbackMax, lowest, highest);
    }
  }

  const ceiling =
    displayType === STAT_DISPLAY_TYPES.BAR
      ? clamp(toNumber(survivor[max], highest), lowest, highest)
      : highest;

  const previous = clamp(survivor[key], lowest, ceiling);
  const next = clamp(previous + delta, lowest, ceiling);

  survivor[key] = next;
  return next - previous;
}

export { STAT_DISPLAY_TYPES };