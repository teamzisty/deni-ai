import type { ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";

import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

const deleteKeyCode = ["Backspace", "Delete"];

export const Canvas = ({
  children,
  fitView = true,
  fitViewOptions,
  minZoom = 0.35,
  maxZoom = 1.15,
  defaultViewport,
  ...props
}: CanvasProps) => (
  <ReactFlow
    deleteKeyCode={deleteKeyCode}
    fitView={fitView}
    fitViewOptions={{
      padding: 0.2,
      minZoom: 0.45,
      maxZoom: 0.8,
      ...fitViewOptions,
    }}
    minZoom={minZoom}
    maxZoom={maxZoom}
    defaultViewport={defaultViewport ?? { x: 0, y: 0, zoom: 0.7 }}
    panOnDrag={false}
    panOnScroll
    selectionOnDrag={true}
    zoomOnDoubleClick={false}
    {...props}
  >
    <Background bgColor="var(--sidebar)" />
    {children}
  </ReactFlow>
);
