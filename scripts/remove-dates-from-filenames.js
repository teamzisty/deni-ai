const fs = require("fs");
const path = require("path");

// Target directory
const postsDir = path.join(
  process.cwd(),
  "apps",
  "docs",
  "docs",
  "blog",
  "posts",
);

// Regular expression to match date pattern in filename (YYYY-MM-DD-)
const datePattern = /^\d{4}-\d{2}-\d{2}-(.+)$/;

// Function to rename files and folders
async function removePostDatePrefix() {
  try {
    // Check if directory exists
    if (!fs.existsSync(postsDir)) {
      console.error(`Directory not found: ${postsDir}`);
      return;
    }

    // Get all files and folders in the directory
    const items = fs.readdirSync(postsDir);

    // Count for statistics
    let renamedFiles = 0;
    let renamedFolders = 0;
    let skippedItems = 0;

    // Process each item (file or folder)
    for (const item of items) {
      const itemPath = path.join(postsDir, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();

      // Process based on file type
      if (isDirectory || item.endsWith(".md")) {
        // Check if the item matches the date pattern
        const match = item.match(datePattern);
        if (match) {
          const newName = match[1]; // Extract the part after the date
          const oldPath = path.join(postsDir, item);
          const newPath = path.join(postsDir, newName);

          // Rename the item
          fs.renameSync(oldPath, newPath);

          if (isDirectory) {
            console.log(`Renamed folder: ${item} -> ${newName}`);
            renamedFolders++;
          } else {
            console.log(`Renamed file: ${item} -> ${newName}`);
            renamedFiles++;
          }
        } else {
          console.log(`Skipped: ${item} (no date pattern found)`);
          skippedItems++;
        }
      } else {
        console.log(`Skipped: ${item} (not a markdown file or directory)`);
        skippedItems++;
      }
    }

    console.log("\nSummary:");
    console.log(`- Files renamed: ${renamedFiles}`);
    console.log(`- Folders renamed: ${renamedFolders}`);
    console.log(`- Items skipped: ${skippedItems}`);
    console.log(
      `- Total items processed: ${renamedFiles + renamedFolders + skippedItems}`,
    );
  } catch (error) {
    console.error("Error processing files and folders:", error);
  }
}

// Run the script
removePostDatePrefix();
