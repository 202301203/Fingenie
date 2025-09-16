# Common_BS_analysis/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from .services import generate_common_size_statement

class AnalysisView(APIView):
    def post(self, request, *args, **kwargs):
        items_list = request.data.get("financial_items", [])

        if not items_list:
            return Response({"error": "No financial items provided"}, status=400)

        # Call service function to generate table
        common_size_data = generate_common_size_statement(items_list)

        return Response({
            "common_size_balance_sheet": common_size_data
        })
