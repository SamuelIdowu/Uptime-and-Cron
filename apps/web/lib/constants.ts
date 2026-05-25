export const PLAN_LIMITS = {
  free: {
    maxMonitors: 10,
    minIntervalMinutes: 5,
  },
  paid: {
    maxMonitors: 100, // Or unlimited for MVP
    minIntervalMinutes: 1,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
