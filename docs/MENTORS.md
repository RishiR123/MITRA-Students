# Mentor handbook

Everything a mentor needs to run a cohort. Students don't need to read this.

---

## Adding a student

1. **Settings → Collaborators → Add people**, enter their GitHub username, role **Write**.
2. Write access lets them push a branch. It does **not** let them push to `main` or merge
   their own PR — branch protection handles that.
3. They accept at https://github.com/RishiR123/MITRA-Students/invitations
4. Point them at [CONTRIBUTING.md](../CONTRIBUTING.md) and ask them to open the
   "Introduce yourself" issue.

Bulk-adding a cohort from the command line:

```bash
for u in alice bob priya; do
  gh api -X PUT "repos/RishiR123/MITRA-Students/collaborators/$u" -f permission=push
done
```

## Removing a student

```bash
gh api -X DELETE repos/RishiR123/MITRA-Students/collaborators/<username>
```

Their merged work stays in the repo, which is usually what you want.

---

## Reviewing a submission

CI has already checked structure, `student.json`, file scope, and secrets. Your job is
the part a script can't do.

**Review checklist**

- [ ] **Does it run?** Follow their README exactly. If you can't run it, that's the first
      comment — a project nobody else can start isn't finished.
- [ ] **Does it meet the module brief?** Check `courses/courses.json` → the module's
      `outcomes`.
- [ ] **Is it their own work?** Skim for tutorial code pasted verbatim with no sources
      listed. Following a tutorial is fine; pretending you didn't is not.
- [ ] **Is the README honest and useful?** What it does, how to run it, what they learned.
- [ ] **One substantive piece of feedback**, minimum. Even on excellent work — name the
      next thing they should learn.

**Leaving review comments**

- Comment on the specific line, not in a summary blob. Line comments get acted on.
- Say *why*, not just *what*. "This crashes on empty input — try it with no arguments"
  beats "add validation".
- Separate **must fix** from **nice to have**, explicitly. Students can't tell.
- Approve when it meets the bar, not when it's perfect. Perfect never ships.

**Outcomes**

| Verdict | Action |
|---|---|
| Meets the brief | **Approve** → **Squash and merge** |
| Close, small fixes | **Request changes** with a numbered list |
| Wrong direction | **Request changes** + offer a 15-minute call. Don't let someone rebuild the wrong thing twice |

Always **squash and merge** — students' branches have a lot of "fix typo" commits, and
squashing keeps `main` readable.

---

## Publishing a lesson video

1. Upload the video (YouTube unlisted is the usual choice).
2. Edit `courses/courses.json` and set the lesson's `video`:

   ```json
   "video": { "provider": "youtube", "id": "dQw4w9WgXcQ" }
   ```

   Supported: `youtube` (11-character id), `vimeo` (numeric id),
   `mp4` (`{"provider":"mp4","url":"https://…"}`), and `pending` for "not recorded yet".
3. Optionally write the lesson notes at the path in the lesson's `notes` field.
4. Open a PR, merge it. The **Deploy course site** workflow republishes within a minute.

Students see a clean "not published yet" placeholder for any `pending` lesson, so it's
safe to ship the syllabus before the videos exist.

## Adding a module

Append an object to `modules` in `courses/courses.json`:

```json
{
  "id": "module-7",
  "number": 7,
  "title": "…",
  "summary": "…",
  "duration": "≈ 8 hours",
  "project": "…",
  "outcomes": ["…"],
  "lessons": [
    { "id": "7.1", "title": "…", "duration": "18:00",
      "video": { "provider": "pending" },
      "notes": "courses/07-slug/7.1-slug.md", "resources": [] }
  ]
}
```

Lesson `id` values must be unique across the whole course — student progress is keyed on
them. **Renaming a lesson id resets that lesson's completion for every student**, so
change titles freely but leave ids alone.

## Starting a new cohort

```bash
mkdir -p submissions/cohort-2027
cp -r submissions/cohort-2026/_TEMPLATE submissions/cohort-2027/_TEMPLATE
```

Then update the `cohort` field in `courses/courses.json` and the paths in
`CONTRIBUTING.md`. The validator reads the cohort from the PR's own paths, so it needs no
change.

---

## Repo settings this depends on

- **Branch protection on `main`**: require a pull request, require 1 approval, require the
  `Validate submission` check, dismiss stale approvals on new pushes.
- **Pages**: source = GitHub Actions.
- **Actions**: read/write permissions (the welcome workflow posts comments).
- **Discussions**: enabled.

If students report they can merge their own PRs, branch protection has been turned off —
check **Settings → Branches** first.
