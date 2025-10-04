import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EnvChecker } from "@/components/env-checker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function SetupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Environment Setup</h1>
            <p className="text-xl text-gray-600">Configure your environment variables to enable all features</p>
          </div>

          <EnvChecker />

          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to configure your environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Step 1: Supabase Configuration</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Settings → API</li>
                  <li>Copy your Project URL and anon/public key</li>
                  <li>
                    Based on the existing configuration, your values should be:
                    <div className="mt-2 p-3 bg-gray-50 rounded-md font-mono text-sm">
                      <div>NEXT_PUBLIC_SUPABASE_URL=https://yneznljakdqyhkrnqors.supabase.co</div>
                      <div className="mt-1">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...</div>
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 2: OpenAI Configuration</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to OpenAI platform (platform.openai.com)</li>
                  <li>Navigate to API Keys section</li>
                  <li>Create a new API key</li>
                  <li>
                    Add it to your environment:
                    <div className="mt-2 p-3 bg-gray-50 rounded-md font-mono text-sm">
                      OPENAI_API_KEY=sk-...your-key-here
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 3: Local Development</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Create a file named .env.local in your project root</li>
                  <li>Copy the contents from .env.local.example</li>
                  <li>Fill in your actual values</li>
                  <li>Restart your development server</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 4: Vercel Deployment</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to your Vercel project dashboard</li>
                  <li>Navigate to Settings → Environment Variables</li>
                  <li>Add each variable with its corresponding value</li>
                  <li>Redeploy your project</li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <p>• Variables starting with NEXT_PUBLIC_ are exposed to the browser</p>
                  <p>• Never commit .env.local to version control</p>
                  <p>• Restart your dev server after changing environment variables</p>
                  <p>• Check the browser console for any auth errors</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>Create the required database table in Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">Run this SQL in your Supabase SQL Editor to create the fmeas table:</p>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                {`CREATE TABLE fmeas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  voltage_rating TEXT,
  operating_environment TEXT,
  age_range TEXT,
  load_profile TEXT,
  asset_criticality TEXT,
  additional_notes TEXT,
  failure_modes JSONB NOT NULL,
  weibull_parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE fmeas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own FMEAs"
  ON fmeas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FMEAs"
  ON fmeas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FMEAs"
  ON fmeas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FMEAs"
  ON fmeas FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX fmeas_user_id_idx ON fmeas(user_id);
CREATE INDEX fmeas_created_at_idx ON fmeas(created_at DESC);`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
