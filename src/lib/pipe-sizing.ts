export type PipeSize = {
  id: string;
  label: string;
  od_mm: number;
  id_mm: number;
};

export const PIPE_SIZES: PipeSize[] = [
  { id: "copper-15", label: "15 mm copper", od_mm: 15, id_mm: 13.6 },
  { id: "copper-22", label: "22 mm copper", od_mm: 22, id_mm: 20.2 },
  { id: "copper-28", label: "28 mm copper", od_mm: 28, id_mm: 25.6 },
  { id: "copper-35", label: "35 mm copper", od_mm: 35, id_mm: 32.6 },
  { id: "copper-42", label: "42 mm copper", od_mm: 42, id_mm: 39.2 },
  { id: "copper-54", label: "54 mm copper", od_mm: 54, id_mm: 50.8 },
  { id: "steel-15", label: "15 mm steel (½\")", od_mm: 21.3, id_mm: 15.8 },
  { id: "steel-20", label: "20 mm steel (¾\")", od_mm: 26.9, id_mm: 20.9 },
  { id: "steel-25", label: "25 mm steel (1\")", od_mm: 33.7, id_mm: 26.6 },
  { id: "steel-32", label: "32 mm steel (1¼\")", od_mm: 42.4, id_mm: 35.1 },
];

const GAS_DENSITY_KG_M3 = 0.717;
const GAS_VISCOSITY_PA_S = 1.1e-5;
const PIPE_ROUGHNESS_M = 0.0000015;
const GROSS_KWH_PER_M3 = 10.76;

export type PipeSizingInput = {
  heatInputKw?: number | null;
  flowM3H?: number | null;
  idMm: number;
  lengthM: number;
  targetDropMbar?: number;
  fittingsAllowancePct?: number;
};

export type PipeSizingResult = {
  flowM3H: number;
  heatInputKw: number;
  velocityMs: number;
  reynolds: number;
  frictionFactor: number;
  dropMbar: number;
  maxFlowM3H: number;
  maxKw: number;
  targetDropMbar: number;
  adequate: boolean;
  warnings: string[];
};

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits));
}

function frictionFactor(reynolds: number, diameterM: number) {
  if (reynolds <= 0) return 0;
  if (reynolds < 2300) return 64 / Math.max(reynolds, 1e-6);
  const relativeRoughness = PIPE_ROUGHNESS_M / diameterM;
  const term = relativeRoughness / 3.7 + 5.74 / Math.pow(reynolds, 0.9);
  return 0.25 / Math.pow(Math.log10(term), 2);
}

export function pressureDropMbar({
  flowM3H,
  idMm,
  lengthM,
  fittingsAllowancePct = 10,
}: {
  flowM3H: number;
  idMm: number;
  lengthM: number;
  fittingsAllowancePct?: number;
}) {
  const diameterM = Math.max(Number(idMm), 1) / 1000;
  const length = Math.max(Number(lengthM), 0.01);
  const flow = Math.max(Number(flowM3H), 0);
  const areaM2 = (Math.PI * diameterM * diameterM) / 4;
  const flowM3S = flow / 3600;
  const velocityMs = flowM3S / areaM2;
  const reynolds = (GAS_DENSITY_KG_M3 * velocityMs * diameterM) / GAS_VISCOSITY_PA_S;
  const factor = frictionFactor(reynolds, diameterM);
  const dynamicPressurePa = 0.5 * GAS_DENSITY_KG_M3 * velocityMs * velocityMs;
  const fittingMultiplier = 1 + Math.max(Number(fittingsAllowancePct), 0) / 100;
  const dropPa = factor * (length / diameterM) * dynamicPressurePa * fittingMultiplier;

  return {
    velocityMs: round(velocityMs, 2),
    reynolds: Math.round(reynolds),
    frictionFactor: round(factor, 4),
    dropMbar: round(dropPa / 100, 2),
  };
}

export function maxFlowForDrop({
  idMm,
  lengthM,
  targetDropMbar,
  fittingsAllowancePct = 10,
}: {
  idMm: number;
  lengthM: number;
  targetDropMbar: number;
  fittingsAllowancePct?: number;
}) {
  const target = Math.max(Number(targetDropMbar), 0);
  if (target <= 0) return 0;

  let low = 0.0001;
  let high = 500;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const drop = pressureDropMbar({ flowM3H: mid, idMm, lengthM, fittingsAllowancePct }).dropMbar;
    if (drop > target) high = mid;
    else low = mid;
  }
  return round(low, 3);
}

export function calculatePipeSizing(input: PipeSizingInput): PipeSizingResult {
  const targetDropMbar = Number(input.targetDropMbar ?? 1);
  const fittingsAllowancePct = Number(input.fittingsAllowancePct ?? 10);
  const flowM3H =
    input.flowM3H !== undefined && input.flowM3H !== null
      ? Math.max(Number(input.flowM3H), 0)
      : Math.max(Number(input.heatInputKw ?? 0), 0) / GROSS_KWH_PER_M3;

  const current = pressureDropMbar({
    flowM3H,
    idMm: input.idMm,
    lengthM: input.lengthM,
    fittingsAllowancePct,
  });

  const maxFlowM3H = maxFlowForDrop({
    idMm: input.idMm,
    lengthM: input.lengthM,
    targetDropMbar,
    fittingsAllowancePct,
  });

  const warnings: string[] = [];
  if (current.velocityMs > 20) warnings.push("Velocity is above 20 m/s. Consider a larger pipe.");
  if (flowM3H <= 0) warnings.push("Enter the heat input or gas rate to size the pipe.");

  return {
    flowM3H: round(flowM3H, 3),
    heatInputKw: round(flowM3H * GROSS_KWH_PER_M3, 1),
    velocityMs: current.velocityMs,
    reynolds: current.reynolds,
    frictionFactor: current.frictionFactor,
    dropMbar: current.dropMbar,
    maxFlowM3H,
    maxKw: round(maxFlowM3H * GROSS_KWH_PER_M3, 1),
    targetDropMbar: round(targetDropMbar, 2),
    adequate: flowM3H > 0 && current.dropMbar <= targetDropMbar,
    warnings,
  };
}

export function pipeSizeTable({
  lengthM,
  targetDropMbar,
  fittingsAllowancePct = 10,
}: {
  lengthM: number;
  targetDropMbar: number;
  fittingsAllowancePct?: number;
}) {
  return PIPE_SIZES.map((size) => {
    const maxFlowM3H = maxFlowForDrop({
      idMm: size.id_mm,
      lengthM,
      targetDropMbar,
      fittingsAllowancePct,
    });
    return {
      ...size,
      maxFlowM3H,
      maxKw: round(maxFlowM3H * GROSS_KWH_PER_M3, 1),
    };
  });
}
