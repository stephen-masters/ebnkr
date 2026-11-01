# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/stephen-masters/ebnkr/security/advisories/new)
(Security tab → "Report a vulnerability"). Do not open a public issue for a
security problem.

## Supported versions

There are no releases. Only `main` is maintained.

## What is done to keep it safe

- The library has no runtime dependencies, so it brings nothing else into
  the projects that use it. CI checks that a production `npm audit` is empty.
- The development tooling is pinned in `package-lock.json` and scanned by
  npm audit and Trivy on every push and weekly on a schedule; Dependabot
  keeps it and the workflow actions current. CI publishes a CycloneDX SBOM.
- The validator never throws on untrusted input, and its regular expressions
  are anchored and free of nested quantifiers, so input length cannot make
  them backtrack.
- The registry data is generated at build time from a source pinned by tag
  and SHA-256; nothing is fetched at runtime.
