"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ComponentTree } from "@/components/component-tree"
import { perfMasterAPI } from "@/lib/api-client"
import { Search, Filter, Clock, MemoryStick as Memory, Zap, AlertTriangle, CheckCircle } from "lucide-react"

export default function ComponentsPage() {
  const [components, setComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const data = await perfMasterAPI.getComponents()
        setComponents(data)
      } catch (error) {
        console.error("Failed to fetch components:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComponents()
  }, [])

  const filteredComponents = components.filter((component) =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Components</h1>
            <p className="text-muted-foreground">Analyze and optimize component performance</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Zap className="h-4 w-4 mr-2" />
            Scan Components
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Component Analysis</h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComponents.length > 0 ? (
                  filteredComponents.map((component, index) => (
                    <Card key={index} className="performance-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{component.name}</CardTitle>
                          <Badge
                            variant={
                              component.performance === "excellent"
                                ? "default"
                                : component.performance === "good"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {component.performance}
                          </Badge>
                        </div>
                        <CardDescription>{component.path}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-secondary" />
                            <span>{component.renderTime}ms</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Memory className="h-4 w-4 text-chart-3" />
                            <span>{component.memoryUsage}KB</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {component.issues > 0 ? (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-secondary" />
                            )}
                            <span>{component.issues} issues</span>
                          </div>
                        </div>

                        {component.suggestions && component.suggestions.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium">Optimization Suggestions:</h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {component.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No components found. Try scanning your project first.</p>
                      <Button className="mt-4" onClick={() => window.location.reload()}>
                        <Zap className="h-4 w-4 mr-2" />
                        Scan Components
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Component Tree</h2>
            <ComponentTree />
          </div>
        </div>
      </div>
    </div>
  )
}
