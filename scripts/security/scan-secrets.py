#!/usr/bin/env python3
"""Repository secret scan used by CI (finding SC-12).

Fails when a tracked file contains something that looks like a live credential or a forbidden
artifact type. It never prints the matched value, only the file, line and rule, so the CI log
cannot itself leak a secret.

    python3 scripts/security/scan-secrets.py            # scan tracked files
    python3 scripts/security/scan-secrets.py --all       # include untracked, non-ignored files

Known-bad values that are referenced on purpose (for example the formerly hardcoded JWT key,
which tests prove is REJECTED) are allowed only in the files listed in ALLOWED_REFERENCES.
"""
import re
import subprocess
import sys
from pathlib import Path

FORBIDDEN_FILE_PATTERNS = [
    (re.compile(r"(^|/)(ui_)?token[^/]*\.txt$", re.I), "token dump file"),
    (re.compile(r"\.(zip|pfx|p12|publishsettings)$", re.I), "build package or certificate archive"),
    (re.compile(r"(^|/)\.env$"), "environment file"),
]

RULES = [
    ("jwt", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("openai-key", re.compile(r"sk-(proj-)?[A-Za-z0-9_-]{32,}")),
    ("google-api-key", re.compile(r"AIza[0-9A-Za-z_-]{35}")),
    ("private-key", re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("former-hardcoded-jwt-key", re.compile(r"olmies_super_secret_development_key_2026_xyz123")),
    ("former-default-admin-password", re.compile(r"superadmin123")),
    ("azure-storage-key", re.compile(r"AccountKey=[A-Za-z0-9+/=]{40,}")),
    ("postgres-url-password", re.compile(r"postgres(ql)?://[^:/\s]+:(?!<|\$\{|REPLACE)[^@\s]{4,}@")),
    ("connection-string-password", re.compile(r"Password=(?!REPLACE|<|\$|\{|;|\"|not-a-real-password|local-only-synthetic|olmies_pass\b|Your_Password)[^;\"'\s]{6,}", re.I)),
]

# Files allowed to MENTION a known-bad value because they prove it is rejected or document it.
ALLOWED_REFERENCES = {
    # Firebase Android client configuration. The API key in it is a public client identifier by
    # Firebase design; it must be restricted to the app's package and SHA-1 in Google Cloud.
    "google-api-key": {"google-services.json"},
}

SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".woff", ".woff2", ".ttf", ".dll", ".pdb", ".exe", ".lock"}
SKIP_PREFIXES = ("node_modules/", "src/Olmies.UI/node_modules/")


def tracked_files(include_untracked: bool):
    args = ["git", "ls-files", "-z"]
    if include_untracked:
        args += ["--cached", "--others", "--exclude-standard"]
    out = subprocess.run(args, capture_output=True, check=True).stdout.decode()
    return [f for f in out.split("\0") if f]


def main() -> int:
    include_untracked = "--all" in sys.argv
    findings = []
    for path in tracked_files(include_untracked):
        if not Path(path).exists():
            continue
        for pattern, reason in FORBIDDEN_FILE_PATTERNS:
            if pattern.search(path):
                findings.append((path, 0, f"forbidden file type: {reason}"))
        if path.startswith(SKIP_PREFIXES) or Path(path).suffix.lower() in SKIP_SUFFIXES:
            continue
        try:
            text = Path(path).read_text(encoding="utf-8", errors="strict")
        except (UnicodeDecodeError, OSError):
            continue
        for number, line in enumerate(text.splitlines(), 1):
            for name, rule in RULES:
                if rule.search(line) and path not in ALLOWED_REFERENCES.get(name, set()):
                    findings.append((path, number, name))

    for path, line, rule in findings:
        print(f"SECRET-SCAN FAIL  {path}:{line}  [{rule}]")
    print(f"secret scan: {len(findings)} finding(s)")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
