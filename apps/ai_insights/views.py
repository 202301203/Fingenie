import google.generativeai as genai
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os

# --- (THIS IS THE MOST IMPORTANT PART) ---
# This prompt defines the AI's personality and rules.
AI_INSIGHTS_SYSTEM_PROMPT = """
You are "FinGenie", a helpful and insightful AI financial assistant and educator.
Your primary purpose is to answer financial questions, explain complex topics (like ratios, accounting, investing), and provide definitions.

You must follow these rules:
1.  **Educate, Don't Advise:** You can explain what a P/E ratio is, but you cannot give an opinion on a stock. You can explain what a 401k is, but you cannot tell a user how to invest their money.
2.  **No Personal Advice:** You MUST NOT give any personalized financial advice, investment recommendations, or opinions on whether a specific stock is a "buy" or "sell".
3.  **Politely Decline:** If a user asks for specific, personal financial advice, you must politely decline and explain that you are an educational tool, not a financial advisor. You can then offer to explain the *concepts* behind their question.
    - Example: If asked "Should I buy Tesla stock?", you should say: "As an AI, I cannot provide personal investment advice. However, I can explain the factors investors look at when evaluating a stock, such as P/E ratio, revenue growth, and market competition."
"""

@csrf_exempt
def ai_insights_view(request):
    """
    Handles general financial chat requests.
    This is not tied to any specific document.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    try:
        data = json.loads(request.body or '{}')
        # Accept alternate key names for flexibility from frontend.
        question = data.get('question') or data.get('prompt') or data.get('message')
        chat_history = data.get('history', [])  # list[{role,text}]
        # API key can come from request, settings or environment.
        api_key = (
            data.get('api_key')
            or getattr(settings, 'GEMINI_API_KEY', None)
            or os.environ.get('GEMINI_API_KEY')
        )

        if not question:
            return JsonResponse({'error': 'Missing question'}, status=400)

        if not api_key:
            return JsonResponse({'error': 'API key not provided and GEMINI_API_KEY not set on server.'}, status=500)

        # Configure SDK with resolved key
        try:
            genai.configure(api_key=api_key)
        except Exception as e:
            return JsonResponse({'error': f'Gemini configuration error: {e}'}, status=500)

        # 4. Set up the model.
        # Build an ordered list of candidate models to try.
        preferred = getattr(settings, 'GENIE_MODEL', None) or os.environ.get('GENIE_MODEL')
        candidates = []
        if preferred:
            candidates.append(preferred)
        
        # --- (USER REQUESTED MODEL LIST) ---
        candidates.extend([
            'models/gemini-2.5-flash',
            'models/gemini-2.5-pro',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
        ])
        # --- (END OF UPDATED BLOCK) ---

        model = None
        model_init_errors = {}
        tried_models_list = [] # To see which models were actually attempted
        
        for mn in candidates:
            # Avoid trying the same model name twice if 'preferred' was one of them
            if mn in tried_models_list:
                continue
            tried_models_list.append(mn)
            
            try:
                # --- (MODIFIED) ---
                # Initialize the model *without* system_instruction
                # This is more compatible and less likely to time out.
                model = genai.GenerativeModel(
                    model_name=mn
                )
                model_name = mn
                # --- (NEW) Print the successful model name to the console ---
                print(f"AI Insights: Successfully initialized model: {model_name}")
                break # Success!
            except Exception as me:
                model_init_errors[mn] = str(me)

        if model is None:
            # No candidate worked — return actionable error
            pretty = '\n'.join([f"{k}: {v}" for k, v in list(model_init_errors.items())[:10]])
            return JsonResponse({
                'error': (
                    "None of the candidate models could be initialized for this API/version. "
                    "Tried models: " + ", ".join(tried_models_list) + ".\n" +
                    "Sample errors:\n" + pretty
                ),
                'tried_errors': model_init_errors,
            }, status=500)

        # 5. Convert your simple chat history to the format Gemini expects
        gemini_history = []
        for message in chat_history:
            # Ensure roles are 'user' and 'model'
            role = message.get("role", "user").lower()
            if role not in ["user", "model"]:
                role = "user" # Default to user if role is weird
                
            gemini_history.append({
                "role": role,
                "parts": [{"text": message.get("text")}]
            })

        # --- (NEW) ---
        # Instead of system_instruction, prepend the context to the *first* question.
        # This is more compatible and avoids the proxy/JSONDecode error.
        final_question = question
        if not gemini_history: # If this is the first message (history is empty)
            final_question = f"""
            {AI_INSIGHTS_SYSTEM_PROMPT}

            My first question is: {question}
            """
        # --- (END NEW) ---

        # Start the chat with the prepared history
        chat = model.start_chat(history=gemini_history)
        
        # 6. Send the new question (with prepended context if it was the first)
        response = chat.send_message(final_question)

        return JsonResponse({'answer': response.text})

    except Exception as e:
        print(f"Error in AI Insights view: {e}") # For debugging
        return JsonResponse({'error': f'An internal server error occurred: {e}'}, status=500)