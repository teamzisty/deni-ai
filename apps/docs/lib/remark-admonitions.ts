import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";

interface TextNode extends Node {
  type: "text";
  value: string;
}

interface ParagraphNode extends Parent {
  type: "paragraph";
  children: Node[];
}

interface HtmlNode extends Node {
  type: "html";
  value: string;
}

const admonitionTypes = {
  tip: {
    className: "admonition-tip",
    title: "Tip",
    color: "blue",
    icon: "💡",
  },
  warning: {
    className: "admonition-warning",
    title: "Warning",
    color: "yellow",
    icon: "⚠️",
  },
  danger: {
    className: "admonition-danger",
    title: "Danger",
    color: "red",
    icon: "🚨",
  },
} as const;

type AdmonitionType = keyof typeof admonitionTypes;

// Plugin to transform ::: admonition blocks
function remarkAdmonitions() {
  return (tree: Node) => {
    visit(
      tree,
      "paragraph",
      (node: ParagraphNode, index: number, parent: Parent) => {
        if (!node.children || node.children.length === 0) return;

        const firstChild = node.children[0] as TextNode;
        if (!firstChild || firstChild.type !== "text") return;

        // Check for opening admonition syntax
        const match = firstChild.value.match(/^:::(\w+)(?:\s(.*))?$/);
        if (!match) return;

        const [, type, title] = match;
        const config = admonitionTypes[type as AdmonitionType];
        if (!config) return;

        // Find the closing ::: block
        const contentNodes: Node[] = [];
        let endIndex = index + 1;

        while (endIndex < parent.children.length) {
          const currentNode = parent.children[endIndex] as ParagraphNode;

          if (currentNode.type === "paragraph" && currentNode.children) {
            const textNode = currentNode.children[0] as TextNode;
            if (
              textNode &&
              textNode.type === "text" &&
              textNode.value.trim() === ":::"
            ) {
              break;
            }
          }

          contentNodes.push(currentNode);
          endIndex++;
        }

        // Convert content nodes to HTML
        const contentHtml = contentNodes
          .map((contentNode) => {
            if (contentNode.type === "paragraph" && "children" in contentNode) {
              const paragraphNode = contentNode as ParagraphNode;
              const textContent = paragraphNode.children
                .filter((child: Node) => child.type === "text")
                .map((child: Node) => (child as TextNode).value)
                .join("");
              return `<p>${textContent}</p>`;
            }
            return "";
          })
          .join("");

        // Create admonition HTML
        const displayTitle = title || config.title;
        // Define base Tailwind classes
        const baseContainerClasses = "p-4 mb-4 rounded-md border-l-4";
        const headerClasses = "flex items-center"; // Removed mb-2, will add to title/icon wrapper if needed or content div
        const iconClasses = "mr-2 text-xl";
        const titleBaseClasses = "font-semibold";
        // Content wrapper class, ensures spacing if header is present and for content itself
        const contentWrapperClasses = "admonition-content"; // Keep original class for potential existing styles or make it 'mt-2' if header always exists

        // Generate type-specific Tailwind classes based on config.color
        // This assumes config.color matches Tailwind color names (e.g., 'blue', 'red', 'yellow')
        const typeContainerClasses = `bg-${config.color}-100 border-${config.color}-500 text-${config.color}-800`; // Lighter shade for background, border, and text
        const typeTitleClasses = `text-${config.color}-800`; // Darker shade for title

        const admonitionHtml = `
<div class="${baseContainerClasses} ${typeContainerClasses}" data-admonition-type="${type}">
  <div class="${headerClasses}">
    <span class="${iconClasses}">${config.icon}</span>
    <span class="${titleBaseClasses} ${typeTitleClasses}">${displayTitle}</span>
  </div>
  <div class="${contentWrapperClasses}">
    ${contentHtml}
  </div>
</div>`.trim();

        const htmlNode: HtmlNode = {
          type: "html",
          value: admonitionHtml,
        };

        // Replace the range of nodes with the admonition
        parent.children.splice(index, endIndex - index + 1, htmlNode);
      }
    );
  };
}

export default remarkAdmonitions;
