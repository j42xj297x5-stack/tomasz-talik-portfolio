# Codex execution contract

For `IMPLEMENT`:

`READ MINIMUM → EDIT → EXPLICIT VALIDATION ONLY → ONE TASK COMMIT → SUMMARY → STOP`

Codex must never autonomously:

- spawn or delegate to subagents;
- run tests, lint, builds, benchmarks, coverage, code review or `/review`;
- launch, probe or search for browsers;
- run Chromium, Chrome, Playwright, Puppeteer or browser automation;
- take screenshots or perform visual, perceptual, WebXR or hardware QA;
- run `git push`;
- create, edit, ready, review, merge, close or reopen Pull Requests;
- invoke `make_pr` or `/opt/codex/mcp/make_pr.py`;
- start MCP servers for PR delivery;
- install packages or dependencies to repair missing optional tooling;
- modify proxy/network settings;
- reconstruct Git remotes or credentials;
- search for alternative delivery mechanisms after the task commit.

Validation is allowed only when the CURRENT TASK explicitly names the validation or exact command.

## MISSING OPTIONAL TOOL != ENVIRONMENT REPAIR TASK

If an optional tool is not explicitly required by the CURRENT TASK, do not check further alternatives, install modules, use `pip install`, `npm install` or `apt`, reconfigure proxy, open the network, start helper servers, attempt to bypass the sandbox, repair the environment or search for alternatives.

Do not report unavailable optional tooling as a warning or blocker unless the CURRENT TASK explicitly required that tooling. This includes Chromium, Playwright, `make_pr`, `mcp`, screenshot/browser automation, `gh` and `origin`.

Summary reports only the completed scope, changed files, task commit and real blockers affecting required scope.

Hardware/browser/perceptual QA belongs to the user. PR delivery belongs to the user.

After the task commit and Summary: **STOP.**
