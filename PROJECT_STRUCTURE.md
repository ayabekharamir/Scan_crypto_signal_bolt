# Project Structure

```
aegis/
├── .env                          # Environment variables (Supabase)
├── .bolt/                        # Bolt configuration
├── index.html                    # HTML entry point (RTL, Persian default)
├── package.json
├── postcss.config.js
├── tailwind.config.js            # Custom dark theme design system
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                # Vite + PWA + path alias
├── eslint.config.js
│
├── README.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── ROADMAP.md
├── CHANGELOG.md
├── PROJECT_STRUCTURE.md
│
├── public/                       # Static assets (PWA icons, favicon)
│
└── src/
    ├── main.tsx                  # React entry
    ├── App.tsx                   # Root: QueryClient + AuthProvider + Router
    ├── index.css                 # Tailwind + custom components
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── index.ts              # Domain types (Asset, Profile, Preferences, AuditLog)
    │
    ├── lib/
    │   ├── supabase.ts           # Supabase client singleton
    │   ├── i18n.ts               # i18next config + locale helpers
    │   └── utils.ts              # cn() class name utility
    │
    ├── locales/
    │   ├── fa.ts                 # Persian translations
    │   └── en.ts                 # English translations
    │
    ├── services/
    │   ├── profile.service.ts   # Profile CRUD
    │   ├── audit.service.ts     # Audit log writes
    │   ├── asset.service.ts     # Asset queries and price data
    │   ├── watchlist.service.ts # Watchlist CRUD
    │   ├── scoring.service.ts       # Scoring engine data access
    │   ├── risk.service.ts          # Risk engine data access
    │   ├── evidence.service.ts      # Evidence engine data access
    │   ├── scenario.service.ts      # Scenario engine data access
    │   ├── recommendation.service.ts # Recommendation engine data access
    │   ├── backtest.service.ts      # Backtest results data access
    │   ├── portfolio.service.ts    # Portfolio holdings + P&L
    │   ├── journal.service.ts      # Decision journal CRUD
    │   ├── alert.service.ts         # Alerts CRUD
    │   └── market-data.service.ts   # Live price refresh + alert checking
    │
    ├── context/
    │   └── AuthContext.tsx       # Auth state, signIn, signUp, signOut
    │
    ├── components/
    │   ├── auth/
    │   │   └── AuthGuard.tsx     # Protected route wrapper
    │   ├── common/
    │   │   ├── LoadingScreen.tsx
    │   │   ├── ErrorBoundary.tsx      # Global error boundary
    │   │   └── Toast.tsx             # Toast notification provider
    │   └── analysis/
    │       ├── ScorePanel.tsx          # Scoring engine display
    │       ├── RiskPanel.tsx           # Risk gauge + factors
    │       ├── EvidencePanel.tsx       # Evidence timeline
    │       ├── ScenarioPanel.tsx       # Scenario predictions
    │       ├── RecommendationPanel.tsx # AI recommendation
    │       └── BacktestPanel.tsx       # Backtest accuracy
    │
    ├── layouts/
    │   ├── AppLayout.tsx         # Authenticated layout (sidebar + topbar)
    │   └── AuthLayout.tsx        # Public layout (centered card)
    │
    ├── pages/
    │   ├── DashboardPage.tsx
    │   ├── ScannerPage.tsx
    │   ├── AssetDetailPage.tsx
    │   ├── WatchlistPage.tsx
    │   ├── PortfolioPage.tsx
    │   ├── JournalPage.tsx
    │   ├── AlertsPage.tsx
    │   ├── SettingsPage.tsx
    │   ├── NotFoundPage.tsx
    │   └── auth/
    │       ├── SignInPage.tsx
    │       └── SignUpPage.tsx
    │
    ├── router.tsx               # Route definitions (lazy-loaded)
    └── test/
        ├── setup.ts             # Vitest + jest-dom setup
        ├── utils.test.ts        # Unit tests for formatting utilities
        └── toast.test.tsx        # Toast provider tests
```

## Conventions

- **Imports:** Use `@/` alias for all `src/` imports
- **Types:** All types in `src/types/`, imported explicitly
- **Services:** Pure async functions, no global mutable state
- **Components:** One component per file, named exports
- **Locales:** All user-facing strings use i18n keys, no hardcoded text
- **Database:** All schema changes via Supabase migrations, RLS on every table
