-- Sample data for PerfMaster development and testing

-- Insert sample teams
INSERT INTO teams (name, description, created_by) VALUES
('Frontend Team', 'Main frontend development team', 1),
('Performance Team', 'Dedicated performance optimization team', 1),
('DevOps Team', 'Infrastructure and deployment team', 1);

-- Insert sample users
INSERT INTO users (email, username, password_hash, first_name, last_name, role, team_id) VALUES
('admin@perfmaster.dev', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', 'Admin', 'User', 'admin', 1),
('dev1@perfmaster.dev', 'developer1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', 'John', 'Doe', 'developer', 1),
('dev2@perfmaster.dev', 'developer2', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', 'Jane', 'Smith', 'developer', 2),
('perf@perfmaster.dev', 'perfengineer', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', 'Alex', 'Johnson', 'performance_engineer', 2);

-- Insert sample projects
INSERT INTO projects (name, description, url, team_id, created_by, framework, build_tool) VALUES
('E-commerce Dashboard', 'Main customer-facing e-commerce application', 'https://shop.example.com', 1, 1, 'React', 'Webpack'),
('Admin Panel', 'Internal admin dashboard for content management', 'https://admin.example.com', 1, 2, 'Next.js', 'Turbopack'),
('Mobile App Web', 'Progressive web app for mobile users', 'https://m.example.com', 2, 3, 'React Native Web', 'Metro'),
('Marketing Site', 'Company marketing and landing pages', 'https://example.com', 1, 1, 'Next.js', 'Webpack');

-- Insert sample performance metrics (last 7 days)
INSERT INTO performance_metrics (project_id, session_id, metric_type, value, url, device_type, connection_type, timestamp) VALUES
-- E-commerce Dashboard metrics
(1, 'sess_001', 'lcp', 2.1, 'https://shop.example.com', 'desktop', '4g', NOW() - INTERVAL '1 hour'),
(1, 'sess_001', 'fid', 45, 'https://shop.example.com', 'desktop', '4g', NOW() - INTERVAL '1 hour'),
(1, 'sess_001', 'cls', 0.05, 'https://shop.example.com', 'desktop', '4g', NOW() - INTERVAL '1 hour'),
(1, 'sess_002', 'lcp', 3.2, 'https://shop.example.com/products', 'mobile', '3g', NOW() - INTERVAL '2 hours'),
(1, 'sess_002', 'fid', 120, 'https://shop.example.com/products', 'mobile', '3g', NOW() - INTERVAL '2 hours'),
(1, 'sess_002', 'cls', 0.12, 'https://shop.example.com/products', 'mobile', '3g', NOW() - INTERVAL '2 hours'),

-- Admin Panel metrics
(2, 'sess_003', 'lcp', 1.8, 'https://admin.example.com', 'desktop', 'wifi', NOW() - INTERVAL '30 minutes'),
(2, 'sess_003', 'fid', 25, 'https://admin.example.com', 'desktop', 'wifi', NOW() - INTERVAL '30 minutes'),
(2, 'sess_003', 'cls', 0.02, 'https://admin.example.com', 'desktop', 'wifi', NOW() - INTERVAL '30 minutes'),

-- Mobile App Web metrics
(3, 'sess_004', 'lcp', 2.8, 'https://m.example.com', 'mobile', '4g', NOW() - INTERVAL '45 minutes'),
(3, 'sess_004', 'fid', 85, 'https://m.example.com', 'mobile', '4g', NOW() - INTERVAL '45 minutes'),
(3, 'sess_004', 'cls', 0.08, 'https://m.example.com', 'mobile', '4g', NOW() - INTERVAL '45 minutes');

-- Insert sample component performance data
INSERT INTO component_performance (project_id, component_name, component_path, render_time, mount_time, update_count, props_size, children_count, memory_usage, timestamp) VALUES
(1, 'ProductCard', '/components/ProductCard.tsx', 12.5, 45.2, 3, 1024, 5, 2048, NOW() - INTERVAL '1 hour'),
(1, 'ShoppingCart', '/components/ShoppingCart.tsx', 25.8, 120.5, 8, 2048, 12, 4096, NOW() - INTERVAL '1 hour'),
(1, 'ProductList', '/components/ProductList.tsx', 85.2, 200.1, 2, 4096, 50, 8192, NOW() - INTERVAL '2 hours'),
(2, 'DataTable', '/components/DataTable.tsx', 45.6, 150.3, 15, 8192, 100, 16384, NOW() - INTERVAL '30 minutes'),
(2, 'Dashboard', '/components/Dashboard.tsx', 120.4, 300.8, 5, 3072, 25, 6144, NOW() - INTERVAL '45 minutes'),
(3, 'MobileNav', '/components/MobileNav.tsx', 8.2, 25.1, 12, 512, 8, 1024, NOW() - INTERVAL '1 hour');

-- Insert sample bundle analysis data
INSERT INTO bundle_analysis (project_id, bundle_name, file_path, size_bytes, gzipped_size, chunk_type, dependencies, tree_shaking_savings, timestamp) VALUES
(1, 'main', '/dist/main.js', 245760, 89234, 'main', '["react", "react-dom", "lodash"]', 15360, NOW() - INTERVAL '1 day'),
(1, 'vendor', '/dist/vendor.js', 512000, 156789, 'vendor', '["react", "react-dom", "moment", "axios"]', 45120, NOW() - INTERVAL '1 day'),
(1, 'products', '/dist/products.js', 128000, 42567, 'async', '["product-utils", "image-loader"]', 8960, NOW() - INTERVAL '1 day'),
(2, 'main', '/dist/main.js', 189440, 67234, 'main', '["react", "next", "chart.js"]', 12800, NOW() - INTERVAL '1 day'),
(2, 'admin', '/dist/admin.js', 345600, 123456, 'async', '["admin-utils", "data-grid"]', 23040, NOW() - INTERVAL '1 day');

-- Insert sample AI analysis results
INSERT INTO ai_analysis (project_id, analysis_type, component_path, issue_type, severity, description, suggestion, code_snippet, confidence_score, auto_fixable, status) VALUES
(1, 'performance', '/components/ProductCard.tsx', 'unnecessary_rerender', 'medium', 'Component re-renders on every parent update due to inline object creation', 'Move object creation outside render or use useMemo', 'const style = { color: "red" }; // Move outside', 0.85, TRUE, 'open'),
(1, 'performance', '/components/ShoppingCart.tsx', 'memory_leak', 'high', 'Event listener not cleaned up in useEffect', 'Add cleanup function to useEffect return', 'return () => element.removeEventListener(...)', 0.92, TRUE, 'open'),
(2, 'accessibility', '/components/DataTable.tsx', 'missing_aria', 'medium', 'Table missing proper ARIA labels for screen readers', 'Add aria-label and role attributes', '<table role="table" aria-label="Data table">', 0.78, TRUE, 'fixed'),
(3, 'security', '/utils/api.ts', 'xss_vulnerability', 'critical', 'User input not sanitized before DOM insertion', 'Use DOMPurify or similar sanitization library', 'DOMPurify.sanitize(userInput)', 0.95, FALSE, 'open');

-- Insert sample performance alerts
INSERT INTO performance_alerts (project_id, alert_type, threshold_value, current_value, message, severity, triggered_at) VALUES
(1, 'lcp_threshold', 2.5, 3.2, 'Largest Contentful Paint exceeded threshold on mobile devices', 'high', NOW() - INTERVAL '2 hours'),
(1, 'bundle_size', 500000, 512000, 'Vendor bundle size exceeded 500KB limit', 'medium', NOW() - INTERVAL '1 day'),
(2, 'memory_usage', 50000000, 65000000, 'Memory usage spike detected in Dashboard component', 'high', NOW() - INTERVAL '3 hours'),
(3, 'cls_threshold', 0.1, 0.12, 'Cumulative Layout Shift threshold exceeded', 'medium', NOW() - INTERVAL '1 hour');

-- Insert sample monitoring sessions
INSERT INTO monitoring_sessions (project_id, user_id, session_token, start_time, metrics_collected, status) VALUES
(1, 1, 'token_abc123', NOW() - INTERVAL '2 hours', 156, 'active'),
(2, 2, 'token_def456', NOW() - INTERVAL '1 hour', 89, 'active'),
(3, 3, 'token_ghi789', NOW() - INTERVAL '3 hours', 234, 'ended'),
(1, 4, 'token_jkl012', NOW() - INTERVAL '30 minutes', 45, 'active');
