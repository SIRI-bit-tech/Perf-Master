"use client"

export interface ComponentData {
  id?: number
  name: string
  path: string
  renderTime: number
  reRenderCount: number
  memoryUsage: number
  bundleSize: number
  codeComplexity: number
  dependencies: string[]
  sourceCode?: string
  lastModified: string
  issues: string[]
}

export interface AnalysisOptions {
  enablePatternDetection?: boolean
  includeSourceCode?: boolean
  cacheResults?: boolean
}

export interface PerformanceMetrics {
  id?: number
  timestamp?: string
  coreWebVitals: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
  }
  runtime: {
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
  }
  network: {
    requests: number
    totalSize: number
    cacheHitRate: number
  }
  rendering: {
    fps: number
    frameDrops: number
    paintTime: number
  }
}

export interface AIAnalysisResult {
  suggestions: Array<{
    type: string
    severity: string
    message: string
    component: string
    fix?: string
  }>
  patterns: Array<{
    name: string
    confidence: number
    description: string
  }>
  optimizations: Array<{
    type: string
    impact: string
    description: string
  }>
}

export class PerfMasterAPI {
  private baseUrl: string
  private wsUrl: string

  constructor(baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000") {
    this.baseUrl = baseUrl
    this.wsUrl = baseUrl.replace("http", "ws")
  }

  // GraphQL queries
  private async graphqlQuery(query: string, variables: any = {}) {
    const response = await fetch(`${this.baseUrl}/graphql/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`)
    }

    const result = await response.json()
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(", ")}`)
    }

    return result.data
  }

  // REST API calls
  private async restCall(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Real-time performance metrics
  async getMetrics(timeRange = "1h", interval = "1m") {
    const query = `
      query GetMetrics($timeRange: String!, $interval: String!) {
        performanceMetrics(timeRange: $timeRange, interval: $interval) {
          id
          timestamp
          coreWebVitals {
            lcp
            fid
            cls
            fcp
            ttfb
          }
          runtime {
            heapUsed
            heapTotal
            external
            arrayBuffers
          }
          network {
            requests
            totalSize
            cacheHitRate
          }
          rendering {
            fps
            frameDrops
            paintTime
          }
        }
      }
    `
    return this.graphqlQuery(query, { timeRange, interval })
  }

  // ✅ Explicit method so your frontend can call it directly
  async getPerformanceMetrics(timeRange = "1h", interval = "1m") {
    return this.getMetrics(timeRange, interval)
  }

  async storeMetrics(metrics: PerformanceMetrics) {
    return this.restCall("/performance/metrics/", {
      method: "POST",
      body: JSON.stringify(metrics),
    })
  }

  // Component analysis with AI
  async analyzeComponents(components: ComponentData[], options: AnalysisOptions = {}): Promise<AIAnalysisResult> {
    return this.restCall("/performance/analyze/", {
      method: "POST",
      body: JSON.stringify({ components, options }),
    })
  }

  async getComponentAnalysis(projectId: number) {
    const query = `
      query GetComponentAnalysis($projectId: ID!) {
        componentAnalyses(projectId: $projectId) {
          id
          component {
            name
            path
            renderTime
            reRenderCount
            memoryUsage
            bundleSize
            codeComplexity
          }
          suggestions {
            type
            severity
            message
            fix
          }
          patterns {
            name
            confidence
            description
          }
        }
      }
    `
    return this.graphqlQuery(query, { projectId })
  }

  // Real-time component scanning
  async scanComponents(directory = "/components", includeSource = false) {
    return this.restCall(`/components/scan/?dir=${encodeURIComponent(directory)}&includeSource=${includeSource}`)
  }

  async scanSpecificComponents(paths: string[], options: { includeSource?: boolean } = {}) {
    return this.restCall("/components/scan/", {
      method: "POST",
      body: JSON.stringify({ paths, options }),
    })
  }

  // Performance history
  async getHistory(days = 30, component?: string) {
    const query = `
      query GetPerformanceHistory($days: Int!, $component: String) {
        performanceHistory(days: $days, component: $component) {
          timestamp
          score
          renderTime
          memoryUsage
          bundleSize
          component
        }
      }
    `
    return this.graphqlQuery(query, { days, component })
  }

  // AI-powered optimization suggestions
  async getOptimizationSuggestions(projectId: number) {
    return this.restCall(`/ai/suggestions/${projectId}/`)
  }

  // Pattern detection
  async detectPatterns(codebase: string[]) {
    return this.restCall("/ai/patterns/", {
      method: "POST",
      body: JSON.stringify({ codebase }),
    })
  }

  // ✅ WebSocket connection for real-time updates (fixed with projectId)
  connectWebSocket(
    projectId: string,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void
  ) {
    const ws = new WebSocket(`${this.wsUrl}/ws/performance/${projectId}/`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      if (onError) onError(error)
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connectWebSocket(projectId, onMessage, onError), 5000)
    }

    return ws
  }

  // Project management
  async createProject(name: string, description?: string) {
    return this.restCall("/projects/", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    })
  }

  async getProjects() {
    const query = `
      query GetProjects {
        projects {
          id
          name
          description
          createdAt
          lastAnalyzed
          componentsCount
          issuesCount
        }
      }
    `
    return this.graphqlQuery(query)
  }
}

export const perfMasterAPI = new PerfMasterAPI()
