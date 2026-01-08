export class ValidationError extends Error {
  readonly specKey?: string;
  readonly partId?: string;
  readonly lengthIn?: number;

  constructor(message: string, details?: { specKey?: string; partId?: string; lengthIn?: number }) {
    super(message);
    this.name = 'ValidationError';
    this.specKey = details?.specKey;
    this.partId = details?.partId;
    this.lengthIn = details?.lengthIn;
  }
}

export class InsufficientStockError extends Error {
  readonly specKey: string;
  readonly partId: string;
  readonly lengthIn: number;

  constructor(message: string, details: { specKey: string; partId: string; lengthIn: number }) {
    super(message);
    this.name = 'InsufficientStockError';
    this.specKey = details.specKey;
    this.partId = details.partId;
    this.lengthIn = details.lengthIn;
  }
}

export class InfeasiblePartError extends Error {
  readonly specKey: string;
  readonly partId: string;
  readonly lengthIn: number;

  constructor(message: string, details: { specKey: string; partId: string; lengthIn: number }) {
    super(message);
    this.name = 'InfeasiblePartError';
    this.specKey = details.specKey;
    this.partId = details.partId;
    this.lengthIn = details.lengthIn;
  }
}
