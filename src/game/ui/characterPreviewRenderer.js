const DEFAULT_COLORS = {
  shirtColor: "#d94a35",
  skinColor: "#cf8b58",
  hairColor: "#6f2d28",
  pantsColor: "#303946",
  shoeColor: "#1f2328"
};

const HAIR_STYLES = [
  "classic",
  "buzz",
  "parted",
  "pompadour",
  "afro",
  "mohawk",
  "spiky",
  "bob",
  "ponytail",
  "wavy",
  "braids",
  "quiff",
  "anime-spikes",
  "twin-tails",
  "hime-cut",
  "side-bangs",
  "ahoge",
  "hero-sweep",
  "neko-fluff",
  "ribbon-bob",
  "cyber-visor",
  "long-flow",
  "hat-beanie",
  "hat-cap",
  "hat-beret",
  "hat-top",
  "hat-bucket",
  "hat-fedora",
  "hat-crown",
  "hat-helmet",
  "hat-chef",
  "hat-wizard"
];

const BODY_TYPES = [
  "classic",
  "petite",
  "broad",
  "stocky",
  "tall",
  "lanky"
];

const BODY_TYPE_PROFILES = {
  classic: { torsoWidth: 48, torsoHeight: 62, torsoRadius: 25, torsoYOffset: 0, insetScaleX: 0.67, insetScaleY: 0.71 },
  petite: { torsoWidth: 40, torsoHeight: 54, torsoRadius: 22, torsoYOffset: 4, insetScaleX: 0.7, insetScaleY: 0.7 },
  broad: { torsoWidth: 58, torsoHeight: 60, torsoRadius: 24, torsoYOffset: 1, insetScaleX: 0.64, insetScaleY: 0.7 },
  stocky: { torsoWidth: 60, torsoHeight: 52, torsoRadius: 24, torsoYOffset: 8, insetScaleX: 0.62, insetScaleY: 0.66 },
  tall: { torsoWidth: 44, torsoHeight: 72, torsoRadius: 24, torsoYOffset: -5, insetScaleX: 0.66, insetScaleY: 0.74 },
  lanky: { torsoWidth: 40, torsoHeight: 74, torsoRadius: 20, torsoYOffset: -6, insetScaleX: 0.64, insetScaleY: 0.76 }
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

function sketchNoise(seed, amplitude = 1) {
  return Math.sin(seed * 12.9898) * amplitude;
}

function createPose(timeSeconds, animationName) {
  const bounce = Math.sin(timeSeconds * 2.1) * 4;
  const shoulderY = -30;

  const pose = {
    bounce,
    lean: Math.sin(timeSeconds * 1.6) * 0.05,
    leftArm: { x: -36 + Math.sin(timeSeconds * 2) * 4, y: shoulderY + 44 },
    rightArm: { x: 36 + Math.sin(timeSeconds * 2 + Math.PI) * 4, y: shoulderY + 44 },
    leftLeg: { x: -18 + Math.sin(timeSeconds * 1.8) * 2, y: 78 },
    rightLeg: { x: 18 + Math.sin(timeSeconds * 1.8 + Math.PI) * 2, y: 78 }
  };

  if (animationName === "wave") {
    pose.rightArm = {
      x: 48 + Math.sin(timeSeconds * 7) * 3,
      y: -76 + Math.cos(timeSeconds * 7) * 3
    };
    pose.lean = 0.08;
  }

  if (animationName === "sandwich") {
    const cycle = (Math.sin(timeSeconds * 8) + 1) * 0.5;
    pose.leftArm = { x: -10 + cycle * 9, y: -52 + cycle * 7 };
    pose.rightArm = { x: 38 + Math.sin(timeSeconds * 6) * 2, y: -22 + Math.cos(timeSeconds * 6) * 3 };
    pose.bounce = Math.sin(timeSeconds * 6) * 2;
    pose.lean = -0.05;
  }

  if (animationName === "celebrate") {
    pose.leftArm = { x: -46 + Math.sin(timeSeconds * 8) * 3, y: -74 + Math.cos(timeSeconds * 9) * 2.5 };
    pose.rightArm = { x: 46 + Math.sin(timeSeconds * 9) * 3, y: -74 + Math.cos(timeSeconds * 8) * 2.5 };
    pose.leftLeg = { x: -20, y: 78 + Math.sin(timeSeconds * 9) * 2 };
    pose.rightLeg = { x: 20, y: 78 + Math.sin(timeSeconds * 9 + Math.PI) * 2 };
    pose.bounce = Math.abs(Math.sin(timeSeconds * 10)) * -12;
  }

  if (animationName === "working") {
    pose.leftArm = { x: -34 + Math.sin(timeSeconds * 7) * 5, y: -10 + Math.cos(timeSeconds * 6) * 3 };
    pose.rightArm = { x: 34 + Math.sin(timeSeconds * 7 + 1.2) * 5, y: -10 + Math.cos(timeSeconds * 6 + 1.2) * 3 };
    pose.bounce = Math.sin(timeSeconds * 7) * 3;
  }

  if (animationName === "run") {
    const stride = Math.sin(timeSeconds * 11);
    pose.lean = 0.2;
    pose.bounce = Math.sin(timeSeconds * 11) * 3;
    pose.leftArm = { x: -44 + stride * 12, y: -20 - stride * 5 };
    pose.rightArm = { x: 44 - stride * 12, y: -20 + stride * 5 };
    pose.leftLeg = { x: -20 - stride * 14, y: 78 + Math.abs(stride) * 3 };
    pose.rightLeg = { x: 20 + stride * 14, y: 78 + Math.abs(stride) * 3 };
  }

  if (animationName === "sleep") {
    const breathing = Math.sin(timeSeconds * 1.8);
    pose.lean = -0.44;
    pose.bounce = breathing * 1.2 + 8;
    pose.leftArm = { x: -34, y: -12 + breathing * 2 };
    pose.rightArm = { x: 18, y: -4 + breathing * 2 };
    pose.leftLeg = { x: -14, y: 78 };
    pose.rightLeg = { x: 12, y: 78 };
  }

  if (animationName === "talk") {
    pose.lean = -0.03;
    pose.bounce = Math.sin(timeSeconds * 4.4) * 1.8;
    pose.leftArm = { x: -40 + Math.sin(timeSeconds * 8) * 2.5, y: -14 + Math.cos(timeSeconds * 8) * 1.3 };
    pose.rightArm = { x: 36 + Math.sin(timeSeconds * 8 + 0.8) * 3, y: -8 + Math.cos(timeSeconds * 8 + 0.8) * 2 };
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
  let hairStyle = "classic";
  let bodyType = "classic";
  let currentAnimation = "idle";
  let transitionFromAnimation = "idle";
  let transitionStartedAt = performance.now();
  let transitionDurationMs = 0;
  let loopAnimation = "idle";
  let animationStartedAt = performance.now();
  let animationDurationMs = 0;
  let rafId = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function interpolatePose(fromPose, toPose, mix) {
    return {
      bounce: lerp(fromPose.bounce, toPose.bounce, mix),
      lean: lerp(fromPose.lean, toPose.lean, mix),
      leftArm: {
        x: lerp(fromPose.leftArm.x, toPose.leftArm.x, mix),
        y: lerp(fromPose.leftArm.y, toPose.leftArm.y, mix)
      },
      rightArm: {
        x: lerp(fromPose.rightArm.x, toPose.rightArm.x, mix),
        y: lerp(fromPose.rightArm.y, toPose.rightArm.y, mix)
      },
      leftLeg: {
        x: lerp(fromPose.leftLeg.x, toPose.leftLeg.x, mix),
        y: lerp(fromPose.leftLeg.y, toPose.leftLeg.y, mix)
      },
      rightLeg: {
        x: lerp(fromPose.rightLeg.x, toPose.rightLeg.x, mix),
        y: lerp(fromPose.rightLeg.y, toPose.rightLeg.y, mix)
      }
    };
  }

  function getAnimationWeight(animationName, mix) {
    if (transitionDurationMs <= 0) {
      return animationName === currentAnimation ? 1 : 0;
    }
    let weight = 0;
    if (animationName === transitionFromAnimation) {
      weight += 1 - mix;
    }
    if (animationName === currentAnimation) {
      weight += mix;
    }
    return clamp(weight, 0, 1);
  }

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
    const graphite = "#332923";
    const fillTone = blendHexColor(color, 0.1);

    context.strokeStyle = fillTone;
    context.lineWidth = thickness + 1;
    context.lineCap = "round";

    for (let pass = 0; pass < 3; pass += 1) {
      const passSeed = phase + pass * 0.73;
      const jitterX = sketchNoise(passSeed, 0.9);
      const jitterY = sketchNoise(passSeed + 2.4, 0.8);
      const midX = (rootX + endX) * 0.5 + Math.sin(phase + pass * 0.35) * wobble + jitterX;
      const midY = (rootY + endY) * 0.5 + Math.cos(phase * 1.2 + pass * 0.42) * wobble * 0.55 + jitterY;
      context.beginPath();
      context.moveTo(rootX + jitterX * 0.35, rootY + jitterY * 0.35);
      context.quadraticCurveTo(midX, midY, endX - jitterX * 0.25, endY - jitterY * 0.25);
      context.stroke();
    }

    context.strokeStyle = graphite;
    context.lineWidth = Math.max(1.2, thickness * 0.28);
    context.beginPath();
    context.moveTo(rootX, rootY);
    context.quadraticCurveTo(
      (rootX + endX) * 0.5 + Math.sin(phase) * wobble,
      (rootY + endY) * 0.5 + Math.cos(phase * 1.2) * wobble * 0.55,
      endX,
      endY
    );
    context.stroke();
  }

  function drawSandwich(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    context.fillStyle = "#e9c383";
    context.beginPath();
    context.roundRect(-11, -8, 22, 7, 3);
    context.fill();

    context.fillStyle = "#95bb6f";
    context.beginPath();
    context.roundRect(-10, -2, 20, 3, 2);
    context.fill();

    context.fillStyle = "#f6dba5";
    context.beginPath();
    context.roundRect(-11, 1, 22, 7, 3);
    context.fill();

    context.strokeStyle = "#342b24";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-8, -6);
    context.lineTo(6, 4);
    context.moveTo(-3, -6);
    context.lineTo(11, 3);
    context.stroke();

    context.restore();
  }

  function drawSpeechBubble(x, y, pulse) {
    const bubbleWidth = 58 + pulse * 2;
    const bubbleHeight = 34 + pulse;

    context.save();
    context.translate(x, y);

    context.fillStyle = "rgba(250,247,236,0.97)";
    context.strokeStyle = "rgba(51,42,35,0.8)";
    context.lineWidth = 1.3;
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

    context.fillStyle = "#41352d";
    context.beginPath();
    context.arc(-12, 0, 2.2, 0, Math.PI * 2);
    context.arc(0, 0, 2.2, 0, Math.PI * 2);
    context.arc(12, 0, 2.2, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  function drawCharacterShaderOutline(pose, leftLegEndY, rightLegEndY, bodyProfile) {
    const torsoWidth = bodyProfile.torsoWidth;
    const torsoHeight = bodyProfile.torsoHeight;
    const torsoY = -38 + bodyProfile.torsoYOffset;
    const torsoX = -torsoWidth * 0.5;
    const headCenterY = -62;

    context.save();
    context.strokeStyle = "rgba(45, 37, 32, 0.86)";
    context.lineWidth = 1.8;
    context.lineJoin = "round";
    context.lineCap = "round";

    for (let pass = 0; pass < 2; pass += 1) {
      const jitter = pass === 0 ? 0 : 0.75;
      context.beginPath();
      context.roundRect(torsoX + jitter, torsoY + jitter, torsoWidth, torsoHeight, bodyProfile.torsoRadius);
      context.stroke();

      context.beginPath();
      context.arc(jitter * 0.4, headCenterY + jitter, 25.5, 0, Math.PI * 2);
      context.stroke();
    }

    context.beginPath();
    context.moveTo(-14, 18);
    context.quadraticCurveTo((pose.leftLeg.x - 14) * 0.5, (leftLegEndY + 18) * 0.5, pose.leftLeg.x, leftLegEndY);
    context.moveTo(14, 18);
    context.quadraticCurveTo((pose.rightLeg.x + 14) * 0.5, (rightLegEndY + 18) * 0.5, pose.rightLeg.x, rightLegEndY);
    context.moveTo(-18, -28);
    context.quadraticCurveTo((pose.leftArm.x - 18) * 0.5, (pose.leftArm.y - 28) * 0.5, pose.leftArm.x, pose.leftArm.y);
    context.moveTo(18, -28);
    context.quadraticCurveTo((pose.rightArm.x + 18) * 0.5, (pose.rightArm.y - 28) * 0.5, pose.rightArm.x, pose.rightArm.y);
    context.stroke();

    context.beginPath();
    context.ellipse(pose.leftArm.x, pose.leftArm.y, 9.2, 7.7, 0, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.ellipse(pose.rightArm.x, pose.rightArm.y, 9.2, 7.7, 0, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.ellipse(pose.leftLeg.x - 1, leftLegEndY + 1.5, 10.8, 5.8, 0, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.ellipse(pose.rightLeg.x + 1, rightLegEndY + 1.5, 10.8, 5.8, 0, 0, Math.PI * 2);
    context.stroke();

    context.restore();
  }

  function drawHairStyle(styleName, hairColor, seconds) {
    const strokeColor = blendHexColor(hairColor, -0.45);
    const baselineY = -75;
    context.fillStyle = hairColor;
    context.strokeStyle = strokeColor;
    context.lineWidth = 2;

    if (styleName === "buzz") {
      context.beginPath();
      context.roundRect(-17, -85, 34, 8, 5);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "parted") {
      context.beginPath();
      context.roundRect(-21, -89, 42, 14, 8);
      context.fill();
      context.stroke();
      context.strokeStyle = blendHexColor(hairColor, -0.65);
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(2, -87);
      context.lineTo(-2, baselineY);
      context.stroke();
      return;
    }

    if (styleName === "pompadour") {
      context.beginPath();
      context.ellipse(0, -89, 22, 11, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-20, -85, 40, 10, 6);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "afro") {
      const puffs = [
        [-14, -87, 9], [-2, -92, 10], [11, -87, 9], [-20, -81, 7], [18, -81, 7]
      ];
      puffs.forEach(([x, y, r]) => {
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      });
      return;
    }

    if (styleName === "mohawk") {
      context.beginPath();
      context.roundRect(-6, -95, 12, 20, 5);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-16, -82, 32, 7, 4);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "spiky") {
      context.beginPath();
      context.moveTo(-20, -75);
      context.lineTo(-17, -90);
      context.lineTo(-10, -80);
      context.lineTo(-4, -95);
      context.lineTo(2, -82);
      context.lineTo(9, -94);
      context.lineTo(15, -80);
      context.lineTo(20, -88);
      context.lineTo(22, -75);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "bob") {
      context.beginPath();
      context.roundRect(-23, -90, 46, 16, 9);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-22, -80, 8, 6, 3);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(14, -80, 8, 6, 3);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "ponytail") {
      context.beginPath();
      context.roundRect(-20, -88, 40, 13, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(16, -81, 7, 8, 4);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(20, -76, 3, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "wavy") {
      context.beginPath();
      context.roundRect(-22, -89, 44, 14, 9);
      context.fill();
      context.stroke();
      const flow = Math.sin(seconds * 3.2) * 1.2;
      context.beginPath();
      context.moveTo(-18, baselineY);
      context.quadraticCurveTo(-10, -72 + flow, -2, baselineY);
      context.quadraticCurveTo(6, -78 + flow, 14, baselineY);
      context.stroke();
      return;
    }

    if (styleName === "braids") {
      context.beginPath();
      context.roundRect(-20, -88, 40, 13, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-20, -81, 6, 8, 4);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(14, -81, 6, 8, 4);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "quiff") {
      context.beginPath();
      context.moveTo(-20, baselineY);
      context.quadraticCurveTo(-10, -96, 8, -92);
      context.quadraticCurveTo(20, -88, 21, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "anime-spikes") {
      context.beginPath();
      context.moveTo(-22, baselineY);
      context.lineTo(-18, -92);
      context.lineTo(-10, -80);
      context.lineTo(-4, -96);
      context.lineTo(3, -81);
      context.lineTo(10, -95);
      context.lineTo(16, -82);
      context.lineTo(22, -90);
      context.lineTo(24, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "twin-tails") {
      context.beginPath();
      context.roundRect(-21, -89, 42, 14, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-25, -80, 7, 7, 3);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(18, -80, 7, 7, 3);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-27, -78, 7, 13, 4);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(20, -78, 7, 13, 4);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hime-cut") {
      context.beginPath();
      context.roundRect(-22, -90, 44, 15, 7);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-24, -87, 8, 13, 4);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(16, -87, 8, 13, 4);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "side-bangs") {
      context.beginPath();
      context.roundRect(-21, -89, 42, 14, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-4, baselineY);
      context.quadraticCurveTo(2, -86, 7, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-15, baselineY);
      context.quadraticCurveTo(-8, -85, -2, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "ahoge") {
      context.beginPath();
      context.roundRect(-20, -88, 40, 13, 8);
      context.fill();
      context.stroke();
      context.strokeStyle = strokeColor;
      context.lineWidth = 2.6;
      context.beginPath();
      context.moveTo(2, -88);
      context.quadraticCurveTo(7, -104, 11, -95);
      context.stroke();
      return;
    }

    if (styleName === "hero-sweep") {
      context.beginPath();
      context.moveTo(-22, baselineY);
      context.quadraticCurveTo(-8, -99, 18, -86);
      context.quadraticCurveTo(24, -82, 22, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-10, baselineY);
      context.quadraticCurveTo(-2, -87, 8, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "neko-fluff") {
      context.beginPath();
      context.roundRect(-20, -89, 40, 14, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-15, -86);
      context.lineTo(-10, -97);
      context.lineTo(-5, -86);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(5, -86);
      context.lineTo(10, -97);
      context.lineTo(15, -86);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "ribbon-bob") {
      context.beginPath();
      context.roundRect(-22, -90, 44, 16, 9);
      context.fill();
      context.stroke();
      context.fillStyle = blendHexColor(hairColor, 0.28);
      context.beginPath();
      context.moveTo(0, -90);
      context.lineTo(-7, -97);
      context.lineTo(-2, -88);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(0, -90);
      context.lineTo(7, -97);
      context.lineTo(2, -88);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = hairColor;
      return;
    }

    if (styleName === "cyber-visor") {
      context.beginPath();
      context.roundRect(-21, -89, 42, 14, 8);
      context.fill();
      context.stroke();
      context.fillStyle = blendHexColor(hairColor, 0.2);
      context.beginPath();
      context.roundRect(-14, -84, 28, 7, 3);
      context.fill();
      context.stroke();
      context.fillStyle = hairColor;
      return;
    }

    if (styleName === "long-flow") {
      context.beginPath();
      context.roundRect(-22, -90, 44, 15, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-20, -80);
      context.quadraticCurveTo(-24, -72, -18, -65);
      context.quadraticCurveTo(-12, -70, -14, -79);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(20, -80);
      context.quadraticCurveTo(24, -72, 18, -65);
      context.quadraticCurveTo(12, -70, 14, -79);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-beanie") {
      context.beginPath();
      context.roundRect(-23, -92, 46, 17, 9);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-24, -80, 48, 6, 3);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-cap") {
      context.beginPath();
      context.roundRect(-21, -90, 42, 15, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(0, -78);
      context.quadraticCurveTo(12, -74, 20, -78);
      context.quadraticCurveTo(11, -81, 0, -80);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-beret") {
      context.beginPath();
      context.ellipse(-2, -84, 24, 11, -0.16, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(7, -93, 3, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-top") {
      context.beginPath();
      context.roundRect(-13, -100, 26, 20, 4);
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(0, -79, 23, 4, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-bucket") {
      context.beginPath();
      context.moveTo(-20, -93);
      context.lineTo(20, -93);
      context.lineTo(16, -76);
      context.lineTo(-16, -76);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(0, -76, 21, 4, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-fedora") {
      context.beginPath();
      context.roundRect(-16, -95, 32, 16, 5);
      context.fill();
      context.stroke();
      context.fillStyle = blendHexColor(hairColor, -0.2);
      context.beginPath();
      context.roundRect(-16, -88, 32, 4, 2);
      context.fill();
      context.stroke();
      context.fillStyle = hairColor;
      context.beginPath();
      context.ellipse(0, -79, 25, 4, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-crown") {
      context.beginPath();
      context.moveTo(-19, -79);
      context.lineTo(-14, -95);
      context.lineTo(-6, -84);
      context.lineTo(0, -98);
      context.lineTo(6, -84);
      context.lineTo(14, -95);
      context.lineTo(19, -79);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-20, -80, 40, 6, 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-helmet") {
      context.beginPath();
      context.ellipse(0, -86, 22, 13, 0, Math.PI, 0);
      context.lineTo(22, -80);
      context.quadraticCurveTo(10, -74, 0, -74);
      context.quadraticCurveTo(-10, -74, -22, -80);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-8, -88, 16, 4, 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-chef") {
      context.beginPath();
      context.roundRect(-12, -84, 24, 10, 3);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(-10, -92, 7, 0, Math.PI * 2);
      context.arc(0, -96, 8, 0, Math.PI * 2);
      context.arc(10, -92, 7, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "hat-wizard") {
      context.beginPath();
      context.moveTo(0, -101);
      context.lineTo(14, -79);
      context.lineTo(-14, -79);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(0, -79, 23, 4, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = blendHexColor(hairColor, 0.3);
      context.beginPath();
      context.arc(6, -92, 1.5, 0, Math.PI * 2);
      context.arc(1, -88, 1.2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = hairColor;
      return;
    }

    // classic
    context.beginPath();
    context.roundRect(-20, -88, 40, 13, 8);
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(-20, -81, 6, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(20, -81, 6, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  function drawFrame(now) {
    updateCanvasSize();

    if (animationDurationMs > 0 && now - animationStartedAt >= animationDurationMs) {
      playAnimation(loopAnimation, { loop: true, transitionMs: 220 });
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width * 0.5;
    const centerY = height * 0.58;

    const seconds = now / 1000;
    const transitionMix = transitionDurationMs > 0
      ? clamp((now - transitionStartedAt) / transitionDurationMs, 0, 1)
      : 1;
    const easedMix = easeOutQuad(transitionMix);

    const fromPose = createPose(seconds, transitionFromAnimation);
    const toPose = createPose(seconds, currentAnimation);
    const pose = transitionDurationMs > 0
      ? interpolatePose(fromPose, toPose, easedMix)
      : toPose;

    if (transitionDurationMs > 0 && transitionMix >= 1) {
      transitionDurationMs = 0;
      transitionFromAnimation = currentAnimation;
    }

    const sleepWeight = getAnimationWeight("sleep", easedMix);
    const talkWeight = getAnimationWeight("talk", easedMix);
    const sandwichWeight = getAnimationWeight("sandwich", easedMix);
    const dampedBounce = pose.bounce * 0.35;
    const wobbleScale = 0.65;
    const bodyProfile = BODY_TYPE_PROFILES[bodyType] || BODY_TYPE_PROFILES.classic;

    context.fillStyle = "#f8f3de";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(69, 130, 186, 0.22)";
    context.lineWidth = 1;
    for (let y = 18; y < height; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(193, 80, 80, 0.42)";
    context.beginPath();
    context.moveTo(26, 0);
    context.lineTo(26, height);
    context.stroke();

    context.strokeStyle = "rgba(59, 48, 41, 0.38)";
    context.lineWidth = 1.1;
    context.beginPath();
    context.ellipse(centerX, centerY + 88, 52, 11, 0, 0, Math.PI * 2);
    context.stroke();

    context.save();
    context.translate(centerX, centerY + dampedBounce);
    context.rotate(pose.lean);
    // Slight skew makes the character feel less flat and more staged.
    context.transform(1, 0, -0.08, 1, 0, 0);

    const plantedCompensation = dampedBounce * 0.85;
    const leftLegEndY = pose.leftLeg.y - plantedCompensation;
    const rightLegEndY = pose.rightLeg.y - plantedCompensation;

    // Draw outline under character fills/strokes so it reads as a back edge.
    drawCharacterShaderOutline(pose, leftLegEndY, rightLegEndY, bodyProfile);

    drawLimb(-14, 18, pose.leftLeg.x, leftLegEndY, 5.5, colors.pantsColor, 4.2 * wobbleScale, seconds * 7 + 0.5);
    drawLimb(14, 18, pose.rightLeg.x, rightLegEndY, 5.5, colors.pantsColor, 4.2 * wobbleScale, seconds * 7 + 2.2);

    context.fillStyle = blendHexColor(colors.shirtColor, 0.25);
    context.strokeStyle = "#372d26";
    context.lineWidth = 1.5;
    const torsoWidth = bodyProfile.torsoWidth;
    const torsoHeight = bodyProfile.torsoHeight;
    const torsoY = -38 + bodyProfile.torsoYOffset;
    const torsoX = -torsoWidth * 0.5;
    context.beginPath();
    context.roundRect(torsoX, torsoY, torsoWidth, torsoHeight, bodyProfile.torsoRadius);
    context.fill();
    context.stroke();

    context.fillStyle = blendHexColor(colors.shirtColor, 0.32);
    const innerWidth = torsoWidth * bodyProfile.insetScaleX;
    const innerHeight = torsoHeight * bodyProfile.insetScaleY;
    context.beginPath();
    context.roundRect(-innerWidth * 0.5, torsoY + 8, innerWidth, innerHeight, Math.max(12, bodyProfile.torsoRadius * 0.65));
    context.fill();

    const headOffsetY = 4;
    context.save();
    context.translate(0, headOffsetY);

    context.fillStyle = blendHexColor(colors.skinColor, 0.2);
    context.strokeStyle = "#382d25";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(0, -66, 24, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    drawHairStyle(hairStyle, colors.hairColor, seconds);

    const openEyesAlpha = 1 - sleepWeight;
    if (openEyesAlpha > 0.01) {
      context.save();
      context.globalAlpha = openEyesAlpha;
      // Bold cartoon eyes.
      context.fillStyle = "#fffdf3";
      context.strokeStyle = "#362d27";
      context.lineWidth = 1.5;
      context.beginPath();
      context.ellipse(-8.8, -68, 5.4, 6.8, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(8.8, -68, 5.4, 6.8, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.arc(-8.6, -67.5, 2.3, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.6, -67.5, 2.3, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(255,255,255,0.6)";
      context.beginPath();
      context.arc(-9.8, -68.8, 0.8, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(7.4, -68.8, 0.8, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    if (sleepWeight > 0.01) {
      context.save();
      context.globalAlpha = sleepWeight;
      context.strokeStyle = "#342a24";
      context.lineWidth = 1.8;
      context.beginPath();
      context.moveTo(-14, -68);
      context.lineTo(-3.5, -68);
      context.moveTo(3.5, -68);
      context.lineTo(14, -68);
      context.stroke();
      context.restore();
    }

    context.strokeStyle = "#3b3029";
    context.lineWidth = 1.8;
    context.lineCap = "round";
    context.beginPath();
    const talkOpen = talkWeight * ((Math.sin(seconds * 18) + 1) * 0.5);
    context.moveTo(-7, -58);
    context.quadraticCurveTo(0, -53 + talkOpen * 3.5, 8, -58);
    context.stroke();

    context.restore();

    context.fillStyle = blendHexColor(colors.shoeColor, 0.06);
    context.strokeStyle = "#2f2622";
    context.lineWidth = 1.2;
    context.beginPath();
    context.ellipse(pose.leftLeg.x - 1, leftLegEndY + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.ellipse(pose.rightLeg.x + 1, rightLegEndY + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (sandwichWeight > 0.01) {
      context.save();
      context.globalAlpha = sandwichWeight;
      drawSandwich(pose.leftArm.x + 7, pose.leftArm.y - 2, -0.22 + Math.sin(seconds * 6) * 0.05);
      context.restore();
    }

    // Arms are rendered last so they always stay in the foreground.
    drawLimb(-18, -28, pose.leftArm.x, pose.leftArm.y, 5, colors.skinColor, 4.6 * wobbleScale, seconds * 9 + 0.8);
    drawLimb(18, -28, pose.rightArm.x, pose.rightArm.y, 5, colors.skinColor, 4.6 * wobbleScale, seconds * 9 + 2.7);

    context.fillStyle = "#f1d6b1";
    context.strokeStyle = "#3b302a";
    context.lineWidth = 1.2;
    context.beginPath();
    context.ellipse(pose.leftArm.x, pose.leftArm.y, 8.25, 6.9, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.ellipse(pose.rightArm.x, pose.rightArm.y, 8.25, 6.9, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.restore();

    if (talkWeight > 0.01) {
      context.save();
      context.globalAlpha = talkWeight;
      drawSpeechBubble(centerX + 24, centerY - 128 + Math.sin(seconds * 5) * 2, Math.sin(seconds * 8));
      context.restore();
    }

    if (sleepWeight > 0.01) {
      context.save();
      context.globalAlpha = sleepWeight;
      context.fillStyle = "rgba(80, 126, 180, 0.86)";
      context.font = "700 22px 'Patrick Hand', 'Comic Sans MS', cursive";
      context.fillText("Z", centerX + 42, centerY - 132);
      context.fillText("Z", centerX + 58, centerY - 152);
      context.restore();
    }

    rafId = window.requestAnimationFrame(drawFrame);
  }

  function playAnimation(name, options = {}) {
    const { durationMs = 0, loop = false, transitionMs = 220 } = options;
    const nextAnimation = name || "idle";

    transitionFromAnimation = currentAnimation;
    currentAnimation = nextAnimation;
    transitionStartedAt = performance.now();
    transitionDurationMs = currentAnimation === transitionFromAnimation
      ? 0
      : Math.max(0, Number(transitionMs) || 0);

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

  function setHairStyle(styleName) {
    const nextStyle = String(styleName || "").toLowerCase();
    if (HAIR_STYLES.includes(nextStyle)) {
      hairStyle = nextStyle;
    }
  }

  function setBodyType(typeName) {
    const nextType = String(typeName || "").toLowerCase();
    if (BODY_TYPES.includes(nextType)) {
      bodyType = nextType;
    }
  }

  function getHairStyles() {
    return [...HAIR_STYLES];
  }

  function getBodyTypes() {
    return [...BODY_TYPES];
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
    setHairStyle,
    setBodyType,
    getHairStyles,
    getBodyTypes,
    playAnimation,
    destroy
  };
}