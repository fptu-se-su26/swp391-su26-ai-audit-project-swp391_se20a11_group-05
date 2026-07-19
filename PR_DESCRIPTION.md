# Pull Request Checklist

## 1. Description

Describe the changes made in this Pull Request.

```text
Triển khai module Chiến dịch cộng đồng - tích hợp đầy đủ Frontend + Backend:

Frontend:
- campaignStore.ts: lớp state dùng chung qua localStorage (dữ liệu seed + người dùng tạo mới)
- useCampaigns.ts: React hooks (useCampaignList, useCampaignDetail, useCreateCampaign)
- campaigns.index.tsx: trang danh sách chiến dịch đọc dữ liệu từ store thay vì hardcode
- campaigns.$id.tsx: trang chi tiết đọc đúng dữ liệu theo params.id, đồng bộ bình luận riêng theo từng chiến dịch
- my-reports.$id.tsx: tạo chiến dịch từ trang chi tiết phản ánh, lưu linkedCampaign vào localStorage theo feedbackId

Backend:
- CampaignRepository, CampaignParticipantRepository
- CampaignRequest/Response DTOs
- CampaignService + CampaignServiceImpl (tạo, tham gia, rời khỏi chiến dịch)
- Thêm kiểu campaignApi vào frontend api.ts

Đã merge code mới nhất từ nhánh origin/Product.
```

---

## 2. Type of Change

- [ ] Requirement
- [ ] Design
- [ ] Database
- [x] Frontend
- [x] Backend
- [ ] Testing
- [ ] Debug
- [ ] Report
- [ ] Documentation
- [ ] Other

---

## 3. Related Issue

Link the related issue/task:

```text
Module Chiến dịch cộng đồng - tạo/xem/tham gia chiến dịch liên kết với phản ánh của người dân
```

---

## 4. AI Usage Declaration

Did you use AI in this Pull Request?

- [x] Yes
- [ ] No

If yes, have you updated the following files?

- [x] `docs/AI_AUDIT_LOG.md`
- [x] `docs/PROMPTS.md`
- [x] `docs/CHANGELOG.md`
- [ ] `docs/REFLECTION.md` if needed

---

## 5. Main AI Prompt or Support

Summarize the main prompt or AI support used.

```text
Sử dụng Kiro AI để triển khai module chiến dịch:
- Thiết kế campaignStore với pattern localStorage + seed data
- Triển khai hooks useCampaigns với fallback về local store
- Đồng bộ dữ liệu chiến dịch giữa 3 trang (danh sách, chi tiết, my-reports)
- Sửa lỗi cấu trúc JSX trong campaigns.$id.tsx
- Thêm lưu bình luận riêng theo từng chiến dịch bằng localStorage
- Thay thế toàn bộ dữ liệu hardcode bằng dữ liệu thật từ store
- Backend: CampaignService CRUD với logic tham gia/rời khỏi chiến dịch
```

---

## 6. Verification

How did you verify the result?

- [x] Ran the program
- [x] Checked output
- [ ] Wrote or ran test cases
- [x] Reviewed code
- [ ] Compared with assignment requirements
- [ ] Other

Short explanation:

```text
Chạy frontend dev server (npm run dev) và backend Spring Boot trên cổng 8081.
Kiểm tra toàn bộ luồng: tạo chiến dịch từ trang chi tiết phản ánh → chiến dịch
hiển thị trong trang danh sách → trang chi tiết hiển thị đúng tên/trạng thái/dữ liệu.
Bình luận vẫn còn sau khi refresh trang. Badge trạng thái phản ánh đúng trạng thái chiến dịch.
```

---

## 7. Evidence

- Screenshot: Kiểm tra tại localhost:5173
- Test result: Chạy thành công, không có lỗi build
- Related files:
  - `Sources/Frontend/src/lib/campaignStore.ts`
  - `Sources/Frontend/src/hooks/useCampaigns.ts`
  - `Sources/Frontend/src/routes/campaigns.index.tsx`
  - `Sources/Frontend/src/routes/campaigns.$id.tsx`
  - `Sources/Frontend/src/routes/my-reports.$id.tsx`
  - `Sources/Backend/src/main/java/.../modules/campaign/`
- Commit:
  - `[DE190182] feat: implement Campaign CRUD backend`
  - `[DE190182] feat: add campaignStore with localStorage persistence and useCampaigns hooks`
  - `[DE190182] feat: sync campaign data across all pages`
  - `[DE190182] chore: update Header component and auto-generated routeTree`
- Demo link: http://localhost:5173/campaigns

---

## 8. Checklist Before Merge

- [x] Code runs successfully
- [x] No critical build errors
- [x] Changelog updated
- [x] AI Audit Log updated if AI was used
- [x] Team member can explain this change
