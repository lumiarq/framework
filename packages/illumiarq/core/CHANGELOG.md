# Changelog

## 1.1.5

### Patch Changes

- 57d6df8: Remove stale src JS drift with legacy @velo naming; ship dist-only npm tarball; document Illuminate-style namespace policy.
- b7c252e: Fix serverless request URL parsing and header normalization; remove illumiarq source JS drift; add Wave 1 CI gates and LTS policy.

All notable changes to `@illumiarq/core` are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.1.1] - 2026-05-26

### Added

- `parseRequestUrl()` for safe relative URL parsing on serverless runtimes.
- `headersToRecord()` for Web API Headers and Node.js IncomingMessage compatibility.

### Fixed

- Documented that `app()` is safe before boot (reads `APP_ENV` directly).

[Unreleased]: https://github.com/lumiarq/framework/compare/core-v1.1.1...HEAD
[1.1.1]: https://github.com/lumiarq/framework/releases/tag/core-v1.1.1
