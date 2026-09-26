# We Studio Enterprise — Security Baseline

## Runtime security
- API credentials are held only in runtime memory and, for restart/session continuity, `chrome.storage.session` with `TRUSTED_CONTEXTS`; they are never written to `chrome.storage.local` or the exported state.
- Backup export/import deliberately excludes `gapGptApiKey`.
- API requests require HTTPS and are restricted to `api.gapgpt.app`.
- Host permissions are restricted to the trusted API origin.
- The extension CSP does not allow `http:` or arbitrary `https:` connections.
- Imported state is schema-validated, size-limited, and stripped of unknown top-level fields.
- User-controlled history/brand/version strings rendered through HTML are escaped. Dangerous object keys (`__proto__`, `prototype`, `constructor`) are rejected during JSON sanitization to reduce prototype-pollution risk.

## Supply-chain / release verification
This ZIP contains no `package.json`, npm/yarn/pnpm lockfile, vendored runtime dependency, or build-time third-party package manifest. The shipped code is plain extension JavaScript/CSS/HTML. For Enterprise release pipelines, keep the release ZIP plus a cryptographic checksum and run secret scanning, SAST, and dependency/SCA checks as release gates even when the dependency inventory is empty.

## Known design constraint
The UI exposes a Base URL field, but the hardened build intentionally accepts only the trusted `https://api.gapgpt.app` host. Supporting arbitrary third-party gateways safely would require an explicit permission/allowlist model or a controlled backend proxy.
