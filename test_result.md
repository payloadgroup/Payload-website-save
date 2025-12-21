# Test Results for Payload Application

## Current Testing Focus
Testing the REFERRAL SYSTEM with automatic tier upgrades:
1. User registration with a referral code
2. Referral count incrementing when referred user is approved
3. Automatic tier upgrade based on referral count thresholds:
   - 1+ referrals = FRONT_LINE
   - 3+ referrals = MID_LEVEL_MANAGER
   - 5+ referrals = SENIOR_MANAGER
   - 10+ referrals = TOP_LEADERSHIP
4. Referrals page showing correct data
5. Admin recalculate referral tiers endpoint

## Test Credentials
- Admin: admin@payload.com / admin123
- Member: member@payload.com / member123

## Files Changed
- /app/backend/routes/admin.py - Added automatic tier upgrade logic in update-user-status, added recalculate-referral-tiers endpoint, added get_tier_for_referral_count helper function

## Key Test Scenarios
### Scenario 1: New user registers with referral code
- Referrer: member@payload.com (get their referral code first)
- Register a new user using that referral code
- Verify the new user has `referred_by` set to member's ID

### Scenario 2: Admin approves referred user, tier upgrades
- Admin approves the new user
- Verify referrer's `referral_count` increments
- Verify referrer's `tier` upgrades appropriately

### Scenario 3: Test tier threshold boundaries
- Test that 1 referral = FRONT_LINE
- Test that 3 referrals = MID_LEVEL_MANAGER
- Test that 5 referrals = SENIOR_MANAGER
- Test that 10 referrals = TOP_LEADERSHIP

## API Endpoints to Test
- GET /api/users/my-referral-code - Get user's referral code and count
- GET /api/users/my-referrals - Get list of users referred by current user
- GET /api/admin/referral-stats - Admin view referral statistics
- POST /api/admin/recalculate-referral-tiers - Recalculate all tiers based on referrals
- POST /api/auth/register - Register with referral_code
- POST /api/admin/update-user-status - Approve user (triggers referral count + tier)

## Incorporate User Feedback
- Test that referrals trigger tier rank to upgrade appropriately
