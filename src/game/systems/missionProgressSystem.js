import { Components } from "../ecs/components.js";

export function missionProgressSystem(world, deltaSeconds, context) {
  const missionEntityIds = world.getEntitiesWith([Components.MissionProgress]);

  missionEntityIds.forEach((entityId) => {
    const missionProgress = world.getComponent(entityId, Components.MissionProgress);
    const exactRemainingSeconds = Math.max(
      0,
      missionProgress.remainingSeconds - missionProgress.elapsedSeconds,
    );
    const activeDeltaSeconds = Math.min(deltaSeconds, exactRemainingSeconds);

    missionProgress.elapsedSeconds += deltaSeconds;

    let wholeSecondsElapsed = Math.floor(missionProgress.elapsedSeconds);
    if (wholeSecondsElapsed > 0) {
      missionProgress.elapsedSeconds -= wholeSecondsElapsed;
    }

    while (wholeSecondsElapsed > 0 && missionProgress.remainingSeconds > 0) {
      missionProgress.remainingSeconds -= 1;

      missionProgress.cycleRemainingSeconds = Math.max(0, missionProgress.cycleRemainingSeconds - 1);
      if (missionProgress.cycleRemainingSeconds === 0) {
        missionProgress.cyclesCompleted += 1;
        if (context.onMissionCycleComplete) {
          context.onMissionCycleComplete(missionProgress);
        }

        if (missionProgress.remainingSeconds > 0) {
          missionProgress.cycleRemainingSeconds = missionProgress.cycleSeconds;
        }
      }

      wholeSecondsElapsed -= 1;
    }

    if (context.onMissionTick) {
      context.onMissionTick(missionProgress, activeDeltaSeconds);
    }

    if (missionProgress.remainingSeconds === 0) {
      if (context.onMissionComplete) {
        context.onMissionComplete(missionProgress);
      }

      world.removeEntity(entityId);
    }
  });
}
