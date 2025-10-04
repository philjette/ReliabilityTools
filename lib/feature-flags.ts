// Feature flags for the application
export const featureFlags = {
  showRiskMatrix: true,
  showWeibullCharts: true,
  showMaintenanceRecommendations: true,
  allowCustomAssetTypes: true,
} as const

export type FeatureFlagKey = keyof typeof featureFlags

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag] ?? false
}
