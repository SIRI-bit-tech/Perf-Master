"use client"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface PerformanceMetrics {
  componentName: string
  renderTime: number
  reRenderCount: number
  memoryUsage: number
  bundleSize: number
  codeComplexity: number
  dependencies: string[]
  sourceCode: string
}

export interface OptimizationSuggestion {
  type: "critical" | "warning" | "info"
  category: "performance" | "memory" | "bundle" | "code-quality"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  effort: "low" | "medium" | "high"
  codeExample?: string
  estimatedImprovement: string
}

export interface AIAnalysisResult {
  overallScore: number
  suggestions: OptimizationSuggestion[]
  bottlenecks: string[]
  patterns: string[]
  riskFactors: string[]
}

export class AIPerformanceAnalyzer {
  private static instance: AIPerformanceAnalyzer
  private analysisCache = new Map<string, AIAnalysisResult>()

  static getInstance(): AIPerformanceAnalyzer {
    if (!AIPerformanceAnalyzer.instance) {
      AIPerformanceAnalyzer.instance = new AIPerformanceAnalyzer()
    }
    return AIPerformanceAnalyzer.instance
  }

  async analyzeComponent(metrics: PerformanceMetrics): Promise<AIAnalysisResult> {
    const cacheKey = `${metrics.componentName}-${JSON.stringify(metrics).slice(0, 100)}`

    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!
    }

    try {
      const analysisPrompt = `
        Analyze this React component's performance metrics and provide optimization suggestions:
        
        Component: ${metrics.componentName}
        Render Time: ${metrics.renderTime}ms
        Re-render Count: ${metrics.reRenderCount}
        Memory Usage: ${metrics.memoryUsage}MB
        Bundle Size: ${metrics.bundleSize}KB
        Code Complexity: ${metrics.codeComplexity}
        Dependencies: ${metrics.dependencies.join(", ")}
        
        Source Code:
        ${metrics.sourceCode}
        
        Provide a JSON response with:
        1. Overall performance score (0-100)
        2. Specific optimization suggestions with priority levels
        3. Identified bottlenecks
        4. Performance patterns detected
        5. Risk factors
        
        Focus on actionable, specific recommendations with code examples.
      `

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: analysisPrompt,
        temperature: 0.3,
      })

      const result = this.parseAIResponse(text, metrics)
      this.analysisCache.set(cacheKey, result)
      return result
    } catch (error) {
      console.error("[v0] AI Analysis failed:", error)
      return this.getFallbackAnalysis(metrics)
    }
  }

  private parseAIResponse(response: string, metrics: PerformanceMetrics): AIAnalysisResult {
    try {
      const parsed = JSON.parse(response)
      return {
        overallScore: parsed.overallScore || this.calculateFallbackScore(metrics),
        suggestions: parsed.suggestions || this.generateFallbackSuggestions(metrics),
        bottlenecks: parsed.bottlenecks || [],
        patterns: parsed.patterns || [],
        riskFactors: parsed.riskFactors || [],
      }
    } catch {
      return this.getFallbackAnalysis(metrics)
    }
  }

  private getFallbackAnalysis(metrics: PerformanceMetrics): AIAnalysisResult {
    const suggestions: OptimizationSuggestion[] = []

    if (metrics.renderTime > 16) {
      suggestions.push({
        type: "critical",
        category: "performance",
        title: "High Render Time Detected",
        description: `Component ${metrics.componentName} takes ${metrics.renderTime}ms to render, exceeding the 16ms budget for 60fps.`,
        impact: "high",
        effort: "medium",
        codeExample: "Consider using React.memo() or useMemo() for expensive calculations.",
        estimatedImprovement: "30-50% render time reduction",
      })
    }

    if (metrics.reRenderCount > 10) {
      suggestions.push({
        type: "warning",
        category: "performance",
        title: "Excessive Re-renders",
        description: `Component re-renders ${metrics.reRenderCount} times. This may indicate unnecessary state updates.`,
        impact: "medium",
        effort: "low",
        codeExample: "Use useCallback() for event handlers and useMemo() for derived state.",
        estimatedImprovement: "20-40% performance improvement",
      })
    }

    if (metrics.bundleSize > 100) {
      suggestions.push({
        type: "warning",
        category: "bundle",
        title: "Large Bundle Size",
        description: `Component bundle is ${metrics.bundleSize}KB. Consider code splitting.`,
        impact: "medium",
        effort: "medium",
        codeExample: 'Use dynamic imports: const Component = lazy(() => import("./Component"))',
        estimatedImprovement: "15-25% bundle size reduction",
      })
    }

    return {
      overallScore: this.calculateFallbackScore(metrics),
      suggestions,
      bottlenecks: this.identifyBottlenecks(metrics),
      patterns: this.identifyPatterns(metrics),
      riskFactors: this.identifyRiskFactors(metrics),
    }
  }

  private calculateFallbackScore(metrics: PerformanceMetrics): number {
    let score = 100

    if (metrics.renderTime > 16) score -= 20
    if (metrics.reRenderCount > 10) score -= 15
    if (metrics.memoryUsage > 50) score -= 10
    if (metrics.bundleSize > 100) score -= 15
    if (metrics.codeComplexity > 10) score -= 10

    return Math.max(0, score)
  }

  private generateFallbackSuggestions(metrics: PerformanceMetrics): OptimizationSuggestion[] {
    return [
      {
        type: "info",
        category: "performance",
        title: "Performance Optimization Available",
        description: "Component performance can be improved with standard React optimization techniques.",
        impact: "medium",
        effort: "low",
        estimatedImprovement: "10-30% performance gain",
      },
    ]
  }

  private identifyBottlenecks(metrics: PerformanceMetrics): string[] {
    const bottlenecks: string[] = []

    if (metrics.renderTime > 16) bottlenecks.push("Slow rendering")
    if (metrics.reRenderCount > 10) bottlenecks.push("Excessive re-renders")
    if (metrics.memoryUsage > 50) bottlenecks.push("High memory usage")

    return bottlenecks
  }

  private identifyPatterns(metrics: PerformanceMetrics): string[] {
    const patterns: string[] = []

    if (metrics.dependencies.length > 5) patterns.push("Heavy dependency usage")
    if (metrics.codeComplexity > 10) patterns.push("High code complexity")

    return patterns
  }

  private identifyRiskFactors(metrics: PerformanceMetrics): string[] {
    const risks: string[] = []

    if (metrics.bundleSize > 200) risks.push("Large bundle impact on load time")
    if (metrics.memoryUsage > 100) risks.push("Memory leak potential")

    return risks
  }

  async batchAnalyze(components: PerformanceMetrics[]): Promise<Map<string, AIAnalysisResult>> {
    const results = new Map<string, AIAnalysisResult>()

    const analysisPromises = components.map(async (component) => {
      const result = await this.analyzeComponent(component)
      results.set(component.componentName, result)
    })

    await Promise.all(analysisPromises)
    return results
  }

  clearCache(): void {
    this.analysisCache.clear()
  }
}

export const aiAnalyzer = AIPerformanceAnalyzer.getInstance()
