"use client";

type MarkdownNode = {
  children?: MarkdownNode[];
  lang?: string;
  type?: string;
  value?: string;
};

const HTML_BLOCK_PREFIX = /^(<!DOCTYPE|<!--|<\/?[a-z][\w:-]*[\s>])/i;

const shouldConvertHtmlToCodeBlock = (value: string) => {
  const trimmed = value.trim();
  return trimmed.includes("\n") && HTML_BLOCK_PREFIX.test(trimmed);
};

const transformHtmlNodes = (nodes?: MarkdownNode[]) => {
  if (!nodes) {
    return;
  }

  for (const node of nodes) {
    if (node.type === "html" && typeof node.value === "string") {
      if (shouldConvertHtmlToCodeBlock(node.value)) {
        node.type = "code";
        node.lang = "html";
        node.value = node.value.replace(/\n$/, "");
      }
      continue;
    }

    transformHtmlNodes(node.children);
  }
};

export const htmlCodeBlockRemarkPlugin = () => (tree: MarkdownNode) => {
  transformHtmlNodes(tree.children);
};
