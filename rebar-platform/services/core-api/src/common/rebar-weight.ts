export const WEIGHT_PER_FOOT_LBS: Record<string, number> = {
  '#3': 0.376,
  '#4': 0.668,
  '#5': 1.043,
  '#6': 1.502,
  '#7': 2.044,
  '#8': 2.67,
};

export function computePieceWeightLbs(barSize: string, lengthInches: number): number {
  const perFoot = WEIGHT_PER_FOOT_LBS[barSize];
  if (!perFoot) {
    throw new Error(`Unknown bar size: ${barSize}`);
  }
  const lengthFeet = lengthInches / 12;
  return perFoot * lengthFeet;
}
