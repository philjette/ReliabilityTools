-- Create temporary asset data table
CREATE TABLE IF NOT EXISTS temp_asset_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  installation_date DATE NOT NULL,
  failure_date DATE NOT NULL,
  failure_time_hours NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weibull curves table
CREATE TABLE IF NOT EXISTS weibull_curves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curve_name TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  shape_parameter NUMERIC NOT NULL,
  scale_parameter NUMERIC NOT NULL,
  mttf NUMERIC NOT NULL,
  total_failures INTEGER NOT NULL,
  data_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temp_asset_data_user_id ON temp_asset_data(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_asset_data_created_at ON temp_asset_data(created_at);
CREATE INDEX IF NOT EXISTS idx_weibull_curves_user_id ON weibull_curves(user_id);
CREATE INDEX IF NOT EXISTS idx_weibull_curves_created_at ON weibull_curves(created_at);

-- Enable Row Level Security
ALTER TABLE temp_asset_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weibull_curves ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for temp_asset_data
CREATE POLICY "Users can insert their own temp asset data" ON temp_asset_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own temp asset data" ON temp_asset_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own temp asset data" ON temp_asset_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for weibull_curves
CREATE POLICY "Users can insert their own weibull curves" ON weibull_curves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own weibull curves" ON weibull_curves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weibull curves" ON weibull_curves
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weibull curves" ON weibull_curves
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to clean up old temp data (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_temp_data()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_asset_data 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weibull_curves_updated_at
  BEFORE UPDATE ON weibull_curves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
