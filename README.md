# Deni AI

Deni AI is a versatile chat application that allows interaction with multiple AI models. Built with Next.js and Firebase, it provides an intuitive user interface.

## Key Features

- 🤖 **Multiple AI Model Support**: Interact with various AI models
- 🌐 **Internationalization**: English and Japanese interface
- 🔒 **Firebase Authentication**: Secure user authentication
- 📝 **Markdown Rendering**: Rich text format display
- 🖼️ **Image Upload**: Share images during chat
- 📱 **Responsive Design**: Optimized for mobile and desktop

## Project Structure

This project uses a Turbo repository monorepo structure:

```
├── apps
│   └── www                 # Main Next.js web application
└── packages
    ├── eslint-config       # Shared ESLint Configuration
    ├── firebase-config     # Firebase configuration
    ├── typescript-config   # Shared TypeScript Configuration
    ├── ui                  # Shared UI component library
    ├── voids-ap-provider   # AI provider integration package
    └── voids-oai-provider  # OpenAI compatible provider integration package
```

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Deployment**: Vercel (recommended)

## Creating Your Instance

### Prerequisites

- Node.js (v18.18.0) or later
- Bun (v1.2.7) or later
- Firebase Project Configuration (See "Firebase Configuration" below)
- (Optional) Brave Search API Key (for search)
- (Optional) Uploadthing Token (for image upload)s

#### Firebase Configuration

1. Create a Firebase project.
2. Enable Firebase Authentication and Firestore.
3. Configure Firebase SDK in the `.env.local` file.
4. (Optional) Create `deni-ai-conversation` collection in Firestore.

### Setup (Common)

- Clone the repository:

```bash
# Clone the repository
git clone https://github.com/raicdev/deni-ai.git
cd deni-ai
```

- Install dependencies:

```bash
# Install dependencies
bun install
```

### Setup (Locally)

- Configure environment variables:

```bash
cd apps/www

# Copy the .env.example file and rename it to .env.local
cp .env.example .env.local
```

> ***Note***: You must to edit the .env.local file and fill in the necessary information. For more information, please refer to the [Firebase Configuration](#firebase-configuration) section.

- Start development server:
```bash
# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to check the application.

### Setup (Deploy to Vercel)

#### Prerequisites

- Vercel account
- New Vercel project
- Vercel CLI installed

#### Steps

- Configure environment variables:
> ***Note***: You must to edit the Vercel Environment variables and fill in the necessary information. For more information, please refer to the [Firebase Configuration](#firebase-configuration) section.

- Deploy to Vercel:
```bash
# Deploy to Vercel
vercel
```

### Setup (Other Platforms)

- Configure environment variables:
> ***Note***: You must to edit the Your platform variables and fill in the necessary information. For more information, please refer to the [Firebase Configuration](#firebase-configuration) section.

- Deploy to Your platform:
> Please referer to the documentation of Your platform.
