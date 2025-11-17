import requests
from django.conf import settings
from django.http import JsonResponse

def article_api(request):
    """
    API endpoint to fetch paginated financial news articles (20 per page)
    with next and previous page support.
    """
    try:
        # --- Search query ---
        query = "finance OR investing OR stock market OR company balance sheets"

        # --- Pagination parameters ---
        page = int(request.GET.get('page', 1))  # Default page = 1
        page_size = 20  # Show 20 articles per page

        # --- API key and endpoint ---
        api_key = settings.NEWS_API_KEY
        url = (
            'https://newsapi.org/v2/everything?'
            f'qInTitle={query}&'
            'sortBy=publishedAt&'
            'language=en&'
            f'pageSize={page_size}&'
            f'page={page}&'
            f'apiKey={api_key}'
        )

        # --- Make the API call ---
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

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
