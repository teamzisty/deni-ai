---

title: Release of Deni AI v2.2.2
date: 2025-04-06
description: Introducing new features, bug fixes, and improvements in version 2.2.2
author: rai
tags: [update]
---

Introducing new features, bug fixes, and improvements in version 2.2.2.

<!-- more -->

## Claude is Available Again

Fixed the issue where Claude 3.7 Sonnet was temporarily not generating any output and the error occurring with Claude 3.5 Sonnet.

## Performance Improvements

Improved performance when AI is generating content.

## Layout Fix

Fixed an issue where unintended layout changes occurred when AI used the search function.

## New Theme Added

Added a new purple-based theme. This change can be reverted by enabling the "Use Legacy Theme" option in Settings.

## Bug Fixes

In this version, 4 bugs were fixed.

- Model: Fixed issue where Claude 3.7 Sonnet was not generating any messages
- Model: Fixed error occurring with Claude 3.5 Sonnet
- App: Fixed unintended layout changes when AI used the search function
- Settings: Fixed DeepSeek logo in model settings

## Feature Changes

In this version, 3 feature changes were made.

- App: Improved performance during AI generation
- App: Added new theme
- Internal: Changed maximum tokens for Claude usage

## Other Changes

In this version, 1 other changes were made.

- Changed `staleTimes` to disabled in `next.config.ts`

For all changes not included in the patch notes, please check [GitHub Pull requests](https://github.com/raicdev/deni-ai/pull/4).

::: info Note

The Deni AI repository has been moved to https://github.com/raicdev/deni-ai. Future commits will be made to this repository.

:::