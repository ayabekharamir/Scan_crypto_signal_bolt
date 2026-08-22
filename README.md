# Aegis — AI Market Intelligence Platform

A production-grade AI-powered market intelligence platform focused initially on Cryptocurrency, with future support for Stocks, Forex, Commodities, and ETFs.

Aegis helps investors **understand** markets rather than simply displaying prices. Instead of showing `BTC = $120,000`, Aegis explains **why**, the **evidence**, the **risk**, the **confidence**, possible **scenarios**, and a **recommended action**.

## Languages

- **Persian (Farsi)** — default, RTL
- **English** — full support, LTR

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS (dark theme, custom design system) |
| State | React Query (TanStack Query) |
| Routing | React Router v6 |
| i18n | i18next + react-i18next |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| PWA | vite-plugin-pwa |

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

Aegis follows **Clean Architecture** and **Domain-Driven Design** principles:

- **Domain layer** — shared types, business rules
- **Service layer** — data access, external API integration
- **Presentation layer** — React components, pages, layouts
- **Infrastructure** — Supabase client, i18n, routing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

## Development Phases

This project is built phase by phase. See [ROADMAP.md](./ROADMAP.md) for the complete plan.

- [x] **Phase 1** — Project structure, environment, database, authentication, core architecture
- [x] **Phase 2** — Dashboard, navigation, localization, scanner, assets, watchlist
- [x] **Phase 3** — Scoring engine, risk engine, evidence engine
- [x] **Phase 4** — AI reasoning, scenario engine, recommendations, backtest
- [x] **Phase 5** — Portfolio, journal, watchlist, alerts
- [x] **Phase 6** — Live market data (CoinGecko), API caching, price refresh, alert checking
- [x] **Phase 7** — Code splitting, error boundary, toast notifications, unit tests

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture and design decisions
- [DATABASE.md](./DATABASE.md) — Database schema, tables, relationships, RLS
- [API.md](./API.md) — API reference (Edge Functions, services)
- [ROADMAP.md](./ROADMAP.md) — Development phases and future plans
- [CHANGELOG.md](./CHANGELOG.md) — Version history
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — Directory layout

## License

Proprietary — All rights reserved.
