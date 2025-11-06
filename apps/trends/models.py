# apps/trends/models.py
from django.db import models
import uuid

class FinancialAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    ticker_symbol = models.CharField(max_length=50, blank=True, null=True)
    analysis_result = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'financial_analysis'

class UploadedFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    analysis = models.ForeignKey(FinancialAnalysis, on_delete=models.CASCADE, related_name='uploaded_files')
    file = models.FileField(upload_to='balance_sheets/')
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'uploaded_files'