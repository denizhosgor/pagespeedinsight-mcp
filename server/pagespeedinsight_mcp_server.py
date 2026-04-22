#!/usr/bin/env python3
"""MCP server that exposes Google PageSpeed Insights as tools."""

from __future__ import annotations

import os
from typing import Any
from urllib.parse import quote

import httpx
from mcp.server.fastmcp import FastMCP

PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
DEFAULT_TIMEOUT_SECONDS = 60
DEFAULT_CATEGORIES = ["performance", "accessibility", "best-practices", "seo"]

mcp = FastMCP("pagespeedinsight")


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url:
        raise ValueError("URL cannot be empty.")
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    return url


def clamp_timeout(timeout_seconds: int) -> int:
    if timeout_seconds < 5:
        return 5
    if timeout_seconds > 180:
        return 180
    return timeout_seconds


def normalize_categories(categories: list[str] | None) -> list[str]:
    if not categories:
        return DEFAULT_CATEGORIES
    normalized = []
    for c in categories:
        c2 = c.strip().lower()
        if c2:
            normalized.append(c2)
    return normalized or DEFAULT_CATEGORIES


def build_psi_url(
    target_url: str,
    strategy: str,
    categories: list[str],
    locale: str | None,
    timeout_seconds: int,
) -> str:
    parts = [
        f"url={quote(target_url, safe='')}",
        f"strategy={quote(strategy, safe='')}",
    ]
    for c in categories:
        parts.append(f"category={quote(c, safe='')}")
    if locale:
        parts.append(f"locale={quote(locale, safe='')}")
    parts.append(f"timeout={quote(str(timeout_seconds), safe='')}")

    api_key = os.getenv("PAGESPEEDINSIGHT_API_KEY", "").strip()
    if api_key:
        parts.append(f"key={quote(api_key, safe='')}")

    return f"{PSI_ENDPOINT}?{'&'.join(parts)}"


def get_num(audit: dict[str, Any], key: str) -> float | None:
    val = audit.get(key)
    if isinstance(val, (int, float)):
        return float(val)
    return None


def score_percent(score: Any) -> float | None:
    if isinstance(score, (int, float)):
        return round(float(score) * 100, 2)
    return None


def summarize_report(report: dict[str, Any], strategy: str, categories: list[str]) -> dict[str, Any]:
    lighthouse = report.get("lighthouseResult", {}) or {}
    audits = lighthouse.get("audits", {}) or {}
    category_scores = lighthouse.get("categories", {}) or {}
    loading_experience = report.get("loadingExperience", {}) or {}
    origin_loading_experience = report.get("originLoadingExperience", {}) or {}

    categories_out: dict[str, float | None] = {}
    for c in categories:
        categories_out[c] = score_percent((category_scores.get(c) or {}).get("score"))

    key_metrics = {
        "fcp_ms": get_num((audits.get("first-contentful-paint") or {}), "numericValue"),
        "lcp_ms": get_num((audits.get("largest-contentful-paint") or {}), "numericValue"),
        "speed_index_ms": get_num((audits.get("speed-index") or {}), "numericValue"),
        "tbt_ms": get_num((audits.get("total-blocking-time") or {}), "numericValue"),
        "cls": get_num((audits.get("cumulative-layout-shift") or {}), "numericValue"),
        "inp_ms": get_num((audits.get("interaction-to-next-paint") or {}), "numericValue"),
    }

    opportunities = []
    for audit_id, audit in audits.items():
        details = audit.get("details", {}) or {}
        savings_ms = get_num(audit, "numericValue")
        if details.get("type") == "opportunity":
            wasted_ms = get_num(audit, "numericValue")
            if wasted_ms is not None and wasted_ms > 0:
                opportunities.append(
                    {
                        "audit_id": audit_id,
                        "title": audit.get("title"),
                        "description": audit.get("description"),
                        "estimated_savings_ms": round(wasted_ms, 2),
                    }
                )
        elif audit_id in {"render-blocking-resources", "unused-javascript", "unused-css-rules"}:
            if savings_ms is not None and savings_ms > 0:
                opportunities.append(
                    {
                        "audit_id": audit_id,
                        "title": audit.get("title"),
                        "description": audit.get("description"),
                        "estimated_savings_ms": round(savings_ms, 2),
                    }
                )

    opportunities = sorted(
        opportunities,
        key=lambda x: x.get("estimated_savings_ms") or 0,
        reverse=True,
    )[:5]

    return {
        "requested_strategy": strategy,
        "final_url": report.get("id"),
        "analysis_timestamp": lighthouse.get("fetchTime"),
        "lighthouse_version": lighthouse.get("lighthouseVersion"),
        "categories": categories_out,
        "key_metrics": key_metrics,
        "loading_experience": {
            "overall_category": loading_experience.get("overall_category"),
            "initial_url": loading_experience.get("initial_url"),
        },
        "origin_loading_experience": {
            "overall_category": origin_loading_experience.get("overall_category"),
            "origin_fallback": origin_loading_experience.get("origin_fallback"),
        },
        "top_opportunities": opportunities,
    }


async def fetch_psi(
    target_url: str,
    strategy: str,
    categories: list[str],
    locale: str | None,
    timeout_seconds: int,
) -> dict[str, Any]:
    normalized_url = normalize_url(target_url)
    strategy = strategy.strip().lower()
    if strategy not in {"mobile", "desktop"}:
        raise ValueError("strategy must be 'mobile' or 'desktop'.")

    categories = normalize_categories(categories)
    timeout_seconds = clamp_timeout(timeout_seconds)
    url = build_psi_url(normalized_url, strategy, categories, locale, timeout_seconds)

    timeout = httpx.Timeout(timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout) as client:
        res = await client.get(url)
    res.raise_for_status()
    body = res.json()

    if "error" in body:
        raise RuntimeError(str(body["error"]))
    return body


@mcp.tool()
async def run_pagespeed(
    url: str,
    strategy: str = "mobile",
    categories: list[str] | None = None,
    locale: str | None = "en-US",
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    include_raw: bool = False,
) -> dict[str, Any]:
    """
    Analyze a URL with Google PageSpeed Insights.

    Args:
        url: Target URL (example: https://example.com).
        strategy: "mobile" or "desktop".
        categories: Optional list of categories (performance, accessibility, best-practices, seo, pwa).
        locale: Locale for analysis output (example: en-US, tr-TR).
        timeout_seconds: API timeout between 5 and 180 seconds.
        include_raw: Include raw API payload if True.
    """
    report = await fetch_psi(url, strategy, categories or DEFAULT_CATEGORIES, locale, timeout_seconds)
    summary = summarize_report(report, strategy, normalize_categories(categories))
    if include_raw:
        return {"summary": summary, "raw": report}
    return {"summary": summary}


@mcp.tool()
async def compare_pagespeed(
    url: str,
    categories: list[str] | None = None,
    locale: str | None = "en-US",
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    """
    Compare PageSpeed Insights mobile and desktop analyses for the same URL.

    Args:
        url: Target URL.
        categories: Optional list of categories.
        locale: Locale for analysis output.
        timeout_seconds: API timeout between 5 and 180 seconds.
    """
    categories = normalize_categories(categories)
    mobile = await fetch_psi(url, "mobile", categories, locale, timeout_seconds)
    desktop = await fetch_psi(url, "desktop", categories, locale, timeout_seconds)

    mobile_summary = summarize_report(mobile, "mobile", categories)
    desktop_summary = summarize_report(desktop, "desktop", categories)

    perf_mobile = (mobile_summary.get("categories") or {}).get("performance")
    perf_desktop = (desktop_summary.get("categories") or {}).get("performance")
    perf_delta = None
    if isinstance(perf_mobile, (int, float)) and isinstance(perf_desktop, (int, float)):
        perf_delta = round(perf_desktop - perf_mobile, 2)

    return {
        "url": normalize_url(url),
        "performance_delta_desktop_minus_mobile": perf_delta,
        "mobile": mobile_summary,
        "desktop": desktop_summary,
    }


if __name__ == "__main__":
    mcp.run()
