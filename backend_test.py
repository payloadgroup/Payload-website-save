import requests
import sys
import json
from datetime import datetime

class PayloadAPITester:
    def __init__(self, base_url="https://space-mission-hq.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
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

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@payload.com",
            "password": "TestPass123!",
            "referral_code": "REF-TEST"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   User ID: {self.test_user_id}")
            print(f"   Status: {response.get('status', 'unknown')}")
            return True, test_data
        return False, test_data

    def test_duplicate_registration(self, user_data):
        """Test duplicate email registration"""
        success, _ = self.run_test(
            "Duplicate Registration (should fail)",
            "POST",
            "auth/register",
            400,
            data=user_data
        )
        return success

    def test_pending_user_login(self, user_data):
        """Test login with pending user (should fail)"""
        success, _ = self.run_test(
            "Pending User Login (should fail)",
            "POST",
            "auth/login",
            403,
            data={"email": user_data["email"], "password": user_data["password"]}
        )
        return success

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

    def test_get_pending_users(self):
        """Test getting pending users (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Get Pending Users",
            "GET",
            "admin/pending-users",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} pending users")
            return True
        return False

    def test_approve_user(self):
        """Test approving a user"""
        if not self.admin_token or not self.test_user_id:
            print("❌ Missing admin token or test user ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, _ = self.run_test(
            "Approve User",
            "POST",
            "admin/update-user-status",
            200,
            data={"user_id": self.test_user_id, "status": "approved"},
            headers=headers
        )
        return success

    def test_approved_user_login(self, user_data):
        """Test login with approved user"""
        success, response = self.run_test(
            "Approved User Login",
            "POST",
            "auth/login",
            200,
            data={"email": user_data["email"], "password": user_data["password"]}
        )
        
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"   User token obtained")
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "users/me",
            200,
            headers=headers
        )
        
        if success:
            print(f"   User: {response.get('name', 'unknown')}")
            print(f"   Status: {response.get('status', 'unknown')}")
            return True
        return False

    def test_dashboard_access(self):
        """Test dashboard access"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Dashboard Access",
            "GET",
            "dashboard",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Welcome message: {response.get('welcome_message', 'none')}")
            return True
        return False

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        success, _ = self.run_test(
            "Unauthorized Dashboard Access (should fail)",
            "GET",
            "dashboard",
            401
        )
        return success

    def test_non_admin_access(self):
        """Test non-admin access to admin endpoints"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, _ = self.run_test(
            "Non-Admin Access to Admin Panel (should fail)",
            "GET",
            "admin/pending-users",
            403,
            headers=headers
        )
        return success

def main():
    print("🚀 Starting Payload API Testing...")
    tester = PayloadAPITester()
    
    # Test user registration flow
    print("\n" + "="*50)
    print("TESTING USER REGISTRATION FLOW")
    print("="*50)
    
    reg_success, user_data = tester.test_user_registration()
    if not reg_success:
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test duplicate registration
    tester.test_duplicate_registration(user_data)
    
    # Test pending user login (should fail)
    tester.test_pending_user_login(user_data)
    
    # Test admin functionality
    print("\n" + "="*50)
    print("TESTING ADMIN FUNCTIONALITY")
    print("="*50)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping admin tests")
        return 1
    
    tester.test_get_pending_users()
    
    if not tester.test_approve_user():
        print("❌ User approval failed")
        return 1
    
    # Test approved user login
    print("\n" + "="*50)
    print("TESTING APPROVED USER ACCESS")
    print("="*50)
    
    if not tester.test_approved_user_login(user_data):
        print("❌ Approved user login failed")
        return 1
    
    tester.test_get_user_profile()
    tester.test_dashboard_access()
    
    # Test security
    print("\n" + "="*50)
    print("TESTING SECURITY & ACCESS CONTROL")
    print("="*50)
    
    tester.test_unauthorized_access()
    tester.test_non_admin_access()
    
    # Print final results
    print("\n" + "="*50)
    print("TEST RESULTS")
    print("="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.failed_tests:
        print("\n❌ Failed tests:")
        for test in tester.failed_tests:
            print(f"   - {test}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())