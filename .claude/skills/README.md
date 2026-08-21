# Installed design & dev skills

Project-level skills for Claude Code, committed so every clone and every
Claude Code on the web session picks them up automatically.

| Skill | Source | What it does |
|---|---|---|
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) ([tasteskill.dev](https://www.tasteskill.dev/)) | Taste Skill v2 — anti-slop frontend. Infers design direction from the brief, tunes VARIANCE / MOTION / DENSITY dials, audit-first on redesigns. |
| `image-to-code` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/blob/main/skills/image-to-code-skill/SKILL.md) | Image-first pipeline: generate section reference images → deep-analyze them → implement the frontend to match. |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) | Audits UI code against the Web Interface Guidelines (accessibility, UX, best practices) and reports `file:line` findings. |
| `awesome-design-md` | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md/) | Pulls a ready-made `DESIGN.md` design system from any of 73 real websites into the project root. Catalog vendored at `awesome-design-md/references/catalog.md`. |
| `playwright-cli` | [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | Drive a real browser from the CLI — navigate, interact, snapshot, trace, generate tests. Token-efficient alternative to Playwright MCP. |

Plus one MCP server, configured in [`.mcp.json`](../../.mcp.json):

| Server | Source | What it does |
|---|---|---|
| `21st` | [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp) → [21st.dev/mcp](https://21st.dev/mcp) | UI component search, generation, and logo search against the 21st.dev catalog. |

## Per-machine setup

Everything above is committed, but two pieces need one-time setup on each machine:

**1. `21st` MCP — API key.** The server is configured to read `API_KEY_21ST` from the
environment (the config is checked in; the key is not). Get a key at
[21st.dev/mcp](https://21st.dev/mcp), then:

```bash
export API_KEY_21ST="..."   # add to your shell profile
```

Restart Claude Code afterwards. Note that Magic MCP's old API keys were reset — a key
from the legacy Magic console will not work.

**2. `playwright-cli` — the binary.** The skill is committed, but it shells out to a CLI
that must be installed globally:

```bash
npm install -g @playwright/cli@latest
```

In Claude Code on the web (and other containers with a preinstalled Playwright
browser), also run this once per session so the CLI uses the bundled Chromium instead
of trying to download one:

```bash
bash .claude/scripts/setup-playwright-sandbox.sh
```

It writes `.playwright/cli.config.json` (gitignored — the path is container-specific)
and no-ops on machines where playwright-cli manages its own browsers.

## Updating

```bash
npx skills update            # design-taste-frontend, image-to-code, web-design-guidelines
playwright-cli install --skills   # playwright-cli
```

`awesome-design-md` is maintained in this repo; refresh its catalog from the upstream
README when new sites are added.
