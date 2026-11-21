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

  const lShoulder = pts[11] || { x: 230, y: 220 };
  const rShoulder = pts[12] || { x: 370, y: 220 };
  const lElbow = pts[13] || { x: 200, y: 340 };
  const rElbow = pts[14] || { x: 400, y: 340 };
  const lWrist = pts[15] || { x: 190, y: 440 };
  const rWrist = pts[16] || { x: 410, y: 440 };
  const lHip = pts[23] || { x: 250, y: 430 };
  const rHip = pts[24] || { x: 350, y: 430 };
  const lAnkle = pts[27] || { x: 240, y: 730 };
  const rAnkle = pts[28] || { x: 360, y: 730 };

  const lArmDeg = Math.round((Math.atan2(lWrist.y - lShoulder.y, lWrist.x - lShoulder.x) * 180) / Math.PI) - 90;
  const rArmDeg = Math.round((Math.atan2(rWrist.y - rShoulder.y, rWrist.x - rShoulder.x) * 180) / Math.PI) - 90;
  const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
  const torsoHeight = ((lHip.y + rHip.y) / 2) - ((lShoulder.y + rShoulder.y) / 2);
  const legLength = ((lAnkle.y + rAnkle.y) / 2) - ((lHip.y + rHip.y) / 2);
  const stanceWidth = Math.hypot(rAnkle.x - lAnkle.x, rAnkle.y - lAnkle.y);

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
  const { leftArmAngle, rightArmAngle, shoulderWidth, legLength, stanceWidth } = skeleton;

  if (category === "top") {
    const sW = Math.max(180, Math.min(320, Math.round(shoulderWidth * 1.65)));
    const sH = Math.max(220, Math.min(340, Math.round(sW * 1.1)));
    const deform: GarmentDeform = {
      leftArmAngle,
      rightArmAngle,
      sleeveLength: 100,
      chestStretch: Math.round((shoulderWidth / 150) * 100),
      legFlare: 0,
      legLength: 100,
      waistStretch: 100,
    };
    return {
      pose: { ...currentPose, width: sW, height: sH, y: 310, deform },
      deform,
    };
  }

  // category === "bottom"
  const legLenFactor = Math.round((legLength / 310) * 100);
  const flareVal = Math.round(((stanceWidth - 100) / 100) * 35);
  const deform: GarmentDeform = {
    leftArmAngle: 0,
    rightArmAngle: 0,
    sleeveLength: 100,
    chestStretch: 100,
    legFlare: Math.max(-25, Math.min(35, flareVal)),
    legLength: Math.max(85, Math.min(125, legLenFactor)),
    waistStretch: Math.round((skeleton.shoulderWidth / 150) * 100),
  };
  return {
    pose: { ...currentPose, width: 220, height: Math.round(340 * (legLenFactor / 100)), y: 550, deform },
    deform,
  };
}
