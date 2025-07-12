function generatePrompt() {
  const screen = document.getElementById("screenName").value.trim();
  const feature = document.getElementById("featureDesc").value.trim();
  const comps = document.getElementById("components").value.trim();
  const collections = document.getElementById("collections").value.trim();
  const reusable = document.getElementById("reusable").value.trim();
  const designGuide = document.getElementById("designGuide").value.trim();
  const role = document.getElementById("role").value;

  const prompt = `
You are an expert frontend engineer. I want you to build the **${screen}** screen in **React with Tailwind CSS**.

🔧 Folder Structure for the ${
    role.charAt(0).toUpperCase() + role.slice(1)
  } Section:
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

💡 Screen Summary:
- Role: **${role}**
- Screen: **${screen}**
- Feature: **${feature}**
- Required Components: **${comps}**
- Use PocketBase collections: **${collections}**
- Simulate the data fetch with async hooks in \`/${role}/services\`

🎨 UI Guidelines (Manually Specified):
${designGuide}

📦 Reuse Guidance (Manually Listed):
${reusable}

📦 Output:
- Output each component or file one at a time in this format:

\`\`\`jsx
📄 File: /${role}/components/ComponentName.jsx
[code here]
\`\`\`

⚠️ Do NOT include all code in a single file. Split components, pages, services, and hooks into separate code blocks, each with a clear file path.

✅ Start by outputting \`/${role}/pages/${screen}.jsx\` and one shared component like a Modal or Table. Wait for feedback before continuing.
`;

  document.getElementById("output").value = prompt.trim();
}

function copyToClipboard() {
  const output = document.getElementById("output");
  navigator.clipboard.writeText(output.value).then(() => {
    alert("Prompt copied to clipboard!");
  });
}

function savePrompt() {
  const values = {
    screen: document.getElementById("screenName").value,
    feature: document.getElementById("featureDesc").value,
    comps: document.getElementById("components").value,
    collections: document.getElementById("collections").value,
    reusable: document.getElementById("reusable").value,
    designGuide: document.getElementById("designGuide").value,
    role: document.getElementById("role").value,
  };
  localStorage.setItem("savedPrompt", JSON.stringify(values));
  alert("Prompt saved!");
}

function loadPrompt() {
  const saved = JSON.parse(localStorage.getItem("savedPrompt"));
  if (saved) {
    document.getElementById("screenName").value = saved.screen;
    document.getElementById("featureDesc").value = saved.feature;
    document.getElementById("components").value = saved.comps;
    document.getElementById("collections").value = saved.collections;
    document.getElementById("reusable").value = saved.reusable;
    document.getElementById("designGuide").value = saved.designGuide;
    document.getElementById("role").value = saved.role;
    alert("Prompt loaded!");
  } else {
    alert("No saved prompt found.");
  }
}

function downloadPrompt() {
  const blob = new Blob([document.getElementById("output").value], {
    type: "text/markdown",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt.md";
  a.click();
  URL.revokeObjectURL(url);
}
