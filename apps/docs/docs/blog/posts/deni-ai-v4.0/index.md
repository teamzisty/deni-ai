---
title: Deni AI v4.0 Release
date: 2025-05-22
description: Introducing new features, bug fixes, and improvements in version 4.0.
author: rai
tags: [update]
---

Introducing new features, bug fixes, and improvements in version 4.0.

This is the biggest Deni AI release yet.

<!-- more -->

## Deni AI Branches

Deni AI Branches is a feature that allows you to split conversations into multiple parts and advance each conversation independently.

You can create a branch that inherits the content of the conversation at the time of branch creation.

By creating branches, you can separate conversation content, allowing you to work on multiple projects simultaneously.

![Preview of Deni AI Branches](deni-ai-branches.png)
_Preview of Deni AI Branches_

## Deni AI Hub

Deni AI Hub is a feature that allows you to sort conversations.

Custom instructions, file attachments, and hub summarization features are scheduled to be added soon.

![Preview of Deni AI Hub](deni-ai-hubs.png)
_Preview of Deni AI Hub_

## Deni AI Bots

Deni AI Bots is a feature that allows you to create AI specialized for specific roles.

You can specify system prompts, and they will be publicly available to all users (privacy settings will be added in the future).

## Feature Changes

This version includes 13 feature changes:

- Deni AI Hubs: Added a feature to sort conversations.
- Deni AI Branches: Added a feature to split conversations into multiple parts.
- Deni AI Bots: Added a feature to create AI specialized for specific roles.
- Sessions: Added functionality to export/import development sessions.
- Sessions: Added functionality to delete all development sessions.
- App: Changed Vercel Analytics to be switchable.
- App: Updated the homepage with more detailed information.
- App: Updated the footer to add more detailed information.
- App: Changed the header design and added a dropdown menu.
- App: Added a language change function to the header.
- App: Changed features to be customizable.
- App: Added a loading state to the account manager.
- App: Simplified the dropdown menu in the account manager.

## Bug Fixes

- App: Added a loading state to the model page (fixed an issue where it would freeze).

## System Changes

This version includes 2 system changes:

- Updated dependencies for all projects.
- Migrated documentation from Docusaurus to VitePress.

## Future Plans

- **Deni AI CLI**: Development has been temporarily discontinued.
- **Intellipulse** NEW: An AI editor powered by Deni AI.
- **Deni AI API**: Deni AI's upcoming API platform. [Details](/blog/deni-ai-api-preview)

For all changes not included in the patch notes, please see the [GitHub Pull requests](https://github.com/raicdev/deni-ai/pull/33).

::: info Note

The Deni AI repository has moved to https://github.com/raicdev/deni-ai. Future commits will be made to this repository.

:::

::: info Note

The default branch has been changed to `canary`. For the release version, please check the `master` branch.

:::
