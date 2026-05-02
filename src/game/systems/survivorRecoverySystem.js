import { getStatHiddenKeys, survivorStatDefinitions } from "../stats.js";

export function survivorRecoverySystem(world, deltaSeconds, context) {
  const { state, onStateChanged } = context;
  context.elapsedSeconds = (context.elapsedSeconds || 0) + deltaSeconds;

  if (context.elapsedSeconds < 2) {
    return;
  }

  context.elapsedSeconds = 0;

  let changed = false;

  const recoveryDefinitions = survivorStatDefinitions.filter((definition) => definition.recoverPerTick > 0);

  state.survivors.forEach((survivor) => {
    const isWorking = state.running && state.running.survivorId === survivor.id;

    if (isWorking) {
      return;
    }

    recoveryDefinitions.forEach((definition) => {
      const { max } = getStatHiddenKeys(definition.key);
      const current = Number.isFinite(survivor[definition.key]) ? survivor[definition.key] : 0;
      const maxValue = Number.isFinite(survivor[max]) ? survivor[max] : 0;
      const nextValue = Math.min(maxValue, current + definition.recoverPerTick);

      if (nextValue !== current) {
        survivor[definition.key] = nextValue;
        changed = true;
      }
    });
  });

  if (changed && onStateChanged) {
    onStateChanged();
  }
}
