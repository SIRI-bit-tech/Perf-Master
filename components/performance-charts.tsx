"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  BarChart3,
  PieChartIcon,
  RefreshCw,
} from "lucide-react"
import { perfMasterAPI, type PerformanceMetrics } from "@/lib/api-client"

export function PerformanceCharts() {
  const [activeTab, setActiveTab] = useState("overview")
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [componentData, setComponentData] = useState<any[]>([])
  const [bundleData, setBundleData] = useState<any[]>([])
  const [coreVitals, setCoreVitals] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)

  useEffect(() => {
    loadInitialData()
    setupWebSocketConnection()

    return () => {
      if (wsConnection) {
        wsConnection.close()
      }
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load performance metrics
      const metricsResult = await perfMasterAPI.getMetrics("24h", "1h")
      if (metricsResult.performanceMetrics) {
        const formattedData = metricsResult.performanceMetrics.map((metric: any) => ({
          time: new Date(metric.timestamp).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          renderTime: metric.rendering.paintTime,
          memoryUsage: metric.runtime.heapUsed / 1024 / 1024, // Convert to MB
          bundleSize: metric.network.totalSize / 1024 / 1024, // Convert to MB
          score: calculatePerformanceScore(metric),
        }))
        setPerformanceData(formattedData)

        // Set latest core vitals
        const latest = metricsResult.performanceMetrics[metricsResult.performanceMetrics.length - 1]
        if (latest) {
          setCoreVitals(latest.coreWebVitals)
        }
      }

      // Load component analysis
      const projectId = localStorage.getItem("current_project_id") || "1"
      const componentResult = await perfMasterAPI.getComponentAnalysis(Number.parseInt(projectId))
      if (componentResult.componentAnalyses) {
        const formattedComponents = componentResult.componentAnalyses.map((analysis: any) => ({
          name: analysis.component.name,
          renderTime: analysis.component.renderTime,
          reRenders: analysis.component.reRenderCount,
          impact: analysis.suggestions.some((s: any) => s.severity === "high") ? "High" : "Low",
        }))
        setComponentData(formattedComponents)
      }

      // Scan current components for bundle analysis
      const scanResult = await perfMasterAPI.scanComponents()
      if (scanResult.components) {
        const bundleAnalysis = analyzeBundleSize(scanResult.components)
        setBundleData(bundleAnalysis)
      }
    } catch (err) {
      console.error("Failed to load performance data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocketConnection = () => {
    const ws = perfMasterAPI.connectWebSocket(
      (data) => {
        if (data.type === "performance_update") {
          setPerformanceData((prev) => {
            const newData = [...prev]
            const newEntry = {
              time: new Date().toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              }),
              renderTime: data.metrics.rendering.paintTime,
              memoryUsage: data.metrics.runtime.heapUsed / 1024 / 1024,
              bundleSize: data.metrics.network.totalSize / 1024 / 1024,
              score: calculatePerformanceScore(data.metrics),
            }
            newData.push(newEntry)
            return newData.slice(-20) // Keep last 20 entries
          })

          setCoreVitals(data.metrics.coreWebVitals)
        }
      },
      (error) => {
        console.error("WebSocket error:", error)
        setError("Real-time connection lost. Attempting to reconnect...")
      },
    )
    setWsConnection(ws)
  }

  const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
    const { coreWebVitals } = metrics
    let score = 100

    // LCP scoring (target < 2.5s)
    if (coreWebVitals.lcp > 4) score -= 30
    else if (coreWebVitals.lcp > 2.5) score -= 15

    // FID scoring (target < 100ms)
    if (coreWebVitals.fid > 300) score -= 25
    else if (coreWebVitals.fid > 100) score -= 10

    // CLS scoring (target < 0.1)
    if (coreWebVitals.cls > 0.25) score -= 25
    else if (coreWebVitals.cls > 0.1) score -= 10

    return Math.max(0, score)
  }

  const analyzeBundleSize = (components: any[]): any[] => {
    const totalSize = components.reduce((sum, comp) => sum + comp.bundleSize, 0)
    const grouped = components.reduce((acc, comp) => {
      const category = categorizeComponent(comp.path)
      if (!acc[category]) acc[category] = 0
      acc[category] += comp.bundleSize
      return acc
    }, {})

    return Object.entries(grouped).map(([name, size]: [string, any]) => ({
      name,
      size: (size / 1024).toFixed(1), // Convert to KB
      color: getCategoryColor(name),
    }))
  }

  const categorizeComponent = (path: string): string => {
    if (path.includes("node_modules/react")) return "React"
    if (path.includes("node_modules/next")) return "Next.js"
    if (path.includes("/components/ui/")) return "UI Components"
    if (path.includes("/lib/") || path.includes("/utils/")) return "Utils"
    return "Other"
  }

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      React: "#61dafb",
      "Next.js": "#000000",
      "UI Components": "#ff6b35",
      Utils: "#4ecdc4",
      Other: "#a0aec0",
    }
    return colors[category] || "#a0aec0"
  }

  const refreshData = () => {
    loadInitialData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="bundle" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Bundle
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Core Vitals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="performance-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Score Trend
                </CardTitle>
                <CardDescription>Real-time performance score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1b3a",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#ff6b35" fill="url(#scoreGradient)" strokeWidth={2} />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="performance-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-secondary" />
                  Render Time & Memory
                </CardTitle>
                <CardDescription>Component render time and memory usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1b3a",
                        border: "1px solid #4b5563",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="renderTime"
                      stroke="#4ecdc4"
                      strokeWidth={2}
                      dot={{ fill: "#4ecdc4", strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="memoryUsage"
                      stroke="#b794f4"
                      strokeWidth={2}
                      dot={{ fill: "#b794f4", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card className="performance-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Component Performance Analysis
              </CardTitle>
              <CardDescription>Individual component render times and re-render frequency</CardDescription>
            </CardHeader>
            <CardContent>
              {componentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={componentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1b3a",
                          border: "1px solid #4b5563",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="renderTime" fill="#ff6b35" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 space-y-3">
                    {componentData.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg metric-highlight">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <span className="font-medium">{component.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">{component.renderTime}ms</span>
                          <span className="text-sm text-muted-foreground">{component.reRenders} re-renders</span>
                          <Badge
                            variant={component.impact === "High" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {component.impact}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No component data available. Run a component scan to see analysis.
                  </p>
                  <Button onClick={() => perfMasterAPI.scanComponents()} className="mt-4">
                    Scan Components
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundle" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="performance-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Bundle Size Distribution
                </CardTitle>
                <CardDescription>Breakdown of your application bundle</CardDescription>
              </CardHeader>
              <CardContent>
                {bundleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={bundleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="size"
                      >
                        {bundleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1b3a",
                          border: "1px solid #4b5563",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No bundle data available.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="performance-card">
              <CardHeader>
                <CardTitle>Bundle Analysis Details</CardTitle>
                <CardDescription>Detailed breakdown with optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bundleData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg metric-highlight">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">{item.size}KB</span>
                      {Number.parseFloat(item.size) > 30 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full bg-transparent">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Optimize Bundle Size
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="performance-card">
              <CardHeader>
                <CardTitle className="text-lg">Largest Contentful Paint</CardTitle>
                <CardDescription>LCP measures loading performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">
                  {coreVitals.lcp ? `${(coreVitals.lcp / 1000).toFixed(1)}s` : "N/A"}
                </div>
                <div className="flex items-center space-x-2">
                  {coreVitals.lcp && coreVitals.lcp < 2500 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-secondary">Good</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">Needs Improvement</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Target: &lt; 2.5s</p>
              </CardContent>
            </Card>

            <Card className="performance-card">
              <CardHeader>
                <CardTitle className="text-lg">First Input Delay</CardTitle>
                <CardDescription>FID measures interactivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">
                  {coreVitals.fid ? `${coreVitals.fid.toFixed(0)}ms` : "N/A"}
                </div>
                <div className="flex items-center space-x-2">
                  {coreVitals.fid && coreVitals.fid < 100 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-secondary">Good</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">Needs Improvement</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Target: &lt; 100ms</p>
              </CardContent>
            </Card>

            <Card className="performance-card">
              <CardHeader>
                <CardTitle className="text-lg">Cumulative Layout Shift</CardTitle>
                <CardDescription>CLS measures visual stability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-2">
                  {coreVitals.cls ? coreVitals.cls.toFixed(3) : "N/A"}
                </div>
                <div className="flex items-center space-x-2">
                  {coreVitals.cls && coreVitals.cls < 0.1 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-secondary">Good</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">Needs Improvement</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Target: &lt; 0.1</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
