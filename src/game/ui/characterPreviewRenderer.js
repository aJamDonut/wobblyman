const DEFAULT_COLORS = {
  shirtColor: "#d94a35",
  skinColor: "#cf8b58",
  hairColor: "#6f2d28",
  pantsColor: "#303946",
  shoeColor: "#1f2328"
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function blendHexColor(hexColor, amount) {
  const color = String(hexColor || "#000000").replace("#", "");
  const safe = color.length === 3
    ? color.split("").map((digit) => digit + digit).join("")
    : color.padEnd(6, "0").slice(0, 6);

  const toChannel = (index) => parseInt(safe.slice(index, index + 2), 16);
  const shift = (channel) => clamp(Math.round(channel + 255 * amount), 0, 255)
    .toString(16)
    .padStart(2, "0");

  const r = shift(toChannel(0));
  const g = shift(toChannel(2));
  const b = shift(toChannel(4));
  return `#${r}${g}${b}`;
}

function createPose(timeSeconds, animationName) {
  const bounce = Math.sin(timeSeconds * 2.1) * 4;
  const shoulderY = -32;

  const pose = {
    bounce,
    lean: Math.sin(timeSeconds * 1.6) * 0.05,
    leftArm: { x: -24 + Math.sin(timeSeconds * 2) * 5, y: shoulderY + 22 },
    rightArm: { x: 24 + Math.sin(timeSeconds * 2 + Math.PI) * 5, y: shoulderY + 22 },
    leftLeg: { x: -14 + Math.sin(timeSeconds * 1.8) * 2, y: 66 },
    rightLeg: { x: 14 + Math.sin(timeSeconds * 1.8 + Math.PI) * 2, y: 66 }
  };

  if (animationName === "wave") {
    pose.rightArm = {
      x: 34 + Math.sin(timeSeconds * 7) * 4,
      y: -66 + Math.cos(timeSeconds * 7) * 5
    };
    pose.lean = 0.08;
  }

  if (animationName === "sandwich") {
    const cycle = (Math.sin(timeSeconds * 8) + 1) * 0.5;
    pose.leftArm = { x: -8 + cycle * 10, y: -58 + cycle * 8 };
    pose.rightArm = { x: 28 + Math.sin(timeSeconds * 6) * 3, y: -30 + Math.cos(timeSeconds * 6) * 5 };
    pose.bounce = Math.sin(timeSeconds * 6) * 2;
    pose.lean = -0.05;
  }

  if (animationName === "celebrate") {
    pose.leftArm = { x: -34 + Math.sin(timeSeconds * 8) * 5, y: -64 + Math.cos(timeSeconds * 9) * 4 };
    pose.rightArm = { x: 34 + Math.sin(timeSeconds * 9) * 5, y: -64 + Math.cos(timeSeconds * 8) * 4 };
    pose.leftLeg = { x: -18, y: 62 + Math.sin(timeSeconds * 9) * 6 };
    pose.rightLeg = { x: 18, y: 62 + Math.sin(timeSeconds * 9 + Math.PI) * 6 };
    pose.bounce = Math.abs(Math.sin(timeSeconds * 10)) * -12;
  }

  if (animationName === "working") {
    pose.leftArm = { x: -22 + Math.sin(timeSeconds * 7) * 7, y: -18 + Math.cos(timeSeconds * 6) * 4 };
    pose.rightArm = { x: 22 + Math.sin(timeSeconds * 7 + 1.2) * 7, y: -18 + Math.cos(timeSeconds * 6 + 1.2) * 4 };
    pose.bounce = Math.sin(timeSeconds * 7) * 3;
  }

  return pose;
}

export function createCharacterPreviewRenderer({ canvas, statusLabel }) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Character renderer requires a canvas element.");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D canvas context unavailable.");
  }

  let colors = { ...DEFAULT_COLORS };
  let currentAnimation = "idle";
  let loopAnimation = "idle";
  let animationStartedAt = performance.now();
  let animationDurationMs = 0;
  let rafId = null;

  function updateCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(280, Math.floor(canvas.clientWidth));
    const height = Math.max(320, Math.floor(canvas.clientHeight));

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawLimb(rootX, rootY, endX, endY, thickness, color) {
    context.strokeStyle = color;
    context.lineWidth = thickness;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(rootX, rootY);
    context.lineTo(endX, endY);
    context.stroke();
  }

  function drawSandwich(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    context.fillStyle = "#c9954f";
    context.beginPath();
    context.roundRect(-11, -8, 22, 7, 3);
    context.fill();

    context.fillStyle = "#82c566";
    context.beginPath();
    context.roundRect(-10, -2, 20, 3, 2);
    context.fill();

    context.fillStyle = "#f5d98d";
    context.beginPath();
    context.roundRect(-11, 1, 22, 7, 3);
    context.fill();

    context.restore();
  }

  function drawFrame(now) {
    updateCanvasSize();

    if (animationDurationMs > 0 && now - animationStartedAt >= animationDurationMs) {
      currentAnimation = loopAnimation;
      animationDurationMs = 0;
      animationStartedAt = now;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width * 0.5;
    const centerY = height * 0.58;

    const seconds = now / 1000;
    const pose = createPose(seconds, currentAnimation);

    const gradient = context.createRadialGradient(centerX, centerY - 48, 24, centerX, centerY, Math.max(width, height));
    gradient.addColorStop(0, "rgba(255,255,255,0.13)");
    gradient.addColorStop(1, "rgba(7,11,15,0.92)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(0,0,0,0.26)";
    context.beginPath();
    context.ellipse(centerX, centerY + 88, 52, 11, 0, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.translate(centerX, centerY + pose.bounce);
    context.rotate(pose.lean);

    drawLimb(-12, 28, pose.leftLeg.x, pose.leftLeg.y, 11, colors.pantsColor);
    drawLimb(12, 28, pose.rightLeg.x, pose.rightLeg.y, 11, colors.pantsColor);

    context.fillStyle = colors.shirtColor;
    context.beginPath();
    context.roundRect(-30, -48, 60, 80, 21);
    context.fill();

    context.fillStyle = blendHexColor(colors.shirtColor, 0.1);
    context.beginPath();
    context.roundRect(-20, -36, 40, 56, 16);
    context.fill();

    context.fillStyle = colors.skinColor;
    context.beginPath();
    context.arc(0, -66, 24, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = colors.hairColor;
    context.beginPath();
    context.roundRect(-20, -86, 40, 15, 8);
    context.fill();
    context.beginPath();
    context.arc(-20, -78, 8, 0, Math.PI * 2);
    context.arc(20, -78, 8, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#2f2220";
    context.beginPath();
    context.ellipse(-8, -68, 2.8, 4, 0, 0, Math.PI * 2);
    context.ellipse(8, -68, 2.8, 4, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "#5a3b35";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-7, -58);
    context.quadraticCurveTo(0, -53, 8, -58);
    context.stroke();

    context.fillStyle = colors.shoeColor;
    context.beginPath();
    context.roundRect(pose.leftLeg.x - 8, pose.leftLeg.y - 2, 14, 6, 3);
    context.roundRect(pose.rightLeg.x - 6, pose.rightLeg.y - 2, 14, 6, 3);
    context.fill();

    if (currentAnimation === "sandwich") {
      drawSandwich(pose.leftArm.x + 7, pose.leftArm.y - 2, -0.22 + Math.sin(seconds * 6) * 0.05);
    }

    // Arms are rendered last so they always stay in the foreground.
    drawLimb(-22, -28, pose.leftArm.x, pose.leftArm.y, 10, colors.skinColor);
    drawLimb(22, -28, pose.rightArm.x, pose.rightArm.y, 10, colors.skinColor);

    context.restore();

    rafId = window.requestAnimationFrame(drawFrame);
  }

  function playAnimation(name, options = {}) {
    const { durationMs = 0, loop = false } = options;
    currentAnimation = name || "idle";
    if (loop) {
      loopAnimation = currentAnimation;
    }
    animationDurationMs = Math.max(0, Number(durationMs) || 0);
    animationStartedAt = performance.now();

    if (statusLabel) {
      statusLabel.textContent = currentAnimation.toUpperCase();
    }
  }

  function setCharacterProperties(nextProperties = {}) {
    colors = {
      ...colors,
      ...Object.fromEntries(
        Object.entries(nextProperties).filter(([, value]) => typeof value === "string" && value.trim() !== "")
      )
    };
  }

  function destroy() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener("resize", updateCanvasSize);
  updateCanvasSize();
  playAnimation("idle", { loop: true });
  rafId = window.requestAnimationFrame(drawFrame);

  return {
    setCharacterProperties,
    playAnimation,
    destroy
  };
}