-- Create a function to create the fmeas table if it doesn't exist
CREATE OR REPLACE FUNCTION create_fmeas_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fmeas'
  ) THEN
    -- Create the table
    CREATE TABLE public.fmeas (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      title TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      voltage_rating TEXT NOT NULL,
      operating_environment TEXT NOT NULL,
      age_range TEXT NOT NULL,
      load_profile TEXT NOT NULL,
      asset_criticality TEXT NOT NULL,
      additional_notes TEXT,
      failure_modes JSONB NOT NULL,
      weibull_parameters JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add RLS policies
    ALTER TABLE public.fmeas ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow users to see only their own FMEAs
    CREATE POLICY "Users can view their own FMEAs" 
      ON public.fmeas FOR SELECT 
      USING (auth.uid() = user_id);
    
    -- Create policy to allow users to insert their own FMEAs
    CREATE POLICY "Users can insert their own FMEAs" 
      ON public.fmeas FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    -- Create policy to allow users to update their own FMEAs
    CREATE POLICY "Users can update their own FMEAs" 
      ON public.fmeas FOR UPDATE 
      USING (auth.uid() = user_id);
    
    -- Create policy to allow users to delete their own FMEAs
    CREATE POLICY "Users can delete their own FMEAs" 
      ON public.fmeas FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;
