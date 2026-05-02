import { Components } from "../ecs/components.js";

export function missionProgressSystem(world, deltaSeconds, context) {
  const missionEntityIds = world.getEntitiesWith([Components.MissionProgress]);

  missionEntityIds.forEach((entityId) => {
    const missionProgress = world.getComponent(entityId, Components.MissionProgress);
    missionProgress.elapsedSeconds += deltaSeconds;

    const wholeSecondsElapsed = Math.floor(missionProgress.elapsedSeconds);
    if (wholeSecondsElapsed > 0) {
      missionProgress.elapsedSeconds -= wholeSecondsElapsed;
      missionProgress.remainingSeconds = Math.max(
        0,
        missionProgress.remainingSeconds - wholeSecondsElapsed
      );

      if (context.onMissionTick) {
        context.onMissionTick(missionProgress);
      }
    }

    if (missionProgress.remainingSeconds === 0) {
      if (context.onMissionComplete) {
        context.onMissionComplete(missionProgress);
      }

      world.removeEntity(entityId);
    }
  });
}
