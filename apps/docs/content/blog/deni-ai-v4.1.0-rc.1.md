---
title: Deni AI v4.1.0 RC 1 Release
date: 2025-06-14
description: Introducing new features, bug fixes, and improvements in version 4.1.0 RC 1.
author: rai
tags: [update]
---

## Two-Factor Authentication Now Functional

Two-factor authentication for Deni AI is now operational. This enhances security and strengthens account protection.

## Faster Syntax Highlighting

By using `react-shiki`, the speed of syntax highlighting has improved by more than three times.

## Feature Changes

Four features were changed in this version:

- App: Changed syntax highlighting logic to `react-shiki`
- App: Modified auto-scroll to stop after a certain amount of scrolling
- App: Added `o3-pro`
- App: Added usage limits (applied only to `o3-pro`, `claude-4-opus`, up to 30 times per day for each model)

## Bug Fixes

Three bugs were fixed in this version:

- App: Fixed an issue where action keys could not be used
- App: Fixed an issue where two-factor authentication could be bypassed
- App: Fixed homepage layout

## Other Changes

Two other changes were made in this version:

- Updated dependencies
- Changed GitHub Copilot instructions

For all changes not included in the patch notes, please see the [GitHub Pull requests](https://github.com/raicdev/deni-ai/pull/54).

> [!NOTE]
> The Deni AI repository has moved to https://github.com/raicdev/deni-ai. Future commits will be made to this repository.

> [!NOTE]
> The default branch has been changed to `canary`. For release versions, please check the `master` branch.

