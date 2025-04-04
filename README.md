<img alt="Deni AI" src="apps/www/public/assets/icon.svg" width="128">

# Deni AI

<a href="https://voids.top/"><img alt="Powered by Voids.top" src="https://img.shields.io/badge/Powered_by_Voids.top-000000.svg?style=for-the-badge&labelColor=000"></a>
<a href="https://github.com/raicdev/deni-ai" ><img alt="Preview CI" src="https://img.shields.io/github/deployments/raicdev/deni-ai/preview?style=for-the-badge&label=Preview"></a>
<a href="https://github.com/raicdev/deni-ai" ><img alt="Production CI" src="https://img.shields.io/github/deployments/raicdev/deni-ai/production?style=for-the-badge&label=Production"></a>


Deni AI is a versatile chat application that allows interaction with multiple AI models. Built with Next.js and Firebase, it provides an intuitive user interface.

## Table of Contents

- [Create Your Instance](#creating-your-instance)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Q&A](#qa)

## Creating Your Instance

To create your own instance, visit [Docs](https://deni-ai-docs.vercel.app/docs/).

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

## Credit

- [Next.js](https://nextjs.org/) - React framework for server-rendered applications
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Firebase](https://firebase.google.com/) - Backend-as-a-Service platform
- [Uploadthing](https://uploadthing.com/) - Image upload service
- [voids.top](https://voids.top/) - AI model provider

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **AI SDK**: Vercel AI SDK
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Deployment**: Vercel (recommended)

## Q&A

### Q: What is the purpose of this project?

A: This project aims to provide a user-friendly chat interface for interacting with AI models and make AI models accessible to many people.

### Q: How can I contribute to this project?

A: Contributions are welcome! Please refer to the [Contributing Guidelines](CONTRIBUTING.md) for more details.

### Q: How can I report a bug or suggest a feature?

A: Please use the [Issue Tracker](https://github.com/raicdev/deni-ai/issues) to report bugs or suggest features.

