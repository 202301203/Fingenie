import google.generativeai as genai
import json
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os

from .models import DailyTopic

# This is the JSON schema we will force the AI to follow.
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
    Checks database first; if not found, generates a new one via AI.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    today = datetime.date.today()

    # 1. Check if the topic for today already exists in the database
    try:
        topic = DailyTopic.objects.get(pk=today)
        print("Topic found in cache. Returning from DB.")
        return JsonResponse(topic.to_dict(), status=200)
    
    except DailyTopic.DoesNotExist:
        print("Topic not found. Generating new topic...")
        # 2. If not, generate a new one
        try:
            data = json.loads(request.body)
            api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
            
            if not api_key:
                return JsonResponse({'error': 'Missing api_key'}, status=400)
            
            genai.configure(api_key=api_key)

            # Try different model names in order of preference
            model_names = [
                'models/gemini-2.5-flash',
                'models/gemini-2.5-pro',
                'models/gemini-flash-latest',
                'models/gemini-pro-latest',
            ]
                        
            last_error = None
            model = None
            
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(
                        model_name=model_name,
                        generation_config={
                            "response_mime_type": "application/json",
                            "response_schema": TOPIC_SCHEMA
                        }
                    )
                    print(f"Successfully initialized model: {model_name}")
                    break
                except Exception as e:
                    print(f"Failed to initialize {model_name}: {e}")
                    last_error = e
                    continue
            
            if not model:
                return JsonResponse({
                    'error': f'Failed to initialize any model. Last error: {last_error}',
                    'tried_models': model_names
                }, status=500)

            # 4. Create the prompt
            prompt = """
            Generate a new "Financial Topic of the Day".
            It should be about a common financial ratio, accounting basic, or investment metric.
            - Keep the "term" concise (e.g., "P/E Ratio", "Compounding Interest").
            - Keep the "explanation" simple, under 100 words, like you're explaining it to a beginner.
            - Create one multiple-choice "question" to test the explanation.
            - Provide exactly 4 "options" for the question.
            - One of the options must be the "correct_answer".
            - Provide a brief "answer_explanation" (under 50 words) explaining *why* that answer is correct.
            - Ensure the correct_answer *exactly* matches one of the strings in the options array.
            """
            
            # 5. Call the AI and handle potential errors
            try:
                response = model.generate_content(prompt)
                
                if not response.text:
                    raise ValueError("Empty response from AI model")
                    
                try:
                    response_json = json.loads(response.text)
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON response: {response.text}")
                    return JsonResponse({
                        'error': 'AI returned invalid JSON',
                        'details': str(e),
                        'raw_response': response.text[:500]  # First 500 chars for debugging
                    }, status=500)
            except Exception as e:
                print(f"Error generating content: {e}")
                return JsonResponse({
                    'error': 'Failed to generate content',
                    'details': str(e)
                }, status=500)

            # 6. Save the new topic to the database
            topic = DailyTopic.objects.create(
                date=today,
                term=response_json.get('term'),
                explanation=response_json.get('explanation'),
                question=response_json.get('question'),
                options=response_json.get('options', []),
                correct_answer=response_json.get('correct_answer'),
                answer_explanation=response_json.get('answer_explanation')
            )
            
            print(f"New topic generated and saved: {topic.term}")
            return JsonResponse(topic.to_dict(), status=201)

        except Exception as e:
            print(f"Error generating topic: {e}")
            return JsonResponse({'error': f'AI generation failed: {e}'}, status=500)