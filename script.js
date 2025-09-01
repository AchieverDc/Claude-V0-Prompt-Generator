// script.js
/**
 * PocketBase → AI to Production Pipeline
 * v3.8 — Universal Merge + Full localStorage Persistence
 */

// --- Utility Functions ---
function $(id) {
  return typeof id === "string" ? document.getElementById(id) : id;
}

function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeValue(id) {
  const el = $(id);
  return el?.value?.trim?.() || "";
}

// --- LocalStorage Keys ---
const STORAGE_KEYS = {
  p0: "pb_pipeline_stage0",
  p1: "pb_pipeline_stage1",
  p2: "pb_pipeline_stage2",
  p3: "pb_pipeline_stage3",
  p4: "pb_pipeline_stage4",
  p5: "pb_pipeline_stage5",
  theme: "pb_pipeline_dark",
  mergeFiles: "pb_pipeline_merge_files",
};

// --- Toast System ---
function toast(msg, type = "info") {
  try {
    const t = $("toast");
    if (!t) return;
    t.className = "toast";
    t.classList.add("show");
    if (type === "ok") t.classList.add("ok");
    if (type === "error") t.classList.add("error");
    t.innerHTML = `<span>${msg}</span> <button onclick="this.closest('.toast').classList.remove('show')">&times;</button>`;
    t.setAttribute("role", "alert");
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => t.classList.remove("show"), 3000);
  } catch (e) {
    console.error("Toast failed:", e);
  }
}

// --- Theme Toggle ---
function setupThemeToggle() {
  const toggle = $("toggleTheme");
  if (!toggle) return;

  function updateTheme() {
    const isDark = document.body.classList.contains("dark");
    toggle.textContent = isDark ? "☀️" : "🌓";
  }

  toggle.addEventListener("click", () => {
    try {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem(STORAGE_KEYS.theme, isDark);
      updateTheme();
    } catch (e) {
      toast("Theme toggle failed.", "error");
    }
  });

  // Restore theme
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (savedTheme === "true") {
    document.body.classList.add("dark");
  }
  updateTheme();
}

// --- Tab & Workflow Navigation ---
function activateTab(tabId) {
  try {
    if (!tabId || !/^[pP]\d$/.test(tabId)) {
      toast("Invalid tab ID.", "error");
      return;
    }

    // Hide all
    document.querySelectorAll(".tab-content").forEach((el) => {
      if (el) el.style.display = "none";
      el.classList.remove("active");
    });

    // Show selected
    const content = $(tabId);
    if (!content) {
      toast("Tab not found: " + tabId, "error");
      return;
    }

    content.style.display = "block";
    content.classList.add("active");

    // Update UI
    document
      .querySelectorAll(".workflow-step")
      .forEach((s) => s.classList.remove("active"));
    const step = document.querySelector(`.workflow-step[data-step="${tabId}"]`);
    if (step) step.classList.add("active");

    // Lazy init Merge Builder
    if (tabId === "p1" && !window.mergeBuilderInitialized) {
      initMergeBuilder().catch((err) => {
        console.error("Merge Builder failed:", err);
        toast("Merge Builder failed to load.", "error");
      });
    }

    // Load saved data for this stage
    loadStageData(tabId);

    // Update form visibility
    updateFormVisibility(tabId);
  } catch (e) {
    console.error("Failed to activate tab:", e);
    toast("Failed to switch tab.", "error");
  }
}

// --- Dynamic Form Visibility ---
function updateFormVisibility(activeTabId) {
  try {
    document.querySelectorAll(".section[data-show]").forEach((section) => {
      const showIn = section
        .getAttribute("data-show")
        .split(",")
        .map((s) => s.trim());
      section.style.display = showIn.includes(activeTabId) ? "block" : "none";
    });
  } catch (e) {
    console.error("Form visibility failed:", e);
  }
}

// --- Save/Load Helpers ---
function saveStageData(stageKey, data) {
  try {
    localStorage.setItem(stageKey, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

function loadStageData(stageKey) {
  try {
    const saved = localStorage.getItem(stageKey);
    if (!saved) return null;

    const data = JSON.parse(saved);
    Object.keys(data).forEach((id) => {
      const el = $(id);
      if (el && data[id] !== undefined) {
        if (el.tagName === "SELECT" || el.tagName === "INPUT") {
          el.value = data[id];
        } else if (el.tagName === "TEXTAREA") {
          el.value = data[id];
          // Trigger CodeMirror update if exists
          if (window.CodeMirror && el.CodeMirror) {
            el.CodeMirror.setValue(el.value);
          }
        }
      }
    });
    return data;
  } catch (e) {
    console.error(`Failed to load ${stageKey}:`, e);
    return null;
  }
}

// --- Auto-Save on Input ---
function autoSaveStage(stageKey, fields) {
  fields.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const data = {};
      fields.forEach((f) => {
        data[f] = safeValue(f);
      });
      saveStageData(stageKey, data);
    });
  });
}

// --- Stage 0: Prompt Generator ---
function generatePrompt() {
  try {
    const screen = safeValue("screenName");
    const feature = safeValue("featureDesc");
    const comps = safeValue("components");
    const collections = safeValue("collections");
    const reusable = safeValue("reusable");
    const designGuide = safeValue("designGuide");
    const role = safeValue("role") || "admin";

    if (!screen) {
      toast("Please enter a screen name.", "error");
      return;
    }

    const prompt = `
You are an expert frontend engineer. I want you to build the **${escapeHtml(
      screen
    )}** screen in **React with Tailwind CSS**. All logics and components must be production-ready enterprise-grade not simulated placeholder codes. Use lucide-react as the default ui component library.

🔧 Folder Structure for the ${capitalize(role)} Section:
- /${role}
  - /components → Shared components (e.g., Modal, Toast, Card, Table, etc.)
  - /contexts → React contexts if needed
  - /hooks → Custom React hooks
  - /pages → The main screen/page component
  - /services → PocketBase integration logic (API calls)
  - index.js → Exports everything

📊 Requirements:
- DO NOT combine everything in a single file.
- EACH component (${comps}) must be in its own file under \`/${role}/components\`.
- Place the screen's main page logic in \`/${role}/pages/${screen}.jsx\`
- Use \`/${role}/hooks\` or \`/${role}/services\` as needed.
- Use named exports and proper imports.
- When updating existing components in follow-up responses, use the exact same filename to maintain version history in the code extractor.

💡 Screen Summary:
- Role: **${role}**
- Screen: **${screen}**
- Feature: **${feature}**
- Required Components: **${comps}**
- Use PocketBase collections: **${collections}**
- Implement actual enterprise-grade data fetching using pocketbase with async hooks in \`/${role}/services\`

🎨 UI Guidelines (Manually Specified):
${designGuide}

📦 Reuse Guidance (Manually Listed):
${reusable}

📦 Output Format:
- Output each component or file one at a time in this format:
\`\`\`jsx filename:/${role}/components/ComponentName.jsx
// Component code here
// When updating this component later, use the same filename to maintain version history
\`\`\`

⚠️ Important for Versioning:
- ALWAYS use the \`filename:\` parameter in code blocks
- Use the exact same filename when updating existing components
- Only change filenames for major refactors or new components
- This ensures proper version tracking in the chat code extractor

✅ Start by outputting \`/${role}/pages/${screen}.jsx\` and one shared component like a Modal or Table. Wait for feedback before continuing.
`.trim();

    const output = $("output0");
    if (output) output.value = prompt;
    toast("Prompt generated.", "ok");
  } catch (e) {
    console.error("Prompt generation failed:", e);
    toast("Failed to generate prompt.", "error");
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Attach Stage 0 events
function setupStage0() {
  $(`gen0`).addEventListener("click", generatePrompt);
  $(`copy0`).addEventListener("click", copyStage0);
  $(`save0`).addEventListener("click", saveStage0);
  $(`load0`).addEventListener("click", loadStage0);
  $(`export0`).addEventListener("click", exportStage0);

  // Auto-save stage 0
  autoSaveStage(STORAGE_KEYS.p0, [
    "screenName",
    "featureDesc",
    "components",
    "collections",
    "reusable",
    "designGuide",
    "role",
    "output0",
  ]);
}

function copyStage0() {
  const output = $("output0");
  if (!output || !output.value) return toast("Nothing to copy.", "error");
  navigator.clipboard.writeText(output.value).then(
    () => toast("Copied to clipboard.", "ok"),
    () => toast("Copy failed. Use Ctrl+C.", "error")
  );
}

function saveStage0() {
  const data = {
    screen: safeValue("screenName"),
    feature: safeValue("featureDesc"),
    comps: safeValue("components"),
    collections: safeValue("collections"),
    reusable: safeValue("reusable"),
    designGuide: safeValue("designGuide"),
    role: safeValue("role"),
    output: safeValue("output0"),
  };
  saveStageData(STORAGE_KEYS.p0, data);
  toast("Stage 0 saved.", "ok");
}

function loadStage0() {
  const data = loadStageData(STORAGE_KEYS.p0);
  if (data) {
    [
      "screenName",
      "featureDesc",
      "components",
      "collections",
      "reusable",
      "designGuide",
      "role",
    ].forEach((id) => {
      const el = $(id);
      if (el && data[id] !== undefined) el.value = data[id];
    });
    if (data.output !== undefined) $("output0").value = data.output;
    toast("Stage 0 loaded.", "ok");
  } else {
    toast("No saved data for Stage 0.", "error");
  }
}

function exportStage0() {
  const output = $("output0");
  if (!output || !output.value) return toast("No prompt to export.", "error");
  const blob = new Blob([output.value], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: "ai-prompt.md",
  });
  a.click();
  URL.revokeObjectURL(url);
  toast("Exported as Markdown.", "ok");
}

// --- Stage 1: Universal AI Merge Builder ---
let editors = [];

async function initMergeBuilder() {
  if (window.mergeBuilderInitialized) return;
  window.mergeBuilderInitialized = true;

  try {
    const $ = (id) => document.getElementById(id);
    const filesEl = $("files");
    if (!filesEl) throw new Error("Merge Builder: files container not found");

    // Load saved files
    const savedFiles = localStorage.getItem(STORAGE_KEYS.mergeFiles);
    if (savedFiles) {
      try {
        const files = JSON.parse(savedFiles);
        files.forEach((f) => addFile(f.name, f.content));
      } catch (e) {
        console.warn("Failed to load saved files:", e);
      }
    }

    // Auto-save files
    function saveFiles() {
      const files = editors.map((e) => ({
        name: e.fname.value,
        content: e.cm ? e.cm.getValue() : e.ta.value,
      }));
      localStorage.setItem(STORAGE_KEYS.mergeFiles, JSON.stringify(files));
    }

    // Add file
    window.addFile = function (name = "", content = "") {
      try {
        const id = "f" + Math.random().toString(36).slice(2, 9);
        const row = document.createElement("div");
        row.className = "file-row";
        row.id = id;
        row.innerHTML = `
          <div class="file-head">
            <input type="text" class="fname" value="${escapeHtml(name)}" />
            <div class="file-actions">
              <button type="button" class="small ghost" data-remove>Remove</button>
              <button type="button" class="small ghost" data-download>Download</button>
            </div>
          </div>
          <div class="cm-editor"><textarea>${escapeHtml(
            content
          )}</textarea></div>
        `;
        filesEl.appendChild(row);

        const fname = row.querySelector(".fname");
        const ta = row.querySelector("textarea");

        let cm = null;
        if (window.CodeMirror) {
          cm = CodeMirror.fromTextArea(ta, {
            lineNumbers: true,
            mode: "javascript",
            theme: document.body.classList.contains("dark")
              ? "dracula"
              : "default",
          });
          cm.setSize("100%", 200);
          const ext = (name.split(".").pop() || "").toLowerCase();
          if (ext === "py") cm.setOption("mode", "python");
          if (ext === "go") cm.setOption("mode", "go");
          if (ext === "lua") cm.setOption("mode", "lua");
          if (ext === "jsx" || ext === "tsx") cm.setOption("mode", "jsx");
        }

        const editor = { id, row, fname, cm, ta };
        editors.push(editor);

        // Remove button
        row.querySelector("[data-remove]").addEventListener("click", (e) => {
          e.preventDefault();
          row.remove();
          editors = editors.filter((e) => e.id !== id);
          updateStats();
          scanDuplicates();
          saveFiles();
          toast("File removed.", "ok");
        });

        // Download button
        row.querySelector("[data-download]").addEventListener("click", () => {
          const content = cm ? cm.getValue() : ta.value;
          const filename = fname.value || "file.txt";
          const blob = new Blob([content], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = Object.assign(document.createElement("a"), {
            href: url,
            download: filename,
          });
          a.click();
          URL.revokeObjectURL(url);
        });

        if (cm)
          cm.on("change", () => {
            updateStats();
            scanDuplicates();
            saveFiles();
          });
        fname.addEventListener("input", () => {
          updateStats();
          scanDuplicates();
          saveFiles();
        });

        updateStats();
        scanDuplicates();
        saveFiles();
        return id;
      } catch (e) {
        console.error("Add file failed:", e);
        toast("Failed to add file.", "error");
      }
    };

    // Initial file if empty
    if (editors.length === 0) {
      addFile("src/index.js", "// Add files to begin merging\n");
    }

    // Event listeners
    $("add-file")?.addEventListener("click", () =>
      addFile(`file-${Date.now()}.js`, "// New file\n")
    );
    $("clear-files")?.addEventListener("click", () => {
      if (confirm("Clear all files?")) {
        filesEl.innerHTML = "";
        editors = [];
        updateStats();
        scanDuplicates();
        localStorage.removeItem(STORAGE_KEYS.mergeFiles);
        toast("All files cleared.", "ok");
      }
    });

    // File upload
    const fileDrop = $("file-drop");
    const fileInput = $("file-input");

    fileDrop?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", () => {
      Array.from(fileInput.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => addFile(file.name, e.target.result);
        reader.onerror = () => toast(`Failed to read ${file.name}`, "error");
        reader.readAsText(file);
      });
      fileInput.value = "";
    });

    // Drag & drop
    fileDrop?.addEventListener("dragover", (e) => {
      e.preventDefault();
      fileDrop.classList.add("dragging");
    });
    fileDrop?.addEventListener("dragleave", () =>
      fileDrop.classList.remove("dragging")
    );
    fileDrop?.addEventListener("drop", (e) => {
      e.preventDefault();
      fileDrop.classList.remove("dragging");
      Array.from(e.dataTransfer.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => addFile(file.name, e.target.result);
        reader.onerror = () => toast(`Failed to read ${file.name}`, "error");
        reader.readAsText(file);
      });
    });

    // Generate Merge Prompt (Universal)
    function buildPrompt() {
      const projectName = $("project-name")?.value.trim() || "project";
      const preset = $("preset")?.value || "moderate";
      const conflict =
        document.querySelector('input[name="conflict"]:checked')?.value ||
        "most_secure";
      const extra = $("extra-instructions")?.value.trim();
      const preserve = $("preserve-comments")?.checked;
      const dedupe = $("remove-duplicates")?.checked;
      const keepStruct = $("keep-structure")?.checked;
      const allowTS = $("allow-ts")?.checked;

      const files = editors
        .map((e) => ({
          filename: e.fname.value.trim() || "unnamed",
          content: e.cm ? e.cm.getValue() : e.ta.value,
        }))
        .filter((f) => f.content.length > 0);

      if (files.length === 0) {
        toast("Add at least one file to merge.", "error");
        return "No files provided.";
      }

      const presetDesc =
        {
          mild: "Preserve all logic with minimal restructuring.",
          moderate: "Reorganize where beneficial for clarity and reuse.",
          refactor:
            "Fully refactor for optimal structure, performance, and maintainability.",
          "ui-component":
            "Merge multiple UI component implementations (React, Vue, etc.) into a consistent, reusable library.",
          "client-hook":
            "Merge custom hooks, composables, or client-side logic with consistent APIs.",
          script:
            "Merge automation, CLI, or utility scripts into a coherent toolset.",
          config:
            "Merge config files, rules, or policy scripts into a unified system.",
        }[preset] || "No goal specified.";

      const lines = [
        "You are an expert senior software engineer and code reviewer.",
        "Task: Merge the following code files into a single, coherent, enterprise-grade codebase.",
        projectName && `Target project: ${projectName}`,
        `Merge goal: ${presetDesc}`,
        "Rules:",
        "1) PRESERVE ALL vital logic and business behavior.",
        "2) Eliminate duplicate logic if enabled.",
        "3) Keep clear module/file structure.",
        "4) Conflict resolution: prefer " + conflict,
        "5) SECURITY & PERFORMANCE: flag and fix obvious issues.",
        "6) OUTPUT: Return a single merged codebase with:",
        "   - Unified logic",
        "   - README with decisions and usage",
        "   - Change-log mapping original → new files",
        "   - Clear folder structure",
        "   - Use consistent filenames that match the original structure for proper version tracking",
        "   - When updating existing components, use the exact same filename to maintain version history",
        preserve && "   - Original comments preserved",
        dedupe && "   - Duplicate logic removed",
        keepStruct && "   - Existing structure preserved",
        allowTS && "   - TypeScript allowed",
        extra && `Extra instructions: ${extra}`,
        "7) VERSIONING GUIDELINES:",
        "   - ALWAYS use the `filename:` parameter in code blocks",
        "   - Use the exact same filename when updating existing components",
        "   - Only change filenames for major refactors or new components",
        "   - This ensures proper version tracking in the chat code extractor",
        "--- BEGIN FILES ---",
        ...files.map(
          (f, i) => `### FILE ${i + 1}: ${f.filename} ###\n${f.content}`
        ),
        "--- END FILES ---",
        "Deliverables:",
        "- A single merged codebase with clear structure.",
        "- README with decisions and run instructions.",
        "- Change-log mapping original to new files.",
        "Output Format:",
        "```jsx filename:path/to/merged/file.jsx",
        "// Merged code here",
        "// Maintain original filenames for version tracking",
        "```",
      ]
        .filter(Boolean)
        .join("\n");

      return lines;
    }

    $("generate")?.addEventListener("click", () => {
      const prompt = buildPrompt();
      $("preview").textContent = prompt;
      toast("Merge prompt generated.", "ok");
    });

    // Copy/Download
    $("copy")?.addEventListener("click", () => {
      const text = $("preview")?.textContent;
      if (!text) return toast("Nothing to copy.", "error");
      navigator.clipboard.writeText(text).then(() => toast("Copied.", "ok"));
    });

    $("copy-md")?.addEventListener("click", () => {
      const text = $("preview")?.textContent;
      if (!text) return;
      const md = "```\n" + text + "\n```";
      navigator.clipboard
        .writeText(md)
        .then(() => toast("Copied as Markdown.", "ok"));
    });

    $("download")?.addEventListener("click", () => {
      const text = $("preview")?.textContent;
      if (!text) return;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: "merge-prompt.txt",
      });
      a.click();
      URL.revokeObjectURL(url);
    });

    // Stats
    function updateStats() {
      const files = editors
        .map((e) => ({
          filename: e.fname.value.trim() || "unnamed",
          content: e.cm ? e.cm.getValue() : e.ta.value,
        }))
        .filter((f) => f.content.length > 0);

      const chars = files.reduce((sum, f) => sum + f.content.length, 0);
      const tokens = Math.ceil(chars / 4);

      if ($("file-count")) $("file-count").textContent = files.length;
      if ($("char-count")) $("char-count").textContent = chars;
      if ($("token-estimate")) {
        $("token-estimate").textContent = tokens;
        $("token-estimate").className =
          "badge " + (tokens > 32000 ? "danger" : tokens > 16000 ? "" : "ok");
      }
    }

    function scanDuplicates() {
      const dupListEl = $("dup-list");
      if (!dupListEl) return;
      dupListEl.innerHTML =
        '<div class="muted">Run "Re-scan" to detect duplicates.</div>';
    }

    // Network status
    function updateNetwork() {
      const online = navigator.onLine;
      const dot = $("dot");
      const netText = $("net-text");
      if (dot) dot.className = "dot " + (online ? "online" : "offline");
      if (netText)
        netText.textContent = online
          ? "online"
          : "offline (working from cache)";
    }
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    updateNetwork();
  } catch (e) {
    console.error("Merge Builder init failed:", e);
    toast("Merge Builder failed to initialize.", "error");
  }
}

// --- Stages 2–5: Prompt Generators ---
function prompt2(c) {
  return `ROLE: You are a code archaeologist.
INPUTS:
- Project: ${c.project}
- Module: ${c.module}
- File: ${c.serviceName}
- Collections: ${c.collections}
- Project type: ${c.projectType}
- Stated goal: ${c.useCase || "Not specified"}
- Dependency level: ${c.dependencies}
- Merged service code:

\`\`\`jsx filename:${c.serviceName}
${c.code}
\`\`\`

OBJECTIVE:
Identify all business logic touching PocketBase.

VERSIONING INSTRUCTIONS:
- When referencing this file in your analysis, use the exact filename: ${
    c.serviceName
  }
- This ensures proper tracking in the version control system
- If you reference other files, use their full path with the \`filename:\` parameter

DELIVERABLES:
A. "Business Logic Found"
B. "Data Flow"
C. "Risks"
D. "Cron Opportunities"

DO NOT:
- Suggest fixes
- Propose hooks
- Refactor code

Just report what exists. When documenting findings, reference files using the format:
\`\`\`filename:path/to/file.jsx
// Reference to specific file
\`\`\``;
}

function prompt3(c) {
  return `ROLE: You are a PocketBase cron architect.
INPUTS:
- Project: ${c.project}
- Module: ${c.module}
- File: ${c.serviceName}
- Collections: ${c.collections}
- This service is "${c.dependencies}" dependency —
  ${
    c.dependencies === "high"
      ? "CRITICAL — do NOT remove endpoints. Instead, make them call cron jobs internally."
      : "Safe to restructure, but preserve API shape."
  }
- Code:

\`\`\`jsx filename:${c.serviceName}
${c.code}
\`\`\`

OBJECTIVE:
Detect and extract scheduled logic.

VERSIONING GUIDELINES:
- When creating new cron job files, use descriptive filenames with the \`filename:\` parameter
- When modifying existing files, use the exact same filename (${
    c.serviceName
  }) to maintain version history
- All new files should follow the project's folder structure: /${
    c.module
  }/services/crons/
- This ensures proper tracking in the version control system

DELIVERABLES:
A. "Cron Opportunities"
B. "Cron Job Code" (use \`filename:\` parameter for each new cron file)
C. "Stripped Service" (maintain original filename: ${c.serviceName})
D. "API Plan"
E. "Migration"

OUTPUT FORMAT:
For each deliverable, use the appropriate format:
\`\`\`filename:path/to/new/cron-job.jsx
// Cron job code
\`\`\`
\`\`\`filename:${c.serviceName}
// Modified service code (preserve filename for version tracking)
\`\`\`

DO NOT:
- Remove existing endpoints
- Change response shapes
- Use generic filenames like "cron1.js" or "utility.js"
- Omit the \`filename:\` parameter in code blocks`;
}

function prompt4(c) {
  return `ROLE: You are a PocketBase migration engineer.
INPUTS:
- Project: ${c.project}
- Module: ${c.module}
- File: ${c.serviceName}
- Language: ${c.language.toUpperCase()}
- This service is "${c.dependencies}" dependency — ${
    c.dependencies === "high"
      ? "CRITICAL — used across the app. Migration must be backward-compatible."
      : "safe to modify."
  }
- Business logic (from Stage 2):

\`\`\`${c.language} filename:${c.serviceName}
${c.constraints}
\`\`\`

OBJECTIVE:
Move logic into pb_hooks.

VERSIONING REQUIREMENTS:
- When creating new hook files, use the \`filename:\` parameter with proper paths: /pb_hooks/FILENAME.js
- When modifying the original service, use the exact same filename (${
    c.serviceName
  }) to maintain version history
- All new files must follow the standard structure: /pb_hooks/collections/, /pb_hooks/mails/, /pb_hooks/realtime/, etc.
- This ensures proper tracking in the version control system

DELIVERABLES:
1. "Extraction Map" - Map showing what logic moves where
2. "Folder Structure" - Complete structure with all new files
3. "pb_hooks Snippet" (use \`filename:\` parameter for each hook file)
4. "Client Service" - Updated client service (maintain original filename: ${
    c.serviceName
  })
5. "Migration Steps" - Step-by-step guide

OUTPUT FORMAT:
For code deliverables, use the appropriate format:
\`\`\`js filename:pb_hooks/collections/${c.module}.js
// Hook implementation
\`\`\`
\`\`\`${c.language} filename:${c.serviceName}
// Updated service code (preserve filename for version tracking)
\`\`\`
\`\`\`js filename:pb_hooks/mails/notifications.js
// Mail hook implementation
\`\`\`

DO NOT:
- Harden code
- Suggest cron jobs
- Use generic filenames like "hook1.js" or "utility.js"
- Omit the \`filename:\` parameter in code blocks
- Change the original filename when updating existing services`;
}

function prompt5(c) {
  return `ROLE: You are a code quality auditor.
INPUTS:
- Project: ${c.project}
- Module: ${c.module}
- File: ${c.serviceName}
- Security: ${c.security}
- This code is "${c.dependencies}" dependency —
  ${
    c.dependencies === "high"
      ? "HIGH-IMPACT — many components depend on it. Only fix, never change behavior."
      : "safe to improve as it has limited dependencies."
  }
- Code:

\`\`\`filename:${c.serviceName}
${c.code}
\`\`\`

OBJECTIVE:
Make this code production-ready.

VERSIONING INSTRUCTIONS:
- When returning refactored code, use the exact same filename (${
    c.serviceName
  }) to maintain version history
- This ensures proper tracking in the version control system and allows comparison between versions
- All code blocks must include the \`filename:\` parameter
- Do not change the file extension unless absolutely necessary for the fixes

DELIVERABLES:
A. "Audit" - Comprehensive code quality assessment
B. "Refactored Code" (use same filename: ${c.serviceName} for version tracking)
C. "Test Ideas" - Suggestions for unit and integration tests

OUTPUT FORMAT:
For code deliverables, use the format:
\`\`\`filename:${c.serviceName}
// Refactored code - maintain original filename for version tracking
\`\`\`

DO NOT:
- Move logic to backend
- Suggest cron jobs
- Change the original filename
- Omit the \`filename:\` parameter in code blocks
- Modify the behavior of high-dependency code`;
}

// --- Context ---
function ctx() {
  const projectType =
    safeValue("projectType") === "custom"
      ? safeValue("customProjectType") || "custom project"
      : {
          saas: "SaaS platform with subscriptions and billing",
          delivery:
            "Delivery/logistics app with agents, zones, and realtime tracking",
          marketplace: "Two-sided marketplace with buyers and sellers",
          admin: "Internal admin dashboard with audit and controls",
          social: "Social app with feeds, notifications, and user content",
        }[safeValue("projectType")] || "custom project";

  return {
    project: safeValue("project") || "My Project",
    module: safeValue("module") || "core",
    serviceName: safeValue("serviceName") || "service.js",
    language: safeValue("language") || "go",
    collections: safeValue("collections") || "records",
    security: safeValue("security") || "standard",
    style: safeValue("style") || "js",
    constraints: safeValue("constraints"),
    code: safeValue("code"),
    useCase: safeValue("useCase"),
    projectType,
    dependencies: safeValue("dependencies") || "high",
  };
}

function requireCode() {
  const { code } = ctx();
  if (!code || code.trim().length < 10) {
    toast("Please paste code to analyze (at least 10 characters).", "error");
    return false;
  }
  return true;
}

// --- Generate Safely ---
function safeGenerate(genFn, outId) {
  try {
    if (!requireCode()) return;
    const c = ctx();
    const txt = genFn(c);
    const out = $(outId);
    if (!out) throw new Error(`Output element #${outId} not found`);
    out.textContent = txt;
    out.classList.add("generated");
    setTimeout(() => out.classList.remove("generated"), 2000);
    toast("Prompt generated.", "ok");
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    console.error("Prompt generation failed:", err);
    toast("Failed to generate prompt. Check console.", "error");
  }
}

// Attach Stage 2–5
["gen2", "gen3", "gen4", "gen5"].forEach((genId, i) => {
  const id = i + 2;
  const gen = $(genId);
  if (gen)
    gen.addEventListener("click", () =>
      safeGenerate(window[`prompt${id}`], `out${id}`)
    );
});

// Auto-save stages 2–5
["p2", "p3", "p4", "p5"].forEach((stage) => {
  const key = STORAGE_KEYS[stage];
  const fields = [
    "project",
    "module",
    "serviceName",
    "useCase",
    "dependencies",
    "constraints",
    "code",
    "language",
    "security",
    "style",
    "projectType",
    "customProjectType",
  ];
  autoSaveStage(key, fields);
});

// Copy & Clear
for (let i = 2; i <= 5; i++) {
  const copy = $(`copy${i}`);
  if (copy) copy.addEventListener("click", () => copyFrom(`out${i}`));
  const clear = $(`clear${i}`);
  if (clear)
    clear.addEventListener("click", () => {
      const out = $(`out${i}`);
      if (out) out.textContent = "";
      toast("Cleared.");
    });
}

// Next Buttons
if ($("next2")) $("next2").addEventListener("click", () => activateTab("p3"));
if ($("next3")) $("next3").addEventListener("click", () => activateTab("p4"));
if ($("next4")) $("next4").addEventListener("click", () => activateTab("p5"));

// --- Copy Helper ---
function copyFrom(id) {
  const el = $(id);
  if (!el?.textContent) return toast("Nothing to copy.", "error");
  navigator.clipboard.writeText(el.textContent).then(
    () => toast("Copied.", "ok"),
    () => {
      const ta = document.createElement("textarea");
      ta.value = el.textContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Copied (fallback).", "ok");
    }
  );
}

// --- Help Modal ---
function showHelp() {
  const m = $("helpModal");
  if (m) m.style.display = "flex";
}
function closeHelp() {
  const m = $("helpModal");
  if (m) m.style.display = "none";
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeHelp();
});

// --- DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
  try {
    setupThemeToggle();
    setupStage0();

    // Tab listeners
    document.querySelectorAll(".workflow-step").forEach((step) => {
      step.addEventListener("click", () => {
        const tabId = step.dataset.step;
        activateTab(tabId);
      });
    });

    // Initial tab
    activateTab("p0");
  } catch (e) {
    console.error("Initialization failed:", e);
    toast("App failed to initialize.", "error");
  }
});
