# Recruitment Management Platform — Enterprise-Level Analysis & Improvement Recommendations

> **Prepared by:** Senior Product Manager + Senior HR Operations Consultant + Enterprise SaaS Architect  
> **Context:** Multi-store retail/F&B recruitment operations (KFC-style chain)  
> **Date:** 2025

---

## 1. Current System Problems

### 1.1 Data Architecture Gaps
- **No audit trail**: Any status change, PIC assignment, or campaign transfer happens without historical record. Compliance and debugging are impossible.
- **No SLA tracking**: Candidates can sit in "CV Filtering" for weeks without escalation. No automatic breach detection.
- **No offer management**: Offer letters, salary negotiations, and acceptance tracking are handled outside the system (spreadsheets/Email).
- **No blacklist intelligence**: Repeated no-shows or fake applicants are not tracked across campaigns.
- **Weak proposal model**: `RecruitmentProposal.status` is a plain string with no workflow history, no urgency, no budget, no target join date.
- **Campaign lacks fulfillment tracking**: No `targetQty`, `fulfilledQty`, or auto-completion logic.

### 1.2 Business Logic Gaps
- **No status transition enforcement**: Any role can (attempt to) set any status. SM can mark candidate as "Offer Accepted" without going through interviews.
- **No headcount reservation**: When a proposal is approved, headcount is not reserved, leading to overbooking.
- **No proposal versioning**: Rejected proposals cannot be resubmitted; SM must recreate from scratch.
- **No communication log**: Phone calls, emails, Zalo messages with candidates are not tracked.
- **No aging visibility**: Recruiters cannot see which candidates have been stuck in a stage for too long.

### 1.3 Permission & Security Gaps
- **Role string is too coarse**: `USER` / `MANAGER` / `ADMIN` does not distinguish between SM, AM, HR, Recruiter, Head of Department.
- **No action-level permissions**: The system checks "can view store" but not "can approve proposal" or "can send offer".
- **No data isolation for recruiters**: Recruiters can see all candidates, not just those in their assigned campaigns.

### 1.4 UX/UI Gaps
- **Dashboard is static**: No operational alerts, no "at-risk" candidates, no SLA breach warnings.
- **Candidate list lacks priority/aging**: All candidates look the same regardless of urgency or how long they've been in a stage.
- **Proposal approval is binary**: Just "Approve" / "Reject" buttons with no workflow timeline, no remark history.
- **Campaign list lacks fulfillment gauge**: Cannot see at a glance if a campaign is 20% or 90% fulfilled.
- **No notification center**: Users must manually check pages for updates.

---

## 2. Missing Business Logic

### 2.1 Candidate Lifecycle
| Missing Feature | Impact | Priority |
|-----------------|--------|----------|
| Blacklist check on apply | Fake/repeat no-shows re-enter pipeline | High |
| Status change reason requirement | No context for why candidate was rejected | High |
| Auto-SLA timer per stage | Candidates forgotten in backlog | High |
| Communication log | No record of recruiter-candidate interactions | Medium |
| Document checklist (ID, cert, contract) | Onboarding delays due to missing docs | Medium |
| Re-engagement rule (3 no-shows → blacklist) | Manual tracking of no-show counts | Medium |

### 2.2 Proposal Lifecycle
| Missing Feature | Impact | Priority |
|-----------------|--------|----------|
| Urgency levels (LOW/NORMAL/HIGH/CRITICAL) | HR cannot prioritize which store to fill first | High |
| Budget per head | Finance cannot track recruitment cost | Medium |
| Target joining date | Store managers cannot plan staffing | High |
| Replacement for (employee name/ID) | Backfill vs. expansion not distinguished | Medium |
| Business reason (EXPANSION/REPLACEMENT/SEASONAL) | Workforce planning analytics broken | Medium |
| Headcount reservation on approval | Overbooking across simultaneous campaigns | High |

### 2.3 Campaign Lifecycle
| Missing Feature | Impact | Priority |
|-----------------|--------|----------|
| Fulfillment gauge (filled/target) | Cannot track campaign effectiveness | High |
| Auto-close when `isUntilFilled` and target met | Manual campaign management overhead | Medium |
| Campaign status (ACTIVE/PAUSED/COMPLETED/CANCELLED) | No lifecycle state machine | Medium |
| Recruiter performance per campaign | Cannot evaluate TA effectiveness | Medium |

### 2.4 Offer Lifecycle
| Missing Feature | Impact | Priority |
|-----------------|--------|----------|
| Offer entity (salary, probation, start date) | All offer data in spreadsheets | High |
| Offer expiration auto-revert | Accepted offers expire without action | Medium |
| Offer document management | Contract templates not versioned | Medium |

---

## 3. Recommended Business Flow

### 3.1 Hiring Request Flow (SM/AM → HR)
```
SM Creates Request (DRAFT)
    ↓
SM Submits Request (SUBMITTED)
    ↓
AM Reviews (AM_REVIEWED) — optional pre-check, headcount validation
    ↓
HR Accepts (HR_ACCEPTED) — assigns recruiter, estimates timeline
    ↓
Head of Department Approves (APPROVED) — budget sign-off, headcount reserved
    ↓
HR Creates Campaign → Sources Candidates
    ↓
Candidates flow: Applied → Screening → Interview → Offer → Hired → Onboarding
    ↓
Campaign auto-completes when fulfilledQty ≥ targetQty
    ↓
Headcount updated, store notified
```

### 3.2 Candidate Status Flow
```
CV_FILTERING (24h SLA)
    ├─→ CV_PASSED → WAITING_INTERVIEW (48h SLA)
    │       ├─→ HR_INTERVIEW_PASSED → SM_AM_INTERVIEW (48h SLA)
    │       │       ├─→ SM_AM_INTERVIEW_PASSED → OM_PV_INTERVIEW (48h SLA)
    │       │       │       ├─→ OM_PV_INTERVIEW_PASSED → OFFER_SENT (24h SLA)
    │       │       │       │       ├─→ OFFER_ACCEPTED → WAITING_ONBOARDING (72h SLA)
    │       │       │       │       │       ├─→ ONBOARDING_ACCEPTED ✓ (Terminal)
    │       │       │       │       │       └─→ ONBOARDING_REJECTED ✗ (Terminal)
    │       │       │       │       └─→ OFFER_REJECTED ✗ (Terminal)
    │       │       │       └─→ OM_PV_INTERVIEW_FAILED ✗ (Terminal)
    │       │       │       └─→ OM_PV_NO_SHOW → (count +1, 3 strikes → blacklist)
    │       │       └─→ SM_AM_INTERVIEW_FAILED ✗ (Terminal)
    │       │       └─→ SM_AM_NO_SHOW → (count +1)
    │       └─→ HR_INTERVIEW_FAILED ✗ (Terminal)
    ├─→ CV_FAILED ✗ (Terminal)
    ├─→ BLACKLIST ✗ (Terminal, requires reason)
    ├─→ CANNOT_CONTACT (retry logic: 3 attempts)
    └─→ AREA_NOT_RECRUITING (parked, notify when opening)
```

### 3.3 SLA Rules
| Stage | SLA | Escalation |
|-------|-----|------------|
| CV_FILTERING | 24h | Alert PIC after 24h, escalate to Head of Dept after 48h |
| WAITING_INTERVIEW | 48h | Alert PIC after 48h |
| SM_AM_INTERVIEW | 48h | Alert SM/AM after 48h, escalate to AM after 72h |
| OM_PV_INTERVIEW | 48h | Alert OM after 48h |
| OFFER_SENT | 24h | Alert candidate via SMS after 24h, auto-expire after 72h |
| WAITING_ONBOARDING | 72h | Alert store manager 24h before join date |

---

## 4. Recommended Logic Flow

### 4.1 Status Transition Engine
- **Rule-based validation**: Each transition has `from[]`, `to`, `allowedRoles[]`, `requiresReason?`
- **Terminal status protection**: Once `ONBOARDING_ACCEPTED`, `BLACKLIST`, etc., only ADMIN can revert
- **Blacklist guard**: Blacklisted candidates cannot advance past `CV_FILTERING`
- **Auto-SLA update**: On each transition, compute new `slaDueDate` from `CandidateStatus.slaHours`
- **Audit log creation**: Every transition creates an immutable `CandidateAuditLog` entry
- **Fulfillment update**: Terminal positive statuses (`OFFER_ACCEPTED`, `ONBOARDING_ACCEPTED`) increment campaign/proposal fulfillment counts

### 4.2 Proposal Workflow Engine
- **State machine**: `DRAFT → SUBMITTED → AM_REVIEWED → HR_ACCEPTED → APPROVED`
- **Parallel rejection/cancellation**: Any stage before `APPROVED` can be `REJECTED` or `CANCELLED`
- **Resubmission**: `REJECTED` proposals can be cloned to `DRAFT` (new version)
- **Headcount reservation**: On `APPROVED`, increment `HeadcountPosition.current` by `proposal.quantity`
- **Headcount release**: On `CANCELLED` or `REJECTED` (before approval), decrement reservation

### 4.3 Campaign Fulfillment Engine
- **Auto-calculation**: On every candidate status change to terminal positive, recalculate:
  - `offerAcceptedQty`
  - `hiredQty`
  - `fulfilledQty`
  - `completionRate = fulfilledQty / targetQty`
- **Auto-completion**: If `isUntilFilled && completionRate >= 100%`, set `status = 'COMPLETED'`
- **Aging report**: Per-candidate hours-in-stage, SLA breach flag, priority indicator

---

## 5. Role Permission Matrix

| Action | ADMIN | HEAD_OF_DEPT | RECRUITER | AM (MANAGER) | SM (USER) |
|--------|:-----:|:------------:|:---------:|:------------:|:---------:|
| **Candidates** |
| Create candidate | ✓ | ✓ | ✓ | ✗ | ✗ |
| View all candidates | ✓ | ✓ | ✓ (assigned) | ✓ (own stores) | ✓ (own store) |
| Update candidate info | ✓ | ✓ | ✓ | ✗ | ✗ |
| Change status (any) | ✓ | ✓ | ✓ (HR stages) | ✓ (SM/AM stages) | ✓ (SM stages) |
| Assign PIC | ✓ | ✓ | ✓ | ✗ | ✗ |
| Transfer campaign | ✓ | ✓ | ✓ | ✗ | ✗ |
| Blacklist candidate | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Proposals** |
| Create proposal | ✓ | ✓ | ✗ | ✓ | ✓ |
| Submit proposal | ✓ | ✓ | ✗ | ✓ | ✓ (own) |
| Review (AM) | ✓ | ✓ | ✗ | ✓ | ✗ |
| HR Accept | ✓ | ✓ | ✗ | ✗ | ✗ |
| Approve | ✓ | ✓ | ✗ | ✗ | ✗ |
| Reject (with reason) | ✓ | ✓ | ✗ | ✓ | ✗ |
| Cancel | ✓ | ✓ | ✗ | ✓ | ✓ (own draft) |
| **Campaigns** |
| Create campaign | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage campaign | ✓ | ✓ | ✓ (assigned) | ✗ | ✗ |
| View campaign | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Offers** |
| Create/send offer | ✓ | ✓ | ✓ | ✗ | ✗ |
| View offer | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Reports** |
| View dashboard | ✓ | ✓ | ✓ | ✓ | ✓ (limited) |
| Export reports | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Settings** |
| Manage users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage forms | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## 6. Dashboard Optimization

### 6.1 Operational Alerts Card (Top Priority)
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ CẢNH BÁO VẬN HÀNH                    [X candidates]      │
├─────────────────────────────────────────────────────────────┤
│ 🔴 5 ứng viên vượt SLA (> 48h chờ phỏng vấn)               │
│ 🟡 3 đề xuất tuyển dụng chờ AM xem xét > 24h               │
│ 🔴 2 chiến dịch sắp hết hạn, mới đạt 30% chỉ tiêu          │
│ 🟡 4 offer letter sắp hết hạn phản hồi                     │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Role-Based Dashboard Views
- **HR/Recruiter View**:
  - My assigned candidates + SLA breach count
  - Pending interviews today/this week
  - Campaigns I'm managing + fulfillment %
  - Source effectiveness (conversion by channel)

- **AM View**:
  - Store request backlog (pending proposals in my zone)
  - Zone fulfillment rate vs. target
  - Stores with highest candidate drop-off
  - Pending AM review proposals

- **SM View**:
  - My store's open requests + status
  - Candidates assigned to my store
  - Upcoming onboardings (next 7 days)
  - My store's headcount vs. target

### 6.3 KPI Cards (Unified)
| Card | Metric | Trend |
|------|--------|-------|
| Tổng ứng viên | Count | MoM % |
| Ứng viên mới tháng này | Count | vs. last month |
| Chiến dịch hoạt động | Count | — |
| Ứng viên đạt | Count | Conversion rate |
| Trúng tuyển | Count | vs. target |
| SLA vi phạm | Count | 🔴 if > 0 |
| Đề xuất chờ duyệt | Count | 🟡 if > 3 |
| Tỷ lệ lấp đầy | % | vs. monthly target |

### 6.4 Charts
1. **Pipeline Velocity**: Average days per stage (trend over 6 months)
2. **Funnel Conversion**: Stage-to-stage conversion rates with benchmark lines
3. **Source ROI**: Cost per hire by source channel
4. **Store Heatmap**: Fulfillment rate by store/zone
5. **TA Performance**: Pass rate, hire rate, avg time-to-hire per recruiter

---

## 7. Candidate Module Optimization

### 7.1 List View Enhancements
- **Aging column**: Color-coded (green < 50% SLA, yellow 50-100%, red > 100% breached)
- **Priority badge**: URGENT (red dot), HIGH (orange), NORMAL (gray), LOW (blue)
- **Quick actions**: Based on role — SM sees "PV Đạt/Loại", HR sees full status menu
- **Bulk actions**: Select multiple candidates → assign PIC, transfer campaign, mass status update
- **Saved filters**: "My urgent candidates", "SLA breached", "Waiting interview"

### 7.2 Detail View Enhancements
```
┌─────────────────────────────────────────────────────────────┐
│ [Name]                    [Status Badge] [Priority] [Edit]  │
├─────────────────────────────────────────────────────────────┤
│ 📋 THÔNG TIN CƠ BẢN                                         │
│    Full name, phone, email, CCCD, DOB, address...           │
├─────────────────────────────────────────────────────────────┤
│ 📊 TIẾN TRÌNH TUYỂN DỤNG                                    │
│    [Timeline: Applied → Screening → Interview → Offer]      │
│    Current: WAITING_INTERVIEW (24h in stage, SLA: 48h)      │
├─────────────────────────────────────────────────────────────┤
│ 📝 LỊCH SỬ TRẠNG THÁI (Audit Trail)                         │
│    2025-01-15 09:30 | HR Sơ vấn đạt | by Nguyen Van A      │
│    2025-01-14 14:00 | Chờ phỏng vấn | by System            │
├─────────────────────────────────────────────────────────────┤
│ 💬 LỊCH SỬ LIÊN LẠC                                         │
│    [Add call/email/SMS note]                                │
│    2025-01-15 | Phone | Outbound | "Confirmed interview"   │
├─────────────────────────────────────────────────────────────┤
│ 📄 OFFER LETTER                                             │
│    [Create Offer] or [View Offer: $500, start: 01/02]      │
├─────────────────────────────────────────────────────────────┤
│ 📎 TÀI LIỆU                                                 │
│    [CV.pdf] [ID Copy] [Contract] [Health Cert]             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Kanban View Enhancements
- **Aging indicator**: Small badge on each card showing hours in stage
- **Priority indicator**: Colored left border (red=urgent, orange=high)
- **SLA breach overlay**: Red pulse animation on cards exceeding SLA
- **Drag-and-drop with validation**: Visual feedback if drop target is invalid for user's role

---

## 8. Hiring Request Module Optimization

### 8.1 Request Creation Form (SM/AM)
```
┌─────────────────────────────────────────────────────────────┐
│ TẠO ĐỀ XUẤT TUYỂN DỤNG                                      │
├─────────────────────────────────────────────────────────────┤
│ Cửa hàng *        [Dropdown: Store 001 - Q1]               │
│ Vị trí *          [Dropdown: Crew Member]                  │
│ Số lượng *        [Number: 3]                              │
│ Mức độ khẩn cấp * [○ LOW  ○ NORMAL  ● HIGH  ○ CRITICAL]  │
│ Ngày cần nhận việc [Date: 2025-02-01]                      │
│ Ngân sách/đầu người [Number: $500]                         │
│ Lý do tuyển dụng * [○ Mở rộng  ● Thay thế  ○ Mùa vụ]     │
│ Thay thế cho      [Text: Nguyen Van B (NV123)]             │
│ Lý do chi tiết    [Textarea]                               │
│ Tuyển đến khi đủ  [☑]                                      │
│ Thời hạn chiến dịch [Date range or auto if checked above]  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Approval Workflow UI
```
┌─────────────────────────────────────────────────────────────┐
│ ĐỀ XUẤT: Store 001 - Crew Member (3 NV)                    │
│ Status: HR_ACCEPTED ────────────────────────────────▶      │
│                                                               │
│ Timeline:                                                    │
│ ●───●───●───○───○                                            │
│ Draft Submitted AM_Reviewed HR_Accepted Approved            │
│ 1/10   1/10    1/11       1/12      —                      │
│ SM A    SM A    AM B        HR C     —                      │
│                                                               │
│ [Actions based on role]:                                    │
│   HR: [Duyệt] [Từ chối]                                    │
│   AM: (already reviewed)                                    │
│   SM: (already submitted)                                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Fulfillment Progress
```
┌─────────────────────────────────────────────────────────────┐
│ TIẾN ĐỘ LẤP ĐẦY: 2/3 (66.7%)                                │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                               │
│ CV nhận: 15  |  Sơ vấn đạt: 8  |  PV đạt: 4  |  Offer: 3   │
│ Nhận việc: 2  |  Còn thiếu: 1                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Campaign Module Optimization

### 9.1 Campaign Card
```
┌─────────────────────────────────────────────────────────────┐
│ Chiến dịch: Store 001 - Crew Member T2/2025                │
│ ● Đang hoạt động  |  Store 001  |  Recruiter: Nguyen A    │
│                                                               │
│ Tiến độ: 8/10 (80%)  ████████████████████████████████░░   │
│                                                               │
│ Ứng viên: 45  |  Đạt: 12  |  Offer: 10  |  Nhận việc: 8   │
│                                                               │
│ [Xem chi tiết] [Tạm dừng] [Đóng chiến dịch]               │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Campaign Detail Tabs
1. **Tổng quan**: Fulfillment gauge, conversion funnel, recruiter performance
2. **Ứng viên**: Filterable list of all candidates in campaign
3. **Lịch sử**: Audit log of all campaign changes
4. **Cài đặt**: Edit dates, target quantity, recruiter assignment

---

## 10. Approval Flow Optimization

### 10.1 Multi-Stage Approval
| Stage | Actor | Action | SLA |
|-------|-------|--------|-----|
| 1. Submission | SM | Create & submit request | — |
| 2. AM Review | AM | Validate need, check store budget | 24h |
| 3. HR Intake | HR/Recruiter | Assess feasibility, assign recruiter | 24h |
| 4. Final Approval | Head of Dept / Admin | Budget approval, headcount reservation | 24h |
| 5. Campaign Launch | HR | Create campaign, publish form | 24h |

### 10.2 Rejection Handling
- **Rejection reason is mandatory** (free text + reason code)
- **SM receives notification** with rejection reason
- **SM can clone rejected proposal** to create new version (preserves data, new ID)
- **AM can override SM submission** (send back for correction)

### 10.3 Cancellation Rules
- **SM can cancel** own proposal only in `DRAFT` or `SUBMITTED`
- **AM can cancel** any proposal in their zone before `APPROVED`
- **HR/Admin can cancel** any proposal before `APPROVED`
- **Cancellation releases headcount reservation**

---

## 11. Reports & KPI Recommendations

### 11.1 Operational Reports
| Report | Audience | Frequency |
|--------|----------|-----------|
| SLA Breach Report | HR Manager | Daily |
| Pipeline Velocity | Head of Dept | Weekly |
| Source Effectiveness | Marketing/HR | Monthly |
| Store Fulfillment Summary | AM / Operations | Weekly |
| TA Performance Scorecard | HR Manager | Monthly |
| Cost Per Hire | Finance | Monthly |
| Time-to-Hire by Position | HR | Monthly |
| No-Show / Drop-off Analysis | HR | Monthly |

### 11.2 KPI Definitions
| KPI | Formula | Target |
|-----|---------|--------|
| Time-to-Hire | Days from request approval to onboarding accepted | ≤ 14 days |
| Offer Acceptance Rate | Offers accepted / Offers sent | ≥ 80% |
| Interview Pass Rate | Interviews passed / Interviews conducted | ≥ 40% |
| Source Quality Score | Hires / Applications by source | Varies by source |
| SLA Compliance | Candidates within SLA / Total candidates | ≥ 90% |
| Cost Per Hire | Total recruitment cost / Hires | ≤ $X |
| Store Fulfillment Rate | Filled positions / Requested positions | ≥ 95% |
| Candidate Experience | Survey score post-onboarding | ≥ 4.0/5 |

---

## 12. Notification System Recommendations

### 12.1 Notification Types
| Event | Recipients | Channel | Actionable |
|-------|-----------|---------|------------|
| New proposal submitted | AM, HR | In-app + Email | Review proposal |
| Proposal approved | SM, assigned Recruiter | In-app + SMS | Create campaign |
| Candidate SLA breach | PIC, HR Manager | In-app + Email | Review candidate |
| Interview scheduled | Interviewer, Candidate | Email + SMS | View details |
| Offer accepted | SM, HR | In-app + Email | Prepare onboarding |
| Offer expiring (24h) | Candidate, Recruiter | SMS + Email | Respond to offer |
| Campaign 80% fulfilled | HR, AM | In-app | Plan next request |
| Blacklist match | Recruiter | In-app | Review application |

### 12.2 Notification Center UI
```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Thông báo (3 chưa đọc)                                   │
├─────────────────────────────────────────────────────────────┤
│ 🔴 Ứng viên Nguyễn Văn A vượt SLA 48h — 5 phút trước       │
│    [Xem chi tiết]                                           │
├─────────────────────────────────────────────────────────────┤
│ 🟡 Đề xuất Store 005 chờ duyệt — 2 giờ trước               │
│    [Duyệt ngay]                                             │
├─────────────────────────────────────────────────────────────┤
│ 🟢 Offer letter được chấp nhận — 1 ngày trước              │
│    [Xem offer]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Enterprise-Level Improvement Suggestions

### 13.1 Scalability
- **Database indexing**: Add composite indexes on `(candidateId, statusId, createdAt)`, `(proposalId, status)`, `(campaignId, isActive)`
- **Read replicas**: Dashboard queries and reports should use read replicas
- **Caching**: Redis cache for store lists, position lists, status configurations
- **Async processing**: Status transitions, SLA checks, and notification sends via message queue (Bull/Redis)

### 13.2 Data Integrity
- **Soft deletes**: All entities should use `deletedAt` instead of hard delete
- **Immutable audit logs**: Audit logs should be append-only, no update/delete
- **Data retention**: Auto-archive candidates > 2 years old to cold storage
- **Backup strategy**: Daily automated backups with point-in-time recovery

### 13.3 Compliance & Security
- **PII encryption**: Phone, email, CCCD should be encrypted at rest
- **Access logging**: Log all API access with IP, user agent, timestamp
- **GDPR compliance**: Right to be forgotten, data export, consent tracking
- **Role-based data masking**: SM sees only their store's data; recruiters see only assigned candidates

### 13.4 Integration Readiness
- **Webhook system**: Allow external systems to subscribe to events (candidate hired, offer accepted)
- **API versioning**: `/api/v1/`, `/api/v2/` for backward compatibility
- **SSO integration**: SAML/OAuth2 for enterprise identity providers
- **HRIS sync**: Bidirectional sync with payroll system (employee creation on onboarding)

### 13.5 Mobile Readiness
- **Responsive design**: All dashboards and lists must work on tablet (SM/AM field use)
- **PWA support**: Offline access to candidate lists, sync when online
- **Push notifications**: For SLA breaches and interview reminders

### 13.6 AI/ML Opportunities (Future)
- **Resume parsing**: Auto-extract skills, experience from CV uploads
- **Candidate scoring**: ML model to predict likelihood of acceptance based on profile
- **Source recommendation**: Suggest best sourcing channel based on position and location
- **Churn prediction**: Predict which candidates are likely to no-show
- **Optimal offer prediction**: Recommend salary range based on market data and candidate profile

---

## Implementation Priority Matrix

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Status transition engine + audit log | M | Critical |
| P0 | SLA tracking + breach alerts | M | Critical |
| P0 | Enhanced proposal workflow | M | Critical |
| P1 | Campaign fulfillment tracking | S | High |
| P1 | Permission matrix (RBAC v2) | M | High |
| P1 | Dashboard operational alerts | S | High |
| P2 | Offer management module | M | Medium |
| P2 | Communication log | S | Medium |
| P2 | Blacklist system | S | Medium |
| P3 | Notification center | M | Medium |
| P3 | Advanced reports & exports | L | Medium |
| P3 | Mobile PWA | L | Low |

---

*End of Analysis Document*

