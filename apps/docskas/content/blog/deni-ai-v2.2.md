---
title: Release of Deni AI v2.2
date: 2025-04-04T00:00:00+09:00
description: Introducing new features, bug fixes, and improvements in version 2.2.
author: rai
tags: [update]
---

## Localization (English in Beta)

We've implemented localization in beta. While some parts are still not localized, we plan to improve this through updates.

## Added High-End Models

We've added GPT 4.5 Preview, Claude 3.7 Sonnet (+ Extended Thinking), o1, and o3-mini (improved version).

| Model Name        | Official API Price (USD, input/output) |
| ----------------- | -------------------------------------- |
| GPT-4.5 Preview   | $75 / $150                             |
| Claude 3.7 Sonnet | $3 / $15                               |
| o1                | $15 / $60                              |
| o3-mini           | $1.1 / $4.4                            |

<small>Also, Gemini 2.0 Flash is working again!</small>

## Model Settings Improvements

Based on feedback about model settings being inconvenient, we've made improvements.

- Added model filters (model provider, features)
- Added colors to model setting features

## Bug Fixes

In this version, we fixed 1 bug.

- Fixed an issue where Gemini 2.0 Flash wasn't working

## Feature Changes

In this version, 5 feature changes were made.

- Added localization
- Model settings: Added filters
- Model settings: Added colors to features
- Account management menu: Added version information
- Models: Added GPT-4.5, Claude 3.7 Sonnet, o1, o3-mini

## System Changes

In this version, 2 system changes were made.

- Changed to Turborepo project structure
- Added `voids-oai-provider` and `voids-ap-provider` to enable Extended Thinking with Claude

### System Change Patch

In this patch, 1 system change was made.

<small>For details about this patch, please see [GitHub Pull requests](https://github.com/raicdev/deni-ai/pull/2).</small>

- Moved Firebase configuration files from `apps/www` to `packages/firebase-config`

For all changes not included in the patch notes, please see [GitHub Pull requests](https://github.com/raicdev/deni-ai/pull/1).

> [!NOTE]
> The Deni AI repository has been moved to https://github.com/raicdev/deni-ai. Future commits will be made to this repository.
