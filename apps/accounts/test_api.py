import requests
import json

def test_login():
    # Test data
    test_cases = [
        {
            "name": "Valid email login",
            "url": "http://127.0.0.1:8000/accounts/api/login/",
            "data": {
                "identifier": "test@example.com",
                "password": "Test123!",
                "login_type": "email"
            }
        },
        {
            "name": "Valid username login",
            "url": "http://127.0.0.1:8000/accounts/api/login/",
            "data": {
                "identifier": "testuser",
                "password": "Test123!",
                "login_type": "username"
            }
        },
        {
            "name": "Invalid password",
            "url": "http://127.0.0.1:8000/accounts/api/login/",
            "data": {
                "identifier": "test@example.com",
                "password": "WrongPassword123!",
                "login_type": "email"
            }
        },
        {
            "name": "Invalid email",
            "url": "http://127.0.0.1:8000/accounts/api/login/",
            "data": {
                "identifier": "nonexistent@example.com",
                "password": "Test123!",
                "login_type": "email"
            }
        },
        {
            "name": "Missing password",
            "url": "http://127.0.0.1:8000/accounts/api/login/",
            "data": {
                "identifier": "test@example.com",
                "password": "",
                "login_type": "email"
            }
        }
    ]

    print("Testing Login API...")
    print("=" * 50)

    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test['name']}")
        print(f"URL: {test['url']}")
        print(f"Data: {json.dumps(test['data'], indent=2)}")
        
        try:
            response = requests.post(
                test['url'],
                json=test['data'],
                headers={'Content-Type': 'application/json'}
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ SUCCESS: Login successful!")
            elif response.status_code == 401:
                print("❌ FAILED: Invalid credentials")
            elif response.status_code == 400:
                print("❌ FAILED: Bad request")
            else:
                print(f"❌ UNEXPECTED: Status code {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ ERROR: Cannot connect to server. Make sure Django is running.")
        except requests.exceptions.RequestException as e:
            print(f"❌ ERROR: Request failed - {e}")
        except Exception as e:
            print(f"❌ ERROR: {e}")
        
        print("-" * 30)

def test_session():
    """Test if session is maintained after login"""
    print("\n" + "=" * 50)
    print("Testing Session/Cookie Persistence")
    print("=" * 50)
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # First, check auth status (should be False)
    print("\n1. Checking initial auth status:")
    try:
        response = session.get("http://127.0.0.1:8000/accounts/api/check-auth/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Now login
    print("\n2. Attempting login:")
    login_data = {
        "identifier": "test@example.com",
        "password": "Test123!",
        "login_type": "email"
    }
    
    try:
        response = session.post(
            "http://127.0.0.1:8000/accounts/api/login/",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.text}")
        
        # Check cookies
        print(f"Cookies received: {session.cookies.get_dict()}")
        
    except Exception as e:
        print(f"Login Error: {e}")
        return
    
    # Check auth status again (should be True if login worked)
    print("\n3. Checking auth status after login:")
    try:
        response = session.get("http://127.0.0.1:8000/accounts/api/check-auth/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test logout
    print("\n4. Testing logout:")
    try:
        response = session.post("http://127.0.0.1:8000/accounts/api/logout/")
        print(f"Logout Status: {response.status_code}")
        print(f"Logout Response: {response.text}")
    except Exception as e:
        print(f"Logout Error: {e}")

if __name__ == "__main__":
    test_login()
    test_session()