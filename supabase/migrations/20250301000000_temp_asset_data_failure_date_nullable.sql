-- Allow null failure_date: null means right-censored (asset survived at least up to observation time)
ALTER TABLE temp_asset_data
  ALTER COLUMN failure_date DROP NOT NULL;
