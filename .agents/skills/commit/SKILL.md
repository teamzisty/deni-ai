---
name: commit
description: Create a git commit for staged and unstaged changes in this repository. Use when the user asks to commit the current work, prepare a commit message, or stage and commit changes. Review git status and diffs, follow recent commit message style, avoid staging secrets such as .env files, create a concise conventional commit message, make the commit, and verify the result.
---

Create a git commit for the current repository changes.

1. Run `git status` to inspect changed and untracked files.
2. Run `git diff` and `git diff --staged` to inspect unstaged and staged changes.
3. Run `git log --oneline -5` to match recent commit message style.
4. Draft a concise conventional commit message such as `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`, or `docs: ...`.
5. Stage only the relevant files. Do not stage secrets, credential files, or unrelated changes.
6. Create the commit with the drafted message.
7. Run `git status` again to confirm the commit succeeded.
