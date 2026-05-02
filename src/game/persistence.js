const STORAGE_KEY = "zim-survivor-ui-state.v1";

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeResources(defaultResources, persistedResources) {
  if (!isObject(persistedResources)) {
    return { ...defaultResources };
  }

  return {
    sandwich: Number.isFinite(persistedResources.sandwich) ? persistedResources.sandwich : defaultResources.sandwich,
    platter: Number.isFinite(persistedResources.platter) ? persistedResources.platter : defaultResources.platter
  };
}

export function loadPersistedState(initialState) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneState(initialState);
    }

    const persisted = JSON.parse(raw);
    if (!isObject(persisted)) {
      return cloneState(initialState);
    }

    const state = cloneState(initialState);

    if (Array.isArray(persisted.survivors)) {
      state.survivors = persisted.survivors;
    }

    state.resources = sanitizeResources(initialState.resources, persisted.resources);

    if (typeof persisted.activeId === "string" || persisted.activeId === null) {
      state.activeId = persisted.activeId;
    }

    if (Number.isInteger(persisted.survivorCapacity) && persisted.survivorCapacity > 0) {
      state.survivorCapacity = persisted.survivorCapacity;
    }

    // Runtime jobs should always restart cleanly after refresh.
    state.running = null;

    return state;
  } catch {
    return cloneState(initialState);
  }
}

export function savePersistedState(state) {
  const payload = {
    survivors: state.survivors,
    resources: state.resources,
    activeId: state.activeId,
    survivorCapacity: state.survivorCapacity
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}
