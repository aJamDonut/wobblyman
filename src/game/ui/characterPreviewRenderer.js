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

  if (animationName === "run") {
    const stride = Math.sin(timeSeconds * 11);
    pose.lean = 0.2;
    pose.bounce = Math.sin(timeSeconds * 11) * 3;
    pose.leftArm = { x: -30 + stride * 15, y: -26 - stride * 6 };
    pose.rightArm = { x: 30 - stride * 15, y: -26 + stride * 6 };
    pose.leftLeg = { x: -16 - stride * 11, y: 62 + Math.abs(stride) * 8 };
    pose.rightLeg = { x: 16 + stride * 11, y: 62 + Math.abs(stride) * 8 };
  }

  if (animationName === "sleep") {
    const breathing = Math.sin(timeSeconds * 1.8);
    pose.lean = -0.44;
    pose.bounce = breathing * 1.2 + 8;
    pose.leftArm = { x: -22, y: -18 + breathing * 2 };
    pose.rightArm = { x: 12, y: -10 + breathing * 2 };
    pose.leftLeg = { x: -10, y: 58 };
    pose.rightLeg = { x: 8, y: 58 };
  }

  if (animationName === "talk") {
    pose.lean = -0.03;
    pose.bounce = Math.sin(timeSeconds * 4.4) * 1.8;
    pose.leftArm = { x: -28 + Math.sin(timeSeconds * 8) * 3, y: -22 + Math.cos(timeSeconds * 8) * 2 };
    pose.rightArm = { x: 24 + Math.sin(timeSeconds * 8 + 0.8) * 4, y: -14 + Math.cos(timeSeconds * 8 + 0.8) * 3 };
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

  function drawLimb(rootX, rootY, endX, endY, thickness, color, wobble = 0, phase = 0) {
    const midX = (rootX + endX) * 0.5 + Math.sin(phase) * wobble;
    const midY = (rootY + endY) * 0.5 + Math.cos(phase * 1.2) * wobble * 0.55;

    context.strokeStyle = blendHexColor(color, -0.45);
    context.lineWidth = thickness + 3;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(rootX, rootY);
    context.quadraticCurveTo(midX, midY, endX, endY);
    context.stroke();

    context.strokeStyle = color;
    context.lineWidth = thickness;
    context.beginPath();
    context.moveTo(rootX, rootY);
    context.quadraticCurveTo(midX, midY, endX, endY);
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

  function drawSpeechBubble(x, y, pulse) {
    const bubbleWidth = 58 + pulse * 2;
    const bubbleHeight = 34 + pulse;

    context.save();
    context.translate(x, y);

    context.fillStyle = "rgba(255,255,255,0.96)";
    context.strokeStyle = "rgba(19,27,35,0.55)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect(-bubbleWidth * 0.5, -bubbleHeight * 0.5, bubbleWidth, bubbleHeight, 10);
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(-8, bubbleHeight * 0.48);
    context.lineTo(-2, bubbleHeight * 0.48 + 10);
    context.lineTo(6, bubbleHeight * 0.48);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#2a3240";
    context.beginPath();
    context.arc(-12, 0, 2.2, 0, Math.PI * 2);
    context.arc(0, 0, 2.2, 0, Math.PI * 2);
    context.arc(12, 0, 2.2, 0, Math.PI * 2);
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
    // Slight skew makes the character feel less flat and more staged.
    context.transform(1, 0, -0.08, 1, 0, 0);

    drawLimb(-12, 28, pose.leftLeg.x, pose.leftLeg.y, 11, colors.pantsColor, 4.2, seconds * 7 + 0.5);
    drawLimb(12, 28, pose.rightLeg.x, pose.rightLeg.y, 11, colors.pantsColor, 4.2, seconds * 7 + 2.2);

    context.fillStyle = colors.shirtColor;
    context.strokeStyle = blendHexColor(colors.shirtColor, -0.45);
    context.lineWidth = 2.5;
    context.beginPath();
    context.roundRect(-30, -48, 60, 80, 21);
    context.fill();
    context.stroke();

    context.fillStyle = blendHexColor(colors.shirtColor, 0.1);
    context.beginPath();
    context.roundRect(-20, -36, 40, 56, 16);
    context.fill();

    context.fillStyle = colors.skinColor;
    context.strokeStyle = blendHexColor(colors.skinColor, -0.45);
    context.lineWidth = 2.2;
    context.beginPath();
    context.arc(0, -66, 24, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = colors.hairColor;
    context.strokeStyle = blendHexColor(colors.hairColor, -0.45);
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(-20, -86, 40, 15, 8);
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(-20, -78, 8, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(20, -78, 8, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#241c1b";
    if (currentAnimation === "sleep") {
      context.strokeStyle = "#2f2220";
      context.lineWidth = 2.7;
      context.beginPath();
      context.moveTo(-14, -68);
      context.lineTo(-3.5, -68);
      context.moveTo(3.5, -68);
      context.lineTo(14, -68);
      context.stroke();
    } else {
      // Bold cartoon eyes.
      context.fillStyle = "#ffffff";
      context.strokeStyle = "#1f1715";
      context.lineWidth = 2.5;
      context.beginPath();
      context.ellipse(-8.8, -68, 5.4, 6.8, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(8.8, -68, 5.4, 6.8, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#1e1615";
      context.beginPath();
      context.arc(-8.6, -67.5, 2.3, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.6, -67.5, 2.3, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(255,255,255,0.85)";
      context.beginPath();
      context.arc(-9.8, -68.8, 0.8, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(7.4, -68.8, 0.8, 0, Math.PI * 2);
      context.fill();
    }

    context.strokeStyle = "#5a3b35";
    context.lineWidth = 2.8;
    context.lineCap = "round";
    context.beginPath();
    if (currentAnimation === "talk") {
      const talkOpen = (Math.sin(seconds * 18) + 1) * 0.5;
      context.moveTo(-7, -58);
      context.quadraticCurveTo(0, -52 + talkOpen * 3.5, 8, -58);
    } else {
      context.moveTo(-7, -58);
      context.quadraticCurveTo(0, -53, 8, -58);
    }
    context.stroke();

    context.fillStyle = colors.shoeColor;
    context.strokeStyle = blendHexColor(colors.shoeColor, -0.35);
    context.lineWidth = 1.8;
    context.beginPath();
    context.ellipse(pose.leftLeg.x - 1, pose.leftLeg.y + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.ellipse(pose.rightLeg.x + 1, pose.rightLeg.y + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (currentAnimation === "sandwich") {
      drawSandwich(pose.leftArm.x + 7, pose.leftArm.y - 2, -0.22 + Math.sin(seconds * 6) * 0.05);
    }

    // Arms are rendered last so they always stay in the foreground.
    drawLimb(-22, -28, pose.leftArm.x, pose.leftArm.y, 10, colors.skinColor, 4.6, seconds * 9 + 0.8);
    drawLimb(22, -28, pose.rightArm.x, pose.rightArm.y, 10, colors.skinColor, 4.6, seconds * 9 + 2.7);

    context.fillStyle = "#f7f2e9";
    context.strokeStyle = "#4a3530";
    context.lineWidth = 1.8;
    context.beginPath();
    context.ellipse(pose.leftArm.x, pose.leftArm.y, 5.5, 4.6, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.ellipse(pose.rightArm.x, pose.rightArm.y, 5.5, 4.6, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.restore();

    if (currentAnimation === "talk") {
      drawSpeechBubble(centerX + 24, centerY - 128 + Math.sin(seconds * 5) * 2, Math.sin(seconds * 8));
    }

    if (currentAnimation === "sleep") {
      context.fillStyle = "rgba(210, 236, 255, 0.86)";
      context.font = "700 18px Arial";
      context.fillText("Z", centerX + 42, centerY - 132);
      context.fillText("Z", centerX + 58, centerY - 152);
    }

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