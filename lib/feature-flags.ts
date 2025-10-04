export const featureFlags = {
  showRiskMatrix: true,
  enableAdvancedFiltering: false,
  enableRULPrediction: false,
  enableUserRoles: false,
  enableCustomReports: false,
}

export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature]
}
