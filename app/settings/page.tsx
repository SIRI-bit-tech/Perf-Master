"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, Bell, Database, Zap, Shield, Save, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      performance: true,
      errors: true,
      deployments: false,
      weekly_reports: true,
    },
    monitoring: {
      real_time: true,
      auto_scan: true,
      deep_analysis: false,
      ai_suggestions: true,
    },
    api: {
      django_url: process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000",
      websocket_url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8000/ws",
      timeout: 30000,
    },
  })

  const handleSave = () => {
    // Save settings logic here
    console.log("Saving settings:", settings)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Settings</h1>
            <p className="text-muted-foreground">Configure PerfMaster to suit your needs</p>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic configuration for PerfMaster</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input id="project-name" defaultValue="My Project" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Input id="environment" defaultValue="development" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Project Description</Label>
                  <Input id="description" placeholder="Enter project description..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Performance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when performance drops</p>
                  </div>
                  <Switch
                    checked={settings.notifications.performance}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, performance: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Error Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts for critical errors</p>
                  </div>
                  <Switch
                    checked={settings.notifications.errors}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, errors: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Get weekly performance summaries</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weekly_reports}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, weekly_reports: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Monitoring Configuration
                </CardTitle>
                <CardDescription>Configure how PerfMaster monitors your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Enable live performance tracking</p>
                  </div>
                  <Switch
                    checked={settings.monitoring.real_time}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        monitoring: { ...prev.monitoring, real_time: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Component Scanning</Label>
                    <p className="text-sm text-muted-foreground">Automatically scan for new components</p>
                  </div>
                  <Switch
                    checked={settings.monitoring.auto_scan}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        monitoring: { ...prev.monitoring, auto_scan: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI-Powered Suggestions</Label>
                    <p className="text-sm text-muted-foreground">Get optimization suggestions from AI</p>
                  </div>
                  <Switch
                    checked={settings.monitoring.ai_suggestions}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        monitoring: { ...prev.monitoring, ai_suggestions: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>Configure backend API connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="django-url">Django Backend URL</Label>
                  <Input
                    id="django-url"
                    value={settings.api.django_url}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        api: { ...prev.api, django_url: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websocket-url">WebSocket URL</Label>
                  <Input
                    id="websocket-url"
                    value={settings.api.websocket_url}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        api: { ...prev.api, websocket_url: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings.api.timeout}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        api: { ...prev.api, timeout: Number.parseInt(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-muted-foreground">Encrypt sensitive performance data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Analytics</Label>
                    <p className="text-sm text-muted-foreground">Share anonymous usage data to improve PerfMaster</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input id="api-key" type="password" placeholder="Enter your API key..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
