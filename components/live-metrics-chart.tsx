"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { wsClient, type PerformanceUpdate } from "@/lib/websocket-client"
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricDataPoint {
  timestamp: string
  renderTime: number
  memoryUsage: number
  fps: number
  reRenderCount: number
}

interface LiveMetricsChartProps {
  maxDataPoints?: number
  updateInterval?: number
}

export function LiveMetricsChart({ maxDataPoints = 50, updateInterval = 1000 }: LiveMetricsChartProps) {
  const [metricsData, setMetricsData] = useState<MetricDataPoint[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<"renderTime" | "memoryUsage" | "fps" | "reRenderCount">(
    "renderTime",
  )
  const [trends, setTrends] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    reRenderCount: 0,
  })

  const lastUpdateRef = useRef<number>(Date.now())

  useEffect(() => {
    const handlePerformanceUpdate = (update: PerformanceUpdate) => {
      const now = Date.now()

      // Throttle updates to prevent overwhelming the chart
      if (now - lastUpdateRef.current < updateInterval) {
        return
      }

      lastUpdateRef.current = now

      setMetricsData((prev) => {
        const newDataPoint: MetricDataPoint = {
          timestamp: new Date(update.timestamp).toLocaleTimeString(),
          renderTime: Math.round(update.metrics.renderTime * 100) / 100,
          memoryUsage: Math.round(update.metrics.memoryUsage * 100) / 100,
          fps: Math.round(update.metrics.fps * 100) / 100,
          reRenderCount: update.metrics.reRenderCount,
        }

        const newData = [...prev, newDataPoint].slice(-maxDataPoints)

        // Calculate trends
        if (newData.length >= 2) {
          const current = newData[newData.length - 1]
          const previous = newData[newData.length - 2]

          setTrends({
            renderTime: current.renderTime - previous.renderTime,
            memoryUsage: current.memoryUsage - previous.memoryUsage,
            fps: current.fps - previous.fps,
            reRenderCount: current.reRenderCount - previous.reRenderCount,
          })
        }

        return newData
      })
    }

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    wsClient.on("performance_update", handlePerformanceUpdate)
    wsClient.on("connect", handleConnect)
    wsClient.on("disconnect", handleDisconnect)

    return () => {
      wsClient.off("performance_update", handlePerformanceUpdate)
      wsClient.off("connect", handleConnect)
      wsClient.off("disconnect", handleDisconnect)
    }
  }, [maxDataPoints, updateInterval])

  const getMetricConfig = (metric: string) => {
    switch (metric) {
      case "renderTime":
        return {
          color: "#FF6B35",
          name: "Render Time (ms)",
          threshold: 16,
          unit: "ms",
        }
      case "memoryUsage":
        return {
          color: "#4ECDC4",
          name: "Memory Usage (MB)",
          threshold: 100,
          unit: "MB",
        }
      case "fps":
        return {
          color: "#45B7D1",
          name: "FPS",
          threshold: 60,
          unit: "fps",
        }
      case "reRenderCount":
        return {
          color: "#96CEB4",
          name: "Re-renders",
          threshold: 10,
          unit: "",
        }
      default:
        return {
          color: "#FF6B35",
          name: "Render Time (ms)",
          threshold: 16,
          unit: "ms",
        }
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return <TrendingUp className="w-4 h-4 text-red-400" />
    if (trend < -0.1) return <TrendingDown className="w-4 h-4 text-green-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0.1) return "text-red-400"
    if (trend < -0.1) return "text-green-400"
    return "text-gray-400"
  }

  const config = getMetricConfig(selectedMetric)
  const currentValue = metricsData.length > 0 ? metricsData[metricsData.length - 1][selectedMetric] : 0
  const trend = trends[selectedMetric]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{`Time: ${label}`}</p>
          <p className="text-white font-medium">{`${config.name}: ${payload[0].value}${config.unit}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            Live Performance Metrics
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: config.color }}>
              {currentValue}
              {config.unit}
            </span>
            {getTrendIcon(trend)}
            <span className={`text-sm ${getTrendColor(trend)}`}>
              {trend > 0 ? "+" : ""}
              {Math.round(trend * 100) / 100}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Metric Selection */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["renderTime", "memoryUsage", "fps", "reRenderCount"] as const).map((metric) => {
            const metricConfig = getMetricConfig(metric)
            return (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedMetric === metric ? "text-white" : "text-gray-400 hover:text-white"
                }`}
                style={{
                  backgroundColor: selectedMetric === metric ? metricConfig.color : "transparent",
                  border: `1px solid ${metricConfig.color}`,
                }}
              >
                {metricConfig.name}
              </button>
            )
          })}
        </div>

        {/* Chart */}
        <div className="h-64">
          {metricsData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              {isConnected ? "Waiting for performance data..." : "Connect to see live metrics"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => value.split(":").slice(1).join(":")} // Show MM:SS
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={config.threshold}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  label={{ value: `Threshold: ${config.threshold}${config.unit}`, position: "topRight" }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: config.color }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-600">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {metricsData.length > 0
                ? Math.round((metricsData.reduce((acc, d) => acc + d[selectedMetric], 0) / metricsData.length) * 100) /
                  100
                : 0}
              {config.unit}
            </div>
            <div className="text-xs text-gray-400">Average</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {metricsData.length > 0 ? Math.max(...metricsData.map((d) => d[selectedMetric])) : 0}
              {config.unit}
            </div>
            <div className="text-xs text-gray-400">Peak</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {metricsData.length > 0 ? Math.min(...metricsData.map((d) => d[selectedMetric])) : 0}
              {config.unit}
            </div>
            <div className="text-xs text-gray-400">Minimum</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
