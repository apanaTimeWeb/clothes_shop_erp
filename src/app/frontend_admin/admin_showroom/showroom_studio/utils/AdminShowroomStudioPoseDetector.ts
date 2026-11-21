import type { StudioPose, GarmentDeform } from "@/app/frontend_admin/admin_showroom/showroom_studio/utils/AdminShowroomStudioPhoto";

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface DetectedSkeleton {
  landmarks: LandmarkPoint[];
  leftArmAngle: number;
  rightArmAngle: number;
  shoulderWidth: number;
  torsoHeight: number;
  legLength: number;
  stanceWidth: number;
}

let landmarkerPromise: Promise<any> | null = null;

async function getPoseLandmarker(): Promise<any> {
  if (typeof window === "undefined") return null;
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        return await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numPoses: 1,
        });
      } catch (err) {
        console.warn("MediaPipe Pose load bypassed, using on-device geometry:", err);
        return null;
      }
    })();
  }
  return landmarkerPromise;
}

const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

export function drawSkeleton(ctx: CanvasRenderingContext2D, skeleton: DetectedSkeleton) {
  const { landmarks } = skeleton;
  if (!landmarks || landmarks.length < 29) return;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(59, 130, 246, 0.85)";
  ctx.fillStyle = "#38bdf8";

  // Draw bone lines
  POSE_CONNECTIONS.forEach(([start, end]) => {
    const a = landmarks[start], b = landmarks[end];
    if (a && b) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  });

  // Draw joint dots
  [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
    const pt = landmarks[idx];
    if (pt) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
  ctx.restore();
}

function parseLandmarks(normLandmarks: LandmarkPoint[], width = 600, height = 800): DetectedSkeleton {
  const pts = normLandmarks.map((p) => ({
    x: p.x * width,
    y: p.y * height,
    z: p.z,
    visibility: p.visibility,
  }));

  const lS = pts[11] || { x: 230, y: 220 }, rS = pts[12] || { x: 370, y: 220 };
  const lW = pts[15] || { x: 190, y: 440 }, rW = pts[16] || { x: 410, y: 440 };
  const lH = pts[23] || { x: 250, y: 430 }, rH = pts[24] || { x: 350, y: 430 };
  const lA = pts[27] || { x: 240, y: 730 }, rA = pts[28] || { x: 360, y: 730 };

  const lArmDeg = Math.round((Math.atan2(lW.y - lS.y, lW.x - lS.x) * 180) / Math.PI) - 90;
  const rArmDeg = Math.round((Math.atan2(rW.y - rS.y, rW.x - rS.x) * 180) / Math.PI) - 90;
  const shoulderWidth = Math.hypot(rS.x - lS.x, rS.y - lS.y);
  const torsoHeight = ((lH.y + rH.y) / 2) - ((lS.y + rS.y) / 2);
  const legLength = ((lA.y + rA.y) / 2) - ((lH.y + rH.y) / 2);
  const stanceWidth = Math.hypot(rA.x - lA.x, rA.y - lA.y);

  return {
    landmarks: pts,
    leftArmAngle: Math.max(-45, Math.min(45, lArmDeg)),
    rightArmAngle: Math.max(-45, Math.min(45, -rArmDeg)),
    shoulderWidth,
    torsoHeight,
    legLength,
    stanceWidth,
  };
}

export function getPresetSkeleton(modelId = "male-photo"): DetectedSkeleton {
  const isFemale = modelId.includes("female");
  const isMannequin = modelId.includes("mannequin");

  const baseShoulderW = isMannequin ? 150 : isFemale ? 135 : 155;
  const sY = 220, eY = 330, wY = 430, hY = 410, kY = 560, aY = 720;
  const centerX = 300;

  const pts: LandmarkPoint[] = Array(33).fill({ x: centerX, y: 400 });
  pts[11] = { x: centerX - baseShoulderW / 2, y: sY }; // Left Shoulder
  pts[12] = { x: centerX + baseShoulderW / 2, y: sY }; // Right Shoulder
  pts[13] = { x: centerX - baseShoulderW / 2 - 25, y: eY }; // Left Elbow
  pts[14] = { x: centerX + baseShoulderW / 2 + 25, y: eY }; // Right Elbow
  pts[15] = { x: centerX - baseShoulderW / 2 - 35, y: wY }; // Left Wrist
  pts[16] = { x: centerX + baseShoulderW / 2 + 35, y: wY }; // Right Wrist
  pts[23] = { x: centerX - 55, y: hY }; // Left Hip
  pts[24] = { x: centerX + 55, y: hY }; // Right Hip
  pts[25] = { x: centerX - 50, y: kY }; // Left Knee
  pts[26] = { x: centerX + 50, y: kY }; // Right Knee
  pts[27] = { x: centerX - 55, y: aY }; // Left Ankle
  pts[28] = { x: centerX + 55, y: aY }; // Right Ankle

  return {
    landmarks: pts,
    leftArmAngle: -12,
    rightArmAngle: 12,
    shoulderWidth: baseShoulderW,
    torsoHeight: hY - sY,
    legLength: aY - hY,
    stanceWidth: 110,
  };
}

export async function detectModelPose(
  imageOrCanvas: HTMLImageElement | HTMLCanvasElement,
  modelId?: string,
): Promise<DetectedSkeleton> {
  try {
    const landmarker = await getPoseLandmarker();
    if (landmarker) {
      const res = landmarker.detect(imageOrCanvas);
      if (res && res.landmarks && res.landmarks[0] && res.landmarks[0].length >= 29) {
        return parseLandmarks(res.landmarks[0] as LandmarkPoint[], 600, 800);
      }
    }
  } catch (err) {
    console.warn("Pose detection error, fallback to preset skeleton:", err);
  }
  return getPresetSkeleton(modelId);
}

export function autoAlignGarmentToSkeleton(
  category: "top" | "bottom",
  skeleton: DetectedSkeleton,
  currentPose: StudioPose,
): { pose: StudioPose; deform: GarmentDeform } {
  const { landmarks, leftArmAngle, rightArmAngle, shoulderWidth, torsoHeight, legLength, stanceWidth } = skeleton;
  const lS = landmarks[11] || { x: 230, y: 220 }, rS = landmarks[12] || { x: 370, y: 220 };
  const lH = landmarks[23] || { x: 250, y: 430 }, rH = landmarks[24] || { x: 350, y: 430 };

  if (category === "top") {
    const centerX = Math.round((lS.x + rS.x) / 2);
    const centerY = Math.round(((lS.y + rS.y) / 2) + Math.max(70, torsoHeight * 0.44));
    const sW = Math.max(180, Math.min(340, Math.round(shoulderWidth * 1.65)));
    const sH = Math.max(220, Math.min(360, Math.round(sW * 1.08)));
    const tilt = Math.round((Math.atan2(rS.y - lS.y, rS.x - lS.x) * 180) / Math.PI);

    const deform: GarmentDeform = {
      leftArmAngle,
      rightArmAngle,
      sleeveLength: Math.max(80, Math.min(130, Math.round((torsoHeight / 210) * 100))),
      chestStretch: Math.max(85, Math.min(125, Math.round((shoulderWidth / 150) * 100))),
      legFlare: 0,
      legLength: 100,
      waistStretch: 100,
    };
    return {
      pose: { ...currentPose, x: centerX, y: centerY, width: sW, height: sH, rotation: tilt, deform },
      deform,
    };
  }

  // category === "bottom"
  const centerX = Math.round((lH.x + rH.x) / 2);
  const hipY = (lH.y + rH.y) / 2;
  const centerY = Math.round(hipY + Math.max(100, legLength * 0.44));
  const hipW = Math.hypot(rH.x - lH.x, rH.y - lH.y);
  const pW = Math.max(180, Math.min(280, Math.round(hipW * 2.15)));
  const pH = Math.max(240, Math.min(420, Math.round(legLength * 1.06)));
  const tilt = Math.round((Math.atan2(rH.y - lH.y, rH.x - lH.x) * 180) / Math.PI);

  const flareVal = Math.round(((stanceWidth - 100) / 100) * 35);
  const deform: GarmentDeform = {
    leftArmAngle: 0,
    rightArmAngle: 0,
    sleeveLength: 100,
    chestStretch: 100,
    legFlare: Math.max(-25, Math.min(35, flareVal)),
    legLength: Math.max(85, Math.min(125, Math.round((legLength / 310) * 100))),
    waistStretch: Math.max(85, Math.min(125, Math.round((hipW / 100) * 100))),
  };
  return {
    pose: { ...currentPose, x: centerX, y: centerY, width: pW, height: pH, rotation: tilt, deform },
    deform,
  };
}
