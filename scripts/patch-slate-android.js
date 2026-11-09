const fs = require("fs");
const path = require("path");

const PATCH_MARKER = "/* SLATE_TABLET_AUTOCOMPLETE_PATCH_V1 */";

const targets = [
  path.join(__dirname, "..", "node_modules", "slate-react", "dist", "index.es.js"),
  path.join(__dirname, "..", "node_modules", "slate-react", "dist", "index.js"),
  path.join(
    __dirname,
    "..",
    "node_modules",
    "productivitytools.plate",
    "node_modules",
    "slate-react",
    "dist",
    "index.es.js"
  ),
  path.join(
    __dirname,
    "..",
    "node_modules",
    "productivitytools.plate",
    "node_modules",
    "slate-react",
    "dist",
    "index.js"
  ),
];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(PATCH_MARKER)) {
    console.log(`[patch-slate-android] Already patched: ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  const isCjs = filePath.endsWith("index.js") && !filePath.endsWith("index.es.js");
  const NodeRef = isCjs ? "slate.Node" : "Node";
  const PathRef = isCjs ? "slate.Path" : "Path";
  const RangeRef = isCjs ? "slate.Range" : "Range";
  const EditorRef = isCjs ? "slate.Editor" : "Editor";

  // 1. Detect Android tablets in Chrome "Desktop Site" mode (Linux + touch points) and iPadOS 13+ tablets
  content = content.replace(
    "var IS_IOS = typeof navigator !== 'undefined' && typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;",
    "var IS_IOS = typeof navigator !== 'undefined' && typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (/Mac OS X/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) && !window.MSStream;"
  );
  content = content.replace(
    "var IS_ANDROID = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);",
    "var IS_ANDROID = typeof navigator !== 'undefined' && (/Android/.test(navigator.userAgent) || (/Linux/.test(navigator.userAgent) && navigator.maxTouchPoints > 0));"
  );

  // 2. Strip \uFEFF anywhere in data-slate-zero-width during toSlatePoint
  content = content.replace(
    /if \(el\.textContent\.startsWith\(['"]\\uFEFF['"]\)\) \{\s*el\.textContent = el\.textContent\.slice\(1\);\s*\}/g,
    "el.textContent = el.textContent.replace(/\\uFEFF/g, '');"
  );

  // 3. Always render \uFEFF in ZeroWidthString so composing in an empty leaf doesn't create an unmanaged text node
  content = content.replace(
    /!IS_ANDROID \|\| !isLineBreak \? ['"]\\uFEFF['"] : null/g,
    "'\\uFEFF'"
  );

  // 4. Guard TextString from overwriting DOM textContent while Android IME is actively composing with pending diffs
  content = content.replace(
    /var TextString = (?:function TextString\(props\)|props =>) \{([\s\S]*?)if \(ref\.current && ref\.current\.textContent !== textWithTrailing\) \{\s*ref\.current\.textContent = textWithTrailing;\s*\}/,
    (match, prefix) => {
      return `var TextString = function TextString(props) {
  var _editorForTextString = useSlateStatic();${prefix}if (ref.current && ref.current.textContent !== textWithTrailing) {
      var _pDiffsForTextString = EDITOR_TO_PENDING_DIFFS.get(_editorForTextString);
      if (IS_ANDROID && IS_COMPOSING.get(_editorForTextString) && _pDiffsForTextString && _pDiffsForTextString.length > 0) {
        var _winSel = ReactEditor.getWindow(_editorForTextString).getSelection();
        var _compNode = _winSel ? _winSel.anchorNode : null;
        if (_compNode && ref.current.contains(_compNode)) {
          return;
        }
      }
      ref.current.textContent = textWithTrailing;
    }`;
    }
  );

  // 5. Track lastCompositionActivity, defer mid-composition flush, and reconcile DOM text in performAction
  content = content.replace(
    "var insertPositionHint = false;",
    `var insertPositionHint = false;
  var lastCompositionActivity = 0;
  var isCompositionLive = function () {
    if (!IS_COMPOSING.get(editor)) return false;
    return Date.now() - lastCompositionActivity < 5000;
  };
  var syncCurrentLeafDOMText = function () {
    try {
      if (editor.selection) {
        var _lPath = editor.selection.anchor.path;
        var _sLeaf = ${NodeRef}.leaf(editor, _lPath);
        var _dTextEl = ReactEditor.toDOMNode(editor, _sLeaf);
        var _sSpan = _dTextEl && _dTextEl.querySelector('[data-slate-string]');
        if (_sSpan && _sSpan.textContent !== _sLeaf.text && _sSpan.textContent !== _sLeaf.text + '\\n') {
          _sSpan.textContent = _sLeaf.text;
        }
      }
    } catch (_err) {}
  };`
  );

  content = content.replace(
    "action.run();\n  };",
    "action.run();\n    syncCurrentLeafDOMText();\n  };"
  );

  content = content.replace(
    "if (!hasPendingDiffs() && !hasPendingAction()) {\n      applyPendingSelection();\n      return;\n    }",
    `if (!hasPendingAction() && isCompositionLive() && hasPendingDiffs()) {
      flushTimeoutId = setTimeout(flush, 50);
      return;
    }
    if (!hasPendingDiffs() && !hasPendingAction()) {
      applyPendingSelection();
      return;
    }`
  );

  content = content.replace(
    "IS_COMPOSING.set(editor, true);",
    "IS_COMPOSING.set(editor, true);\n    lastCompositionActivity = Date.now();"
  );

  content = content.replace(
    "IS_COMPOSING.set(editor, false);\n      flush();",
    "IS_COMPOSING.set(editor, false);\n      flush();\n      syncCurrentLeafDOMText();"
  );

  // 6. In handleDOMBeforeInput: update lastCompositionActivity and expand collapsed targetRange when selecting an autocomplete suggestion
  content = content.replace(
    "if (insertPositionHint !== false && type !== 'insertText' && type !== 'insertCompositionText') {",
    `if (type === 'insertCompositionText' || type === 'deleteCompositionText') {
      lastCompositionActivity = Date.now();
    }
    if (insertPositionHint !== false && type !== 'insertText' && type !== 'insertCompositionText') {`
  );

  const autocompleteRangeExpansionCode = `
          if ((type === 'insertCompositionText' || type === 'insertFromComposition' || type === 'insertReplacementText' || type === 'insertText') && _text && ${RangeRef}.isCollapsed(targetRange)) {
            var _trimmed = _text.trim();
            if (_trimmed.length >= 2 && !/^\\s/.test(_text) && !/\\s/.test(_trimmed)) {
              try {
                var _anchorPt = targetRange.anchor;
                var _leafNode = ${NodeRef}.leaf(editor, _anchorPt.path);
                var _pDiffs = EDITOR_TO_PENDING_DIFFS.get(editor);
                var _relDiff = _pDiffs && _pDiffs.find(function (c) { return ${PathRef}.equals(c.path, _anchorPt.path); });
                var _effText = _relDiff ? applyStringDiff(_leafNode.text, _relDiff.diff) : _leafNode.text;
                var _beforeCursor = _effText.slice(0, _anchorPt.offset);
                var _wordMatch = _beforeCursor.match(/([^\\s.,!?;:()[\\]{}"'\`~@#$%^&*+=<>\\\\/|]+)$/);
                if (_wordMatch) {
                  var _typedWord = _wordMatch[1];
                  var _norm = function (s) { return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase(); };
                  var _normTrimmed = _norm(_trimmed);
                  var _normTyped = _norm(_typedWord);
                  var _isCompType = type === 'insertCompositionText' || type === 'insertFromComposition' || type === 'insertReplacementText';
                  if ((_normTrimmed.startsWith(_normTyped) && _normTrimmed.length >= _normTyped.length) || (_isCompType && _normTrimmed[0] === _normTyped[0])) {
                    var _wordStartOffset = _anchorPt.offset - _typedWord.length;
                    var _wordRange = {
                      anchor: { path: _anchorPt.path, offset: _wordStartOffset },
                      focus: _anchorPt
                    };
                    return scheduleAction(function () {
                      return ${EditorRef}.insertText(editor, _text);
                    }, {
                      at: _wordRange
                    });
                  }
                }
              } catch (_e) {}
            }
          }
`;

  content = content.replace(
    `if (${PathRef}.equals(targetRange.anchor.path, targetRange.focus.path)) {`,
    `${autocompleteRangeExpansionCode}
          if (${PathRef}.equals(targetRange.anchor.path, targetRange.focus.path)) {`
  );

  content = `${PATCH_MARKER}\n${content}`;
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[patch-slate-android] Patched successfully: ${path.relative(process.cwd(), filePath)}`);
}

targets.forEach(patchFile);
