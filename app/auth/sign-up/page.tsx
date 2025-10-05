"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Loader2, AlertCircle, CheckCircle2, Mail, Info } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signUpData, setSignUpData] = useState<any>(null)
  const { signUp, signInWithGoogle, error: authError } = useAuth()
  const router = useRouter()

  // Check if Supabase is configured
  const hasSupabaseConfig =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL !== "undefined" &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "undefined"

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSuccess(false)

    if (!hasSupabaseConfig) {
      setFormError("Authentication is not properly configured. Please set up your Supabase environment variables.")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password)

      if (result.error) {
        setFormError(result.error)
        setLoading(false)
      } else if (result.data) {
        setSignUpData(result.data)
        setSuccess(true)
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setFormError("")

    if (!hasSupabaseConfig) {
      setFormError("Authentication is not properly configured. Please set up your Supabase environment variables.")
      return
    }

    setLoading(true)

    try {
      console.log("Starting Google sign-up...")
      const result = await signInWithGoogle()

      if (result.error) {
        console.error("Google sign-up error:", result.error)
        setFormError(result.error)
        setLoading(false)
      } else {
        console.log("Google sign-up initiated successfully")
        // Don't set loading to false here as the user will be redirected
      }
    } catch (err: any) {
      console.error("Google sign-up exception:", err)
      setFormError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleSkipVerification = () => {
    // For development: redirect to sign-in
    router.push("/auth/sign-in")
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Configuration Required</CardTitle>
              <CardDescription>Supabase authentication is not configured</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  Please configure your Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and
                  NEXT_PUBLIC_SUPABASE_ANON_KEY) to enable authentication.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (success) {
    // Check if user was created but needs email confirmation
    const needsEmailConfirmation = signUpData?.user && !signUpData?.session

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                {needsEmailConfirmation ? (
                  <Mail className="h-12 w-12 text-blue-500" />
                ) : (
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold">
                {needsEmailConfirmation ? "Check your email" : "Account created!"}
              </CardTitle>
              <CardDescription>
                {needsEmailConfirmation ? (
                  <>
                    We've sent a confirmation link to <strong>{email}</strong>
                  </>
                ) : (
                  "Your account has been created successfully"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsEmailConfirmation ? (
                <>
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Click the link in the email to verify your account and complete the sign-up process.
                    </AlertDescription>
                  </Alert>

                  <Alert variant="default" className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      <strong>Not receiving emails?</strong>
                      <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                        <li>Check your spam/junk folder</li>
                        <li>Verify Supabase email settings in your dashboard</li>
                        <li>For development, you can disable email confirmation in Supabase</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Button onClick={() => router.push("/auth/sign-in")} className="w-full">
                      Go to Sign In
                    </Button>
                    <Button onClick={handleSkipVerification} variant="outline" className="w-full bg-transparent">
                      Continue Without Verification (Dev Only)
                    </Button>
                  </div>
                </>
              ) : (
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              )}

              <div className="text-center">
                <Link href="/auth/sign-up" className="text-sm text-primary hover:underline">
                  Try signing up again
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(formError || authError) && (
              <Alert variant="destructive">
                <AlertDescription>{formError || authError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              {loading ? "Signing up..." : "Sign up with Google"}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
