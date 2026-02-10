Create a git commit for staged and unstaged changes.

1. Run `git status` to see all changed and untracked files
2. Run `git diff` to see unstaged changes and `git diff --staged` for staged changes
3. Run `git log --oneline -5` to see recent commit message style
4. Analyze the changes and draft a concise commit message following conventional commits (feat/fix/refactor/chore/docs)
5. Stage relevant files (avoid .env or credential files)
6. Create the commit with the drafted message
7. Run `git status` to verify the commit succeeded
