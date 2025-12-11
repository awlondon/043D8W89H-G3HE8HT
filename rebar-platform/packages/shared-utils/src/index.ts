export function notImplemented(name: string): never {
  throw new Error(`${name} not implemented`);
}

export const logInfo = (message: string) => {
  console.info(`[rebar] ${message}`);
};
