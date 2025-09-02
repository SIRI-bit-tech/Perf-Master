"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RealTimeStatus } from "@/components/real-time-status"
import { Activity, TrendingUp, Zap, BarChart3, Users, Globe, ArrowRight, Play } from "lucide-react"

// Loading Screen Component
function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="text-4xl font-bold text-primary mb-8">PerfMaster</div>
        <div className="flex space-x-2 justify-center">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-12 bg-primary rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
        <p className="text-muted-foreground">Initializing AI Performance Engine...</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <LoadingScreen isLoading={isLoading} />

      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 py-12 animate-slide-up">
            <Badge variant="outline" className="text-secondary border-secondary mb-4">
              <div className="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse" />
              AI-Powered Performance Analysis
            </Badge>
            <h1 className="text-6xl font-bold text-white mb-6">
              Perf<span className="text-secondary">Master</span>
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Real-time performance monitoring and AI-powered optimization for modern web applications. Identify
              bottlenecks, optimize components, and deliver exceptional user experiences.
            </p>
            <div className="flex items-center justify-center space-x-4 pt-6">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Play className="h-5 w-5 mr-2" />
                Start Analysis
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                View Dashboard
              </Button>
            </div>
          </div>

          {/* Real-time Status */}
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <RealTimeStatus />
          </div>

          {/* Features Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Card className="performance-card group hover:scale-105 transition-transform duration-300 bg-black/20 border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-white">Real-time Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-white/80">
                  Monitor your application's performance in real-time with live metrics, Core Web Vitals tracking, and
                  instant alerts for performance degradation.
                </CardDescription>
                <Button variant="ghost" className="mt-4 p-0 h-auto text-primary hover:text-primary/80">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="performance-card group hover:scale-105 transition-transform duration-300 bg-black/20 border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Zap className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="text-xl text-white">AI-Powered Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-white/80">
                  Get intelligent optimization suggestions powered by machine learning. Identify performance bottlenecks
                  and receive actionable recommendations.
                </CardDescription>
                <Button variant="ghost" className="mt-4 p-0 h-auto text-secondary hover:text-secondary/80">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="performance-card group hover:scale-105 transition-transform duration-300 bg-black/20 border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-chart-3/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-chart-3" />
                  </div>
                  <CardTitle className="text-xl text-white">Component Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-white/80">
                  Deep dive into individual component performance with detailed metrics, render time analysis, and
                  memory usage tracking.
                </CardDescription>
                <Button variant="ghost" className="mt-4 p-0 h-auto text-chart-3 hover:text-chart-3/80">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="performance-card group hover:scale-105 transition-transform duration-300 bg-black/20 border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-chart-4/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-chart-4" />
                  </div>
                  <CardTitle className="text-xl text-white">Performance Trends</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-white/80">
                  Track performance improvements over time with comprehensive analytics, historical data, and trend
                  analysis.
                </CardDescription>
                <Button variant="ghost" className="mt-4 p-0 h-auto text-chart-4 hover:text-chart-4/80">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="performance-card group hover:scale-105 transition-transform duration-300 bg-black/20 border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-chart-5/20 rounded-lg">
                    <Users className="h-6 w-6 text-chart-5" />
                  </div>
                  <CardTitle className="text-xl text-white">Team Collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-white/80">
                  Share performance insights with your team, create custom reports, and collaborate on optimization
                  strategies.
                </CardDescription>
                <Button variant="ghost" className="mt-4 p-0 h-auto text-chart-5 hover:text-chart-5/80">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card className="performance-card group hover:scale-105 transition-transform duration-300 bg-black/20 border-white/10">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-white">Global Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-white/80">
                  Monitor performance across different regions and devices. Get insights into how your app performs for
                  users worldwide.
                </CardDescription>
                <Button variant="ghost" className="mt-4 p-0 h-auto text-primary hover:text-primary/80">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center py-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to optimize your application?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust PerfMaster to deliver exceptional performance.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Zap className="h-5 w-5 mr-2" />
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
