# Royal Safari improvement plan (uploaded document)

Done
- [x] Speed indexes, per-agent totals function, seat bookings load per date, multi-seat save refreshes once
- [x] Tickets and luggage no longer capped at 1,000 rows
- [x] Pages load on demand
- [x] Sign-up removed; logins without a role see "Not authorised"
- [x] Owner password moved to server (hashed, 5 tries -> 15 min lock, 10 min idle, Lock now)
- [x] Owner area: Profit, Memo, Companies and buses, Seat layouts, Commissions
- [x] Companies Jagirdar/Vedaa, buses linked, 4 missing buses added inactive
- [x] Seat layouts (Jagirdar 36, Vedaa 34 from 4 Oct, Vedaa 36 before) + editor
- [x] Booking types + default commission rules (match current code)

Open
- [ ] Seat map on Seat Bookings drawn from layouts (berth labels, toilets, unplaced list)
- [ ] New bookings use commission_rules instead of fixed rates
- [ ] Fill bus_id on old bookings (preview count first)
- [ ] Phase 5 booking flow, luggage tab per bus, staff booking via server functions, single payment function
- [ ] Memo/Profit summed on server, read saved percentages
- [ ] Agent collections using per-agent totals function; Dashboard summary query
- [ ] Settings: parallel loads, all agents with search
- [ ] 6-digit PIN for new staff, login lockout
- [ ] Phase 6 full redesign
- [ ] Decide on login kmahesh (no role, 2 tickets) and safari123 (no role) — waiting on user
- [ ] Open questions in plan (MH30 CE 6759 vs 7659, staff seat booking) — waiting on user
