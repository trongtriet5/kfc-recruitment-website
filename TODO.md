# Recruitment Website - TODO & Refactor Plan

## 📋 Current Tasks

### Phase 1 Completed - Architecture & Constraints Setup

#### ✅ 1.1 RBAC → Status Transition Constraints
- [x] Create centralized `constraints.ts` with all permission and transition rules
- [x] Update `StatusTransitionService` to use centralized constraints
- [x] Update `RbacService` to use centralized constraints
- [x] Single source of truth for all business rules

#### ✅ 1.3 Store → User Hierarchy Constraints
- [x] Store access validation already implemented in `RecruitmentService.getAccessibleStoreIds()`
- [x] Applied to: candidates, campaigns, proposals listing

---

## 🔧 Refactoring & Optimization Plan

### Phase 1: Architecture & Constraints Setup

#### 1.1 RBAC → Status Transition Constraints

**Problem:** Current separation between `RbacService` and `StatusTransitionService` creates duplicated logic

**Solution:** Establish clear constraints:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                            │
├─────────────────────────────────────────────────────────────────┤
│ ADMIN          │ All permissions                                │
│ HEAD_OF_DEPARTMENT │ Full candidate + proposal workflow      │
│ RECRUITER      │ Candidate management + interview scheduling   │
│ MANAGER (AM)   │ Proposal review/approve + SM_AM interview     │
│ USER (SM)      │ View + SM_AM interview result entry           │
└─────────────────────────────────────────────────────────────────┘

Status Transition Rules (StatusTransitionService):
├── CV_FILTERING ──[RECRUITER/ADMIN]──> CV_PASSED/FAILED
├── CV_PASSED ──[RECRUITER]──> WAITING_INTERVIEW
├── WAITING_INTERVIEW ──[RECRUITER/ADMIN]──> HR_INTERVIEW_PASSED/FAILED
├── HR_INTERVIEW_PASSED ──[SM/AM/ADMIN]──> SM_AM_INTERVIEW_PASSED/FAILED
├── SM_AM_INTERVIEW_PASSED ──[AM/ADMIN]──> OM_PV_INTERVIEW_PASSED/FAILED
├── OM_PV_INTERVIEW_PASSED ──[RECRUITER/ADMIN]──> OFFER_SENT
├── OFFER_SENT ──[RECRUITER/ADMIN]──> OFFER_ACCEPTED/REJECTED
└── OFFER_ACCEPTED ──[RECRUITER/ADMIN]──> WAITING_ONBOARDING
    └── WAITING_ONBOARDING ──[SM/AM/ADMIN]──> ONBOARDING_ACCEPTED/REJECTED
```

**Action Items:**
- [x] Document permission-to-status mapping in `StatusTransitionService`
- [x] Add role validation in status transition
- [x] Create `canTransition(candidate, targetStatus, user)` function
- [x] Use centralized `constraints.ts` as single source of truth

#### 1.2 Proposal → Campaign → Candidate Flow

**Current Flow Issues:**
- Proposal can exist without Campaign
- Campaign fulfillment not automatically calculated
- No constraints on candidate assignment to proposal

**Proposed Constraints:**

```
RecruitmentProposal (DRAFT)
    │
    ├─── submit() ──> SUBMITTED (USER/SM)
    │                    │
    │                    ├─── review() ──> AM_REVIEWED (AM)
    │                    │                    │
    │                    │                    ├─── hrAccept() ──> HR_ACCEPTED (ADMIN)
    │                    │                    │                    │
    │                    │                    │                    ├─── approve() ──> APPROVED (AM/ADMIN)
    │                    │                    │                    │
    │                    │                    └─── reject() ──> REJECTED
    │                    │
    │                    └─── cancel() ──> CANCELLED
    │
    └─── APPROVED ──> auto-create Campaign ──> Candidates can be assigned

Campaign (ACTIVE)
    │
    ├─── fulfilledQty < targetQty: Campaign continues
    ├─── fulfilledQty >= targetQty: Can mark COMPLETED
    └─── hiredQty = targetQty: Auto COMPLETED if isUntilFilled=false
```

**Action Items:**
- [x] Add constraint: Proposal APPROVED required before Campaign creation
- [x] Add constraint: Candidate can only be assigned to Campaign with status ACTIVE
- [x] Auto-update Campaign fulfillment when candidate reaches ONBOARDING_ACCEPTED

#### 1.3 Store → User Hierarchy Constraints

**Current Relationships:**
```
Store
├── smId (Store Manager) - via "StoreSM" relation
├── amId (Area Manager) - via "StoreAM" relation
└── Candidates, Campaigns, Proposals linked to store
```

**Proposed Constraints:**

```
User (role: USER/SM)
    └── managedStore: Store (where smId = user.id)

User (role: MANAGER/AM)
    └── managedStores: Store[] (where amId = user.id)

Candidate
    └── storeId: Must belong to user's accessible stores
        - ADMIN: All stores
        - MANAGER: managedStores[]
        - USER: managedStore only

Proposal
    └── storeId: Must belong to user's accessible stores
```

**Action Items:**
- [x] Add store access validation in candidate listing API
- [x] Add store access validation in proposal operations
- [x] Ensure candidate's store cannot be changed to inaccessible store

---

### Phase 2: Service Layer Refactoring

#### 2.1 RecruitmentService Cleanup (1436 lines)

**Current Issues:**
- 55KB+ file with mixed responsibilities
- No clear separation between read and write operations
- Duplicated validation logic

**Proposed Safe Refactoring Approach:**

```
Phase 2a: Add Service Organization Comments
├── Group methods by domain (Forms, Campaigns, Candidates, etc.)
├── Add @Section decorators or comments for clarity

Phase 2b: Extract Shared Utilities
├── Move getAccessibleStoreIds to RbacService (already done)
├── Extract common query builders
├── Move validation logic to separate classes

Phase 2c: Create Read Services (Non-Breaking)
├── candidate-read.service.ts - List, get operations
├── campaign-read.service.ts - Campaign queries
└── Keep existing service as facade

Phase 2d: Create Write Services (Careful Migration)
├── candidate-write.service.ts - Create, update, delete
└── Migrate one domain at a time
```

**Action Items:**
- [x] Add domain organization comments to RecruitmentService
- [x] Move any remaining shared logic to constraints.ts or RbacService
- [ ] Consider creating read-only service for candidates if needed

#### 2.2 Status Transition Refactoring

**Current Issues:**
- Hardcoded transition rules in array
- No support for conditional transitions
- SLA calculation mixed with transition logic

**Proposed Structure:**

```typescript
// status-transition.types.ts
export interface TransitionRule {
  from: string | '*'
  to: string
  allowedRoles: string[]
  conditions?: TransitionCondition[]
  onTransition?: TransitionHook[]
}

export interface TransitionCondition {
  field: string
  operator: 'eq' | 'neq' | 'in' | 'notIn'
  value: any
}

export interface TransitionHook {
  type: 'before' | 'after'
  action: (context: TransitionContext) => Promise<void>
}

// Examples of hooks:
const updateSlaHook = {
  type: 'after',
  action: async (context) => {
    await updateCandidateSla(context.candidateId, context.toStatus)
  }
}

const auditLogHook = {
  type: 'after',
  action: async (context) => {
    await auditService.log(context)
  }
}

const fulfillmentHook = {
  type: 'after',
  action: async (context) => {
    if (isTerminalPositive(context.toStatus)) {
      await updateFulfillment(context.candidate)
    }
  }
}
```

#### 2.3 Proposal Service Enhancement

**Current Issues:**
- Workflow logic mixed with business logic
- No clear state machine
- Batch operations lack transaction safety

**Proposed Structure:**

```typescript
// proposal-workflow.service.ts
export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  AM_REVIEWED = 'AM_REVIEWED',
  HR_ACCEPTED = 'HR_ACCEPTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export const PROPOSAL_WORKFLOW: StateMachine<ProposalStatus> = {
  initial: ProposalStatus.DRAFT,
  states: {
    [ProposalStatus.DRAFT]: {
      on: {
        SUBMIT: { target: ProposalStatus.SUBMITTED, guard: canSubmit }
      }
    },
    [ProposalStatus.SUBMITTED]: {
      on: {
        REVIEW: { target: ProposalStatus.AM_REVIEWED, guard: isAM },
        REJECT: { target: ProposalStatus.REJECTED, guard: isAM },
        CANCEL: { target: ProposalStatus.CANCELLED, guard: isOwnerOrAM }
      }
    },
    // ... etc
  }
}
```

---

### Phase 3: Frontend Optimization

#### 3.1 Component Architecture

**Current Issues:**
- Large form components (CreateInterviewForm.tsx - 450 lines)
- Duplicated UI patterns (SearchableSelect appears multiple times)
- No shared validation logic with backend

**Action Items:**
- [ ] Extract SearchableSelect to common component
- [ ] Create form validation library shared with backend
- [ ] Add loading states and error handling consistency
- [ ] Implement optimistic updates where appropriate

#### 3.2 API Layer Enhancement

**Current Issues:**
- Direct API calls in components
- No centralized error handling
- No request/response interceptors for auth tokens

**Proposed Structure:**

```typescript
// lib/api-client.ts
class ApiClient {
  async get<T>(url: string, params?: object): Promise<T>
  async post<T>(url: string, data?: object): Promise<T>
  // ...

  // Interceptors
  private handleAuthError(response)
  private handleValidationError(response)
  private logRequest(request)
}
```

---

### Phase 4: Data Integrity & Constraints

#### 4.1 Database Constraints (Prisma Schema)

**Proposed Additions:**

```prisma
// In Candidate model
- Add @@unique([phone, storeId]) if phone must be unique per store
- Add @db.VarChar(10) constraint for phone field
- Add status validation at DB level

// In Proposal model
- Add @@unique([storeId, positionId, status]) for active proposals
- Add constraint: quantity > 0

// In Interview model
- Add constraint: scheduledAt > now() (interview must be future)
```

#### 4.2 Application-Level Constraints

**Action Items:**
- [x] Add unique constraint validation before create operations
- [x] Add concurrent modification detection (version field)
- [x] Implement soft delete with proper cascade

---

### Phase 5: Audit & Compliance

#### 5.1 Audit Log Enhancement

**Current:** Basic audit logging exists

**Proposed:**
```typescript
interface AuditEntry {
  timestamp: Date
  actor: { id: string, role: string }
  entity: { type: 'CANDIDATE' | 'PROPOSAL' | 'CAMPAIGN', id: string }
  action: AuditAction
  changes: {
    field: string
    oldValue: any
    newValue: any
  }[]
  metadata: Record<string, any>
}

enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  APPROVAL = 'APPROVAL',
  ASSIGNMENT = 'ASSIGNMENT'
}
```

---

## 📊 Priority Matrix

| Priority | Task | Status | Effort | Impact |
|----------|------|--------|--------|--------|
| P0 | Interview page navigation | ✅ COMPLETE | 1 day | High |
| P1 | Document RBAC-Status constraints | ✅ COMPLETE | 2 days | High |
| P1 | Add store access validation | ✅ COMPLETE | 2 days | High |
| P1 | Proposal workflow state machine | ✅ COMPLETE | 3 days | Medium |
| P1 | Proposal→Campaign constraints | ✅ COMPLETE | 1 day | High |
| P1 | Unique constraint validation | ✅ COMPLETE | 1 day | Medium |
| P2 | Concurrent modification detection | ✅ COMPLETE | 1 day | Medium |
| P2 | Soft delete implementation | ✅ COMPLETE | 1 day | Medium |
| P2 | Split RecruitmentService (analysis) | ✅ COMPLETE | 1 day | Medium |
| P2 | DB constraint enhancement | ✅ COMPLETE | 2 days | Medium |
| P2 | Domain organization comments | ✅ COMPLETE | 1 day | Medium |
| P3 | Frontend component extraction | ⏳ PENDING | 3 days | Low |

---

## 🔗 Dependency Graph

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Auth       │     │  Recruitment │     │   Proposal   │
│   Service    │────▶│   Service    │────▶│   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  RBAC        │     │   Status     │     │   Campaign   │
│  Service     │────▶│  Transition  │────▶│  Fulfillment │
│              │     │   Service    │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Audit      │
                     │   Service    │
                     └──────────────┘
```

---

## ✅ Quick Wins (Start Here)

1. **Document current constraints** - Create README.constraint.md
2. **Add TypeScript strict mode** - Catch more errors at compile time
3. **Add API versioning** - /api/v1/recruitment/...
4. **Cache frequently accessed data** - Stores, Positions, Statuses

---

*Last Updated: 2026-04-28*
*Maintainer: Development Team*