# Module 2 — Git and Version Control

**Course:** DevOps & Platform Engineering | **Path:** DevOps (2 of 10)

---

## What You'll Actually Do

You'll use Git properly — branching strategies, rebasing, cherry-picking, bisecting. Not just `git add . && git commit -m "fix"`.

---

## Branching Strategies

**Git Flow:**
```text
main — production
develop — integration
feature/* — new features
release/* — release prep
hotfix/* — production fixes
```

**Trunk-Based:**
```text
main — everything
short-lived branches (< 1 day)
feature flags for incomplete work
```

**GitHub Flow:**
```text
main — always deployable
feature branches → PR → merge to main → deploy
```

---

## Essential Commands

```bash
# Interactive rebase (clean up history)
git rebase -i HEAD~5

# Cherry-pick a specific commit
git cherry-pick abc123

# Bisect to find when a bug was introduced
git bisect start
git bisect bad          # current commit is broken
git bisect good abc123  # this commit was working
# Git checks out middle commit, you test, repeat

# Stash changes
git stash push -m "WIP: feature X"
git stash list
git stash pop

# Interactive add
git add -p  # stage specific hunks
```

---

## Commit Messages

```text
Good:
fix: resolve race condition in user creation
feat: add rate limiting to API endpoints
docs: update deployment guide

Bad:
fix stuff
WIP
asdfgh
```

**Conventional Commits:**
```text
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

---

## Assessment

**Lab task (20 min):**

1. Create a feature branch and merge via PR
2. Use interactive rebase to clean up commits
3. Use bisect to find a bug
4. Cherry-pick a commit from another branch
5. Write proper commit messages

**Grading:**
- Branching correct: 20%
- Rebase clean: 20%
- Bisect working: 20%
- Cherry-pick correct: 20%
- Messages proper: 20%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO2 — Git Version Control`
