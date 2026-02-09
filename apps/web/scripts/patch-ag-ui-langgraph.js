#!/usr/bin/env node
/**
 * Patches @ag-ui/langgraph to fix "Message not found" error in multi-turn conversations.
 *
 * Root cause: prepareStream() incorrectly enters the "regeneration" path when the
 * LangGraph thread has more messages than CopilotKit sends. It then calls
 * getCheckpointByMessage() with a message ID that doesn't exist in the thread
 * history (because it's a NEW message, not an existing one), causing the error.
 *
 * Fix: Wrap prepareRegenerateStream() in try-catch so it falls through to the
 * normal stream flow when the checkpoint lookup fails.
 */
const fs = require("fs");
const path = require("path");

const SEARCH = 'return v?this.prepareRegenerateStream(T(f({},t),{messageCheckpoint:v}),e):this.subscriber.error("No user message found in messages to regenerate")';

const REPLACE = 'if(v){try{return await this.prepareRegenerateStream(T(f({},t),{messageCheckpoint:v}),e)}catch(_patchErr){console.warn("[ag-ui patch] Regenerate failed, using normal flow:",_patchErr.message)}}else{return this.subscriber.error("No user message found in messages to regenerate")}';

const files = [
  path.join(__dirname, "..", "node_modules", "@ag-ui", "langgraph", "dist", "index.js"),
  path.join(__dirname, "..", "node_modules", "@ag-ui", "langgraph", "dist", "index.mjs"),
];

let patched = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("[ag-ui patch]")) {
    console.log(`[patch] ${path.basename(file)} already patched, skipping`);
    continue;
  }
  if (!content.includes(SEARCH)) {
    console.warn(`[patch] ${path.basename(file)} search string not found, skipping`);
    continue;
  }
  content = content.replace(SEARCH, REPLACE);
  fs.writeFileSync(file, content, "utf8");
  patched++;
  console.log(`[patch] Patched ${path.basename(file)}`);
}

if (patched > 0) {
  console.log(`[patch] @ag-ui/langgraph patched successfully (${patched} files)`);
} else {
  console.log("[patch] No files needed patching");
}
