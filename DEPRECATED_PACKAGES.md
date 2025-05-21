# Deprecated packages in mvp-loja-mae

This repository currently relies on several packages that are marked as deprecated in the lock files.
The following list was extracted from `pnpm-lock.yaml` and `package-lock.json`.

| Package | Reason / Suggested replacement |
| --- | --- |
| `@humanwhocodes/config-array@0.13.0` | Use `@eslint/config-array` instead |
| `@humanwhocodes/object-schema@2.0.3` | Use `@eslint/object-schema` instead |
| `eslint@8.57.1` | Version is no longer supported |
| `glob@7.2.3` | Versions prior to v9 are no longer supported |
| `inflight@1.0.6` | Deprecated, leaks memory. Use `lru-cache` |
| `rimraf@2.7.1` and `rimraf@3.0.2` | Versions prior to v4 are no longer supported |
| `rollup-plugin-terser@7.0.2` | Deprecated, use `@rollup/plugin-terser` |
| `sourcemap-codec@1.4.8` | Use `@jridgewell/sourcemap-codec` |
| `uuid@3.3.2` | Upgrade to version 7 or higher |
| `workbox-* 6.6.0` | Not maintained with GA v4 |

Updating dependencies to versions that no longer rely on these packages is recommended.
