import requests
import sys
import json
from datetime import datetime
import uuid

class PayloadAPITester:
    def __init__(self, base_url="https://space-mission-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        # Store created IDs for cleanup and testing
        self.created_payload_id = None
        self.created_mission_id = None
        self.created_station_id = None
        self.created_resource_id = None

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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

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
            403
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

    # ===== PAYLOADS MODULE TESTING =====
    def test_create_payload(self):
        """Test creating a payload"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        payload_data = {
            "title": "Test Payload",
            "description": "A test payload for API testing",
            "funding_goal": 10000.0,
            "current_funding": 2500.0
        }
        
        success, response = self.run_test(
            "Create Payload",
            "POST",
            "payloads",
            200,
            data=payload_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_payload_id = response['id']
            print(f"   Payload ID: {self.created_payload_id}")
            return True
        return False

    def test_get_payloads(self):
        """Test getting user's payloads"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Payloads",
            "GET",
            "payloads",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} payloads")
            return True
        return False

    def test_update_payload(self):
        """Test updating a payload"""
        if not self.user_token or not self.created_payload_id:
            print("❌ Missing user token or payload ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        update_data = {
            "status": "paused",
            "current_funding": 5000.0
        }
        
        success, response = self.run_test(
            "Update Payload",
            "PUT",
            f"payloads/{self.created_payload_id}",
            200,
            data=update_data,
            headers=headers
        )
        return success

    def test_delete_payload(self):
        """Test deleting a payload"""
        if not self.user_token or not self.created_payload_id:
            print("❌ Missing user token or payload ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Delete Payload",
            "DELETE",
            f"payloads/{self.created_payload_id}",
            200,
            headers=headers
        )
        return success

    # ===== MISSIONS MODULE TESTING =====
    def test_create_mission(self):
        """Test creating a mission"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        mission_data = {
            "title": "Test Mission",
            "objective": "Complete API testing for missions module",
            "priority": "high",
            "due_date": "2024-12-31"
        }
        
        success, response = self.run_test(
            "Create Mission",
            "POST",
            "missions",
            200,
            data=mission_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_mission_id = response['id']
            print(f"   Mission ID: {self.created_mission_id}")
            return True
        return False

    def test_get_missions(self):
        """Test getting user's missions"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Missions",
            "GET",
            "missions",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} missions")
            return True
        return False

    def test_update_mission(self):
        """Test updating a mission"""
        if not self.user_token or not self.created_mission_id:
            print("❌ Missing user token or mission ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        update_data = {
            "status": "completed",
            "priority": "medium"
        }
        
        success, response = self.run_test(
            "Update Mission",
            "PUT",
            f"missions/{self.created_mission_id}",
            200,
            data=update_data,
            headers=headers
        )
        return success

    def test_delete_mission(self):
        """Test deleting a mission"""
        if not self.user_token or not self.created_mission_id:
            print("❌ Missing user token or mission ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Delete Mission",
            "DELETE",
            f"missions/{self.created_mission_id}",
            200,
            headers=headers
        )
        return success

    # ===== BUSINESS BANK MODULE TESTING =====
    def test_create_transaction(self):
        """Test creating a transaction"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        transaction_data = {
            "type": "deposit",
            "amount": 1000.0,
            "description": "Test deposit transaction",
            "category": "testing"
        }
        
        success, response = self.run_test(
            "Create Transaction (Deposit)",
            "POST",
            "transactions",
            200,
            data=transaction_data,
            headers=headers
        )
        return success

    def test_create_withdrawal(self):
        """Test creating a withdrawal transaction"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        transaction_data = {
            "type": "withdrawal",
            "amount": 250.0,
            "description": "Test withdrawal transaction",
            "category": "testing"
        }
        
        success, response = self.run_test(
            "Create Transaction (Withdrawal)",
            "POST",
            "transactions",
            200,
            data=transaction_data,
            headers=headers
        )
        return success

    def test_get_transactions(self):
        """Test getting user's transactions"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} transactions")
            return True
        return False

    def test_get_balance(self):
        """Test getting current balance"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Balance",
            "GET",
            "bank/balance",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Current balance: ${response.get('balance', 0)}")
            return True
        return False

    # ===== HEADQUARTERS MODULE TESTING =====
    def test_create_headquarters(self):
        """Test creating headquarters"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        hq_data = {
            "name": "Test HQ",
            "location": "Test City, Test State",
            "description": "A test headquarters for API testing"
        }
        
        success, response = self.run_test(
            "Create Headquarters",
            "POST",
            "headquarters",
            200,
            data=hq_data,
            headers=headers
        )
        return success

    def test_get_headquarters(self):
        """Test getting headquarters"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Headquarters",
            "GET",
            "headquarters",
            200,
            headers=headers
        )
        return success

    def test_update_headquarters(self):
        """Test updating headquarters"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        update_data = {
            "description": "Updated test headquarters description"
        }
        
        success, response = self.run_test(
            "Update Headquarters",
            "PUT",
            "headquarters",
            200,
            data=update_data,
            headers=headers
        )
        return success

    # ===== STATIONS MODULE TESTING =====
    def test_create_station(self):
        """Test creating a station"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        station_data = {
            "name": "Test Station",
            "location": "Test Location",
            "type": "office",
            "description": "A test station for API testing"
        }
        
        success, response = self.run_test(
            "Create Station",
            "POST",
            "stations",
            200,
            data=station_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_station_id = response['id']
            print(f"   Station ID: {self.created_station_id}")
            return True
        return False

    def test_get_stations(self):
        """Test getting user's stations"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Stations",
            "GET",
            "stations",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} stations")
            return True
        return False

    def test_update_station(self):
        """Test updating a station"""
        if not self.user_token or not self.created_station_id:
            print("❌ Missing user token or station ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        update_data = {
            "status": "inactive",
            "type": "warehouse"
        }
        
        success, response = self.run_test(
            "Update Station",
            "PUT",
            f"stations/{self.created_station_id}",
            200,
            data=update_data,
            headers=headers
        )
        return success

    def test_delete_station(self):
        """Test deleting a station"""
        if not self.user_token or not self.created_station_id:
            print("❌ Missing user token or station ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Delete Station",
            "DELETE",
            f"stations/{self.created_station_id}",
            200,
            headers=headers
        )
        return success

    # ===== BASECAMP MODULE TESTING =====
    def test_create_resource(self):
        """Test creating a resource (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        resource_data = {
            "title": "Test Resource",
            "description": "A test resource for API testing",
            "type": "document",
            "url": "https://example.com/test-resource"
        }
        
        success, response = self.run_test(
            "Create Resource (Admin)",
            "POST",
            "basecamp",
            200,
            data=resource_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_resource_id = response['id']
            print(f"   Resource ID: {self.created_resource_id}")
            return True
        return False

    def test_get_resources(self):
        """Test getting resources"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "Get Resources",
            "GET",
            "basecamp",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} resources")
            return True
        return False

    def test_user_create_resource_forbidden(self):
        """Test that regular users cannot create resources"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        resource_data = {
            "title": "Unauthorized Resource",
            "description": "This should fail",
            "type": "document",
            "url": "https://example.com/unauthorized"
        }
        
        success, response = self.run_test(
            "User Create Resource (should fail)",
            "POST",
            "basecamp",
            403,
            data=resource_data,
            headers=headers
        )
        return success

    # ===== ADMIN ANALYTICS TESTING =====
    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Total members: {response.get('total_members', 0)}")
            print(f"   Total payloads: {response.get('total_payloads', 0)}")
            print(f"   Total missions: {response.get('total_missions', 0)}")
            print(f"   Total transactions: {response.get('total_transactions', 0)}")
            return True
        return False

    def test_user_analytics_forbidden(self):
        """Test that regular users cannot access analytics"""
        if not self.user_token:
            print("❌ No user token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.user_token}'}
        success, response = self.run_test(
            "User Access Analytics (should fail)",
            "GET",
            "admin/analytics",
            403,
            headers=headers
        )
        return success

def main():
    print("🚀 Starting Payload Phase 2 API Testing...")
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
    
    # Test Phase 2 Modules
    print("\n" + "="*60)
    print("TESTING PAYLOADS MODULE (CRUD)")
    print("="*60)
    
    tester.test_create_payload()
    tester.test_get_payloads()
    tester.test_update_payload()
    # Don't delete payload yet, we'll use it for dashboard testing
    
    print("\n" + "="*60)
    print("TESTING MISSIONS MODULE (CRUD)")
    print("="*60)
    
    tester.test_create_mission()
    tester.test_get_missions()
    tester.test_update_mission()
    # Don't delete mission yet, we'll use it for dashboard testing
    
    print("\n" + "="*60)
    print("TESTING BUSINESS BANK MODULE")
    print("="*60)
    
    tester.test_create_transaction()
    tester.test_create_withdrawal()
    tester.test_get_transactions()
    tester.test_get_balance()
    
    print("\n" + "="*60)
    print("TESTING HEADQUARTERS MODULE")
    print("="*60)
    
    tester.test_create_headquarters()
    tester.test_get_headquarters()
    tester.test_update_headquarters()
    
    print("\n" + "="*60)
    print("TESTING STATIONS MODULE (CRUD)")
    print("="*60)
    
    tester.test_create_station()
    tester.test_get_stations()
    tester.test_update_station()
    # Don't delete station yet, we'll use it for dashboard testing
    
    print("\n" + "="*60)
    print("TESTING BASECAMP MODULE")
    print("="*60)
    
    tester.test_create_resource()
    tester.test_get_resources()
    tester.test_user_create_resource_forbidden()
    
    print("\n" + "="*60)
    print("TESTING ADMIN ANALYTICS")
    print("="*60)
    
    tester.test_admin_analytics()
    tester.test_user_analytics_forbidden()
    
    # Test security
    print("\n" + "="*50)
    print("TESTING SECURITY & ACCESS CONTROL")
    print("="*50)
    
    tester.test_unauthorized_access()
    tester.test_non_admin_access()
    
    # Clean up - delete created items
    print("\n" + "="*50)
    print("CLEANUP - DELETING TEST DATA")
    print("="*50)
    
    tester.test_delete_payload()
    tester.test_delete_mission()
    tester.test_delete_station()
    
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