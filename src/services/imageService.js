import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuid } from "uuid";
import {
  ELEMENT_PARAGRAPH,
  getPluginType,
  insertImage,
  insertNodes,
  select,
  getEndPoint,
  focusEditor,
} from "@udecode/plate";
import { auth } from "../Session/firebase";
import statusService from "./statusService";

const storage = getStorage();
if (storage) {
  storage.maxUploadRetryTime = 12000;
}

let activeUploadCount = 0;
const uploadListeners = new Set();

function notifyUploadListeners() {
  uploadListeners.forEach((fn) => {
    try {
      fn(activeUploadCount);
    } catch (_e) {
      // ignore listener errors
    }
  });
}

export function getActiveUploadCount() {
  return activeUploadCount;
}

export function subscribeUploadCount(listener) {
  uploadListeners.add(listener);
  return () => uploadListeners.delete(listener);
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nie udało się odczytać pliku graficznego"));
    img.src = src;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Compresses and scales an image File/Blob or DataURL in the browser using <canvas>.
 * Preserves small GIFs and SVGs without rasterizing them.
 */
export async function compressImage(
  fileOrDataUrl,
  { maxDimension = 1600, quality = 0.84 } = {}
) {
  let sourceDataUrl = "";
  let originalMime = "image/png";

  if (typeof fileOrDataUrl === "string") {
    sourceDataUrl = fileOrDataUrl;
    const mimeMatch = fileOrDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);/);
    if (mimeMatch) {
      originalMime = mimeMatch[1].toLowerCase();
    }
  } else if (fileOrDataUrl instanceof Blob) {
    originalMime = (fileOrDataUrl.type || "image/png").toLowerCase();
    // Preserve animated GIFs and SVGs if reasonably sized (< 2 MB)
    if (
      (originalMime === "image/gif" || originalMime === "image/svg+xml") &&
      fileOrDataUrl.size <= 2 * 1024 * 1024
    ) {
      const rawDataUrl = await readAsDataUrl(fileOrDataUrl);
      const ext = originalMime === "image/gif" ? "gif" : "svg";
      return {
        blob: fileOrDataUrl,
        dataUrl: rawDataUrl,
        mimeType: originalMime,
        ext,
      };
    }
    sourceDataUrl = await readAsDataUrl(fileOrDataUrl);
  } else {
    throw new Error("Nieobsługiwany format wejściowy obrazka");
  }

  const img = await loadImageElement(sourceDataUrl);
  const origW = img.naturalWidth || img.width || 1;
  const origH = img.naturalHeight || img.height || 1;

  let targetW = origW;
  let targetH = origH;
  const longestSide = Math.max(origW, origH);
  if (longestSide > maxDimension) {
    const ratio = maxDimension / longestSide;
    targetW = Math.max(1, Math.round(origW * ratio));
    targetH = Math.max(1, Math.round(origH * ratio));
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let targetMime = "image/webp";
  let ext = "webp";
  let outBlob = await canvasToBlob(canvas, targetMime, quality);

  // Fallback to JPEG if browser did not produce WebP
  if (!outBlob || outBlob.type !== "image/webp") {
    targetMime = "image/jpeg";
    ext = "jpg";
    outBlob = await canvasToBlob(canvas, targetMime, quality);
  }

  const outDataUrl = await readAsDataUrl(outBlob);

  return {
    blob: outBlob,
    dataUrl: outDataUrl,
    mimeType: targetMime,
    ext,
    width: targetW,
    height: targetH,
  };
}

/**
 * Uploads an image to Firebase Storage (`users/{uid}/notes/YYYY-MM/...`).
 * Falls back cleanly to a compact inline WebP data URL when offline or if Storage is unavailable.
 */
export async function uploadNoteImage(fileOrDataUrl) {
  activeUploadCount += 1;
  notifyUploadListeners();
  const opId = statusService.start("Kompresja i przesyłanie obrazka...");

  try {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    const currentUser = auth?.currentUser;

    if (isOffline || !currentUser?.uid) {
      const compact = await compressImage(fileOrDataUrl, {
        maxDimension: 1280,
        quality: 0.76,
      });
      statusService.warn(
        opId,
        isOffline
          ? "Offline: obrazek skompresowany i zapisany lokalnie w notatce"
          : "Zapisano skompresowany obrazek bezpośrednio w notatce"
      );
      return compact.dataUrl;
    }

    const compressed = await compressImage(fileOrDataUrl, {
      maxDimension: 1600,
      quality: 0.84,
    });

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const fileName = `${Date.now()}-${uuid().slice(0, 8)}.${compressed.ext}`;
    const storagePath = `users/${currentUser.uid}/notes/${yearMonth}/${fileName}`;

    try {
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, compressed.blob, {
        contentType: compressed.mimeType,
        cacheControl: "public,max-age=31536000,immutable",
      });
      const downloadUrl = await getDownloadURL(storageRef);
      const sizeKb = Math.max(1, Math.round(compressed.blob.size / 1024));
      statusService.success(opId, `Obrazek przesłany (${sizeKb} KB)`);
      return downloadUrl;
    } catch (storageErr) {
      console.warn(
        "Firebase Storage upload failed, falling back to compact inline WebP:",
        storageErr
      );
      const compact = await compressImage(fileOrDataUrl, {
        maxDimension: 1200,
        quality: 0.75,
      });
      statusService.warn(
        opId,
        "Firebase Storage niedostępny — zapisano skompresowany obrazek inline"
      );
      return compact.dataUrl;
    }
  } catch (err) {
    console.error("Image processing failed:", err);
    statusService.error(opId, err?.message || "Nie udało się dodać obrazka");
    throw err;
  } finally {
    activeUploadCount = Math.max(0, activeUploadCount - 1);
    notifyUploadListeners();
  }
}

/**
 * Extracts image File objects from a ClipboardEvent/DragEvent DataTransfer.
 */
export function extractImageFilesFromDataTransfer(dataTransfer) {
  if (!dataTransfer) return [];
  const imageFiles = [];

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file && file.type && file.type.startsWith("image/")) {
        imageFiles.push(file);
      }
    }
  }

  if (imageFiles.length === 0 && dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item && item.kind === "file" && item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
  }

  return imageFiles;
}

/**
 * Ensures the editor selection is not inside path [0] (the strict `title` block)
 * before inserting an `img` element, then uploads and inserts each image file.
 */
export async function insertImageFilesIntoEditor(editor, files, savedSelection = null) {
  if (!editor || !files || files.length === 0) return;

  const fileArray = Array.from(files).filter(
    (f) => f && (!f.type || f.type.startsWith("image/"))
  );
  if (fileArray.length === 0) return;

  if (!editor.selection && savedSelection) {
    try {
      select(editor, savedSelection);
    } catch (_e) {
      // ignore invalid stale selection
    }
  }

  const paragraphType = getPluginType(editor, ELEMENT_PARAGRAPH) || "p";

  // Ensure body paragraph at index 1 exists so we never insert an image at index 0 (`strictType: "title"`)
  if (!Array.isArray(editor.children) || editor.children.length < 2) {
    insertNodes(
      editor,
      { type: paragraphType, children: [{ text: "" }] },
      { at: [1] }
    );
  }

  if (!editor.selection) {
    const lastIdx = Math.max(1, editor.children.length - 1);
    select(editor, getEndPoint(editor, [lastIdx]));
  } else if (editor.selection.anchor?.path?.[0] === 0) {
    select(editor, { path: [1, 0], offset: 0 });
  }

  for (const file of fileArray) {
    try {
      const url = await uploadNoteImage(file);
      if (url) {
        insertImage(editor, url);
      }
    } catch (_err) {
      // Error already surfaced via statusService
    }
  }

  try {
    focusEditor(editor);
  } catch (_e) {
    // ignore focus errors
  }
}
