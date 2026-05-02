export function survivorRecoverySystem(world, deltaSeconds, context) {
  const { state, onStateChanged } = context;
  context.elapsedSeconds = (context.elapsedSeconds || 0) + deltaSeconds;

  if (context.elapsedSeconds < 2) {
    return;
  }

  context.elapsedSeconds = 0;

  let changed = false;

  state.survivors.forEach((survivor) => {
    const isWorking = state.running && state.running.survivorId === survivor.id;

    if (isWorking) {
      return;
    }

    const newHp = Math.min(survivor.maxHp, survivor.hp + 1);
    const newMorale = Math.min(survivor.maxMorale, survivor.morale + 1);

    if (newHp !== survivor.hp || newMorale !== survivor.morale) {
      survivor.hp = newHp;
      survivor.morale = newMorale;
      changed = true;
    }
  });

  if (changed && onStateChanged) {
    onStateChanged();
  }
}
