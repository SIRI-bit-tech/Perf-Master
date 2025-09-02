"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, AlertTriangle, CheckCircle, TrendingUp, Code, Cpu, MemoryStick, RefreshCw } from "lucide-react"
import { perfMasterAPI, type AIAnalysisResult, type ComponentData } from "@/lib/api-client"

interface AIInsightsProps {
  componentData?: ComponentData[] // make optional
}

export function AIInsights({ componentData = [] }: AIInsightsProps) {
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult | null>(null)
  const [patternResults, setPatternResults] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (componentData.length > 0) {
      runAnalysis()
    }
  }, [componentData])

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const aiResults = await perfMasterAPI.analyzeComponents(componentData, {
        enablePatternDetection: true,
        includeSourceCode: true,
        cacheResults: true,
      })

      setAnalysisResults(aiResults)

      const codebase = componentData.filter((comp) => comp.sourceCode).map((comp) => comp.sourceCode!)

      if (codebase.length > 0) {
        const patterns = await perfMasterAPI.detectPatterns(codebase)
        setPatternResults(patterns)
      }

      const projectId = Number.parseInt(localStorage.getItem("current_project_id") || "1")
      const suggestions = await perfMasterAPI.getOptimizationSuggestions(projectId)

      if (suggestions && aiResults) {
        setAnalysisResults((prev) => ({
          ...prev!,
          suggestions: [...(prev?.suggestions || []), ...suggestions.suggestions],
        }))
      }
    } catch (err) {
      console.error("[v0] AI Analysis failed:", err)
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "bg-red-500"
      case "warning":
      case "medium":
        return "bg-orange-500"
      case "info":
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getImpactIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "warning":
      case "medium":
        return <Zap className="w-4 h-4 text-orange-400" />
      case "info":
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const calculateOverallScore = (): number => {
    if (!analysisResults || componentData.length === 0) return 0

    let score = 100
    const criticalIssues = analysisResults.suggestions.filter(
      (s) => s.severity === "high" || s.severity === "critical",
    ).length
    const warningIssues = analysisResults.suggestions.filter(
      (s) => s.severity === "medium" || s.severity === "warning",
    ).length

    score -= criticalIssues * 15
    score -= warningIssues * 5

    return Math.max(0, score)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={runAnalysis} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Analysis
        </Button>
      </div>
    )
  }

  const overallScore = calculateOverallScore()

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Performance Analysis
            {isAnalyzing && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <span className="text-sm text-purple-300">Analyzing...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{Math.round(overallScore)}</div>
              <div className="text-sm text-gray-300">Overall Score</div>
              <Progress value={overallScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">{analysisResults?.suggestions.length || 0}</div>
              <div className="text-sm text-gray-300">Optimization Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{analysisResults?.patterns.length || 0}</div>
              <div className="text-sm text-gray-300">Patterns Detected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-orange-500/20">
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="patterns" className="data-[state=active]:bg-purple-500/20">
            Patterns
          </TabsTrigger>
          <TabsTrigger value="components" className="data-[state=active]:bg-blue-500/20">
            Components
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-green-500/20">
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {analysisResults?.suggestions.length ? (
            analysisResults.suggestions.map((suggestion, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    {suggestion.component || "General"}
                    <Badge variant="outline" className="ml-auto">
                      {suggestion.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-600">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(suggestion.severity)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getImpactIcon(suggestion.severity)}
                          <h4 className="font-semibold text-white">{suggestion.type}</h4>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.severity}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{suggestion.message}</p>
                        {suggestion.fix && (
                          <div className="bg-gray-950 p-3 rounded border border-gray-600 mt-2">
                            <code className="text-green-400 text-xs">{suggestion.fix}</code>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Severity: {suggestion.severity}</span>
                          <span>Component: {suggestion.component}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No suggestions available. Run analysis to get AI-powered recommendations.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {analysisResults?.patterns.length ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Detected Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysisResults.patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <h4 className="font-semibold text-white">{pattern.name}</h4>
                      <Badge variant="outline" className="ml-auto">
                        {Math.round(pattern.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{pattern.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No patterns detected yet. Run analysis to identify performance patterns.
              </p>
            </div>
          )}

          {analysisResults?.optimizations.length ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  Optimization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysisResults.optimizations.map((optimization, index) => (
                  <div key={index} className="p-4 rounded-lg bg-orange-900/20 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <h4 className="font-semibold text-white">{optimization.type}</h4>
                      <Badge
                        variant="outline"
                        className={`ml-auto ${
                          optimization.impact === "high"
                            ? "border-red-500 text-red-400"
                            : optimization.impact === "medium"
                              ? "border-orange-500 text-orange-400"
                              : "border-green-500 text-green-400"
                        }`}
                      >
                        {optimization.impact} impact
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm">{optimization.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {componentData.map((component) => (
              <Card
                key={component.name}
                className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedComponent(component.name)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    {component.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Render Time</span>
                    <span className={component.renderTime > 16 ? "text-red-400" : "text-green-400"}>
                      {component.renderTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Re-renders</span>
                    <span className={component.reRenderCount > 10 ? "text-orange-400" : "text-green-400"}>
                      {component.reRenderCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Memory</span>
                    <span className={component.memoryUsage > 50 ? "text-red-400" : "text-green-400"}>
                      {component.memoryUsage}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Bundle Size</span>
                    <span className={component.bundleSize > 100 ? "text-orange-400" : "text-green-400"}>
                      {component.bundleSize}KB
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Complexity</span>
                    <span className={component.codeComplexity > 10 ? "text-red-400" : "text-green-400"}>
                      {component.codeComplexity}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Issues:</span>
                      <span className="text-xs text-orange-400">{component.issues.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Performance Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {componentData
                    .filter((c) => c.renderTime < 16 && c.reRenderCount < 5)
                    .map((component) => (
                      <div key={component.name} className="text-sm text-green-300">
                        ✓ {component.name} - Optimal performance
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Critical Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {componentData
                    .filter((c) => c.renderTime > 50 || c.memoryUsage > 100)
                    .map((component) => (
                      <div key={component.name} className="text-sm text-red-300">
                        ⚠ {component.name} - Needs optimization
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MemoryStick className="w-4 h-4" />
                Resource Usage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {componentData.length
                      ? Math.round(componentData.reduce((acc, c) => acc + c.renderTime, 0) / componentData.length)
                      : 0}
                    ms
                  </div>
                  <div className="text-xs text-gray-400">Avg Render Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(componentData.reduce((acc, c) => acc + c.memoryUsage, 0))}MB
                  </div>
                  <div className="text-xs text-gray-400">Total Memory</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(componentData.reduce((acc, c) => acc + c.bundleSize, 0))}KB
                  </div>
                  <div className="text-xs text-gray-400">Total Bundle</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {componentData.reduce((acc, c) => acc + c.dependencies.length, 0)}
                  </div>
                  <div className="text-xs text-gray-400">Dependencies</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-orange-500 hover:bg-orange-600">
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Re-analyze Components
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Clear Cache
        </Button>
      </div>
    </div>
  )
}
