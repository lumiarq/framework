# Changelog

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
