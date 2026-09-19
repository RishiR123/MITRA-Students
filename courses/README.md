# Course content

`courses.json` is the syllabus and the single source of truth for the course site. The
site at `docs/` reads it at runtime; the Pages workflow copies it to `data/courses.json`
on deploy.

## Structure

```
courses/
├── courses.json          ← the syllabus: modules, lessons, video links
└── 01-ann-regression/    ← lesson notes, the notebook, and its dataset
    ├── README.md
    ├── 1.1-ann-regression.md
    ├── ann-regression.ipynb
    └── Student_Performance.csv
```

## Linking a video

Set the lesson's `video` field:

```json
{ "provider": "youtube", "id": "dQw4w9WgXcQ" }
{ "provider": "vimeo",   "id": "76979871" }
{ "provider": "mp4",     "url": "https://cdn.example.com/lesson.mp4" }
{ "provider": "pending" }
```

`pending` renders a tidy "not published yet" placeholder instead of a broken player, so
the syllabus can go live before the videos are recorded.

## Writing lesson notes

Create a Markdown file at the path in the lesson's `notes` field. It renders directly
inside the lesson page — headings, code blocks, tables and blockquotes all work.

Notes are the fallback when a video isn't ready, so write them as if the video doesn't
exist.

## Rules

- **Lesson `id` values are permanent.** Student progress is stored against them. Renaming
  `6.2` to `6.3` silently resets that lesson for everyone. Titles and durations can change
  freely.
- Keep `courses.json` valid JSON — CI fails the deploy otherwise.
- Content changes go through a pull request, like everything else.

See [`docs/MENTORS.md`](../docs/MENTORS.md) for the full mentor workflow.
