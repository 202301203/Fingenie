"""Chatbot view using Groq LLM and stored FinancialReport summary context."""
import json
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.conf import settings
from langchain_groq import ChatGroq
from apps.dataprocessor.models import FinancialReport

GROQ_DEFAULT_MODEL = getattr(settings, 'GROQ_CHAT_MODEL', None) or os.environ.get('GROQ_CHAT_MODEL') or 'llama-3.1-8b-instant'

@csrf_exempt
def chatbot_api_view(request):
    """Handle chat requests based ONLY on stored financial report summary using Groq LLM."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError as e:
        return JsonResponse({'error': f'Invalid JSON: {e}'}, status=400)

    question = data.get('question')
    
    # This 'document_id' is the 'report_id' (Primary Key) from your
    # 'extract_data_api' response.
    document_id = data.get('document_id')
    chat_history = data.get('history', []) # Get the chat history
    
    # Get Groq API key (from request or environment fallback)
    api_key = data.get('api_key') or request.POST.get('api_key') or os.environ.get('GROQ_API_KEY') or getattr(settings, 'GROQ_API_KEY', None)
    if not api_key:
        return JsonResponse({'error': 'Missing Groq API key (api_key)'}, status=400)

    if not question or not document_id:
        return JsonResponse({'error': 'Missing question or document_id'}, status=400)

    # Init Groq LLM
    try:
        model_selection = {
            "extraction": "llama-3.1-8b-instant",      # Most reliable for extraction
            "analysis": "llama-3.1-8b-instant",        # Use same model for consistency
            "pros_cons": "llama-3.1-8b-instant",       # Avoid 70b models that have issues
            "ratios": "llama-3.1-8b-instant",          # Fast and reliable
            "summary": "llama-3.1-8b-instant"          # Consistent performance
        }

        temperature = 0.1  # Lower temperature for more consistent results

        # Use a purpose from request data if provided, otherwise default to 'analysis'
        purpose = data.get('purpose', 'analysis')
        model = model_selection.get(purpose, GROQ_DEFAULT_MODEL)

        llm = ChatGroq(
            model=model,
            groq_api_key=api_key,
            temperature=temperature,
            max_tokens=4096,  # Reduce token usage
            timeout=60,
            max_retries=1     # Fewer retries to avoid cascading failures
        )
    except Exception as e:
        return JsonResponse({'error': f'Groq model initialization failed: {e}'}, status=500)

    # 1. Fetch the report and its structured summary from the database.
    doc = get_object_or_404(FinancialReport, pk=document_id)

    # 2. Build context from stored summary (pros, cons, financial health summary)
    summary_data = doc.get_summary() if hasattr(doc, 'get_summary') else {}
    pros_list = summary_data.get('pros', []) or getattr(doc, 'pros', [])
    cons_list = summary_data.get('cons', []) or getattr(doc, 'cons', [])
    health_summary = summary_data.get('financial_health_summary', '') or getattr(doc, 'financial_health_summary', '')

    def format_points(points):
        return "\n".join(f"- {p}" for p in points if p)

    document_context = f"""
Company Name: {getattr(doc, 'company_name', 'Unknown')}
Ticker Symbol: {getattr(doc, 'ticker_symbol', '') or 'N/A'}

Pros:
{format_points(pros_list) or 'No pros found.'}

Cons:
{format_points(cons_list) or 'No cons found.'}

Overall Financial Health Summary:
{health_summary or 'No overall summary available.'}
"""

    # Build conversation prompt for Groq (keep last 10 messages)
    history_lines = []
    for m in chat_history[-10:]:
        role = m.get('role', 'user').lower()
        text = m.get('text', '')
        if role == 'model':
            history_lines.append(f"Assistant: {text}")
        else:
            history_lines.append(f"User: {text}")
    history_block = "\n".join(history_lines)

    prompt = (
        "You are a helpful financial analyst assistant. Use ONLY the provided summary context. "
        "If information is missing, state that it is unavailable. Keep responses concise and beginner-friendly.\n\n"
        "Summary Context:\n" + document_context + "\n\nConversation so far:\n" + history_block + "\n\nUser: " + question + "\nAssistant:"
    )

    try:
        response = llm.invoke(prompt)
        answer = getattr(response, 'content', None) or getattr(response, 'text', None) or str(response)
    except Exception as e:
        return JsonResponse({'error': f'Groq generation failed: {e}'}, status=500)

    return JsonResponse({
        'answer': answer,
        'company_name': getattr(doc, 'company_name', None),
        'ticker_symbol': getattr(doc, 'ticker_symbol', None)
    })