# Fix fullName → full_name mapping bug

## Root Cause
Prisma schema has `full_name` (snake_case) but API receives `fullName` (camelCase) from frontend.
The `...rest` spread includes `fullName` which Prisma doesn't recognize.

## Files Fixed
- [x] `backend/src/recruitment/recruitment.service.ts` - `createCandidate` method
- [x] `backend/src/recruitment/recruitment.service.ts` - `apply` method
- [x] `backend/src/recruitment/candidate-write.service.ts` - `createCandidate` method

## Changes Made
In all 3 locations, extracted `fullName` from the destructured `rest` object and explicitly passed `full_name: fullName` to Prisma's `candidate.create()`.


## Fix Pattern
Extract `fullName` from `rest` and explicitly pass `full_name: fullName` to Prisma.
