# Committing

> **Unscoped on purpose**: it applies at _commit_ time, when the files being
> committed may never have been read.

## A second session in the same tree shares the index

Two sessions on one working copy share one index, so a plain `git commit` takes
whatever the other has staged — that is how a commit here once swallowed 255
lines of an unrelated library and needed a second commit to put them back.

Commit with `git commit -F msg -- <paths>`: it records the **working tree** of
the named paths against `HEAD` and leaves the index alone, so nothing staged
elsewhere rides along. Then check `git show --stat HEAD` lists exactly those
paths.

**Never amend, and never reuse a ref you read earlier.** Another session
commits between two of your commands: an amend there replaces _its_ commit
with yours, its message gone and its tree rewritten. Make a new commit, and
compare `git log -1` with what you committed before anything that rewrites
`HEAD`.

**A file both sessions edit has no split by path**, and commits through a
private index:
`GIT_INDEX_FILE=<scratch> git read-tree HEAD`, then `git hash-object -w` a
copy of the file holding only your hunks and `git update-index` its blob
in, commit, and `git reset -- <paths>` the shared index to the new `HEAD`.
Neither the other session's working tree nor its staged lines move. A
changelog is such a file: check `git show HEAD -- CHANGELOG.md` holds only
your entry.

**A new file has to be added first.** `git commit -- <paths>` records only
paths git already tracks: an untracked file named there is skipped without a
word, and the commit lands importing a module it does not carry. `git add` the
new files, then commit with the same path list.

## The pre-push hook lints the whole working tree

`git push` runs `biome ci` over every file on disk, untracked ones included,
so another session's scratch script stops your push with errors in a file you
never touched. Leave the commit local and push once that session has
committed or removed it — never `--no-verify`, and never edit its file.
