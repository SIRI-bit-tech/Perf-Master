"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { wsClient, type PerformanceUpdate, type SystemAlert } from "@/lib/websocket-client"
import { Activity, Wifi, WifiOff, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react"

interface RealTimeMonitorProps {
  onPerformanceUpdate?: (update: PerformanceUpdate) => void
}

export function RealTimeMonitor({ onPerformanceUpdate }: RealTimeMonitorProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  )
  const [performanceUpdates, setPerformanceUpdates] = useState<PerformanceUpdate[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [stats, setStats] = useState({
    totalUpdates: 0,
    avgRenderTime: 0,
    criticalAlerts: 0,
    uptime: 0,
  })

  const startTimeRef = useRef<number>(Date.now())
  const uptimeIntervalRef = useRef<NodeJS.Timeout | null>(null)


  useEffect(() => {
    if (isMonitoring) {
      connectWebSocket()
      startUptimeCounter()
    } else {
      disconnectWebSocket()
      stopUptimeCounter()
    }

    return () => {
      disconnectWebSocket()
      stopUptimeCounter()
    }
  }, [isMonitoring])

  const connectWebSocket = async () => {
    try {
      setConnectionStatus("connecting")
      // COMPLETELY DISABLE WebSocket for now
      console.log("[WebSocket] WebSocket disabled - using static data only")
      setConnectionStatus("disconnected")
      return
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error)
      setConnectionStatus("error")
    }
  }

  const disconnectWebSocket = () => {
    wsClient.disconnect()
    setConnectionStatus("disconnected")
  }

  const startUptimeCounter = () => {
    startTimeRef.current = Date.now()
    uptimeIntervalRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        uptime: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }))
    }, 1000)
  }

  const stopUptimeCounter = () => {
    if (uptimeIntervalRef.current) {
      clearInterval(uptimeIntervalRef.current)
    }
  }

  const handlePerformanceUpdate = (update: PerformanceUpdate) => {
    setPerformanceUpdates((prev) => {
      const newUpdates = [update, ...prev].slice(0, 50) // Keep last 50 updates

      // Update stats
      setStats((prevStats) => ({
        ...prevStats,
        totalUpdates: prevStats.totalUpdates + 1,
        avgRenderTime:
          Math.round(
            ((prevStats.avgRenderTime * prevStats.totalUpdates + update.metrics.renderTime) /
              (prevStats.totalUpdates + 1)) *
              100,
          ) / 100,
      }))

      return newUpdates
    })

    // Call parent callback if provided
    onPerformanceUpdate?.(update)
  }

  const handleSystemAlert = (alert: SystemAlert) => {
    setSystemAlerts((prev) => {
      const newAlerts = [alert, ...prev].slice(0, 20) // Keep last 20 alerts

      if (alert.level === "critical" || alert.level === "error") {
        setStats((prevStats) => ({
          ...prevStats,
          criticalAlerts: prevStats.criticalAlerts + 1,
        }))
      }

      return newAlerts
    })
  }

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
    if (!isMonitoring) {
      // Reset stats when starting
      setStats({
        totalUpdates: 0,
        avgRenderTime: 0,
        criticalAlerts: 0,
        uptime: 0,
      })
      setPerformanceUpdates([])
      setSystemAlerts([])
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-400" />
      case "connecting":
        return <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
      default:
        return <WifiOff className="w-4 h-4 text-red-400" />
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-orange-500"
      default:
        return "bg-red-500"
    }
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "critical":
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-orange-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-blue-400" />
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Connection Status & Controls */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              Real-time Performance Monitor
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="text-sm capitalize">{connectionStatus}</span>
                <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`} />
              </div>
              <Button
                onClick={toggleMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                className={isMonitoring ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.totalUpdates}</div>
              <div className="text-xs text-gray-400">Total Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.avgRenderTime}ms</div>
              <div className="text-xs text-gray-400">Avg Render Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.criticalAlerts}</div>
              <div className="text-xs text-gray-400">Critical Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{formatUptime(stats.uptime)}</div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Performance Updates */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Live Performance Updates
              {performanceUpdates.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {performanceUpdates.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {performanceUpdates.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    {isMonitoring ? "Waiting for performance updates..." : "Start monitoring to see live updates"}
                  </div>
                ) : (
                  performanceUpdates.map((update, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gray-900/50 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{update.componentName}</span>
                        <span className="text-xs text-gray-400">{new Date(update.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Render:</span>
                          <span className={update.metrics.renderTime > 30 ? "text-red-400" : "text-green-400"}>
                            {Math.round(update.metrics.renderTime)}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Memory:</span>
                          <span className={update.metrics.memoryUsage > 80 ? "text-orange-400" : "text-blue-400"}>
                            {Math.round(update.metrics.memoryUsage)}MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Re-renders:</span>
                          <span className="text-purple-400">{update.metrics.reRenderCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">FPS:</span>
                          <span className={update.metrics.fps < 50 ? "text-red-400" : "text-green-400"}>
                            {Math.round(update.metrics.fps)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              System Alerts
              {systemAlerts.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {systemAlerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {systemAlerts.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    {isMonitoring ? "No alerts yet" : "Start monitoring to see system alerts"}
                  </div>
                ) : (
                  systemAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.level === "critical" || alert.level === "error"
                          ? "bg-red-900/20 border-red-500/20"
                          : alert.level === "warning"
                            ? "bg-orange-900/20 border-orange-500/20"
                            : "bg-blue-900/20 border-blue-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alert.level)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white text-sm">{alert.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                alert.level === "critical" || alert.level === "error"
                                  ? "border-red-500 text-red-400"
                                  : alert.level === "warning"
                                    ? "border-orange-500 text-orange-400"
                                    : "border-blue-500 text-blue-400"
                              }`}
                            >
                              {alert.level}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-xs mb-1">{alert.message}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.timestamp).toLocaleTimeString()}
                            {alert.componentName && (
                              <>
                                <span>•</span>
                                <span>{alert.componentName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
