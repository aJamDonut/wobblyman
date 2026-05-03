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
  "ki-spikes",
  "solar-mane",
  "battle-wave",
  "power-crown",
  "comet-tail",
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

const EYE_STYLES = [
  "classic",
  "sharp",
  "sleepy",
  "round",
  "narrow",
  "spark",
  "sunglasses",
  "eyeglasses",
  "round-glasses",
  "aviators",
  "monocle"
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
  sandwich: { x: 0, y: 0, scale: 1, rotation: 0 },
  shower: { x: 0, y: 0, scale: 1, rotation: 0 },
  wash: { x: 0, y: 0, scale: 1, rotation: 0 },
  dig: {
      "x": 0,
      "y": 13,
      "scale": 1.5,
      "rotation": -98
    },
  search: {
      "x": -16,
      "y": -18,
      "scale": 1.45,
      "rotation": 31
    },
  hunt: { x: 0, y: 0, scale: 1, rotation: 0 },
  cook: { x: 0, y: 0, scale: 1, rotation: 0 }
});


const DEG_TO_RAD = Math.PI / 180;

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

function normalizePropTransformValue(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizePropTransform(transform, defaults) {
  return {
    x: normalizePropTransformValue(transform?.x, defaults.x),
    y: normalizePropTransformValue(transform?.y, defaults.y),
    scale: clamp(normalizePropTransformValue(transform?.scale, defaults.scale), 0.1, 8),
    rotation: normalizePropTransformValue(transform?.rotation, defaults.rotation)
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
    pose.leftArm = { x: -36 + Math.sin(timeSeconds * 5.6) * 2, y: -12 };
    pose.rightArm = { x: 34 + jab * 25, y: -22 + jab * 2 };
    pose.leftLeg = { x: -20 - jab * 4, y: 78 + jab * 2.2 };
    pose.rightLeg = { x: 20 + jab * 4, y: 78 + jab * 1.4 };
  }

  if (animationName === "pushups") {
    const rep = (Math.sin(timeSeconds * 6.8) + 1) * 0.5;
    pose.lean = 0.28;
    pose.bounce = 10 + rep * 8;
    pose.leftArm = { x: -34 + rep * 6, y: -2 + rep * 14 };
    pose.rightArm = { x: 34 - rep * 6, y: -2 + rep * 14 };
    pose.leftLeg = { x: -18 + rep * 4, y: 88 - rep * 8 };
    pose.rightLeg = { x: 18 - rep * 4, y: 88 - rep * 8 };
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
    const stir = Math.sin(timeSeconds * 7.4);
    pose.lean = -0.03;
    pose.bounce = Math.sin(timeSeconds * 5.2) * 1.5;
    pose.leftArm = { x: -22 + stir * 8, y: -34 + Math.cos(timeSeconds * 7.4) * 4 };
    pose.rightArm = { x: 30 + stir * 5, y: -30 + Math.sin(timeSeconds * 7.4) * 4 };
    pose.leftLeg = { x: -18, y: 79.5 + Math.abs(stir) * 0.8 };
    pose.rightLeg = { x: 18, y: 79.5 + Math.abs(stir) * 0.8 };
  }

  return pose;
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

  if (animationName === "working" || animationName === "sandwich") {
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

  function drawRoundedClipPath(x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  }

  let colors = { ...DEFAULT_COLORS };
  let hairStyle = "classic";
  let bodyType = "classic";
  let eyeStyle = "classic";
  let petType = "cat";
  let perspectiveTilt = 0;
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
    const defaults = PROP_TRANSFORM_DEFAULTS[animationName] || { x: 0, y: 0, scale: 1, rotation: 0 };
    const current = propTransforms[animationName] || defaults;
    return normalizePropTransform(current, defaults);
  }

  function getPropPlacement(animationName, baseX, baseY, baseRotationRadians = 0) {
    const transform = getResolvedPropTransform(animationName);
    return {
      x: baseX + transform.x,
      y: baseY + transform.y,
      scale: transform.scale,
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
    jitterScale = 1
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
      const scaledWobble = wobble * motionScale;
      const midX = (rootX + endX) * 0.5 + Math.sin(phase + pass * 0.35) * scaledWobble + jitterX;
      const midY = (rootY + endY) * 0.5 + Math.cos(phase * 1.2 + pass * 0.42) * scaledWobble * 0.55 + jitterY;
      context.beginPath();
      context.moveTo(rootX + jitterX * 0.35, rootY + jitterY * 0.35);
      context.quadraticCurveTo(midX, midY, endX - jitterX * 0.25, endY - jitterY * 0.25);
      context.stroke();
    }

    const resolvedDetailWidth = Number.isFinite(detailWidth) ? detailWidth : Math.max(1.2, thickness * 0.28);
    if (resolvedDetailWidth > 0) {
      context.strokeStyle = detailColor || graphite;
      context.lineWidth = resolvedDetailWidth;
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

    context.save();
    context.globalAlpha = 0.5;
    context.strokeStyle = blendHexColor(color, -0.3);
    context.lineWidth = Math.max(0.9, thickness * 0.5);
    context.beginPath();
    context.moveTo(rootX + 0.8, rootY + 0.9);
    context.quadraticCurveTo(
      (rootX + endX) * 0.5 + Math.sin(phase) * wobble + 0.8,
      (rootY + endY) * 0.5 + Math.cos(phase * 1.2) * wobble * 0.55 + 0.9,
      endX + 0.8,
      endY + 0.9
    );
    context.stroke();

    context.globalAlpha = 0.78;
    context.strokeStyle = blendHexColor(color, 0.36);
    context.lineWidth = Math.max(0.8, thickness * 0.24);
    context.beginPath();
    context.moveTo(rootX - 0.5, rootY - 0.4);
    context.quadraticCurveTo(
      (rootX + endX) * 0.5 + Math.sin(phase) * wobble - 0.5,
      (rootY + endY) * 0.5 + Math.cos(phase * 1.2) * wobble * 0.55 - 0.4,
      endX - 0.5,
      endY - 0.4
    );
    context.stroke();
    context.restore();
  }

  function drawFlatLimb(rootX, rootY, endX, endY, thickness, color, wobble = 0, phase = 0) {
    context.strokeStyle = color;
    context.lineWidth = Math.max(0.8, thickness);
    context.lineCap = "round";
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
    context.stroke();

    context.strokeStyle = "#725639";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(5.8, 5.8);
    context.lineTo(14, 14);
    context.stroke();

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

  function drawKnifeAndCarrot(x, y, tilt = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(tilt);

    context.fillStyle = "#d97a2d";
    context.beginPath();
    context.moveTo(-22, 12);
    context.lineTo(3, 6);
    context.lineTo(3, 18);
    context.closePath();
    context.fill();

    context.strokeStyle = "#4b7b42";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(-22, 12);
    context.lineTo(-28, 7);
    context.moveTo(-22, 12);
    context.lineTo(-28, 14);
    context.stroke();

    context.fillStyle = "#9e6842";
    context.beginPath();
    context.roundRect(3, -16, 8, 12, 2.2);
    context.fill();

    context.fillStyle = "#c5ccd3";
    context.strokeStyle = "#545c64";
    context.lineWidth = 1.3;
    context.beginPath();
    context.moveTo(11, -13);
    context.lineTo(28, -8);
    context.lineTo(11, -3);
    context.closePath();
    context.fill();
    context.stroke();

    context.restore();
  }

  function drawCharacterShaderOutline(pose, leftLegEndY, rightLegEndY, bodyProfile, leftLegRootX, rightLegRootX) {
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
    context.moveTo(leftLegRootX, 18);
    context.quadraticCurveTo((pose.leftLeg.x + leftLegRootX) * 0.5, (leftLegEndY + 18) * 0.5, pose.leftLeg.x, leftLegEndY);
    context.moveTo(rightLegRootX, 18);
    context.quadraticCurveTo((pose.rightLeg.x + rightLegRootX) * 0.5, (rightLegEndY + 18) * 0.5, pose.rightLeg.x, rightLegEndY);
    context.stroke();

    context.beginPath();
    context.ellipse(pose.leftLeg.x - 1, leftLegEndY + 1.5, 10.8, 5.8, 0, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.ellipse(pose.rightLeg.x + 1, rightLegEndY + 1.5, 10.8, 5.8, 0, 0, Math.PI * 2);
    context.stroke();

    context.restore();
  }

  function drawHairStyle(styleName, hairColor, seconds, useOutline = true) {
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
      context.stroke();
      context.beginPath();
      context.roundRect(2.7, -71.2, 12.8, 8.6, 2.6);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-2.7, -67.2);
      context.lineTo(2.7, -67.2);
      context.stroke();
      context.beginPath();
      context.moveTo(-15.5, -67.4);
      context.lineTo(-18.4, -66.2);
      context.moveTo(15.5, -67.4);
      context.lineTo(18.4, -66.2);
      context.stroke();
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
      context.stroke();
      context.beginPath();
      context.moveTo(-2.8, -66.5);
      context.lineTo(2.8, -66.5);
      context.stroke();
      context.beginPath();
      context.moveTo(-15.4, -66.8);
      context.lineTo(-18.8, -65.8);
      context.moveTo(15.4, -66.8);
      context.lineTo(18.8, -65.8);
      context.stroke();

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
      context.stroke();
      context.beginPath();
      context.arc(8.8, -67.2, 5.9, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-2.9, -67.2);
      context.lineTo(2.9, -67.2);
      context.stroke();

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
      context.stroke();
      context.beginPath();
      context.moveTo(3.4, -71.8);
      context.quadraticCurveTo(8.8, -74.2, 14.6, -71.8);
      context.quadraticCurveTo(14.6, -62.8, 8.8, -61.8);
      context.quadraticCurveTo(3.4, -62.8, 3.4, -71.8);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-3.2, -67.4);
      context.lineTo(3.2, -67.4);
      context.stroke();
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
      context.stroke();
      context.beginPath();
      context.moveTo(13.5, -62.8);
      context.lineTo(17.2, -56.8);
      context.lineTo(14.6, -50.8);
      context.stroke();

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
    perspectiveOffsetX = 0
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
      seconds * 7 + 0.5
    );
    drawFlatLimb(
      rightLegRootX + shadowOffsetX,
      18 + shadowOffsetY,
      pose.rightLeg.x,
      rightLegEndY,
      5.5,
      shadowFill,
      4.2 * wobbleScale,
      seconds * 7 + 2.2
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
        4.6 * wobbleScale,
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
        4.6 * wobbleScale,
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
    const sandwichWeight = getAnimationWeight("sandwich", easedMix);
    const showerWeight = getAnimationWeight("shower", easedMix);
    const washWeight = getAnimationWeight("wash", easedMix);
    const digWeight = getAnimationWeight("dig", easedMix);
    const searchWeight = getAnimationWeight("search", easedMix);
    const huntWeight = getAnimationWeight("hunt", easedMix);
    const cookWeight = getAnimationWeight("cook", easedMix);
    const idleWeight = getAnimationWeight("idle", easedMix);
    const perspectiveBlend = clamp(perspectiveTilt / 100, -1, 1);
    const perspectiveStrength = Math.abs(perspectiveBlend);
    const leftLegShiftX = perspectiveBlend < 0
      ? 4.2 * perspectiveStrength
      : 8.4 * perspectiveStrength;
    const rightLegShiftX = perspectiveBlend < 0
      ? -8.4 * perspectiveStrength
      : -4.2 * perspectiveStrength;
    const leftLegRootShiftX = perspectiveBlend < 0
      ? 2.4 * perspectiveStrength
      : 5.2 * perspectiveStrength;
    const rightLegRootShiftX = perspectiveBlend < 0
      ? -5.2 * perspectiveStrength
      : -2.4 * perspectiveStrength;
    const leftArmShiftX = perspectiveBlend < 0
      ? 3.1 * perspectiveStrength
      : 6.2 * perspectiveStrength;
    const rightArmShiftX = perspectiveBlend < 0
      ? -6.2 * perspectiveStrength
      : -3.1 * perspectiveStrength;
    const leftArmRootShiftX = perspectiveBlend < 0
      ? 2 * perspectiveStrength
      : 4.3 * perspectiveStrength;
    const rightArmRootShiftX = perspectiveBlend < 0
      ? -4.3 * perspectiveStrength
      : -2 * perspectiveStrength;
    const isRightArmFront = perspectiveBlend <= 0;
    const facePerspectiveShiftX = perspectiveBlend * 6.2;
    const shadowPerspectiveShiftX = -perspectiveBlend * 15;
    const dampedBounce = pose.bounce * 0.35 * (1 - idleWeight);
    const renderedLean = lerp(pose.lean, 0, idleWeight);
    const wobbleScale = 0.65;
    const bodyProfile = BODY_TYPE_PROFILES[bodyType] || BODY_TYPE_PROFILES.classic;
    const faceSkinColor = blendHexColor(colors.skinColor, 0.04);
    const handOutlineColor = blendHexColor(faceSkinColor, -0.18);

    context.clearRect(0, 0, width, height);

    context.save();
    context.translate(centerX, centerY + dampedBounce);
    context.rotate(renderedLean);
    // Slight skew makes the character feel less flat and more staged.
    context.transform(1, 0, -0.08, 1, 0, 0);

    const perspectivePose = {
      ...pose,
      leftLeg: {
        ...pose.leftLeg,
        x: pose.leftLeg.x + leftLegShiftX
      },
      rightLeg: {
        ...pose.rightLeg,
        x: pose.rightLeg.x + rightLegShiftX
      },
      leftArm: {
        ...pose.leftArm,
        x: pose.leftArm.x + leftArmShiftX
      },
      rightArm: {
        ...pose.rightArm,
        x: pose.rightArm.x + rightArmShiftX
      }
    };

    const idleLockedPose = {
      ...perspectivePose,
      leftLeg: {
        ...perspectivePose.leftLeg,
        x: lerp(perspectivePose.leftLeg.x, -18 + leftLegShiftX, idleWeight),
        y: lerp(perspectivePose.leftLeg.y, 78, idleWeight)
      },
      rightLeg: {
        ...perspectivePose.rightLeg,
        x: lerp(perspectivePose.rightLeg.x, 18 + rightLegShiftX, idleWeight),
        y: lerp(perspectivePose.rightLeg.y, 78, idleWeight)
      }
    };

    const plantedCompensation = dampedBounce * 0.85;
    const leftLegEndY = idleLockedPose.leftLeg.y - plantedCompensation;
    const rightLegEndY = idleLockedPose.rightLeg.y - plantedCompensation;
    const leftLegRootX = -14 + leftLegRootShiftX;
    const rightLegRootX = 14 + rightLegRootShiftX;
    const leftArmRootX = -18 + leftArmRootShiftX;
    const rightArmRootX = 18 + rightArmRootShiftX;

    const drawLeftArmAndHand = () => {
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
      context.lineWidth = 1.2;
      fillShadedEllipse(
        perspectivePose.leftArm.x,
        perspectivePose.leftArm.y,
        8.25,
        6.9,
        faceSkinColor,
        0,
        leftHandShadeDriftX,
        leftHandShadeDriftY
      );
      context.beginPath();
      context.ellipse(perspectivePose.leftArm.x, perspectivePose.leftArm.y, 8.25, 6.9, 0, 0, Math.PI * 2);
      context.stroke();
    };

    const drawRightArmAndHand = () => {
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
      context.lineWidth = 1.2;
      fillShadedEllipse(
        perspectivePose.rightArm.x,
        perspectivePose.rightArm.y,
        8.25,
        6.9,
        faceSkinColor,
        0,
        rightHandShadeDriftX,
        rightHandShadeDriftY
      );
      context.beginPath();
      context.ellipse(perspectivePose.rightArm.x, perspectivePose.rightArm.y, 8.25, 6.9, 0, 0, Math.PI * 2);
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
      shadowPerspectiveShiftX
    );

    // Draw outline under character fills/strokes so it reads as a back edge.
    drawCharacterShaderOutline(idleLockedPose, leftLegEndY, rightLegEndY, bodyProfile, leftLegRootX, rightLegRootX);

    const drawLeftLeg = () => {
      drawLimb(
        leftLegRootX,
        18,
        idleLockedPose.leftLeg.x,
        leftLegEndY,
        5.5,
        colors.pantsColor,
        4.2 * wobbleScale,
        seconds * 7 + 0.5
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
        4.2 * wobbleScale,
        seconds * 7 + 2.2
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

    const pantsHalfWidth = torsoWidth * 0.5;
    const pantsHeight = torsoHeight / 3;
    const torsoBottomY = torsoY + torsoHeight - 1;
    const pantsDrop = Math.max(6, torsoHeight * 0.115);
    const pantsTopY = torsoBottomY - pantsHeight + pantsDrop;
    const pantsCurveY = torsoBottomY + pantsHeight * 0.35 + pantsDrop;
    context.fillStyle = blendHexColor(colors.pantsColor, 0.05);
    context.beginPath();
    context.moveTo(-pantsHalfWidth, pantsTopY);
    context.lineTo(pantsHalfWidth, pantsTopY);
    context.quadraticCurveTo(0, pantsCurveY, -pantsHalfWidth, pantsTopY);
    context.closePath();
    context.fill();

    const headOffsetY = 4;
    context.save();
    context.translate(0, headOffsetY);

    const headShadeDriftX = Math.sin(seconds * 2.1 + pose.lean * 10) * 2;
    const headShadeDriftY = Math.cos(seconds * 1.7 + pose.bounce * 0.06) * 1.5;
    const faceFeatureDriftX = headShadeDriftX * 0.24 + facePerspectiveShiftX;
    const faceFeatureDriftY = headShadeDriftY * 0.2;

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

    drawHairStyle(hairStyle, colors.hairColor, seconds);

    const openEyesAlpha = 1 - sleepWeight;
    if (openEyesAlpha > 0.01) {
      context.save();
      context.globalAlpha = openEyesAlpha;
      context.translate(faceFeatureDriftX, faceFeatureDriftY);
      drawOpenEyes(eyeStyle);
      context.restore();
    }

    if (sleepWeight > 0.01) {
      context.save();
      context.globalAlpha = sleepWeight;
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

    context.strokeStyle = "#3b3029";
    context.lineWidth = 1.8;
    context.lineCap = "round";
    context.save();
    context.translate(faceFeatureDriftX, faceFeatureDriftY);
    context.beginPath();
    const talkOpen = talkWeight * ((Math.sin(seconds * 18) + 1) * 0.5);
    context.moveTo(-7, -58);
    context.quadraticCurveTo(0, -53 + talkOpen * 3.5, 8, -58);
    context.stroke();
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
        -0.22 + Math.sin(seconds * 6) * 0.05
      );
      context.save();
      context.globalAlpha = sandwichWeight;
      context.translate(sandwichPlacement.x, sandwichPlacement.y);
      context.rotate(sandwichPlacement.rotation);
      context.scale(sandwichPlacement.scale, sandwichPlacement.scale);
      drawSandwich(0, 0, 0);
      context.restore();
    }

    if (showerWeight > 0.01) {
      const showerPlacement = getPropPlacement("shower", 0, -86, 0);
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
        0
      );
      const washPlacementRight = getPropPlacement(
        "wash",
        perspectivePose.rightArm.x - 6,
        perspectivePose.rightArm.y - 2,
        0
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
        0.4 + Math.sin(seconds * 5.4) * 0.1
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
        -0.18 + Math.sin(seconds * 2.8) * 0.08
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
        -0.1 + Math.sin(seconds * 4.8) * 0.05
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
      const cookPlacement = getPropPlacement(
        "cook",
        (perspectivePose.leftArm.x + perspectivePose.rightArm.x) * 0.5,
        (perspectivePose.leftArm.y + perspectivePose.rightArm.y) * 0.5 - 6,
        -0.12 + Math.sin(seconds * 7.4) * 0.05
      );
      context.save();
      context.globalAlpha = cookWeight;
      context.translate(cookPlacement.x, cookPlacement.y);
      context.rotate(cookPlacement.rotation);
      context.scale(cookPlacement.scale, cookPlacement.scale);
      drawKnifeAndCarrot(0, 0, 0);
      context.restore();
    }

    // Draw the arm that's closer to the camera in front of the body.
    if (isRightArmFront) {
      drawRightArmAndHand();
    } else {
      drawLeftArmAndHand();
    }

    context.restore();

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
      perspectiveTilt = clamp(nextTilt, -100, 100);
    }
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
  }

  window.addEventListener("resize", updateCanvasSize);
  updateCanvasSize();
  playAnimation("idle", { loop: true });
  rafId = window.requestAnimationFrame(drawFrame);

  return {
    setCharacterProperties,
    setHairStyle,
    setBodyType,
    setEyeStyle,
    setPetType,
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