import requests
import sys
from datetime import datetime

class WorkZoneAPITester:
    def __init__(self, base_url="https://futuristic-biz-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.member_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@payload.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained")
            return True
        return False

    def test_member_login(self):
        """Test member login"""
        success, response = self.run_test(
            "Member Login",
            "POST",
            "auth/login",
            200,
            data={"email": "member@payload.com", "password": "member123"}
        )
        
        if success and 'access_token' in response:
            self.member_token = response['access_token']
            print(f"   Member token obtained")
            return True
        return False

    # ===== WORK ZONE API TESTING =====
    def test_admin_get_settings(self):
        """Test GET /api/workzone/settings"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Get Work Zone Settings",
            "GET",
            "workzone/settings",
            200,
            headers=headers
        )
        return success, response

    def test_admin_update_settings(self, google_email):
        """Test POST /api/workzone/settings"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Update Work Zone Settings",
            "POST",
            "workzone/settings",
            200,
            data={"admin_google_email": google_email},
            headers=headers
        )
        return success, response

    def test_member_get_gmail(self):
        """Test GET /api/workzone/my-gmail"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        success, response = self.run_test(
            "Member Get My Gmail",
            "GET",
            "workzone/my-gmail",
            200,
            headers=headers
        )
        return success, response

    def test_member_submit_gmail_valid(self, gmail):
        """Test POST /api/workzone/request-access with valid Gmail"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        success, response = self.run_test(
            "Member Submit Valid Gmail",
            "POST",
            "workzone/request-access",
            200,
            data={"gmail_account": gmail},
            headers=headers
        )
        return success, response

    def test_member_submit_gmail_invalid(self, invalid_email):
        """Test POST /api/workzone/request-access with invalid email"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        success, response = self.run_test(
            "Member Submit Invalid Email",
            "POST",
            "workzone/request-access",
            400,  # Should fail with 400
            data={"gmail_account": invalid_email},
            headers=headers
        )
        return success, response

    def test_unauthorized_workzone_access(self):
        """Test endpoints without authentication"""
        print("\n🔒 Testing Unauthorized Work Zone Access...")
        
        # Test admin endpoints without token
        success1, _ = self.run_test(
            "Admin Settings Without Auth",
            "GET",
            "workzone/settings",
            401  # Should be unauthorized
        )
        
        success2, _ = self.run_test(
            "Member Gmail Without Auth",
            "GET",
            "workzone/my-gmail",
            401  # Should be unauthorized
        )
        
        return success1 and success2

    def test_member_access_admin_endpoint(self):
        """Test member trying to access admin-only endpoint"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        success, _ = self.run_test(
            "Member Access Admin Endpoint",
            "GET",
            "workzone/settings",
            403,  # Should be forbidden
            headers=headers
        )
        return success

def main():
    print("🚀 Starting Work Zone API Tests...")
    print("=" * 50)
    
    # Setup
    tester = WorkZoneAPITester()
    
    # Login tests
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.test_member_login():
        print("❌ Member login failed, stopping tests")
        return 1

    # Admin Work Zone Tests
    print("\n👑 ADMIN WORK ZONE TESTS")
    print("-" * 30)
    
    # Test getting initial settings
    admin_get_success, initial_settings = tester.test_admin_get_settings()
    if not admin_get_success:
        print("❌ Failed to get admin settings")
        return 1
    
    # Test updating admin settings
    test_google_email = "admin.test@gmail.com"
    admin_update_success, update_response = tester.test_admin_update_settings(test_google_email)
    if not admin_update_success:
        print("❌ Failed to update admin settings")
        return 1
    
    # Verify the update worked
    admin_verify_success, updated_settings = tester.test_admin_get_settings()
    if admin_verify_success and updated_settings.get('admin_google_email') == test_google_email:
        print("✅ Admin Google email update verified")
        tester.tests_passed += 1
    else:
        print("❌ Admin Google email update verification failed")
    tester.tests_run += 1

    # Member Work Zone Tests
    print("\n👤 MEMBER WORK ZONE TESTS")
    print("-" * 30)
    
    # Test getting initial Gmail (should be None initially)
    member_get_success, initial_gmail = tester.test_member_get_gmail()
    if not member_get_success:
        print("❌ Failed to get member Gmail")
        return 1
    
    # Test submitting invalid email
    invalid_emails = ["test@yahoo.com", "invalid-email", "test@hotmail.com"]
    for invalid_email in invalid_emails:
        invalid_success, _ = tester.test_member_submit_gmail_invalid(invalid_email)
        if not invalid_success:
            print(f"❌ Invalid email validation failed for: {invalid_email}")
    
    # Test submitting valid Gmail
    test_gmail = "member.test@gmail.com"
    member_submit_success, submit_response = tester.test_member_submit_gmail_valid(test_gmail)
    if not member_submit_success:
        print("❌ Failed to submit valid Gmail")
        return 1
    
    # Verify the Gmail was saved
    member_verify_success, updated_gmail = tester.test_member_get_gmail()
    if member_verify_success and updated_gmail.get('gmail_account') == test_gmail:
        print("✅ Member Gmail submission verified")
        tester.tests_passed += 1
    else:
        print("❌ Member Gmail submission verification failed")
    tester.tests_run += 1

    # Security Tests
    print("\n🔒 SECURITY TESTS")
    print("-" * 30)
    
    # Test unauthorized access
    if not tester.test_unauthorized_workzone_access():
        print("❌ Unauthorized access test failed")
    
    # Test member accessing admin endpoint
    if not tester.test_member_access_admin_endpoint():
        print("❌ Member access to admin endpoint test failed")

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.failed_tests:
        print("\n❌ Failed tests:")
        for test in tester.failed_tests:
            print(f"   - {test}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())