"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function checkDatabaseSchema() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Check if the fmeas table exists
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (tablesError) {
      return {
        success: false,
        error: `Error checking tables: ${tablesError.message}`,
        tables: [],
      }
    }

    const tableNames = tables.map((t) => t.table_name)
    const hasFmeasTable = tableNames.includes("fmeas")

    if (!hasFmeasTable) {
      return {
        success: false,
        error: "The 'fmeas' table does not exist in the database",
        tables: tableNames,
      }
    }

    // Check the columns in the fmeas table
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "fmeas")
      .eq("table_schema", "public")

    if (columnsError) {
      return {
        success: false,
        error: `Error checking columns: ${columnsError.message}`,
        tables: tableNames,
        columns: [],
      }
    }

    const columnNames = columns.map((c) => c.column_name)
    const requiredColumns = [
      "id",
      "user_id",
      "title",
      "asset_type",
      "voltage_rating",
      "operating_environment",
      "age_range",
      "load_profile",
      "asset_criticality",
      "additional_notes",
      "failure_modes",
      "weibull_parameters",
      "created_at",
    ]

    const missingColumns = requiredColumns.filter((col) => !columnNames.includes(col))

    if (missingColumns.length > 0) {
      return {
        success: false,
        error: `Missing columns in 'fmeas' table: ${missingColumns.join(", ")}`,
        tables: tableNames,
        columns: columnNames,
        missingColumns,
      }
    }

    return {
      success: true,
      tables: tableNames,
      columns: columnNames,
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function createFmeasTable() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Create the fmeas table if it doesn't exist
    const { error } = await supabase.rpc("create_fmeas_table_if_not_exists")

    if (error) {
      return {
        success: false,
        error: `Error creating table: ${error.message}`,
      }
    }

    return {
      success: true,
      message: "Table created or already exists",
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
