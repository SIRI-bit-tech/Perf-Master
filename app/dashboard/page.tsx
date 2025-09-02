"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PerformanceCharts } from "@/components/performance-charts"
import { ComponentTree } from "@/components/component-tree"
import { RealTimeStatus } from "@/components/real-time-status"
import { AIInsights } from "@/components/ai-insights"
import { RealTimeMonitor } from "@/components/real-time-monitor"
import { perfMasterAPI } from "@/lib/api-client"
import { Activity, TrendingUp, Clock, BarChart3, MemoryStick as Memory, Settings, Download } from "lucide-react"

interface DashboardMetrics {
  overallScore: number
  renderTime: number
  bundleSize: number
  memoryUsage: number
  coreWebVitals: {
    lcp: number
    fid: number
    cls: number
  }
}

function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await perfMasterAPI.getPerformanceMetrics()
        setMetrics(data)
      } catch (error) {
        console.error("Failed to fetch metrics:", error)
        // Check if it's a GraphQL or network error
        if (error instanceof Error && (error.message?.includes('GraphQL') || error.message?.includes('fetch'))) {
          console.warn("Backend API unavailable, using fallback data")
        }
        // Fallback to demo data if API fails
        setMetrics({
          overallScore: 85,
          renderTime: 12.5,
          bundleSize: 2.1,
          memoryUsage: 45.2,
          coreWebVitals: { lcp: 1.2, fid: 8, cls: 0.05 },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="performance-card animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="performance-card animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{metrics.overallScore}</div>
          <Progress value={metrics.overallScore} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.overallScore >= 90 ? "Excellent" : metrics.overallScore >= 70 ? "Good" : "Needs Improvement"}
          </p>
        </CardContent>
      </Card>

      <Card className="performance-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Render Time</CardTitle>
          <Clock className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">{metrics.renderTime.toFixed(1)}ms</div>
          <p className="text-xs text-muted-foreground mt-2">Average component render time</p>
        </CardContent>
      </Card>

      <Card className="performance-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
          <BarChart3 className="h-4 w-4 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-3">{metrics.bundleSize}MB</div>
          <p className="text-xs text-muted-foreground mt-2">Optimized for performance</p>
        </CardContent>
      </Card>

      <Card className="performance-card animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <Memory className="h-4 w-4 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-4">{metrics.memoryUsage.toFixed(1)}MB</div>
          <Progress value={metrics.memoryUsage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">Current memory allocation</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Performance Dashboard</h1>
            <p className="text-muted-foreground">AI-Powered Real-Time Performance Analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-secondary border-secondary">
              <div className="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse" />
              Live Monitoring
            </Badge>
            <Button variant="outline" size="sm" className="bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyze Project
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <PerformanceMetrics />

        <RealTimeMonitor />

        {/* Comprehensive Performance Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <PerformanceCharts />
          </div>
          <div className="space-y-6">
            <RealTimeStatus />
            <AIInsights />
            <ComponentTree />
          </div>
        </div>
      </div>
    </div>
  )
}
