-- PerfMaster Database Schema
-- Performance monitoring and analysis database

-- Users table for authentication and team management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'developer',
    team_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table for collaboration
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table for tracking different applications
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    team_id INTEGER REFERENCES teams(id),
    created_by INTEGER REFERENCES users(id),
    framework VARCHAR(100),
    build_tool VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table for storing real-time data
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    session_id VARCHAR(255),
    metric_type VARCHAR(100) NOT NULL, -- 'lcp', 'fid', 'cls', 'ttfb', 'fcp'
    value DECIMAL(10,3) NOT NULL,
    url VARCHAR(500),
    user_agent TEXT,
    device_type VARCHAR(50),
    connection_type VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_timestamp (project_id, timestamp),
    INDEX idx_metric_type (metric_type),
    INDEX idx_session (session_id)
);

-- Component performance table for React component analysis
CREATE TABLE IF NOT EXISTS component_performance (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    component_name VARCHAR(255) NOT NULL,
    component_path VARCHAR(500),
    render_time DECIMAL(8,3),
    mount_time DECIMAL(8,3),
    update_count INTEGER DEFAULT 0,
    props_size INTEGER,
    children_count INTEGER,
    memory_usage INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_component_project (project_id, component_name),
    INDEX idx_render_time (render_time)
);

-- Bundle analysis table for tracking bundle sizes and dependencies
CREATE TABLE IF NOT EXISTS bundle_analysis (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    bundle_name VARCHAR(255),
    file_path VARCHAR(500),
    size_bytes INTEGER NOT NULL,
    gzipped_size INTEGER,
    chunk_type VARCHAR(100), -- 'main', 'vendor', 'async'
    dependencies TEXT, -- JSON array of dependencies
    tree_shaking_savings INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_bundle (project_id, bundle_name),
    INDEX idx_size (size_bytes)
);

-- AI analysis results table
CREATE TABLE IF NOT EXISTS ai_analysis (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    analysis_type VARCHAR(100) NOT NULL, -- 'performance', 'security', 'accessibility'
    component_path VARCHAR(500),
    issue_type VARCHAR(100),
    severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    suggestion TEXT,
    code_snippet TEXT,
    confidence_score DECIMAL(3,2),
    auto_fixable BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'fixed', 'ignored'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_analysis (project_id, analysis_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status)
);

-- Performance alerts table for threshold monitoring
CREATE TABLE IF NOT EXISTS performance_alerts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    alert_type VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(10,3),
    current_value DECIMAL(10,3),
    message TEXT,
    severity VARCHAR(50),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INTEGER REFERENCES users(id),
    INDEX idx_project_alerts (project_id, triggered_at),
    INDEX idx_severity_alerts (severity)
);

-- Real-time sessions table for WebSocket connections
CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    metrics_collected INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    INDEX idx_session_token (session_token),
    INDEX idx_project_session (project_id, start_time)
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_component_performance_timestamp ON component_performance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bundle_analysis_timestamp ON bundle_analysis(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON ai_analysis(created_at DESC);

-- Create views for common queries
CREATE OR REPLACE VIEW project_performance_summary AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(DISTINCT pm.session_id) as total_sessions,
    AVG(CASE WHEN pm.metric_type = 'lcp' THEN pm.value END) as avg_lcp,
    AVG(CASE WHEN pm.metric_type = 'fid' THEN pm.value END) as avg_fid,
    AVG(CASE WHEN pm.metric_type = 'cls' THEN pm.value END) as avg_cls,
    COUNT(DISTINCT cp.component_name) as components_analyzed,
    SUM(ba.size_bytes) as total_bundle_size
FROM projects p
LEFT JOIN performance_metrics pm ON p.id = pm.project_id
LEFT JOIN component_performance cp ON p.id = cp.project_id
LEFT JOIN bundle_analysis ba ON p.id = ba.project_id
GROUP BY p.id, p.name;
