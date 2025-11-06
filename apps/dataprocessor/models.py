# apps/dataprocessor/models.py
from django.db import models

class FinancialReport(models.Model):
    """
    Stores the uploaded report, its generated summary, 
    and provides a unique ID for the vector store.
    """
    file = models.FileField(upload_to='reports/')
    summary_pros = models.TextField(blank=True, null=True)
    summary_cons = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # This will show the filename in the Django admin
        return self.file.name