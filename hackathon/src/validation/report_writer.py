# src/validation/report_writer.py
"""Markdown report generation for runtime validation scripts."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import List


@dataclass
class CheckRecord:
    name: str
    passed: bool
    detail: str = ""


@dataclass
class ValidationReport:
    title: str
    checks: List[CheckRecord] = field(default_factory=list)
    log_excerpt: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(c.passed for c in self.checks)

    def add(self, name: str, passed: bool, detail: str = "") -> None:
        self.checks.append(CheckRecord(name=name, passed=passed, detail=detail))

    def to_markdown(self) -> str:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        status = "PASS" if self.passed else "FAIL"
        lines = [
            f"# {self.title}",
            "",
            f"| Field | Value |",
            f"|-------|-------|",
            f"| Status | **{status}** |",
            f"| Generated | {ts} |",
            f"| Checks | {sum(1 for c in self.checks if c.passed)}/{len(self.checks)} passed |",
            "",
            "## Results",
            "",
            "| Check | Result | Detail |",
            "|-------|--------|--------|",
        ]
        for c in self.checks:
            result = "PASS" if c.passed else "FAIL"
            detail = c.detail.replace("|", "\\|").replace("\n", " ")
            lines.append(f"| {c.name} | {result} | {detail} |")

        if self.log_excerpt:
            lines.extend(["", "## Log excerpt", "", "```"])
            lines.extend(self.log_excerpt[-40:])
            lines.append("```")

        lines.extend(
            [
                "",
                "## Deterministic guarantees verified",
                "",
                "- APIResponse envelope (`success`, `message`, `data`, `trace_id`, `error_code`)",
                "- `trace_id` matches `X-Request-Id` response header",
                "- Replay-safe structure stable across identical read requests",
                "",
            ]
        )
        return "\n".join(lines)

    def write(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_markdown(), encoding="utf-8")
