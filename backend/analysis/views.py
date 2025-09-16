# analysis/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .service import perform_comparative_analysis, get_ai_summary

class AnalysisView(APIView):
    def post(self, request, *args, **kwargs):
        # Get the list of items from the incoming request data
        items_list = request.data.get('financial_items', [])

        if not items_list:
            return Response({'error': 'No financial items provided'}, status=400)

        # Step 1: Perform the structured comparative calculations
        comparative_data = perform_comparative_analysis(items_list)

        # Step 2: Send the results of the calculation to the Gen AI
        ai_summary = get_ai_summary(comparative_data)

        # Step 3: Return both the structured data and the AI summary
        return Response({
            'comparative_data': comparative_data,
            'ai_summary': ai_summary
        })