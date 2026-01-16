# UI Layout & Component Standards

## 1. Global Viewport Constraints
* **Root Container:** The primary application wrapper MUST be set to `h-screen` (100vh) and `overflow-hidden`. Global page scrolling is strictly prohibited.
* **Sidebar Integrity:** The Sidebar MUST always be `h-full`. The footer (Sign Out/Appearance) must be pinned to the bottom using `mt-auto` within a `flex-col` layout. 
* **Navigation Scrolling:** The main navigation links MUST use `flex-1` and `overflow-y-auto` to ensure the footer remains visible "above the fold" regardless of the number of menu items.

## 2. Component Layout & Stacking
* **Overlap Prevention:** Avoid using `position: absolute` for core layout cards. Use **CSS Grid** or **Flexbox** with defined `gap` properties to ensure elements maintain physical separation.
* **Dashboard Logic:** The "Central Command" area (Magic HUD + Add Income) must remain distinct from the "Debt Snowball" area. Use a grid layout (e.g., `grid-cols-1 lg:grid-cols-3`) to prevent card collision at different widths.

## 3. Responsive Enforcement
* **Breakpoint Verification:** Every layout change must be verified at three key resolutions using the Browser Subagent:
    * **Desktop:** 1920x1080 (Ensure no excessive centering or narrow containers).
    * **Tablet:** 768x1024 (Verify cards don't overlap).
    * **Mobile:** 390x844 (Ensure sidebar transitions to a mobile-friendly menu and Sign Out remains accessible).

## 4. Stability & Error Handling
* **White Screen Prevention:** Every data-driven route (Budget, Snowball, Funds) MUST be wrapped in an `ErrorBoundary` component.
* **Data Safety:** Always provide default fallbacks (e.g., `data || []`) when mapping over API results to prevent "Cannot read property of undefined" crashes.
* **Console Monitoring:** When running E2E tests, the agent must monitor the browser console and report any red errors, even if the UI appears functional.

## 5. Coding Standards
* **Tailwind Consistency:** Use utility-first classes. Avoid custom CSS files unless strictly necessary for complex animations.
* **Component Modularity:** Large pages should be broken down into small, testable sub-components located in a `components/` directory.