from celery import shared_task
from django.utils import timezone
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import json
import re
from .models import AIAnalysisJob, CodeAnalysis, PatternDetection
from performance.models import Project, OptimizationSuggestion

# Initialize Hugging Face models
code_analyzer = None
pattern_detector = None

def get_code_analyzer():
    global code_analyzer
    if code_analyzer is None:
        code_analyzer = pipeline(
            "text-classification",
            model="microsoft/codebert-base",
            tokenizer="microsoft/codebert-base"
        )
    return code_analyzer

def get_pattern_detector():
    global pattern_detector
    if pattern_detector is None:
        pattern_detector = pipeline(
            "text-classification",
            model="huggingface/CodeBERTa-small-v1"
        )
    return pattern_detector

@shared_task
def analyze_code_performance(job_id):
    try:
        job = AIAnalysisJob.objects.get(id=job_id)
        job.status = 'running'
        job.started_at = timezone.now()
        job.save()
        
        project = job.project
        code_content = job.input_data.get('code_content', '')
        file_path = job.input_data.get('file_path', '')
        
        # Analyze code with Hugging Face model
        analyzer = get_code_analyzer()
        
        # Split code into chunks for analysis
        chunks = split_code_into_chunks(code_content)
        analysis_results = []
        
        for chunk in chunks:
            result = analyzer(chunk)
            analysis_results.append(result)
        
        # Calculate scores
        complexity_score = calculate_complexity_score(code_content)
        performance_score = calculate_performance_score(analysis_results)
        maintainability_score = calculate_maintainability_score(code_content)
        
        # Save analysis result
        analysis = CodeAnalysis.objects.create(
            project=project,
            file_path=file_path,
            code_content=code_content,
            analysis_result=analysis_results,
            complexity_score=complexity_score,
            performance_score=performance_score,
            maintainability_score=maintainability_score
        )
        
        # Generate optimization suggestions
        suggestions = generate_optimization_suggestions(analysis)
        for suggestion_data in suggestions:
            OptimizationSuggestion.objects.create(
                project=project,
                **suggestion_data
            )
        
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.result_data = {
            'analysis_id': str(analysis.id),
            'complexity_score': complexity_score,
            'performance_score': performance_score,
            'maintainability_score': maintainability_score,
            'suggestions_count': len(suggestions)
        }
        job.save()
        
    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        job.completed_at = timezone.now()
        job.save()

@shared_task
def detect_performance_patterns(job_id):
    try:
        job = AIAnalysisJob.objects.get(id=job_id)
        job.status = 'running'
        job.started_at = timezone.now()
        job.save()
        
        project = job.project
        code_content = job.input_data.get('code_content', '')
        file_path = job.input_data.get('file_path', '')
        
        # Detect patterns using AI
        detector = get_pattern_detector()
        patterns = detect_code_patterns(code_content, detector)
        
        # Save detected patterns
        for pattern_data in patterns:
            PatternDetection.objects.create(
                project=project,
                file_path=file_path,
                **pattern_data
            )
        
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.result_data = {
            'patterns_detected': len(patterns),
            'patterns': patterns
        }
        job.save()
        
    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        job.completed_at = timezone.now()
        job.save()

def split_code_into_chunks(code, max_length=512):
    """Split code into manageable chunks for AI analysis"""
    lines = code.split('\n')
    chunks = []
    current_chunk = []
    current_length = 0
    
    for line in lines:
        if current_length + len(line) > max_length and current_chunk:
            chunks.append('\n'.join(current_chunk))
            current_chunk = [line]
            current_length = len(line)
        else:
            current_chunk.append(line)
            current_length += len(line)
    
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    
    return chunks

def calculate_complexity_score(code):
    """Calculate cyclomatic complexity score"""
    # Count decision points
    decision_keywords = ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'case', 'switch']
    complexity = 1  # Base complexity
    
    for keyword in decision_keywords:
        complexity += len(re.findall(rf'\b{keyword}\b', code, re.IGNORECASE))
    
    # Normalize to 0-100 scale
    return min(complexity * 5, 100)

def calculate_performance_score(analysis_results):
    """Calculate performance score based on AI analysis"""
    if not analysis_results:
        return 50
    
    # Average confidence scores from AI analysis
    total_score = 0
    count = 0
    
    for result in analysis_results:
        if isinstance(result, list) and result:
            total_score += result[0].get('score', 0.5)
            count += 1
    
    if count == 0:
        return 50
    
    avg_score = total_score / count
    return int(avg_score * 100)

def calculate_maintainability_score(code):
    """Calculate maintainability score"""
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    
    if not non_empty_lines:
        return 100
    
    # Calculate metrics
    avg_line_length = sum(len(line) for line in non_empty_lines) / len(non_empty_lines)
    comment_ratio = len([line for line in lines if line.strip().startswith('#')]) / len(lines)
    
    # Score based on readability factors
    score = 100
    if avg_line_length > 80:
        score -= (avg_line_length - 80) * 0.5
    if comment_ratio < 0.1:
        score -= 20
    
    return max(0, min(100, score))

def detect_code_patterns(code, detector):
    """Detect performance patterns in code"""
    patterns = []
    
    # Common anti-patterns to detect
    anti_patterns = [
        {
            'pattern': r'useState$$[^)]*$$\s*;\s*useState',
            'name': 'Multiple useState calls',
            'type': 'performance_issue',
            'description': 'Multiple useState calls can be optimized with useReducer',
            'fix': 'Consider using useReducer for complex state management'
        },
        {
            'pattern': r'useEffect$$\s*\($$\s*=>\s*{[^}]*}\s*,\s*\[\]\s*\)',
            'name': 'Empty dependency array',
            'type': 'optimization_opportunity',
            'description': 'useEffect with empty dependency array runs only once',
            'fix': 'Ensure this is the intended behavior'
        },
        {
            'pattern': r'\.map$$[^)]*$$\.filter$$[^)]*$$',
            'name': 'Chained map and filter',
            'type': 'performance_issue',
            'description': 'Chained map and filter operations can be optimized',
            'fix': 'Consider combining operations or using reduce'
        }
    ]
    
    lines = code.split('\n')
    
    for i, line in enumerate(lines):
        for anti_pattern in anti_patterns:
            if re.search(anti_pattern['pattern'], line):
                patterns.append({
                    'pattern_type': anti_pattern['type'],
                    'pattern_name': anti_pattern['name'],
                    'description': anti_pattern['description'],
                    'line_start': i + 1,
                    'line_end': i + 1,
                    'confidence_score': 0.8,
                    'suggested_fix': anti_pattern['fix']
                })
    
    return patterns

def generate_optimization_suggestions(analysis):
    """Generate optimization suggestions based on analysis"""
    suggestions = []
    
    if analysis.complexity_score > 70:
        suggestions.append({
            'suggestion_type': 'code_splitting',
            'title': 'High Complexity Detected',
            'description': f'The component has a complexity score of {analysis.complexity_score}. Consider breaking it into smaller components.',
            'code_example': '// Split complex component into smaller, focused components\nconst ComplexComponent = () => {\n  return (\n    <div>\n      <Header />\n      <MainContent />\n      <Footer />\n    </div>\n  );\n};',
            'estimated_improvement': '20-30% render time reduction',
            'priority_score': 80
        })
    
    if analysis.performance_score < 50:
        suggestions.append({
            'suggestion_type': 'memoization',
            'title': 'Add Memoization',
            'description': 'Low performance score detected. Consider using React.memo or useMemo for expensive calculations.',
            'code_example': '// Memoize expensive calculations\nconst ExpensiveComponent = React.memo(({ data }) => {\n  const expensiveValue = useMemo(() => {\n    return heavyCalculation(data);\n  }, [data]);\n  \n  return <div>{expensiveValue}</div>;\n});',
            'estimated_improvement': '40-60% render time reduction',
            'priority_score': 90
        })
    
    if analysis.maintainability_score < 60:
        suggestions.append({
            'suggestion_type': 'code_splitting',
            'title': 'Improve Code Maintainability',
            'description': 'Code maintainability is low. Consider refactoring for better readability.',
            'code_example': '// Extract complex logic into custom hooks\nconst useBusinessLogic = (data) => {\n  // Complex logic here\n  return processedData;\n};\n\nconst Component = ({ data }) => {\n  const processedData = useBusinessLogic(data);\n  return <div>{processedData}</div>;\n};',
            'estimated_improvement': 'Better maintainability and debugging',
            'priority_score': 60
        })
    
    return suggestions
