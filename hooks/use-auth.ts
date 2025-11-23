"use client"

import { useState, useEffect } from "react"
import { authService } from "@/lib/auth-service"

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authService.getAccessToken()
    setIsLoggedIn(!!token)
    setLoading(false)
  }, [])

  const logout = async () => {
    try {
      await authService.logout()
      setIsLoggedIn(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return { isLoggedIn, loading, logout }
}
