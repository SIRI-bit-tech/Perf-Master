from celery import shared_task
from django.utils import timezone
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import json
import re
from .models import AIAnalysisJob, CodeAnalysis, PatternDetection
from performance.models import Project, OptimizationSuggestion
from django.conf import settings # Added for accessing HUGGINGFACE_API_KEY
from huggingface_hub import InferenceClient # Added for text generation
import logging # Added for logging errors

logger = logging.getLogger(__name__) # Initialize logger

# Initialize Hugging Face models
code_analyzer = None
pattern_detector = None
text_generator = None # Added for the text generation model

def get_code_analyzer():
    global code_analyzer
    if code_analyzer is None:
        # TODO: Consider passing HF API key if this pipeline needs it for private models
        code_analyzer = pipeline(
            "text-classification",
            model="microsoft/codebert-base",
            tokenizer="microsoft/codebert-base"
        )
    return code_analyzer

def get_pattern_detector():
    global pattern_detector
    if pattern_detector is None:
        # TODO: Consider passing HF API key if this pipeline needs it for private models
        pattern_detector = pipeline(
            "text-classification",
            model="huggingface/CodeBERTa-small-v1"
        )
    return pattern_detector

# New function to get the text generation model
def get_text_generator():
    global text_generator
    if text_generator is None:
        hf_api_key = settings.HUGGINGFACE_API_KEY
        if not hf_api_key:
            logger.error("HUGGINGFACE_API_KEY is not configured for text generation tasks in Celery.")
            # Return None or raise an exception if the key is critical for this functionality
            return None
        # Using google/flan-t5-large for more detailed generation
        # This model is generally free to use via Hugging Face Inference API for reasonable usage.
        # You can try 'google/flan-t5-base' for faster but slightly less detailed responses.
        try:
            text_generator = InferenceClient(token=hf_api_key, model="google/flan-t5-large")
            logger.info("Hugging Face text generation client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Hugging Face text generation client: {e}")
            text_generator = None
    return text_generator

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
        job = AIAnalysisJob.objects.get(id=job_id) # Re-fetch job in case of error before first save
        job.status = 'failed'
        job.error_message = str(e)
        job.completed_at = timezone.now()
        job.save()
        logger.error(f"Error in analyze_code_performance for job {job_id}: {e}", exc_info=True)


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
        # Pass the text_generator to detect_code_patterns for dynamic suggestions
        generator = get_text_generator() # Get the text generator
        patterns = detect_code_patterns(code_content, detector, generator) # Modified call
        
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
        job = AIAnalysisJob.objects.get(id=job_id) # Re-fetch job in case of error before first save
        job.status = 'failed'
        job.error_message = str(e)
        job.completed_at = timezone.now()
        job.save()
        logger.error(f"Error in detect_performance_patterns for job {job_id}: {e}", exc_info=True)


def split_code_into_chunks(code, max_length=512):
    """Split code into manageable chunks for AI analysis"""
    lines = code.split('\n')
    chunks = []
    current_chunk = []
    current_length = 0
    
    for line in lines:
        # A simple length check. For more accuracy, use tokenizer.encode() length.
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
            # Assuming result[0] contains {'label': '...', 'score': ...}
            # Adjust score calculation based on what 'label' represents good/bad performance
            # For now, let's assume a higher score indicates better performance confidence
            total_score += result[0].get('score', 0.5) # Default to 0.5 if score is missing
            count += 1
    
    if count == 0:
        return 50 # Default if no scores could be aggregated
    
    avg_score = total_score / count
    return int(avg_score * 100) # Scale to 0-100

def calculate_maintainability_score(code):
    """Calculate maintainability score"""
    lines = code.split('\n')
    non_empty_lines = [line for line in lines if line.strip()]
    
    if not non_empty_lines:
        return 100
    
    # Calculate metrics
    avg_line_length = sum(len(line) for line in non_empty_lines) / len(non_empty_lines)
    comment_ratio = len([line for line in lines if line.strip().startswith('#') or line.strip().startswith('//') or line.strip().startswith('/*')]) / len(lines)
    
    # Score based on readability factors
    score = 100
    if avg_line_length > 80:
        score -= (avg_line_length - 80) * 0.5
    if comment_ratio < 0.1: # Low comment ratio penalizes
        score -= 20
    
    return max(0, min(100, score))


# Modified to accept a text_generator
def detect_code_patterns(code, detector, generator): # Added generator parameter
    """Detect performance patterns in code"""
    patterns = []
    
    # Common anti-patterns to detect (regex based)
    anti_patterns_config = [ # Renamed to avoid confusion with dynamic generation
        {
            'pattern': r'useState\s*\([^)]*\)\s*;\s*useState',
            'name': 'Multiple useState calls',
            'type': 'performance_issue',
        },
        {
            'pattern': r'useEffect\s*\(\s*=>\s*{[^}]*},\s*\[\]\s*\)',
            'name': 'useEffect with empty dependency array',
            'type': 'optimization_opportunity',
        },
        {
            'pattern': r'\.map\s*\([^)]*\)\s*\.filter\s*\([^)]*\)',
            'name': 'Chained map and filter',
            'type': 'performance_issue',
        },
        # Add more regex-based patterns here
    ]
    
    lines = code.split('\n')
    
    for i, line in enumerate(lines):
        for ap_config in anti_patterns_config: # Iterate through the config
            if re.search(ap_config['pattern'], line):
                generated_description = ""
                generated_fix = ""
                
                if generator:
                    try:
                        prompt = f"Given the code line: \"{line}\" and the detected anti-pattern: \"{ap_config['name']}\". Provide a concise description of this issue and a suggested code fix. Output in JSON format: {{'description': '...', 'suggested_fix': '...'}}"
                        llm_response_text = generator.text_generation(prompt, max_new_tokens=100)
                        
                        # Attempt to parse JSON. LLMs can be tricky with exact JSON output.
                        # Add robust parsing or try extracting text if JSON parsing fails.
                        llm_response = json.loads(llm_response_text.strip())
                        generated_description = llm_response.get('description', f"Detected: {ap_config['name']}. This is a {ap_config['type']} issue.")
                        generated_fix = llm_response.get('suggested_fix', "No specific fix generated by AI.")
                    except json.JSONDecodeError as jde:
                        logger.warning(f"Failed to parse JSON from LLM for pattern detection: {jde}. Response: {llm_response_text[:100]}...")
                        # Fallback if JSON parsing fails
                        generated_description = f"Detected: {ap_config['name']}. This is a {ap_config['type']} issue."
                        generated_fix = f"AI could not generate a specific fix. Consider {ap_config['name']} fix manually."
                    except Exception as e:
                        logger.error(f"Error generating text for pattern '{ap_config['name']}': {e}")
                        generated_description = f"Detected: {ap_config['name']}. This is a {ap_config['type']} issue."
                        generated_fix = "Error generating fix by AI."
                else:
                    generated_description = f"Detected: {ap_config['name']}. This is a {ap_config['type']} issue."
                    generated_fix = "AI text generator not available. Default fix."

                patterns.append({
                    'pattern_type': ap_config['type'],
                    'pattern_name': ap_config['name'],
                    'description': generated_description, # Dynamically generated
                    'line_start': i + 1,
                    'line_end': i + 1,
                    'confidence_score': 0.8, # This could also be AI-generated or fixed
                    'suggested_fix': generated_fix # Dynamically generated
                })
    
    return patterns


# Modified to use the text_generator for dynamic suggestions
def generate_optimization_suggestions(analysis):
    """Generate optimization suggestions based on analysis"""
    suggestions = []
    generator = get_text_generator() # Get the text generator

    # Helper to generate text from LLM
    def get_llm_suggestion(prompt_template, default_description, default_code_example):
        if not generator:
            return default_description, default_code_example
        
        try:
            prompt = prompt_template
            llm_response_text = generator.text_generation(prompt, max_new_tokens=200) # Increased tokens for code examples
            
            llm_response = json.loads(llm_response_text.strip())
            description = llm_response.get('description', default_description)
            code_example = llm_response.get('code_example', default_code_example)
            return description, code_example
        except json.JSONDecodeError as jde:
            logger.warning(f"Failed to parse JSON from LLM for optimization suggestion: {jde}. Response: {llm_response_text[:100]}...")
            return default_description, default_code_example
        except Exception as e:
            logger.error(f"Error generating LLM suggestion: {e}")
            return default_description, default_code_example

    
    if analysis.complexity_score > 70:
        prompt_template = f"Given a code component with high complexity (score {analysis.complexity_score}), suggest ways to refactor it into smaller, more manageable components. Provide a description of the issue and a simplified, illustrative code example for splitting components in JavaScript/React. Output in JSON format: {{'description': '...', 'code_example': '...'}}"
        default_desc = f'The component has a complexity score of {analysis.complexity_score}. Consider breaking it into smaller components.'
        default_code = '''// Split complex component into smaller, focused components
const ComplexComponent = () => {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
};'''
        description, code_example = get_llm_suggestion(prompt_template, default_desc, default_code)

        suggestions.append({
            'suggestion_type': 'code_splitting',
            'title': 'High Complexity Detected',
            'description': description,
            'code_example': code_example,
            'estimated_improvement': '20-30% render time reduction',
            'priority_score': 80
        })
    
    if analysis.performance_score < 50:
        prompt_template = f"Given a code component with a low performance score ({analysis.performance_score}), suggest how to use React.memo or useMemo for optimization. Provide a description of the benefit and a simplified code example demonstrating memoization in React. Output in JSON format: {{'description': '...', 'code_example': '...'}}"
        default_desc = 'Low performance score detected. Consider using React.memo or useMemo for expensive calculations.'
        default_code = '''// Memoize expensive calculations
const ExpensiveComponent = React.memo(({ data }) => {
  const expensiveValue = useMemo(() => {
    // heavyCalculation(data);
    return data; // Placeholder for actual heavy calculation
  }, [data]);
  
  return <div>{expensiveValue}</div>;
});'''
        description, code_example = get_llm_suggestion(prompt_template, default_desc, default_code)

        suggestions.append({
            'suggestion_type': 'memoization',
            'title': 'Add Memoization',
            'description': description,
            'code_example': code_example,
            'estimated_improvement': '40-60% render time reduction',
            'priority_score': 90
        })
    
    if analysis.maintainability_score < 60:
        prompt_template = f"Given a code component with low maintainability (score {analysis.maintainability_score}), suggest ways to improve its readability and structure by extracting complex logic into custom hooks. Provide a description of the benefit and a simplified code example for creating and using a custom hook in React. Output in JSON format: {{'description': '...', 'code_example': '...'}}"
        default_desc = 'Code maintainability is low. Consider refactoring for better readability by extracting complex logic into custom hooks.'
        default_code = '''// Extract complex logic into custom hooks
const useBusinessLogic = (data) => {
  // Complex logic here
  const processedData = data.map(item => item + 1); // Example
  return processedData;
};

const Component = ({ data }) => {
  const processedData = useBusinessLogic(data);
  return <div>{processedData}</div>;
};'''
        description, code_example = get_llm_suggestion(prompt_template, default_desc, default_code)

        suggestions.append({
            'suggestion_type': 'code_splitting', # Reusing type for refactoring suggestion
            'title': 'Improve Code Maintainability',
            'description': description,
            'code_example': code_example,
            'estimated_improvement': 'Better maintainability and debugging',
            'priority_score': 60
        })
    
    return suggestions
