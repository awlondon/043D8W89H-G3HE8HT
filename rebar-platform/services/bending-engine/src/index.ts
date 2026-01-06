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

function computeAngleAllowance(angle: number, stretchAllowance: number): number {
  const normalized = Math.min(Math.max(angle, 0), 180);
  return (normalized / 180) * stretchAllowance;
}

export function computeFeedLength(shape: ShapeInput, rule: BendRule): number {
  const baseLength = shape.targetDimensions;
  const allowance = shape.bendAngles.reduce((sum, angle) => sum + computeAngleAllowance(angle, rule.stretchAllowance), 0);
  const total = baseLength + allowance;
  return Number(total.toFixed(3));
}

export function generateBendMarks(shape: ShapeInput, rule: BendRule): number[] {
  if (shape.bendAngles.length === 0) return [];

  const perSegment = shape.targetDimensions / shape.bendAngles.length;
  let cursor = 0;
  const marks: number[] = [];

  shape.bendAngles.forEach((angle) => {
    cursor += perSegment + computeAngleAllowance(angle, rule.stretchAllowance) / 2;
    marks.push(Number(cursor.toFixed(3)));
  });

  return marks;
}
