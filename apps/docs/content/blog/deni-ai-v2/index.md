---

title: Release of Deni AI v2
date: 2025-03-28
description: Introducing new features, bug fixes, and improvements in version 2.0.
author: rai
tags: [update]
---

## Search and Advanced Search

New search feature for quick news searches. Advanced search for detailed inquiries.

![Search and Advanced Search](search-feature.png)
*Search and Advanced Search*

## Dynamic Island-style Indicator

New indicator. Change models, stop generation, switch themes to change the mood. This keeps the message box clean.

![Dynamic Island-style Indicator](dynamic-island.png)<br />
*Dynamic Island-style Indicator*

## Chat Groups by Date

The previously cluttered chat list is now more organized with date grouping. Great news for those with many chats!

![Chat Groups by Date](session-grouping.png)<br />
*Chat Groups by Date*

## Bug Fixes

In this version, we fixed 2 bugs.

- Fixed spacing between login/logout buttons
- Fixed an issue where some models could be used without signing in

## Feature Changes

In this version, 10 feature changes were made.

- Added search and advanced search features
- Removed inference effort selection
- Added session grouping (Today, Yesterday, This Week...)
- Added Dynamic Island-style indicator
- Changed theme to Slate
- Added 404 error page
- Added other error screens
- Added account management menu to sidebar
- Added View Transitions (page transition animations)
- Added links to Markdown components
- Modified system prompt for new tools (like search)
- Removed GPT-4o (New) [gpt-4o-2024-11-20] due to instability

## System Changes

In this version, 3 system changes were made.

- Changed image upload provider from s.kuku.lu to UploadThing
- Added AuthProvider for sidebar account management menu
- Added `not-found.tsx`, `error.tsx`, `loading.tsx`

For all changes not included in the patch notes, please see [GitHub Pull requests](https://github.com/raicdev/upl-next/pull/4).

> [!NOTE]
> The Deni AI repository has been moved to https://github.com/raicdev/deni-ai. Future commits will be made to this repository.
