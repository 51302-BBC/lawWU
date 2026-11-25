# Rehearsal: LeaveDemo (login hero)

Built with the stageshow skill (benji.org/stageshow, kit vendored in `src/stageshow/kit`).

- **Gold copied:** `examples/dark-hero` (dark desktop hero, system story, no cursor).
- **Changed:** the product is our leave app. A browser window shows our own top bar (wordmark 事務所 | LEAVE, nav as placeholder bars with the active underline) and 我的紀錄. The new row is a 特休 request on 12月3日 for 8 hours. Its status rolls 審核中 → 已核准 on one pill, and the approver waypoint (林主管) loses its amber corner brackets and fills green. Square corners, black ground, white accent and Bahnschrift/D-DIN tokens match v3.
- **Framing:** corner bleed. The stage uses `fill` to grow with the hero column (scale ≈1.23 at 1440px), and the window runs off the right and bottom edges. There's no plate; the page is the ground.
- **Story:** open (0.9s), hold pending (2.6s), approve, hold the payoff (2.4s), close (0.7s), then snap back unseen. The loop is about 6.6s.
- **Poster:** the approved frame. It is shown under reduced motion.
- **Film:** `node scripts/film.mjs http://localhost:5173/login --select .login__stage --width 1440 --every 500 --count 28 --gate`, run in Edge via CHROME_PATH. The final result was `rehearsal passed`. I fixed three earlier faults:
  - a near-tangent between the nav underline and the window bar;
  - a tight stack between the month and the day in the date box;
  - date text stepping in its box, fixed with `will-change`.

**Not checked:**
- No `compact` design. Below 1100px the login page drops the demo on purpose, because sign-in comes first.
- No filming at 390px.
- No fresh-eye review by a second reviewer (`references/review.md`).
- The coverage line was "inconclusive" because of sampling gaps on this machine.
