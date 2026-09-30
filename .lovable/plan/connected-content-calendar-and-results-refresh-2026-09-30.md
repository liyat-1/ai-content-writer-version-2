# Connected Content Calendar and Results Refresh

## Goal
Make Content feel like one continuous, visual planning system: the selected content period drives the month and campaign content, events are managed in a true calendar workspace, calendar uploads have a polished guided flow, and Results explains campaign-level performance and version decisions.

## What will change

### 1. Unify month and content-period navigation
- Remove the separate content-period box above Published content.
- Build one schedule header with the month on top and the selected content period directly below it.
- Use previous/next controls to move through periods; the displayed month, status, explanation, version, and campaign content follow the selected period.
- Mark the period containing today as **Current** and make it the initial selection.

### 2. Restore a lively visual content plan
- Upgrade **Your content plan** from a plain list to a visual period timeline.
- Use the existing event photography for known holidays and events, with polished visual fallbacks for Standard and seasonal periods.
- Preserve period reasons, marketing windows, gap choices, and **Approve & write content** / **Edit plan** actions.
- Keep the same visual treatment in full and minimized AI planning views without crowding the smaller panel.

### 3. Rebuild Events & Holidays as a calendar workspace
- Replace the grouped list with a month calendar inspired by the supplied reference: compact month navigator, source controls, month/week-style grid, and clear event blocks.
- Let users move between months, search events, select an event, add/edit/remove it, and attach an event photo.
- Show event details in a focused side panel rather than a separate floating card-heavy layout.

### 4. Add a complete calendar upload experience
- Open a modal from **Upload my calendar** on the initial screen and **Upload calendar** on Events & Holidays.
- Support drag-and-drop and local file selection, show selected-file and processing/success states, and preserve helpful validation.
- After a successful upload, take the user to Events & Holidays so the imported items are immediately visible.

### 5. Deepen campaign Results
- Make campaigns the richer breakdown under each selected publication rather than repeating a second high-level hierarchy.
- Give each campaign a period-style visual card with property usage, current performance, equivalent prior-period comparison, and a campaign-specific AI insight.
- When a previous version performed better, offer **Use previous version** for that campaign; create a new review version while preserving history.
- Keep **Keep current** and **Edit with AI** available where they help the decision.

## Technical details
- Continue using the shared in-memory calendar, period, release, and campaign models; no backend is introduced.
- Add event-photo and upload state to the shared calendar model and route starter uploads through the Events & Holidays page.
- Extend mock campaign result records with campaign insights and prior-version decision data.
- Update the project roadmap and architecture note for period-driven schedule navigation and the shared calendar upload flow.

## Verification
- Confirm Current period selection, previous/next period movement, and synchronized month/content on desktop and narrow widths.
- Exercise both calendar upload entry points, drag/drop or local selection, success navigation, event add/edit/remove, photo attachment, search, and month movement.
- Verify the visual AI plan in full and minimized modes.
- Verify campaign comparison, AI insight, and previous-version actions in Results.
- Check the latest build diagnostics and browser console with no errors.
