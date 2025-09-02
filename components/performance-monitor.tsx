"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { Activity, MemoryStick, Cpu, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

interface PerformanceData {
  timestamp: string
  lcp: number
  fid: number
  cls: number
  ttfb: number
  fcp: number
  renderTime: number
  memoryUsage: number
  cpuUsage: number
}

interface ComponentMetrics {
  name: string
  renderTime: number
  mountTime: number
  updateCount: number
  memoryUsage: number
  status: "good" | "warning" | "critical"
}

export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([
    { name: "Dashboard", renderTime: 15.2, mountTime: 45.8, updateCount: 3, memoryUsage: 2.1, status: "good" },
    {
      name: "PerformanceCharts",
      renderTime: 28.5,
      mountTime: 120.3,
      updateCount: 12,
      memoryUsage: 4.8,
      status: "warning",
    },
    { name: "ComponentTree", renderTime: 8.1, mountTime: 25.6, updateCount: 1, memoryUsage: 1.2, status: "good" },
    { name: "AIInsights", renderTime: 35.7, mountTime: 180.2, updateCount: 8, memoryUsage: 6.3, status: "critical" },
  ])

  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    // Generate initial performance data
    const initialData: PerformanceData[] = []
    for (let i = 0; i < 20; i++) {
      initialData.push({
        timestamp: new Date(Date.now() - (19 - i) * 30000).toLocaleTimeString(),
        lcp: 1.2 + Math.random() * 1.5,
        fid: 8 + Math.random() * 40,
        cls: 0.05 + Math.random() * 0.1,
        ttfb: 200 + Math.random() * 300,
        fcp: 800 + Math.random() * 400,
        renderTime: 10 + Math.random() * 20,
        memoryUsage: 40 + Math.random() * 30,
        cpuUsage: 20 + Math.random() * 40,
      })
    }
    setPerformanceData(initialData)
  }, [])

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      setPerformanceData((prev) => {
        const newData = [
          ...prev.slice(1),
          {
            timestamp: new Date().toLocaleTimeString(),
            lcp: 1.2 + Math.random() * 1.5,
            fid: 8 + Math.random() * 40,
            cls: 0.05 + Math.random() * 0.1,
            ttfb: 200 + Math.random() * 300,
            fcp: 800 + Math.random() * 400,
            renderTime: 10 + Math.random() * 20,
            memoryUsage: 40 + Math.random() * 30,
            cpuUsage: 20 + Math.random() * 40,
          },
        ]
        return newData
      })

      // Update component metrics
      setComponentMetrics((prev) =>
        prev.map((component) => ({
          ...component,
          renderTime: Math.max(5, component.renderTime + (Math.random() - 0.5) * 5),
          updateCount: component.updateCount + Math.floor(Math.random() * 2),
          memoryUsage: Math.max(0.5, component.memoryUsage + (Math.random() - 0.5) * 1),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "critical":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <Card className="performance-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Performance Monitor
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? "default" : "secondary"}>{isMonitoring ? "Live" : "Paused"}</Badge>
            <Button variant="outline" size="sm" onClick={() => setIsMonitoring(!isMonitoring)}>
              {isMonitoring ? "Pause" : "Start"} Monitoring
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vitals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="timestamp" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line type="monotone" dataKey="lcp" stroke="hsl(var(--primary))" strokeWidth={2} name="LCP (s)" />
                  <Line type="monotone" dataKey="fid" stroke="hsl(var(--secondary))" strokeWidth={2} name="FID (ms)" />
                  <Line type="monotone" dataKey="cls" stroke="hsl(var(--chart-3))" strokeWidth={2} name="CLS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <div className="text-lg font-bold text-primary">
                  {performanceData[performanceData.length - 1]?.lcp.toFixed(2) || "0.00"}s
                </div>
                <div className="text-xs text-muted-foreground">LCP</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/10">
                <div className="text-lg font-bold text-secondary">
                  {performanceData[performanceData.length - 1]?.fid.toFixed(0) || "0"}ms
                </div>
                <div className="text-xs text-muted-foreground">FID</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-chart-3/10">
                <div className="text-lg font-bold text-chart-3">
                  {performanceData[performanceData.length - 1]?.cls.toFixed(3) || "0.000"}
                </div>
                <div className="text-xs text-muted-foreground">CLS</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="timestamp" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="renderTime"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Render Time (ms)"
                  />
                  <Area
                    type="monotone"
                    dataKey="memoryUsage"
                    stackId="2"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.3}
                    name="Memory (MB)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="space-y-3">
              {componentMetrics.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(component.status)}
                    <div>
                      <div className="font-medium">{component.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {component.renderTime.toFixed(1)}ms render • {component.updateCount} updates
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(component.status)}`}>
                      {component.memoryUsage.toFixed(1)}MB
                    </div>
                    <div className="text-xs text-muted-foreground">memory</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    CPU Usage
                  </span>
                  <span className="text-sm font-medium">
                    {performanceData[performanceData.length - 1]?.cpuUsage.toFixed(1) || "0"}%
                  </span>
                </div>
                <Progress value={performanceData[performanceData.length - 1]?.cpuUsage || 0} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <MemoryStick className="h-4 w-4" />
                    Memory Usage
                  </span>
                  <span className="text-sm font-medium">
                    {performanceData[performanceData.length - 1]?.memoryUsage.toFixed(1) || "0"}MB
                  </span>
                </div>
                <Progress value={performanceData[performanceData.length - 1]?.memoryUsage || 0} />
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="timestamp" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="cpuUsage" fill="hsl(var(--primary))" name="CPU %" />
                  <Bar dataKey="memoryUsage" fill="hsl(var(--secondary))" name="Memory MB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
