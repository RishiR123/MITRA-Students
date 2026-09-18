# How to submit your project

This is the single most important page in the repo. Read it once, properly, and you'll
never need it again.

We use **one repository**. You do **not** fork. You are a collaborator: you create a
branch, push it, open a pull request, and a mentor merges it.

---

## Before your first submission

Make sure you've accepted your collaborator invite. If `git push` says
`403 Permission denied`, your invite is still pending — check
https://github.com/RishiR123/MITRA-Students/invitations

Clone the repo (once, ever):

```bash
git clone https://github.com/RishiR123/MITRA-Students.git
cd MITRA-Students
```

---

## The six steps

### 1. Get the latest code

Always start from an up-to-date `main`. Skipping this is the #1 cause of merge conflicts.

```bash
git checkout main
git pull origin main
```

### 2. Create a branch

Branch names follow `<your-username>/module-<number>`:

```bash
git checkout -b your-username/module-1
```

> Replace `your-username` with your actual GitHub username, e.g. `git checkout -b priya-s/module-1`

### 3. Create your folder and do the work

Copy the template into your own folder. **Do this once** — after Module 1 the folder
already exists and you just add to it.

```bash
cp -r submissions/cohort-2026/_TEMPLATE submissions/cohort-2026/your-username
```

Your folder must end up looking like this:

```
submissions/cohort-2026/your-username/
├── student.json          ← required, fill in your details
├── README.md             ← required, describe what you built
└── module-1/             ← one folder per module
    ├── README.md         ← what it does, how to run it, what you learned
    └── ...your code...
```

Fill in `student.json`:

```json
{
  "name": "Priya Sharma",
  "github": "priya-s",
  "cohort": "cohort-2026",
  "track": "web",
  "started": "2026-09-18"
}
```

### 4. Commit

```bash
git add submissions/cohort-2026/your-username
git commit -m "Module 1: Git and GitHub fundamentals — Priya Sharma"
```

Write commit messages a human can read. `update` and `asdf` are not commit messages.

### 5. Push your branch

```bash
git push -u origin your-username/module-1
```

### 6. Open the pull request

GitHub prints a link when you push — click it. Or go to the repo and press
**Compare & pull request**.

- **Title:** `Module 1 — Your Name`
- **Body:** the PR template fills itself in. Answer every question honestly, especially
  "what did you struggle with" — that's the part mentors read most carefully.

Then press **Create pull request**. That's it. You're done.

---

## What happens next

1. **CI runs automatically** (about 30 seconds). It checks your folder structure, that
   `student.json` is valid, that you haven't touched anyone else's work, and that you
   haven't committed a secret. If it fails, click **Details** to see exactly why.
2. **A mentor reviews it.** Usually within 2 working days.
3. **You get one of two outcomes:**
   - ✅ **Approved** → merged. Your work is now part of the repo.
   - 💬 **Changes requested** → read the comments, fix, and push again (see below).

## Responding to review comments

**Do not open a new pull request.** Push to the same branch and the PR updates itself.

```bash
# make your fixes, then:
git add .
git commit -m "Address review: rename variables, add error handling"
git push
```

Reply to each comment so the mentor knows you've handled it, then click
**Re-request review**.

---

## Fixing common problems

<details>
<summary><b>CI says "modified files outside your submission folder"</b></summary>

You edited something you shouldn't have. See what you touched:

```bash
git diff --name-only origin/main...HEAD
```

Undo the file you didn't mean to change:

```bash
git checkout origin/main -- path/to/that/file
git commit -m "Revert accidental change"
git push
```
</details>

<details>
<summary><b>"Your branch is behind main" / merge conflict</b></summary>

```bash
git checkout main
git pull origin main
git checkout your-username/module-1
git merge main
```

Git will mark conflicts inside the files with `<<<<<<<` and `>>>>>>>`. Open each file,
delete the markers, keep the correct code, then:

```bash
git add .
git commit -m "Merge main into branch"
git push
```
</details>

<details>
<summary><b>CI says "possible secret detected"</b></summary>

You committed an API key, token, or `.env` file. **Removing it in a new commit is not
enough** — it stays in the git history.

1. Delete the file and add it to `.gitignore`.
2. **Revoke the key immediately** on whatever service issued it. Assume it's compromised.
3. Tell a mentor — we'll help you clean the history.
</details>

<details>
<summary><b>"Permission denied" when pushing</b></summary>

Either your invite is still pending (see the top of this page), or you're trying to push
directly to `main`. `main` is protected — you must push a branch.
</details>

---

## Commit message guide

```
Module 3: CLI weather tool — Priya Sharma     ← good
Fix argument parsing in weather.py            ← good
Add error handling for invalid city names     ← good

update                                        ← bad
asdf                                          ← bad
final final v2 REAL                           ← bad
```

---

## Reporting issues and asking questions

| I want to... | Do this |
|---|---|
| Ask a doubt about a lesson | [Open a doubt issue](../../issues/new?template=doubt.yml) |
| Report a broken video or typo | [Open a content issue](../../issues/new?template=content-issue.yml) |
| Propose my own capstone idea | [Open a project proposal](../../issues/new?template=project-proposal.yml) |
| Report a bug in the course site | [Open a site bug](../../issues/new?template=site-bug.yml) |
| Just talk to other students | [Discussions](../../discussions) |

Search existing issues first — someone has probably already asked.

---

## The checklist

Before you click "Create pull request":

- [ ] I started from an up-to-date `main`
- [ ] My branch is named `<username>/module-<n>`
- [ ] Everything I added is inside `submissions/cohort-2026/<my-username>/`
- [ ] `student.json` is filled in and valid JSON
- [ ] My module folder has a `README.md` explaining what I built
- [ ] My code runs
- [ ] No secrets, no `.env`, no `node_modules/`
- [ ] My commit messages are readable
