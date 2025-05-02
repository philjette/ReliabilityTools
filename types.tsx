export interface FMEA {
  id: string
  title: string
  asset_type: string
  voltage_rating: string
  operating_environment: string
  age_range: string
  load_profile: string
  asset_criticality: string
  additional_notes?: string
  failure_modes: FailureMode[]
  weibull_parameters: Record<string, { shape: number; scale: number }>
  created_at: string
}

interface MaintenanceAction {
  action: string
  frequency: string
  description: string
  estimatedCost?: number
  annualCost?: number
}

interface FailureMode {
  name: string
  description: string
  severity: number
  occurrence: number
  detection: number
  causes: string[]
  effects: string[]
  recommendations: string[]
  maintenanceActions: MaintenanceAction[]
}
