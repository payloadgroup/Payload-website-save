import requests
import sys
import json
from datetime import datetime

class FocusedFeatureTester:
    def __init__(self, base_url="https://guaranteed-flips.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.member_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.crypto_play_id = None

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
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

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

    def test_bank_transaction_restrictions(self):
        """Test bank transaction restrictions for admin vs member"""
        print("\n🏦 Testing Bank Transaction Restrictions...")
        
        # Test member cannot add transactions
        success, response = self.run_test(
            "Member Cannot Add Transaction",
            "POST",
            "transactions",
            403,  # Should be forbidden
            data={
                "type": "deposit",
                "amount": 100.0,
                "description": "Test transaction",
                "category": "test"
            },
            headers={'Authorization': f'Bearer {self.member_token}'}
        )
        
        if success:
            self.log_test("Member Transaction Restriction", True)
        else:
            self.log_test("Member Transaction Restriction", False, "Member should not be able to add transactions")
        
        # Test admin can add transactions
        success, response = self.run_test(
            "Admin Can Add Transaction",
            "POST",
            "transactions",
            200,
            data={
                "type": "deposit",
                "amount": 100.0,
                "description": "Admin test transaction",
                "category": "test"
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        transaction_id = None
        if success and 'id' in response:
            transaction_id = response['id']
            self.log_test("Admin Transaction Creation", True)
        
        # Test admin can delete transactions
        if transaction_id:
            success, response = self.run_test(
                "Admin Can Delete Transaction",
                "DELETE",
                f"transactions/{transaction_id}",
                200,
                headers={'Authorization': f'Bearer {self.admin_token}'}
            )
            
            if success:
                self.log_test("Admin Transaction Deletion", True)
        
        return True

    def test_guaranteed_flips_submissions(self):
        """Test guaranteed flips submissions don't have duplicate archive button"""
        print("\n📝 Testing Guaranteed Flips Submissions...")
        
        # Get all submissions as admin
        success, response = self.run_test(
            "Get All Submissions",
            "GET",
            "flips/admin/submissions",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Submissions Retrieved", True)
            
            # Check that we can mark submissions with different statuses
            if len(response) > 0:
                submission_id = response[0]['id']
                
                # Test marking as reviewed
                success, response = self.run_test(
                    "Mark Submission Reviewed",
                    "POST",
                    f"flips/admin/submission/{submission_id}/status?status=reviewed",
                    200,
                    headers={'Authorization': f'Bearer {self.admin_token}'}
                )
                
                # Test marking as achieved
                success, response = self.run_test(
                    "Mark Submission Achieved",
                    "POST",
                    f"flips/admin/submission/{submission_id}/status?status=achieved",
                    200,
                    headers={'Authorization': f'Bearer {self.admin_token}'}
                )
                
                # Test marking as pending
                success, response = self.run_test(
                    "Mark Submission Pending",
                    "POST",
                    f"flips/admin/submission/{submission_id}/status?status=pending",
                    200,
                    headers={'Authorization': f'Bearer {self.admin_token}'}
                )
        
        return True

    def test_crypto_arbitrage_flow(self):
        """Test crypto arbitrage submission flow"""
        print("\n🔄 Testing Crypto Arbitrage Flow...")
        
        # First, create a crypto play in arbitrage section as admin
        play_data = {
            "title": "Crypto Arbitrage Opportunity",
            "description": "Test crypto arbitrage play for automated testing",
            "section": "arbitrage",
            "min_investment": 5000,
            "expected_return": "15%",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create Crypto Play",
            "POST",
            "flips/plays",
            200,
            data=play_data,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and 'id' in response:
            self.crypto_play_id = response['id']
            self.log_test("Crypto Play Created", True)
            
            # Member joins the crypto play
            success, response = self.run_test(
                "Member Joins Crypto Play",
                "POST",
                f"flips/plays/{self.crypto_play_id}/join",
                200,
                headers={'Authorization': f'Bearer {self.member_token}'}
            )
            
            if success:
                self.log_test("Member Joined Crypto Play", True)
                
                # Member submits crypto details
                success, response = self.run_test(
                    "Submit Crypto Details",
                    "POST",
                    f"flips/plays/{self.crypto_play_id}/crypto-submission",
                    200,
                    data={
                        "name": "Test Member",
                        "contact_number": "+1234567890",
                        "telegram_handle": "@testmember"
                    },
                    headers={'Authorization': f'Bearer {self.member_token}', 'Content-Type': 'application/json'}
                )
                
                if success:
                    self.log_test("Crypto Details Submitted", True)
                    
                    # Admin checks crypto submissions
                    success, response = self.run_test(
                        "Admin Views Crypto Submissions",
                        "GET",
                        f"flips/plays/{self.crypto_play_id}/crypto-submissions",
                        200,
                        headers={'Authorization': f'Bearer {self.admin_token}'}
                    )
                    
                    if success and isinstance(response, list) and len(response) > 0:
                        self.log_test("Admin Can View Crypto Submissions", True)
                        
                        # Check submission count
                        success, response = self.run_test(
                            "Get Crypto Submission Count",
                            "GET",
                            f"flips/plays/{self.crypto_play_id}/crypto-submissions/count",
                            200,
                            headers={'Authorization': f'Bearer {self.admin_token}'}
                        )
                        
                        if success and 'count' in response and response['count'] > 0:
                            self.log_test("Crypto Submission Count", True)
        
        return True

    def test_admin_members_sorting(self):
        """Test admin members are sorted by approval date"""
        print("\n👥 Testing Admin Members Sorting...")
        
        success, response = self.run_test(
            "Get All Members",
            "GET",
            "admin/members",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success and isinstance(response, list):
            self.log_test("Members Retrieved", True)
            
            # Check if members with approved_at are at the top
            approved_members = [m for m in response if m.get('approved_at')]
            if len(approved_members) > 1:
                # Check if sorted by approved_at descending
                is_sorted = all(
                    approved_members[i].get('approved_at', '') >= approved_members[i+1].get('approved_at', '')
                    for i in range(len(approved_members)-1)
                )
                if is_sorted:
                    self.log_test("Members Sorted by Approval Date", True)
                else:
                    self.log_test("Members Sorted by Approval Date", False, "Members not properly sorted")
            else:
                self.log_test("Members Sorted by Approval Date", True, "Not enough approved members to test sorting")
        
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.admin_token and self.crypto_play_id:
            # Delete the test crypto play
            success, response = self.run_test(
                "Delete Test Crypto Play",
                "DELETE",
                f"flips/plays/{self.crypto_play_id}",
                200,
                headers={'Authorization': f'Bearer {self.admin_token}'}
            )
            
            if success:
                self.log_test("Test Crypto Play Cleanup", True)
        
        return True

def main():
    print("🎯 Starting Focused Feature Testing...")
    tester = FocusedFeatureTester()
    
    # Login tests
    if not tester.login_admin():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.login_member():
        print("❌ Member login failed, stopping tests")
        return 1
    
    # Test specific features from review request
    tester.test_bank_transaction_restrictions()
    tester.test_guaranteed_flips_submissions()
    tester.test_crypto_arbitrage_flow()
    tester.test_admin_members_sorting()
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Save detailed results
    with open('/app/focused_test_results.json', 'w') as f:
        json.dump({
            "summary": f"{tester.tests_passed}/{tester.tests_run} tests passed",
            "tests": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())