import google.generativeai as genai
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.conf import settings
import os


from apps.dataprocessor.models import FinancialReport

@csrf_exempt
def chatbot_api_view(request):
    """
    Handles chat requests based *ONLY* on the saved summary.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    try:
        data = json.loads(request.body)
        question = data.get('question')
        
        # This 'document_id' is the 'report_id' (Primary Key) from your
        # 'extract_data_api' response.
        document_id = data.get('document_id')
        chat_history = data.get('history', []) # Get the chat history
        
        # --- GET THE API KEY FROM THE REQUEST ---
        api_key = data.get('api_key') or request.POST.get('api_key')
        # If no API key provided in the request, fall back to server-side configured key (if any)
        if not api_key:
            api_key = getattr(settings, 'GENIE_API_KEY', None) or os.environ.get('GENIE_API_KEY')
        if not api_key:
            return JsonResponse({'error': 'Missing api_key in request body/form data and no GENIE_API_KEY configured on server'}, status=400)

        if not question or not document_id:
            return JsonResponse({'error': 'Missing question or document_id'}, status=400)
            
        if not api_key:
            return JsonResponse({'error': 'Missing api_key'}, status=400)

        # ---CONFIGURE API KEY INSIDE THE VIEW ---
        try:
            genai.configure(api_key=api_key)
        except Exception as e:
            return JsonResponse({'error': f'Invalid API key or configuration error: {e}'}, status=500)

        # 1. Fetch the report and its summary fields from the database.
        try:
            doc = get_object_or_404(FinancialReport, pk=document_id)
        except FinancialReport.DoesNotExist:
            return JsonResponse({'error': 'Document not found'}, status=404)

        # 2. Combine your 'pros' and 'cons' into one "context".
        #    This is the *only* information the AI will have.
        document_context = f"""
        Pros:
        {doc.summary_pros}

        Cons:
        {doc.summary_cons}
        """

        # 3. Create the System Prompt (the "rules" for the AI)
        system_prompt = f"""
        You are a helpful and intelligent financial analyst assistant.

        Your role:
        - Answer questions *only* using the provided document summary (which contains Pros and Cons).
        - Explain any financial term, ratio, or concept (like 'liquidity', 'EBITDA', 'P/E ratio', etc.) in **simple, easy-to-understand language** if the user asks for its meaning.
        - If the user asks for **advice or suggestions** (for example, "what should I do?", "how can I improve this?", "what steps can help?"),
        then give **general, practical, and safe guidance or ideas** based on the Pros and Cons provided — without making assumptions beyond the summary.

        Rules:
        - If the question refers to something outside the given summary or common financial knowledge, reply:
        "I'm sorry, that information is not available in the generated summary."
        - Keep answers concise, clear, and beginner-friendly.
        - Never generate fake data or make predictions.

        Here is the ONLY context you may refer to:
        ---
        {document_context}
        ---
        """

        # 4. Set up the model. Allow configuration via Django settings or environment
        #    to avoid hard-coding a model that may not be available in the target API/version.
        # Build an ordered list of candidate models to try. First prefer explicit setting/env value.
        preferred = getattr(settings, 'GENIE_MODEL', None) or os.environ.get('GENIE_MODEL')
        candidates = []
        if preferred:
            candidates.append(preferred)
        
        # --- (THIS BLOCK IS UPDATED AGAIN) ---
        # We will try the most common names for the v1beta API.
        # 'gemini-pro' is the most likely candidate to work.
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
                # Initialize the model with the system instruction
                model = genai.GenerativeModel(
                    model_name=mn,
                    system_instruction=system_prompt
                )
                model_name = mn
                # --- (NEW) Print the successful model name to the console ---
                print(f"Chatbot: Successfully initialized model: {model_name}")
                break # Success!
            except Exception as me:
                model_init_errors[mn] = str(me)

        if model is None:
            # No candidate worked — return actionable error including tried models and short errors
            pretty = '\n'.join([f"{k}: {v}" for k, v in list(model_init_errors.items())[:10]])
            return JsonResponse({
                'error': (
                    "None of the candidate models could be initialized for this API/version. "
                    "Tried models: " + ", ".join(tried_models_list) + ".\n" +
                    "Sample errors:\n" + pretty + "\n\n" +
                    "Please call your provider's ListModels API to see which models are available for your account and API version, and set GENIE_MODEL accordingly in settings or environment."
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

        # Start the chat with the prepared history
        chat = model.start_chat(history=gemini_history)
        
        # 6. Send the new question and get a response
        response = chat.send_message(question)

        return JsonResponse({'answer': response.text})

    except Exception as e:
        print(f"Error in chatbot view: {e}") # For debugging
        return JsonResponse({'error': f'An internal server error occurred: {e}'}, status=500)