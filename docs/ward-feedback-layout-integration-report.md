# Ward Feedback Layout Integration Report

## Actual Route/Layout Structure Found

- `/ward` is defined by `Sources/Frontend/src/routes/_auth.ward.tsx`.
- That route is a thin TanStack Router wrapper and renders `WardDashboard`.
- `Sources/Frontend/src/features/ward/WardDashboard.tsx` owns the ward staff dashboard shell: fixed sidebar, top header, notification/user menus, and main content area.
- Before this change, the sidebar item `Phản ánh` used a `Link` to `/feedback-search`, which remounted a separate page outside the ward dashboard shell.
- The overview dashboard content is the existing JSX inside `WardDashboard` under the main `<main>` content area.

## Files Modified

- `Sources/Frontend/src/features/ward/WardDashboard.tsx`
- `Sources/Frontend/src/features/ward/WardFeedbackManagementPage.tsx`
- `Sources/Frontend/src/routes/feedback-search.tsx`
- `docs/ward-feedback-layout-integration-report.md`

## Components Reused

- Reused the existing ward dashboard sidebar/header shell in `WardDashboard`.
- Reused existing TanStack Query hooks: `useFeedbacks`, `useCategories`.
- Reused existing APIs from `feedbackApi` and `wardApi`.
- Reused `FeedbackDetailModal` for real backend detail viewing.
- Reused `/feedback-search` public lookup behavior for normal/public users.

## How Sidebar Switching Works

- `WardDashboard` now tracks an internal section state:
  - `overview`
  - `feedback`
  - `campaign`
  - `schedule`
  - `config`
- Sidebar items are buttons, not route links, so clicking `Phản ánh` does not leave the dashboard layout.
- The selected section is mirrored into the URL as `/ward?tab=feedback`.
- `overview` keeps the existing overview dashboard content.
- `feedback` renders `WardFeedbackManagementPage` inside the existing main content area.
- Other sections currently render internal placeholders inside the same shell, ready for fuller section components.

## APIs Connected

- Feedback rows and backend pagination: `GET /api/feedbacks/my`
- Tab counts: `GET /api/feedbacks/my/stats`
- Detail modal: `GET /api/feedbacks/{id}`
- Categories: `GET /api/categories`
- Ward list where applicable: `GET /api/wards`

## Data And Role Behavior

- `WARD_STAFF` uses authenticated backend data only.
- Ward filter is pre-selected from the logged-in user ward and disabled.
- Managed categories are scoped to:
  - `URBAN_INFRASTRUCTURE` - Hạ tầng đô thị
  - `ENVIRONMENT` - Môi trường
  - `CONSTRUCTION` - Xây dựng
- Table rows, filters, tabs, counts, pagination, refresh, and detail modal use real backend data.
- Public `/feedback-search` behavior remains for normal/public users.

## Manual Test Checklist

- Log in as `WARD_STAFF` and open `/ward`.
- Confirm overview still renders by default.
- Click sidebar `Phản ánh`; confirm URL becomes `/ward?tab=feedback`.
- Confirm sidebar and top header remain visible and are not duplicated.
- Confirm the main content changes to the feedback management UI.
- Confirm title, subtitle, filter card, status tabs, feedback table, pagination, and refresh button are present.
- Confirm ward dropdown is pre-selected and disabled.
- Test search/status/category/priority/date filters and confirm backend data refreshes.
- Test status tabs and confirm counts/rows update from backend.
- Test rows-per-page and pagination buttons.
- Open a row detail modal and confirm it loads via `/api/feedbacks/{id}`.
- Open `/feedback-search` as a public/normal user and confirm public citizen search still works.
- Confirm `/city-admin`, `/login`, and `/authority-login` still load.
