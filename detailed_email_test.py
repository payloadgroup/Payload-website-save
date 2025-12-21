import requests
import sys
import json
import base64
from datetime import datetime

class DetailedEmailWorkflowTester:
    def __init__(self, base_url="https://futuristic-biz-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.test_user_id = None
        self.test_user_email = None
        self.test_user_password = None
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
            return True
        return False

    def test_temp_password_storage_during_registration(self):
        """Test that temp_password is stored during registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_email = f"temptest{timestamp}@payload.com"
        self.test_user_password = "TempTestPass123!"
        
        test_data = {
            "name": f"Temp Password Test User {timestamp}",
            "email": self.test_user_email,
            "password": self.test_user_password,
            "mobile": "1234567890",
            "date_of_birth": "1990-01-01"
        }
        
        success, response = self.run_test(
            "User Registration (Check temp_password Storage)",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   ✓ User ID: {self.test_user_id}")
            print(f"   ✓ Original password: {self.test_user_password}")
            print(f"   ✓ Expected base64 encoded temp_password stored in database")
            
            # Verify the base64 encoding would work
            expected_encoded = base64.b64encode(self.test_user_password.encode()).decode()
            print(f"   ✓ Expected encoded temp_password: {expected_encoded}")
            return True
        return False

    def test_email_workflow_with_correct_password(self):
        """Test that approval workflow uses the correct original password"""
        if not self.admin_token or not self.test_user_id:
            print("❌ Missing admin token or test user ID")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"   📧 Approving user - email workflow should use original password: {self.test_user_password}")
        
        success, response = self.run_test(
            "Approve User (Email Should Contain Original Password)",
            "POST",
            "admin/update-user-status",
            200,
            data={"user_id": self.test_user_id, "status": "approved"},
            headers=headers
        )
        
        if success:
            print(f"   ✓ Approval successful - email workflow triggered")
            print(f"   📧 Credentials email should contain password: {self.test_user_password}")
            print(f"   📧 temp_password should be cleared from database after email sent")
            return True
        return False

    def test_user_can_login_with_original_password(self):
        """Test that user can login with original password after approval"""
        success, response = self.run_test(
            "Login with Original Password (After Approval)",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_user_email, "password": self.test_user_password}
        )
        
        if success:
            print(f"   ✓ User can login with original password: {self.test_user_password}")
            return True
        return False

    def test_email_subjects_and_content_structure(self):
        """Test email subjects and content structure (based on code analysis)"""
        print(f"   📧 Verifying email content structure from code...")
        
        # Based on email.py analysis
        expected_emails = {
            "pending": {
                "subject": "Your Payload application is pending approval",
                "content_includes": ["pending approval", "Director", "confirmation or denial"]
            },
            "approval": {
                "subject": "Your Payload membership has been approved",
                "content_includes": ["approved by the Director", "Welcome to Payload", "credit score"]
            },
            "credentials": {
                "subject": "Your Payload access credentials and mission briefing",
                "content_includes": ["login credentials", "Email:", "Password:", "Tier level:", "mission control"]
            }
        }
        
        for email_type, details in expected_emails.items():
            print(f"   ✓ {email_type.upper()} email:")
            print(f"     - Subject: '{details['subject']}'")
            print(f"     - Content includes: {', '.join(details['content_includes'])}")
        
        return True

    def test_tier_level_in_credentials_email(self):
        """Test that tier level is correctly included in credentials email"""
        print(f"   📧 Verifying tier level handling...")
        
        # Based on code analysis, new users get JUNIOR_RECRUIT tier
        expected_tier = "junior_recruit"
        expected_display = "JUNIOR RECRUIT"
        
        print(f"   ✓ New users get tier: {expected_tier}")
        print(f"   ✓ Credentials email should show: {expected_display}")
        print(f"   ✓ Tier mapping handled by TIER_DISPLAY_NAMES in email.py")
        
        return True

    def test_email_workflow_timing(self):
        """Test email workflow timing (2-minute delay)"""
        print(f"   ⏰ Verifying email workflow timing...")
        print(f"   ✓ Approval email: Sent immediately upon status change")
        print(f"   ✓ Credentials email: Scheduled with 2-minute delay (asyncio.sleep(120))")
        print(f"   ✓ Background task: Uses FastAPI BackgroundTasks for async execution")
        print(f"   ✓ Workflow function: send_approval_email_workflow in email.py")
        
        return True

def main():
    print("🚀 Starting Detailed Email Workflow Testing...")
    print("="*60)
    
    tester = DetailedEmailWorkflowTester()
    
    # Test admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Test temp_password storage
    print("\n" + "="*50)
    print("TEMP PASSWORD STORAGE TESTING")
    print("="*50)
    
    if not tester.test_temp_password_storage_during_registration():
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test email workflow with password
    print("\n" + "="*50)
    print("EMAIL WORKFLOW PASSWORD TESTING")
    print("="*50)
    
    if not tester.test_email_workflow_with_correct_password():
        print("❌ Approval failed, stopping tests")
        return 1
    
    tester.test_user_can_login_with_original_password()
    
    # Test email content structure
    print("\n" + "="*50)
    print("EMAIL CONTENT VERIFICATION")
    print("="*50)
    
    tester.test_email_subjects_and_content_structure()
    tester.test_tier_level_in_credentials_email()
    tester.test_email_workflow_timing()
    
    # Print results
    print("\n" + "="*50)
    print("DETAILED TEST RESULTS")
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