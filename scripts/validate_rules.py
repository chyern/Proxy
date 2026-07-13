#!/usr/bin/env python3
"""Validate local Shadowrocket and Quantumult X configuration resources."""

from __future__ import annotations

import ipaddress
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SHADOWROCKET_LISTS = sorted((ROOT / "Shadowrocket" / "rule").glob("*.list"))
CUSTOM_CONFIG = ROOT / "Shadowrocket" / "custom.conf"
QUANTUMULT_FILTER = ROOT / "QuantumultX" / "filter" / "ad_black.conf"

DOMAIN_TYPES = {"DOMAIN", "DOMAIN-SUFFIX", "DOMAIN-KEYWORD", "DOMAIN-WILDCARD"}
IP_TYPES = {"IP-CIDR", "IP-CIDR6"}
SHADOWROCKET_TYPES = DOMAIN_TYPES | IP_TYPES | {
    "GEOIP",
    "IP-ASN",
    "URL-REGEX",
}
QUANTUMULT_TYPES = {
    "host",
    "host-keyword",
    "host-suffix",
    "host-wildcard",
    "ip-asn",
    "ip-cidr",
    "ip6-cidr",
}
LOCAL_RULE_URLS = {
    "ad_black.list": (
        "https://raw.githubusercontent.com/chyern/Proxy/main/"
        "Shadowrocket/rule/ad_black.list"
    ),
    "direct.list": (
        "https://raw.githubusercontent.com/chyern/Proxy/main/"
        "Shadowrocket/rule/direct.list"
    ),
    "proxy.list": (
        "https://raw.githubusercontent.com/chyern/Proxy/main/"
        "Shadowrocket/rule/proxy.list"
    ),
}


def effective_lines(path: Path) -> list[tuple[int, str]]:
    result = []
    for line_number, raw_line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        line = raw_line.strip()
        if line and not line.startswith(("#", ";", "//")):
            result.append((line_number, line))
    return result


def validate_shadowrocket_list(path: Path, errors: list[str]) -> int:
    lines = effective_lines(path)
    if not lines:
        errors.append(f"{path.relative_to(ROOT)}: no active rules")
        return 0

    seen: dict[str, int] = {}
    for line_number, line in lines:
        location = f"{path.relative_to(ROOT)}:{line_number}"
        if line in seen:
            errors.append(f"{location}: duplicate of line {seen[line]}")
        else:
            seen[line] = line_number

        parts = line.split(",")
        rule_type = parts[0].upper()
        if rule_type not in SHADOWROCKET_TYPES:
            errors.append(f"{location}: unsupported rule type {rule_type}")
            continue
        if len(parts) < 2 or not parts[1]:
            errors.append(f"{location}: missing rule value")
            continue

        value = parts[1]
        if rule_type in DOMAIN_TYPES and any(char.isspace() for char in value):
            errors.append(f"{location}: domain value contains whitespace")

        if rule_type in IP_TYPES:
            if len(parts) not in (2, 3):
                errors.append(f"{location}: IP rule must have 2 or 3 fields")
            elif len(parts) == 3 and parts[2] != "no-resolve":
                errors.append(f"{location}: unsupported IP option {parts[2]}")
            try:
                network = ipaddress.ip_network(value, strict=False)
                expected_version = 6 if rule_type == "IP-CIDR6" else 4
                if network.version != expected_version:
                    errors.append(f"{location}: address family does not match {rule_type}")
            except ValueError as exc:
                errors.append(f"{location}: invalid network: {exc}")
        elif rule_type == "IP-ASN":
            if (
                len(parts) not in (2, 3)
                or not value.isdigit()
                or int(value) <= 0
                or (len(parts) == 3 and parts[2] != "no-resolve")
            ):
                errors.append(f"{location}: invalid ASN")
        elif rule_type == "GEOIP":
            if len(parts) != 2 or not re.fullmatch(r"[A-Za-z]{2}", value):
                errors.append(f"{location}: invalid GEOIP country code")
        elif rule_type == "URL-REGEX":
            if len(parts) != 2:
                errors.append(f"{location}: URL-REGEX must have 2 fields")
            else:
                try:
                    re.compile(value)
                except re.error as exc:
                    errors.append(f"{location}: invalid URL regex: {exc}")
        elif len(parts) != 2:
            errors.append(f"{location}: domain rule must have 2 fields")

    return len(lines)


def validate_custom_config(errors: list[str]) -> None:
    content = CUSTOM_CONFIG.read_text(encoding="utf-8")
    lines = content.splitlines()

    for line_number, line in enumerate(lines, start=1):
        match = re.match(r"\s*include\s*=\s*(.+?)\s*$", line, re.IGNORECASE)
        if match:
            include_path = CUSTOM_CONFIG.parent / match.group(1)
            if not include_path.is_file():
                errors.append(
                    f"{CUSTOM_CONFIG.relative_to(ROOT)}:{line_number}: missing local "
                    f"include {match.group(1)}"
                )

    for name, url in LOCAL_RULE_URLS.items():
        if url not in content:
            errors.append(
                f"{CUSTOM_CONFIG.relative_to(ROOT)}: missing RULE-SET reference for {name}"
            )

    awa_lines = [line for line in lines if "TG-Twilight/AWAvenue-Ads-Rule" in line]
    if len(awa_lines) != 1:
        errors.append(
            f"{CUSTOM_CONFIG.relative_to(ROOT)}: expected one AWAvenue RULE-SET"
        )
    elif not re.search(r"/AWAvenue-Ads-Rule/[0-9a-f]{40}/", awa_lines[0]):
        errors.append(
            f"{CUSTOM_CONFIG.relative_to(ROOT)}: AWAvenue must be pinned to a commit SHA"
        )

    rewrite_patterns = []
    section = ""
    for line_number, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            section = stripped
            continue
        if section == "[URL Rewrite]" and stripped and not stripped.startswith("#"):
            pattern = stripped.split(maxsplit=1)[0]
            try:
                rewrite_patterns.append((line_number, re.compile(pattern)))
            except re.error as exc:
                errors.append(
                    f"{CUSTOM_CONFIG.relative_to(ROOT)}:{line_number}: invalid rewrite "
                    f"regex: {exc}"
                )

    for unwanted_url in (
        "http://wwwxg.cn/path",
        "http://wwwxgoogle.cn/path",
        "http://gXcn/path",
        "http://googleXcn/path",
    ):
        for line_number, pattern in rewrite_patterns:
            if pattern.search(unwanted_url):
                errors.append(
                    f"{CUSTOM_CONFIG.relative_to(ROOT)}:{line_number}: rewrite matches "
                    f"unrelated URL {unwanted_url}"
                )


def validate_quantumult_filter(errors: list[str]) -> int:
    lines = effective_lines(QUANTUMULT_FILTER)
    if not lines:
        errors.append(f"{QUANTUMULT_FILTER.relative_to(ROOT)}: no active rules")
        return 0

    seen: dict[str, int] = {}
    for line_number, line in lines:
        location = f"{QUANTUMULT_FILTER.relative_to(ROOT)}:{line_number}"
        if line in seen:
            errors.append(f"{location}: duplicate of line {seen[line]}")
        else:
            seen[line] = line_number

        parts = line.split(",")
        rule_type = parts[0].lower()
        if rule_type not in QUANTUMULT_TYPES:
            errors.append(f"{location}: unsupported Quantumult X type {parts[0]}")
            continue
        if len(parts) not in (3, 4) or parts[2] != "reject":
            errors.append(f"{location}: expected a reject rule")
            continue
        if rule_type == "ip-asn" and (
            len(parts) != 3 or not parts[1].isdigit() or int(parts[1]) <= 0
        ):
            errors.append(f"{location}: invalid Quantumult X ASN")
        if len(parts) == 4 and (
            rule_type not in {"ip-cidr", "ip6-cidr"} or parts[3] != "no-resolve"
        ):
            errors.append(f"{location}: invalid Quantumult X option")

    return len(lines)


def main() -> int:
    errors: list[str] = []
    shadowrocket_count = sum(
        validate_shadowrocket_list(path, errors) for path in SHADOWROCKET_LISTS
    )
    validate_custom_config(errors)
    quantumult_count = validate_quantumult_filter(errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(f"validation failed with {len(errors)} error(s)", file=sys.stderr)
        return 1

    print(
        f"validated {len(SHADOWROCKET_LISTS)} Shadowrocket lists "
        f"({shadowrocket_count} rules) and {quantumult_count} Quantumult X rules"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
