# Manual Testing Checklist

App: http://localhost:3000 · API: http://localhost:4000/api/v1
Accounts: `tester@example.com` / `supersecret123` (owns memes) · `other@example.com` / `supersecret123` (owns none)

---

## 1. Registration (`/register`)

- [ ] Register with a fresh email → lands on `/` signed in (auto-login, no separate login step)
- [ ] Signed-in status block shows your display name + nav links (Arena / Upload / My memes / Leaderboard)
- [ ] Register with an **already-used email** → inline error "An account with this email already exists", form stays filled
- [ ] Password shorter than 8 chars → browser blocks submit (`minLength`)
- [ ] Reload after registering → still signed in

## 2. Login (`/login`)

- [ ] Valid credentials → redirected to `/`, signed-in block visible
- [ ] Wrong password → inline error "Incorrect email or password", stays on form
- [ ] Unknown email → same error (no hint whether the email exists)
- [ ] "No account? Register" link → goes to `/register`

## 3. Session persistence & logout

- [ ] Log in → hard reload (⌘R) → still signed in
- [ ] Log in → close tab → reopen `localhost:3000` → still signed in
- [ ] Devtools → Application → Local Storage: token/user values are **encrypted blobs**, not plaintext
- [ ] Devtools → Application → Cookies: `refresh_token` is **HttpOnly**, path `/api/v1/auth`
- [ ] Click "Log out" → signed-in block replaced by "Log in to try the auth feature"
- [ ] After logout, local storage auth keys are gone

## 4. Route protection

- [ ] Logged out, visit `/upload` directly → redirected to `/login`
- [ ] Same for `/my-memes`, `/arena`, `/leaderboard`
- [ ] Logged in, all four pages load normally
- [ ] `/login` and `/register` remain reachable while logged in (no guard on public pages)

## 5. Meme upload (`/upload`)

**Happy path**
- [ ] Drag an image onto the dropzone → dropzone shows `dragover` state while hovering
- [ ] Drop → live preview appears
- [ ] Click-to-browse also works
- [ ] Fill title, click Upload → progress bar runs → redirected to `/my-memes` → new meme is there

**Validation (client-side, instant)**
- [ ] Drop a `.pdf` or `.txt` → inline "Please upload a JPEG, PNG, WEBP, or GIF image", no upload
- [ ] Drop an image > 5 MB → "File is too large — max 5MB"
- [ ] Upload button disabled until **both** a valid file and a non-empty title exist
- [ ] Title field caps at 100 characters

**Validation (server-side — needs curl or renaming tricks)**
- [ ] A text file renamed to `.jpg` with a spoofed image mime → server rejects 415 (magic-byte sniff) and deletes the file from `apps/back-end/uploads/`

## 6. My memes (`/my-memes`)

- [ ] Grid shows all your active memes with rating + win/loss record
- [ ] Empty state ("No memes yet…" with upload link) when the account owns none — check with `other@example.com`
- [ ] "Upload another" button → `/upload`
- [ ] Delete → native confirm dialog → meme disappears from grid immediately
- [ ] Cancel the confirm dialog → nothing happens
- [ ] Deleted meme no longer appears in the arena or leaderboard (soft delete)
- [ ] As `other@example.com`, you never see tester's memes here (`?uploader=me` scoping)

## 7. Arena (`/arena`)

**Voting**
- [ ] Two memes dealt side by side with titles + ratings
- [ ] Click a card → immediate highlight (optimistic), then reveal with old→new ratings and ± delta
- [ ] `←` key votes for the left meme, `→` for the right
- [ ] "Votes this session" counter increments per vote
- [ ] ~1.5 s after the reveal, a fresh matchup deals automatically
- [ ] During reveal, clicking/keys do nothing (double-vote guard)

**Ratings**
- [ ] Winner's rating goes up by the same amount loser's goes down
- [ ] Even matchup (equal ratings) → delta is 16
- [ ] After voting, `/leaderboard` order reflects the new ratings (within 60 s cache, or after reload)

**Edge cases**
- [ ] Delete down to 1 active meme → arena shows "Not enough memes… upload one" empty state with a link
- [ ] With only 2 active memes, the same pair re-deals (expected — pool of one possible pair)

## 8. Leaderboard (`/leaderboard`)

- [ ] Memes ranked by rating, highest first; rank numbers 1, 2, 3…
- [ ] Each row: rank, thumbnail, title, rating, wins, losses, uploader name
- [ ] Your own memes are visually highlighted
- [ ] As `other@example.com` (no memes) → no rows highlighted
- [ ] Deleted memes absent
- [ ] Ratings refresh within ~60 s of arena votes (cache TTL)

## 9. Cross-cutting

- [ ] No errors in the browser console during any of the above
- [ ] Images load from `localhost:4000/uploads/…` with long-lived cache headers
- [ ] Two browsers (or one normal + one incognito) logged in as different users can vote independently
- [ ] Backend terminal shows no unhandled errors during the session

---

## Known gaps (expected — don't file as bugs)

- `/` still shows the original demo content (fake battle stage + leaderboard preview) — pending "Polish & ship"
- No dark-mode toggle in the app yet
- Delete uses the native browser confirm, not a styled dialog
- No toasts — feedback is inline text
- No shared header/nav — links only live on the home page
