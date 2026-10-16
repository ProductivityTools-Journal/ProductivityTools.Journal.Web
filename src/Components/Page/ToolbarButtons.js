import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { LooksOne } from "@styled-icons/material/LooksOne";
import { LooksTwo } from "@styled-icons/material/LooksTwo";
import { Looks3 } from "@styled-icons/material/Looks3";
import { Looks4 } from "@styled-icons/material/Looks4";
import { Looks5 } from "@styled-icons/material/Looks5";
import { Looks6 } from "@styled-icons/material/Looks6";
import { FormatQuote } from "@styled-icons/material/FormatQuote";
import { FormatBold } from "@styled-icons/material/FormatBold";
import { FormatItalic } from "@styled-icons/material/FormatItalic";
import { FormatUnderlined } from "@styled-icons/material/FormatUnderlined";
import { FormatStrikethrough } from "@styled-icons/material/FormatStrikethrough";
import { FormatColorText } from "@styled-icons/material/FormatColorText";
import { Palette } from "@styled-icons/material/Palette";
import { CodeBlock } from "@styled-icons/boxicons-regular/CodeBlock";
import { Link as LinkIcon } from "@styled-icons/material/Link";
import { FormatListBulleted } from "@styled-icons/material/FormatListBulleted";
import { FormatListNumbered } from "@styled-icons/material/FormatListNumbered";
import { FormatIndentDecrease } from "@styled-icons/material/FormatIndentDecrease";
import { FormatIndentIncrease } from "@styled-icons/material/FormatIndentIncrease";
import { BorderAll } from "@styled-icons/material/BorderAll";
import { BorderClear } from "@styled-icons/material/BorderClear";
import { BorderBottom } from "@styled-icons/material/BorderBottom";
import { BorderTop } from "@styled-icons/material/BorderTop";
import { BorderLeft } from "@styled-icons/material/BorderLeft";
import { BorderRight } from "@styled-icons/material/BorderRight";
import { Image as ImageIcon } from "@styled-icons/material/Image";
import {
  BlockToolbarButton,
  MarkToolbarButton,
  CodeBlockToolbarButton,
  LinkToolbarButton,
  ListToolbarButton,
  TableToolbarButton,
  ImageToolbarButton,
  ToolbarButton,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
  ELEMENT_BLOCKQUOTE,
  ELEMENT_UL,
  ELEMENT_OL,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  MARK_STRIKETHROUGH,
  MARK_COLOR,
  getPluginType,
  usePlateEditorState,
  focusEditor,
  getMark,
  setMarks,
  removeMark,
  select,
  indent,
  outdent,
  insertTable,
  deleteTable,
  insertTableRow,
  deleteRow,
  insertTableColumn,
  deleteColumn,
} from "@udecode/plate";
import "tippy.js/dist/tippy.css";

const tooltip = (content) => ({
  content,
  arrow: true,
  delay: [200, 0],
});

export const BASIC_COLORS = [
  { name: "Red", color: "#d32f2f", key: "r", numKey: "1", shortcut: "Ctrl+M → R" },
  { name: "Green", color: "#2e7d32", key: "g", numKey: "2", shortcut: "Ctrl+M → G" },
  { name: "Blue", color: "#1976d2", key: "b", numKey: "3", shortcut: "Ctrl+M → B" },
];

export const MENU_COLOR_OPTIONS = [
  ...BASIC_COLORS,
  { name: "Default", color: null, key: "d", numKey: "0" },
];

const menuListeners = new Set();

export const openColorContextMenu = (editor) => {
  menuListeners.forEach((listener) => listener(editor));
};

function getSelectionCoords() {
  if (typeof window === "undefined") return { top: 150, left: 200 };
  const domSelection = window.getSelection();
  if (domSelection && domSelection.rangeCount > 0) {
    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect && (rect.top !== 0 || rect.left !== 0 || rect.width !== 0 || rect.height !== 0)) {
      return {
        top: Math.min(rect.bottom + 8, window.innerHeight - 90),
        left: Math.min(Math.max(rect.left, 12), window.innerWidth - 320),
      };
    }
    const container =
      range.startContainer?.nodeType === 1
        ? range.startContainer
        : range.startContainer?.parentElement;
    if (container && container.getBoundingClientRect) {
      const cRect = container.getBoundingClientRect();
      return {
        top: Math.min(cRect.bottom + 8, window.innerHeight - 90),
        left: Math.min(Math.max(cRect.left, 12), window.innerWidth - 320),
      };
    }
  }
  return { top: 150, left: 200 };
}

export const applyColorMark = (editor, color) => {
  if (!editor) return;
  const colorType = getPluginType(editor, MARK_COLOR);
  if (!color) {
    removeMark(editor, { key: colorType });
  } else {
    setMarks(editor, { [colorType]: color });
  }
  focusEditor(editor);
};

export const toggleColorMark = (editor, color) => {
  if (!editor) return;
  const colorType = getPluginType(editor, MARK_COLOR);
  const currentColor = getMark(editor, colorType);
  if (!color || (currentColor && currentColor.toLowerCase() === color.toLowerCase())) {
    removeMark(editor, { key: colorType });
  } else {
    setMarks(editor, { [colorType]: color });
  }
  focusEditor(editor);
};

export const ToolbarButtons = () => {
  const editor = usePlateEditorState();
  const colorInputRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const menuRef = useRef(null);
  const [customColor, setCustomColor] = useState("#000000");
  const [menuState, setMenuState] = useState({
    open: false,
    top: 0,
    left: 0,
    selectedIndex: 0,
  });

  const colorType = editor ? getPluginType(editor, MARK_COLOR) : MARK_COLOR;
  const activeColor = editor ? getMark(editor, colorType) : undefined;
  const isCustomColorActive =
    Boolean(activeColor) &&
    !BASIC_COLORS.some((c) => c.color.toLowerCase() === activeColor.toLowerCase());

  useEffect(() => {
    const listener = (targetEditor) => {
      if (targetEditor === editor) {
        if (editor && editor.selection) {
          savedSelectionRef.current = JSON.parse(JSON.stringify(editor.selection));
        }
        const coords = getSelectionCoords();
        const current = editor ? getMark(editor, colorType) : undefined;
        let initialIdx = 0;
        if (current) {
          const foundIdx = BASIC_COLORS.findIndex(
            (c) => c.color.toLowerCase() === current.toLowerCase()
          );
          if (foundIdx !== -1) initialIdx = foundIdx;
        }
        setMenuState({
          open: true,
          top: coords.top,
          left: coords.left,
          selectedIndex: initialIdx,
        });
      } else {
        setMenuState((prev) => (prev.open ? { ...prev, open: false } : prev));
      }
    };
    menuListeners.add(listener);
    return () => {
      menuListeners.delete(listener);
    };
  }, [editor, colorType]);

  useEffect(() => {
    if (!menuState.open) return;

    const selectOption = (option) => {
      setMenuState((prev) => ({ ...prev, open: false }));
      if (!editor) return;
      if (!editor.selection && savedSelectionRef.current) {
        select(editor, savedSelectionRef.current);
      }
      if (option.color === null) {
        applyColorMark(editor, null);
      } else {
        toggleColorMark(editor, option.color);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        setMenuState((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % MENU_COLOR_OPTIONS.length,
        }));
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setMenuState((prev) => ({
          ...prev,
          selectedIndex:
            (prev.selectedIndex - 1 + MENU_COLOR_OPTIONS.length) % MENU_COLOR_OPTIONS.length,
        }));
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        const chosen = MENU_COLOR_OPTIONS[menuState.selectedIndex];
        if (chosen) {
          selectOption(chosen);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMenuState((prev) => ({ ...prev, open: false }));
        if (editor) focusEditor(editor);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        e.stopPropagation();
        selectOption(MENU_COLOR_OPTIONS[MENU_COLOR_OPTIONS.length - 1]);
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const lower = (e.key || "").toLowerCase();
        const directMatch = MENU_COLOR_OPTIONS.find(
          (opt) => opt.key === lower || opt.numKey === lower
        );
        if (directMatch) {
          e.preventDefault();
          e.stopPropagation();
          selectOption(directMatch);
        }
      }
    };

    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuState((prev) => ({ ...prev, open: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handleMouseDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMouseDown, true);
    };
  }, [menuState.open, menuState.selectedIndex, editor]);

  return (
    <>
      <BlockToolbarButton
        tooltip={tooltip("Heading 1")}
        type={getPluginType(editor, ELEMENT_H1)}
        icon={<LooksOne />}
      />
      <BlockToolbarButton
        tooltip={tooltip("Heading 2")}
        type={getPluginType(editor, ELEMENT_H2)}
        icon={<LooksTwo />}
      />
      <BlockToolbarButton
        tooltip={tooltip("Heading 3")}
        type={getPluginType(editor, ELEMENT_H3)}
        icon={<Looks3 />}
      />
      <BlockToolbarButton
        tooltip={tooltip("Heading 4")}
        type={getPluginType(editor, ELEMENT_H4)}
        icon={<Looks4 />}
      />
      <BlockToolbarButton
        tooltip={tooltip("Heading 5")}
        type={getPluginType(editor, ELEMENT_H5)}
        icon={<Looks5 />}
      />
      <BlockToolbarButton
        tooltip={tooltip("Heading 6")}
        type={getPluginType(editor, ELEMENT_H6)}
        icon={<Looks6 />}
      />
      <MarkToolbarButton
        tooltip={tooltip("Bold (Ctrl+B)")}
        type={getPluginType(editor, MARK_BOLD)}
        icon={<FormatBold />}
      />
      <MarkToolbarButton
        tooltip={tooltip("Italic (Ctrl+I)")}
        type={getPluginType(editor, MARK_ITALIC)}
        icon={<FormatItalic />}
      />
      <MarkToolbarButton
        tooltip={tooltip("Underline (Ctrl+U)")}
        type={getPluginType(editor, MARK_UNDERLINE)}
        icon={<FormatUnderlined />}
      />
      <MarkToolbarButton
        tooltip={tooltip("Strikethrough (Ctrl+Shift+X)")}
        type={getPluginType(editor, MARK_STRIKETHROUGH)}
        icon={<FormatStrikethrough />}
      />
      {BASIC_COLORS.map((item) => {
        const isActive =
          Boolean(activeColor) && activeColor.toLowerCase() === item.color.toLowerCase();
        return (
          <ToolbarButton
            key={item.key}
            active={isActive}
            tooltip={tooltip(`${item.name} (${item.shortcut})`)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleColorMark(editor, item.color);
            }}
            style={
              isActive
                ? { backgroundColor: "rgba(0, 0, 0, 0.08)", borderRadius: "4px" }
                : undefined
            }
            icon={
              <FormatColorText
                style={{
                  color: item.color,
                }}
              />
            }
          />
        );
      })}
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <ToolbarButton
          active={isCustomColorActive}
          tooltip={tooltip("Color Picker")}
          onMouseDown={(e) => {
            e.preventDefault();
            if (editor && editor.selection) {
              savedSelectionRef.current = JSON.parse(JSON.stringify(editor.selection));
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (editor && editor.selection) {
              savedSelectionRef.current = JSON.parse(JSON.stringify(editor.selection));
            }
            if (colorInputRef.current) {
              colorInputRef.current.click();
            }
          }}
          style={
            isCustomColorActive
              ? { backgroundColor: "rgba(0, 0, 0, 0.08)", borderRadius: "4px" }
              : undefined
          }
          icon={
            <Palette
              style={{
                color: isCustomColorActive ? activeColor : customColor !== "#000000" ? customColor : undefined,
              }}
            />
          }
        />
        <input
          ref={colorInputRef}
          type="color"
          value={isCustomColorActive ? activeColor : customColor}
          onChange={(e) => {
            const newColor = e.target.value;
            setCustomColor(newColor);
            if (editor) {
              if (!editor.selection && savedSelectionRef.current) {
                select(editor, savedSelectionRef.current);
              }
              if (editor.selection) {
                setMarks(editor, { [colorType]: newColor });
              }
            }
          }}
          onBlur={() => {
            if (editor) {
              focusEditor(editor);
            }
          }}
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: "none",
            border: 0,
            padding: 0,
          }}
        />
      </div>
      <BlockToolbarButton
        tooltip={tooltip("Block Quote (Ctrl+Shift+.)")}
        type={getPluginType(editor, ELEMENT_BLOCKQUOTE)}
        icon={<FormatQuote />}
      />
      <CodeBlockToolbarButton tooltip={tooltip("Code Block")} icon={<CodeBlock />} />
      <LinkToolbarButton tooltip={tooltip("Link")} icon={<LinkIcon />} />
      <ListToolbarButton
        tooltip={tooltip("Bullet List")}
        type={getPluginType(editor, ELEMENT_UL)}
        icon={<FormatListBulleted />}
      />
      <ListToolbarButton
        tooltip={tooltip("Ordered List")}
        type={getPluginType(editor, ELEMENT_OL)}
        icon={<FormatListNumbered />}
      />
      <ToolbarButton
        tooltip={tooltip("Outdent")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          outdent(editor);
          focusEditor(editor);
        }}
        icon={<FormatIndentDecrease />}
      />
      <ToolbarButton
        tooltip={tooltip("Indent")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          indent(editor);
          focusEditor(editor);
        }}
        icon={<FormatIndentIncrease />}
      />
      <TableToolbarButton
        tooltip={tooltip("Table")}
        icon={<BorderAll />}
        transform={insertTable}
      />
      <TableToolbarButton
        tooltip={tooltip("Remove Table")}
        icon={<BorderClear />}
        transform={deleteTable}
      />
      <TableToolbarButton
        tooltip={tooltip("Table Row")}
        icon={<BorderBottom />}
        transform={insertTableRow}
      />
      <TableToolbarButton
        tooltip={tooltip("Remove Table Row")}
        icon={<BorderTop />}
        transform={deleteRow}
      />
      <TableToolbarButton
        tooltip={tooltip("Table Column")}
        icon={<BorderLeft />}
        transform={insertTableColumn}
      />
      <TableToolbarButton
        tooltip={tooltip("Remove Table Column")}
        icon={<BorderRight />}
        transform={deleteColumn}
      />
      <ImageToolbarButton tooltip={tooltip("Image")} icon={<ImageIcon />} />
      {menuState.open &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "fixed",
              top: menuState.top,
              left: menuState.left,
              zIndex: 9999,
              backgroundColor: "#ffffff",
              color: "#2c3e50",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "8px 10px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {MENU_COLOR_OPTIONS.map((opt, idx) => {
                const isSelected = idx === menuState.selectedIndex;
                const isCurrentMark =
                  opt.color === null
                    ? !activeColor
                    : Boolean(activeColor) &&
                      activeColor.toLowerCase() === opt.color.toLowerCase();
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onMouseEnter={() =>
                      setMenuState((prev) => ({ ...prev, selectedIndex: idx }))
                    }
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuState((prev) => ({ ...prev, open: false }));
                      if (!editor) return;
                      if (!editor.selection && savedSelectionRef.current) {
                        select(editor, savedSelectionRef.current);
                      }
                      if (opt.color === null) {
                        applyColorMark(editor, null);
                      } else {
                        toggleColorMark(editor, opt.color);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: isSelected
                        ? "1.5px solid #1976d2"
                        : "1.5px solid #e8eaed",
                      backgroundColor: isSelected
                        ? "#e3f2fd"
                        : "#f8f9fa",
                      color: "#2c3e50",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: isSelected || isCurrentMark ? 600 : 400,
                      outline: "none",
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: opt.color || "#2c3e50",
                        border: "1px solid rgba(0, 0, 0, 0.18)",
                        display: "inline-block",
                        boxSizing: "border-box",
                      }}
                    />
                    <span>{opt.name}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#777",
                        marginLeft: "2px",
                      }}
                    >
                      [{opt.key.toUpperCase()}]
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#777",
                textAlign: "center",
              }}
            >
              ←/→ strzałki • Enter wybierz • R/G/B/D szybki wybór • Esc zamknij
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ToolbarButtons;
