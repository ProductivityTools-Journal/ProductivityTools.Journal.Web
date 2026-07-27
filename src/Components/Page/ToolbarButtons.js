import React from "react";
import { LooksOne } from "@styled-icons/material/LooksOne";
import { LooksTwo } from "@styled-icons/material/LooksTwo";
import { Looks3 } from "@styled-icons/material/Looks3";
import { Looks4 } from "@styled-icons/material/Looks4";
import { Looks5 } from "@styled-icons/material/Looks5";
import { Looks6 } from "@styled-icons/material/Looks6";
import { FormatQuote } from "@styled-icons/material/FormatQuote";
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
  getPluginType,
  usePlateEditorRef,
  focusEditor,
  indent,
  outdent,
  insertTable,
  deleteTable,
  insertTableRow,
  deleteRow,
  insertTableColumn,
  deleteColumn,
} from "@udecode/plate";

const tooltip = (content) => ({
  content,
});

export const ToolbarButtons = () => {
  const editor = usePlateEditorRef();

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
      <BlockToolbarButton
        tooltip={tooltip("Block Quote (⌘+⇧+.)")}
        type={getPluginType(editor, ELEMENT_BLOCKQUOTE)}
        icon={<FormatQuote />}
      />
      <CodeBlockToolbarButton icon={<CodeBlock />} />
      <LinkToolbarButton icon={<LinkIcon />} />
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
      <ImageToolbarButton icon={<ImageIcon />} />
    </>
  );
};

export default ToolbarButtons;
