export interface WebSocketMessage {
  type: "performance_update" | "analysis_complete" | "component_change" | "system_alert" | "heartbeat"
  payload: any
  timestamp: string
  id: string
}

export interface PerformanceUpdate {
  componentName: string
  metrics: {
    renderTime: number
    memoryUsage: number
    reRenderCount: number
    fps: number
  }
  timestamp: string
}

export interface SystemAlert {
  level: "info" | "warning" | "error" | "critical"
  title: string
  message: string
  componentName?: string
  timestamp: string
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners = new Map<string, Set<(data: any) => void>>()
  private isConnecting = false
  private heartbeatInterval: NodeJS.Timeout | null = null
  private baseUrl: string

  constructor(baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000") {
    this.baseUrl = baseUrl.replace("http", "ws")
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        return
      }

      this.isConnecting = true

      try {
        const wsUrl = `${this.baseUrl}/ws/performance/`
        console.log("[v0] Connecting to Django Channels WebSocket:", wsUrl)

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log("[v0] WebSocket connected to Django backend")
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.emit("connect", { timestamp: new Date().toISOString() })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log("[v0] Received WebSocket message:", data)

            // Handle different message types from Django
            switch (data.type) {
              case "performance_metrics":
                this.emit("performance_update", {
                  componentName: data.component || "System",
                  metrics: data.metrics,
                  timestamp: data.timestamp,
                })
                break
              case "analysis_result":
                this.emit("analysis_complete", data.payload)
                break
              case "component_scan":
                this.emit("component_change", data.payload)
                break
              case "alert":
                this.emit("system_alert", {
                  level: data.level,
                  title: data.title,
                  message: data.message,
                  componentName: data.component,
                  timestamp: data.timestamp,
                })
                break
              default:
                this.emit(data.type, data.payload)
            }
          } catch (error) {
            console.error("[v0] Error parsing WebSocket message:", error)
          }
        }

        this.ws.onclose = (event) => {
          console.log("[v0] WebSocket connection closed:", event.code, event.reason)
          this.isConnecting = false
          this.ws = null

          if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
            this.heartbeatInterval = null
          }

          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          this.isConnecting = false
          reject(error)
        }
      } catch (error) {
        console.error("[v0] WebSocket connection failed:", error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[v0] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect().catch((error) => {
          console.error("[v0] Reconnection failed:", error)
        })
      }
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: "heartbeat",
          payload: { status: "ping" },
          timestamp: new Date().toISOString(),
          id: `heartbeat-${Date.now()}`,
        })
      }
    }, 30000)
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error("[v0] WebSocket event callback error:", error)
        }
      })
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      console.log("[v0] Sent WebSocket message:", message)
    } else {
      console.warn("[v0] Cannot send message - WebSocket not connected")
    }
  }

  // Send performance metrics to Django backend
  sendPerformanceMetrics(metrics: any) {
    this.send({
      type: "performance_update",
      payload: metrics,
      timestamp: new Date().toISOString(),
      id: `metrics-${Date.now()}`,
    })
  }

  // Request component analysis
  requestAnalysis(components: string[]) {
    this.send({
      type: "analyze_components",
      payload: { components },
      timestamp: new Date().toISOString(),
      id: `analysis-${Date.now()}`,
    })
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect")
      this.ws = null
    }

    this.listeners.clear()
    this.reconnectAttempts = 0
    console.log("[v0] WebSocket disconnected")
  }

  getConnectionState(): "connecting" | "connected" | "disconnected" | "error" {
    if (this.isConnecting) return "connecting"
    if (this.ws?.readyState === WebSocket.OPEN) return "connected"
    if (this.ws?.readyState === WebSocket.CLOSED) return "disconnected"
    return "error"
  }
}

export const wsClient = new WebSocketClient()
