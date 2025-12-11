export interface BendRule {
  barSize: string;
  angle: number;
  stretchAllowance: number;
}

export interface ShapeInput {
  barSize: string;
  targetDimensions: number;
  bendAngles: number[];
}

export function computeFeedLength(shape: ShapeInput, rule: BendRule): number {
  const adjusted = shape.targetDimensions - rule.stretchAllowance;
  return Number(adjusted.toFixed(3));
}

export function generateBendMarks(shape: ShapeInput, rule: BendRule): number[] {
  return shape.bendAngles.map((angle, idx) => computeFeedLength({ ...shape, bendAngles: [angle] }, rule) + idx * 2);
}
