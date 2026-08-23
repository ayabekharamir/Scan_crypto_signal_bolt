# Architecture

## Overview

Aegis is built using **Clean Architecture** and **Domain-Driven Design (DDD)** principles, with strict separation of concerns and SOLID compliance.

## Layers

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│   (Pages, Layouts, Components, Context)    │
├─────────────────────────────────────────────┤
│            Service Layer                     │
│   (profile.service, audit.service, etc.)   │
├─────────────────────────────────────────────┤
│            Domain Layer                      │
│        (Types, Enums, Business Rules)        │
├─────────────────────────────────────────────┤
│          Infrastructure                      │
│   (Supabase client, i18n, router config)    │
└─────────────────────────────────────────────┘
```

### 1. Domain Layer (`src/types/`)
- TypeScript interfaces and type definitions
- Shared enums (MarketType, UserRole, AuditAction, etc.)
- No dependencies on other layers

### 2. Infrastructure (`src/lib/`)
- `supabase.ts` — Supabase client singleton
- `i18n.ts` — i18next configuration and locale helpers
- `utils.ts` — shared utility functions

### 3. Service Layer (`src/services/`)
- Data access objects for each domain entity
- `profile.service.ts` — profile CRUD
- `audit.service.ts` — audit log writes
- Each service is a set of pure async functions, no global state

### 4. Presentation Layer
- `src/pages/` — route-level page components
- `src/layouts/` — AppLayout (authenticated), AuthLayout (public)
- `src/components/` — reusable UI components
- `src/context/` — React contexts (AuthContext)

## Design Decisions

### Why Vite (not Next.js)?
Vite provides faster HMR, simpler configuration, and is well-suited for SPA-style applications. Server-side capabilities (Edge Functions, API proxying) are handled by Supabase Edge Functions.

### Why Supabase?
- PostgreSQL with Row Level Security (RLS)
- Built-in authentication (email/password)
- Edge Functions for server-side logic
- Real-time subscriptions (for future live data)
- Auto-generated TypeScript types

### Authentication Flow
1. User signs up via Supabase Auth (email/password)
2. A database trigger auto-creates a `profiles` row
3. A second trigger auto-creates `user_preferences` with defaults
4. The frontend `AuthContext` listens to `onAuthStateChange`
5. Protected routes are guarded by `AuthGuard`
6. Audit logs are written for login/logout/signup events

### Localization
- Default language: Persian (RTL)
- `i18next` manages translations
- `applyDocumentLocale()` sets `<html dir>` and `<html lang>` dynamically
- All user-facing strings use translation keys — no hardcoded text

### Theming
- Dark theme only (Phase 1)
- Custom Tailwind color system: primary (cyan), secondary (slate), accent (emerald), success, warning, error
- Surface color ramp for layered dark backgrounds

### PWA
- Configured via `vite-plugin-pwa`
- Auto-update service worker
- Standalone display mode
- Theme color matches app background

## Security

- **RLS** enabled on every table
- **Ownership-scoped policies** — users can only access their own data
- **RBAC** — `user`, `analyst`, `admin` roles (admin features in future phases)
- **Audit logging** — security-relevant actions are tracked
- **JWT** — Supabase handles token management
- **No service role key in frontend** — only anon key is used client-side

## Future Extensibility

The architecture is designed to support multiple markets from day one:
- `market_type` enum includes crypto, stock, forex, commodity, etf
- Asset table is market-agnostic
- Scoring/risk/evidence engines (Phase 3) operate on any market type
- AI reasoning, scenario, recommendation, and backtest engines (Phase 4) layer on top of scores, risk, and evidence
- Edge functions will proxy external APIs per market
