import { useEffect, useState } from "react";

/**
 * A custom React hook for managing the document title.
 *
 * @param defaultTitle - The default title to set when the component mounts
 * @returns An object containing the current title and a function to update it
 */
export function useTitle({ defaultTitle = "" }: { defaultTitle?: string }) {
  const [title, setTitle] = useState<string>(defaultTitle);

  useEffect(() => {
    // Update the document title when the title state changes
    document.title = title + " | Deni AI";
  }, [title]);

  // Function to update the title
  const updateTitle = (newTitle: string) => {
    setTitle(newTitle);
  };

  return {
    title,
    setTitle: updateTitle,
  };
}
