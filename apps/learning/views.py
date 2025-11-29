import google.generativeai as genai
import json
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os

from .models import DailyTopic

# Schema for the AI response
TOPIC_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "term": {"type": "STRING"},
        "explanation": {"type": "STRING"},
        "question": {"type": "STRING"},
        "options": {
            "type": "ARRAY",
            "items": {"type": "STRING"}
        },
        "correct_answer": {"type": "STRING"},
        "answer_explanation": {"type": "STRING"}
    },
    "required": ["term", "explanation", "question", "options", "correct_answer", "answer_explanation"]
}

@csrf_exempt
def get_daily_topic_view(request):
    """
    Gets the financial topic of the day.
    Matches logic of ai_insights_view for stability.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid method. Use GET.'}, status=405)

    today = timezone.now().date()

    # 1. Check Database Cache First
    try:
        topic = DailyTopic.objects.get(pk=today)
        print("Topic found in cache. Returning from DB.")
        return JsonResponse(topic.to_dict(), status=200)
    except DailyTopic.DoesNotExist:
        print("Topic not found. Generating new topic...")

    # 2. Get API Key (MATCHING YOUR WORKING CODE)
    api_key = (
        getattr(settings, 'GEMINI_API_KEY', None)
        or os.environ.get('GEMINI_API_KEY')
    )

    if not api_key:
        print("Error: GEMINI_API_KEY not found.")
        return JsonResponse({'error': 'API key not provided and GEMINI_API_KEY not set.'}, status=500)

    # 3. Configure GenAI (MATCHING YOUR WORKING CODE)
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        return JsonResponse({'error': f'Gemini configuration error: {e}'}, status=500)

    # 4. Define Models (MATCHING YOUR WORKING CODE)
    candidates = [
        'models/gemini-2.5-flash',
        'models/gemini-2.5-pro',
        'models/gemini-flash-latest',
        'models/gemini-pro-latest',
        'models/gemini-1.5-flash', # Added as fallback
    ]

    # 5. Prepare Prompt
    last_topic = DailyTopic.objects.order_by('-date').first()
    avoid_instruction = ""
    if last_topic:
        avoid_instruction = f"- IMPORTANT: Do NOT generate the term '{last_topic.term}'. Pick something else."

    prompt = f"""
    Generate a new "Financial Topic of the Day".
    It should be about a common financial ratio, accounting basic, or investment metric.
    {avoid_instruction}
    - Keep the "term" concise (e.g., "P/E Ratio", "Compounding Interest").
    - Keep the "explanation" simple, under 100 words.
    - Create one multiple-choice "question".
    - Provide exactly 4 "options".
    - "correct_answer" must match one option exactly.
    - "answer_explanation": brief reason why it's correct.
    """

    # 6. Try Models Loop
    response_json = None
    last_error = None
    
    for model_name in candidates:
        try:
            # Initialize model
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": TOPIC_SCHEMA
                }
            )
            
            print(f"Attempting generation with: {model_name}")
            response = model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("Empty response")

            temp_data = json.loads(response.text)
            
            # Basic Validation
            if temp_data.get('correct_answer') not in temp_data.get('options', []):
                raise ValueError("AI Logic Error: Answer not in options.")
            
            response_json = temp_data
            print(f"SUCCESS using model: {model_name}")
            break # Stop if successful
            
        except Exception as e:
            print(f"Failed model {model_name}: {e}")
            last_error = e
            continue

    if not response_json:
        return JsonResponse({
            'error': 'All models failed.', 
            'details': str(last_error)
        }, status=500)

    # 7. Save to Database
    try:
        topic = DailyTopic.objects.create(
            date=today,
            term=response_json.get('term'),
            explanation=response_json.get('explanation'),
            question=response_json.get('question'),
            options=response_json.get('options', []),
            correct_answer=response_json.get('correct_answer'),
            answer_explanation=response_json.get('answer_explanation')
        )
        return JsonResponse(topic.to_dict(), status=201)
    except Exception as e:
        return JsonResponse({'error': f'Database save failed: {e}'}, status=500)