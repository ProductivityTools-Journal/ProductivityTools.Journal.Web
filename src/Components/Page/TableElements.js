import React from "react";
import {
  TableElement,
  TableRowElement,
  TableCellElement,
  PlateTablePopover,
  useTableElementState,
  useTableCellElementState,
} from "@udecode/plate";

function borderToCss(border) {
  if (!border || border.size === 0) return "none";
  const size = border.size || 1;
  const style = border.style || "solid";
  const color = border.color || "#d0d7de";
  return `${size}px ${style} ${color}`;
}

export function JournalTableElement({ as, children, ...rootProps }) {
  const { colSizes, isSelectingCell, minColumnWidth, marginLeft } = useTableElementState();

  // Plate's useTableElementState appends a trailing '100%' sentinel when all columns are sized.
  // Keeping only real numeric column sizes prevents a ghost empty column on the right.
  const realColSizes = (colSizes || []).filter((size) => typeof size === "number");
  const hasExplicitSizes = realColSizes.length > 0 && realColSizes.every((s) => s > 0);
  const totalWidth = hasExplicitSizes
    ? realColSizes.reduce((acc, s) => acc + s, 0)
    : 0;

  return (
    <PlateTablePopover>
      <TableElement.Wrapper
        className="journal-table-wrapper"
        style={{
          paddingLeft: marginLeft || 0,
          overflowX: "auto",
          margin: "12px 0",
        }}
      >
        <TableElement.Root
          {...rootProps}
          className={`journal-plate-table ${isSelectingCell ? "journal-plate-table--selecting" : ""}`}
          style={{
            borderCollapse: "collapse",
            tableLayout: "fixed",
            width: hasExplicitSizes ? `${totalWidth}px` : "100%",
            maxWidth: hasExplicitSizes ? "none" : "100%",
            margin: 0,
            border: "none",
            backgroundColor: "#ffffff",
          }}
        >
          {realColSizes.length > 0 && (
            <TableElement.ColGroup>
              {realColSizes.map((width, index) => (
                <TableElement.Col
                  key={index}
                  style={{
                    minWidth: minColumnWidth || 48,
                    width: width > 0 ? `${width}px` : undefined,
                  }}
                />
              ))}
            </TableElement.ColGroup>
          )}
          <TableElement.TBody>{children}</TableElement.TBody>
        </TableElement.Root>
      </TableElement.Wrapper>
    </PlateTablePopover>
  );
}

export function JournalTableRowElement({ as, children, hideBorder, ...rootProps }) {
  const rowSize = rootProps?.element?.size;
  return (
    <TableRowElement.Root
      {...rootProps}
      style={{
        height: rowSize ? `${rowSize}px` : undefined,
        border: hideBorder ? "none" : undefined,
      }}
    >
      {children}
    </TableRowElement.Root>
  );
}

export function JournalTableCellElement({
  children,
  hideBorder,
  isHeader,
  ...rootProps
}) {
  const {
    colIndex,
    rowIndex,
    readOnly,
    selected,
    hovered,
    hoveredLeft,
    rowSize,
    borders,
  } = useTableCellElementState();

  const cellStyle = {
    position: "relative",
    overflow: "visible",
    verticalAlign: "top",
    padding: 0,
    boxSizing: "border-box",
    textAlign: isHeader ? "left" : undefined,
    fontWeight: isHeader ? 600 : undefined,
    backgroundColor: selected
      ? "#eff6ff"
      : rootProps?.element?.background || (isHeader ? "#f4f6f8" : "#ffffff"),
    borderTop: hideBorder ? "none" : borders?.top ? borderToCss(borders.top) : undefined,
    borderLeft: hideBorder ? "none" : borders?.left ? borderToCss(borders.left) : undefined,
    borderRight: hideBorder ? "none" : borderToCss(borders?.right),
    borderBottom: hideBorder ? "none" : borderToCss(borders?.bottom),
  };

  if (selected) {
    cellStyle.boxShadow = "inset 0 0 0 1.5px #3b82f6";
  }

  return (
    <TableCellElement.Root
      asAlias={isHeader ? "th" : "td"}
      {...rootProps}
      className="journal-plate-cell"
      style={cellStyle}
    >
      <TableCellElement.Content
        className="journal-plate-cell-content"
        style={{
          position: "relative",
          zIndex: 2,
          boxSizing: "border-box",
          minHeight: rowSize || 34,
          padding: "8px 12px",
          wordBreak: "break-word",
        }}
      >
        {children}
      </TableCellElement.Content>

      {!readOnly && (
        <TableCellElement.ResizableWrapper
          className="journal-plate-cell-resizer"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <TableCellElement.Resizable
            colIndex={colIndex}
            rowIndex={rowIndex}
            readOnly={readOnly}
          />
          {hovered && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: -1.5,
                width: 3,
                backgroundColor: "#1976d2",
                zIndex: 30,
                pointerEvents: "none",
              }}
            />
          )}
          {hoveredLeft && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: -1.5,
                width: 3,
                backgroundColor: "#1976d2",
                zIndex: 30,
                pointerEvents: "none",
              }}
            />
          )}
        </TableCellElement.ResizableWrapper>
      )}
    </TableCellElement.Root>
  );
}

export function JournalTableCellHeaderElement(props) {
  return <JournalTableCellElement {...props} isHeader={true} />;
}
