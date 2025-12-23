import requests
import sys
import json
from datetime import datetime

class PayloadFeatureTester:
    def __init__(self, base_url="https://payload-club-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.member_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_play_id = None
        self.created_submission_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                except:
                    error_detail = response.text
                return False, {"error": error_detail, "status": response.status_code}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {"error": str(e)}

    def login_admin(self):
        """Login as admin"""
        print("\n🔐 Testing Admin Login...")
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

    def login_member(self):
        """Login as member"""
        print("\n🔐 Testing Member Login...")
        success, response = self.run_test(
            "Member Login",
            "POST",
            "auth/login",
            200,
            data={"email": "member@payload.com", "password": "member123"}
        )
        if success and 'access_token' in response:
            self.member_token = response['access_token']
            return True
        return False

    def test_my_projects_endpoint(self):
        """Test GET /api/projects/my-projects"""
        print("\n📋 Testing My Projects Endpoint...")
        if not self.member_token:
            self.log_test("Get My Projects", False, "No member token available")
            return False
        
        success, response = self.run_test(
            "Get My Projects",
            "GET",
            "projects/my-projects",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("My Projects Response Format", True)
            return response  # Return projects for further testing
        elif success:
            self.log_test("My Projects Response Format", False, "Response should be a list")
            
        return []

    def test_start_project_endpoint(self):
        """Test POST /api/projects/start/{business_type}"""
        print("\n🚀 Testing Start Project Endpoint...")
        if not self.member_token:
            self.log_test("Start Project", False, "No member token available")
            return False
        
        # Test starting a project for guaranteed_flips
        success, response = self.run_test(
            "Start Guaranteed Flips Project",
            "POST",
            "projects/start/guaranteed_flips",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            required_fields = ['id', 'user_id', 'business_type', 'business_name', 'status']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Start Project Response - {field}", False, f"Missing field: {field}")
                    return False
                else:
                    self.log_test(f"Start Project Response - {field}", True)
            return response['id']  # Return project ID for further testing
        
        return False

    def test_project_tasks_endpoint(self, project_id):
        """Test GET /api/projects/{project_id}/tasks"""
        print("\n📝 Testing Project Tasks Endpoint...")
        if not self.member_token or not project_id:
            self.log_test("Get Project Tasks", False, "No member token or project ID available")
            return []
        
        success, response = self.run_test(
            "Get Project Tasks",
            "GET",
            f"projects/{project_id}/tasks",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Project Tasks Response Format", True)
            if len(response) > 0:
                # Check first task structure
                task = response[0]
                required_fields = ['id', 'project_id', 'title', 'description', 'status', 'order']
                for field in required_fields:
                    if field not in task:
                        self.log_test(f"Task Structure - {field}", False, f"Missing field: {field}")
                    else:
                        self.log_test(f"Task Structure - {field}", True)
            return response
        elif success:
            self.log_test("Project Tasks Response Format", False, "Response should be a list")
            
        return []

    def test_update_task_status_endpoint(self, tasks):
        """Test PUT /api/projects/tasks/{task_id}/status"""
        print("\n✅ Testing Update Task Status Endpoint...")
        if not self.member_token or not tasks:
            self.log_test("Update Task Status", False, "No member token or tasks available")
            return False
        
        # Update first task to in_progress
        task_id = tasks[0]['id']
        success, response = self.run_test(
            "Update Task to In Progress",
            "PUT",
            f"projects/tasks/{task_id}/status",
            200,
            data={"status": "in_progress"},
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            if response.get('status') == 'in_progress':
                self.log_test("Task Status Update Verification", True)
            else:
                self.log_test("Task Status Update Verification", False, f"Status not updated correctly: {response.get('status')}")
        
        return success

    def test_project_progress_endpoint(self, project_id):
        """Test GET /api/projects/{project_id}/progress"""
        print("\n📊 Testing Project Progress Endpoint...")
        if not self.member_token or not project_id:
            self.log_test("Get Project Progress", False, "No member token or project ID available")
            return False
        
        success, response = self.run_test(
            "Get Project Progress",
            "GET",
            f"projects/{project_id}/progress",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            required_fields = ['project_id', 'business_name', 'total_tasks', 'completed_tasks', 'progress_percentage']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Progress Response - {field}", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Progress Response - {field}", True)
        
        return success

    def test_admin_member_progress_endpoint(self):
        """Test GET /api/projects/admin/member-progress"""
        print("\n👥 Testing Admin Member Progress Endpoint...")
        if not self.admin_token:
            self.log_test("Admin Member Progress", False, "No admin token available")
            return False
        
        success, response = self.run_test(
            "Admin Member Progress",
            "GET",
            "projects/admin/member-progress",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Admin Member Progress Response Format", True)
            if len(response) > 0:
                # Check first member structure
                member = response[0]
                required_fields = ['user_id', 'user_name', 'user_email', 'total_projects', 'overall_progress']
                for field in required_fields:
                    if field not in member:
                        self.log_test(f"Member Progress Structure - {field}", False, f"Missing field: {field}")
                    else:
                        self.log_test(f"Member Progress Structure - {field}", True)
                return response[0]['user_id']  # Return user ID for detailed test
        elif success:
            self.log_test("Admin Member Progress Response Format", False, "Response should be a list")
            
        return False

    def test_admin_member_detail_endpoint(self, user_id):
        """Test GET /api/projects/admin/member/{user_id}/projects"""
        print("\n🔍 Testing Admin Member Detail Endpoint...")
        if not self.admin_token or not user_id:
            self.log_test("Admin Member Detail", False, "No admin token or user ID available")
            return False
        
        success, response = self.run_test(
            "Admin Member Detail",
            "GET",
            f"projects/admin/member/{user_id}/projects",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            required_fields = ['member', 'projects']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Member Detail Response - {field}", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Member Detail Response - {field}", True)
        
        return success

    def test_censored_referrals_activation(self):
        """Test POST /api/projects/activate-censored-referrals-all"""
        print("\n🔄 Testing Censored Referrals Auto-Activation...")
        if not self.admin_token:
            self.log_test("Activate Censored Referrals", False, "No admin token available")
            return False
        
        success, response = self.run_test(
            "Activate Censored Referrals for All",
            "POST",
            "projects/activate-censored-referrals-all",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            if 'message' in response:
                self.log_test("Censored Referrals Activation Response", True)
            else:
                self.log_test("Censored Referrals Activation Response", False, "Missing message field")
        
        return success

    def test_guaranteed_flips_apis(self):
        """Test Guaranteed Flips API endpoints"""
        print("\n🎯 Testing Guaranteed Flips APIs...")
        
        # Test get plays for property section (should be accessible to all)
        success, response = self.run_test(
            "Get Property Plays",
            "GET",
            "flips/plays/property",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Property Plays Response Format", True)
        elif success:
            self.log_test("Property Plays Response Format", False, "Response should be a list")
        
        # Test member access check
        success, response = self.run_test(
            "Get Member Flip Access",
            "GET",
            "flips/my-access",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            required_fields = ['user_tier', 'sections']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Member Access Response - {field}", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Member Access Response - {field}", True)
        
        return success

    def test_admin_play_management(self):
        """Test Admin Play CRUD operations"""
        print("\n⚙️ Testing Admin Play Management...")
        
        if not self.admin_token:
            self.log_test("Admin Play Management", False, "No admin token available")
            return False
        
        # Create a play
        play_data = {
            "title": "Test Property Deal",
            "description": "A test property investment opportunity",
            "section": "property",
            "min_investment": 10000,
            "expected_return": "20%",
            "deadline": "2024-12-31",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create Play",
            "POST",
            "flips/plays",
            200,
            data=play_data,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and 'id' in response:
            self.created_play_id = response['id']
            self.log_test("Play Creation Response", True)
            
            # Test update play
            update_data = {
                "title": "Updated Test Property Deal",
                "expected_return": "25%"
            }
            
            success, response = self.run_test(
                "Update Play",
                "PUT",
                f"flips/plays/{self.created_play_id}",
                200,
                data=update_data,
                headers={'Authorization': f'Bearer {self.admin_token}'}
            )
            
            if success and response.get('title') == "Updated Test Property Deal":
                self.log_test("Play Update Verification", True)
            else:
                self.log_test("Play Update Verification", False, "Title not updated correctly")
        
        return success

    def test_member_play_participation(self):
        """Test Member Play Participation"""
        print("\n👥 Testing Member Play Participation...")
        
        if not self.member_token or not self.created_play_id:
            self.log_test("Member Play Participation", False, "No member token or play ID available")
            return False
        
        # Join a play
        success, response = self.run_test(
            "Join Play",
            "POST",
            f"flips/plays/{self.created_play_id}/join",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            if 'message' in response and 'instructions' in response['message'].lower():
                self.log_test("Join Play Message Check", True)
            else:
                self.log_test("Join Play Message Check", False, "Expected instructions message not found")
        
        # Check join status
        success, response = self.run_test(
            "Check Play Join Status",
            "GET",
            f"flips/plays/{self.created_play_id}/my-status",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success and response.get('joined') == True:
            self.log_test("Play Join Status Verification", True)
        else:
            self.log_test("Play Join Status Verification", False, "Join status not correct")
        
        return success

    def test_admin_participant_management(self):
        """Test Admin Participant Management"""
        print("\n📋 Testing Admin Participant Management...")
        
        if not self.admin_token or not self.created_play_id:
            self.log_test("Admin Participant Management", False, "No admin token or play ID available")
            return False
        
        # Get participants
        success, response = self.run_test(
            "Get Play Participants",
            "GET",
            f"flips/plays/{self.created_play_id}/participants",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Participants List Format", True)
            
            if len(response) > 0:
                participant = response[0]
                user_id = participant.get('user_id')
                
                if user_id:
                    # Update contact status
                    success, response = self.run_test(
                        "Update Contact Status",
                        "PUT",
                        f"flips/plays/{self.created_play_id}/participants/{user_id}/contact-status",
                        200,
                        data={"contact_status": "contacted"},
                        headers={'Authorization': f'Bearer {self.admin_token}'}
                    )
                    
                    if success:
                        self.log_test("Contact Status Update", True)
                    else:
                        self.log_test("Contact Status Update", False, "Failed to update contact status")
        
        return success

    def test_opportunity_submissions(self):
        """Test Member Opportunity Submissions"""
        print("\n📝 Testing Opportunity Submissions...")
        
        if not self.member_token:
            self.log_test("Opportunity Submissions", False, "No member token available")
            return False
        
        # Submit an opportunity
        success, response = self.run_test(
            "Submit Opportunity",
            "POST",
            "flips/submit-opportunity",
            200,
            data={"content": "Test opportunity submission for automated testing"},
            headers={'Authorization': f'Bearer {self.member_token}', 'Content-Type': 'application/json'}
        )
        
        if success and 'submission_id' in response:
            self.created_submission_id = response['submission_id']
            self.log_test("Opportunity Submission", True)
        
        # Get member's submissions
        success, response = self.run_test(
            "Get My Submissions",
            "GET",
            "flips/my-submissions",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("My Submissions Format", True)
        
        return success

    def test_admin_submission_management(self):
        """Test Admin Submission Management"""
        print("\n🔧 Testing Admin Submission Management...")
        
        if not self.admin_token:
            self.log_test("Admin Submission Management", False, "No admin token available")
            return False
        
        # Get all submissions
        success, response = self.run_test(
            "Get All Submissions",
            "GET",
            "flips/admin/submissions",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("All Submissions Format", True)
            
            if self.created_submission_id:
                # Mark submission as achieved
                success, response = self.run_test(
                    "Mark Submission Achieved",
                    "POST",
                    f"flips/admin/submission/{self.created_submission_id}/status?status=achieved",
                    200,
                    headers={'Authorization': f'Bearer {self.admin_token}'}
                )
                
                if success:
                    self.log_test("Mark Submission Achieved", True)
        
        return success

    def test_funding_apis(self):
        """Test Funding Progress APIs"""
        print("\n💰 Testing Funding Progress APIs...")
        
        if not self.admin_token:
            self.log_test("Funding APIs", False, "No admin token available")
            return False
        
        # Get funding summary
        success, response = self.run_test(
            "Get Funding Summary",
            "GET",
            "funding/progress/summary",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            required_fields = ['total_members', 'registered_count', 'funded_count']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Funding Summary - {field}", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Funding Summary - {field}", True)
        
        # Get all members funding status
        success, response = self.run_test(
            "Get Members Funding Status",
            "GET",
            "funding/progress/members",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Members Funding Status Format", True)
        
        return success

    def test_cluster_apis(self):
        """Test Cluster Syndicate APIs"""
        print("\n🏢 Testing Cluster Syndicate APIs...")
        
        # Get cluster summary (available to all users)
        success, response = self.run_test(
            "Get Cluster Summary",
            "GET",
            "funding/cluster/summary",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            required_fields = ['clusters', 'total_capital']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Cluster Summary - {field}", False, f"Missing field: {field}")
                else:
                    self.log_test(f"Cluster Summary - {field}", True)
        
        return success

    def test_bank_total_api(self):
        """Test Bank Total API"""
        print("\n🏦 Testing Bank Total API...")
        
        # Get bank total (available to all users)
        success, response = self.run_test(
            "Get Bank Total",
            "GET",
            "funding/bank/total",
            200,
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            if 'total' in response and isinstance(response['total'], (int, float)):
                self.log_test("Bank Total Format", True)
            else:
                self.log_test("Bank Total Format", False, "Total should be a number")
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.admin_token and self.created_play_id:
            # Delete the test play
            success, response = self.run_test(
                "Delete Test Play",
                "DELETE",
                f"flips/plays/{self.created_play_id}",
                200,
                headers={'Authorization': f'Bearer {self.admin_token}'}
            )
            
            if success:
                self.log_test("Test Play Cleanup", True)
        
        return True

def main():
    print("🚀 Starting Payload Feature Testing...")
    tester = PayloadFeatureTester()
    
    # Login tests
    if not tester.login_admin():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.login_member():
        print("❌ Member login failed, stopping tests")
        return 1
    
    # Test new features
    tester.test_guaranteed_flips_apis()
    tester.test_admin_play_management()
    tester.test_member_play_participation()
    tester.test_admin_participant_management()
    tester.test_opportunity_submissions()
    tester.test_admin_submission_management()
    tester.test_funding_apis()
    tester.test_cluster_apis()
    tester.test_bank_total_api()
    
    # Test existing project functionality
    projects = tester.test_my_projects_endpoint()
    project_id = tester.test_start_project_endpoint()
    
    if project_id:
        tasks = tester.test_project_tasks_endpoint(project_id)
        if tasks:
            tester.test_update_task_status_endpoint(tasks)
        tester.test_project_progress_endpoint(project_id)
    
    # Test admin endpoints
    user_id = tester.test_admin_member_progress_endpoint()
    if user_id:
        tester.test_admin_member_detail_endpoint(user_id)
    
    tester.test_censored_referrals_activation()
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": f"{tester.tests_passed}/{tester.tests_run} tests passed",
            "tests": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())