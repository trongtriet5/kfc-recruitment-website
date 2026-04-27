# Recruitment System - Business Logic Rules

Tài liệu này tổng hợp tất cả các quy tắc, ràng buộc và logic nghiệp vụ của hệ thống tuyển dụng KFC.

---

## 1. User Roles & Permissions

### 1.1 Role Definitions

| Role | Label | Mô tả |
|------|-------|-------|
| ADMIN | Quản trị viên | Toàn quyền hệ thống |
| HEAD_OF_DEPARTMENT | Trưởng phòng | Quản lý cấp cao, duyệt proposal |
| RECRUITER | Nhân viên tuyển dụng | Xử lý ứng viên, phỏng vấn |
| MANAGER | Quản lý khu vực (AM) | Quản lý nhiều cửa hàng |
| USER | Quản lý cửa hàng (SM) | Quản lý 1 cửa hàng |

### 1.2 Store Access Hierarchy

```
ADMIN ──────────────────────────────────────────> All Stores
  │
HEAD_OF_DEPARTMENT ────────────────────────────> All Stores
  │
RECRUITER ─────────────────────────────────────> All Stores
  │
MANAGER (AM) ──────────────────────────────────> Managed Stores (amId)
  │
USER (SM) ─────────────────────────────────────> Managed Store (smId)
```

---

## 2. Proposal (Đề xuất tuyển dụng)

### 2.1 Proposal Status Flow

```
DRAFT ──[SUBMIT]──> SUBMITTED ──[REVIEW]──> AM_REVIEWED ──[HR_ACCEPT]──> HR_ACCEPTED ──[APPROVE]──> APPROVED
   │                  │                    │
   │                  └─[REJECT]──> REJECTED
   │
   └─[CANCEL]──> CANCELLED
```

### 2.2 Proposal Status Details

| Status | Mô tả | Ai có thể chuyển |
|--------|-------|------------------|
| DRAFT | Bản nháp | USER, MANAGER, ADMIN |
| SUBMITTED | Chờ duyệt | USER, MANAGER, ADMIN |
| AM_REVIEWED | AM đã duyệt | MANAGER, ADMIN |
| HR_ACCEPTED | HR chấp nhận | HEAD_OF_DEPARTMENT, ADMIN |
| APPROVED | Đã duyệt | MANAGER, ADMIN |
| REJECTED | Từ chối | MANAGER, ADMIN |
| CANCELLED | Hủy | USER, MANAGER, ADMIN |

### 2.3 Proposal Creation Rules

1. **Auto-assign store**: Khi SM/AM tạo proposal, storeId được gán tự động từ cửa hàng mà họ quản lý
2. **No duplicates**: Không được tạo proposal trùng store + position khi có proposal đang ACTIVE (DRAFT, SUBMITTED, AM_REVIEWED, HR_ACCEPTED, APPROVED)
3. **Quantity constraint**: Số lượng yêu cầu (quantity) phải >= 1

### 2.4 Proposal Access Rules

| Role | Quyền xem | Quyền sửa | Quyền xóa |
|------|-----------|-----------|-----------|
| USER | Proposal của chính mình | Chỉ proposal của mình, trạng thái DRAFT | Chỉ proposal của mình, trạng thái DRAFT |
| MANAGER | Proposal thuộc store mình quản lý | Proposal thuộc store mình quản lý | Proposal thuộc store mình quản lý |
| ADMIN/HEAD_OF_DEPARTMENT | Tất cả | Tất cả | Tất cả |

### 2.5 Proposal Approval Workflow

```
SM tạo proposal:
  DRAFT → SUBMITTED → AM_REVIEWED → APPROVED
  (Bước AM_REVIEWED bắt buộc)

AM/MANAGER tạo proposal:
  DRAFT → SUBMITTED → APPROVED
  (Bỏ qua AM_REVIEWED, đi thẳng đến APPROVED)

Luồng duyệt:
  1. SM submit: DRAFT → SUBMITTED
  2. AM review: SUBMITTED → AM_REVIEWED
  3. HR accept: AM_REVIEWED → HR_ACCEPTED (HEAD_OF_DEPARTMENT)
  4. Admin approve: HR_ACCEPTED → APPROVED (ADMIN)
```

---

## 3. Campaign (Chiến dịch tuyển dụng)

### 3.1 Campaign Creation Rules

1. **Proposal prerequisite**: Chỉ tạo campaign từ proposal có trạng thái `APPROVED`
2. **One-to-one**: Mỗi proposal chỉ có một campaign (`proposal.campaignId` là unique)
3. **Headcount check**: Số lượng tuyển trong proposal không được vượt quá headcount còn lại của cửa hàng
4. **Auto-fill dates**:
   - Nếu `isUntilFilled = true`: Ngày bắt đầu = hôm nay, không có ngày kết thúc
   - Nếu `isUntilFilled = false`: Lấy ngày từ proposal

### 3.2 Campaign Status

| Status | Mô tả |
|--------|-------|
| ACTIVE | Đang tuyển |
| PAUSED | Tạm dừng |
| COMPLETED | Hoàn thành |
| CANCELLED | Hủy |

### 3.3 Candidate Assignment to Campaign

- Chỉ được chuyển ứng viên vào campaign có trạng thái `ACTIVE`

---

## 4. Candidate (Ứng viên)

### 4.1 Candidate Access Rules (READ)

| Role | Điều kiện xem ứng viên |
|------|------------------------|
| ADMIN | Tất cả ứng viên |
| HEAD_OF_DEPARTMENT/RECRUITER | Tất cả ứng viên |
| MANAGER (AM) | Ứng viên thuộc store mình quản lý |
| USER (SM) | Ứng viên thỏa mãn **OR** điều kiện:<br>- Được gán làm PIC (picId = user.id)<br>- Thuộc store mình quản lý<br>- Thuộc campaign từ proposal mình tạo |

### 4.2 Candidate Access Rules (WRITE/UPDATE)

| Role | Điều kiện thao tác |
|------|-------------------|
| ADMIN | Tất cả |
| HEAD_OF_DEPARTMENT/RECRUITER | Tất cả |
| MANAGER (AM) | Ứng viên thuộc store mình quản lý |
| USER (SM) | Ứng viên thỏa mãn **OR**:<br>- Được gán làm PIC<br>- Thuộc store mình quản lý<br>- Thuộc campaign từ proposal mình tạo |

### 4.3 Candidate Creation Rules

1. **Blacklist check**: Kiểm tra ứng viên có trong blacklist không (theo phone/email)
2. **Duplicate phone**: Không được trùng số điện thoại trong cùng một cửa hàng

### 4.4 PIC (Person In Charge) Assignment

- Ứng viên có thể được gán cho một người phụ trách (Recruiter)
- PIC có thể xem và thao tác với ứng viên được gán

---

## 5. Interview (Phỏng vấn)

### 5.1 Interview Creation

- Khi tạo lịch phỏng vấn, cần chỉ định `interviewerId` (người phỏng vấn)
- Interviewer có thể cập nhật kết quả phỏng vấn

### 5.2 Interview Results by Role

| Role | Kết quả được phép |
|------|-------------------|
| ADMIN/HEAD_OF_DEPARTMENT/RECRUITER | PASSED, FAILED, PENDING |
| MANAGER (AM) | SM_AM_PASSED, SM_AM_FAILED, SM_AM_NO_SHOW, OM_PV_PASSED, OM_PV_FAILED, OM_PV_NO_SHOW |
| USER (SM) | SM_AM_PASSED, SM_AM_FAILED, SM_AM_NO_SHOW |

---

## 6. Candidate Status Transitions

### 6.1 Status Flow

```
                    ┌─[HR]──> CV_FAILED ──────────────┐
                    │                                 │
CV_FILTERING ──[HR]─> CV_PASSED ──[HR]──> WAITING_INTERVIEW ──[HR]─> HR_INTERVIEW_PASSED ──┬─[AM/SM]─> SM_AM_INTERVIEW_PASSED ──[AM]─> OM_PV_INTERVIEW_PASSED ──[HR]─> OFFER_SENT ──[HR]─> OFFER_ACCEPTED ──[HR]─> WAITING_ONBOARDING ──[ALL]─> ONBOARDING_ACCEPTED
                         │                                │                              │                              │                              │
                         │                                │                              │                              │                              └─[HR]─> ONBOARDING_REJECTED
                         │                                │                              │                              │
                         │                                │                              │                              └─[AM]─> OM_PV_INTERVIEW_FAILED
                         │                                │                              │
                         │                                │                              ├���[AM/SM]─> SM_AM_INTERVIEW_FAILED
                         │                                │                              │
                         │                                │                              ├─[ALL]─> SM_AM_NO_SHOW
                         │                                │                              │
                         │                                ├─[HR]──> HR_INTERVIEW_FAILED
                         │                                │
                         ├─[HR]──> BLACKLIST
                         │
                         ├─[HR]──> CANNOT_CONTACT
                         │
                         └─[HR]──> AREA_NOT_RECRUITING
```

### 6.2 Status Groups

| Group | Statuses |
|-------|----------|
| application | CV_FILTERING, CV_PASSED, CV_FAILED, BLACKLIST, CANNOT_CONTACT, AREA_NOT_RECRUITING |
| interview | WAITING_INTERVIEW, HR_INTERVIEW_PASSED, HR_INTERVIEW_FAILED, SM_AM_INTERVIEW_PASSED, SM_AM_INTERVIEW_FAILED, SM_AM_NO_SHOW, OM_PV_INTERVIEW_PASSED, OM_PV_INTERVIEW_FAILED, OM_PV_NO_SHOW |
| offer | OFFER_SENT, OFFER_ACCEPTED, OFFER_REJECTED |
| onboarding | WAITING_ONBOARDING, ONBOARDING_ACCEPTED, ONBOARDING_REJECTED |

### 6.3 Role-based Status Update Permissions

| Status | Ai có thể cập nhật |
|--------|-------------------|
| CV_FILTERING → CV_PASSED/FAILED | ADMIN, HEAD_OF_DEPARTMENT, RECRUITER |
| CV_PASSED → WAITING_INTERVIEW | ADMIN, HEAD_OF_DEPARTMENT, RECRUITER |
| HR_INTERVIEW_PASSED → SM_AM_* | ADMIN, HEAD_OF_DEPARTMENT, MANAGER, USER |
| SM_AM_INTERVIEW_PASSED → OM_PV_* | ADMIN, HEAD_OF_DEPARTMENT, MANAGER |
| OM_PV_INTERVIEW_PASSED → OFFER_SENT | ADMIN, HEAD_OF_DEPARTMENT, RECRUITER |
| OFFER_SENT → OFFER_ACCEPTED/REJECTED | ADMIN, HEAD_OF_DEPARTMENT, RECRUITER |
| ONBOARDING_ACCEPTED | Tất cả roles |

### 6.4 Terminal Statuses (Không thể chuyển tiếp)

- BLACKLIST
- CV_FAILED
- HR_INTERVIEW_FAILED
- SM_AM_INTERVIEW_FAILED
- OM_PV_INTERVIEW_FAILED
- OFFER_REJECTED
- ONBOARDING_REJECTED

---

## 7. Blacklist Rules

- Ứng viên bị blacklist sẽ bị chặn khi tạo mới
- Blacklist có thể là vĩnh viễn (isPermanent) hoặc có thời hạn (expiryDate)
- Lý do blacklist: NO_SHOW, FAKE_INFO, VIOLATION, OTHER

---

## 8. SLA (Service Level Agreement)

- Mỗi candidate status có SLA hours riêng (slaHours trong CandidateStatus)
- Khi ứng viên vào status mới, hệ thống tự động tính slaDueDate
- Tracking qua CandidateSLALog

---

## 9. Key Database Relationships

```
User (smId) ──────< Store
User (amId) ──────< Store
User (picId) ─────< Candidate
User (requestedById) ──< RecruitmentProposal ──< Campaign ──< Candidate
User (interviewerId) ─< Interview ──< Candidate
```

---

## 10. Quick Reference Summary

### Ai có thể làm gì:

| Tác vụ | ADMIN | HEAD_OF_DEPT | RECRUITER | MANAGER | USER |
|--------|-------|--------------|-----------|---------|------|
| Tạo Proposal | ✓ | ✓ | ✗ | ✓ | ✓ |
| Duyệt Proposal | ✓ | ✓ | ✗ | ✓ | ✗ |
| Tạo Campaign | ✓ | ✓ | ✓ | ✓ | ✓ |
| Xem Candidate | All | All | All | Store của AM | PIC + Store SM + Proposal của mình |
| Tạo Candidate | ✓ | ✓ | ✓ | ✓ | ✗ |
| Cập nhật Candidate | All | All | All | Store của AM | PIC + Store SM + Proposal của mình |
| Gán PIC | ✓ | ✓ | ✓ | ✗ | ✗ |
| Tạo Interview | ✓ | ✓ | ✓ | ✓ | ✗ |
| Cập nhật Interview | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 11. Important Implementation Notes

1. **Recruiter** trong hệ thống này là role RECRUITER - chịu trách nhiệm xử lý ứng viên
2. **SM** (USER) có thể tạo proposal và xem ứng viên trong campaign từ proposal của mình
3. Khi AM review proposal của SM, proposal chuyển sang AM_REVIEWED
4. Khi Admin duyệt proposal, headcount được reserve (giữ định biên)
5. Candidate được assign vào campaign → có thể trace về proposal qua campaign.proposalId
6. Interviewer chỉ được gán khi tạo interview, không lưu relationship vĩnh viễn vào Candidate