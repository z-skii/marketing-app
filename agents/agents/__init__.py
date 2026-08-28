"""Agent definitions. Each agent declares its prompt, its tool list, and its
proposal kinds; the orchestrator supplies the run context. Agents never call
tools outside their list.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from ..llm.grok import Tool

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


@dataclass
class RunContext:
    agent: str
    run_id: str | None
    is_brief_run: bool = False


@dataclass
class AgentDef:
    name: str
    proposal_kinds: list[str]
    build_tools: Callable[[RunContext], list[Tool]]
    build_context: Callable[[RunContext], str]

    def system_prompt(self) -> str:
        return (PROMPTS_DIR / f"{self.name}.md").read_text()


def registry() -> dict[str, AgentDef]:
    from . import admin, ads, creative, ops, social

    defs = [ops.AGENT, admin.AGENT, creative.AGENT, ads.AGENT, social.AGENT]
    return {d.name: d for d in defs}
