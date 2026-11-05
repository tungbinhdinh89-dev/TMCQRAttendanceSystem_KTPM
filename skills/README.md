# Project skills

Project-specific reusable AI instructions can live in this directory. Root
`AGENTS.md` and `CLAUDE.md` remain the entry points for repository instructions;
the ticket and Git workflow is documented in `doc/work-flow.md`.

The existing third-party skill repository was moved to `skills/stephen-skills/`,
including its own Git metadata. It remains a local, ignored checkout rather than
an accidental nested repository or vendored dependency in this project's commits.
