# Vercel Deployment Issue — Root Cause Analysis

## Problem

The Express backend (TypeScript) deployed on Vercel returned **500 Internal Server Error** followed by **404 NOT_FOUND** after fixes.

## Root Causes (3 issues)

### 1. Module System Mismatch (500 Error)

**File:** `server/tsconfig.json` + `server/package.json`

- `tsconfig.json` had `"module": "ESNext"` — TypeScript compiled `import` statements into ES module syntax
- `package.json` had `"type": "commonjs"` — Node.js expected CommonJS `require()` syntax
- **Result:** Vercel's Node.js runtime threw `SyntaxError: Cannot use import statement outside a module`

**Fix:**

- Changed `tsconfig.json` → `"module": "commonjs"` (lowercase) and `"moduleResolution": "node"`
- Removed `.js` extensions from all relative imports (CommonJS resolves without extensions)

### 2. Missing Express App Export (404 Error)

**File:** `server/src/index.ts`

- The original code only called `app.listen(PORT)` to start the server
- Vercel's serverless runtime does **not** use `app.listen()` — it needs the Express app **exported** as a function it can invoke
- **Result:** Vercel couldn't find a handler function, returning 404

**Fix:**

- Added `module.exports = app;` at the bottom of `index.ts`
- Kept `app.listen()` only for local development (wrapped in `if (process.env.NODE_ENV !== "production")`)

### 3. Missing Root-Level vercel.json (Build Ignored)

**File:** `vercel.json` (at repository root)

- Vercel **only reads `vercel.json` from the repository root directory**
- The `server/vercel.json` was completely ignored during deployment
- **Result:** Build completed in 144ms with no TypeScript compilation — Vercel deployed nothing useful

**Fix:**

- Created a root-level `vercel.json` that points to `server/src/index.ts`:
  ```json
  {
    "version": 2,
    "buildCommand": "cd server && npx tsc",
    "builds": [
      {
        "src": "server/src/index.ts",
        "use": "@vercel/node"
      }
    ],
    "routes": [
      {
        "src": "/(.*)",
        "dest": "server/src/index.ts"
      }
    ]
  }
  ```

## Summary of All Changes

| File                   | Change                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `vercel.json` (root)   | **Created** — points to `server/src/index.ts`                   |
| `server/vercel.json`   | Removed `builds` and `functions` properties, kept only `routes` |
| `server/tsconfig.json` | `"module": "commonjs"`, `"moduleResolution": "node"`            |
| `server/src/index.ts`  | Added `module.exports = app;` for Vercel serverless             |
| 6 server source files  | Removed `.js` extensions from relative imports                  |

## Key Lesson

When deploying a monorepo (with `client/` and `server/` directories) to Vercel:

1. **`vercel.json` must be at the repository root** — Vercel ignores config files in subdirectories
2. **Export the Express app** — Vercel needs `module.exports = app`, not `app.listen()`
3. **Match module systems** — TypeScript output (`module` in tsconfig) must match `"type"` in package.json
