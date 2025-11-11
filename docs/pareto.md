# Pareto Analysis (Incidents)

This document describes the Pareto analysis utilities and API available in the project.

What it provides
- Server helpers:
  - `getParetoItems(top = 7, groupBy = 'item' | 'title')` — aggregates incidents in the database and returns the top N groups with counts and percentages.
  - `getParetoByTitle(top = 7)` — convenience helper that groups by incident `title` (typical root-cause view).

- HTTP API:
  - `GET /api/incidents/pareto` — returns Pareto data. Query params:
    - `group` = `item` (default) or `title`
    - `top` = positive integer (default `7`)

Response shape

Each item in the response array has the shape:

```
{
  itemName: string,        // group label (title or item name)
  count: number,          // number of incidents in the group
  pct: number,            // percentage of total (rounded to 2 decimals)
  cumulativeCount: number,// cumulative count up to this row
  cumulativePct: number   // cumulative percentage (0-100)
}
```

Examples

- Fetch top 7 titles from the frontend:

```js
const res = await fetch('/api/incidents/pareto?group=title&top=7');
const pareto = await res.json();
// pareto is an array of rows as above
```

- Server-side usage (server-only code):

```ts
import { getParetoByTitle } from '@/lib/incidents.server';
const topTitles = await getParetoByTitle(7);
```

Notes and recommendations
- The server SQL uses window functions to compute percentages and cumulative sums efficiently.
- The frontend also contains a local Pareto aggregation in `src/components/dashboard/indicators/pareto-analysis.tsx` which by default now aggregates by incident `title` (with fallbacks) and limits to top 7 for UI rendering.
- If you need Pareto filtered by date ranges, consider adding `start`/`end` or `month` query params to the API and push filtering to the DB for better performance on large datasets.

---

Short and focused. If you want, I can add an example UI toggle or add date-range filters to the endpoint next.
