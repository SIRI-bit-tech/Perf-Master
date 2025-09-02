"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, Wifi, WifiOff, Users, Clock } from "lucide-react"

interface ConnectionStatus {
  isConnected: boolean
  activeUsers: number
  uptime: string
  lastUpdate: Date | null
  metricsCollected: number
  alertsActive: number
}

export function RealTimeStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    activeUsers: 12,
    uptime: "2h 34m",
    lastUpdate: null, // start null to avoid SSR mismatch
    metricsCollected: 1247,
    alertsActive: 2,
  })

  const [connectionHealth, setConnectionHealth] = useState(95)

  useEffect(() => {
    // Initialize timestamp on client only
    setStatus((prev) => ({ ...prev, lastUpdate: new Date() }))

    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        lastUpdate: new Date(),
        metricsCollected: prev.metricsCollected + Math.floor(Math.random() * 5),
        activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 3 - 1)),
      }))

      setConnectionHealth((prev) =>
        Math.max(80, Math.min(100, prev + (Math.random() - 0.5) * 10))
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="performance-card bg-black/20 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {status.isConnected ? (
              <Wifi className="h-5 w-5 text-secondary" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
            Real-Time Status
          </div>
          <Badge variant={status.isConnected ? "default" : "destructive"}>
            {status.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-white/60" />
              <span className="text-white/60">Active Users</span>
            </div>
            <div className="text-2xl font-bold text-primary">{status.activeUsers}</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-white/60" />
              <span className="text-white/60">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-secondary">{status.uptime}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Connection Health</span>
            <span className="font-medium text-white">{connectionHealth}%</span>
          </div>
          <Progress value={connectionHealth} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-secondary/10">
            <div className="text-lg font-bold text-secondary">{status.metricsCollected}</div>
            <div className="text-xs text-white/60">Metrics Collected</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{status.alertsActive}</div>
            <div className="text-xs text-white/60">Active Alerts</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-white/60">
          <span>
            Last update:{" "}
            {status.lastUpdate ? status.lastUpdate.toLocaleTimeString() : "--:--:--"}
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-white/60 hover:text-white">
            <Activity className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
