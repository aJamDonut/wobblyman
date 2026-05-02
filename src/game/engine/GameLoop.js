export class GameLoop {
  constructor({ fixedDeltaSeconds = 1 / 30 } = {}) {
    this.fixedDeltaSeconds = fixedDeltaSeconds;
    this.systems = [];
    this.isRunning = false;
    this.lastTime = 0;
    this.accumulatorSeconds = 0;
    this.frameHandle = null;
  }

  addSystem(system, context = {}) {
    this.systems.push({ system, context });
  }

  start(world) {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();

    const step = (now) => {
      if (!this.isRunning) {
        return;
      }

      const deltaSeconds = Math.min((now - this.lastTime) / 1000, 0.25);
      this.lastTime = now;
      this.accumulatorSeconds += deltaSeconds;

      while (this.accumulatorSeconds >= this.fixedDeltaSeconds) {
        this.systems.forEach(({ system, context }) => {
          system(world, this.fixedDeltaSeconds, context);
        });

        this.accumulatorSeconds -= this.fixedDeltaSeconds;
      }

      this.frameHandle = requestAnimationFrame(step);
    };

    this.frameHandle = requestAnimationFrame(step);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }
}
