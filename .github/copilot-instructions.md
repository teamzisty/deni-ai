# Commit Message Guidelines

- If you generating commit messages, use the following format:
  - "feat: [description of the feature]"
  - "fix: [description of the bug fix]"
  - "docs: [description of the documentation update]"
  - "style: [description of the style change]"
  - "refactor: [description of the refactor]"
  - "test: [description of the test update]"
  - "chore: [description of the chore]"
  And after, add a brief description of the change in the body of the commit message.

---

# Technology Stack

## Core Technology

- TypeScript: ^5.0.0
- Node.js: ^20.0.0
- AI SDK: ^4.3.0
- Turborepo

## Frontend

- Next.js: ^15.3.0
- React: ^19.1.0
- Tailwind CSS: ^4.0
- shadcn/ui (New cli is shadcn@latest): ^2.1.8

## Backend

- Firebase: ^11.6.0
- Firebase Admin: ^13.2.0

## Development Tools

- TypeScript: ^5.0.0
- pnpm: ^10.0.0
- ESLint: ^9.0.0

---

# Directory Structure

## Root Directory

```
deni-ai/
├── .cursor/               # Cursor editor settings
├── .git/                  # Git repository information
├── .vscode/               # VSCode settings
├── apps/                  # Applications
├── packages/              # Shared packages
├── .gitignore             # Git exclusion file settings
├── pnpm-lock.yaml         # pnpm lock file
├── LICENSE.md             # License information
├── package.json           # Project settings
├── README.md              # Project description
├── technologystack.md     # Technology stack information
├── tsconfig.json          # TypeScript settings
└── turbo.json             # Turborepo settings
```

## Applications (apps/)

```
apps/
├── docs/                  # Documentation site (Docusaurus)
│   ├── .docusaurus/       # Docusaurus generated files
│   ├── blog/              # Blog posts
│   ├── build/             # Build output
│   ├── docs/              # Documentation
│   ├── i18n/              # Internationalization
│   ├── src/               # Source code
│   ├── static/            # Static files
│   ├── .gitignore         # Git exclusion file settings
│   ├── docusaurus.config.ts # Docusaurus configuration
│   ├── package.json       # Package settings
│   ├── README.md          # Description
│   ├── sidebars.ts        # Sidebar settings
│   └── tsconfig.json      # TypeScript settings
│
└── www/                   # Web application (Next.js)
    ├── .next/             # Next.js generated files
    ├── .turbo/            # Turbo generated files
    ├── app/               # Application root
    ├── components/        # Components
    ├── context/           # React contexts
    ├── hooks/             # Custom hooks
    ├── i18n/              # Internationalization
    ├── lib/               # Libraries
    ├── messages/          # Translation messages
    ├── public/            # Public files
    ├── utils/             # Utility functions
    ├── .env               # Environment variables
    ├── .env.example       # Environment variables example
    ├── components.json    # Components configuration
    ├── eslint.config.js   # ESLint configuration
    ├── middleware.ts      # Next.js middleware
    ├── next-env.d.ts      # Next.js type definitions
    ├── next.config.ts     # Next.js configuration
    ├── package.json       # Package settings
    ├── postcss.config.mjs # PostCSS configuration
    ├── README.md          # Description
    └── tsconfig.json      # TypeScript settings
```

## Shared Packages (packages/)

```
packages/
├── eslint-config/         # Shared ESLint configuration
├── firebase-config/       # Firebase configuration
├── typescript-config/     # Shared TypeScript configuration
├── ui/                    # Shared UI components
├── voids-ap-provider/     # Voids API provider
└── voids-oai-provider/    # Voids OpenAI provider
```

- Don't try to start dev server - I am already running it.
- Don't try to build the project.
- Don't try to tests.
