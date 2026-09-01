# Module 2: Git and Version Control

## Why Git Changed Everything

Version control existed before Git. CVS, SVN, Mercurial, Perforce: they all solved the same fundamental problem: how do multiple people work on the same codebase without stepping on each other's toes. Git solved this differently, and the difference matters.

Git is distributed. Every developer has a complete copy of the repository, including its full history. This means you can commit, branch, and merge offline. It means the server can die and any clone is a full backup. It means you can create cheap experimental branches without affecting anyone else.

Linus Torvalds created Git in 2005 to manage Linux kernel development. The kernel had outgrown BitKeeper (a proprietary VCS that had revoked their free license), and Linus needed something that could handle thousands of contributors making thousands of changes. The result was a tool optimized for branching, merging, and distributed collaboration.

The internal model matters: Git stores data as a directed acyclic graph of commits. Each commit points to its parent(s). Branches are just pointers to commits. Tags are just pointers to commits. HEAD is a pointer to the current commit. This simplicity is why Git is fast and why operations like branching and merging are nearly instantaneous.

## Branching Strategies

The branching strategy you choose determines how your team collaborates, how releases are managed, and how bugs get fixed. There is no single "right" strategy: the choice depends on your release cadence, team size, and regulatory requirements.

### Git Flow

Git Flow is the classic strategy created by Vincent Driessen in 2010. It uses five branch types:

- `main` (or `master`): production-ready code
- `develop`: integration branch for features
- `feature/*`: individual feature branches
- `release/*`: preparation for a release
- `hotfix/*`: emergency production fixes

The flow works like this: developers branch off `develop` for new features, merge back to `develop` when done. When `develop` is ready for release, create a `release/*` branch, do final testing and version bumps, then merge to both `main` and `develop`. For hotfixes, branch off `main`, fix the bug, merge to both `main` and `develop`.

Git Flow is appropriate when you have scheduled releases (monthly, quarterly) or when you need to maintain multiple production versions. It is overly complex for teams deploying continuously.

```
main:    A---B-------E---F
          \         /   /
develop:  A---B---C---D---G
              \     /
feature:       C---D
```

### Trunk-Based Development

Trunk-based development means everyone commits to a single branch (`main` or `trunk`) multiple times per day. Features are developed behind feature flags and enabled when ready. There are no long-lived feature branches.

This is the strategy used by Google, Facebook, and most high-performing teams. It works because:

- Merge conflicts are small and frequent, not large and rare
- Code is always in a deployable state
- Feature flags allow incomplete work to exist in production without being visible
- Code review happens before merge, not after

The risk is that broken code reaches `main`. This is mitigated by comprehensive automated tests, code review policies, and feature flags. The key practice is keeping branches short-lived: hours, not days.

```
main:    A---B---C---D---E---F
              \   \   /
feature:       B'--C'
```

Feature flags decouple deployment from release. You deploy code to production with the feature flag off, then enable it when you are ready. This eliminates the "big bang" release and allows you to roll back features instantly by flipping a flag.

### GitHub Flow

GitHub Flow is a simplified version of trunk-based development. The rules are:

1. `main` branch is always deployable
2. Create feature branches from `main`
3. Commit to feature branches and open pull requests
4. Code review and CI checks happen on the pull request
5. Merge to `main` when approved and passing
6. Deploy `main` to production

GitHub Flow is popular with teams that deploy on every merge or frequently enough that long-lived branches are unnecessary. It is simpler than Git Flow and works well for web applications and SaaS products.

### Choosing a Strategy

If you deploy continuously (multiple times per day), use trunk-based development. If you deploy weekly or monthly, GitHub Flow works well. If you maintain multiple production versions or have regulatory requirements for release management, Git Flow is appropriate.

The wrong choice causes real pain. Using Git Flow for continuous deployment creates unnecessary overhead. Using trunk-based development for quarterly releases leaves features exposed in production for months.

## Advanced Git Operations

Most developers use `git add`, `git commit`, `git push`, and `git pull`. These get you through daily work. But Git has powerful features that become essential when things get complicated.

### Interactive Rebase

Interactive rebase lets you rewrite commit history before pushing. This is useful for cleaning up messy commit messages, combining small commits, or removing accidental changes.

```bash
# Rewrite the last 5 commits
git rebase -i HEAD~5
```

This opens your editor with a list of commits:

```
pick abc1234 Add user model
pick def5678 Fix typo in user model
pick ghi9012 Add user tests
pick jkl3456 Fix user test
pick mno7890 Update user model docs
```

You can reorder commits, squash them together, reword messages, or drop them entirely:

```
pick abc1234 Add user model
squash def5678 Fix typo in user model
squash ghi9012 Add user tests
squash jkl3456 Fix user test
pick mno7890 Update user model docs
```

The result: three clean commits instead of five messy ones. This makes code review easier and git history more useful.

**Warning:** Never rebase commits that have been pushed to a shared branch. Rebase rewrites commit hashes, which causes conflicts for anyone who has pulled the original commits. Use interactive rebase only on local, unpushed commits.

### Cherry-Pick

Cherry-pick applies a specific commit from one branch to another. This is useful when you need a bug fix from `develop` in `main` without merging the entire feature.

```bash
git cherry-pick abc1234
```

You can also cherry-pick a range of commits:

```bash
git cherry-pick abc1234..def5678
```

Cherry-pick creates a new commit with the same changes but a different hash. It is not a copy: it is a replay. The changes are identical, but the commit history is different.

### Bisect

Bisect is Git's binary search for bugs. You tell Git a commit that was good and a commit that was bad, and Git checks out the middle commit. You test it and tell Git whether it was good or bad. Git narrows the range and repeats until it finds the exact commit that introduced the bug.

```bash
git bisect start
git bisect bad          # Current commit is broken
git bisect good abc1234 # This commit was working
```

Git checks out a middle commit. You test it:

```bash
# Test the code...
git bisect good  # or git bisect bad
```

After a few iterations, Git identifies the commit that introduced the bug. For a history of 1000 commits, this takes about 10 tests instead of 1000. It is one of Git's most underused features.

### Stash

Stash temporarily stores uncommitted changes so you can work on something else.

```bash
git stash                    # Stash all changes
git stash push -m "WIP: auth" # Stash with a message
git stash list               # Show all stashes
git stash pop                # Apply and remove most recent stash
git stash apply stash@{2}   # Apply specific stash without removing it
git stash drop stash@{0}    # Remove a specific stash
```

Stash is useful when you are mid-task and need to switch branches for a quick fix. The changes are saved, you switch branches, make the fix, switch back, and pop the stash. Your working directory is exactly where you left it.

## Conventional Commits and Message Conventions

Commit messages are documentation. They tell the story of why changes were made, not just what changed. Bad commit messages ("fix bug", "update", "WIP") are useless. Good commit messages explain context and intent.

Conventional Commits is a specification that standardizes commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types include: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), `refactor` (code restructuring), `test` (adding tests), `chore` (maintenance).

Examples:

```
feat(auth): add JWT token refresh mechanism

The previous implementation required users to re-login when their token
expired. This change adds automatic token refresh using a refresh token
stored in an httpOnly cookie.

Closes #234
```

```
fix(api): handle null response from payment gateway

The payment gateway sometimes returns null instead of an error object.
This was causing a 500 error. Now we check for null and return a
meaningful error message.

Fixes #567
```

Conventional Commits enable automated changelog generation, semantic versioning, and better code review. When every commit follows a pattern, reviewers can quickly identify the scope and intent of changes.

## Git Hooks and Pre-Commit Checks

Git hooks are scripts that run automatically at specific points in the Git workflow. They are stored in the `.git/hooks/` directory and can be used to enforce standards, run tests, or prevent mistakes.

The most useful hooks:

**pre-commit**: Runs before a commit is created. Use it to lint code, run tests, or check for secrets.

**commit-msg**: Runs after the commit message is entered. Use it to validate commit message format.

**pre-push**: Runs before pushing to a remote. Use it to run full test suites or check branch naming.

A `.pre-commit-config.yaml` file configures the pre-commit framework:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: detect-private-key

  - repo: https://github.com/psf/black
    rev: 24.3.0
    hooks:
      - id: black

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/commitizen-tools/commitizen
    rev: v3.13.0
    hooks:
      - id: commitizen
```

Install pre-commit hooks in your repository:

```bash
pip install pre-commit
pre-commit install
```

Now every `git commit` automatically runs linting, formatting, and commit message validation. If any check fails, the commit is blocked. This catches problems before they reach CI, where they are more expensive to fix.

The `detect-private-key` hook is particularly important. It prevents developers from accidentally committing AWS keys, database passwords, or other secrets. This has saved countless companies from security incidents.

## Monorepo vs Polyrepo

A monorepo stores all code in a single repository. A polyrepo stores each project in its own repository. The choice has significant implications for tooling, collaboration, and deployment.

**Monorepo advantages:**
- Single source of truth for all code
- Atomic cross-project changes (one commit updates multiple projects)
- Simplified dependency management
- Consistent code style across projects
- Easier code reuse and sharing

**Monorepo disadvantages:**
- Requires specialized tooling (Bazel, Nx, Turborepo) for large codebases
- CI/CD must be smart about which parts to build and test
- Access control is coarser (everyone can see everything)
- Repository size can become massive

**Polyrepo advantages:**
- Clear ownership boundaries (each team owns their repo)
- Independent versioning and release cycles
- Simpler CI/CD for individual projects
- Fine-grained access control

**Polyrepo disadvantages:**
- Dependency management across repos is painful
- Cross-repo changes require coordinated releases
- Code duplication is common
- Inconsistent tooling and practices across repos

Google, Facebook, and Microsoft use monorepos. They have invested heavily in custom tooling to make monorepos work at scale. Most smaller organizations use polyrepos because the tooling ecosystem (GitHub, GitLab, Bitbucket) is designed around them.

The trend is moving toward monorepos, especially with tools like Nx and Turborepo that provide intelligent build caching and dependency analysis. But polyrepos are simpler to start with and work well for small teams.

## Real Story: Recovering from a Force-Push Disaster

A team of 8 developers was working on a critical feature for a client deadline. The feature branch had 47 commits over two weeks. One developer, under pressure to merge before the deadline, ran `git push --force` on the `develop` branch, accidentally overwriting 3 hours of work from 4 other developers.

The force push succeeded because the repository did not have branch protection rules enabled. The `develop` branch was the integration branch, and 3 developers had pushed commits in the last 3 hours that were now gone.

Here is how they recovered:

The first thing to understand is that `git push --force` does not delete commits: it makes them unreachable. The commits still exist in Git's object store. They just are not referenced by any branch. Git's garbage collector will eventually remove them, but "eventually" means days or weeks, depending on configuration.

The recovery process:

```bash
# Find the reflog entries that reference the lost commits
git reflog

# The reflog shows every change to HEAD. Look for entries before the force push
# Example output:
# abc1234 HEAD@{0}: push: force
# def5678 HEAD@{1}: checkout: moving from feature to develop
# ghi9012 HEAD@{2}: commit: Add payment validation
# jkl3456 HEAD@{3}: commit: Add user authentication
```

The reflog showed the state of `develop` before the force push. The lost commits were referenced by `HEAD@{1}` through `HEAD@{n}`. They created a temporary branch to recover them:

```bash
# Create a branch at the state before the force push
git branch recover-temp HEAD@{1}

# Check out the recover branch and verify the commits are there
git checkout recover-temp
git log --oneline -10

# Now force push the recovered branch back to develop
git push origin recover-temp:develop --force
```

The recovered branch had all 4 lost commits plus the 3 hours of work from other developers. The force-pushed commits (the single developer's work) were integrated separately.

The aftermath led to three permanent changes:

1. **Branch protection rules were enabled immediately.** The `develop` and `main` branches required pull request reviews and passing CI checks before merging. Force push was disabled for everyone except repository admins, and even admins needed approval from a second admin.

2. **The team adopted a pull request workflow.** No one committed directly to integration branches. All changes went through pull requests with at least one review. This prevented the "cowboy coder" scenario where one developer could affect the entire team.

3. **A `pre-push` hook was implemented** that warned developers when they were about to force push:

```bash
#!/bin/bash
# .git/hooks/pre-push

remote="$1"
url="$2"

# Check for force push
while read local_ref local_sha remote_ref remote_sha; do
    if [[ "$remote_ref" =~ \+$ ]]; then
        echo "WARNING: You are about to force push!"
        echo "Branch: $remote_ref"
        read -p "Are you sure? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            exit 1
        fi
    fi
done
```

This story illustrates a fundamental principle: Git makes it hard to truly lose data, but the recovery process is stressful and time-consuming. Prevention is always better than recovery. Branch protection, code review, and CI checks are not bureaucracy: they are safety nets.

## Advanced: Git Worktrees, Submodules, and Subtrees

### Git Worktrees

Git worktrees let you check out multiple branches simultaneously in different directories. This is useful when you need to work on a hotfix while mid-task on a feature branch.

```bash
# Create a worktree for a hotfix branch
git worktree add ../hotfix-branch hotfix/urgent-fix

# Work in the hotfix directory
cd ../hotfix-branch
# ... make changes, commit, push ...

# Return to your feature work
cd ../main-repo
git worktree remove ../hotfix-branch
```

Worktrees are faster than stashing and switching branches because they do not require cleaning the working directory. Each worktree has its own working directory but shares the same `.git` directory.

### Git Submodules

Submodules let you include one Git repository inside another. This is common for shared libraries, configuration repositories, or vendored dependencies.

```bash
# Add a submodule
git submodule add https://github.com/org/shared-lib.git libs/shared-lib

# Clone a repo with submodules
git clone --recurse-submodules https://github.com/org/main-repo.git

# Update submodules to their latest commits
git submodule update --remote --merge
```

Submodules have a reputation for being confusing because the parent repo tracks a specific commit of the submodule, not a branch. When the submodule is updated, the parent must explicitly pull the new commit. This leads to detached HEAD states and confusion about which version of the submodule is being used.

### Git Subtrees

Subtrees are an alternative to submodules that merge the history of one repository into another. Unlike submodules, subtrees do not require separate clone commands and do not create additional directories.

```bash
# Add a subtree
git subtree add --prefix=libs/shared-lib https://github.com/org/shared-lib.git main --squash

# Pull updates from the subtree
git subtree pull --prefix=libs/shared-lib https://github.com/org/shared-lib.git main --squash

# Push changes back to the subtree repository
git subtree push --prefix=libs/shared-lib https://github.com/org/shared-lib.git main
```

Subtrees are simpler for consumers (no submodule commands needed) but more complex for contributors (changes to the subtree must be pushed back separately). Choose subtrees when you want a self-contained repository that includes external code. Choose submodules when you want to keep external code separate.

### Git Aliases

Git aliases are shortcuts for frequently used commands. Define them in your `.gitconfig` file:

```ini
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    lg = log --graph --oneline --decorate --all
    last = log -1 HEAD
    unstage = reset HEAD --
    amend = commit --amend --no-edit
    wip = !git add -A && git commit -m 'WIP'
    undo = !git reset --soft HEAD~1
```

The most useful aliases:
- `git lg`: A visual branch graph that shows all branches and their relationships
- `git last`: Show the last commit
- `git amend`: Add staged changes to the last commit without changing the message
- `git undo`: Undo the last commit without losing changes
- `git wip`: Quick "work in progress" commit

Aliases save time and reduce typing errors. They are not just convenience: they enforce consistent workflows across the team.

## Assessment

**Lab Task 1: Branching Strategy Implementation (60 minutes)**

Given a repository, implement a branching strategy appropriate for a team that deploys weekly:
1. Create a `main` branch that is always deployable
2. Create a `develop` branch for integration
3. Create feature branches for two sample features
4. Create a release branch for version 1.2.0
5. Create a hotfix branch for a critical bug

Document your strategy with a branching diagram and explain why you chose this approach.

Grading criteria: Correct branch creation and naming (30%), proper merge flow (30%), appropriate strategy selection (20%), documentation quality (20%).

**Lab Task 2: Interactive Rebase Cleanup (30 minutes)**

You are given a repository with 15 messy commits on a feature branch:
- 3 commits with "WIP" messages
- 2 commits that fix typos in the same file
- 4 commits that are logically part of the same change
- 6 properly committed changes

Use interactive rebase to clean up the commit history into clean, logical commits with proper conventional commit messages.

Grading criteria: Correct use of interactive rebase (40%), clean commit history (30%), proper commit messages (30%).

**Lab Task 3: Git Bisect for Bug Hunting (45 minutes)**

You are given a repository with a known regression introduced somewhere in the last 200 commits. Use `git bisect` to identify the exact commit that introduced the bug. Document:
- The good and bad commits you used to start bisecting
- The intermediate commits you tested
- The final commit identified as the cause
- A brief explanation of why that commit introduced the bug

Grading criteria: Correct use of bisect (35%), efficient narrowing (25%), accurate identification of the bug commit (25%), documentation quality (15%).

**Lab Task 4: Pre-Commit Hook Setup (30 minutes)**

Set up a pre-commit hook configuration for a Python project that includes:
- Black formatting check
- Flake8 linting
- Trailing whitespace removal
- Secret detection (private keys, AWS keys)
- Commit message format validation (Conventional Commits)

Test the hooks by attempting to commit code that violates each rule.

Grading criteria: All hooks configured and working (50%), correct detection of violations (30%), clear documentation of setup (20%).

## Evidence

Git's internal model as a directed acyclic graph of content-addressable objects is documented in Git's official documentation and in the book "Pro Git" by Scott Chacon and Ben Straub, which is freely available at git-scm.com. The branching strategies described (Git Flow, trunk-based development, GitHub Flow) are based on published patterns from the software industry.

Trunk-based development has been empirically shown to correlate with higher software delivery performance. The DORA team's "State of DevOps Reports" consistently find that elite performers use trunk-based development and feature flags. Google, Facebook, and other high-performing organizations have publicly discussed their trunk-based workflows.

Interactive rebase, cherry-pick, bisect, and stash are standard Git features documented in the official Git documentation. The `git reflog` recovery technique is a well-established pattern for recovering from accidental force pushes and is documented in multiple sources including the Git documentation and "Pro Git."

Pre-commit hooks and the pre-commit framework are open-source tools with extensive documentation. The specific configuration shown uses the pre-commit-hooks repository (maintained by the pre-commit project), Black (the Python formatter maintained by the PSF), Flake8 (the Python linter), and Commitizen (the commit message validator).

The monorepo vs polyrepo discussion is based on published experiences from organizations including Google (monorepo), which has published extensively on their tooling (Bazel, Blaze), and the broader industry trend toward monorepos with tools like Nx, Turborepo, and Bazel.

Submodules and subtrees are documented in the official Git documentation. The trade-offs between them are well-established in the Git community and have been discussed extensively in blog posts, conference talks, and the Git mailing list.