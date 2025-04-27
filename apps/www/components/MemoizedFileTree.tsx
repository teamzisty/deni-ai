import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  ImageIcon,
  FileIcon,
  Plus,
  FolderIcon,
} from "lucide-react";
import { memo } from "react";

export const MemoizedFileTree = memo(
  ({
    structure,
    parentPath = "/",
    expandedDirs, // Prop
    selectedFile, // Prop
    toggleDir, // Prop
    handleFileClick, // Prop
    createNewFile, // Prop
    createNewDirectory, // Prop
  }: {
    structure: { [key: string]: any };
    parentPath?: string;
    expandedDirs: Set<string>;
    selectedFile: string | null;
    toggleDir: (path: string, event?: React.MouseEvent) => Promise<void>;
    handleFileClick: (path: string, isImage: boolean) => void;
    createNewFile: (dirPath: string) => Promise<void>;
    createNewDirectory: (parentPath: string) => Promise<void>;
  }) => {
    // Skip rendering if structure is empty
    if (Object.keys(structure).length === 0) {
      return (
        <div className="pl-4 text-xs text-muted-foreground">
          空のディレクトリ
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {Object.keys(structure)
          .sort((a, b) => {
            // Sort directories first, then files
            const aIsDir = structure[a].type === "directory";
            const bIsDir = structure[b].type === "directory";
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            // Alphabetical within same type
            return a.localeCompare(b);
          })
          .map((name) => {
            const item = structure[name];
            // pathが提供されていない場合は、親パスとファイル名から生成
            const path = item.path || `${parentPath === "/" ? "" : parentPath}/${name}`.replace(/\/+/g, '/');
            const isDir = item.type === "directory";
            const isExpanded = expandedDirs.has(path); // Use prop

            return (
              <div key={path} className="pl-2">
                <div
                  className={`flex items-center rounded-sm py-1 px-2 cursor-pointer hover:bg-accent group ${
                    selectedFile === path ? "bg-accent" : "" // Use prop
                  }`}
                  onClick={(e) => {
                    if (isDir) {
                      toggleDir(path, e); // Use prop
                    } else {
                      handleFileClick(path, item.isImage); // Use prop
                    }
                  }}
                >
                  {isDir ? (
                    <div className="flex items-center text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown size={14} className="mr-1" />
                      ) : (
                        <ChevronRight size={14} className="mr-1" />
                      )}
                      {isExpanded ? (
                        <FolderOpen size={16} className="mr-2" />
                      ) : (
                        <Folder size={16} className="mr-2" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-muted-foreground">
                      <div className="w-3 mr-1"></div>
                      {item.isImage ? (
                        <ImageIcon size={16} className="mr-2" />
                      ) : (
                        <FileIcon size={16} className="mr-2" />
                      )}
                    </div>
                  )}
                  <span className="text-sm truncate">{name}</span>

                  {/* ファイルアクション */}
                  {path && (
                    <div className="ml-auto hidden group-hover:flex space-x-1 items-center">
                      {/* ディレクトリの場合: 新規ファイル/フォルダ作成アクション */}
                      {isDir && (
                        <>
                          <button
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              createNewFile(path); // Use prop
                            }}
                            title="新規ファイル"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              createNewDirectory(path); // Use prop
                            }}
                            title="新規フォルダ"
                          >
                            <FolderIcon size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* サブディレクトリ */}
                {isDir &&
                  isExpanded &&
                  item.children &&
                  Object.keys(item.children).length > 0 && (
                    <div className="pl-3 border-l border-border">
                      <MemoizedFileTree
                        structure={item.children}
                        parentPath={path}
                        // Pass down the props recursively
                        expandedDirs={expandedDirs}
                        selectedFile={selectedFile}
                        toggleDir={toggleDir}
                        handleFileClick={handleFileClick}
                        createNewFile={createNewFile}
                        createNewDirectory={createNewDirectory}
                      />
                    </div>
                  )}
              </div>
            );
          })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function: Rerender only if structure, selectedFile, or expandedDirs change significantly
    if (prevProps.selectedFile !== nextProps.selectedFile) return false;

    // Compare expandedDirs Sets
    if (
      prevProps.expandedDirs.size !== nextProps.expandedDirs.size ||
      ![...prevProps.expandedDirs].every((dir) =>
        nextProps.expandedDirs.has(dir)
      )
    ) {
      return false;
    }

    // Compare structure shallowly for performance (deep comparison is costly)
    const prevKeys = Object.keys(prevProps.structure);
    const nextKeys = Object.keys(nextProps.structure);
    if (
      prevKeys.length !== nextKeys.length ||
      !prevKeys.every((key) => nextKeys.includes(key))
    ) {
      return false;
    }

    // If primary props haven't changed, assume no re-render needed
    // Note: Functions props are assumed stable
    return true;
  }
);
MemoizedFileTree.displayName = "MemoizedFileTree";
