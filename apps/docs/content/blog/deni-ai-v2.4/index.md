---
title: Deni AI v2.4 Release
date: 2025-04-12
description: Discover the new features, bug fixes, and improvements in version 2.4.
author: rai
tags: [update]
---

Here are the new features, bug fixes, and improvements in version 2.4.

**TLDR;** Account Manager, Chat Synchronization

## New Account Manager

We now have a new way to manage your accounts, including account data management, passwords, and security. Account information that was previously unmanageable is now manageable.

![Account Manager Preview](account-manager.png)
_Account Manager Preview_

## Mandatory Email Verification

Email verification is now mandatory for official instances. This measure is to reduce excessive load on the platform. We apologize for any inconvenience.

![Email Verification Preview](email-verification.png)<br />
_Email Verification Preview_

## Automatic Chat Synchronization

Your chats are now stored in the cloud instead of locally. This feature is automatically disabled if Firebase is not configured when using an instance.

## Bug Fixes

We fixed three bugs in this version:

- Fixed an issue where email addresses overflowed.
- Improved an issue where some models did not work.
- Fixed an issue where the regeneration feature did not work.

## Feature Changes

We made twelve feature changes in this version:

- App: Changed email verification to mandatory (redirects to initial setup if not done)
- App: Changed the design of notifications (alerts)
- App: Added analytics
- App: Updated GPT-4o version (`gpt-4o-2024-08-06` > `gpt-4o-2024-11-20`)
- App: Added Advanced Search (Send full page results)
- Account: Added a feature to manage two-factor authentication
- Account: Added a feature to change passwords
- Account: Added a feature to download all account data
- Account: Added an action menu
- Settings: Added an account manager
- Settings: Removed the ability to change name and profile picture in account settings
- Translation: Improved Japanese translation

## System Changes

We made five system changes in this version:

- Added `date-fns` and `qrcode.react` for QR code generation
- Added `@vercel/analytics` for analytics
- Added `StatusAlert` to manage the appearance of alerts
- Removed legacy theme style files
- Renamed `AdvancedSearchButton` to `DeepResearchButton`

For all changes not included in the patch notes, see the [GitHub Pull Requests](https://github.com/raicdev/deni-ai/pull/6).

::: info Note

The Deni AI repository has moved to https://github.com/raicdev/deni-ai. Commits will be made to this repository going forward.

:::

::: info Note

Old version branches will not be deleted in the future. Please be careful not to accidentally refer to the source code of the old version.

:::
