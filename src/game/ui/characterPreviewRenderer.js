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
  "bob",
  "ponytail",
  "wavy",
  "braids",
  "quiff",
  "twin-tails",
  "hime-cut",
  "side-bangs",
  "ahoge",
  "hero-sweep",
  "neko-fluff",
  "ribbon-bob",
  "long-flow",
  "hat-beret",
  "hat-top",
  "hat-bucket",
  "hat-fedora",
];

const BODY_TYPES = [
  "classic",
  "petite",
  "broad",
  "stocky",
  "tall",
  "lanky"
];

const EYE_STYLES = [
  "classic",
  "sleepy",
  "round",
  
  "sunglasses",
  "eyeglasses",
  "aviators",
];

const PET_TYPES = ["cat", "dog"];

const HAIR_SIZE_SCALE = 1.3;
const DEFAULT_SHADOW_STYLE = {
  offsetX: -49,
  offsetY: -9,
  fillColor: "#6f6f6f",
  strokeColor: "#555555"
};

const PROP_TRANSFORM_DEFAULTS = Object.freeze({
  sandwich: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 },
  phoneTalk: {
      "x": -8,
      "y": 18,
      "z": 47,
      "scale": 0.8,
      "rotation": 31
    },
  busk: {
      "x": -5,
      "y": 8,
      "z": -12,
      "scale": 1.5,
      "rotation": -51
    },
  read: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 },
  shower: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 },
  wash: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 },
  pushups: {
      "x": 0,
      "y": 7,
      "z": 12,
      "scale": 1.05,
      "rotation": -8
    },
  dig: {
      "x": 0,
      "y": 13,
      "z": 0,
      "scale": 1.5,
      "rotation": -98
    },
  search: {
      "x": -16,
      "y": -18,
      "z": 0,
      "scale": 1.45,
      "rotation": 31
    },
  hunt: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 },
  cook: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 },
  buying: { x: 0, y: 0, z: 0, scale: 1, rotation: 0 }
});


const DEG_TO_RAD = Math.PI / 180;
const FACE_FEATURE_FULLY_VISIBLE_ANGLE = 69;
const FACE_FEATURE_FULLY_HIDDEN_ANGLE = 110;
const FACE_FEATURE_ORBIT_RADIUS = 24;

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

function normalizeAngleDegrees(angle) {
  const normalized = Number(angle) % 360;
  return normalized < 0 ? normalized + 360 : normalized;
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

function getCyclePhaseWeight(phase, center, phaseCount) {
  const wrappedDistance = Math.min(
    Math.abs(phase - center),
    phaseCount - Math.abs(phase - center)
  );
  return clamp(1 - wrappedDistance, 0, 1);
}

function easeInOut(t) {
  const clamped = clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function sampleWalkLegProfile(phase) {
  const normalized = ((phase % 1) + 1) % 1;

  let position = -0.9;
  let lift = 0;
  let up = 0;
  let forward = 0;
  let down = 0;
  let planted = 0;
  let back = 0;

  if (normalized < 0.2) {
    // leg up
    const t = easeInOut(normalized / 0.2);
    position = -0.9 + (0.55 - -0.9) * t;
    lift = t;
    up = 1;
  } else if (normalized < 0.45) {
    // leg forward while lifted
    const t = easeInOut((normalized - 0.2) / 0.25);
    position = 0.55 + (1 - 0.55) * t;
    lift = 1;
    forward = 1;
  } else if (normalized < 0.62) {
    // leg down toward contact
    const t = easeInOut((normalized - 0.45) / 0.17);
    position = 1 + (0.72 - 1) * t;
    lift = 1 - t;
    down = 1;
  } else if (normalized < 0.8) {
    // planted support
    const t = easeInOut((normalized - 0.62) / 0.18);
    position = 0.72 + (0.25 - 0.72) * t;
    planted = 1;
  } else {
    // push back while grounded
    const t = easeInOut((normalized - 0.8) / 0.2);
    position = 0.25 + (-0.9 - 0.25) * t;
    planted = 1;
    back = 1;
  }

  return {
    position,
    lift,
    up,
    forward,
    down,
    planted,
    back
  };
}

function createWalkCycleParts(timeSeconds, pace = 1.85) {
  const cycle = ((timeSeconds * pace) % 1 + 1) % 1;
  const cycleRadians = cycle * Math.PI * 2;
  const leftLeg = sampleWalkLegProfile(cycle);
  const rightLeg = sampleWalkLegProfile(cycle + 0.5);
  const leftStep = leftLeg.position;
  const rightStep = rightLeg.position;
  const phase = cycle * 4;

  return {
    cycle,
    cycleRadians,
    leftLeg,
    rightLeg,
    leftStep,
    rightStep,
    leftPlant: leftLeg.planted,
    leftStride: clamp(leftLeg.up + leftLeg.forward + leftLeg.down, 0, 1),
    rightPlant: rightLeg.planted,
    rightStride: clamp(rightLeg.up + rightLeg.forward + rightLeg.down, 0, 1),
    leftPhaseWeight: getCyclePhaseWeight(phase, 0, 4),
    rightPhaseWeight: getCyclePhaseWeight(phase, 2, 4)
  };
}

function normalizePropTransformValue(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizePropTransform(transform, defaults) {
  return {
    x: normalizePropTransformValue(transform?.x, defaults.x),
    y: normalizePropTransformValue(transform?.y, defaults.y),
    z: clamp(normalizePropTransformValue(transform?.z, defaults.z), -180, 180),
    scale: clamp(normalizePropTransformValue(transform?.scale, defaults.scale), 0.1, 8),
    rotation: normalizePropTransformValue(transform?.rotation, defaults.rotation)
  };
}

function withPointDepth(point, fallbackZ = 0) {
  return {
    x: Number(point?.x) || 0,
    y: Number(point?.y) || 0,
    z: Number.isFinite(Number(point?.z)) ? Number(point.z) : fallbackZ
  };
}

function withPoseDepth(pose) {
  return {
    ...pose,
    leftArm: withPointDepth(pose.leftArm),
    rightArm: withPointDepth(pose.rightArm),
    leftLeg: withPointDepth(pose.leftLeg),
    rightLeg: withPointDepth(pose.rightLeg)
  };
}

function parsePropTransformPayload(rawPayload) {
  if (rawPayload && typeof rawPayload === "object") {
    return rawPayload;
  }

  const payloadText = String(rawPayload || "").trim();
  if (!payloadText) {
    return null;
  }

  try {
    return JSON.parse(payloadText);
  } catch {
    const firstBrace = payloadText.indexOf("{");
    const lastBrace = payloadText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    const candidate = payloadText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
}

function createPose(timeSeconds, animationName) {
  const bounce = Math.sin(timeSeconds * 2.1) * 4;
  const shoulderY = -30;

  const pose = {
    bounce,
    lean: Math.sin(timeSeconds * 1.6) * 0.05,
    perspectiveTilt: 0,
    perspectiveTiltMix: 0,
    leftArm: { x: -36 + Math.sin(timeSeconds * 2) * 4, y: shoulderY + 44 },
    rightArm: { x: 36 + Math.sin(timeSeconds * 2 + Math.PI) * 4, y: shoulderY + 44 },
    leftLeg: { x: -18 + Math.sin(timeSeconds * 1.8) * 2, y: 78 },
    rightLeg: { x: 18 + Math.sin(timeSeconds * 1.8 + Math.PI) * 2, y: 78 }
  };

  if (animationName === "idle") {
    pose.bounce = 0;
    pose.lean = 0;
    pose.leftLeg = { x: -18, y: 78 };
    pose.rightLeg = { x: 18, y: 78 };
  }

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

  if (animationName === "busk") {
    const strum = Math.sin(timeSeconds * 10.6);
    const strumDown = Math.max(0, strum);
    const fret = Math.sin(timeSeconds * 3.6);
    pose.lean = -0.1 + strumDown * 0.02;
    pose.bounce = Math.sin(timeSeconds * 4.4) * 1.5 + strumDown * 0.7;
    pose.leftArm = {
      x: -24 + fret * 2.2,
      y: -20 + Math.sin(timeSeconds * 5) * 1.8,
      z: -8
    };
    pose.rightArm = {
      x: 26 + strum * 9,
      y: -18 + Math.abs(strum) * 7,
      z: 12 + strumDown * 8
    };
    pose.leftLeg = { x: -17, y: 79.2 };
    pose.rightLeg = { x: 17, y: 79.6 };
  }

  if (animationName === "read") {
    const pageTurn = (Math.sin(timeSeconds * 2.2) + 1) * 0.5;
    pose.lean = -0.08 + Math.sin(timeSeconds * 1.8) * 0.015;
    pose.bounce = Math.sin(timeSeconds * 2.4) * 0.8 + 1;
    pose.leftArm = { x: -20 + pageTurn * 4, y: -34 + Math.sin(timeSeconds * 3.1) * 1.4 };
    pose.rightArm = { x: 20 - pageTurn * 4, y: -34 + Math.cos(timeSeconds * 3.1) * 1.2 };
    pose.leftLeg = { x: -17, y: 79.5 };
    pose.rightLeg = { x: 17, y: 79.5 };
  }

  if (animationName === "celebrate") {
    pose.leftArm = { x: -46 + Math.sin(timeSeconds * 8) * 3, y: -74 + Math.cos(timeSeconds * 9) * 2.5 };
    pose.rightArm = { x: 46 + Math.sin(timeSeconds * 9) * 3, y: -74 + Math.cos(timeSeconds * 8) * 2.5 };
    pose.leftLeg = { x: -20, y: 78 + Math.sin(timeSeconds * 9) * 2 };
    pose.rightLeg = { x: 20, y: 78 + Math.sin(timeSeconds * 9 + Math.PI) * 2 };
    pose.bounce = Math.abs(Math.sin(timeSeconds * 10)) * -12;
    pose.perspectiveTilt = Math.sin(timeSeconds * 1.25) * 100;
    pose.perspectiveTiltMix = 1;
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

  if (animationName === "walk") {
    // Step order: left plant -> left stride -> right plant -> right stride.
    const walk = createWalkCycleParts(timeSeconds);
    const leftLeg = walk.leftLeg;
    const rightLeg = walk.rightLeg;
    const leftForward = Math.max(0, leftLeg.position);
    const leftBackward = Math.max(0, -leftLeg.position);
    const rightForward = Math.max(0, rightLeg.position);
    const rightBackward = Math.max(0, -rightLeg.position);
    const support = Math.min(1, leftLeg.planted + rightLeg.planted);
    const highStepLift = leftLeg.lift + rightLeg.lift;
    const landingPulse = (leftLeg.down + rightLeg.down) * 0.7;

    pose.lean = 0.055 + (rightForward - leftForward) * 0.05;
    pose.bounce = 1.8 + support * 2.2 + landingPulse - highStepLift * 4.8;
    pose.leftArm = {
      x: -34 - rightLeg.position * 11,
      y: -17 + leftLeg.planted * 1.2,
      z: -24 * rightForward + 18 * rightBackward
    };
    pose.rightArm = {
      x: 34 - leftLeg.position * 11,
      y: -17 + rightLeg.planted * 1.2,
      z: -24 * leftForward + 18 * leftBackward
    };
    pose.leftLeg = {
      x: -18 + leftLeg.position * 20,
      y: 80 - leftLeg.lift * 18 + leftLeg.down * 3 + leftLeg.planted * 2,
      z: 52 * leftForward - 24 * leftBackward
    };
    pose.rightLeg = {
      x: 18 + rightLeg.position * 20,
      y: 80 - rightLeg.lift * 18 + rightLeg.down * 3 + rightLeg.planted * 2,
      z: 52 * rightForward - 24 * rightBackward
    };
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

  if (animationName === "phoneTalk") {
    const callRhythm = Math.sin(timeSeconds * 6.8);
    pose.lean = -0.05 + Math.sin(timeSeconds * 1.9) * 0.01;
    pose.bounce = Math.sin(timeSeconds * 4.1) * 1.3;
    pose.leftArm = {
      x: -34 + Math.sin(timeSeconds * 5.1) * 4.5,
      y: -16 + Math.cos(timeSeconds * 5.1) * 2.1,
      z: -4
    };
    pose.rightArm = {
      x: 26 + callRhythm * 1.8,
      y: -58 + Math.cos(timeSeconds * 6.8) * 1.6,
      z: 28
    };
    pose.leftLeg = { x: -18, y: 79.2 };
    pose.rightLeg = { x: 18, y: 79.4 };
  }

  if (animationName === "jump") {
    const lift = Math.max(0, Math.sin(timeSeconds * 7.2));
    pose.bounce = -18 * lift;
    pose.lean = Math.sin(timeSeconds * 5.4) * 0.03;
    pose.leftArm = { x: -34 - lift * 7, y: -56 - lift * 14 };
    pose.rightArm = { x: 34 + lift * 7, y: -56 - lift * 14 };
    pose.leftLeg = { x: -16 + Math.sin(timeSeconds * 7.2) * 3, y: 78 - lift * 12 };
    pose.rightLeg = { x: 16 + Math.sin(timeSeconds * 7.2 + Math.PI) * 3, y: 78 - lift * 12 };
  }

  if (animationName === "dance") {
    const groove = Math.sin(timeSeconds * 7.6);
    const sway = Math.cos(timeSeconds * 3.8);
    pose.bounce = Math.sin(timeSeconds * 7.6) * 4;
    pose.lean = groove * 0.15;
    pose.leftArm = { x: -42 + groove * 8, y: -34 + sway * 8 };
    pose.rightArm = { x: 42 - groove * 8, y: -34 - sway * 8 };
    pose.leftLeg = { x: -24 + groove * 9, y: 78 + Math.abs(sway) * 2.5 };
    pose.rightLeg = { x: 24 - groove * 9, y: 78 + Math.abs(groove) * 2.5 };
  }

  if (animationName === "sneak") {
    const step = Math.sin(timeSeconds * 4.9);
    pose.lean = -0.22 + Math.sin(timeSeconds * 2.4) * 0.03;
    pose.bounce = 9 + Math.abs(step) * 1.7;
    pose.leftArm = { x: -28 + step * 4, y: -6 + Math.cos(timeSeconds * 4.9) * 2 };
    pose.rightArm = { x: 24 - step * 4, y: -2 + Math.sin(timeSeconds * 4.9) * 2 };
    pose.leftLeg = { x: -20 - step * 7, y: 84 + Math.abs(step) * 2 };
    pose.rightLeg = { x: 20 + step * 7, y: 84 + Math.abs(step) * 2 };
  }

  if (animationName === "stretch") {
    const reach = (Math.sin(timeSeconds * 2.8) + 1) * 0.5;
    pose.lean = Math.sin(timeSeconds * 2.8) * 0.06;
    pose.bounce = -2 - reach * 3;
    pose.leftArm = { x: -26 - reach * 12, y: -64 - reach * 16 };
    pose.rightArm = { x: 26 + reach * 12, y: -64 - reach * 16 };
    pose.leftLeg = { x: -17, y: 79 + Math.sin(timeSeconds * 2.8 + 1) * 1.2 };
    pose.rightLeg = { x: 17, y: 79 + Math.sin(timeSeconds * 2.8 + 2.4) * 1.2 };
  }

  if (animationName === "punch") {
    const jab = Math.max(0, Math.sin(timeSeconds * 11.2));
    pose.lean = 0.15 * jab;
    pose.bounce = Math.sin(timeSeconds * 11.2) * 1.8;
    pose.leftArm = { x: -36 + Math.sin(timeSeconds * 5.6) * 2, y: -12, z: -8 * jab };
    pose.rightArm = { x: 34 + Math.sin(timeSeconds * 5.6) * 1.7, y: -22 + jab * 2, z: 36 * jab };
    pose.leftLeg = { x: -20 - jab * 4, y: 78 + jab * 2.2 };
    pose.rightLeg = { x: 20 + jab * 4, y: 78 + jab * 1.4 };
  }

  if (animationName === "pushups") {
    const leftCurl = (Math.sin(timeSeconds * 3.2) + 1) * 0.5;
    const rightCurl = (Math.sin(timeSeconds * 3.2 + Math.PI) + 1) * 0.5;
    const curlSwing = Math.sin(timeSeconds * 6.4);
    pose.lean = 0.04 + Math.sin(timeSeconds * 1.8) * 0.02;
    pose.bounce = 1.2 + Math.sin(timeSeconds * 6.4) * 1.3;
    pose.leftArm = {
      x: -32 + leftCurl * 11,
      y: -20 - leftCurl * 32,
      z: 14 * leftCurl - 8 * rightCurl
    };
    pose.rightArm = {
      x: 32 - rightCurl * 11,
      y: -20 - rightCurl * 32,
      z: 14 * rightCurl - 8 * leftCurl
    };
    pose.leftLeg = { x: -18 + curlSwing * 1.2, y: 79 + Math.abs(curlSwing) * 1.8 };
    pose.rightLeg = { x: 18 - curlSwing * 1.2, y: 79 + Math.abs(curlSwing) * 1.8 };
  }

  if (animationName === "shower") {
    const rinse = Math.sin(timeSeconds * 3.4);
    pose.lean = 0.03;
    pose.bounce = Math.sin(timeSeconds * 2.2) * 1.6;
    pose.leftArm = { x: -18 + rinse * 4, y: -70 + Math.cos(timeSeconds * 4.4) * 5 };
    pose.rightArm = { x: 18 - rinse * 4, y: -58 + Math.sin(timeSeconds * 4.1) * 4 };
    pose.leftLeg = { x: -17, y: 79 + Math.abs(rinse) * 1.2 };
    pose.rightLeg = { x: 17, y: 79 + Math.abs(rinse) * 1.2 };
  }

  if (animationName === "wash") {
    const scrub = Math.sin(timeSeconds * 8.6);
    pose.lean = -0.07;
    pose.bounce = Math.sin(timeSeconds * 6.2) * 1.8;
    pose.leftArm = { x: -20 + scrub * 6, y: -36 + Math.cos(timeSeconds * 8.6) * 3 };
    pose.rightArm = { x: 24 - scrub * 5, y: -34 + Math.sin(timeSeconds * 8.6) * 3 };
    pose.leftLeg = { x: -18, y: 79.5 };
    pose.rightLeg = { x: 18, y: 79.5 };
  }

  if (animationName === "dig") {
    const scoop = Math.sin(timeSeconds * 5.4);
    pose.lean = 0.2 + Math.max(0, scoop) * 0.08;
    pose.bounce = 3 + Math.abs(scoop) * 2.8;
    pose.leftArm = { x: -32 + scoop * 10, y: -18 + Math.abs(scoop) * 8 };
    pose.rightArm = { x: 40 + scoop * 12, y: -14 + Math.abs(scoop) * 9 };
    pose.leftLeg = { x: -22 - scoop * 5, y: 82 + Math.abs(scoop) * 2 };
    pose.rightLeg = { x: 16 + scoop * 3, y: 80 + Math.abs(scoop) * 1.4 };
  }

  if (animationName === "search") {
    const scan = Math.sin(timeSeconds * 2.8);
    pose.lean = -0.1 + scan * 0.06;
    pose.bounce = Math.sin(timeSeconds * 3) * 1.3;
    pose.leftArm = { x: -34 + scan * 8, y: -18 + Math.cos(timeSeconds * 2.8) * 2 };
    pose.rightArm = { x: 38 + scan * 7, y: -36 + Math.sin(timeSeconds * 2.8) * 4 };
    pose.leftLeg = { x: -19 + scan * 2, y: 79 + Math.abs(scan) * 1.2 };
    pose.rightLeg = { x: 19 - scan * 2, y: 79 + Math.abs(scan) * 1.2 };
  }

  if (animationName === "hunt") {
    const stalk = Math.sin(timeSeconds * 4.8);
    pose.lean = 0.12;
    pose.bounce = 2 + Math.abs(stalk) * 2.2;
    pose.leftArm = { x: -40 + stalk * 7, y: -24 + Math.cos(timeSeconds * 4.8) * 3 };
    pose.rightArm = { x: 30 - stalk * 6, y: -20 + Math.sin(timeSeconds * 4.8) * 2 };
    pose.leftLeg = { x: -21 - stalk * 8, y: 83 + Math.abs(stalk) * 2.2 };
    pose.rightLeg = { x: 19 + stalk * 8, y: 83 + Math.abs(stalk) * 2.2 };
  }

  if (animationName === "cook") {
    const chopCycle = (timeSeconds * 1.7) % 1;
    const impact = chopCycle >= 0.62 && chopCycle < 0.8
      ? Math.sin(((chopCycle - 0.62) / 0.18) * Math.PI)
      : 0;
    const blend = (a, b, t) => a + (b - a) * t;

    let rightArmX = 26;
    let rightArmY = -34;
    if (chopCycle < 0.24) {
      const t = chopCycle / 0.24;
      rightArmX = blend(28, 22, t);
      rightArmY = blend(-28, -32, t);
    } else if (chopCycle < 0.62) {
      const t = (chopCycle - 0.24) / 0.38;
      rightArmX = blend(22, 44, t);
      rightArmY = blend(-32, -88, t);
    } else if (chopCycle < 0.8) {
      const t = (chopCycle - 0.62) / 0.18;
      const slammedT = t * t;
      rightArmX = blend(44, 18, slammedT);
      rightArmY = blend(-88, -24, slammedT);
    } else {
      const t = (chopCycle - 0.8) / 0.2;
      rightArmX = blend(18, 26, t);
      rightArmY = blend(-24, -34, t);
    }

    pose.lean = 0.02 + (rightArmY < -50 ? 0.1 : 0) - impact * 0.16;
    pose.bounce = Math.sin(timeSeconds * 3.8) * 0.6 - impact * 2.6;
    pose.leftArm = { x: -18 + impact * 1.4, y: -26 + impact * 2.2 };
    pose.rightArm = { x: rightArmX, y: rightArmY };
    pose.leftLeg = { x: -18, y: 79.5 + impact * 0.7 };
    pose.rightLeg = { x: 18, y: 79.5 + impact * 0.7 };
  }

  if (animationName === "buying") {
    const countMoney = Math.sin(timeSeconds * 7.8);
    const flutter = Math.cos(timeSeconds * 9.4);
    pose.lean = -0.05 + Math.sin(timeSeconds * 2.4) * 0.02;
    pose.bounce = Math.sin(timeSeconds * 4.6) * 1.5;
    pose.leftArm = { x: -16 + countMoney * 3.2, y: -32 + flutter * 2.2, z: 10 };
    pose.rightArm = { x: 22 + countMoney * 4.2, y: -30 - flutter * 2.6, z: 22 };
    pose.leftLeg = { x: -18, y: 79.5 + Math.abs(countMoney) * 0.8 };
    pose.rightLeg = { x: 18, y: 79.5 + Math.abs(countMoney) * 0.8 };
  }

  return withPoseDepth(pose);
}

function createPetPose(timeSeconds, animationName) {
  const pace = Math.sin(timeSeconds * 4.3);
  const pose = {
    bounce: Math.sin(timeSeconds * 2.2) * 1.5,
    lean: Math.sin(timeSeconds * 1.8) * 0.03,
    headTilt: Math.sin(timeSeconds * 2.6) * 0.06,
    tailSwing: Math.sin(timeSeconds * 7.2) * 0.5,
    leftPawLift: (pace + 1) * 0.5,
    rightPawLift: (Math.sin(timeSeconds * 4.3 + Math.PI) + 1) * 0.5,
    earPerk: 0.4
  };

  if (animationName === "run") {
    const sprint = Math.sin(timeSeconds * 11.5);
    pose.bounce = Math.sin(timeSeconds * 9.5) * 2.6;
    pose.lean = 0.14;
    pose.headTilt = sprint * 0.04;
    pose.tailSwing = Math.sin(timeSeconds * 18) * 0.95;
    pose.leftPawLift = (sprint + 1) * 0.5;
    pose.rightPawLift = (Math.sin(timeSeconds * 11.5 + Math.PI) + 1) * 0.5;
    pose.earPerk = 0.9;
  }

  if (animationName === "walk") {
    const walk = createWalkCycleParts(timeSeconds, 2.05);
    pose.bounce = 0.9 + (walk.leftPlant + walk.rightPlant) * 0.8;
    pose.lean = 0.04 + (walk.rightStride - walk.leftStride) * 0.03;
    pose.headTilt = 0.04 * walk.leftStep;
    pose.tailSwing = Math.sin(walk.cycleRadians * 1.5) * 0.45;
    pose.leftPawLift = 0.2 + walk.leftStride * 0.62;
    pose.rightPawLift = 0.2 + walk.rightStride * 0.62;
    pose.earPerk = 0.74;
  }

  if (animationName === "sleep") {
    const breathing = Math.sin(timeSeconds * 1.6);
    pose.bounce = breathing * 0.8 + 2;
    pose.lean = -0.1;
    pose.headTilt = -0.18;
    pose.tailSwing = Math.sin(timeSeconds * 1.1) * 0.1;
    pose.leftPawLift = 0.12;
    pose.rightPawLift = 0.12;
    pose.earPerk = 0.08;
  }

  if (animationName === "celebrate" || animationName === "wave") {
    pose.bounce = Math.abs(Math.sin(timeSeconds * 7.5)) * 3.2;
    pose.tailSwing = Math.sin(timeSeconds * 16) * 0.9;
    pose.headTilt = Math.sin(timeSeconds * 7.5) * 0.14;
    pose.leftPawLift = 0.8;
    pose.rightPawLift = 0.8;
    pose.earPerk = 1;
  }

  if (
    animationName === "working"
    || animationName === "sandwich"
    || animationName === "busk"
    || animationName === "read"
    || animationName === "phoneTalk"
    || animationName === "buying"
  ) {
    pose.bounce = Math.sin(timeSeconds * 6.3) * 1.7;
    pose.lean = Math.sin(timeSeconds * 4.8) * 0.08;
    pose.tailSwing = Math.sin(timeSeconds * 12) * 0.7;
    pose.leftPawLift = (Math.sin(timeSeconds * 8.5) + 1) * 0.5;
    pose.rightPawLift = (Math.sin(timeSeconds * 8.5 + Math.PI) + 1) * 0.5;
    pose.earPerk = 0.7;
  }

  if (animationName === "jump") {
    const hop = Math.max(0, Math.sin(timeSeconds * 7.2));
    pose.bounce = -4.5 * hop;
    pose.lean = Math.sin(timeSeconds * 5.2) * 0.04;
    pose.headTilt = Math.sin(timeSeconds * 7.2) * 0.1;
    pose.tailSwing = Math.sin(timeSeconds * 12.6) * 0.75;
    pose.leftPawLift = 0.65 + hop * 0.25;
    pose.rightPawLift = 0.65 + hop * 0.25;
    pose.earPerk = 0.95;
  }

  if (animationName === "dance") {
    pose.bounce = Math.sin(timeSeconds * 8) * 2.6;
    pose.lean = Math.sin(timeSeconds * 4) * 0.12;
    pose.headTilt = Math.sin(timeSeconds * 8) * 0.2;
    pose.tailSwing = Math.sin(timeSeconds * 16) * 1;
    pose.leftPawLift = (Math.sin(timeSeconds * 8 + 0.4) + 1) * 0.5;
    pose.rightPawLift = (Math.sin(timeSeconds * 8 + Math.PI + 0.4) + 1) * 0.5;
    pose.earPerk = 0.88;
  }

  if (animationName === "sneak") {
    const creep = Math.sin(timeSeconds * 4.9);
    pose.bounce = 2.8 + Math.abs(creep) * 0.8;
    pose.lean = -0.16;
    pose.headTilt = -0.08 + Math.sin(timeSeconds * 2.45) * 0.03;
    pose.tailSwing = Math.sin(timeSeconds * 6.6) * 0.3;
    pose.leftPawLift = 0.25 + Math.max(0, creep) * 0.35;
    pose.rightPawLift = 0.25 + Math.max(0, -creep) * 0.35;
    pose.earPerk = 0.5;
  }

  if (animationName === "stretch") {
    const stretch = (Math.sin(timeSeconds * 2.8) + 1) * 0.5;
    pose.bounce = -1.4 - stretch * 1.8;
    pose.lean = Math.sin(timeSeconds * 2.8) * 0.05;
    pose.headTilt = -0.14 + stretch * 0.06;
    pose.tailSwing = Math.sin(timeSeconds * 4.8) * 0.2;
    pose.leftPawLift = 0.12;
    pose.rightPawLift = 0.82;
    pose.earPerk = 0.32;
  }

  if (animationName === "punch") {
    const jab = Math.max(0, Math.sin(timeSeconds * 11.2));
    pose.bounce = Math.sin(timeSeconds * 9.4) * 1.4;
    pose.lean = 0.1 * jab;
    pose.headTilt = 0.06 * jab;
    pose.tailSwing = Math.sin(timeSeconds * 14.4) * 0.6;
    pose.leftPawLift = 0.25;
    pose.rightPawLift = 0.3 + jab * 0.65;
    pose.earPerk = 0.92;
  }

  if (animationName === "pushups") {
    const rep = (Math.sin(timeSeconds * 6.8) + 1) * 0.5;
    pose.bounce = 1.8 + rep * 2;
    pose.lean = 0.15;
    pose.headTilt = 0.05;
    pose.tailSwing = Math.sin(timeSeconds * 8.8) * 0.3;
    pose.leftPawLift = 0.25 + rep * 0.35;
    pose.rightPawLift = 0.25 + rep * 0.35;
    pose.earPerk = 0.72;
  }

  if (animationName === "shower") {
    const rinse = Math.sin(timeSeconds * 3.4);
    pose.bounce = Math.sin(timeSeconds * 2.2) * 1;
    pose.lean = 0.03;
    pose.headTilt = Math.sin(timeSeconds * 3.4) * 0.08;
    pose.tailSwing = Math.sin(timeSeconds * 5.5) * 0.2;
    pose.leftPawLift = 0.4 + Math.max(0, rinse) * 0.2;
    pose.rightPawLift = 0.35 + Math.max(0, -rinse) * 0.2;
    pose.earPerk = 0.42;
  }

  if (animationName === "wash") {
    const scrub = Math.sin(timeSeconds * 8.6);
    pose.bounce = Math.sin(timeSeconds * 5.6) * 1.2;
    pose.lean = -0.05;
    pose.headTilt = -0.06 + Math.sin(timeSeconds * 8.6) * 0.04;
    pose.tailSwing = Math.sin(timeSeconds * 10.8) * 0.4;
    pose.leftPawLift = 0.3 + Math.max(0, scrub) * 0.35;
    pose.rightPawLift = 0.3 + Math.max(0, -scrub) * 0.35;
    pose.earPerk = 0.56;
  }

  if (animationName === "dig") {
    const scoop = Math.sin(timeSeconds * 5.4);
    pose.bounce = 1.4 + Math.abs(scoop) * 1.6;
    pose.lean = 0.12;
    pose.headTilt = 0.05;
    pose.tailSwing = Math.sin(timeSeconds * 13) * 0.85;
    pose.leftPawLift = 0.3 + Math.max(0, scoop) * 0.5;
    pose.rightPawLift = 0.2 + Math.max(0, -scoop) * 0.5;
    pose.earPerk = 0.84;
  }

  if (animationName === "search") {
    const scan = Math.sin(timeSeconds * 2.8);
    pose.bounce = Math.sin(timeSeconds * 3) * 1;
    pose.lean = -0.06 + scan * 0.04;
    pose.headTilt = scan * 0.13;
    pose.tailSwing = Math.sin(timeSeconds * 6.2) * 0.35;
    pose.leftPawLift = 0.28;
    pose.rightPawLift = 0.55;
    pose.earPerk = 0.88;
  }

  if (animationName === "hunt") {
    const stalk = Math.sin(timeSeconds * 4.8);
    pose.bounce = 1.2 + Math.abs(stalk) * 1.4;
    pose.lean = 0.14;
    pose.headTilt = -0.03 + stalk * 0.05;
    pose.tailSwing = Math.sin(timeSeconds * 11.2) * 0.65;
    pose.leftPawLift = 0.2 + Math.max(0, stalk) * 0.4;
    pose.rightPawLift = 0.2 + Math.max(0, -stalk) * 0.4;
    pose.earPerk = 0.96;
  }

  if (animationName === "cook") {
    const stir = Math.sin(timeSeconds * 7.4);
    pose.bounce = Math.sin(timeSeconds * 5.2) * 1.2;
    pose.lean = -0.02;
    pose.headTilt = Math.sin(timeSeconds * 7.4) * 0.06;
    pose.tailSwing = Math.sin(timeSeconds * 9.4) * 0.45;
    pose.leftPawLift = 0.35 + Math.max(0, stir) * 0.28;
    pose.rightPawLift = 0.35 + Math.max(0, -stir) * 0.28;
    pose.earPerk = 0.66;
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

  let suppressDecorativeStrokes = true;
  const drawRawStroke = context.stroke.bind(context);
  context.stroke = (...args) => {
    if (!suppressDecorativeStrokes) {
      drawRawStroke(...args);
    }
  };

  function drawRoundedClipPath(x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }

  let colors = { ...DEFAULT_COLORS };
  let hairStyle = "classic";
  let bodyType = "classic";
  let eyeStyle = "classic";
  let petType = "cat";
  let petVisible = true;
  let holderVisible = true;
  let perspectiveAngle = 0;
  let shadowStyle = { ...DEFAULT_SHADOW_STYLE };
  let propTransforms = Object.fromEntries(
    Object.entries(PROP_TRANSFORM_DEFAULTS).map(([animationName, defaults]) => [
      animationName,
      { ...defaults }
    ])
  );
  let currentAnimation = "idle";
  let transitionFromAnimation = "idle";
  let transitionStartedAt = performance.now();
  let transitionDurationMs = 0;
  let loopAnimation = "idle";
  let animationStartedAt = performance.now();
  let animationDurationMs = 0;
  let rafId = null;
  let legBendDirectionValue = -0.8;
  let paperTextureCanvas = null;
  let paperTextureWidth = 0;
  let paperTextureHeight = 0;
  let effectMaskCanvas = null;
  let effectMaskWidth = 0;
  let effectMaskHeight = 0;
  let printEffectsEnabled = true;
  let animationEnabled = true;
  let lastRenderTimestamp = 0;
  let currentCanvasScale = 1;

  const lowPowerMediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
  let lowPowerMode = lowPowerMediaQuery.matches;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function interpolatePose(fromPose, toPose, mix) {
    const resolvedFrom = withPoseDepth(fromPose);
    const resolvedTo = withPoseDepth(toPose);
    return {
      bounce: lerp(resolvedFrom.bounce, resolvedTo.bounce, mix),
      lean: lerp(resolvedFrom.lean, resolvedTo.lean, mix),
      perspectiveTilt: lerp(resolvedFrom.perspectiveTilt || 0, resolvedTo.perspectiveTilt || 0, mix),
      perspectiveTiltMix: lerp(resolvedFrom.perspectiveTiltMix || 0, resolvedTo.perspectiveTiltMix || 0, mix),
      leftArm: {
        x: lerp(resolvedFrom.leftArm.x, resolvedTo.leftArm.x, mix),
        y: lerp(resolvedFrom.leftArm.y, resolvedTo.leftArm.y, mix),
        z: lerp(resolvedFrom.leftArm.z, resolvedTo.leftArm.z, mix)
      },
      rightArm: {
        x: lerp(resolvedFrom.rightArm.x, resolvedTo.rightArm.x, mix),
        y: lerp(resolvedFrom.rightArm.y, resolvedTo.rightArm.y, mix),
        z: lerp(resolvedFrom.rightArm.z, resolvedTo.rightArm.z, mix)
      },
      leftLeg: {
        x: lerp(resolvedFrom.leftLeg.x, resolvedTo.leftLeg.x, mix),
        y: lerp(resolvedFrom.leftLeg.y, resolvedTo.leftLeg.y, mix),
        z: lerp(resolvedFrom.leftLeg.z, resolvedTo.leftLeg.z, mix)
      },
      rightLeg: {
        x: lerp(resolvedFrom.rightLeg.x, resolvedTo.rightLeg.x, mix),
        y: lerp(resolvedFrom.rightLeg.y, resolvedTo.rightLeg.y, mix),
        z: lerp(resolvedFrom.rightLeg.z, resolvedTo.rightLeg.z, mix)
      }
    };
  }

  function interpolatePetPose(fromPose, toPose, mix) {
    return {
      bounce: lerp(fromPose.bounce, toPose.bounce, mix),
      lean: lerp(fromPose.lean, toPose.lean, mix),
      headTilt: lerp(fromPose.headTilt, toPose.headTilt, mix),
      tailSwing: lerp(fromPose.tailSwing, toPose.tailSwing, mix),
      leftPawLift: lerp(fromPose.leftPawLift, toPose.leftPawLift, mix),
      rightPawLift: lerp(fromPose.rightPawLift, toPose.rightPawLift, mix),
      earPerk: lerp(fromPose.earPerk, toPose.earPerk, mix)
    };
  }

  function getResolvedPropTransform(animationName) {
    const defaults = PROP_TRANSFORM_DEFAULTS[animationName] || { x: 0, y: 0, z: 0, scale: 1, rotation: 0 };
    const current = propTransforms[animationName] || defaults;
    return normalizePropTransform(current, defaults);
  }

  function getPropPlacement(animationName, baseX, baseY, baseRotationRadians = 0, options = {}) {
    const perspectiveBlend = Number(options.perspectiveBlend) || 0;
    const depthVisibility = clamp(Number(options.depthVisibility) || 0, 0, 1);
    const baseZ = Number(options.baseZ) || 0;
    const transform = getResolvedPropTransform(animationName);
    const combinedZ = baseZ + transform.z;
    const projectedX = baseX + transform.x + combinedZ * perspectiveBlend * 0.42;
    const projectedY = baseY + transform.y - combinedZ * depthVisibility * 0.24;
    const projectedScale = clamp(transform.scale * (1 + combinedZ * depthVisibility * 0.0035), 0.1, 8);
    return {
      x: projectedX,
      y: projectedY,
      z: combinedZ,
      scale: projectedScale,
      rotation: baseRotationRadians + transform.rotation * DEG_TO_RAD
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

  function ensurePaperTexture(width, height) {
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    if (
      paperTextureCanvas &&
      paperTextureWidth === safeWidth &&
      paperTextureHeight === safeHeight
    ) {
      return;
    }

    paperTextureCanvas = document.createElement("canvas");
    paperTextureCanvas.width = safeWidth;
    paperTextureCanvas.height = safeHeight;
    paperTextureWidth = safeWidth;
    paperTextureHeight = safeHeight;

    const textureContext = paperTextureCanvas.getContext("2d");
    if (!textureContext) {
      paperTextureCanvas = null;
      return;
    }

    const imageData = textureContext.createImageData(safeWidth, safeHeight);
    const data = imageData.data;
    for (let y = 0; y < safeHeight; y += 1) {
      for (let x = 0; x < safeWidth; x += 1) {
        const index = (y * safeWidth + x) * 4;
        const grain = (Math.random() - 0.5) * 52;
        const fiberWave = Math.sin(x * 0.13 + y * 0.055) * 8 + Math.cos(y * 0.19 - x * 0.04) * 4.6;
        const tone = 226 + grain + fiberWave;
        data[index] = clamp(Math.round(tone + 12), 158, 255);
        data[index + 1] = clamp(Math.round(tone + 4), 148, 252);
        data[index + 2] = clamp(Math.round(tone - 16), 132, 246);
        data[index + 3] = 255;
      }
    }
    textureContext.putImageData(imageData, 0, 0);

    const fiberCount = Math.max(130, Math.floor((safeWidth * safeHeight) / 920));
    textureContext.lineCap = "round";
    for (let i = 0; i < fiberCount; i += 1) {
      const startX = Math.random() * safeWidth;
      const startY = Math.random() * safeHeight;
      const length = 8 + Math.random() * 28;
      const angle = (Math.random() - 0.5) * Math.PI * 0.45;
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      textureContext.strokeStyle = `rgba(116, 88, 58, ${0.055 + Math.random() * 0.1})`;
      textureContext.lineWidth = 0.8 + Math.random() * 1.2;
      textureContext.beginPath();
      textureContext.moveTo(startX, startY);
      textureContext.lineTo(endX, endY);
      textureContext.stroke();
    }

    const crossHatchCount = Math.max(90, Math.floor((safeWidth * safeHeight) / 1350));
    for (let i = 0; i < crossHatchCount; i += 1) {
      const startX = Math.random() * safeWidth;
      const startY = Math.random() * safeHeight;
      const length = 5 + Math.random() * 18;
      const diagonal = (Math.random() < 0.5 ? -1 : 1) * (0.78 + Math.random() * 0.34);
      const endX = startX + length;
      const endY = startY + length * diagonal;
      textureContext.strokeStyle = `rgba(83, 62, 38, ${0.045 + Math.random() * 0.09})`;
      textureContext.lineWidth = 0.45 + Math.random() * 0.8;
      textureContext.beginPath();
      textureContext.moveTo(startX, startY);
      textureContext.lineTo(endX, endY);
      textureContext.stroke();
    }

    const blotchCount = Math.max(12, Math.floor((safeWidth * safeHeight) / 17000));
    for (let i = 0; i < blotchCount; i += 1) {
      const radius = 30 + Math.random() * 90;
      const centerX = Math.random() * safeWidth;
      const centerY = Math.random() * safeHeight;
      const blotchGradient = textureContext.createRadialGradient(
        centerX,
        centerY,
        radius * 0.12,
        centerX,
        centerY,
        radius
      );
      blotchGradient.addColorStop(0, "rgba(152, 121, 79, 0.14)");
      blotchGradient.addColorStop(1, "rgba(164, 138, 99, 0)");
      textureContext.fillStyle = blotchGradient;
      textureContext.beginPath();
      textureContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
      textureContext.fill();
    }

    // Sparse dot matrix gives a printed-ink vibe once blended over the character.
    const dotSpacing = 5;
    for (let y = 0; y < safeHeight; y += dotSpacing) {
      for (let x = 0; x < safeWidth; x += dotSpacing) {
        const jitterX = (Math.random() - 0.5) * 1.6;
        const jitterY = (Math.random() - 0.5) * 1.6;
        const radius = 0.28 + Math.random() * 0.7;
        const alpha = 0.03 + Math.random() * 0.09;
        textureContext.fillStyle = `rgba(71, 54, 34, ${alpha})`;
        textureContext.beginPath();
        textureContext.arc(x + jitterX, y + jitterY, radius, 0, Math.PI * 2);
        textureContext.fill();
      }
    }
  }

  function ensureEffectMaskSurface(width, height) {
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    if (
      effectMaskCanvas &&
      effectMaskWidth === safeWidth &&
      effectMaskHeight === safeHeight
    ) {
      return;
    }

    effectMaskCanvas = document.createElement("canvas");
    effectMaskCanvas.width = safeWidth;
    effectMaskCanvas.height = safeHeight;
    effectMaskWidth = safeWidth;
    effectMaskHeight = safeHeight;
  }

  function drawPaperTextureOverlay(width, height) {
    ensurePaperTexture(width, height);
    ensureEffectMaskSurface(width, height);
    if (!paperTextureCanvas || !effectMaskCanvas) {
      return;
    }

    const effectMaskContext = effectMaskCanvas.getContext("2d");
    if (!effectMaskContext) {
      return;
    }

    effectMaskContext.setTransform(1, 0, 0, 1, 0, 0);
    effectMaskContext.clearRect(0, 0, width, height);
    effectMaskContext.drawImage(canvas, 0, 0, width, height);

    context.save();
    context.globalCompositeOperation = "multiply";
    context.globalAlpha = 0.16;
    context.drawImage(paperTextureCanvas, 0, 0, width, height);

    context.globalCompositeOperation = "overlay";
    context.globalAlpha = 0.06;
    context.drawImage(paperTextureCanvas, 0, 0, width, height);

    context.globalCompositeOperation = "color-burn";
    context.globalAlpha = 0.025;
    context.drawImage(paperTextureCanvas, 0, 0, width, height);

    context.globalCompositeOperation = "soft-light";
    context.globalAlpha = 0.014;
    context.fillStyle = "rgba(246, 240, 226, 1)";
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = "multiply";
    context.globalAlpha = 0.05;
    context.fillStyle = "rgba(168, 146, 112, 0.9)";
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 0.08;
    const vignette = context.createRadialGradient(
      width * 0.5,
      height * 0.42,
      Math.min(width, height) * 0.18,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.76
    );
    vignette.addColorStop(0, "rgba(251, 247, 236, 0)");
    vignette.addColorStop(1, "rgba(88, 72, 54, 0.18)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);

    // Keep texture effects only where sprites were drawn, preserving transparent background.
    context.globalCompositeOperation = "destination-in";
    context.globalAlpha = 1;
    context.drawImage(effectMaskCanvas, 0, 0, width, height);
    context.restore();
  }

  function applyPosterizedPrintPass(width, height) {
    if (width < 1 || height < 1) {
      return;
    }

    const imageData = context.getImageData(0, 0, width, height);
    const source = imageData.data;
    const bayer4x4 = [
      0, 8, 2, 10,
      12, 4, 14, 6,
      3, 11, 1, 9,
      15, 7, 13, 5
    ];
    const toneLevels = 5;
    const toneStep = 255 / (toneLevels - 1);

    for (let y = 0; y < height; y += 1) {
      const yOffset = y * width;
      for (let x = 0; x < width; x += 1) {
        const index = (yOffset + x) * 4;
        const alpha = source[index + 3];
        if (alpha < 2) {
          continue;
        }

        const red = source[index];
        const green = source[index + 1];
        const blue = source[index + 2];
        const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
        const matrixValue = bayer4x4[(y & 3) * 4 + (x & 3)];
        const ditherOffset = (matrixValue - 7.5) * 2.7;
        const paperGrain = sketchNoise(x * 0.17 + y * 0.11, 8.5);
        const quantized = clamp(
          Math.round((luminance + ditherOffset + paperGrain) / toneStep) * toneStep,
          0,
          255
        );

        const sepiaRed = clamp(quantized * 1.02 + 8, 0, 255);
        const sepiaGreen = clamp(quantized * 0.97 + 4, 0, 255);
        const sepiaBlue = clamp(quantized * 0.9 + 1, 0, 255);
        const inkWeight = quantized < 96 ? 0.46 : 0.36;

        source[index] = Math.round(red * (1 - inkWeight) + sepiaRed * inkWeight);
        source[index + 1] = Math.round(green * (1 - inkWeight) + sepiaGreen * inkWeight);
        source[index + 2] = Math.round(blue * (1 - inkWeight) + sepiaBlue * inkWeight);
      }
    }

    context.putImageData(imageData, 0, 0);
  }

  function updateCanvasSize() {
    const dprLimit = lowPowerMode ? 1.25 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
    const resolutionScale = lowPowerMode ? 0.72 : 1;
    const canvasScale = dpr * resolutionScale;
    const width = Math.max(280, Math.floor(canvas.clientWidth));
    const height = Math.max(320, Math.floor(canvas.clientHeight));
    const targetWidth = Math.floor(width * canvasScale);
    const targetHeight = Math.floor(height * canvasScale);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    currentCanvasScale = canvasScale;
    context.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);
    if (printEffectsEnabled && !lowPowerMode) {
      ensurePaperTexture(width, height);
    }
  }

  function handleLowPowerModeChange(event) {
    lowPowerMode = Boolean(event?.matches);
    updateCanvasSize();
  }

  function getLimbJointPoint(
    rootX,
    rootY,
    endX,
    endY,
    wobble,
    phase,
    bendDirection,
    options = {}
  ) {
    const {
      gaitScale = 0.42,
      perspectiveScale = 0.72,
      forwardScale = 0.04,
      phaseScale = 0.55,
      jointSeed = 0.45,
      jitterX = 0,
      jitterY = 0
    } = options;

    const dx = endX - rootX;
    const dy = endY - rootY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / distance;
    const ny = dx / distance;
    const forwardBend = Math.sin(phase * phaseScale + jointSeed) * (distance * forwardScale);
    const gaitBend = wobble * gaitScale + forwardBend;
    const perspectiveBend = wobble * perspectiveScale * clamp(bendDirection, -1, 1);
    const bendAmount = gaitBend + perspectiveBend;
    const jointBaseX = rootX + dx * 0.5;
    const jointBaseY = rootY + dy * 0.5;

    return {
      x: jointBaseX + nx * bendAmount + jitterX,
      y: jointBaseY + ny * bendAmount + jitterY
    };
  }

  function drawLimb(
    rootX,
    rootY,
    endX,
    endY,
    thickness,
    color,
    wobble = 0,
    phase = 0,
    detailColor = "#332923",
    fillShift = 0.1,
    detailWidth = null,
    sketchPasses = 3,
    strokeWidthBoost = 1,
    jitterScale = 1,
    bendDirection = 1
  ) {
    const graphite = "#332923";
    const motionScale = Math.max(0, jitterScale);
    const fillTone = blendHexColor(color, fillShift);

    context.strokeStyle = fillTone;
    context.lineWidth = Math.max(0.8, thickness + strokeWidthBoost);
    context.lineCap = "round";

    const passes = Math.max(1, Math.floor(sketchPasses));
    for (let pass = 0; pass < passes; pass += 1) {
      const passSeed = phase + pass * 0.73;
      const jitterX = sketchNoise(passSeed, 0.9 * motionScale);
      const jitterY = sketchNoise(passSeed + 2.4, 0.8 * motionScale);
      const passJitterX = sketchNoise(phase + pass * 0.59 + 0.45, 0.5 * motionScale);
      const passJitterY = sketchNoise(phase + pass * 0.59 + 0.45 + 2.6, 0.45 * motionScale);
      const joint = getLimbJointPoint(rootX, rootY, endX, endY, wobble, phase, bendDirection, {
        jointSeed: 0.45,
        jitterX: passJitterX,
        jitterY: passJitterY
      });
      const upperMidX = (rootX + joint.x) * 0.5 + jitterX * 0.35;
      const upperMidY = (rootY + joint.y) * 0.5 + jitterY * 0.35;
      const lowerMidX = (joint.x + endX) * 0.5 - jitterX * 0.3;
      const lowerMidY = (joint.y + endY) * 0.5 - jitterY * 0.3;
      context.beginPath();
      context.moveTo(rootX + jitterX * 0.35, rootY + jitterY * 0.35);
      context.quadraticCurveTo(upperMidX, upperMidY, joint.x, joint.y);
      context.quadraticCurveTo(lowerMidX, lowerMidY, endX - jitterX * 0.25, endY - jitterY * 0.25);
      drawRawStroke();
    }

    const resolvedDetailWidth = Number.isFinite(detailWidth) ? detailWidth : Math.max(1.2, thickness * 0.28);
    if (!suppressDecorativeStrokes && resolvedDetailWidth > 0) {
      const detailJoint = getLimbJointPoint(rootX, rootY, endX, endY, wobble, phase, bendDirection, { jointSeed: 1.2 });
      context.strokeStyle = detailColor || graphite;
      context.lineWidth = resolvedDetailWidth;
      context.beginPath();
      context.moveTo(rootX, rootY);
      context.quadraticCurveTo((rootX + detailJoint.x) * 0.5, (rootY + detailJoint.y) * 0.5, detailJoint.x, detailJoint.y);
      context.quadraticCurveTo((detailJoint.x + endX) * 0.5, (detailJoint.y + endY) * 0.5, endX, endY);
      drawRawStroke();
    }

    if (!suppressDecorativeStrokes) {
      const shadowJoint = getLimbJointPoint(rootX, rootY, endX, endY, wobble, phase, bendDirection, { jointSeed: 2 });
      const highlightJoint = getLimbJointPoint(rootX, rootY, endX, endY, wobble, phase, bendDirection, { jointSeed: 2.7 });
      context.save();
      context.globalAlpha = 0.5;
      context.strokeStyle = blendHexColor(color, -0.3);
      context.lineWidth = Math.max(0.9, thickness * 0.5);
      context.beginPath();
      context.moveTo(rootX + 0.8, rootY + 0.9);
      context.quadraticCurveTo(
        (rootX + shadowJoint.x) * 0.5 + 0.8,
        (rootY + shadowJoint.y) * 0.5 + 0.9,
        shadowJoint.x + 0.8,
        shadowJoint.y + 0.9
      );
      context.quadraticCurveTo(
        (shadowJoint.x + endX) * 0.5 + 0.8,
        (shadowJoint.y + endY) * 0.5 + 0.9,
        endX + 0.8,
        endY + 0.9
      );
      drawRawStroke();

      context.globalAlpha = 0.78;
      context.strokeStyle = blendHexColor(color, 0.36);
      context.lineWidth = Math.max(0.8, thickness * 0.24);
      context.beginPath();
      context.moveTo(rootX - 0.5, rootY - 0.4);
      context.quadraticCurveTo(
        (rootX + highlightJoint.x) * 0.5 - 0.5,
        (rootY + highlightJoint.y) * 0.5 - 0.4,
        highlightJoint.x - 0.5,
        highlightJoint.y - 0.4
      );
      context.quadraticCurveTo(
        (highlightJoint.x + endX) * 0.5 - 0.5,
        (highlightJoint.y + endY) * 0.5 - 0.4,
        endX - 0.5,
        endY - 0.4
      );
      drawRawStroke();
      context.restore();
    }
  }

  function drawFlatLimb(rootX, rootY, endX, endY, thickness, color, wobble = 0, phase = 0, bendDirection = 1) {
    const joint = getLimbJointPoint(rootX, rootY, endX, endY, wobble, phase, bendDirection, {
      jointSeed: 0.45
    });

    context.strokeStyle = color;
    context.lineWidth = Math.max(0.8, thickness);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(rootX, rootY);
    context.quadraticCurveTo((rootX + joint.x) * 0.5, (rootY + joint.y) * 0.5, joint.x, joint.y);
    context.quadraticCurveTo((joint.x + endX) * 0.5, (joint.y + endY) * 0.5, endX, endY);
    drawRawStroke();
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

  function drawOpenBook(x, y, tilt = 0, pageTurn = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    const leftSpread = 1 - pageTurn * 0.26;
    const rightSpread = 1 - (1 - pageTurn) * 0.26;

    context.fillStyle = "#6e4b33";
    context.beginPath();
    context.roundRect(-17, -10, 34, 20, 5);
    context.fill();

    context.fillStyle = "#efe2c4";
    context.beginPath();
    context.moveTo(-14, -8);
    context.quadraticCurveTo(-3, -11 * leftSpread, -1, -2);
    context.lineTo(-1, 8);
    context.quadraticCurveTo(-7, 10, -14, 7);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(14, -8);
    context.quadraticCurveTo(3, -11 * rightSpread, 1, -2);
    context.lineTo(1, 8);
    context.quadraticCurveTo(7, 10, 14, 7);
    context.closePath();
    context.fill();

    context.strokeStyle = "#3d3027";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, -8);
    context.lineTo(0, 8);
    context.moveTo(-11, -4);
    context.lineTo(-3, -2);
    context.moveTo(-11, 1);
    context.lineTo(-3, 2);
    context.moveTo(3, -2);
    context.lineTo(11, -4);
    context.moveTo(3, 2);
    context.lineTo(11, 1);
    context.stroke();

    context.restore();
  }

  function drawGuitar(x, y, tilt = 0, strum = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    const bodyGradient = context.createRadialGradient(-4, 2, 3, -2, 2, 24);
    bodyGradient.addColorStop(0, "#d99a58");
    bodyGradient.addColorStop(0.55, "#bb7a3f");
    bodyGradient.addColorStop(1, "#7f4f27");
    context.fillStyle = bodyGradient;
    context.strokeStyle = "#4a2f1f";
    context.lineWidth = 1.2;
    context.beginPath();
    context.ellipse(-6, 2, 18, 15, -0.12, 0, Math.PI * 2);
    context.ellipse(8, -2, 14, 12, 0.2, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#3a2318";
    context.beginPath();
    context.arc(-1, 1, 4, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#6b4a2f";
    context.fillRect(18, -4, 22, 6);

    context.fillStyle = "#4f3524";
    context.fillRect(40, -5, 6, 8);

    context.strokeStyle = "rgba(235, 232, 220, 0.9)";
    context.lineWidth = 0.8;
    const stringWave = strum * 0.7;
    for (let stringIndex = 0; stringIndex < 6; stringIndex += 1) {
      const yOffset = -3 + stringIndex * 1.2;
      context.beginPath();
      context.moveTo(-17, yOffset + stringWave * (0.08 + stringIndex * 0.03));
      context.lineTo(44, yOffset - stringWave * (0.08 + stringIndex * 0.03));
      context.stroke();
    }

    context.restore();
  }

  function drawBuskMusicNotes(x, y, seconds, intensity = 1) {
    const notes = [
      { x: -10, y: -12, size: 1, speed: 0.9, phase: 0.3, sway: 6 },
      { x: 12, y: -26, size: 0.85, speed: 1.15, phase: 1.1, sway: 5 },
      { x: 28, y: -10, size: 1.05, speed: 0.78, phase: 2.2, sway: 7 }
    ];

    context.save();
    context.translate(x, y);
    context.strokeStyle = "rgba(58, 44, 33, 0.9)";
    context.lineCap = "round";
    context.lineJoin = "round";

    notes.forEach((note) => {
      const progress = ((seconds * note.speed + note.phase) % 1 + 1) % 1;
      const rise = progress * 22;
      const sway = Math.sin(seconds * 5.2 + note.phase) * note.sway;
      const fade = clamp(1 - progress * 0.9, 0, 1) * clamp(intensity, 0, 1);

      if (fade <= 0.01) {
        return;
      }

      context.save();
      context.globalAlpha = fade;
      context.translate(note.x + sway, note.y - rise);
      context.scale(note.size, note.size);

      context.fillStyle = "rgba(86, 64, 47, 0.86)";
      context.beginPath();
      context.ellipse(-3, 2.8, 4.2, 3.1, -0.55, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = 1.7;
      context.beginPath();
      context.moveTo(0.6, 2.5);
      context.lineTo(0.6, -10);
      context.quadraticCurveTo(4, -11.6, 6.1, -9.2);
      drawRawStroke();

      context.restore();
    });

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

  function drawPhoneHandset(x, y, tilt = 0, pulse = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    const shellGradient = context.createLinearGradient(-7, -20, 7, 18);
    shellGradient.addColorStop(0, "#6f7e92");
    shellGradient.addColorStop(0.55, "#3e4d61");
    shellGradient.addColorStop(1, "#2a3442");

    context.fillStyle = shellGradient;
    context.strokeStyle = "#1f2832";
    context.lineWidth = 1.1;
    context.beginPath();
    context.roundRect(-6.8, -18.5, 13.6, 37, 4.2);
    context.fill();
    context.stroke();

    context.fillStyle = "#b7e6ff";
    context.beginPath();
    context.roundRect(-4.4, -13.6, 8.8, 12.4, 1.8);
    context.fill();

    context.fillStyle = "#223040";
    context.beginPath();
    context.roundRect(-2.2, 2.4, 4.4, 8.3, 1.4);
    context.fill();

    context.fillStyle = "rgba(255, 255, 255, 0.3)";
    context.beginPath();
    context.roundRect(-5.2, -16.2, 2.1, 14.5, 1.1);
    context.fill();

    if (pulse > 0.01) {
      context.save();
      context.globalAlpha = clamp(pulse, 0, 1) * 0.8;
      context.strokeStyle = "rgba(120, 201, 255, 0.8)";
      context.lineWidth = 1.4;
      context.beginPath();
      context.arc(0, -16, 8, -2.5, -0.6);
      context.arc(0, -16, 11.4, -2.5, -0.6);
      drawRawStroke();
      context.restore();
    }

    context.restore();
  }

  function drawWaterDroplets(x, y, seconds) {
    const droplets = [
      { x: -12, y: -18, radius: 3.2, phase: 0 },
      { x: 0, y: -22, radius: 3.8, phase: 1.2 },
      { x: 11, y: -16, radius: 2.9, phase: 2.4 },
      { x: -6, y: -6, radius: 2.6, phase: 3.1 },
      { x: 8, y: -2, radius: 2.3, phase: 4.2 }
    ];

    context.save();
    context.translate(x, y);
    droplets.forEach((droplet) => {
      const fall = ((seconds * 52 + droplet.phase * 14) % 28) - 14;
      const sway = Math.sin(seconds * 4 + droplet.phase) * 1.2;
      context.fillStyle = "rgba(88, 173, 233, 0.82)";
      context.beginPath();
      context.ellipse(droplet.x + sway, droplet.y + fall, droplet.radius * 0.9, droplet.radius * 1.35, 0, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function drawSoapBubbles(x, y, seconds) {
    const bubbles = [
      { x: -10, y: -12, radius: 4.5, phase: 0.4 },
      { x: -2, y: -20, radius: 3.2, phase: 1.3 },
      { x: 8, y: -10, radius: 5.2, phase: 2.1 },
      { x: 16, y: -18, radius: 2.8, phase: 2.9 },
      { x: -16, y: -4, radius: 3.4, phase: 3.7 }
    ];

    context.save();
    context.translate(x, y);
    bubbles.forEach((bubble) => {
      const rise = Math.sin(seconds * 2.5 + bubble.phase) * 4.5;
      const drift = Math.cos(seconds * 2 + bubble.phase) * 2;
      context.fillStyle = "rgba(229, 244, 255, 0.42)";
      context.strokeStyle = "rgba(168, 205, 236, 0.72)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(bubble.x + drift, bubble.y + rise, bubble.radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
    context.restore();
  }

  function drawSpade(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    context.fillStyle = "#6a4f35";
    context.beginPath();
    context.roundRect(-3.2, -36, 6.4, 38, 2.6);
    context.fill();

    context.fillStyle = "#888f98";
    context.strokeStyle = "#3b4249";
    context.lineWidth = 1.3;
    context.beginPath();
    context.moveTo(0, 4);
    context.lineTo(-11, 16);
    context.lineTo(0, 30);
    context.lineTo(11, 16);
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
  }

  function drawMagnifyingGlass(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    context.fillStyle = "rgba(198, 228, 250, 0.38)";
    context.strokeStyle = "#3f464e";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, 8, 0, Math.PI * 2);
    context.fill();
    drawRawStroke();

    context.strokeStyle = "#725639";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(5.8, 5.8);
    context.lineTo(14, 14);
    drawRawStroke();

    context.restore();
  }

  function drawBow(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    context.strokeStyle = "#6f5134";
    context.lineWidth = 3.4;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(0, -25);
    context.quadraticCurveTo(-18, 0, 0, 25);
    context.stroke();

    context.strokeStyle = "#d7dbe0";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(0, -22);
    context.lineTo(0, 22);
    context.stroke();

    context.restore();
  }

  function drawKnifeAndCarrot(x, y, tilt = 0, chopCycle = 0, impact = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    const lift = clamp((chopCycle - 0.24) / 0.38, 0, 1);
    const drop = clamp((chopCycle - 0.62) / 0.18, 0, 1);
    const recover = clamp((chopCycle - 0.8) / 0.2, 0, 1);

    const knifeX = 12 - lift * 2.5 - drop * 7 + recover * 3.5;
    const knifeY = -8 - lift * 44 + drop * 38 - recover * 9;
    const knifeRotation = -0.68 + lift * 0.54 - drop * 0.9 + recover * 0.34;
    const split = impact * 6.2;

    context.fillStyle = "#8f6a45";
    context.strokeStyle = "#4d3a28";
    context.lineWidth = 1.2;
    context.beginPath();
    context.roundRect(-34, 9, 68, 16, 4);
    context.fill();
    context.stroke();

    context.fillStyle = "#d97a2d";
    context.strokeStyle = "#b25f20";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(-24 - split, 16);
    context.lineTo(-4 - split * 0.4, 10);
    context.lineTo(-4 - split * 0.4, 20);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(0 + split * 0.4, 10);
    context.lineTo(20 + split, 16);
    context.lineTo(0 + split * 0.4, 20);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = "#4b7b42";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(-24 - split, 16);
    context.lineTo(-30 - split, 11);
    context.moveTo(-24 - split, 16);
    context.lineTo(-30 - split, 18);
    context.stroke();

    context.save();
    context.translate(knifeX, knifeY);
    context.rotate(knifeRotation);

    context.fillStyle = "#9e6842";
    context.beginPath();
    context.roundRect(-3.5, -18, 7, 12, 2.2);
    context.fill();

    context.fillStyle = "#c5ccd3";
    context.strokeStyle = "#545c64";
    context.lineWidth = 1.3;
    context.beginPath();
    context.moveTo(3.5, -15);
    context.lineTo(26, -9.5);
    context.lineTo(3.5, -4);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

    if (impact > 0.01) {
      context.save();
      context.globalAlpha = impact * 0.65;
      context.strokeStyle = "#f5ebd6";
      context.lineWidth = 1.1;
      context.beginPath();
      context.moveTo(-2, 12);
      context.lineTo(-6, 7);
      context.moveTo(-1, 12);
      context.lineTo(1, 6);
      context.moveTo(0, 12);
      context.lineTo(8, 8);
      context.stroke();
      context.restore();
    }

    context.restore();
  }

  function drawCashStack(x, y, tilt = 0, flick = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    const noteSpread = Math.sin(flick) * 1.8;
    context.fillStyle = "#89c971";
    context.strokeStyle = "#3e6f33";
    context.lineWidth = 1;

    context.beginPath();
    context.roundRect(-16 - noteSpread * 0.25, -9, 32, 18, 3);
    context.fill();
    context.stroke();

    context.beginPath();
    context.roundRect(-14 + noteSpread * 0.2, -11, 30, 18, 3);
    context.fillStyle = "#9fdb84";
    context.fill();
    context.stroke();

    context.fillStyle = "rgba(53, 95, 44, 0.9)";
    context.beginPath();
    context.roundRect(-4, -4.8, 8, 9.6, 2.2);
    context.fill();

    context.strokeStyle = "rgba(232, 248, 225, 0.9)";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(-9, -0.8);
    context.quadraticCurveTo(0, -7.2, 9, -0.8);
    context.moveTo(-9, 1.8);
    context.quadraticCurveTo(0, 8.2, 9, 1.8);
    context.stroke();

    context.restore();
  }

  function drawDumbbell(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    const plateGradient = context.createLinearGradient(-15, 0, 15, 0);
    plateGradient.addColorStop(0, "#6e7680");
    plateGradient.addColorStop(0.55, "#9aa2ab");
    plateGradient.addColorStop(1, "#4f5660");

    context.fillStyle = "#3e444c";
    context.beginPath();
    context.roundRect(-12, -2.2, 24, 4.4, 2.1);
    context.fill();

    context.fillStyle = plateGradient;
    context.strokeStyle = "#353a40";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(-19.5, -8.5, 6.5, 17, 1.8);
    context.roundRect(13, -8.5, 6.5, 17, 1.8);
    context.fill();
    context.stroke();

    context.fillStyle = "#8d96a0";
    context.beginPath();
    context.roundRect(-15.2, -10.5, 3.8, 21, 1.2);
    context.roundRect(11.4, -10.5, 3.8, 21, 1.2);
    context.fill();

    context.restore();
  }

  function drawBuyingMoneySymbols(x, y, seconds, intensity = 1) {
    const symbols = [
      { x: -15, y: 0, rise: 24, speed: 0.95, phase: 0.18, size: 0.9 },
      { x: 4, y: -2, rise: 28, speed: 1.1, phase: 0.61, size: 1.1 },
      { x: 18, y: 2, rise: 22, speed: 1.25, phase: 0.89, size: 0.8 }
    ];

    context.save();
    context.translate(x, y);
    context.textAlign = "center";
    context.textBaseline = "middle";

    symbols.forEach((symbol) => {
      const progress = ((seconds * symbol.speed + symbol.phase) % 1 + 1) % 1;
      const rise = progress * symbol.rise;
      const sway = Math.sin(seconds * 5.4 + symbol.phase * Math.PI * 2) * 4;
      const pulse = 1 + Math.sin(seconds * 8 + symbol.phase * Math.PI * 2) * 0.08;
      const fade = clamp((1 - progress * 0.92) * intensity, 0, 1);
      if (fade <= 0.01) {
        return;
      }

      context.save();
      context.globalAlpha = fade;
      context.translate(symbol.x + sway, symbol.y - rise);
      context.scale(symbol.size * pulse, symbol.size * pulse);
      context.font = "700 16px 'Patrick Hand', 'Comic Sans MS', cursive";
      context.fillStyle = "rgba(104, 166, 66, 0.95)";
      context.strokeStyle = "rgba(51, 89, 38, 0.9)";
      context.lineWidth = 1.1;
      context.strokeText("$", 0, 0);
      context.fillText("$", 0, 0);
      context.restore();
    });

    context.restore();
  }

  function drawHairStyle(
    styleName,
    hairColor,
    seconds,
    useOutline = true,
    accessoryOffsetX = 0,
    accessoryPerspectiveBlend = 0,
    accessoryOffsetY = 0,
    accessoryVisibility = 1
  ) {
    const strokeColor = useOutline ? blendHexColor(hairColor, -0.45) : hairColor;
    const baselineY = -75;
    context.fillStyle = hairColor;
    context.strokeStyle = strokeColor;
    context.lineWidth = 2;

    context.save();
    context.translate(0, baselineY);
    context.scale(HAIR_SIZE_SCALE, HAIR_SIZE_SCALE);
    context.translate(0, -baselineY);

    try {

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

    if (styleName === "ki-spikes") {
      context.beginPath();
      context.moveTo(-22, baselineY);
      context.lineTo(-18, -94);
      context.lineTo(-12, -82);
      context.lineTo(-7, -100);
      context.lineTo(-1, -84);
      context.lineTo(4, -101);
      context.lineTo(10, -84);
      context.lineTo(16, -97);
      context.lineTo(22, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "solar-mane") {
      context.beginPath();
      context.roundRect(-19, -88, 38, 13, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-21, -82);
      context.lineTo(-25, -92);
      context.lineTo(-17, -88);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-13, -86);
      context.lineTo(-16, -99);
      context.lineTo(-8, -91);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-4, -88);
      context.lineTo(-3, -103);
      context.lineTo(3, -91);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(6, -87);
      context.lineTo(10, -100);
      context.lineTo(14, -90);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(14, -84);
      context.lineTo(21, -94);
      context.lineTo(20, -84);
      context.closePath();
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "battle-wave") {
      const crest = Math.sin(seconds * 4.2) * 1.3;
      context.beginPath();
      context.moveTo(-22, baselineY);
      context.quadraticCurveTo(-15, -101 + crest, 2, -96 + crest * 0.8);
      context.quadraticCurveTo(18, -90 + crest * 0.5, 23, -80);
      context.quadraticCurveTo(16, -76, 6, -76);
      context.quadraticCurveTo(-8, -76, -22, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-8, baselineY);
      context.quadraticCurveTo(1, -88 + crest * 0.7, 11, -79);
      context.stroke();
      return;
    }

    if (styleName === "power-crown") {
      context.beginPath();
      context.moveTo(-21, baselineY);
      context.lineTo(-17, -86);
      context.lineTo(-11, -95);
      context.lineTo(-5, -86);
      context.lineTo(0, -100);
      context.lineTo(5, -86);
      context.lineTo(11, -95);
      context.lineTo(17, -86);
      context.lineTo(21, baselineY);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(-19, -82, 38, 8, 4);
      context.fill();
      context.stroke();
      return;
    }

    if (styleName === "comet-tail") {
      context.beginPath();
      context.roundRect(-20, -89, 40, 14, 8);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(12, -83);
      context.quadraticCurveTo(28, -86, 30, -72);
      context.quadraticCurveTo(22, -63, 13, -70);
      context.quadraticCurveTo(20, -74, 18, -81);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(14, -84, 6, 6, 3);
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
      if (hairColor === colors.hairColor && accessoryVisibility > 0.01) {
        const pinX = -11 + accessoryOffsetX;
        const pinY = -92;
        const perspectiveStrength = Math.abs(accessoryPerspectiveBlend);
        const cardHalfW = lerp(2.8, 2.5, perspectiveStrength);
        const cardHalfH = lerp(2.8, 3.15, perspectiveStrength);
        context.save();
        context.globalAlpha *= accessoryVisibility;
        context.translate(pinX, pinY);
        context.rotate(-0.12 + accessoryPerspectiveBlend * 0.1);
        context.fillStyle = "#f9f2e8";
        context.beginPath();
        context.roundRect(-cardHalfW, -cardHalfH, cardHalfW * 2, cardHalfH * 2, 0.7);
        context.fill();
        context.strokeStyle = "#6e1512";
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(-cardHalfW, -cardHalfH, cardHalfW * 2, cardHalfH * 2, 0.7);
        drawRawStroke();
        context.fillStyle = "#b4231f";
        context.beginPath();
        context.moveTo(0, -cardHalfH * 0.52);
        context.lineTo(cardHalfW * 0.43, 0);
        context.lineTo(0, cardHalfH * 0.52);
        context.lineTo(-cardHalfW * 0.43, 0);
        context.closePath();
        context.fill();
        context.restore();
      }
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
    } finally {
      context.restore();
    }
  }

  function addFaceAndHairMaskPath(styleName) {
    context.beginPath();
    context.arc(0, -66, 24, 0, Math.PI * 2);
    const resolvedStyle = String(styleName || "classic");
    const baselineY = -75;
    context.save();
    context.translate(0, baselineY);
    context.scale(HAIR_SIZE_SCALE, HAIR_SIZE_SCALE);
    context.translate(0, -baselineY);

    if (resolvedStyle === "hat-fedora") {
      context.roundRect(-16, -95, 32, 16, 5);
      context.ellipse(0, -79, 25, 4, 0, 0, Math.PI * 2);
      context.roundRect(-14.8, -95.2, 7.5, 7.5, 1.1);
      context.restore();
      return;
    }

    if (resolvedStyle === "hat-top") {
      context.roundRect(-13, -100, 26, 20, 4);
      context.ellipse(0, -79, 23, 4, 0, 0, Math.PI * 2);
      context.restore();
      return;
    }

    if (resolvedStyle === "hat-bucket") {
      context.moveTo(-20, -93);
      context.lineTo(20, -93);
      context.lineTo(16, -76);
      context.lineTo(-16, -76);
      context.closePath();
      context.ellipse(0, -76, 21, 4, 0, 0, Math.PI * 2);
      context.restore();
      return;
    }

    if (resolvedStyle === "hat-cap") {
      context.roundRect(-21, -90, 42, 15, 8);
      context.moveTo(0, -78);
      context.quadraticCurveTo(12, -74, 20, -78);
      context.quadraticCurveTo(11, -81, 0, -80);
      context.closePath();
      context.restore();
      return;
    }

    if (resolvedStyle === "hat-wizard") {
      context.moveTo(0, -101);
      context.lineTo(14, -79);
      context.lineTo(-14, -79);
      context.closePath();
      context.ellipse(0, -79, 23, 4, 0, 0, Math.PI * 2);
      context.restore();
      return;
    }

    if (resolvedStyle.startsWith("hat-")) {
      context.ellipse(0, -84, 27, 17, 0, 0, Math.PI * 2);
      context.ellipse(0, -79, 25, 5, 0, 0, Math.PI * 2);
      context.restore();
      return;
    }

    context.ellipse(0, -84, 27, 17, 0, 0, Math.PI * 2);
    context.restore();
  }

  function drawOpenEyes(styleName) {
    context.save();
    context.strokeStyle = "#362d27";
    context.lineWidth = 1.5;
    context.fillStyle = "#fffdf3";

    if (styleName === "sharp") {
      context.beginPath();
      context.moveTo(-14, -67);
      context.quadraticCurveTo(-8.8, -74.8, -3.5, -67.4);
      context.quadraticCurveTo(-8.8, -63.2, -14, -67);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(3.5, -67.4);
      context.quadraticCurveTo(8.8, -74.8, 14, -67);
      context.quadraticCurveTo(8.8, -63.2, 3.5, -67.4);
      context.closePath();
      context.fill();
      context.stroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.ellipse(-8.8, -67, 2.4, 3, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(8.8, -67, 2.4, 3, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "sleepy") {
      context.beginPath();
      context.ellipse(-8.8, -67, 5.2, 4.8, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(8.8, -67, 5.2, 4.8, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.strokeStyle = "#3a302a";
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(-14, -70.2);
      context.quadraticCurveTo(-8.8, -72.8, -3.6, -70);
      context.moveTo(3.6, -70);
      context.quadraticCurveTo(8.8, -72.8, 14, -70.2);
      context.stroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.ellipse(-8.8, -66.5, 1.9, 1.8, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(8.8, -66.5, 1.9, 1.8, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "round") {
      context.beginPath();
      context.ellipse(-8.8, -68, 6.1, 7.5, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(8.8, -68, 6.1, 7.5, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.arc(-8.6, -67.2, 2.6, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.6, -67.2, 2.6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.72)";
      context.beginPath();
      context.arc(-9.7, -69.3, 1, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(7.5, -69.3, 1, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "narrow") {
      context.beginPath();
      context.roundRect(-14.6, -69.5, 11.6, 4.8, 2.4);
      context.fill();
      context.stroke();
      context.beginPath();
      context.roundRect(3, -69.5, 11.6, 4.8, 2.4);
      context.fill();
      context.stroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.ellipse(-8.8, -67.2, 2.5, 1.2, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(8.8, -67.2, 2.5, 1.2, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "spark") {
      context.beginPath();
      context.ellipse(-8.8, -68, 5.6, 7, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(8.8, -68, 5.6, 7, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.arc(-8.6, -67.3, 2.4, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.6, -67.3, 2.4, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(255,255,255,0.82)";
      context.beginPath();
      context.moveTo(-10.2, -71.4);
      context.lineTo(-9.4, -69.3);
      context.lineTo(-7.2, -68.8);
      context.lineTo(-9, -67.6);
      context.lineTo(-8.7, -65.6);
      context.lineTo(-10.1, -67);
      context.lineTo(-12, -66.6);
      context.lineTo(-11, -68.2);
      context.lineTo(-12.2, -69.8);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(7.2, -71.4);
      context.lineTo(8, -69.3);
      context.lineTo(10.2, -68.8);
      context.lineTo(8.4, -67.6);
      context.lineTo(8.7, -65.6);
      context.lineTo(7.3, -67);
      context.lineTo(5.4, -66.6);
      context.lineTo(6.4, -68.2);
      context.lineTo(5.2, -69.8);
      context.closePath();
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "sunglasses") {
      context.fillStyle = "#2a2524";
      context.strokeStyle = "#161212";
      context.lineWidth = 1.8;
      context.beginPath();
      context.roundRect(-15.5, -71.2, 12.8, 8.6, 2.6);
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.roundRect(2.7, -71.2, 12.8, 8.6, 2.6);
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.moveTo(-2.7, -67.2);
      context.lineTo(2.7, -67.2);
      drawRawStroke();
      context.beginPath();
      context.moveTo(-15.5, -67.4);
      context.lineTo(-18.4, -66.2);
      context.moveTo(15.5, -67.4);
      context.lineTo(18.4, -66.2);
      drawRawStroke();
      context.fillStyle = "rgba(255,255,255,0.22)";
      context.beginPath();
      context.roundRect(-14.2, -70.3, 4.2, 1.4, 0.6);
      context.roundRect(4, -70.3, 4.2, 1.4, 0.6);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "eyeglasses") {
      context.fillStyle = "#fffdf3";
      context.strokeStyle = "#2b2420";
      context.lineWidth = 1.4;
      context.beginPath();
      context.roundRect(-15.4, -71, 12.6, 9.2, 2.2);
      context.roundRect(2.8, -71, 12.6, 9.2, 2.2);
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.moveTo(-2.8, -66.5);
      context.lineTo(2.8, -66.5);
      drawRawStroke();
      context.beginPath();
      context.moveTo(-15.4, -66.8);
      context.lineTo(-18.8, -65.8);
      context.moveTo(15.4, -66.8);
      context.lineTo(18.8, -65.8);
      drawRawStroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.arc(-8.8, -66.8, 2.1, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.8, -66.8, 2.1, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.6)";
      context.beginPath();
      context.arc(-9.6, -68.1, 0.7, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(7.9, -68.1, 0.7, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "round-glasses") {
      context.fillStyle = "rgba(255,253,243,0.9)";
      context.strokeStyle = "#2a2320";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(-8.8, -67.2, 5.9, 0, Math.PI * 2);
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.arc(8.8, -67.2, 5.9, 0, Math.PI * 2);
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.moveTo(-2.9, -67.2);
      context.lineTo(2.9, -67.2);
      drawRawStroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.arc(-8.7, -67, 2, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.7, -67, 2, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "aviators") {
      context.fillStyle = "rgba(68, 78, 92, 0.9)";
      context.strokeStyle = "#2d2722";
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(-14.6, -71.8);
      context.quadraticCurveTo(-8.8, -74.2, -3.4, -71.8);
      context.quadraticCurveTo(-3.4, -62.8, -8.8, -61.8);
      context.quadraticCurveTo(-14.6, -62.8, -14.6, -71.8);
      context.closePath();
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.moveTo(3.4, -71.8);
      context.quadraticCurveTo(8.8, -74.2, 14.6, -71.8);
      context.quadraticCurveTo(14.6, -62.8, 8.8, -61.8);
      context.quadraticCurveTo(3.4, -62.8, 3.4, -71.8);
      context.closePath();
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.moveTo(-3.2, -67.4);
      context.lineTo(3.2, -67.4);
      drawRawStroke();
      context.fillStyle = "rgba(255,255,255,0.2)";
      context.beginPath();
      context.moveTo(-12.6, -70.2);
      context.lineTo(-9.2, -69.6);
      context.lineTo(-10.9, -65.8);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(12.6, -70.2);
      context.lineTo(9.2, -69.6);
      context.lineTo(10.9, -65.8);
      context.closePath();
      context.fill();
      context.restore();
      return;
    }

    if (styleName === "monocle") {
      context.fillStyle = "#fffdf3";
      context.strokeStyle = "#6f5a2d";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(8.8, -67.2, 6.2, 0, Math.PI * 2);
      context.fill();
      drawRawStroke();
      context.beginPath();
      context.moveTo(13.5, -62.8);
      context.lineTo(17.2, -56.8);
      context.lineTo(14.6, -50.8);
      drawRawStroke();

      context.fillStyle = "#2e2520";
      context.beginPath();
      context.ellipse(-8.8, -67.8, 4.6, 5.8, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(8.8, -67, 2.2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.64)";
      context.beginPath();
      context.arc(7.8, -68.7, 0.8, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    // classic
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

  function drawBodyShadowCopy(
    pose,
    leftLegEndY,
    rightLegEndY,
    bodyProfile,
    seconds,
    wobbleScale,
    leftLegRootX,
    rightLegRootX,
    leftArmRootX,
    rightArmRootX,
    perspectiveBlend,
    perspectiveOffsetX = 0,
    legBendDirection = 1
  ) {
    const shadowFill = shadowStyle.fillColor;
    const shadowStroke = shadowStyle.strokeColor;

    context.save();

    const shadowOffsetX = shadowStyle.offsetX + perspectiveOffsetX;
    const shadowOffsetY = shadowStyle.offsetY;

    // Keep foot contacts fixed while offsetting the upper body silhouette.
    drawFlatLimb(
      leftLegRootX + shadowOffsetX,
      18 + shadowOffsetY,
      pose.leftLeg.x,
      leftLegEndY,
      5.5,
      shadowFill,
      4.2 * wobbleScale,
      seconds * 7 + 0.5,
      legBendDirection
    );
    drawFlatLimb(
      rightLegRootX + shadowOffsetX,
      18 + shadowOffsetY,
      pose.rightLeg.x,
      rightLegEndY,
      5.5,
      shadowFill,
      4.2 * wobbleScale,
      seconds * 7 + 2.2,
      legBendDirection
    );

    const torsoWidth = bodyProfile.torsoWidth;
    const torsoHeight = bodyProfile.torsoHeight;
    const torsoY = -38 + bodyProfile.torsoYOffset;
    const torsoX = -torsoWidth * 0.5;

    context.fillStyle = shadowFill;
    context.strokeStyle = shadowStroke;
    context.lineWidth = 1.4;
    context.beginPath();
    context.roundRect(torsoX + shadowOffsetX, torsoY + shadowOffsetY, torsoWidth, torsoHeight, bodyProfile.torsoRadius);
    context.fill();
    context.stroke();

    context.beginPath();
    context.arc(shadowOffsetX, -62 + shadowOffsetY, 25.5, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.save();
    context.translate(shadowOffsetX, shadowOffsetY + 4);
    drawHairStyle(hairStyle, shadowFill, seconds, false);
    context.restore();

    context.beginPath();
    context.ellipse(pose.leftLeg.x - 1, leftLegEndY + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.ellipse(pose.rightLeg.x + 1, rightLegEndY + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const drawLeftShadowArm = () => {
      drawFlatLimb(
        leftArmRootX + shadowOffsetX,
        -28 + shadowOffsetY,
        pose.leftArm.x + shadowOffsetX,
        pose.leftArm.y + shadowOffsetY,
        5,
        shadowFill,
        4.6 * wobbleScale * 0.1,
        seconds * 9 + 0.8
      );
    };
    const drawRightShadowArm = () => {
      drawFlatLimb(
        rightArmRootX + shadowOffsetX,
        -28 + shadowOffsetY,
        pose.rightArm.x + shadowOffsetX,
        pose.rightArm.y + shadowOffsetY,
        5,
        shadowFill,
        4.6 * wobbleScale * 0.1,
        seconds * 9 + 2.7
      );
    };

    if (perspectiveBlend > 0) {
      drawRightShadowArm();
      drawLeftShadowArm();
    } else {
      drawLeftShadowArm();
      drawRightShadowArm();
    }

    const drawLeftShadowHand = () => {
      context.beginPath();
      context.ellipse(pose.leftArm.x + shadowOffsetX, pose.leftArm.y + shadowOffsetY, 8.25, 6.9, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    };
    const drawRightShadowHand = () => {
      context.beginPath();
      context.ellipse(pose.rightArm.x + shadowOffsetX, pose.rightArm.y + shadowOffsetY, 8.25, 6.9, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    };

    if (perspectiveBlend > 0) {
      drawRightShadowHand();
      drawLeftShadowHand();
    } else {
      drawLeftShadowHand();
      drawRightShadowHand();
    }

    context.restore();
  }

  function drawOutlineHolder(
    legPose,
    armPose,
    leftLegEndY,
    rightLegEndY,
    bodyProfile,
    leftLegRootX,
    rightLegRootX,
    leftArmRootX,
    rightArmRootX,
    seconds,
    wobbleScale,
    perspectiveBlend,
    depthVisibility,
    punchWeight = 0,
    legBendDirection = 1,
    legWobbleAmplitude = 4.2 * wobbleScale,
    headOffsetX = 0,
    headOffsetExtraY = 0
  ) {
    const torsoWidth = bodyProfile.torsoWidth;
    const torsoHeight = bodyProfile.torsoHeight;
    const torsoY = -38 + bodyProfile.torsoYOffset;
    const torsoX = -torsoWidth * 0.5;
    const outlineWidth = 4.6;
    const legOutlineThickness = 12.8;
    const armOutlineThickness = 7.1;
    const headOffsetY = 4;
    const outlineBaseColor = "#272321";
    const outlineHairColor = "#221e1c";

    context.save();
    context.strokeStyle = outlineBaseColor;
    context.lineWidth = outlineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    const drawOutlineLimb = (rootX, rootY, endX, endY, thickness, wobble, phase, bendDirection = 1) => {
      drawLimb(
        rootX,
        rootY,
        endX,
        endY,
        thickness,
        outlineBaseColor,
        wobble,
        phase,
        outlineBaseColor,
        0,
        0,
        3,
        0,
        1,
        bendDirection
      );
    };

    const getOutlineHandShape = (armZ, emphasis = 0) => {
      const forwardDepth = Math.max(0, armZ);
      const backwardDepth = Math.max(0, -armZ);
      const sizeScale = clamp(
        1
          + forwardDepth * 0.012 * depthVisibility
          - backwardDepth * 0.005 * depthVisibility
          + emphasis * 0.1,
        0.82,
        1.75
      );
      return {
        radiusX: 8.9 * sizeScale,
        radiusY: 7.45 * sizeScale
      };
    };

    const getOutlineFootShape = (legZ) => {
      const forwardDepth = Math.max(0, legZ);
      const backwardDepth = Math.max(0, -legZ);
      const sizeScale = clamp(
        1
          + forwardDepth * 0.008 * depthVisibility
          - backwardDepth * 0.004 * depthVisibility,
        0.86,
        1.45
      );
      return {
        radiusX: 10.4 * sizeScale,
        radiusY: 5.5 * sizeScale
      };
    };

    const drawLeftOutlineLeg = () => {
      drawOutlineLimb(
        leftLegRootX,
        18,
        legPose.leftLeg.x,
        leftLegEndY,
        legOutlineThickness,
        legWobbleAmplitude,
        seconds * 7 + 0.5,
        legBendDirection
      );
    };
    const drawRightOutlineLeg = () => {
      drawOutlineLimb(
        rightLegRootX,
        18,
        legPose.rightLeg.x,
        rightLegEndY,
        legOutlineThickness,
        legWobbleAmplitude,
        seconds * 7 + 2.2,
        legBendDirection
      );
    };
    const drawLeftOutlineArm = () => {
      drawOutlineLimb(
        leftArmRootX,
        -28,
        armPose.leftArm.x,
        armPose.leftArm.y,
        armOutlineThickness,
        4.6 * wobbleScale,
        seconds * 9 + 0.8
      );
    };
    const drawRightOutlineArm = () => {
      drawOutlineLimb(
        rightArmRootX,
        -28,
        armPose.rightArm.x,
        armPose.rightArm.y,
        armOutlineThickness,
        4.6 * wobbleScale,
        seconds * 9 + 2.7
      );
    };

    if (perspectiveBlend > 0) {
      drawRightOutlineLeg();
      drawLeftOutlineLeg();
      drawRightOutlineArm();
      drawLeftOutlineArm();
    } else {
      drawLeftOutlineLeg();
      drawRightOutlineLeg();
      drawLeftOutlineArm();
      drawRightOutlineArm();
    }

    context.lineWidth = outlineWidth;
    context.beginPath();
    context.roundRect(
      torsoX - 1.5,
      torsoY - 1.5,
      torsoWidth + 3,
      torsoHeight + 3,
      bodyProfile.torsoRadius + 1.5
    );
    drawRawStroke();

    context.beginPath();
    context.arc(headOffsetX, -66 + headOffsetY + headOffsetExtraY, 25.5, 0, Math.PI * 2);
    drawRawStroke();

    const leftOutlineHand = getOutlineHandShape(armPose.leftArm.z, 0);
    const rightOutlineHand = getOutlineHandShape(armPose.rightArm.z, punchWeight);
    const leftOutlineFoot = getOutlineFootShape(legPose.leftLeg.z);
    const rightOutlineFoot = getOutlineFootShape(legPose.rightLeg.z);

    const drawLeftOutlineHand = () => {
      context.beginPath();
      context.ellipse(
        armPose.leftArm.x,
        armPose.leftArm.y,
        leftOutlineHand.radiusX,
        leftOutlineHand.radiusY,
        0,
        0,
        Math.PI * 2
      );
      drawRawStroke();
    };
    const drawRightOutlineHand = () => {
      context.beginPath();
      context.ellipse(
        armPose.rightArm.x,
        armPose.rightArm.y,
        rightOutlineHand.radiusX,
        rightOutlineHand.radiusY,
        0,
        0,
        Math.PI * 2
      );
      drawRawStroke();
    };
    const drawLeftOutlineFoot = () => {
      context.beginPath();
      context.ellipse(
        legPose.leftLeg.x - 1,
        leftLegEndY + 1.5,
        leftOutlineFoot.radiusX,
        leftOutlineFoot.radiusY,
        0,
        0,
        Math.PI * 2
      );
      drawRawStroke();
    };
    const drawRightOutlineFoot = () => {
      context.beginPath();
      context.ellipse(
        legPose.rightLeg.x + 1,
        rightLegEndY + 1.5,
        rightOutlineFoot.radiusX,
        rightOutlineFoot.radiusY,
        0,
        0,
        Math.PI * 2
      );
      drawRawStroke();
    };

    if (perspectiveBlend > 0) {
      drawRightOutlineHand();
      drawLeftOutlineHand();
      drawRightOutlineFoot();
      drawLeftOutlineFoot();
    } else {
      drawLeftOutlineHand();
      drawRightOutlineHand();
      drawLeftOutlineFoot();
      drawRightOutlineFoot();
    }

    context.save();
    context.translate(headOffsetX, headOffsetY + headOffsetExtraY);
    context.translate(0, -66);
    context.scale(1.08, 1.08);
    context.translate(0, 66);
    const previousSuppressDecorativeStrokes = suppressDecorativeStrokes;
    suppressDecorativeStrokes = lowPowerMode;
    drawHairStyle(hairStyle, outlineHairColor, seconds, true);
    suppressDecorativeStrokes = previousSuppressDecorativeStrokes;
    context.restore();

    context.beginPath();
    context.ellipse(headOffsetX, -86 + headOffsetY + headOffsetExtraY, 22.5, 11, 0, 0, Math.PI * 2);
    drawRawStroke();

    context.restore();
  }

  function fillShadedRoundedRect(x, y, width, height, radius, baseColor, tilt = 1, driftX = 0, driftY = 0) {
    context.fillStyle = blendHexColor(baseColor, 0.06);
    drawRoundedClipPath(x, y, width, height, radius);
    context.fill();

    context.save();
    drawRoundedClipPath(x, y, width, height, radius);
    context.clip();
    const shadowWidth = width * 0.42;
    const shadowDriftX = driftX * 0.95;
    const shadowDriftY = driftY * 0.75;
    context.fillStyle = blendHexColor(baseColor, -0.26);
    context.beginPath();
    context.moveTo(x + width + shadowDriftX, y + shadowDriftY);
    context.lineTo(x + width + shadowDriftX, y + height + shadowDriftY);
    context.lineTo(x + width - shadowWidth + shadowDriftX, y + height + shadowDriftY);
    context.lineTo(x + width - shadowWidth * 0.55 + shadowDriftX, y + shadowDriftY);
    context.closePath();
    context.fill();

    context.strokeStyle = blendHexColor(baseColor, 0.34);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + width * 0.16 - driftX * 0.62, y + 2.6 - driftY * 0.7);
    context.lineTo(x + width * 0.64 - driftX * 0.62, y + 2.6 - driftY * 0.7);
    context.stroke();
    context.restore();
  }

  function fillShadedCircle(centerX, centerY, radius, baseColor, driftX = 0, driftY = 0) {
    context.fillStyle = blendHexColor(baseColor, 0.03);
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = blendHexColor(baseColor, 0.2);
    context.beginPath();
    context.arc(
      centerX - radius * 0.08 + driftX * 0.92,
      centerY - radius * 0.08 + driftY * 0.82,
      radius * 0.95,
      0,
      Math.PI * 2
    );
    context.fill();

    context.strokeStyle = blendHexColor(baseColor, 0.22);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(centerX - radius * 0.56 - driftX * 0.58, centerY - radius * 0.52 - driftY * 0.5);
    context.lineTo(centerX - radius * 0.08 - driftX * 0.58, centerY - radius * 0.52 - driftY * 0.5);
    context.stroke();
    context.restore();
  }

  function fillShadedEllipse(centerX, centerY, radiusX, radiusY, baseColor, rotation = 0, driftX = 0, driftY = 0) {
    context.fillStyle = blendHexColor(baseColor, 0.05);
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, rotation, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, rotation, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = blendHexColor(baseColor, -0.2);
    context.beginPath();
    context.ellipse(
      centerX + radiusX * 0.34 + driftX * 0.76,
      centerY + radiusY * 0.2 + driftY * 0.62,
      radiusX * 0.74,
      radiusY * 0.72,
      rotation,
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();
  }

  function drawFrame(now) {
    if (!animationEnabled) {
      rafId = null;
      return;
    }

    const targetFrameMs = lowPowerMode ? 1000 / 24 : 1000 / 60;
    if (lastRenderTimestamp > 0 && now - lastRenderTimestamp < targetFrameMs) {
      rafId = window.requestAnimationFrame(drawFrame);
      return;
    }
    lastRenderTimestamp = now;

    updateCanvasSize();

    if (animationDurationMs > 0 && now - animationStartedAt >= animationDurationMs) {
      playAnimation(loopAnimation, { loop: true, transitionMs: 220 });
    }

    // Use backing-store dimensions so transient clientWidth/clientHeight=0 states do not break rendering.
    const safeCanvasScale = Math.max(0.001, currentCanvasScale);
    const width = Math.max(1, Math.floor(canvas.width / safeCanvasScale));
    const height = Math.max(1, Math.floor(canvas.height / safeCanvasScale));
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
    const petFromPose = createPetPose(seconds, transitionFromAnimation);
    const petToPose = createPetPose(seconds, currentAnimation);
    const petPose = transitionDurationMs > 0
      ? interpolatePetPose(petFromPose, petToPose, easedMix)
      : petToPose;

    if (transitionDurationMs > 0 && transitionMix >= 1) {
      transitionDurationMs = 0;
      transitionFromAnimation = currentAnimation;
    }

    const sleepWeight = getAnimationWeight("sleep", easedMix);
    const talkWeight = getAnimationWeight("talk", easedMix);
    const phoneTalkWeight = getAnimationWeight("phoneTalk", easedMix);
    const sandwichWeight = getAnimationWeight("sandwich", easedMix);
    const buskWeight = getAnimationWeight("busk", easedMix);
    const readWeight = getAnimationWeight("read", easedMix);
    const showerWeight = getAnimationWeight("shower", easedMix);
    const washWeight = getAnimationWeight("wash", easedMix);
    const digWeight = getAnimationWeight("dig", easedMix);
    const searchWeight = getAnimationWeight("search", easedMix);
    const huntWeight = getAnimationWeight("hunt", easedMix);
    const cookWeight = getAnimationWeight("cook", easedMix);
    const buyingWeight = getAnimationWeight("buying", easedMix);
    const pushupsWeight = getAnimationWeight("pushups", easedMix);
    const punchWeight = getAnimationWeight("punch", easedMix);
    const idleWeight = getAnimationWeight("idle", easedMix);
    const speakingWeight = clamp(talkWeight + phoneTalkWeight, 0, 1);
    const animatedTiltMix = clamp(pose.perspectiveTiltMix || 0, 0, 1);
    const basePerspectiveAngle = normalizeAngleDegrees(perspectiveAngle);
    const animatedPerspectiveOffset = clamp(pose.perspectiveTilt || 0, -100, 100) * 0.9;
    const resolvedPerspectiveAngle = normalizeAngleDegrees(
      basePerspectiveAngle + lerp(0, animatedPerspectiveOffset, animatedTiltMix)
    );
    const resolvedPerspectiveRadians = resolvedPerspectiveAngle * DEG_TO_RAD;
    const perspectiveBlend = clamp(Math.sin(resolvedPerspectiveRadians), -1, 1);
    const yawCos = Math.cos(resolvedPerspectiveRadians);
    const depthVisibility = clamp(Math.abs(yawCos), 0, 1);
    const sideSwapScale = Math.sign(yawCos || 1) * Math.pow(Math.abs(yawCos), 1.22);
    const frontFacingAngleDistance = Math.min(resolvedPerspectiveAngle, 360 - resolvedPerspectiveAngle);
    const faceFeatureVisibility = clamp(
      1 - (frontFacingAngleDistance - FACE_FEATURE_FULLY_VISIBLE_ANGLE)
        / (FACE_FEATURE_FULLY_HIDDEN_ANGLE - FACE_FEATURE_FULLY_VISIBLE_ANGLE),
      0,
      1
    );
    const perspectiveStrength = Math.abs(perspectiveBlend);
    const isRightArmFront = perspectiveBlend <= 0;
    // Continuous mapping avoids abrupt sign flips at perspective crossover.
    const targetLegBendDirection = -Math.tanh(perspectiveBlend * 3.2);
    legBendDirectionValue = lerp(legBendDirectionValue, targetLegBendDirection, 0.18);
    const legBendDirection = clamp(legBendDirectionValue, -1, 1);
    const facePerspectiveShiftX = perspectiveBlend * FACE_FEATURE_ORBIT_RADIUS;
    const shadowPerspectiveShiftX = -perspectiveBlend * 15;
    const idleBodyBob = (
      Math.sin(seconds * 1.9) * 1.55
      + Math.sin(seconds * 0.95 + 0.7) * 0.7
    ) * idleWeight;
    const idleBodyLean = (
      Math.sin(seconds * 1.3) * 0.026
      + Math.sin(seconds * 0.6 + 0.9) * 0.015
    ) * idleWeight;
    const dampedBounce = pose.bounce * 0.35 * (1 - idleWeight) + idleBodyBob;
    const renderedLean = lerp(pose.lean, 0, idleWeight) + idleBodyLean;
    const wobbleScale = 0.65;
    const legWobbleAmplitude = 2 * wobbleScale;
    const idleHeadOffsetX = (
      Math.sin(seconds * 1.15 + 0.2) * 1.3
      + Math.sin(seconds * 2.2 + 2.5) * 0.45
    ) * idleWeight;
    const idleHeadOffsetY = (
      Math.sin(seconds * 1.7 + 0.9) * 1.25
      + Math.sin(seconds * 0.75 + 1.8) * 0.55
    ) * idleWeight;
    const bodyProfile = BODY_TYPE_PROFILES[bodyType] || BODY_TYPE_PROFILES.classic;
    const faceSkinColor = blendHexColor(colors.skinColor, 0.04);
    const handOutlineColor = blendHexColor(faceSkinColor, -0.18);

    context.clearRect(0, 0, width, height);

    context.save();
    context.translate(centerX, centerY + dampedBounce);
    context.rotate(renderedLean);
    // Slight skew makes the character feel less flat and more staged.
    context.transform(1, 0, -0.08, 1, 0, 0);

    const projectPosePoint = (point) => {
      const scaledX = point.x * sideSwapScale;
      const depth = Number(point.z) || 0;
      return {
        x: scaledX + depth * perspectiveBlend * 0.42,
        y: point.y - depth * depthVisibility * 0.24,
        z: depth
      };
    };

    const perspectivePose = {
      ...pose,
      leftLeg: projectPosePoint(pose.leftLeg),
      rightLeg: projectPosePoint(pose.rightLeg),
      leftArm: projectPosePoint(pose.leftArm),
      rightArm: projectPosePoint(pose.rightArm)
    };

    const idleLockedPose = {
      ...perspectivePose,
      leftLeg: {
        ...perspectivePose.leftLeg,
        x: lerp(perspectivePose.leftLeg.x, -18 * sideSwapScale, idleWeight),
        y: lerp(perspectivePose.leftLeg.y, 78, idleWeight),
        z: lerp(perspectivePose.leftLeg.z, 0, idleWeight)
      },
      rightLeg: {
        ...perspectivePose.rightLeg,
        x: lerp(perspectivePose.rightLeg.x, 18 * sideSwapScale, idleWeight),
        y: lerp(perspectivePose.rightLeg.y, 78, idleWeight),
        z: lerp(perspectivePose.rightLeg.z, 0, idleWeight)
      }
    };

    const plantedCompensation = dampedBounce * lerp(0.85, 1, idleWeight);
    const leftLegEndY = idleLockedPose.leftLeg.y - plantedCompensation;
    const rightLegEndY = idleLockedPose.rightLeg.y - plantedCompensation;
    const leftLegRootX = -14 * sideSwapScale;
    const rightLegRootX = 14 * sideSwapScale;
    const leftArmRootX = -18 * sideSwapScale;
    const rightArmRootX = 18 * sideSwapScale;
    const leftArmDepth = perspectiveBlend * 24;
    const rightArmDepth = -perspectiveBlend * 24;
    const centerDepth = (leftArmDepth + rightArmDepth) * 0.5;

    const getHandVisual = (armZ, emphasis = 0) => {
      const forwardDepth = Math.max(0, armZ);
      const backwardDepth = Math.max(0, -armZ);
      const depthStrength = depthVisibility;
      const sizeScale = clamp(
        1
          + forwardDepth * 0.012 * depthStrength
          - backwardDepth * 0.005 * depthStrength
          + emphasis * 0.12,
        0.8,
        1.8
      );
      return {
        radiusX: 8.25 * sizeScale,
        radiusY: 6.9 * sizeScale,
        outlineWidth: 1.2 + forwardDepth * 0.018 * depthStrength + emphasis * 0.28,
        highlightAlpha: clamp(0.14 + forwardDepth * 0.011 * depthStrength + emphasis * 0.26, 0.08, 0.62)
      };
    };

    const drawLeftArmAndHand = () => {
      const leftHandVisual = getHandVisual(perspectivePose.leftArm.z, 0);
      drawLimb(
        leftArmRootX,
        -28,
        perspectivePose.leftArm.x,
        perspectivePose.leftArm.y,
        5,
        faceSkinColor,
        4.6 * wobbleScale,
        seconds * 9 + 0.8,
        handOutlineColor,
        0,
        0,
        1,
        0,
        0.1
      );
      const leftHandShadeDriftX = Math.sin(seconds * 2.5 + perspectivePose.leftArm.x * 0.05) * 1.6;
      const leftHandShadeDriftY = Math.cos(seconds * 2 + perspectivePose.leftArm.y * 0.05) * 1.1;
      context.strokeStyle = handOutlineColor;
      context.lineWidth = leftHandVisual.outlineWidth;
      fillShadedEllipse(
        perspectivePose.leftArm.x,
        perspectivePose.leftArm.y,
        leftHandVisual.radiusX,
        leftHandVisual.radiusY,
        faceSkinColor,
        0,
        leftHandShadeDriftX,
        leftHandShadeDriftY
      );
      context.save();
      context.globalAlpha = leftHandVisual.highlightAlpha;
      context.fillStyle = "rgba(248, 238, 227, 0.78)";
      context.beginPath();
      context.ellipse(
        perspectivePose.leftArm.x - leftHandVisual.radiusX * 0.22,
        perspectivePose.leftArm.y - leftHandVisual.radiusY * 0.3,
        leftHandVisual.radiusX * 0.38,
        leftHandVisual.radiusY * 0.32,
        -0.25,
        0,
        Math.PI * 2
      );
      context.fill();
      context.restore();
      context.beginPath();
      context.ellipse(
        perspectivePose.leftArm.x,
        perspectivePose.leftArm.y,
        leftHandVisual.radiusX,
        leftHandVisual.radiusY,
        0,
        0,
        Math.PI * 2
      );
      context.stroke();
    };

    const drawRightArmAndHand = () => {
      const rightHandVisual = getHandVisual(perspectivePose.rightArm.z, punchWeight);
      drawLimb(
        rightArmRootX,
        -28,
        perspectivePose.rightArm.x,
        perspectivePose.rightArm.y,
        5,
        faceSkinColor,
        4.6 * wobbleScale,
        seconds * 9 + 2.7,
        handOutlineColor,
        0,
        0,
        1,
        0,
        0.1
      );
      const rightHandShadeDriftX = Math.sin(seconds * 2.5 + 1.4 + perspectivePose.rightArm.x * 0.05) * 1.6;
      const rightHandShadeDriftY = Math.cos(seconds * 2 + 1.1 + perspectivePose.rightArm.y * 0.05) * 1.1;
      context.strokeStyle = handOutlineColor;
      context.lineWidth = rightHandVisual.outlineWidth;
      fillShadedEllipse(
        perspectivePose.rightArm.x,
        perspectivePose.rightArm.y,
        rightHandVisual.radiusX,
        rightHandVisual.radiusY,
        faceSkinColor,
        0,
        rightHandShadeDriftX,
        rightHandShadeDriftY
      );
      context.save();
      context.globalAlpha = rightHandVisual.highlightAlpha;
      context.fillStyle = "rgba(255, 243, 229, 0.84)";
      context.beginPath();
      context.ellipse(
        perspectivePose.rightArm.x - rightHandVisual.radiusX * 0.24,
        perspectivePose.rightArm.y - rightHandVisual.radiusY * 0.32,
        rightHandVisual.radiusX * 0.4,
        rightHandVisual.radiusY * 0.34,
        -0.25,
        0,
        Math.PI * 2
      );
      context.fill();
      context.restore();
      context.beginPath();
      context.ellipse(
        perspectivePose.rightArm.x,
        perspectivePose.rightArm.y,
        rightHandVisual.radiusX,
        rightHandVisual.radiusY,
        0,
        0,
        Math.PI * 2
      );
      context.stroke();
    };

    drawBodyShadowCopy(
      idleLockedPose,
      leftLegEndY,
      rightLegEndY,
      bodyProfile,
      seconds,
      wobbleScale,
      leftLegRootX,
      rightLegRootX,
      leftArmRootX,
      rightArmRootX,
      perspectiveBlend,
      shadowPerspectiveShiftX,
      legBendDirection
    );

    if (holderVisible) {
      drawOutlineHolder(
        idleLockedPose,
        perspectivePose,
        leftLegEndY,
        rightLegEndY,
        bodyProfile,
        leftLegRootX,
        rightLegRootX,
        leftArmRootX,
        rightArmRootX,
        seconds,
        wobbleScale,
        perspectiveBlend,
        depthVisibility,
        punchWeight,
        legBendDirection,
        legWobbleAmplitude,
        idleHeadOffsetX,
        idleHeadOffsetY
      );
    }

    const drawLeftLeg = () => {
      drawLimb(
        leftLegRootX,
        18,
        idleLockedPose.leftLeg.x,
        leftLegEndY,
        5.5,
        colors.pantsColor,
        legWobbleAmplitude,
        seconds * 7 + 0.5,
        "#332923",
        0.1,
        null,
        3,
        1,
        0.55,
        legBendDirection
      );
    };
    const drawRightLeg = () => {
      drawLimb(
        rightLegRootX,
        18,
        idleLockedPose.rightLeg.x,
        rightLegEndY,
        5.5,
        colors.pantsColor,
        legWobbleAmplitude,
        seconds * 7 + 2.2,
        "#332923",
        0.1,
        null,
        3,
        1,
        0.55,
        legBendDirection
      );
    };

    if (perspectiveBlend > 0) {
      drawRightLeg();
      drawLeftLeg();
    } else {
      drawLeftLeg();
      drawRightLeg();
    }

    if (isRightArmFront) {
      drawLeftArmAndHand();
    } else {
      drawRightArmAndHand();
    }

    const shirtBase = blendHexColor(colors.shirtColor, 0.08);
    const torsoShadeDriftX = Math.sin(seconds * 1.5 + pose.lean * 12) * 2.8;
    const torsoShadeDriftY = Math.cos(seconds * 1.2 + pose.bounce * 0.08) * 1.8;
    context.strokeStyle = "#372d26";
    context.lineWidth = 1.5;
    const torsoWidth = bodyProfile.torsoWidth;
    const torsoHeight = bodyProfile.torsoHeight;
    const torsoY = -38 + bodyProfile.torsoYOffset;
    const torsoX = -torsoWidth * 0.5;
    fillShadedRoundedRect(
      torsoX,
      torsoY,
      torsoWidth,
      torsoHeight,
      bodyProfile.torsoRadius,
      shirtBase,
      1.1,
      torsoShadeDriftX,
      torsoShadeDriftY
    );
    context.beginPath();
    context.roundRect(torsoX, torsoY, torsoWidth, torsoHeight, bodyProfile.torsoRadius);
    context.stroke();

    context.fillStyle = blendHexColor(colors.shirtColor, 0.2);
    const innerWidth = torsoWidth * bodyProfile.insetScaleX;
    const innerHeight = torsoHeight * bodyProfile.insetScaleY;
    context.beginPath();
    context.roundRect(-innerWidth * 0.5, torsoY + 8, innerWidth, innerHeight, Math.max(12, bodyProfile.torsoRadius * 0.65));
    context.fill();

    context.save();
    context.globalAlpha = 0.42;
    context.strokeStyle = blendHexColor(colors.shirtColor, 0.38);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(torsoX + torsoWidth * 0.2, torsoY + 8);
    context.quadraticCurveTo(torsoX + torsoWidth * 0.5, torsoY + 20, torsoX + torsoWidth * 0.8, torsoY + 8);
    context.stroke();
    context.restore();

    const pantsHalfWidth = torsoWidth * 0.5 - 2.5;
    const pantsHeight = (torsoHeight / 3) * 1.0201;
    const torsoBottomY = torsoY + torsoHeight - 1;
    const pantsDrop = Math.max(6, torsoHeight * 0.115);
    const pantsYOffset = 2;
    const pantsTopY = torsoBottomY - pantsHeight + pantsDrop + pantsYOffset;
    const pantsCurveY = torsoBottomY + pantsHeight * 0.35 + pantsDrop + pantsYOffset;
    context.fillStyle = blendHexColor(colors.pantsColor, 0.05);
    context.beginPath();
    context.moveTo(-pantsHalfWidth, pantsTopY);
    context.lineTo(pantsHalfWidth, pantsTopY);
    context.quadraticCurveTo(0, pantsCurveY, -pantsHalfWidth, pantsTopY);
    context.closePath();
    context.fill();

    const headOffsetY = 4;
    context.save();
    context.translate(idleHeadOffsetX, headOffsetY + idleHeadOffsetY);

    const headShadeDriftX = Math.sin(seconds * 2.1 + pose.lean * 10) * 2;
    const headShadeDriftY = Math.cos(seconds * 1.7 + pose.bounce * 0.06) * 1.5;
    const idleLookX = (
      Math.sin(seconds * 0.9) * 3.2
      + Math.sin(seconds * 0.41 + 1.35) * 2.2
      + Math.sin(seconds * 2.25 + 0.9) * 0.9
    ) * idleWeight;
    const idleLookY = (
      Math.sin(seconds * 0.74 + 0.4) * 1.35
      + Math.sin(seconds * 1.66 + 2.1) * 0.7
      + Math.sin(seconds * 2.1 + 0.3) * 0.45
    ) * idleWeight;
    const faceFeatureDriftX = headShadeDriftX * 0.24 + facePerspectiveShiftX + idleLookX;
    const faceFeatureDriftY = headShadeDriftY * 0.2 + idleLookY;

    context.strokeStyle = "#382d25";
    context.lineWidth = 1.5;
    fillShadedCircle(0, -66, 24, faceSkinColor, headShadeDriftX, headShadeDriftY);
    context.beginPath();
    context.arc(0, -66, 24, 0, Math.PI * 2);
    context.stroke();

    context.save();
    context.globalAlpha = 0.14;
    context.fillStyle = "rgba(150,60,38,0.2)";
    context.beginPath();
    context.ellipse(-10.5 - headShadeDriftX * 0.28, -60 - headShadeDriftY * 0.26, 3.8, 2.1, -0.25, 0, Math.PI * 2);
    context.ellipse(10.5 - headShadeDriftX * 0.28, -60 - headShadeDriftY * 0.26, 3.8, 2.1, 0.25, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.save();
    addFaceAndHairMaskPath(hairStyle);
    context.clip();
    drawHairStyle(
      hairStyle,
      colors.hairColor,
      seconds,
      true,
      faceFeatureDriftX,
      perspectiveBlend,
      faceFeatureDriftY,
      faceFeatureVisibility
    );
    context.restore();

    // Keep facial features clipped to the same combined face/hair mask used by hat accessories.
    context.save();
    addFaceAndHairMaskPath(hairStyle);
    context.clip();

    const openEyesAlpha = (1 - sleepWeight) * faceFeatureVisibility;
    if (openEyesAlpha > 0.01) {
      context.save();
      context.globalAlpha = openEyesAlpha;
      context.translate(faceFeatureDriftX, faceFeatureDriftY);
      drawOpenEyes(eyeStyle);
      context.restore();
    }

    const closedEyesAlpha = sleepWeight * faceFeatureVisibility;
    if (closedEyesAlpha > 0.01) {
      context.save();
      context.globalAlpha = closedEyesAlpha;
      context.translate(faceFeatureDriftX, faceFeatureDriftY);
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

    if (faceFeatureVisibility > 0.01) {
      context.strokeStyle = "#3b3029";
      context.lineWidth = 1.8;
      context.lineCap = "round";
      context.save();
      context.globalAlpha = faceFeatureVisibility;
      context.translate(faceFeatureDriftX, faceFeatureDriftY);
      context.beginPath();
      const talkOpen = speakingWeight * ((Math.sin(seconds * 18) + 1) * 0.5);
      context.moveTo(-7, -58);
      context.quadraticCurveTo(0, -53 + talkOpen * 3.5, 8, -58);
      drawRawStroke();
      context.restore();
    }

    context.restore();

    context.restore();

    const shoeTone = blendHexColor(colors.shoeColor, -0.02);
    context.strokeStyle = "#2f2622";
    context.lineWidth = 1.2;
    const drawLeftShoe = () => {
      const leftShoeGradient = context.createLinearGradient(
        idleLockedPose.leftLeg.x - 10,
        leftLegEndY - 2,
        idleLockedPose.leftLeg.x + 10,
        leftLegEndY + 4
      );
      leftShoeGradient.addColorStop(0, blendHexColor(shoeTone, 0.18));
      leftShoeGradient.addColorStop(1, blendHexColor(shoeTone, -0.22));
      context.fillStyle = leftShoeGradient;
      context.beginPath();
      context.ellipse(idleLockedPose.leftLeg.x - 1, leftLegEndY + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    };
    const drawRightShoe = () => {
      const rightShoeGradient = context.createLinearGradient(
        idleLockedPose.rightLeg.x - 10,
        rightLegEndY - 2,
        idleLockedPose.rightLeg.x + 10,
        rightLegEndY + 4
      );
      rightShoeGradient.addColorStop(0, blendHexColor(shoeTone, 0.18));
      rightShoeGradient.addColorStop(1, blendHexColor(shoeTone, -0.22));
      context.fillStyle = rightShoeGradient;
      context.beginPath();
      context.ellipse(idleLockedPose.rightLeg.x + 1, rightLegEndY + 1.5, 9.5, 5, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    };

    if (perspectiveBlend > 0) {
      drawRightShoe();
      drawLeftShoe();
    } else {
      drawLeftShoe();
      drawRightShoe();
    }

    if (sandwichWeight > 0.01) {
      const sandwichPlacement = getPropPlacement(
        "sandwich",
        perspectivePose.leftArm.x + 7,
        perspectivePose.leftArm.y - 2,
        -0.22 + Math.sin(seconds * 6) * 0.05,
        { perspectiveBlend, depthVisibility, baseZ: leftArmDepth }
      );
      context.save();
      context.globalAlpha = sandwichWeight;
      context.translate(sandwichPlacement.x, sandwichPlacement.y);
      context.rotate(sandwichPlacement.rotation);
      context.scale(sandwichPlacement.scale, sandwichPlacement.scale);
      drawSandwich(0, 0, 0);
      context.restore();
    }

    if (readWeight > 0.01) {
      const pageTurn = (Math.sin(seconds * 2.2) + 1) * 0.5;
      const readPlacement = getPropPlacement(
        "read",
        (perspectivePose.leftArm.x + perspectivePose.rightArm.x) * 0.5,
        (perspectivePose.leftArm.y + perspectivePose.rightArm.y) * 0.5 + 5,
        -0.03 + Math.sin(seconds * 2.2) * 0.03,
        { perspectiveBlend, depthVisibility, baseZ: centerDepth }
      );
      context.save();
      context.globalAlpha = readWeight;
      context.translate(readPlacement.x, readPlacement.y);
      context.rotate(readPlacement.rotation);
      context.scale(readPlacement.scale, readPlacement.scale);
      drawOpenBook(0, 0, 0, pageTurn);
      context.restore();
    }

    if (buskWeight > 0.01) {
      const strum = Math.sin(seconds * 10.6);
      const buskPlacement = getPropPlacement(
        "busk",
        (perspectivePose.leftArm.x + perspectivePose.rightArm.x) * 0.5 + 2,
        (perspectivePose.leftArm.y + perspectivePose.rightArm.y) * 0.5 + 10,
        0.36 + Math.sin(seconds * 2.3) * 0.02,
        { perspectiveBlend, depthVisibility, baseZ: centerDepth }
      );
      context.save();
      context.globalAlpha = buskWeight;
      context.translate(buskPlacement.x, buskPlacement.y);
      context.rotate(buskPlacement.rotation);
      context.scale(buskPlacement.scale, buskPlacement.scale);
      drawGuitar(0, 0, 0, strum);
      context.restore();

      const notePlacement = getPropPlacement(
        "busk",
        buskPlacement.x + 18,
        buskPlacement.y - 22,
        0,
        { perspectiveBlend, depthVisibility, baseZ: centerDepth + 12 }
      );
      drawBuskMusicNotes(notePlacement.x, notePlacement.y, seconds, buskWeight);
    }

    if (showerWeight > 0.01) {
      const showerPlacement = getPropPlacement("shower", 0, -86, 0, {
        perspectiveBlend,
        depthVisibility,
        baseZ: centerDepth
      });
      context.save();
      context.globalAlpha = showerWeight;
      context.translate(showerPlacement.x, showerPlacement.y);
      context.rotate(showerPlacement.rotation);
      context.scale(showerPlacement.scale, showerPlacement.scale);
      drawWaterDroplets(0, 0, seconds);
      context.restore();
    }

    if (washWeight > 0.01) {
      const washPlacementLeft = getPropPlacement(
        "wash",
        perspectivePose.leftArm.x + 6,
        perspectivePose.leftArm.y - 4,
        0,
        { perspectiveBlend, depthVisibility, baseZ: leftArmDepth }
      );
      const washPlacementRight = getPropPlacement(
        "wash",
        perspectivePose.rightArm.x - 6,
        perspectivePose.rightArm.y - 2,
        0,
        { perspectiveBlend, depthVisibility, baseZ: rightArmDepth }
      );
      context.save();
      context.globalAlpha = washWeight;
      context.save();
      context.translate(washPlacementLeft.x, washPlacementLeft.y);
      context.rotate(washPlacementLeft.rotation);
      context.scale(washPlacementLeft.scale, washPlacementLeft.scale);
      drawSoapBubbles(0, 0, seconds);
      context.restore();
      context.save();
      context.translate(washPlacementRight.x, washPlacementRight.y);
      context.rotate(washPlacementRight.rotation);
      context.scale(washPlacementRight.scale, washPlacementRight.scale);
      drawSoapBubbles(0, 0, seconds + 0.4);
      context.restore();
      context.restore();
    }

    if (digWeight > 0.01) {
      const digPlacement = getPropPlacement(
        "dig",
        perspectivePose.rightArm.x + 4,
        perspectivePose.rightArm.y - 4,
        0.4 + Math.sin(seconds * 5.4) * 0.1,
        { perspectiveBlend, depthVisibility, baseZ: rightArmDepth }
      );
      context.save();
      context.globalAlpha = digWeight;
      context.translate(digPlacement.x, digPlacement.y);
      context.rotate(digPlacement.rotation);
      context.scale(digPlacement.scale, digPlacement.scale);
      drawSpade(0, 0, 0);
      context.restore();
    }

    if (searchWeight > 0.01) {
      const searchPlacement = getPropPlacement(
        "search",
        perspectivePose.rightArm.x + 5,
        perspectivePose.rightArm.y - 1,
        -0.18 + Math.sin(seconds * 2.8) * 0.08,
        { perspectiveBlend, depthVisibility, baseZ: rightArmDepth }
      );
      context.save();
      context.globalAlpha = searchWeight;
      context.translate(searchPlacement.x, searchPlacement.y);
      context.rotate(searchPlacement.rotation);
      context.scale(searchPlacement.scale, searchPlacement.scale);
      drawMagnifyingGlass(0, 0, 0);
      context.restore();
    }

    if (huntWeight > 0.01) {
      const huntPlacement = getPropPlacement(
        "hunt",
        perspectivePose.leftArm.x - 4,
        perspectivePose.leftArm.y - 1,
        -0.1 + Math.sin(seconds * 4.8) * 0.05,
        { perspectiveBlend, depthVisibility, baseZ: leftArmDepth }
      );
      context.save();
      context.globalAlpha = huntWeight;
      context.translate(huntPlacement.x, huntPlacement.y);
      context.rotate(huntPlacement.rotation);
      context.scale(huntPlacement.scale, huntPlacement.scale);
      drawBow(0, 0, 0);
      context.restore();
    }

    if (cookWeight > 0.01) {
      const cookCycle = (seconds * 1.7) % 1;
      const chopImpact = cookCycle >= 0.62 && cookCycle < 0.8
        ? Math.sin(((cookCycle - 0.62) / 0.18) * Math.PI)
        : 0;
      const cookPlacement = getPropPlacement(
        "cook",
        (perspectivePose.leftArm.x + perspectivePose.rightArm.x) * 0.5,
        (perspectivePose.leftArm.y + perspectivePose.rightArm.y) * 0.5 + 8,
        -0.08 - chopImpact * 0.06,
        { perspectiveBlend, depthVisibility, baseZ: centerDepth }
      );
      context.save();
      context.globalAlpha = cookWeight;
      context.translate(cookPlacement.x, cookPlacement.y);
      context.rotate(cookPlacement.rotation);
      context.scale(cookPlacement.scale, cookPlacement.scale);
      drawKnifeAndCarrot(0, 0, 0, cookCycle, chopImpact);
      context.restore();
    }

    if (buyingWeight > 0.01) {
      const moneyFlick = seconds * 8.2;
      const buyingPlacement = getPropPlacement(
        "buying",
        (perspectivePose.leftArm.x + perspectivePose.rightArm.x) * 0.5,
        (perspectivePose.leftArm.y + perspectivePose.rightArm.y) * 0.5 + 6,
        -0.08 + Math.sin(seconds * 4.6) * 0.04,
        { perspectiveBlend, depthVisibility, baseZ: centerDepth + 8 }
      );
      context.save();
      context.globalAlpha = buyingWeight;
      context.translate(buyingPlacement.x, buyingPlacement.y);
      context.rotate(buyingPlacement.rotation);
      context.scale(buyingPlacement.scale, buyingPlacement.scale);
      drawCashStack(0, 0, 0, moneyFlick);
      context.restore();

      const symbolPlacement = getPropPlacement(
        "buying",
        buyingPlacement.x + 16,
        buyingPlacement.y - 22,
        0,
        { perspectiveBlend, depthVisibility, baseZ: centerDepth + 24 }
      );
      drawBuyingMoneySymbols(symbolPlacement.x, symbolPlacement.y, seconds, buyingWeight);
    }

    if (phoneTalkWeight > 0.01) {
      const ringPulse = (Math.sin(seconds * 8.5) + 1) * 0.5;
      const phonePlacement = getPropPlacement(
        "phoneTalk",
        perspectivePose.rightArm.x + 0.6,
        perspectivePose.rightArm.y - 2.5,
        -0.6 + Math.sin(seconds * 6.8) * 0.04,
        { perspectiveBlend, depthVisibility, baseZ: rightArmDepth + 18 }
      );
      context.save();
      context.globalAlpha = phoneTalkWeight;
      context.translate(phonePlacement.x, phonePlacement.y);
      context.rotate(phonePlacement.rotation);
      context.scale(phonePlacement.scale, phonePlacement.scale);
      drawPhoneHandset(0, 0, 0, ringPulse);
      context.restore();
    }

    if (pushupsWeight > 0.01) {
      const leftCurl = (Math.sin(seconds * 3.2) + 1) * 0.5;
      const rightCurl = (Math.sin(seconds * 3.2 + Math.PI) + 1) * 0.5;
      const activeArm = rightCurl >= leftCurl ? perspectivePose.rightArm : perspectivePose.leftArm;
      const activeArmDepth = rightCurl >= leftCurl ? rightArmDepth : leftArmDepth;
      const dumbbellPlacement = getPropPlacement(
        "pushups",
        activeArm.x,
        activeArm.y + 4,
        0.2 + Math.sin(seconds * 6.4) * 0.14,
        { perspectiveBlend, depthVisibility, baseZ: activeArmDepth + 8 }
      );
      context.save();
      context.globalAlpha = pushupsWeight;
      context.translate(dumbbellPlacement.x, dumbbellPlacement.y);
      context.rotate(dumbbellPlacement.rotation);
      context.scale(dumbbellPlacement.scale, dumbbellPlacement.scale);
      drawDumbbell(0, 0, 0);
      context.restore();
    }

    // Draw the arm that's closer to the camera in front of the body.
    if (isRightArmFront) {
      drawRightArmAndHand();
    } else {
      drawLeftArmAndHand();
    }

    context.restore();

    if (petVisible) {
      const petAnchorX = Math.max(58, width - 76);
      const petAnchorY = Math.max(92, height - 44);
      context.save();
      context.strokeStyle = "rgba(59, 48, 41, 0.32)";
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(petAnchorX, petAnchorY + 8, 34, 8, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      drawPet(petAnchorX, petAnchorY, seconds, petPose);
    }

    if (speakingWeight > 0.01) {
      context.save();
      context.globalAlpha = speakingWeight;
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

    if (printEffectsEnabled && !lowPowerMode) {
      applyPosterizedPrintPass(width, height);
      drawPaperTextureOverlay(width, height);
    }

    rafId = window.requestAnimationFrame(drawFrame);
  }

  function drawPet(anchorX, anchorY, seconds, pose) {
    const isDog = petType === "dog";
    const bodyColor = isDog ? "#b58d60" : "#8a7b72";
    const accentColor = isDog ? "#e6cfb3" : "#d6c3b6";
    const lineColor = isDog ? "#4b3a2d" : "#3e3330";
    const pawColor = blendHexColor(bodyColor, -0.08);

    context.save();
    context.translate(anchorX, anchorY + pose.bounce);
    context.rotate(pose.lean);

    const bodyWidth = isDog ? 50 : 46;
    const bodyHeight = isDog ? 25 : 23;
    const headRadius = isDog ? 12.2 : 11.5;

    const rearLegX = -16;
    const frontLegX = 14;
    const rearLegY = 13;
    const frontLegY = 12;
    const rearLift = pose.rightPawLift * 4.8;
    const frontLift = pose.leftPawLift * 5.2;

    drawLimb(
      rearLegX,
      rearLegY,
      rearLegX - 1.3,
      20 - rearLift,
      3.1,
      pawColor,
      1.2,
      seconds * 10 + 1.5,
      lineColor,
      0,
      1,
      1,
      0,
      0.08
    );
    drawLimb(
      frontLegX,
      frontLegY,
      frontLegX + 1.1,
      20 - frontLift,
      3.1,
      pawColor,
      1.2,
      seconds * 10 + 2.9,
      lineColor,
      0,
      1,
      1,
      0,
      0.08
    );

    context.fillStyle = bodyColor;
    context.strokeStyle = lineColor;
    context.lineWidth = 1.4;
    context.beginPath();
    context.ellipse(0, 0, bodyWidth * 0.5, bodyHeight * 0.5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.save();
    context.translate(bodyWidth * 0.38, -4.2);
    context.rotate(pose.headTilt);
    context.fillStyle = bodyColor;
    context.beginPath();
    context.arc(0, 0, headRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = bodyColor;
    if (isDog) {
      const flop = 2.4 - pose.earPerk * 1.6;
      context.beginPath();
      context.ellipse(-8.6, -6.2 + flop, 4.2, 7.2, -0.35, 0, Math.PI * 2);
      context.ellipse(8.6, -6.2 + flop, 4.2, 7.2, 0.35, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    } else {
      const perk = pose.earPerk * 1.6;
      context.beginPath();
      context.moveTo(-7.8, -6.8);
      context.lineTo(-4.2, -17.6 - perk);
      context.lineTo(-0.8, -7.4);
      context.closePath();
      context.moveTo(7.8, -6.8);
      context.lineTo(4.2, -17.6 - perk);
      context.lineTo(0.8, -7.4);
      context.closePath();
      context.fill();
      context.stroke();
    }

    context.fillStyle = accentColor;
    context.beginPath();
    context.ellipse(0.5, 4.1, 5.9, 4.3, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#2a2421";
    context.beginPath();
    context.arc(-3.8, -1.8, 1.25, 0, Math.PI * 2);
    context.arc(3.8, -1.8, 1.25, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(0.2, 1.8, 1.2, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0.2, 3.1);
    context.quadraticCurveTo(0.8, 4.4, 2.2, 4.9);
    context.moveTo(0.2, 3.1);
    context.quadraticCurveTo(-0.6, 4.4, -2.1, 4.9);
    context.stroke();
    context.restore();

    context.strokeStyle = lineColor;
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.beginPath();
    const tailBaseX = -bodyWidth * 0.5 + 3;
    const tailBaseY = -3;
    const tailLength = isDog ? 20 : 18;
    const tailCurve = pose.tailSwing;
    context.moveTo(tailBaseX, tailBaseY);
    context.quadraticCurveTo(
      tailBaseX - tailLength * 0.48,
      tailBaseY - tailCurve * (isDog ? 4.8 : 6.1),
      tailBaseX - tailLength,
      tailBaseY - 4 - tailCurve * (isDog ? 1.8 : 5.8)
    );
    context.stroke();

    context.restore();
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

  function setEyeStyle(styleName) {
    const nextStyle = String(styleName || "").toLowerCase();
    if (EYE_STYLES.includes(nextStyle)) {
      eyeStyle = nextStyle;
    }
  }

  function setPetType(typeName) {
    const nextType = String(typeName || "").toLowerCase();
    if (PET_TYPES.includes(nextType)) {
      petType = nextType;
    }
  }

  function setPetVisibility(value) {
    petVisible = Boolean(value);
  }

  function setShadowProperties(nextProperties = {}) {
    const parsedOffsetX = Number(nextProperties.offsetX);
    const parsedOffsetY = Number(nextProperties.offsetY);
    const nextFillColor = String(nextProperties.fillColor || "").trim();
    const nextStrokeColor = String(nextProperties.strokeColor || "").trim();

    shadowStyle = {
      ...shadowStyle,
      ...(Number.isFinite(parsedOffsetX) ? { offsetX: parsedOffsetX } : {}),
      ...(Number.isFinite(parsedOffsetY) ? { offsetY: parsedOffsetY } : {}),
      ...(nextFillColor ? { fillColor: nextFillColor } : {}),
      ...(nextStrokeColor ? { strokeColor: nextStrokeColor } : {})
    };
  }

  function setPerspectiveTilt(value) {
    const nextTilt = Number(value);
    if (Number.isFinite(nextTilt)) {
      perspectiveAngle = normalizeAngleDegrees(nextTilt);
    }
  }

  function setHolderVisibility(value) {
    holderVisible = Boolean(value);
  }

  function setPrintEffectsEnabled(value) {
    printEffectsEnabled = Boolean(value);
    if (!printEffectsEnabled) {
      paperTextureCanvas = null;
      paperTextureWidth = 0;
      paperTextureHeight = 0;
      effectMaskCanvas = null;
      effectMaskWidth = 0;
      effectMaskHeight = 0;
    }
  }

  function setAnimationEnabled(value) {
    const nextEnabled = Boolean(value);
    if (animationEnabled === nextEnabled) {
      return;
    }

    animationEnabled = nextEnabled;
    if (!animationEnabled) {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      return;
    }

    lastRenderTimestamp = 0;
    if (rafId === null) {
      rafId = window.requestAnimationFrame(drawFrame);
    }
  }

  function getHolderVisibility() {
    return holderVisible;
  }

  function toggleHolderVisibility() {
    holderVisible = !holderVisible;
    return holderVisible;
  }

  function getShadowProperties() {
    return { ...shadowStyle };
  }

  function getHairStyles() {
    return [...HAIR_STYLES];
  }

  function getBodyTypes() {
    return [...BODY_TYPES];
  }

  function getEyeStyles() {
    return [...EYE_STYLES];
  }

  function getPetTypes() {
    return [...PET_TYPES];
  }

  function getCurrentAnimation() {
    return currentAnimation;
  }

  function getPropAnimations() {
    return Object.keys(PROP_TRANSFORM_DEFAULTS);
  }

  function getPropTransform(animationName) {
    if (!PROP_TRANSFORM_DEFAULTS[animationName]) {
      return null;
    }

    return getResolvedPropTransform(animationName);
  }

  function setPropTransform(animationName, nextTransform = {}) {
    if (!PROP_TRANSFORM_DEFAULTS[animationName]) {
      return false;
    }

    const merged = normalizePropTransform(
      {
        ...getResolvedPropTransform(animationName),
        ...nextTransform
      },
      PROP_TRANSFORM_DEFAULTS[animationName]
    );

    propTransforms[animationName] = merged;
    return true;
  }

  function getAllPropTransforms() {
    return Object.fromEntries(
      Object.keys(PROP_TRANSFORM_DEFAULTS).map((animationName) => [animationName, getResolvedPropTransform(animationName)])
    );
  }

  function exportPropTransforms(animationName = null) {
    if (animationName && PROP_TRANSFORM_DEFAULTS[animationName]) {
      return JSON.stringify(
        {
          propTransforms: {
            [animationName]: getResolvedPropTransform(animationName)
          }
        },
        null,
        2
      );
    }

    return JSON.stringify(
      {
        propTransforms: getAllPropTransforms()
      },
      null,
      2
    );
  }

  function importPropTransforms(rawPayload) {
    const parsed = parsePropTransformPayload(rawPayload);
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, reason: "invalid-payload", applied: [] };
    }

    let candidateTransforms = null;
    if (parsed.propTransforms && typeof parsed.propTransforms === "object") {
      candidateTransforms = parsed.propTransforms;
    } else if (
      typeof parsed.animation === "string" &&
      PROP_TRANSFORM_DEFAULTS[parsed.animation]
    ) {
      candidateTransforms = {
        [parsed.animation]: {
          x: parsed.x,
          y: parsed.y,
          z: parsed.z,
          scale: parsed.scale,
          rotation: parsed.rotation
        }
      };
    } else {
      candidateTransforms = parsed;
    }

    const applied = [];
    Object.entries(candidateTransforms).forEach(([animationName, transform]) => {
      if (!PROP_TRANSFORM_DEFAULTS[animationName] || !transform || typeof transform !== "object") {
        return;
      }

      setPropTransform(animationName, transform);
      applied.push(animationName);
    });

    if (applied.length === 0) {
      return { ok: false, reason: "no-valid-transforms", applied: [] };
    }

    return { ok: true, applied };
  }

  function destroy() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    window.removeEventListener("resize", updateCanvasSize);
    if (typeof lowPowerMediaQuery.removeEventListener === "function") {
      lowPowerMediaQuery.removeEventListener("change", handleLowPowerModeChange);
    } else if (typeof lowPowerMediaQuery.removeListener === "function") {
      lowPowerMediaQuery.removeListener(handleLowPowerModeChange);
    }
  }

  window.addEventListener("resize", updateCanvasSize);
  if (typeof lowPowerMediaQuery.addEventListener === "function") {
    lowPowerMediaQuery.addEventListener("change", handleLowPowerModeChange);
  } else if (typeof lowPowerMediaQuery.addListener === "function") {
    lowPowerMediaQuery.addListener(handleLowPowerModeChange);
  }
  updateCanvasSize();
  playAnimation("idle", { loop: true });
  rafId = window.requestAnimationFrame(drawFrame);

  return {
    setCharacterProperties,
    setHairStyle,
    setBodyType,
    setEyeStyle,
    setPetType,
    setPetVisibility,
    setHolderVisibility,
    setAnimationEnabled,
    setPrintEffectsEnabled,
    getHolderVisibility,
    toggleHolderVisibility,
    setPerspectiveTilt,
    setShadowProperties,
    getHairStyles,
    getBodyTypes,
    getEyeStyles,
    getPetTypes,
    getShadowProperties,
    getCurrentAnimation,
    getPropAnimations,
    getPropTransform,
    getAllPropTransforms,
    setPropTransform,
    exportPropTransforms,
    importPropTransforms,
    playAnimation,
    destroy
  };
}