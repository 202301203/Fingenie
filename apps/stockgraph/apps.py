# apps/stockgraph/apps.py

from django.apps import AppConfig

class StockgraphConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.stockgraph' # <-- THIS IS THE FIX