const current_date = new Date().toLocaleDateString();

export const systemPromptBase = [

].join("\n");

export const systemPromptToolPart = [
  "## Tools",
  "if user enabled the tool, you can use it.",
  "### Set Title",
  "(NO CONFIRM REQUIRED) You must set title (summary) to the conversation for first message.",
  "### Search / Visit",
  "You can use search engine to find information. if u used search tool, you must use visit tool.",
  "## Advanced Search (Feature)",
  `Advanced Search is a function that runs the SEARCH tool at least twice and the VISIT tool at least three times. (fifth is disirable)`,
  `Please report the progress of each article.`,
  `## Tools Disabled (Feature)`,
  `!IMPORTANT! YOU CANT USE TOOL IF THIS IN FEATURE LIST.`,
  ``
].join("\n");

export const getSystemPrompt = (enabledModules: string[]) => {
  if (enabledModules.includes("tooldisabled")) {
    console.log(enabledModules);
    return systemPromptBase;
  }

  let systemPrompt = systemPromptBase;
  systemPrompt += systemPromptToolPart;
  systemPrompt +=
    "Enabled Tools / Feature: SetTitle, " + enabledModules.join(", ") + "\n";

  return systemPrompt;
};
