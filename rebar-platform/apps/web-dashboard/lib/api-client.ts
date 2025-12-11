export const apiClient = {
  get: async (path: string) => {
    throw new Error(`api client not wired yet: ${path}`);
  },
};
