# Changelog

All the updates to SOW Assistant Tools, in plain english.

## [5.3] - 2026-07-23

- Figured out why SOW tabs are so slow: the workspace only keeps 3 tabs actually loaded (ServiceNow's own default is 10), so everything else gets torn down and takes 5 seconds to rebuild when you click back.
- Two new toggles fix it: "Extend Max Tab Limit" lets you raise the 10 tab cap to whatever you want (default 16), and "Tab Cache Persist Bypass" keeps your tabs loaded so switching is instant.
- New live monitor panel (little chart button in the menu) shows memory use, how many tabs are actually loaded, and whether the fix is holding.
- The menu got a full redesign: wider, three columns, tools grouped into categories, draggable by the header, and every tool has a one line description now.
- Background Open is back to the original version because the rewrite was less reliable, and the Tab Counter now follows your custom tab limit instead of being stuck at 10.

## [5.0] - 2026-07-15

- New tool: The Better Watchlist, which watches your tickets and pops a toast when someone changes them, comments, resolves, or reopens, even after close.
- It stays fast by only asking the server "what changed since last time" instead of re-downloading everything, and uses ServiceNow's own push channel so most updates arrive instantly.
- Alert Suppressor got rewritten to stop popup alerts from ever being created instead of dismissing them after the fact, with a log of everything it blocked.
- Performance Boost reworked to block a broken request SOW spams every 6 seconds and to kill page animations.
- The menu and installer page were restyled to match the new dark panel look, with an animated border and per tool colour stripes.

## [4.0.1] - 2026-07-03

- Settings now save themselves automatically to a file instead of you having to export and import manually.
- Fixed Attachment Drop failing on brand new unsaved incident tabs.
- Attachment Drop temporarily disabled while that fix gets more testing.
- Installer page redesigned into a sharp cornered terminal style spec sheet.

## [4.0] - 2026-06-30

- New tool: Ticket Search, a search bar in the SOW header that finds your last 50 incidents, requests, and interactions as you type.
- Clicking a result opens it instantly without a page reload.
- Settings storage was overhauled to stop relying on browser storage.
- Save and Load settings buttons added to the menu footer.

## [3.5] - 2026-06-24

- New tool: Caller Insight, which shows the caller's full profile and their recent tickets right on the contact card.
- Includes VIP, locked out, and failed login badges, plus click to copy ticket numbers.
- Light and dark theme system added, with a main toggle and per tool overrides.
- Various small colour and date formatting fixes.

## [3.2] - 2026-06-12

- New tool: Quick Associate, which lets you link records on IMS forms without opening the clunky modal.

## [3.1] - 2026-06-12

- The Alert Suppressor panel can now be dragged anywhere on screen.
- Tooltip Blocker got benched (greyed out in the menu) until some bugs are sorted.

## [3.0] - 2026-05-27

- New tool: Tooltip Blocker, which hides the tooltips that cover what you are trying to read.
- The toolkit now updates itself: the bookmarklet fetches the latest version automatically, so no reinstalling.
- Version badge in the menu tells you when something new is out.
- Installer page redesigned with a card grid.

## [2.0] - 2026-05-25

- Alert Suppressor completely rewritten with multiple layers, including one that stops alerts stealing your cursor focus while you type.
- New tool: Attachment Drop, drag a file anywhere on a ticket to attach it, with a rename step before upload.
- Performance Boost added.
- Genesys Timer now shows how long since your last call ended instead of a blank timer.
- Menu redesigned with a glass panel look.

## [1.6] - 2026-05-01

- New tool: Genesys Timer, a live pill in the navbar showing your call phase and wrap up countdown.
- It changes colour as wrap up drags on and can notify you if you blow past the threshold.
- Tracks your daily wrap up budget and session call history.

## [1.5] - 2026-04-29

- New tool: Lockout Check, adds a button next to the caller that opens the lockout status site prefilled with their employee number.
- Handles the case where the Details tab has not loaded yet by clicking it for you and switching back.
- Menu simplified to a single drag to install button.

## [1.1] - 2026-03-24

- New tool: Background Open, shift click any ticket link to open it without losing your current tab.
- New tool: Tab Load Time, a small HUD that measures how long tab switches actually take.
- All tools now live in one floating menu with on and off toggles that remember your choices.

## [1.0] - 2026-03-18

- First release with three tools: auto dismissing ServiceNow's alert banners, one click ticket number copying, and a live tab counter in the tab bar.

## Currently benched

- Tooltip Blocker: works but needs more testing after some old bugs.
- Attachment Drop: works but the file panel refresh needs polish.

## Tried but did not ship

- A response cache for ticket data: barely helped because the real slowness was elsewhere (see 5.3, we found it).
- Raising the tab cache limit from outside: five failed attempts back then, finally cracked properly in 5.3.
- Fixing SOW's console errors: they all come from ServiceNow's own code and need admin access.
- A full SOW theme engine: parked for now.
