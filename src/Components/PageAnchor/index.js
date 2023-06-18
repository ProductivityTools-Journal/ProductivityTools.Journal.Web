import { useDrag } from "react-dnd";

export default function PageList({ page, removePageFromList }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "page",
    item: { page: page, removePageFromList: removePageFromList },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag}>
      anhor <span>{isDragging && "😱"}</span>
    </div>
  );
}
