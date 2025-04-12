# Deni-AI Project Structure

This document explains the directory structure of the Deni-AI project.

## Root Directory

```
deni-ai/
├── .cursor/               # Cursor editor settings
├── .git/                  # Git repository information
├── .vscode/               # VSCode settings
├── apps/                  # Applications
├── packages/              # Shared packages
├── .gitignore             # Git exclusion file settings
├── bun.lock               # Bun lock file
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