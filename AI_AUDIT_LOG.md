# AI Audit Log

Đây là nhật ký chính về việc sử dụng AI.
File này ghi lại toàn bộ quá trình sinh viên dùng ChatGPT, Gemini, Copilot, Claude… trong dự án.

## Log #01
- Date: 2026-05-17
- Author: Trong (DE190357)
- AI Tool: ChatGPT
- Purpose: Generate the initial React layout for the Police Dashboard
- Prompt Reference: PROMPTS.md#prompt-01
- AI Output Summary: Provided a responsive grid layout using TailwindCSS for sidebar, header, and main content area.
- Human Decision: Adjusted the grid columns to ensure the sidebar collapses properly on mobile devices.
- Applied To: `PoliceDashboardLayout.tsx`
- Verification: Tested the layout responsiveness on Chrome DevTools.

## Log #02
- Date: 2026-05-19
- Author: Trong (DE190357)
- AI Tool: Copilot
- Purpose: Create a reusable Sidebar component for police modules
- Prompt Reference: PROMPTS.md#prompt-02
- AI Output Summary: Generated a functional sidebar with hover effects and React Router `Link` components.
- Human Decision: Replaced generic icons with specific Lucide-React icons tailored for police features.
- Applied To: `Sidebar.tsx`
- Verification: Hover states and active route highlighting worked as expected.

## Log #03
- Date: 2026-05-22
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Implement protected routing for Police Dashboard
- Prompt Reference: PROMPTS.md#prompt-03
- AI Output Summary: Provided a `ProtectedRoute` wrapper component checking user roles from Context.
- Human Decision: Added an unauthorized redirect to an "Access Denied" page instead of just the login screen.
- Applied To: `DashboardRouter.tsx`, `ProtectedRoute.tsx`
- Verification: Successfully blocked CITIZEN accounts from accessing Police routes.

## Log #04
- Date: 2026-05-25
- Author: Trong (DE190357)
- AI Tool: ChatGPT
- Purpose: Design Police Profile dropdown in the header
- Prompt Reference: PROMPTS.md#prompt-04
- AI Output Summary: Generated a Tailwind dropdown menu toggled by clicking the user avatar.
- Human Decision: Added logic to fetch and display the officer's actual name from the global Auth context.
- Applied To: `HeaderProfile.tsx`
- Verification: Dropdown opened correctly and displayed accurate mock data.

## Log #05
- Date: 2026-05-27
- Author: Trong (DE190357)
- AI Tool: Copilot
- Purpose: Build Statistics cards for Police Overview
- Prompt Reference: PROMPTS.md#prompt-05
- AI Output Summary: Created reusable card components displaying large numbers and descriptive text.
- Human Decision: Added subtle CSS shadow and transition effects to make the cards look more modern.
- Applied To: `StatCard.tsx`, `PoliceOverview.tsx`
- Verification: Cards rendered perfectly within the dashboard grid layout.

## Log #06
- Date: 2026-05-30
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Fetch police statistics from backend
- Prompt Reference: PROMPTS.md#prompt-06
- AI Output Summary: Provided an Axios service file and a `useEffect` hook to load data on component mount.
- Human Decision: Integrated a skeleton loading state to improve UX while waiting for API responses.
- Applied To: `apiService.ts`, `PoliceOverview.tsx`
- Verification: Skeleton loaders appeared, followed by actual data fetched from the API.

## Log #07
- Date: 2026-06-02
- Author: Trong (DE190357)
- AI Tool: Claude
- Purpose: Setup basic Incident Map for Police
- Prompt Reference: PROMPTS.md#prompt-07
- AI Output Summary: Delivered React-Leaflet configuration and MapContainer component.
- Human Decision: Centered the map coordinates statically on the city and disabled zooming out too far.
- Applied To: `IncidentMap.tsx`
- Verification: Map tiles loaded and custom markers displayed at specific mock coordinates.

## Log #08
- Date: 2026-06-05
- Author: Trong (DE190357)
- AI Tool: ChatGPT
- Purpose: Add heatmap layer to Incident Map
- Prompt Reference: PROMPTS.md#prompt-08
- AI Output Summary: Suggested using `leaflet.heat` plugin and provided a wrapper component for React.
- Human Decision: Tweaked the heatmap radius and blur parameters for better visual clarity.
- Applied To: `HeatmapLayer.tsx`
- Verification: Heatmap rendered correctly, highlighting clustered incident data.

## Log #09
- Date: 2026-06-08
- Author: Trong (DE190357)
- AI Tool: Copilot
- Purpose: Design Police Feedback Management table
- Prompt Reference: PROMPTS.md#prompt-09
- AI Output Summary: Generated a responsive table with Tailwind styling and styled headers.
- Human Decision: Added a 'View Details' action button column at the end of the table.
- Applied To: `FeedbackTable.tsx`
- Verification: Table rendered beautifully and scaled properly on smaller screens.

## Log #10
- Date: 2026-06-10
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Fetch and populate Feedback data
- Prompt Reference: PROMPTS.md#prompt-10
- AI Output Summary: Provided a custom hook `useFeedbacks` handling the data fetching logic.
- Human Decision: Added pagination logic to handle large datasets effectively on the frontend.
- Applied To: `useFeedbacks.ts`, `FeedbackTable.tsx`
- Verification: Data successfully populated the table rows based on API responses.

## Log #11
- Date: 2026-06-13
- Author: Trong (DE190357)
- AI Tool: ChatGPT
- Purpose: Feedback status update Modal
- Prompt Reference: PROMPTS.md#prompt-11
- AI Output Summary: Created a modal component and Axios PUT request logic to change status.
- Human Decision: Added a confirmation dialog before sending the update request to prevent accidental clicks.
- Applied To: `StatusUpdateModal.tsx`
- Verification: Status changed successfully in the UI and persisted to the backend.

## Log #12
- Date: 2026-06-16
- Author: Trong (DE190357)
- AI Tool: Claude
- Purpose: Police Campaign Grid UI
- Prompt Reference: PROMPTS.md#prompt-12
- AI Output Summary: Generated CSS Grid layout for campaign cards and a progress bar component.
- Human Decision: Adjusted the progress bar colors to change from green to red as campaigns fill up.
- Applied To: `CampaignGrid.tsx`, `CampaignCard.tsx`
- Verification: Campaign cards displayed dynamically based on the mock array.

## Log #13
- Date: 2026-06-19
- Author: Trong (DE190357)
- AI Tool: Copilot
- Purpose: Real-time WebSocket notifications setup
- Prompt Reference: PROMPTS.md#prompt-19
- AI Output Summary: Provided a React context using STOMP client to listen for WebSocket events.
- Human Decision: Added a toast notification library (`react-toastify`) to display the alerts globally.
- Applied To: `WebSocketContext.tsx`, `App.tsx`
- Verification: Toast notification appeared when a mock notification event was triggered.

## Log #14
- Date: 2026-06-24
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Modernize Police Dashboard UI
- Prompt Reference: PROMPTS.md#prompt-13
- AI Output Summary: Suggested a 5-module sidebar layout and provided CSS for an animated waving Vietnamese flag.
- Human Decision: Integrated the sidebar structure but adjusted the CSS animation timing and colors to better match the existing theme.
- Applied To: `Sidebar.tsx`, `flag.css`
- Verification: Tested responsiveness across different screen sizes and verified routing.

## Log #15
- Date: 2026-06-24
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Secure Map Provider Settings (Google Maps)
- Prompt Reference: PROMPTS.md#prompt-14
- AI Output Summary: Provided React component code using `@react-google-maps/api` with secure API key loading.
- Human Decision: Implemented the suggested code and added environment variable restrictions for the API key.
- Applied To: `CampaignMap.tsx`, `.env`
- Verification: Rendered the map successfully and confirmed markers/hotspots align with backend coordinates.

## Log #16
- Date: 2026-06-25
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Manage Feedback Dashboard UI display and sorting
- Prompt Reference: PROMPTS.md#prompt-15
- AI Output Summary: Generated a UI layout for the feedback list with chronological sorting logic and conditional status badges.
- Human Decision: Adopted the sorting logic but refactored the status badges to use the project's pre-defined Tailwind utility classes.
- Applied To: `_auth.authority.feedback.tsx`, `FeedbackController.java`
- Verification: Submitted new feedback and verified it appeared at the top of the list with the correct 'Pending' badge.

## Log #17
- Date: 2026-06-26
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Fix Map Initialization Error collision
- Prompt Reference: PROMPTS.md#prompt-16
- AI Output Summary: Identified the naming collision between the Lucide-React `Map` icon and JS `Map` constructor, suggesting an alias import.
- Human Decision: Applied the import alias and added a fallback connection error boundary as an extra precaution.
- Applied To: `HeatmapMap.tsx`
- Verification: Restarted the development server and confirmed the dashboard loads without map initialization errors.

## Log #18
- Date: 2026-06-27
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Refine Police Campaign Management and Group Chat
- Prompt Reference: PROMPTS.md#prompt-17
- AI Output Summary: Supplied React hooks for WebSockets chat updates for the campaign group chat feature.
- Human Decision: Integrated the chat hook with the WebSocket context and ensured UI auto-scrolls to new messages.
- Applied To: `campaigns.$id.tsx`, `campaigns.$id.group-chat.tsx`
- Verification: Tested with two active user accounts joining a campaign and communicating successfully via chat.

## Log #19
- Date: 2026-06-29
- Author: Trong (DE190357)
- AI Tool: Gemini
- Purpose: Build Police Duty Roster System
- Prompt Reference: PROMPTS.md#prompt-18
- AI Output Summary: Suggested a weekly calendar grid component with inline editing and save-on-blur functionality.
- Human Decision: Used the grid layout but changed the save behavior to require clicking a "Save Changes" button to prevent overwrites.
- Applied To: `PoliceDashboard.tsx`
- Verification: Modified roster assignments and verified data persistence after a page reload.

## Log #20
- Date: 2026-07-01
- Author: Trong (DE190357)
- AI Tool: Claude
- Purpose: Performance Optimization and Lazy Loading
- Prompt Reference: PROMPTS.md#prompt-20
- AI Output Summary: Recommended using `React.lazy` and `Suspense` for heavy dashboard routes like the map and analytics.
- Human Decision: Applied lazy loading to the Analytics and Heatmap modules, significantly reducing the initial JS bundle size.
- Applied To: `App.tsx`, `DashboardRouter.tsx`
- Verification: Ran Lighthouse performance audit and observed a major improvement in Time-to-Interactive.
