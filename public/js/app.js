const platformIcons = {
  tiktok: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6a2.6 2.6 0 0 1 2.6-2.55c.27 0 .53.04.78.11V9.6a5.82 5.82 0 0 0-.78-.05A5.83 5.83 0 0 0 4 15.38a5.83 5.83 0 0 0 5.86 5.79 5.83 5.83 0 0 0 5.86-5.8V9.01a7.33 7.33 0 0 0 4.28 1.37V7.3a4.28 4.28 0 0 1-3.4-1.48Z" fill="#ff004f"/></svg>`,
  "youtube-shorts": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.12.44.2 1.03.26 1.79.06.76.08 1.41.08 1.98L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.44.12-1.25.2-2.48.26-1.21.06-2.33.08-3.35.08L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.12-.44-.2-1.03-.26-1.79C2.12 14.28 2 13.63 2 13.06L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.44-.12 1.25-.2 2.48-.26 1.21-.06 2.33-.08 3.35-.08L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" fill="#ff0000"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#fdf497"/><stop offset="5%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="url(#ig)"/></svg>`,
  pinterest: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.481 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#E60023"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="#ffffff"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill="#1877F2"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/></svg>`,
  douyin: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6a2.6 2.6 0 0 1 2.6-2.55c.27 0 .53.04.78.11V9.6a5.82 5.82 0 0 0-.78-.05A5.83 5.83 0 0 0 4 15.38a5.83 5.83 0 0 0 5.86 5.79 5.83 5.83 0 0 0 5.86-5.8V9.01a7.33 7.33 0 0 0 4.28 1.37V7.3a4.28 4.28 0 0 1-3.4-1.48Z" fill="#25f4ee"/><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6a2.6 2.6 0 0 1 2.6-2.55c.27 0 .53.04.78.11V9.6a5.82 5.82 0 0 0-.78-.05A5.83 5.83 0 0 0 4 15.38a5.83 5.83 0 0 0 5.86 5.79 5.83 5.83 0 0 0 5.86-5.8V9.01a7.33 7.33 0 0 0 4.28 1.37V7.3a4.28 4.28 0 0 1-3.4-1.48Z" fill="#fe2c55" opacity="0.5" transform="translate(0.5, -0.5)"/></svg>`,
  capcut: `<img src="/icons/capcut.png" alt="CapCut" />`,
  "apple-music": `<img src="/icons/apple-music.png" alt="Apple Music" />`,
  linkedin: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.604c.037.209.055.423.055.638 0 3.26-3.8 5.903-8.481 5.903S1.159 17.502 1.159 14.242c0-.215.018-.43.055-.638a1.681 1.681 0 0 1-.697-1.367c0-.928.753-1.681 1.681-1.681.449 0 .856.177 1.157.465 1.283-.906 3.053-1.488 5.013-1.56l.943-4.407a.38.38 0 0 1 .461-.298l3.12.658a1.19 1.19 0 0 1 2.218.56 1.19 1.19 0 0 1-1.188 1.19 1.19 1.19 0 0 1-1.174-1.003l-2.78-.587-.838 3.92c1.93.082 3.668.662 4.933 1.56a1.674 1.674 0 0 1 1.157-.465c.928 0 1.681.753 1.681 1.681 0 .561-.276 1.058-.697 1.367zM8.834 13.053a1.19 1.19 0 1 0 0 2.38 1.19 1.19 0 0 0 0-2.38zm6.332 0a1.19 1.19 0 1 0 0 2.38 1.19 1.19 0 0 0 0-2.38zm-5.904 3.883c-.088-.088-.088-.23 0-.318.088-.088.23-.088.318 0 .777.777 2.009 1.155 2.42 1.155.41 0 1.643-.378 2.42-1.155a.225.225 0 0 1 .318 0c.088.088.088.23 0 .318-.852.852-2.2 1.272-2.738 1.272-.538 0-1.886-.42-2.738-1.272z" fill="#FF4500"/></svg>`,
};

const platformLabels = {
  tiktok: "TikTok",
  "youtube-shorts": "YouTube Shorts",
  instagram: "Instagram",
  pinterest: "Pinterest",
  twitter: "Twitter / X",
  facebook: "Facebook Reels",
  youtube: "YouTube MP4",
  douyin: "Douyin",
  capcut: "CapCut",
  "apple-music": "Apple Music",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};



const urlInput = document.getElementById("urlInput");
const pasteButton = document.getElementById("pasteButton");
const downloadButton = document.getElementById("downloadButton");
const platformIndicator = document.getElementById("platformIndicator");
const resultSection = document.getElementById("resultSection");
const historyList = document.getElementById("historyList");
const qualitySelect = document.getElementById("qualitySelect");
const platformGrid = document.getElementById("platformGrid");
const toastContainer = document.getElementById("toastContainer");
const spinner = downloadButton.querySelector(".spinner");
const buttonText = downloadButton.querySelector(".button-text");
const placeholderImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="600" height="750" rx="24" fill="#141416"/><rect x="40" y="40" width="520" height="670" rx="16" fill="#19191c"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#ececef" font-size="36" font-family="Inter, sans-serif">Download Ready</text><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#8b8b96" font-size="20" font-family="Inter, sans-serif">Thumbnail unavailable</text></svg>'
  );

let selectedPlatform = null;

const supportedPlatforms = Object.keys(platformLabels);

function detectPlatform(url) {
  const value = String(url || "").toLowerCase().trim();
  if (!value) return null;
  if ((value.includes("youtube.com/shorts/") || value.includes("youtu.be/")) && value.includes("shorts")) return "youtube-shorts";
  if (value.includes("tiktok.com") || value.includes("vm.tiktok.com")) return "tiktok";
  if (value.includes("instagram.com") || value.includes("instagr.am")) return "instagram";
  if (value.includes("pinterest.com") || value.includes("pin.it")) return "pinterest";
  if (value.includes("twitter.com") || value.includes("x.com")) return "twitter";
  if (value.includes("facebook.com") || value.includes("fb.watch")) return "facebook";
  if (value.includes("douyin.com") || value.includes("iesdouyin.com")) return "douyin";
  if (value.includes("capcut.com")) return "capcut";
  if (value.includes("music.apple.com")) return "apple-music";
  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("reddit.com") || value.includes("redd.it")) return "reddit";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  return null;
}

function setPlatformIndicator(platform) {
  const dot = document.querySelector(".dl-detect-dot");
  if (!platform) {
    if (selectedPlatform) {
      platformIndicator.innerHTML = `${platformIcons[selectedPlatform]} ${escapeHtml(platformLabels[selectedPlatform])}`;
      platformIndicator.classList.add("detected");
      if (dot) dot.classList.add("active");
    } else {
      platformIndicator.textContent = "Waiting for URL...";
      platformIndicator.classList.remove("detected");
      if (dot) dot.classList.remove("active");
    }
    return;
  }

  const icon = platformIcons[platform] || "🔗";
  const label = platformLabels[platform] || platform;
  platformIndicator.innerHTML = `${icon} ${escapeHtml(label)}`;
  platformIndicator.classList.add("detected");
  if (dot) dot.classList.add("active");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function setLoading(loading) {
  downloadButton.disabled = loading;
  spinner.classList.toggle("hidden", !loading);
  buttonText.textContent = loading ? "Processing..." : "Download";
}

function saveHistory(entry) {
  const current = JSON.parse(localStorage.getItem("socialDlHistory") || "[]");
  current.unshift({
    title: entry.title,
    platform: entry.platform,
    type: entry.type,
    downloadUrl: entry.downloadUrl || (entry.files && entry.files[0] && entry.files[0].downloadUrl) || "",
    thumbnail: entry.thumbnail || "",
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("socialDlHistory", JSON.stringify(current.slice(0, 8)));
  renderHistory();
}

function renderHistory() {
  const current = JSON.parse(localStorage.getItem("socialDlHistory") || "[]");
  if (!current.length) {
    historyList.innerHTML = '<div class="empty-state">No downloads yet.</div>';
    return;
  }

  historyList.innerHTML = current
    .map(
      (item) => `
        <div class="history-item">
          <div>
            <h4>${escapeHtml(item.title || "Untitled")}</h4>
            <p>${escapeHtml(platformLabels[item.platform] || item.platform)} • ${escapeHtml(item.type || "file")}</p>
          </div>
          <div class="history-actions">
            <button class="chip-button" data-history-url="${escapeHtmlAttr(item.downloadUrl)}">Open</button>
          </div>
        </div>
      `
    )
    .join("");

  historyList.querySelectorAll("[data-history-url]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-history-url");
      if (target) {
        window.open(target, "_blank", "noopener");
      }
    });
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function renderResult(data) {
  const metaTags = [
    platformLabels[data.platform] || data.platform,
    data.contentTypeLabel || data.type,
  ]
    .filter(Boolean)
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("");

  const singleDownload = data.downloadUrl
    ? `<a class="download-link" href="${escapeHtmlAttr(data.downloadUrl)}" target="_blank" rel="noopener">Download</a>`
    : "";

  const downloadAll =
    Array.isArray(data.files) && data.files.length
      ? `<button class="chip-button" id="downloadAllButton" type="button">Download All</button>`
      : "";

  const filesGrid =
    Array.isArray(data.files) && data.files.length
      ? `
        <div class="files-grid">
          ${data.files
            .map(
              (file, index) => `
                <div class="file-card">
                  ${file.type === "image" ? `<img src="${escapeHtmlAttr(file.downloadUrl)}" alt="Preview ${index + 1}" />` : ""}
                  <strong>${escapeHtml(file.name || `File ${index + 1}`)}</strong>
                  <span>${escapeHtml(file.quality || file.type || "media")}</span>
                  <a class="chip-button" href="${escapeHtmlAttr(file.downloadUrl)}" target="_blank" rel="noopener">Download</a>
                </div>
              `
            )
            .join("")}
        </div>
      `
      : "";

  resultSection.innerHTML = `
    <article class="result-card">
      <div class="result-media">
        <img src="${escapeHtmlAttr(data.thumbnail || placeholderImage)}" alt="Thumbnail" />
      </div>
      <div class="result-body">
        <h3>${escapeHtml(data.title || "Download Ready")}</h3>
        <div class="meta-line">${metaTags}</div>
        <div class="meta-line">${singleDownload}${downloadAll}</div>
        ${filesGrid}
      </div>
    </article>
  `;

  const downloadAllButton = document.getElementById("downloadAllButton");
  if (downloadAllButton) {
    downloadAllButton.addEventListener("click", () => {
      data.files.forEach((file, index) => {
        window.setTimeout(() => {
          window.open(file.downloadUrl, "_blank", "noopener");
        }, index * 200);
      });
    });
  }
}

function renderPlatformCards() {
  platformGrid.innerHTML = supportedPlatforms
    .map(
      (platform) => `
        <button class="platform-card ${selectedPlatform === platform ? "active" : ""}" data-platform="${platform}" type="button">
          <div class="icon">${platformIcons[platform]}</div>
          <strong>${platformLabels[platform]}</strong>
        </button>
      `
    )
    .join("");

  platformGrid.querySelectorAll("[data-platform]").forEach((card) => {
    card.addEventListener("click", () => {
      selectedPlatform = card.getAttribute("data-platform");
      renderPlatformCards();
      setPlatformIndicator(detectPlatform(urlInput.value) || selectedPlatform);
      showToast(`Selected ${platformLabels[selectedPlatform]}.`, "success");
    });
  });
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlInput.value = text.trim();
      setPlatformIndicator(detectPlatform(text) || selectedPlatform);
    }
  } catch (error) {
    showToast("Clipboard access is unavailable.", "error");
  }
}

async function submitDownload() {
  const url = urlInput.value.trim();
  const detectedPlatform = detectPlatform(url);
  const platform = detectedPlatform || selectedPlatform;

  if (!url) {
    showToast("Paste a URL first.", "error");
    return;
  }

  if (!platform) {
    showToast("Platform could not be detected.", "error");
    return;
  }

  setLoading(true);
  resultSection.innerHTML = "";

  try {
    const response = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        platform,
        quality: qualitySelect.value || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Download failed.");
    }

    renderResult(data);
    saveHistory(data);
    showToast("Media is ready to download.");
  } catch (error) {
    showToast(error.message || "Download failed.", "error");
  } finally {
    setLoading(false);
  }
}

urlInput.addEventListener("input", () => {
  setPlatformIndicator(detectPlatform(urlInput.value) || selectedPlatform);
});

pasteButton.addEventListener("click", handlePaste);
downloadButton.addEventListener("click", submitDownload);
urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitDownload();
  }
});

renderPlatformCards();
renderHistory();
setPlatformIndicator(null);
