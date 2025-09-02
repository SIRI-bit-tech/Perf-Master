"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Zap, RefreshCw } from "lucide-react"
import { perfMasterAPI, type ComponentData } from "@/lib/api-client"

interface ComponentNode {
  name: string
  renderTime: number
  reRenders: number
  children?: ComponentNode[]
  issues?: string[]
  optimizations?: string[]
  path?: string
  memoryUsage?: number
  bundleSize?: number
}

function ComponentTreeNode({ node, depth = 0 }: { node: ComponentNode; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2)

  const hasIssues = node.issues && node.issues.length > 0
  const hasOptimizations = node.optimizations && node.optimizations.length > 0
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
          hasIssues ? "bg-destructive/10" : hasOptimizations ? "bg-primary/10" : "bg-card/50"
        }`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {hasChildren && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}

        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-medium">{node.name}</span>
            {hasIssues && <AlertTriangle className="h-4 w-4 text-destructive" />}
            {hasOptimizations && !hasIssues && <Zap className="h-4 w-4 text-primary" />}
            {!hasIssues && !hasOptimizations && <CheckCircle className="h-4 w-4 text-secondary" />}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">{node.renderTime}ms</span>
            <Badge variant={node.reRenders > 5 ? "destructive" : "secondary"} className="text-xs">
              {node.reRenders} renders
            </Badge>
          </div>
        </div>
      </div>

      {(hasIssues || hasOptimizations) && (
        <div className="ml-8 space-y-1">
          {node.issues?.map((issue, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>{issue}</span>
            </div>
          ))}
          {node.optimizations?.map((optimization, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-primary">
              <Zap className="h-3 w-3" />
              <span>{optimization}</span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && hasChildren && (
        <div className="space-y-2">
          {node.children!.map((child, index) => (
            <ComponentTreeNode key={index} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ComponentTree() {
  const [componentTree, setComponentTree] = useState<ComponentNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // loadComponentData()
  }, [])

  const loadComponentData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Scan components from the Django backend
      const scanResult = await perfMasterAPI.scanComponents("/components", true)
      
      if (scanResult.success && scanResult.components) {
        // Convert flat component list to tree structure
        const tree = buildComponentTree(scanResult.components)
        setComponentTree(tree)
      } else {
        throw new Error("Failed to scan components")
      }
    } catch (err) {
      console.error("[v0] Component tree loading failed:", err)
      setError(err instanceof Error ? err.message : "Failed to load component tree")
    } finally {
      setIsLoading(false)
    }
  }

  const buildComponentTree = (components: ComponentData[]): ComponentNode => {
    // Create a root node
    const root: ComponentNode = {
      name: "App",
      renderTime: components.reduce((acc, c) => acc + c.renderTime, 0),
      reRenders: Math.max(...components.map(c => c.reRenderCount)),
      children: []
    }

    // Convert components to tree nodes
    const nodes: ComponentNode[] = components.map(component => ({
      name: component.name,
      renderTime: component.renderTime,
      reRenders: component.reRenderCount,
      path: component.path,
      memoryUsage: component.memoryUsage,
      bundleSize: component.bundleSize,
      issues: component.issues.length > 0 ? component.issues : undefined,
      optimizations: component.renderTime > 30 ? ["Consider optimization"] : undefined
    }))

    // Group components by directory structure
    const grouped = groupComponentsByPath(nodes)
    root.children = grouped

    return root
  }

  const groupComponentsByPath = (components: ComponentNode[]): ComponentNode[] => {
    const groups: { [key: string]: ComponentNode[] } = {}
    
    components.forEach(component => {
      if (component.path) {
        const pathParts = component.path.split('/')
        const directory = pathParts.length > 2 ? pathParts[pathParts.length - 2] : 'components'
        
        if (!groups[directory]) {
          groups[directory] = []
        }
        groups[directory].push(component)
      }
    })

    return Object.entries(groups).map(([groupName, groupComponents]) => ({
      name: groupName,
      renderTime: groupComponents.reduce((acc, c) => acc + c.renderTime, 0),
      reRenders: Math.max(...groupComponents.map(c => c.reRenders)),
      children: groupComponents
    }))
  }

  if (error) {
    return (
      <Card className="performance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded" />
            Component Performance Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 space-y-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button onClick={loadComponentData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="performance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary rounded" />
          Component Performance Tree
          {isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
          )}
        </CardTitle>
        <CardDescription>Interactive component hierarchy with performance insights from Django backend</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading component tree...</span>
          </div>
        ) : componentTree ? (
          <>
            <ComponentTreeNode node={componentTree} />
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span>Issues Found</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Optimization Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-secondary" />
                    <span>Optimized</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadComponentData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Auto-Fix Issues
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No component data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
