# Feedback Page UI Sync Report

## Actual Route Used By Sidebar "Phan anh"

- `Sources/Frontend/src/features/ward/WardDashboard.tsx` defines the ward officer sidebar item `Phan anh`.
- That item navigates to `/feedback-search` with `wardId` and managed category query params.
- `Sources/Frontend/src/routes/feedback-search.tsx` is therefore the actual route rendered when `WARD_STAFF` clicks the sidebar item.
- `Sources/Frontend/src/features/city-admin/CityAdminDashboard.tsx` renders `FeedbacksPage` only inside the city-admin dashboard tab, not the ward sidebar route.

## Files Modified

- `Sources/Frontend/src/routes/feedback-search.tsx`
- `Sources/Frontend/src/lib/api.ts`
- `Sources/Frontend/src/features/city-admin/pages/FeedbackDetailModal.tsx`
- `docs/feedback-page-ui-sync-report.md`

## Components Reused

- `FeedbackDetailModal` is reused for officer/admin row detail viewing.
- Existing React Query feedback/category hooks are reused: `useFeedbacks`, `useCategories`, `useFeedbackStatuses`, public hooks for the citizen lookup branch.
- Existing `wardApi.getAll()` is reused for the `SUPER_ADMIN` ward dropdown.

## APIs Used

- Officer list: `GET /api/feedbacks/my`
- Officer tab counts: `GET /api/feedbacks/my/stats`
- Detail modal: `GET /api/feedbacks/{id}`
- Categories: `GET /api/categories`
- Wards: `GET /api/wards`
- Public citizen search branch remains on `GET /api/feedbacks/public` and `GET /api/feedbacks/public/stats`.

## UI Changed

- `/feedback-search` now renders an officer management interface for authenticated `WARD_STAFF` and `SUPER_ADMIN` users.
- Added page title `Phản ánh` and subtitle `Quản lý, tiếp nhận và xử lý phản ánh của người dân trong địa bàn`.
- Added filter card with search, status, category, priority, from date, to date, ward, reset, and search controls.
- Added status tabs: `Tất cả`, `Chờ xử lý`, `Đang xử lý`, `Đã xử lý`, `Đã từ chối`.
- Added feedback table columns for code, content, sender, location, category, priority, status, submitted time, and action.
- Added rows-per-page control, total count text, and page buttons.

## Data Synchronized

- Table rows come from authenticated backend feedback pages.
- Pagination uses backend `totalElements`, `totalPages`, and current page content.
- Tab counts come from backend stats for the current non-status filters.
- Category options come from backend categories plus official category labels.
- Ward options for `SUPER_ADMIN` come from backend wards.
- Detail modal uses backend feedback detail data only.

## Role-Based Behavior

- `WARD_STAFF` is scoped to their `wardId`.
- `WARD_STAFF` category scope is kept to `URBAN_INFRASTRUCTURE`, `ENVIRONMENT`, and `CONSTRUCTION`; backend ward queries already enforce these managed categories.
- `WARD_STAFF` ward dropdown is pre-selected and disabled.
- `SUPER_ADMIN` can choose all wards from the ward dropdown.
- Public/citizen search remains unchanged for unauthenticated users.

## Manual Test Checklist

- Log in as `WARD_STAFF`, open sidebar item `Phản ánh`, verify `/feedback-search` shows the management table UI.
- Verify title/subtitle, filter card, tabs, table columns, and pagination controls are visible.
- Verify ward dropdown is pre-selected to the officer ward and disabled.
- Search by tracking code/content/address/sender and confirm rows and counts refresh from backend.
- Filter by status, category, priority, from date, to date, and confirm pagination resets to page 1.
- Click each status tab and confirm table rows update.
- Change rows per page and page buttons and confirm backend pagination updates.
- Open a row detail modal and confirm it calls `/api/feedbacks/{id}` without a 403 from the old citizen endpoint.
- Log in as `SUPER_ADMIN`, open `/feedback-search`, verify ward dropdown is enabled and populated.
- Verify public unauthenticated `/feedback-search` still shows citizen lookup UI.
