# Test Results for Payload Application

## Current Testing Focus
Testing the REFERRAL LINK feature:
1. Referrals page shows shareable referral link with member's code
2. Copy Link and Share buttons work
3. Visiting /register?ref=CODE auto-fills the referral code field
4. User registering via referral link has the code saved
5. After admin approval, referrer's count and tier update correctly

## Test Credentials
- Admin: admin@payload.com / admin123
- Member: member@payload.com / member123

## Files Changed
- /app/frontend/src/pages/ReferralsPage.js - Added shareable referral link section with Copy Link and Share buttons
- /app/frontend/src/pages/RegisterPage.js - Added URL query param capture for ?ref= parameter, auto-fills referral code field

## Key Test Scenarios
### Scenario 1: Referral link on Referrals page
- Login as member
- Navigate to /referrals
- Verify "YOUR REFERRAL LINK" section shows the correct link format: {origin}/register?ref={CODE}
- Verify COPY LINK and SHARE buttons are present

### Scenario 2: Auto-fill referral code from URL
- Visit /register?ref=TESTDC81C9
- Verify referral_code field is auto-filled with TESTDC81C9
- Verify "(AUTO-FILLED FROM LINK)" label appears
- Verify "You were referred by a Payload member!" message appears
- Verify field is read-only when auto-filled

### Scenario 3: Complete referral flow via link
- Get member's referral code
- Register new user via /register?ref={CODE}
- Admin approves the new user
- Verify member's referral_count increments
- Verify member's tier upgrades if threshold met

## API Endpoints to Test
- GET /api/users/my-referral-code - Returns member's own_referral_code
- POST /api/auth/register - Accepts referral_code from form
- POST /api/admin/update-user-status - Triggers referral count + tier upgrade

## Incorporate User Feedback
- Referral link should automatically capture which member the referral belongs to
- Signup using referral link should be recognized and update referrals page
