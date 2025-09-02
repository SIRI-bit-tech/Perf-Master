// Database connection and query utilities for PerfMaster
import { Pool } from "pg"

// Database connection pool
let pool: Pool | null = null

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/perfmaster",
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

// Database query helper with error handling
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await getDbPool().connect()
  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  } finally {
    client.release()
  }
}

// Performance metrics queries
export const performanceQueries = {
  // Get recent performance metrics for a project
  getRecentMetrics: async (projectId: number, hours = 24) => {
    const result = await query(
      `
      SELECT 
        metric_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as sample_count,
        DATE_TRUNC('hour', timestamp) as hour
      FROM performance_metrics 
      WHERE project_id = $1 
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
      GROUP BY metric_type, DATE_TRUNC('hour', timestamp)
      ORDER BY hour DESC, metric_type
    `,
      [projectId],
    )
    return result.rows
  },

  // Get Core Web Vitals summary
  getCoreWebVitals: async (projectId: number) => {
    const result = await query(
      `
      SELECT 
        metric_type,
        AVG(value) as avg_value,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
        COUNT(*) as sample_count
      FROM performance_metrics 
      WHERE project_id = $1 
        AND metric_type IN ('lcp', 'fid', 'cls', 'ttfb', 'fcp')
        AND timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY metric_type
    `,
      [projectId],
    )
    return result.rows
  },

  // Insert new performance metric
  insertMetric: async (data: {
    projectId: number
    sessionId: string
    metricType: string
    value: number
    url?: string
    userAgent?: string
    deviceType?: string
    connectionType?: string
  }) => {
    const result = await query(
      `
      INSERT INTO performance_metrics 
      (project_id, session_id, metric_type, value, url, user_agent, device_type, connection_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, timestamp
    `,
      [
        data.projectId,
        data.sessionId,
        data.metricType,
        data.value,
        data.url,
        data.userAgent,
        data.deviceType,
        data.connectionType,
      ],
    )
    return result.rows[0]
  },
}

// Component performance queries
export const componentQueries = {
  // Get component performance data
  getComponentPerformance: async (projectId: number) => {
    const result = await query(
      `
      SELECT 
        component_name,
        component_path,
        AVG(render_time) as avg_render_time,
        AVG(mount_time) as avg_mount_time,
        SUM(update_count) as total_updates,
        AVG(memory_usage) as avg_memory_usage,
        COUNT(*) as measurement_count,
        MAX(timestamp) as last_measured
      FROM component_performance 
      WHERE project_id = $1 
        AND timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY component_name, component_path
      ORDER BY avg_render_time DESC
    `,
      [projectId],
    )
    return result.rows
  },

  // Insert component performance data
  insertComponentData: async (data: {
    projectId: number
    componentName: string
    componentPath: string
    renderTime: number
    mountTime: number
    updateCount: number
    propsSize: number
    childrenCount: number
    memoryUsage: number
  }) => {
    const result = await query(
      `
      INSERT INTO component_performance 
      (project_id, component_name, component_path, render_time, mount_time, 
       update_count, props_size, children_count, memory_usage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, timestamp
    `,
      [
        data.projectId,
        data.componentName,
        data.componentPath,
        data.renderTime,
        data.mountTime,
        data.updateCount,
        data.propsSize,
        data.childrenCount,
        data.memoryUsage,
      ],
    )
    return result.rows[0]
  },
}

// AI analysis queries
export const aiQueries = {
  // Get AI analysis results
  getAnalysisResults: async (projectId: number, analysisType?: string) => {
    const whereClause = analysisType ? "WHERE project_id = $1 AND analysis_type = $2" : "WHERE project_id = $1"
    const params = analysisType ? [projectId, analysisType] : [projectId]

    const result = await query(
      `
      SELECT 
        id,
        analysis_type,
        component_path,
        issue_type,
        severity,
        description,
        suggestion,
        code_snippet,
        confidence_score,
        auto_fixable,
        status,
        created_at,
        updated_at
      FROM ai_analysis 
      ${whereClause}
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        confidence_score DESC,
        created_at DESC
    `,
      params,
    )
    return result.rows
  },

  // Insert AI analysis result
  insertAnalysis: async (data: {
    projectId: number
    analysisType: string
    componentPath?: string
    issueType: string
    severity: string
    description: string
    suggestion: string
    codeSnippet?: string
    confidenceScore: number
    autoFixable: boolean
  }) => {
    const result = await query(
      `
      INSERT INTO ai_analysis 
      (project_id, analysis_type, component_path, issue_type, severity, 
       description, suggestion, code_snippet, confidence_score, auto_fixable)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `,
      [
        data.projectId,
        data.analysisType,
        data.componentPath,
        data.issueType,
        data.severity,
        data.description,
        data.suggestion,
        data.codeSnippet,
        data.confidenceScore,
        data.autoFixable,
      ],
    )
    return result.rows[0]
  },
}

// Bundle analysis queries
export const bundleQueries = {
  // Get bundle analysis data
  getBundleAnalysis: async (projectId: number) => {
    const result = await query(
      `
      SELECT 
        bundle_name,
        file_path,
        size_bytes,
        gzipped_size,
        chunk_type,
        dependencies,
        tree_shaking_savings,
        timestamp
      FROM bundle_analysis 
      WHERE project_id = $1 
      ORDER BY timestamp DESC, size_bytes DESC
    `,
      [projectId],
    )
    return result.rows
  },

  // Insert bundle analysis data
  insertBundleData: async (data: {
    projectId: number
    bundleName: string
    filePath: string
    sizeBytes: number
    gzippedSize: number
    chunkType: string
    dependencies: string[]
    treeShakingSavings: number
  }) => {
    const result = await query(
      `
      INSERT INTO bundle_analysis 
      (project_id, bundle_name, file_path, size_bytes, gzipped_size, 
       chunk_type, dependencies, tree_shaking_savings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, timestamp
    `,
      [
        data.projectId,
        data.bundleName,
        data.filePath,
        data.sizeBytes,
        data.gzippedSize,
        data.chunkType,
        JSON.stringify(data.dependencies),
        data.treeShakingSavings,
      ],
    )
    return result.rows[0]
  },
}

// Project and team queries
export const projectQueries = {
  // Get all projects for a team
  getTeamProjects: async (teamId: number) => {
    const result = await query(
      `
      SELECT 
        p.*,
        u.username as created_by_username,
        t.name as team_name
      FROM projects p
      JOIN users u ON p.created_by = u.id
      JOIN teams t ON p.team_id = t.id
      WHERE p.team_id = $1
      ORDER BY p.created_at DESC
    `,
      [teamId],
    )
    return result.rows
  },

  // Get project summary with performance data
  getProjectSummary: async (projectId: number) => {
    const result = await query(
      `
      SELECT * FROM project_performance_summary 
      WHERE project_id = $1
    `,
      [projectId],
    )
    return result.rows[0]
  },
}
