import logging
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .utils import SafeJSONEncoder, clean_financial_data

logger = logging.getLogger(__name__)


class SafeJSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that handles NaN values in financial data
    and provides consistent API response formatting
    """
    encoder_class = SafeJSONEncoder
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render data to JSON with NaN cleaning and consistent formatting
        """
        try:
            # Get response from context to check status code
            response = renderer_context.get('response') if renderer_context else None
            status_code = response.status_code if response else None
            
            # Clean the data before rendering
            cleaned_data = clean_financial_data(data)
            
            # Apply consistent response formatting for success/error responses
            formatted_data = self.format_response(cleaned_data, status_code)
            
            return super().render(formatted_data, accepted_media_type, renderer_context)
            
        except Exception as e:
            logger.error(f"Error in SafeJSONRenderer: {str(e)}")
            # Fallback to basic rendering
            return super().render(
                {'error': 'Internal server error during response rendering'}, 
                accepted_media_type, 
                renderer_context
            )
    
    def format_response(self, data, status_code):
        """
        Apply consistent formatting to API responses
        """
        # If it's an error response (4xx or 5xx), ensure consistent structure
        if status_code and status_code >= 400:
            return self.format_error_response(data, status_code)
        
        # For successful responses, you can add metadata if desired
        return self.format_success_response(data)
    
    def format_error_response(self, data, status_code):
        """
        Format error responses consistently
        """
        error_codes = {
            400: 'bad_request',
            401: 'unauthorized',
            403: 'forbidden',
            404: 'not_found',
            405: 'method_not_allowed',
            408: 'request_timeout',
            429: 'too_many_requests',
            500: 'internal_server_error',
            503: 'service_unavailable'
        }
        
        # If data is already in error format, return as-is
        if isinstance(data, dict) and 'error' in data:
            return {
                'success': False,
                'error': data.get('error'),
                'detail': data.get('detail'),
                'code': data.get('code', error_codes.get(status_code, 'unknown_error')),
                'status_code': status_code
            }
        
        # If data is a string, treat it as error message
        if isinstance(data, str):
            return {
                'success': False,
                'error': data,
                'code': error_codes.get(status_code, 'unknown_error'),
                'status_code': status_code
            }
        
        # Default error format
        return {
            'success': False,
            'error': 'An error occurred',
            'detail': str(data) if data else None,
            'code': error_codes.get(status_code, 'unknown_error'),
            'status_code': status_code
        }
    
    def format_success_response(self, data):
        """
        Format successful responses (optional - can add metadata here)
        """
        # For now, just return data as-is
        # You could add pagination info, timestamps, etc. here
        return data


class CompactJSONRenderer(SafeJSONRenderer):
    """
    Compact JSON renderer that removes null values to reduce payload size
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render data to JSON, removing null values for compact output
        """
        try:
            # First clean the data (handles NaN, etc.)
            cleaned_data = clean_financial_data(data)
            
            # Remove null values for compact output
            compact_data = self.remove_null_values(cleaned_data)
            
            return super(SafeJSONRenderer, self).render(
                compact_data, accepted_media_type, renderer_context
            )
            
        except Exception as e:
            logger.error(f"Error in CompactJSONRenderer: {str(e)}")
            return super().render(data, accepted_media_type, renderer_context)
    
    def remove_null_values(self, obj):
        """
        Recursively remove None values from data structure
        """
        if isinstance(obj, dict):
            return {
                key: self.remove_null_values(value)
                for key, value in obj.items()
                if value is not None
            }
        elif isinstance(obj, list):
            return [self.remove_null_values(item) for item in obj if item is not None]
        else:
            return obj


class PrettyJSONRenderer(SafeJSONRenderer):
    """
    Pretty JSON renderer with indentation for human-readable output
    Useful for development and debugging
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render data to pretty-printed JSON
        """
        renderer_context = renderer_context or {}
        
        # Add indentation for pretty printing
        if 'indent' not in renderer_context:
            renderer_context['indent'] = 2
        
        return super().render(data, accepted_media_type, renderer_context)


class FinancialDataRenderer(SafeJSONRenderer):
    """
    Specialized renderer for financial data with additional formatting
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render financial data with additional metadata
        """
        try:
            # Clean the data first
            cleaned_data = clean_financial_data(data)
            
            # Add financial data specific metadata
            enhanced_data = self.enhance_financial_data(cleaned_data, renderer_context)
            
            return super().render(enhanced_data, accepted_media_type, renderer_context)
            
        except Exception as e:
            logger.error(f"Error in FinancialDataRenderer: {str(e)}")
            return super().render(data, accepted_media_type, renderer_context)
    
    def enhance_financial_data(self, data, renderer_context):
        """
        Add metadata to financial data responses
        """
        request = renderer_context.get('request') if renderer_context else None
        
        # Only enhance if it's a successful financial data response
        response = renderer_context.get('response') if renderer_context else None
        if response and response.status_code >= 400:
            return data
        
        # Add metadata for financial data responses
        metadata = {
            '_metadata': {
                'data_type': 'financial',
                'version': '1.0',
                'currency': 'USD',  # Default, could be dynamic based on data
                'units': 'millions',  # Common financial reporting unit
            }
        }
        
        # Merge metadata with existing data
        if isinstance(data, dict):
            return {**metadata, **data}
        else:
            return data
