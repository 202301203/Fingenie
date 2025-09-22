from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .utils import process_financial_file

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_financial_file(request):
    if "file" not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)
    
    uploaded_file = request.FILES["file"]
    try:
        data = process_financial_file(uploaded_file)
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
