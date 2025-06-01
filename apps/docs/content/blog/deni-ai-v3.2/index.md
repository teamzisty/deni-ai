---

title: Deni AI v3.2 Release
date: 2025-05-03
description: Introducing new features, bug fixes, and improvements in version 3.2.
author: rai
tags: [update]
---


We apologize for the delay in the release of Deni AI v3.2.

## Deni AI Dev (Official Release)

Deni AI Dev is your new development platform. Get ideas, build apps directly. Develop freely.

In this version, you can now interact with the terminal and sync sessions with the cloud.

![Deni AI Dev Preview](deni-ai-dev.png)
_Deni AI Dev Preview_

## Deep Research Evolves

The following changes have been made to Deep Research:

- **Modes**: Added modes to Deep Research. You can search in detail or quickly.
- **Mode: Shallow Research**: Executes fast and light research. Researches 1-3 times and outputs the results.
- **Mode: Advanced Research**: Executes more time-consuming advanced research. Researches 3-5+ times, analyzes, and then outputs the results.
- **Display Source Count**: The number of sources used in Deep Research is now displayed.
- **Display Research Status**: AI now sets and displays the progress.

![Evolved Research Preview](deep-research.png)
_Evolved Research Preview_

![Evolved Research Preview (2)](deep-research-sources.png)
_Evolved Research Preview (2)_

## Feature Changes

8 feature changes have been added in this version:

- Dev: Added the ability to input into the terminal.
- Dev: Added the ability to sync sessions to the cloud.
- Dev: Removed the feature to save the current session.
- Session: Changed to save to IndexedDB if saving to the cloud is not possible.
- Research: Added mode feature.
- Research: Added feature to display source count.
- Research: Added feature to display status.
- App: Changed the message when inference is complete.

## System Changes

1 system change has been made in this version:

- Updated dependencies for all projects.

## Future Plans

- **Deni AI CLI**: Development has been temporarily abandoned.
- **Deni AI API**: Deni AI's upcoming API platform. [Details](/blog/posts/deni-ai-api-preview)

For all changes not included in the patch notes, please see the [GitHub Pull requests](https://github.com/raicdev/deni-ai/pull/33).

> [!NOTE]
> The Deni AI repository has moved to https://github.com/raicdev/deni-ai. Future commits will be made to this repository.

::: info Note

The default branch has been changed to ``canary``. Please check the ``master`` branch for the release version.

:::
