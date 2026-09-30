# Directful Connected Content System

## Goal
Recenter Content around one continuous workflow: Events & Holidays → planning opportunities → flexible content periods → review and publish → results and AI-guided updates. Preserve the current Directful design language, campaign architecture, and working AI/file flows.

## What will change

### 1. Events & Holidays becomes the shared context
- Add an **Events & Holidays** destination to Content navigation.
- Build a lightweight month workspace with search, source labels, add/edit/remove actions, and CSV/Excel upload.
- Keep sources explicit: **Directful**, **Hotel calendar**, or **Added manually**.
- Include both calendar states in the sample experience: hotel-specific events available, and Directful-only holidays/seasonal moments.
- Make changes immediately update the planning opportunities used elsewhere.

### 2. Reframe the opening screen
- Change the main message to **Plan your upcoming content** and use the brief’s supporting copy.
- Keep the warm event imagery and engaging planning surface, but make cards dynamic from Events & Holidays data.
- Show name, date or range, type, source, and location where relevant.
- When hotel calendar data exists: show **Localize with AI**, **Keep current**, and **Manage events & holidays**.
- Without hotel calendar data: show **Localize with these**, **Upload my calendar**, **Keep current**, and **Manage events & holidays**.

### 3. Replace monthly packages with flexible content periods
- Let users choose exact start and end dates instead of month-only controls.
- Build a content plan that divides the timeframe into **Standard**, **Event-based**, and **Seasonal** periods.
- Distinguish event dates from their recommended marketing window.
- Surface uncovered gaps honestly and let users create Standard content or leave the period unchanged.
- Show guest relevance and audience eligibility in plain language.

### 4. Update AI planning, generation, and review
- Make AI answer “Where should content change, and why?” using the shared calendar, current content, hotel context, performance, media, and supplied files.
- Replace the current event-card plan with a period-by-period plan requiring **Approve & write content** or **Edit plan**.
- Show meaningful generation stages from context review through previews.
- Keep human approval mandatory; remove direct publish from generation completion.
- Reuse the same period navigation in Review and Published views.

### 5. Make Published answer what is active now
- Replace the month package selector with a timeline of content periods.
- Automatically mark the period containing today as **Current**.
- Show why each period is Standard, Event-based, or Seasonal and provide access to its campaign content.
- Keep Standard content intentional and active wherever no localized period applies.

### 6. Merge release history and performance into Results
- Consolidate the current Releases and Results experiences under **Results** with **Overview**, **Releases**, and **Campaigns** views.
- Lead with AI highlights and meaningful comparisons rather than generic KPI cards.
- Compare only equivalent periods or versions, and state when no valid comparison exists.
- Add release period structure, performance, changes, AI insight, and property usage.
- Add previous-version review with **Use this version**, **Keep current**, and **Edit with AI**; preserve history by creating a new current version.
- Surface future Standard periods as opportunities with **Update with AI** or **Keep current**.

### 7. Terminology and polish
- Use the brief’s approved terms consistently: Standard, Event-based, Seasonal, Current, Previous version, Published, Scheduled, Results, AI insight, Use this version, Update with AI, Keep current, Review campaign.
- Remove “Revert” and other discouraged technical language from Content.
- Keep the experience calm, premium, hotel-focused, and visually restrained—no generic chatbot treatment, KPI wall, or oversized AI effects.

## Technical approach
- Move event/calendar records and content-period records into shared typed mock stores so Content, planning, review, Published, and Results use one source.
- Preserve the existing campaign entities and channel/audience preview behavior; periods reference campaigns rather than replacing campaign architecture.
- Keep all state in the current in-memory demo model; no new backend or persistence is introduced by this update.
- Add route metadata for the new Events & Holidays page and update existing Content route metadata where names change.
- Record the new shared-context and flexible-period architecture in `AGENTS.md`.

## Verification
- Exercise both initial-screen calendar states.
- Add, edit, remove, search, and upload calendar events.
- Create a date-range plan, handle a gap, approve generation, review periods, and publish.
- Confirm Published selects the current period automatically.
- Confirm Results comparisons, version actions, property usage, and Update with AI links.
- Check desktop and narrow layouts, console output, and the latest build diagnostics.