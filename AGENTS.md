# AGENTS.md

Guidance for anyone working in this repository with a coding agent (Claude
Code, Codex, Cursor, Gemini CLI or whatever else reads this file) and a fair
summary of the house rules for contributors who use none.

## What this repository is

**ebnkr** is a small TypeScript library that validates and formats IBANs
against ISO 13616-1 and the SWIFT IBAN Registry. It is an ES module with no
runtime dependencies, and it must keep running in browsers as well as Node.
It isn't published to npm (`"private": true`).

## Hard rules

### No runtime dependencies, no Node built-ins in src/

`dependencies` stays empty. ESLint rejects `node:` imports under `src/`,
because the library runs in browsers. Development tooling is fine.

### validateIban and isValidIban never throw

They take `unknown` and return a result for any input at all. A property test
feeds them arbitrary values and strings; keep it passing. The formatting and
check-digit functions throw `TypeError` or `RangeError` on bad arguments, as
documented.

### Check characters before changing case

`toUpperCase()` turns some non-ASCII letters into ASCII ones (`ß` into `SS`,
the dotless `ı` into `I`). Validation tests the characters first and changes
the case afterwards. Keep it in that order.

### src/registry.ts is generated

Never edit it by hand. Change `scripts/build-registry.mjs`, or move it to a
new registry release by updating `SCHWIFTY_TAG` and `SCHWIFTY_SHA256`, then
run `npm run registry`. CI regenerates the file and fails if it differs from
the committed one. A registry change alters what the library accepts, so it
is a `feat:` commit, never a `fix:`, and its message names the countries that
changed.

### The tests are the specification

Coverage is held at 100% of lines, branches and functions
(`npm run test:coverage`). The property tests in `test/properties.test.ts`
state what ISO 7064 MOD 97-10 guarantees, with the arithmetic in comments.
`test/reference.ts` is a deliberately different BigInt implementation of the
checksum, for checking the library against. Don't make it share code with
`src/`. Don't weaken an assertion to make a change pass.

## Layout

| Path | What |
|---|---|
| `src/iban.ts` | Validation, formatting and check digits |
| `src/registry.ts` | Generated: the SWIFT IBAN Registry entries |
| `src/index.ts` | The public API |
| `scripts/build-registry.mjs` | Generates `src/registry.ts` from a pinned, checksummed source |
| `test/*.test.ts` | Node's built-in test runner, with fast-check for properties |
| `test/smoke.mjs` | Imports the built `dist/` through the package's exports |
| `.githooks/commit-msg` | Conventional Commits check, shared from `scattercode/release-pipelines` |

## Checks

```bash
nvm use
npm run check   # lint, type-check, coverage, build and smoke test
```

`npm run check` must pass before a commit. The lefthook hooks lint the staged
files before each commit and run `npm run check` before each push. CI runs the
tests on Node 22, 24 and 26, regenerates the registry, and runs npm audit and
Trivy.

## Conventions

- British English; sentence case for headings.
- Conventional Commits, enforced by `.githooks/commit-msg` and, for pull
  request titles, by `pr-title.yml`. Dependency updates are `build:`,
  workflow changes `ci:`.
- `.githooks/commit-msg` is a byte-for-byte copy of the template in
  `scattercode/release-pipelines`; CI checks it has not drifted. Change it
  there, not here.
- `main` is protected: changes arrive through pull requests with the CI
  checks passing.
- Hook setup in a fresh clone: `npm install` runs `lefthook install`.
