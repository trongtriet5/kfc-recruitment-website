# TODO - Fix Proposal/Campaign Auto-Revert

## Task
- Fix logic so when a hired candidate reverts to a non-hired status, the Proposal and Campaign revert from COMPLETED back to APPROVED/ACTIVE

## Implementation Steps

### Step 1: Modify status-transition.service.ts
- Add logic to detect when candidate moves FROM terminal positive status (ONBOARDING_ACCEPTED/OFFER_ACCEPTED) TO a non-terminal status
- Recalculate fulfillment and revert proposal/campaign status if below target

### Step 2: Modify candidate-write.service.ts
- Apply same fix for direct candidate updates

## Files to Edit
1. backend/src/recruitment/status-transition.service.ts
2. backend/src/recruitment/candidate-write.service.ts
