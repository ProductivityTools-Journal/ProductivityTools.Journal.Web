import React from "react";
import { useDrag } from "react-dnd";
import Button from "@mui/material/Button";
import AnchorIcon from "@mui/icons-material/Anchor";

export default function PageAnchor({ page, removePageFromList }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "page",
    item: { page: page, removePageFromList: removePageFromList },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Button
      ref={drag}
      variant="outlined"
      color="primary"
      startIcon={<AnchorIcon />}
      style={{ cursor: "grab", opacity: isDragging ? 0.5 : 1 }}
      title="Drag to move page to another journal"
    >
      Anchor {isDragging && "😱"}
    </Button>
  );
}
