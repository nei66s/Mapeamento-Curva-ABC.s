Admin Module Cache

What: Added an in-memory cache for the `isModuleActive` helper used by admin API routes.

Why: Reduces repeated DB queries from frequently-called routes (metrics, audit, tracking).

How it works:
- The cache stores a boolean `is_active` value per module key with a TTL.
- Default TTL: 30 seconds.
- Controlled by env var `ADMIN_MODULE_CACHE_TTL_SEC` (seconds). Example: `ADMIN_MODULE_CACHE_TTL_SEC=60`.
- The helper first checks the cache; if expired or missing it queries `modules` via `modules-adapter.getModuleByKey`.
- For backward compatibility the helper will try both the literal key and the key with `admin-` stripped (e.g., `admin-analytics` -> `analytics`).

Notes:
- The cache is stored in `globalThis` and is process-local. For distributed setups use a shared cache (Redis) if needed.
- This is a lightweight optimization for dev/low-scale deployments. Adjust TTL as appropriate.
