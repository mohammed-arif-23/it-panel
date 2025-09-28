"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Alert from "@/components/ui/alert"

interface Props {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth", { cache: "no-store" })
      const data = await res.json()
      setAuthenticated(!!data.authenticated)
    } catch (e) {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAuthenticated(true)
      } else {
        setError(data.message || "Invalid credentials")
      }
    } catch (err) {
      setError("Authentication failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600">Checking admin session…</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter the admin credentials to access this panel.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="error" message={error} />}
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Admin username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
