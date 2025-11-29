import json
import math
import logging
from decimal import Decimal
from datetime import date, datetime
from typing import Any, Union, Dict, List

logger = logging.getLogger(__name__)

class SafeJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder that handles NaN, Infinity, and other non-serializable values
    """
    def encode(self, obj: Any) -> str:
        """Encode object to JSON string with sanitization"""
        try:
            sanitized_obj = self.sanitize(obj)
            return super().encode(sanitized_obj)
        except Exception as e:
            logger.error(f"Error encoding JSON: {str(e)}")
            return '{}'
    
    def sanitize(self, obj: Any) -> Any:
        """
        Recursively sanitize object by replacing non-serializable values
        
        Args:
            obj: Any Python object to sanitize
            
        Returns:
            Sanitized object safe for JSON serialization
        """
        try:
            if obj is None:
                return None
            elif isinstance(obj, (bool, int, str)):
                return obj
            elif isinstance(obj, float):
                if math.isnan(obj) or math.isinf(obj):
                    return None
                return obj
            elif isinstance(obj, Decimal):
                return float(obj)
            elif isinstance(obj, (date, datetime)):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {
                    str(key): self.sanitize(value) 
                    for key, value in obj.items() 
                    if value is not None  # Optional: remove None values
                }
            elif isinstance(obj, (list, tuple, set)):
                return [self.sanitize(item) for item in obj]
            elif hasattr(obj, '__dict__'):
                # Handle custom objects with __dict__ attribute
                return self.sanitize(obj.__dict__)
            elif hasattr(obj, '_asdict'):
                # Handle namedtuples
                return self.sanitize(obj._asdict())
            else:
                # Try to convert to string as last resort
                try:
                    return str(obj)
                except:
                    logger.warning(f"Could not serialize object of type {type(obj)}")
                    return None
        except Exception as e:
            logger.error(f"Error sanitizing object of type {type(obj)}: {str(e)}")
            return None


def clean_financial_data(data: Any) -> Any:
    """
    Recursively clean financial data by replacing NaN/Inf values with None
    
    Args:
        data: Financial data to clean (can be dict, list, or primitive)
        
    Returns:
        Cleaned data with NaN/Inf values replaced by None
    """
    try:
        if data is None:
            return None
        elif isinstance(data, (bool, int, str)):
            return data
        elif isinstance(data, float):
            if math.isnan(data) or math.isinf(data):
                return None
            return data
        elif isinstance(data, Decimal):
            return float(data)
        elif isinstance(data, (date, datetime)):
            return data.isoformat()
        elif isinstance(data, dict):
            return {
                key: clean_financial_data(value) 
                for key, value in data.items() 
                if value is not None  # Remove None values to reduce payload size
            }
        elif isinstance(data, (list, tuple, set)):
            return [clean_financial_data(item) for item in data]
        else:
            # For other types, try to convert to string or return as-is
            try:
                return str(data)
            except:
                logger.warning(f"Could not clean object of type {type(data)}")
                return None
    except Exception as e:
        logger.error(f"Error cleaning financial data: {str(e)}")
        return None


def safe_json_dumps(obj: Any, **kwargs) -> str:
    """
    Safely convert Python object to JSON string
    
    Args:
        obj: Python object to serialize
        **kwargs: Additional arguments for json.dumps
        
    Returns:
        JSON string representation of the object
    """
    try:
        return json.dumps(obj, cls=SafeJSONEncoder, **kwargs)
    except Exception as e:
        logger.error(f"Error in safe_json_dumps: {str(e)}")
        return '{}'


def safe_json_loads(json_str: str, **kwargs) -> Any:
    """
    Safely parse JSON string to Python object
    
    Args:
        json_str: JSON string to parse
        **kwargs: Additional arguments for json.loads
        
    Returns:
        Parsed Python object or empty dict on error
    """
    try:
        return json.loads(json_str, **kwargs) if json_str else {}
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {}
    except Exception as e:
        logger.error(f"Error in safe_json_loads: {str(e)}")
        return {}


def format_currency(value: Union[float, int, None], decimals: int = 2) -> str:
    """
    Format currency values for display
    
    Args:
        value: Numeric value to format
        decimals: Number of decimal places
        
    Returns:
        Formatted currency string
    """
    if value is None or math.isnan(value) or math.isinf(value):
        return "N/A"
    
    try:
        if abs(value) >= 1_000_000_000:
            return f"${value/1_000_000_000:.{decimals}f}B"
        elif abs(value) >= 1_000_000:
            return f"${value/1_000_000:.{decimals}f}M"
        elif abs(value) >= 1_000:
            return f"${value/1_000:.{decimals}f}K"
        else:
            return f"${value:.{decimals}f}"
    except (TypeError, ValueError):
        return "N/A"


def format_percentage(value: Union[float, None], decimals: int = 2) -> str:
    """
    Format percentage values for display
    
    Args:
        value: Percentage value (as decimal, e.g., 0.15 for 15%)
        decimals: Number of decimal places
        
    Returns:
        Formatted percentage string
    """
    if value is None or math.isnan(value) or math.isinf(value):
        return "N/A"
    
    try:
        return f"{value * 100:.{decimals}f}%"
    except (TypeError, ValueError):
        return "N/A"


def validate_financial_value(value: Any) -> Union[float, None]:
    """
    Validate and clean a financial value
    
    Args:
        value: Value to validate
        
    Returns:
        Validated float or None if invalid
    """
    if value is None:
        return None
    
    try:
        float_val = float(value)
        if math.isnan(float_val) or math.isinf(float_val):
            return None
        return float_val
    except (TypeError, ValueError):
        return None


# Example usage and testing
if __name__ == "__main__":
    # Test data with problematic values
    test_data = {
        "price": 150.75,
        "change": float('nan'),
        "volume": float('inf'),
        "ratio": Decimal('15.75'),
        "date": datetime.now(),
        "nested": {
            "value": float('-inf'),
            "list": [1, 2, float('nan'), 4]
        }
    }
    
    print("Original data:", test_data)
    print("Cleaned data:", clean_financial_data(test_data))
    print("JSON encoded:", safe_json_dumps(test_data, indent=2))
