import { AuthStatusDebug } from "@/components/auth-status-debug"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function GeneratePage() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
          <CardDescription>Enter a prompt to generate content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="prompt">Prompt</Label>
                <Input id="prompt" placeholder="Enter your prompt here." />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button>Generate</Button>
        </CardFooter>
      </Card>

      {/* Example Debug Tools - Replace with your actual debug components */}
      <div className="mt-8">
        <h3>Debug Tools</h3>
        <p>This is a placeholder for your debug tools.</p>
        {/* Add your debug components here */}
      </div>

      <div className="mt-8">
        <AuthStatusDebug />
      </div>
    </div>
  )
}
