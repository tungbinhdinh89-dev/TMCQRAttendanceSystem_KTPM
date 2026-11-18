# Implement the assigned GitHub ticket

Input: the user's GitHub issue number/URL or registered TMC ID.

Read `AGENTS.md` and `doc/ticket-execution-flow.md` and execute that flow end to end:

1. Resolve the canonical repository and real issue; distinguish `#102` from `TMC-102`.
2. Inspect the full paginated native sub-issue tree, checklist, AC, dependencies and existing PRs.
3. Plan ready scoped work and delegate relevant frontend/backend/QA/PM/tech-lead packages,
   with explicit ownership and the required frontend or schema-migration skill.
4. Fetch origin/main and isolate a ticket branch; preserve the user's dirty/untracked files.
5. Implement, integrate and commit coherent increments; coordinator owns Git in shared worktrees.
6. Fix verification failures; record each checklist/AC result and validate the committed SHA.
7. Push and open/update a PR targeting main with evidence, child coverage and limitations.
8. Leave the PR open awaiting the user's review/approval. Do not auto-merge, close issues or mark Done.

Keep an execution record for resumption. Do not implement unrelated dependencies or invent
evidence/IDs/URLs. The prompt is an entrypoint to the shared flow, not a second set of rules.
