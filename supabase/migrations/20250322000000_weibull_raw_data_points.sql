-- Add raw_data_points column to store the original data points used to fit the curve
-- This allows visualizing the actual data points on the Weibull chart
ALTER TABLE weibull_curves
  ADD COLUMN IF NOT EXISTS raw_data_points JSONB;

COMMENT ON COLUMN weibull_curves.raw_data_points IS 'Array of data points used to fit the curve: [{ time_hours: number, censored: boolean }]. Each point represents either a failure time or a censored observation time.';
