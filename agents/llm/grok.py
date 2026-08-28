"""Thin wrapper around xAI chat completions with tool calling.

Grok speaks the OpenAI-compatible API at https://api.x.ai/v1. run_agent()
drives the tool loop: call the model, execute any tool calls it makes, feed
the results back, and stop when the model answers in plain text. Every tool
call is written to agent_actions.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any, Callable

from .. import audit, config


@dataclass
class Tool:
    """One function exposed to Grok: JSON schema in, Python callable out."""

    name: str
    description: str
    parameters: dict[str, Any]
    func: Callable[..., Any]

    def spec(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


@dataclass
class RunResult:
    content: str
    input_tokens: int = 0
    output_tokens: int = 0
    tool_calls_made: int = 0
    errors: list[str] = field(default_factory=list)


def make_client():
    from openai import OpenAI

    api_key = os.environ.get("XAI_API_KEY")
    if not api_key:
        raise RuntimeError("XAI_API_KEY is not set.")
    return OpenAI(api_key=api_key, base_url=config.XAI_BASE_URL)


def run_agent(
    system_prompt: str,
    context: str,
    tools: list[Tool],
    model: str,
    *,
    agent: str,
    run_id: str | None = None,
    client: Any = None,
    max_tool_calls: int = config.MAX_TOOL_CALLS_PER_RUN,
) -> RunResult:
    client = client or make_client()
    impls = {tool.name: tool for tool in tools}
    specs = [tool.spec() for tool in tools]
    messages: list[Any] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": context},
    ]
    result = RunResult(content="")

    while True:
        over_budget = result.tool_calls_made >= max_tool_calls
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=specs,
            tool_choice="none" if over_budget else "auto",
        )
        if response.usage is not None:
            result.input_tokens += response.usage.prompt_tokens or 0
            result.output_tokens += response.usage.completion_tokens or 0

        msg = response.choices[0].message
        messages.append(msg)
        if not msg.tool_calls:
            result.content = msg.content or ""
            return result

        for tc in msg.tool_calls:
            result.tool_calls_made += 1
            outcome = _call_tool(impls, tc, agent=agent, run_id=run_id, errors=result.errors)
            messages.append(
                {"role": "tool", "tool_call_id": tc.id, "content": json.dumps(outcome, default=str)}
            )


def _call_tool(
    impls: dict[str, Tool],
    tc: Any,
    *,
    agent: str,
    run_id: str | None,
    errors: list[str],
) -> Any:
    name = tc.function.name
    try:
        args = json.loads(tc.function.arguments or "{}")
    except ValueError:
        return {"error": f"arguments for {name} were not valid JSON"}

    tool = impls.get(name)
    if tool is None:
        return {"error": f"unknown tool {name}"}

    try:
        outcome = tool.func(**args)
    except Exception as exc:  # the model gets the error and can adjust
        errors.append(f"{name}: {exc}")
        outcome = {"error": str(exc)}

    audit.log_action(run_id, agent, name, args, outcome)
    return outcome
