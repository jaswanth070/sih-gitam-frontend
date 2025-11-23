"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FeedbackModal } from "@/components/modals/feedback-modal"
import { authService } from "@/lib/auth-service"
import { ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

type Step = "login" | "email" | "otp-password" | "success"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  } | null>(null)

  useEffect(() => {
    const token = authService.getAccessToken()
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authService.login({ email, password })
      setFeedback({ type: "success", title: "Success", message: "Logged in successfully!" })
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (err: any) {
      if (err.message.includes("first_login") || err.message.includes("password_reset")) {
        setStep("email")
        setFeedback({ type: "info", title: "First Login", message: "Please set up your password using OTP" })
      } else {
        setFeedback({ type: "error", title: "Login Failed", message: err.message || "Invalid credentials" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authService.requestOTP(email)
      setStep("otp-password")
      setFeedback({
        type: "success",
        title: "OTP Sent",
        message: "Check your email for the OTP (also visible in dev logs)",
      })
    } catch (err: any) {
      setFeedback({ type: "error", title: "Failed", message: err.message || "Could not send OTP" })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authService.verifyOTPAndSetPassword({
        email,
        otp,
        new_password: newPassword,
      })

      // Auto-login with new password
      await authService.autoLogin(email, newPassword)

      // Redirect to confirmation page instead of showing success
      router.push("/confirm-team")
    } catch (err: any) {
      setFeedback({ type: "error", title: "Verification Failed", message: err.message || "Invalid OTP or password" })
    } finally {
      setLoading(false)
    }
  }

  const validatePassword = (pwd: string) => {
    return pwd.length >= 10 && /[A-Z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*]/.test(pwd)
  }

  return (
    <div className="min-h-[calc(100vh-11rem)] w-full bg-white flex items-center justify-center px-4">
      <Card className="w-full mt-32 max-w-md p-6 sm:p-7 shadow-sm border border-gray-200 rounded-xl">
        <div className="flex items-center justify-center mb-2">
          <Image src="/sih_logo.jpeg" alt="SIH Logo" width={110} height={110} className="h-20 w-auto" priority />
          <div className="h-14 w-px bg-gray-300 mx-4" />
          <Image src="/gitam_logo.png" alt="GITAM Logo" width={130} height={70} className="h-18 w-auto" priority />
        </div>
        <div className="text-center mb-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#002449]">
            SIH <span className="text-[#f75700]">2025</span> Grand Final
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-[#f75700]" />
            <span className="text-[14px] font-medium text-gray-500 uppercase tracking-wider">GITAM</span>
            <span className="h-px w-8 bg-[#078e31]" />
          </div>
        </div>
        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-[#002449]">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gitam.in"
                  className="border-gray-300 focus:border-[#f75700]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-[#002449]">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="border-gray-300 focus:border-[#f75700] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#f75700] hover:bg-[#e64d00] text-white font-semibold w-full py-3"
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-gray-400 text-[11px]">FIRST TIME?</span>
              </div>
            </div>
            <Button
              type="button"
              className="border border-[#002449] hover:bg-[#002449]/5 hover:text-[#002449] font-semibold w-full py-3"
              onClick={() => {
                setStep("email")
                setEmail("")
                setPassword("")
              }}
            >
              Use OTP Setup
            </Button>
          </form>
        )}
        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-[#002449]">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gitam.in"
                className="border-gray-300 focus:border-[#f75700]"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email}
              className="bg-[#f75700] hover:bg-[#e64d00] text-white font-semibold w-full py-3"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("login")
                setEmail("")
              }}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Back to Login
            </Button>
          </form>
        )}
        {step === "otp-password" && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#002449]">OTP Code</label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="border-gray-300 focus:border-[#f75700] text-center text-lg tracking-wider font-semibold"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-[#002449]">
                <Lock className="w-4 h-4" /> New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 10 chars, 1 uppercase, 1 number, 1 special"
                  className="border-gray-300 focus:border-[#f75700] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className={`text-[11px] ${validatePassword(newPassword) ? "text-green-600" : "text-gray-400"}`}>
                ✓ 10+ chars, 1 uppercase, 1 number, 1 special
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#002449]">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="border-gray-300 focus:border-[#f75700] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !validatePassword(newPassword) || newPassword !== confirmPassword}
              className="bg-[#f75700] hover:bg-[#e64d00] text-white font-semibold w-full py-3"
            >
              {loading ? "Setting Password..." : "Set Password"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("email")
                setOtp("")
                setNewPassword("")
                setConfirmPassword("")
              }}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              Back
            </Button>
          </form>
        )}
      </Card>
      <FeedbackModal
        open={!!feedback}
        type={feedback?.type || "info"}
        title={feedback?.title || ""}
        message={feedback?.message || ""}
        onClose={() => setFeedback(null)}
        autoClose={feedback?.type !== "error"}
        autoCloseDuration={feedback?.type === "info" ? 2000 : 3000}
      />
    </div>
  )
}
