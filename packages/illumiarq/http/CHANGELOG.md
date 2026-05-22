# @illumiarq/http

## 1.1.3

### Patch Changes

- 06caae6: Wave 1 framework stabilization fixes.
  - fix(http): parse request URL with a safe base in traze middleware to handle relative URLs in serverless environments.
  - fix(runtime): normalize request header extraction to support both `Headers` and plain-object header shapes.
  - fix(runtime): invoke optional `onError` hook via request-scoped handler flow without relying on unsupported router-level API.
