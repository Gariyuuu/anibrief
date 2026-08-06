# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notably: the `middleware.ts` convention was renamed to `proxy.ts` (exported function `proxy`, not `middleware`) as of this Next.js version — see `src/proxy.ts`.
