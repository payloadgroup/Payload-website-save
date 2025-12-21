import requests
import sys
import json
import base64
from datetime import datetime
import uuid
import io

class GuaranteedFlipsAPITester:
    def __init__(self, base_url="https://member-hub-46.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.member_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {}
        if headers:
            default_headers.update(headers)
        
        # Don't set Content-Type for multipart/form-data requests
        if not files and 'Content-Type' not in default_headers:
            default_headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=default_headers)
                else:
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

    # ===== GUARANTEED FLIPS API TESTING =====
    
    def test_get_tier_access_settings(self):
        """Test GET /api/flips/tier-access"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Get Tier Access Settings",
            "GET",
            "flips/tier-access",
            200,
            headers=headers
        )
        
        if success:
            # Verify response structure
            expected_sections = ['property', 'business', 'unique', 'arbitrage', 'top_secret']
            for section in expected_sections:
                if section not in response:
                    print(f"❌ Missing section: {section}")
                    return False
                if 'required_tier' not in response[section]:
                    print(f"❌ Missing required_tier for section: {section}")
                    return False
                if 'title' not in response[section]:
                    print(f"❌ Missing title for section: {section}")
                    return False
                if 'description' not in response[section]:
                    print(f"❌ Missing description for section: {section}")
                    return False
            print("✅ All sections have correct structure")
            
        return success, response

    def test_update_tier_access_settings(self):
        """Test POST /api/flips/tier-access"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test updating tier access settings
        new_settings = {
            "property": "junior_recruit",
            "business": "front_line", 
            "unique": "mid_level_manager",
            "arbitrage": "senior_manager",
            "top_secret": "top_leadership"
        }
        
        success, response = self.run_test(
            "Update Tier Access Settings",
            "POST",
            "flips/tier-access",
            200,
            data=new_settings,
            headers=headers
        )
        return success, response

    def test_get_member_access(self):
        """Test GET /api/flips/my-access"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        success, response = self.run_test(
            "Get Member Access",
            "GET",
            "flips/my-access",
            200,
            headers=headers
        )
        
        if success:
            # Verify response structure
            if 'user_tier' not in response:
                print("❌ Missing user_tier in response")
                return False
            if 'sections' not in response:
                print("❌ Missing sections in response")
                return False
                
            # Check sections structure
            sections = response['sections']
            expected_sections = ['property', 'business', 'unique', 'arbitrage', 'top_secret']
            for section in expected_sections:
                if section not in sections:
                    print(f"❌ Missing section: {section}")
                    return False
                section_data = sections[section]
                required_fields = ['has_access', 'required_tier', 'title', 'description']
                for field in required_fields:
                    if field not in section_data:
                        print(f"❌ Missing {field} for section: {section}")
                        return False
            
            print(f"✅ Member tier: {response['user_tier']}")
            accessible_sections = [s for s, data in sections.items() if data['has_access']]
            print(f"✅ Accessible sections: {accessible_sections}")
            
        return success, response

    def test_submit_opportunity_text_only(self):
        """Test POST /api/flips/submit-opportunity with text only"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        
        # Test with form data (multipart) - need to use files parameter for multipart
        data = {
            'content': 'This is a test opportunity submission for the Guaranteed Flips feature. It contains detailed information about a potential investment opportunity.'
        }
        
        # Create empty files list to trigger multipart/form-data
        files = []
        
        success, response = self.run_test(
            "Submit Opportunity (Text Only)",
            "POST",
            "flips/submit-opportunity",
            200,
            data=data,
            headers=headers,
            files=files
        )
        
        if success and 'submission_id' in response:
            self.test_submission_id = response['submission_id']
            print(f"   Submission ID: {self.test_submission_id}")
            
        return success, response

    def test_submit_opportunity_with_files(self):
        """Test POST /api/flips/submit-opportunity with file attachments"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        
        # Create test files
        test_txt_content = b"This is a test document for opportunity submission."
        test_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        
        data = {
            'content': 'This is a test opportunity submission with file attachments. Please review the attached documents for more details.'
        }
        
        files = {
            'files': ('test_document.txt', io.BytesIO(test_txt_content), 'text/plain'),
        }
        
        success, response = self.run_test(
            "Submit Opportunity (With Files)",
            "POST",
            "flips/submit-opportunity",
            200,
            data=data,
            headers=headers,
            files=files
        )
        
        if success and 'submission_id' in response:
            self.test_submission_with_files_id = response['submission_id']
            print(f"   Submission ID: {self.test_submission_with_files_id}")
            
        return success, response

    def test_submit_opportunity_invalid_file(self):
        """Test POST /api/flips/submit-opportunity with invalid file type"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        
        # Create invalid file (executable)
        invalid_content = b"Invalid file content"
        
        data = {
            'content': 'This submission should fail due to invalid file type.'
        }
        
        files = {
            'files': ('malicious.exe', io.BytesIO(invalid_content), 'application/x-executable'),
        }
        
        success, response = self.run_test(
            "Submit Opportunity (Invalid File Type)",
            "POST",
            "flips/submit-opportunity",
            400,  # Should fail
            data=data,
            headers=headers,
            files=files
        )
        
        return success, response

    def test_submit_opportunity_empty_content(self):
        """Test POST /api/flips/submit-opportunity with empty content"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        
        data = {
            'content': ''  # Empty content should fail
        }
        
        success, response = self.run_test(
            "Submit Opportunity (Empty Content)",
            "POST",
            "flips/submit-opportunity",
            400,  # Should fail
            data=data,
            headers=headers,
            files=[]
        )
        
        return success, response

    def test_get_member_submissions(self):
        """Test GET /api/flips/my-submissions"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        success, response = self.run_test(
            "Get Member Submissions",
            "GET",
            "flips/my-submissions",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} submissions")
            for submission in response:
                print(f"   - {submission.get('id', 'unknown')}: {submission.get('status', 'unknown')}")
            
        return success, response

    def test_admin_get_all_submissions(self):
        """Test GET /api/flips/admin/submissions"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Get All Submissions",
            "GET",
            "flips/admin/submissions",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Found {len(response)} total submissions")
            for submission in response:
                print(f"   - {submission.get('user_name', 'unknown')} ({submission.get('user_email', 'unknown')}): {submission.get('status', 'unknown')}")
            
        return success, response

    def test_admin_get_submission_detail(self):
        """Test GET /api/flips/admin/submission/{submission_id}"""
        if not self.admin_token or not hasattr(self, 'test_submission_id'):
            print("❌ No admin token or submission ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Get Submission Detail",
            "GET",
            f"flips/admin/submission/{self.test_submission_id}",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Submission content length: {len(response.get('content', ''))}")
            print(f"   Attachments: {len(response.get('attachments', []))}")
            
        return success, response

    def test_admin_update_submission_status(self):
        """Test POST /api/flips/admin/submission/{submission_id}/status"""
        if not self.admin_token or not hasattr(self, 'test_submission_id'):
            print("❌ No admin token or submission ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test marking as reviewed
        success, response = self.run_test(
            "Admin Update Submission Status (Reviewed)",
            "POST",
            f"flips/admin/submission/{self.test_submission_id}/status?status=reviewed",
            200,
            data={},
            headers=headers
        )
        
        if success:
            # Test marking as archived
            success2, response2 = self.run_test(
                "Admin Update Submission Status (Archived)",
                "POST",
                f"flips/admin/submission/{self.test_submission_id}/status?status=archived",
                200,
                data={},
                headers=headers
            )
            success = success and success2
        
        return success, response

    def test_admin_get_attachment(self):
        """Test GET /api/flips/admin/attachment/{submission_id}/{filename}"""
        if not self.admin_token or not hasattr(self, 'test_submission_with_files_id'):
            print("❌ No admin token or submission with files ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Get Attachment",
            "GET",
            f"flips/admin/attachment/{self.test_submission_with_files_id}/test_document.txt",
            200,
            headers=headers
        )
        
        if success:
            print(f"   Attachment filename: {response.get('filename', 'unknown')}")
            print(f"   Content type: {response.get('content_type', 'unknown')}")
            print(f"   Has data: {'data' in response}")
            
        return success, response

    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        print("\n🔒 Testing Unauthorized Access...")
        
        tests = [
            ("Tier Access Without Auth", "GET", "flips/tier-access", 401),
            ("My Access Without Auth", "GET", "flips/my-access", 401),
            ("Submit Opportunity Without Auth", "POST", "flips/submit-opportunity", 401),
            ("Admin Submissions Without Auth", "GET", "flips/admin/submissions", 401),
        ]
        
        all_passed = True
        for test_name, method, endpoint, expected_status in tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status)
            if not success:
                all_passed = False
                
        return all_passed

    def test_member_access_admin_endpoints(self):
        """Test member trying to access admin-only endpoints"""
        if not self.member_token:
            print("❌ No member token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.member_token}'}
        
        tests = [
            ("Member Access Admin Submissions", "GET", "flips/admin/submissions", 403),
            ("Member Update Tier Settings", "POST", "flips/tier-access", 403),
        ]
        
        all_passed = True
        for test_name, method, endpoint, expected_status in tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status, headers=headers)
            if not success:
                all_passed = False
                
        return all_passed

    def test_invalid_submission_status_update(self):
        """Test updating submission with invalid status"""
        if not self.admin_token or not hasattr(self, 'test_submission_id'):
            print("❌ No admin token or submission ID available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Admin Update Submission (Invalid Status)",
            "POST",
            f"flips/admin/submission/{self.test_submission_id}/status?status=invalid_status",
            400,  # Should fail
            data={},
            headers=headers
        )
        
        return success, response

    def test_nonexistent_submission_access(self):
        """Test accessing non-existent submission"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        fake_id = str(uuid.uuid4())
        
        success, response = self.run_test(
            "Admin Get Non-existent Submission",
            "GET",
            f"flips/admin/submission/{fake_id}",
            404,  # Should fail
            headers=headers
        )
        
        return success, response

def main():
    print("🚀 Starting Guaranteed Flips API Tests...")
    print("=" * 60)
    
    # Setup
    tester = GuaranteedFlipsAPITester()
    
    # Login tests
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.test_member_login():
        print("❌ Member login failed, stopping tests")
        return 1

    # Tier Access Tests
    print("\n🎯 TIER ACCESS TESTS")
    print("-" * 30)
    
    # Test getting tier access settings (admin)
    admin_get_success, initial_settings = tester.test_get_tier_access_settings()
    if not admin_get_success:
        print("❌ Failed to get tier access settings")
        return 1
    
    # Test updating tier access settings (admin)
    admin_update_success, update_response = tester.test_update_tier_access_settings()
    if not admin_update_success:
        print("❌ Failed to update tier access settings")
        return 1
    
    # Test getting member access
    member_access_success, member_access = tester.test_get_member_access()
    if not member_access_success:
        print("❌ Failed to get member access")
        return 1

    # Opportunity Submission Tests
    print("\n📝 OPPORTUNITY SUBMISSION TESTS")
    print("-" * 30)
    
    # Test text-only submission
    if not tester.test_submit_opportunity_text_only()[0]:
        print("❌ Failed to submit text-only opportunity")
        return 1
    
    # Test submission with files
    if not tester.test_submit_opportunity_with_files()[0]:
        print("❌ Failed to submit opportunity with files")
        return 1
    
    # Test invalid file type (should fail)
    if not tester.test_submit_opportunity_invalid_file()[0]:
        print("❌ Invalid file type test failed")
    
    # Test empty content (should fail)
    if not tester.test_submit_opportunity_empty_content()[0]:
        print("❌ Empty content test failed")
    
    # Test getting member's own submissions
    if not tester.test_get_member_submissions()[0]:
        print("❌ Failed to get member submissions")

    # Admin Submission Management Tests
    print("\n👑 ADMIN SUBMISSION MANAGEMENT TESTS")
    print("-" * 30)
    
    # Test getting all submissions (admin)
    if not tester.test_admin_get_all_submissions()[0]:
        print("❌ Failed to get all submissions")
        return 1
    
    # Test getting submission detail (admin)
    if not tester.test_admin_get_submission_detail()[0]:
        print("❌ Failed to get submission detail")
    
    # Test updating submission status (admin)
    if not tester.test_admin_update_submission_status()[0]:
        print("❌ Failed to update submission status")
    
    # Test getting attachment (admin)
    if not tester.test_admin_get_attachment()[0]:
        print("❌ Failed to get attachment")

    # Security Tests
    print("\n🔒 SECURITY TESTS")
    print("-" * 30)
    
    # Test unauthorized access
    if not tester.test_unauthorized_access():
        print("❌ Unauthorized access test failed")
    
    # Test member accessing admin endpoints
    if not tester.test_member_access_admin_endpoints():
        print("❌ Member access to admin endpoints test failed")

    # Error Handling Tests
    print("\n⚠️ ERROR HANDLING TESTS")
    print("-" * 30)
    
    # Test invalid status update
    if not tester.test_invalid_submission_status_update()[0]:
        print("❌ Invalid status update test failed")
    
    # Test non-existent submission access
    if not tester.test_nonexistent_submission_access()[0]:
        print("❌ Non-existent submission test failed")

    # Print final results
    print("\n" + "=" * 60)
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