import requests
from django.conf import settings
from django.http import JsonResponse
from urllib.parse import urlencode, quote_plus # <-- NEW IMPORT for URL encoding

def article_api(request):
    """
    API endpoint to fetch paginated financial news articles (20 per page)
    with next and previous page support, using advanced search.
    """
    try:
        # --- Search query: Use advanced operators for investment focus ---
        # The key phrase 'stock market' or 'investing' MUST appear (+), 
        # OR look for terms like 'global economy' or 'forex'.
        query_text = (
            '("stock market" OR "investing" OR "company balance sheets") '
            'AND (finance OR "global economy" OR forex OR treasury) '
            'NOT (sports OR weather)'
        )

        # --- Pagination parameters ---
        page = int(request.GET.get('page', 1))  # Default page = 1
        page_size = 20  # Show 20 articles per page

        # --- API key and endpoint ---
        api_key = settings.NEWS_API_KEY
        url = 'https://newsapi.org/v2/everything'
        
        # --- Define parameters dictionary ---
        # Using a dictionary for params lets the requests library handle URL encoding automatically, 
        # which is crucial for the advanced search operators (like AND/OR/NOT and spaces).
        params = {
            'q': query_text,        # The full advanced query text
            'searchIn': 'title,description', # Focuses search on title and description for higher relevance
            'sortBy': 'publishedAt', # Newest articles come first
            'language': 'en',
            'pageSize': page_size,
            'page': page,
            'apiKey': api_key,
        }

        # --- Make the API call using the 'params' dictionary ---
        # requests.get will automatically build and encode the URL from the dictionary
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # --- Rest of your existing code remains the same ---
        # --- Clean and filter results ---
        articles = [
            article for article in data.get('articles', [])
            if article.get('title') and article.get('title') != '[Removed]'
        ]

        # --- Pagination info ---
        total_results = data.get('totalResults', 0)
        total_pages = (total_results // page_size) + (1 if total_results % page_size else 0)

        next_page = page + 1 if page < total_pages else None
        prev_page = page - 1 if page > 1 else None

        # --- Return JSON response ---
        return JsonResponse({
            'page': page,
            'page_size': page_size,
            'total_results': total_results,
            'total_pages': total_pages,
            'next_page': next_page,
            'prev_page': prev_page,
            'articles': articles,
        })

    except Exception as e:
        return JsonResponse({'error': f'An unexpected error occurred: {e}'}, status=500)
