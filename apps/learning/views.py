import google.generativeai as genai
import json
from django.utils import timezone
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

    today = timezone.now().date()

    # 1. Check if the topic for today already exists in the database
    try:
        topic = DailyTopic.objects.get(pk=today)
        print("Topic found in cache. Returning from DB.")
        return JsonResponse(topic.to_dict(), status=200)
    
    except DailyTopic.DoesNotExist:
        print("Topic not found. Generating new topic...")
        
        # 2. GENERATION LOGIC
        try:
            # --- HYBRID KEY LOADER (Works for Local & Vercel) ---
            api_keys = []

            # A. Check for the list 'API_KEYS' (Localhost usually uses this)
            keys_str = getattr(settings, 'API_KEYS', None) or os.environ.get('API_KEYS', '')
            if keys_str:
                # Split by comma and strip spaces
                api_keys.extend([k.strip() for k in keys_str.split(',') if k.strip()])

            # B. Check for the single 'GEMINI_API_KEY' (Vercel uses this)
            single_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
            if single_key and single_key not in api_keys:
                api_keys.append(single_key)

            # Validation
            if not api_keys:
                print("Error: No API keys found in API_KEYS or GEMINI_API_KEY.")
                return JsonResponse({'error': 'Missing API keys configuration'}, status=400)
            
            # --- Prepare Prompt (Do this ONCE before loops) ---
            last_topic = DailyTopic.objects.order_by('-date').first()
            avoid_instruction = ""
            if last_topic:
                print(f"Avoiding previous topic: {last_topic.term}")
                avoid_instruction = f"- IMPORTANT: Do NOT generate the term '{last_topic.term}'. Pick something else."

            prompt = f"""
            Generate a new "Financial Topic of the Day".
            It should be about a common financial ratio, accounting basic, or investment metric.
            {avoid_instruction}
            - Keep the "term" concise (e.g., "P/E Ratio", "Compounding Interest").
            - Keep the "explanation" simple, under 100 words, like you're explaining it to a beginner.
            - Create one multiple-choice "question" to test the explanation.
            - Provide exactly 4 "options" for the question.
            - One of the options must be the "correct_answer".
            - Provide a brief "answer_explanation" (under 50 words) explaining *why* that answer is correct.
            - Ensure the correct_answer *exactly* matches one of the strings in the options array.
            """
            
            # --- Models to try (Fastest First) ---
            model_names = [
                'models/gemini-2.5-flash',
                'models/gemini-flash-latest',
                'models/gemini-2.5-pro',
                'models/gemini-pro-latest',
            ]
                        
            response_json = None
            last_error = None

            # --- OUTER LOOP: Iterate Keys ---
            for api_key in api_keys:
                if response_json: break # Stop if we found a solution
                
                print(f"Trying with key ending in ...{api_key[-4:]}")
                genai.configure(api_key=api_key)
                
                # --- INNER LOOP: Iterate Models ---
                for model_name in model_names:
                    try:
                        # print(f"Attempting model: {model_name}")
                        model = genai.GenerativeModel(
                            model_name=model_name,
                            generation_config={
                                "response_mime_type": "application/json",
                                "response_schema": TOPIC_SCHEMA
                            }
                        )
                        
                        # GENERATE HERE (Inside the loop!)
                        response = model.generate_content(prompt)
                        
                        if not response.text:
                            raise ValueError("Empty response")

                        # Parse and Validate
                        temp_data = json.loads(response.text)
                        
                        options = temp_data.get('options', [])
                        correct = temp_data.get('correct_answer')
                        
                        # Logic Checks
                        if correct not in options:
                            raise ValueError(f"AI Logic Error: Answer '{correct}' not found in options.")
                        
                        if len(set(options)) != len(options):
                            raise ValueError("Duplicate options detected.")

                        # If success:
                        response_json = temp_data
                        print(f"SUCCESS with key ...{api_key[-4:]} and model {model_name}")
                        break # Break inner model loop
                        
                    except Exception as e:
                        print(f"Failed {model_name} with key ...{api_key[-4:]}: {e}")
                        last_error = e
                        continue # Try next model
            
            # --- CHECK IF GENERATION FAILED ---
            if not response_json:
                return JsonResponse({
                    'error': 'All keys/models failed.',
                    'details': str(last_error)
                }, status=500)

            # 6. Save to DB
            topic = DailyTopic.objects.create(
                date=today,
                term=response_json.get('term'),
                explanation=response_json.get('explanation'),
                question=response_json.get('question'),
                options=response_json.get('options', []),
                correct_answer=response_json.get('correct_answer'),
                answer_explanation=response_json.get('answer_explanation')
            )
            
            print(f"New topic saved: {topic.term}")
            return JsonResponse(topic.to_dict(), status=201)

        except Exception as e:
            print(f"Critical error: {e}")
            return JsonResponse({'error': f'Server Error: {e}'}, status=500)