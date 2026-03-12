-- Add optional dual fit (complete-only + right-censored) for saved Weibull analyses
ALTER TABLE weibull_curves
  ADD COLUMN IF NOT EXISTS dual_fit JSONB;

COMMENT ON COLUMN weibull_curves.dual_fit IS 'When present: { complete_only: { shape_parameter, scale_parameter, total_failures, data_points }, with_censored: { shape_parameter, scale_parameter, total_failures, data_points } }. MTTF is shared.';
