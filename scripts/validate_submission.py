#!/usr/bin/env python3
"""
Validates a student pull request.

Run by .github/workflows/validate-submission.yml on every PR. Checks that the PR only
touches the author's own submission folder, that the required files are present and
valid, and that nothing dangerous (secrets, dependencies, build output) was committed.

Usage:
    python3 scripts/validate_submission.py --author <github-username> [--base origin/main]
"""

import argparse
import json
import os
import re
import subprocess
import sys

# Files a student may add outside their folder. Nothing, currently — but mentors change
# course content through PRs too, and they're allowed everywhere (see MENTOR_LOGINS).
MENTOR_LOGINS = {"rishir123"}

MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB

# Paths that should never appear in a submission.
FORBIDDEN_PATHS = [
    (re.compile(r"(^|/)node_modules/"), "node_modules/ — add it to .gitignore, never commit it"),
    (re.compile(r"(^|/)\.env($|\.)"), ".env file — this is how credentials leak"),
    (re.compile(r"(^|/)venv/|(^|/)\.venv/"), "Python virtualenv — add it to .gitignore"),
    (re.compile(r"(^|/)__pycache__/"), "__pycache__/ — compiled Python, not source"),
    (re.compile(r"(^|/)\.DS_Store$"), ".DS_Store — macOS junk file"),
    (re.compile(r"(^|/)(dist|build|\.next|out)/"), "build output — commit source, not artifacts"),
    (re.compile(r"\.(pem|key|p12|pfx|keystore)$"), "private key file"),
]

# Credential patterns. Deliberately narrow — a false positive here blocks a student's PR,
# so each pattern matches a format that is unambiguously a real credential.
SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key ID"),
    (re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"), "GitHub personal access token"),
    (re.compile(r"sk-(proj-)?[A-Za-z0-9_-]{32,}"), "OpenAI-style API key"),
    (re.compile(r"sk-ant-[A-Za-z0-9_-]{32,}"), "Anthropic API key"),
    (re.compile(r"AIza[0-9A-Za-z_-]{35}"), "Google API key"),
    (re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"), "Slack token"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"), "private key block"),
    (re.compile(r"mongodb(\+srv)?://[^\s:]+:[^\s@]+@"), "MongoDB connection string with password"),
    (re.compile(r"postgres(ql)?://[^\s:]+:[^\s@]+@"), "Postgres connection string with password"),
]

TEXT_SUFFIXES = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".txt", ".yml", ".yaml",
    ".html", ".css", ".scss", ".sh", ".env", ".cfg", ".ini", ".toml", ".java",
    ".c", ".cpp", ".h", ".go", ".rb", ".php", ".sql", ".xml", ".svg",
}

errors: list[str] = []
warnings: list[str] = []


def fail(msg: str, fix: str = "") -> None:
    errors.append(f"{msg}\n     ↳ {fix}" if fix else msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def changed_files(base: str) -> list[str]:
    """Files added or modified in this PR, relative to the merge base with `base`."""
    try:
        merge_base = subprocess.run(
            ["git", "merge-base", base, "HEAD"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
    except subprocess.CalledProcessError:
        merge_base = base

    out = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=ACMR", merge_base, "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout
    return [line for line in out.splitlines() if line.strip()]


def check_scope(files: list[str], author: str) -> str | None:
    """Every changed file must live under submissions/<cohort>/<author>/. Returns that dir."""
    prefix_re = re.compile(rf"^submissions/([^/]+)/{re.escape(author)}/")
    stray = [f for f in files if not prefix_re.match(f)]

    if stray:
        listed = "\n".join(f"       - {f}" for f in stray[:15])
        more = f"\n       ...and {len(stray) - 15} more" if len(stray) > 15 else ""
        fail(
            f"This PR changes {len(stray)} file(s) outside your submission folder:\n{listed}{more}",
            "Everything you add must be inside submissions/<cohort>/"
            f"{author}/. To undo an accidental change:\n"
            "       git checkout origin/main -- <that-file>",
        )

    owned = [f for f in files if prefix_re.match(f)]
    if not owned:
        fail(
            "This PR doesn't add anything to your submission folder.",
            f"Expected files under submissions/cohort-2026/{author}/",
        )
        return None

    cohort = prefix_re.match(owned[0]).group(1)
    return f"submissions/{cohort}/{author}"


def check_student_json(root: str) -> None:
    path = os.path.join(root, "student.json")
    if not os.path.isfile(path):
        fail(
            f"Missing {path}",
            "Copy it from submissions/cohort-2026/_TEMPLATE/student.json and fill it in.",
        )
        return

    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except json.JSONDecodeError as exc:
        fail(f"{path} is not valid JSON: {exc}", "A trailing comma or a missing quote, usually.")
        return

    if not isinstance(data, dict):
        fail(f"{path} must be a JSON object, not a {type(data).__name__}.")
        return

    for field in ("name", "github", "cohort"):
        value = data.get(field)
        if not value or not str(value).strip():
            fail(f'{path} is missing a value for "{field}".')
        elif str(value).strip().upper().startswith(("YOUR ", "YOUR-", "REPLACE")):
            fail(f'{path}: "{field}" still has the template placeholder in it.')


def check_module_readme(root: str, files: list[str]) -> None:
    modules = {
        f.split("/")[3]
        for f in files
        if len(f.split("/")) > 4 and f.split("/")[3].startswith("module-")
    }
    for module in sorted(modules):
        readme = os.path.join(root, module, "README.md")
        if not os.path.isfile(readme):
            fail(
                f"Missing {readme}",
                "Every module folder needs a README.md saying what you built, how to "
                "run it, and what you learned.",
            )
        elif os.path.getsize(readme) < 120:
            warn(f"{readme} is very short — a mentor can't review what you don't explain.")

    if not modules:
        warn(
            "No module-<n>/ folder found. Put your work in "
            f"{root}/module-1/ so it's clear which module this is."
        )


def check_forbidden(files: list[str]) -> None:
    for path in files:
        for pattern, why in FORBIDDEN_PATHS:
            if pattern.search(path):
                fail(f"{path} should not be committed — {why}.")
                break


def check_size(files: list[str]) -> None:
    for path in files:
        if os.path.isfile(path) and os.path.getsize(path) > MAX_FILE_BYTES:
            mb = os.path.getsize(path) / 1024 / 1024
            fail(
                f"{path} is {mb:.1f} MB (limit is 5 MB).",
                "Compress images, and host videos on YouTube rather than committing them.",
            )


def check_secrets(files: list[str]) -> None:
    for path in files:
        if not os.path.isfile(path):
            continue
        if os.path.splitext(path)[1].lower() not in TEXT_SUFFIXES:
            continue
        if os.path.getsize(path) > 1024 * 1024:
            continue
        try:
            with open(path, encoding="utf-8", errors="ignore") as fh:
                content = fh.read()
        except OSError:
            continue

        for pattern, label in SECRET_PATTERNS:
            match = pattern.search(content)
            if match:
                line_no = content[: match.start()].count("\n") + 1
                fail(
                    f"{path}:{line_no} looks like a committed {label}.",
                    "Remove it, move it to an environment variable, and REVOKE THE KEY — "
                    "it is in git history now and must be treated as compromised.",
                )
                break


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--author", required=True, help="GitHub username of the PR author")
    parser.add_argument("--base", default="origin/main", help="base ref to diff against")
    args = parser.parse_args()

    author = args.author.strip()
    files = changed_files(args.base)

    print(f"Validating pull request by @{author}")
    print(f"{len(files)} file(s) changed\n")
    for path in files[:40]:
        print(f"  {path}")
    if len(files) > 40:
        print(f"  ...and {len(files) - 40} more")
    print()

    if not files:
        print("No files changed — nothing to validate.")
        return 0

    if author.lower() in MENTOR_LOGINS:
        print(f"@{author} is a mentor — skipping submission-scope checks.")
        check_secrets(files)
        check_size(files)
    else:
        root = check_scope(files, author)
        check_forbidden(files)
        check_size(files)
        check_secrets(files)
        if root:
            check_student_json(root)
            check_module_readme(root, files)

    if warnings:
        print("Warnings (these won't block your PR):\n")
        for i, msg in enumerate(warnings, 1):
            print(f"  {i}. {msg}")
        print()

    if errors:
        print(f"Validation failed — {len(errors)} problem(s) to fix:\n")
        for i, msg in enumerate(errors, 1):
            print(f"  {i}. {msg}\n")
        print("Fix these, commit, and push to the same branch — this PR updates itself.")
        print("Stuck? https://github.com/RishiR123/MITRA-Students/blob/main/CONTRIBUTING.md")
        return 1

    print("All checks passed. A mentor will review your work shortly.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
