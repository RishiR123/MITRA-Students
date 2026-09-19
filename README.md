# MITRA — Students

Learn by watching. Prove it by shipping.

MITRA is a video-based learning program that runs entirely on GitHub. You watch the
lessons on the course site, build the project for each module, and submit it here as a
**pull request**. A mentor reviews it, leaves comments, and merges it when it's ready.

| | |
|---|---|
| 📺 **Course site** | https://rishir123.github.io/MITRA-Students/ |
| 📥 **Submit work** | Open a Pull Request — see [CONTRIBUTING.md](CONTRIBUTING.md) |
| ❓ **Stuck?** | [Ask a doubt](../../issues/new?template=doubt.yml) |
| 🐞 **Broken lesson?** | [Report it](../../issues/new?template=content-issue.yml) |
| 💬 **Just chatting** | [Discussions](../../discussions) |

---

## How this works

```
   Watch lesson  ─────►  Build project  ─────►  Open Pull Request
   (course site)         (on a branch)               │
                                                     ▼
                                          Mentor reviews & comments
                                                     │
                                          ┌──────────┴──────────┐
                                          ▼                     ▼
                                   Changes requested        Approved
                                          │                     │
                                     you push again          MERGED ✅
                                          └──────────►
```

Everything lives in **one repository**. You don't fork anything. You are added as a
collaborator, you create a branch, you open a PR. That is the whole workflow, and it is
the same workflow used by every professional software team.

---

## Getting started (first 10 minutes)

1. **Accept your invite.** Check the email tied to your GitHub account, or visit
   https://github.com/RishiR123/MITRA-Students/invitations
2. **Introduce yourself.** Open the [Introduce yourself](../../issues/new?template=introduction.yml)
   issue. Takes one minute.
3. **Clone the repo.**
   ```bash
   git clone https://github.com/RishiR123/MITRA-Students.git
   cd MITRA-Students
   ```
4. **Open the course site** and start Module 1.
5. **Submit Module 1** by following [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Repository map

```
MITRA-Students/
├── courses/            ← lesson content (Markdown) + courses.json (the syllabus)
├── docs/               ← the LMS site itself, served by GitHub Pages
├── submissions/        ← YOUR WORK GOES HERE
│   └── cohort-2026/
│       ├── _TEMPLATE/  ← copy this folder to start
│       └── <your-github-username>/
├── scripts/            ← the validator CI runs on your PR
└── .github/            ← issue templates, PR template, CI workflows
```

You only ever create files inside `submissions/cohort-2026/<your-username>/`.
A PR that touches anything else will be flagged by CI.

---

## The curriculum

| # | Module | You'll build |
|---|--------|--------------|
| 1 | [ANN Regression](courses/01-ann-regression/) | A one-neuron network trained in PyTorch, end to end |

Full lesson-by-lesson breakdown is on the [course site](https://rishir123.github.io/MITRA-Students/),
and the source of truth is [`courses/courses.json`](courses/courses.json).

---

## Rules that actually matter

- **Submit your own work.** Using AI or a tutorial is fine — copying someone's submission
  wholesale is not. We read the PRs.
- **One PR per module.** Don't bundle three modules into one pull request.
- **Never commit secrets.** No API keys, no `.env` files, no passwords. CI will fail you
  and, more importantly, the internet will find them.
- **Never edit another student's folder.** CI blocks this automatically.
- **Be decent to each other.** See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## For mentors

See [`docs/MENTORS.md`](docs/MENTORS.md) for the review checklist, how to add a cohort,
and how to publish a new module.

---

Licensed under [MIT](LICENSE). Course content © MITRA.
