require("dotenv").config();

const cors = require("cors");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");
const ytDlp = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const app = express();
const PORT = 3000;
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const REQUEST_TIMEOUT = 120000;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const TEMP_TTL = 30 * 60 * 1000;
const TEMP_ROOT = path.join(os.tmpdir(), "social-dl");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const DEFAULT_COOKIES_FILE = "/root/wangsaf/cookies.txt";
const YTDLP_COOKIES_FILE = process.env.YTDLP_COOKIES_FILE || (fs.existsSync(DEFAULT_COOKIES_FILE) ? DEFAULT_COOKIES_FILE : null);
const FERDEV_API_KEY = process.env.FERDEV_API_KEY || "RS-uy99r32nan";
const execFileAsync = promisify(execFile);

fs.mkdirSync(TEMP_ROOT, { recursive: true });

const rateLimitStore = new Map();
const tempFiles = new Map();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const bucket = rateLimitStore.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW;
  }

  bucket.count += 1;
  rateLimitStore.set(key, bucket);

  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: "Rate limit exceeded. Please wait before trying again.",
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", Math.max(RATE_LIMIT_MAX - bucket.count, 0));
  next();
});

const http = axios.create({
  timeout: REQUEST_TIMEOUT,
  maxBodyLength: MAX_FILE_SIZE,
  maxContentLength: MAX_FILE_SIZE,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: "*/*",
  },
});

const platformDefinitions = [
  {
    key: "tiktok",
    name: "TikTok",
    typeLabel: "No Watermark",
    patterns: [/tiktok\.com/i, /vm\.tiktok\.com/i],
  },
  {
    key: "youtube-shorts",
    name: "YouTube Shorts",
    typeLabel: "Video",
    patterns: [/youtube\.com\/shorts\//i, /youtu\.be\//i],
  },
  {
    key: "instagram",
    name: "Instagram",
    typeLabel: "Reel / Story / Post",
    patterns: [/instagram\.com/i, /instagr\.am/i],
  },
  {
    key: "pinterest",
    name: "Pinterest",
    typeLabel: "Video / Image",
    patterns: [/pinterest\.com/i, /pin\.it/i],
  },
  {
    key: "twitter",
    name: "Twitter / X",
    typeLabel: "Video / Image",
    patterns: [/twitter\.com/i, /x\.com/i],
  },
  {
    key: "facebook",
    name: "Facebook",
    typeLabel: "Video",
    patterns: [/facebook\.com/i, /fb\.watch/i],
  },
  {
    key: "youtube",
    name: "YouTube MP4",
    typeLabel: "Video",
    patterns: [/youtube\.com/i, /youtu\.be/i],
  },
  {
    key: "douyin",
    name: "Douyin",
    typeLabel: "Video / Image",
    patterns: [/douyin\.com/i, /iesdouyin\.com/i],
  },
  {
    key: "capcut",
    name: "CapCut",
    typeLabel: "Template / Video",
    patterns: [/capcut\.com/i],
  },
  {
    key: "apple-music",
    name: "Apple Music",
    typeLabel: "Preview Audio",
    patterns: [/music\.apple\.com/i],
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    typeLabel: "Video / Post",
    patterns: [/linkedin\.com/i],
  },
  {
    key: "reddit",
    name: "Reddit",
    typeLabel: "Video / Image",
    patterns: [/reddit\.com/i, /redd\.it/i],
  },
];

function logDownload(message, meta = {}) {
  const timestamp = new Date().toISOString();
  const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[${timestamp}] ${message}${suffix}`);
}

function detectPlatform(input) {
  const url = String(input || "").trim();

  for (const platform of platformDefinitions) {
    if (platform.patterns.some((pattern) => pattern.test(url))) {
      if (platform.key === "youtube-shorts" && !/\/shorts\//i.test(url)) {
        continue;
      }

      if (platform.key === "youtube" && /\/shorts\//i.test(url)) {
        continue;
      }

      return platform.key;
    }
  }

  return null;
}

function normalizeUrl(url, platform) {
  let normalized = String(url || "").trim();

  if (platform === "instagram") {
    try {
      const u = new URL(normalized);
      u.protocol = "https:";
      u.hostname = "www.instagram.com";
      u.hash = "";

      // Normalize path variants
      let p = u.pathname.replace(/\/reels\//i, "/reel/");
      if (!p.endsWith("/")) p += "/";
      u.pathname = p;

      // Keep only param that can be relevant for carousel posts
      const keep = new URLSearchParams();
      if (u.searchParams.has("img_index")) {
        keep.set("img_index", u.searchParams.get("img_index"));
      }
      u.search = keep.toString() ? `?${keep.toString()}` : "";

      normalized = u.toString();
    } catch {
      normalized = normalized.replace("instagr.am", "www.instagram.com").replace("/reels/", "/reel/");
    }
  }

  if (platform === "facebook") {
    normalized = normalized
      .replace("https://web.facebook.com", "https://www.facebook.com")
      .replace("https://m.facebook.com", "https://www.facebook.com");
  }

  return normalized;
}

function validateUrl(input) {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function getPlatformMeta(platform) {
  return platformDefinitions.find((entry) => entry.key === platform) || null;
}

function isUrlCompatibleWithPlatform(url, platform) {
  const meta = getPlatformMeta(platform);
  if (!meta) return false;

  const matchesPattern = meta.patterns.some((pattern) => pattern.test(url));
  if (!matchesPattern) return false;

  if (platform === "youtube-shorts") {
    return /youtube\.com\/shorts\//i.test(url) || /youtu\.be\//i.test(url);
  }

  if (platform === "youtube") {
    return /youtube\.com/i.test(url) || /youtu\.be/i.test(url);
  }

  return true;
}

function isYtAuthChallenge(text) {
  const lowered = String(text || "").toLowerCase();
  return (
    lowered.includes("sign in to confirm") ||
    lowered.includes("account authentication is required") ||
    lowered.includes("cookies") ||
    lowered.includes("not a bot") ||
    lowered.includes("please log in")
  );
}

function normalizeYtDlpError(error) {
  const raw = String(error?.stderr || error?.stdout || error?.message || "Download failed.");
  const lowered = raw.toLowerCase();

  if (isYtAuthChallenge(lowered)) {
    if (lowered.includes("instagram")) {
      return "Instagram sedang membatasi akses automated request (login/challenge). Coba link Reel publik lain atau tunggu beberapa menit lalu retry.";
    }
    return "YouTube blocked automated access for this video (bot/cookie challenge). Coba video Shorts lain atau gunakan link publik tanpa age/login restriction.";
  }

  if (lowered.includes("private video") || lowered.includes("login required")) {
    return "Video ini private / butuh login, jadi belum bisa diunduh.";
  }

  if (lowered.includes("video unavailable") || lowered.includes("not available")) {
    return "Video tidak tersedia atau sudah dihapus.";
  }

  if (lowered.includes("cannot parse data") || lowered.includes("extractor error")) {
    return "Extractor provider lagi error untuk link ini. Coba lagi bentar atau pakai URL Facebook publik lain.";
  }

  return raw.split("\n")[0].trim().slice(0, 300) || "Download failed.";
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&#47;/g, "/");
}

function buildProxyUrl(url, filename) {
  const params = new URLSearchParams({ url: decodeHtmlEntities(url) });
  if (filename) {
    params.set("filename", filename);
  }
  return `/api/fetch?${params.toString()}`;
}

function registerTempFile(filePath, filename, contentType) {
  const id = uuidv4();
  tempFiles.set(id, {
    filePath,
    filename: filename || path.basename(filePath),
    contentType: contentType || "application/octet-stream",
    createdAt: Date.now(),
  });
  return `/api/fetch?file=${encodeURIComponent(id)}`;
}

function cleanupTempFiles() {
  const now = Date.now();
  for (const [id, entry] of tempFiles.entries()) {
    if (now - entry.createdAt > TEMP_TTL) {
      tempFiles.delete(id);
      fs.promises.unlink(entry.filePath).catch(() => {});
    }
  }
}

setInterval(cleanupTempFiles, 5 * 60 * 1000).unref();

async function downloadToTempFile(url, extension = "bin", requestHeaders = {}) {
  const tempId = uuidv4();
  const filePath = path.join(TEMP_ROOT, `${tempId}.${extension}`);
  const writer = fs.createWriteStream(filePath);
  const response = await http.get(url, {
    responseType: "stream",
    headers: requestHeaders,
  });

  let totalBytes = 0;
  await new Promise((resolve, reject) => {
    response.data.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_FILE_SIZE) {
        response.data.destroy(new Error("File exceeds 500MB limit."));
      }
    });
    response.data.on("error", reject);
    writer.on("error", reject);
    writer.on("finish", resolve);
    response.data.pipe(writer);
  });

  return { filePath, contentType: response.headers["content-type"] || "application/octet-stream" };
}

async function createTempDownload(url, outputExtension = "bin", filenameBase = "download") {
  const { filePath, contentType } = await downloadToTempFile(url, outputExtension);
  return registerTempFile(filePath, `${filenameBase}.${outputExtension}`, contentType);
}

function parseDashRepresentations(dashXml) {
  const list = [];
  const repRegex = /<Representation\b([^>]*)>([\s\S]*?)<\/Representation>/gi;
  let match;

  while ((match = repRegex.exec(dashXml))) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const mimeType = (attrs.match(/mimeType="([^"]+)"/i)?.[1] || "").toLowerCase();
    const bandwidth = Number(attrs.match(/bandwidth="(\d+)"/i)?.[1] || 0);
    const baseUrl = body.match(/<BaseURL>([^<]+)<\/BaseURL>/i)?.[1] || "";
    if (!baseUrl) continue;

    list.push({
      mimeType,
      bandwidth,
      url: decodeHtmlEntities(baseUrl),
    });
  }

  const videos = list.filter((x) => x.mimeType.includes("video/mp4")).sort((a, b) => b.bandwidth - a.bandwidth);
  const audios = list.filter((x) => x.mimeType.includes("audio/mp4")).sort((a, b) => b.bandwidth - a.bandwidth);

  return {
    bestVideo: videos[0] || null,
    bestAudio: audios[0] || null,
  };
}

async function tryFacebookDashMerge(url, title = "Facebook Reel") {
  const pageResp = await http.get(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://www.facebook.com/",
    },
  });

  const html = String(pageResp.data || "");
  const manifestMatch = html.match(/"dash_manifest":"([^"]+)"/i);
  if (!manifestMatch?.[1]) {
    throw new Error("DASH manifest not found");
  }

  let dashXml = "";
  try {
    dashXml = JSON.parse(`"${manifestMatch[1]}"`);
  } catch {
    dashXml = manifestMatch[1]
      .replace(/\\u003C/g, "<")
      .replace(/\\u003E/g, ">")
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"');
  }

  const { bestVideo, bestAudio } = parseDashRepresentations(dashXml);
  if (!bestVideo || !bestAudio) {
    throw new Error("No suitable DASH audio/video streams found");
  }

  const videoFile = await downloadToTempFile(bestVideo.url, "mp4", { Referer: "https://www.facebook.com/" });
  const audioFile = await downloadToTempFile(bestAudio.url, "m4a", { Referer: "https://www.facebook.com/" });

  const outputPath = path.join(TEMP_ROOT, `${uuidv4()}.mp4`);
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      videoFile.filePath,
      "-i",
      audioFile.filePath,
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputPath,
    ]);
  } finally {
    fs.promises.unlink(videoFile.filePath).catch(() => {});
    fs.promises.unlink(audioFile.filePath).catch(() => {});
  }

  return {
    success: true,
    platform: "facebook",
    title: safeTitle(title, "Facebook Reel"),
    type: "video",
    thumbnail: null,
    downloadUrl: registerTempFile(outputPath, "facebook-reel.mp4", "video/mp4"),
  };
}

function safeTitle(title, fallback) {
  const cleaned = String(title || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || /^unknown$/i.test(cleaned) || /^untitled$/i.test(cleaned)) {
    return String(fallback || "Untitled");
  }

  return cleaned;
}

async function fetchTikwm(url) {
  const payload = { url, hd: 1 };

  try {
    const response = await http.post("https://tikwm.com/api/", payload, {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://tikwm.com/",
      },
    });
    if (response.data?.data?.code === 0 || response.data?.code === 0) {
      return response.data.data || response.data;
    }
  } catch (error) {
    logDownload("TikWM POST failed", { error: error.message });
  }

  const fallback = await http.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
    headers: { Referer: "https://tikwm.com/" },
  });
  if (fallback.data?.data?.code === 0 || fallback.data?.code === 0) {
    return fallback.data.data || fallback.data;
  }

  throw new Error("Unable to fetch TikTok or Douyin media.");
}

async function fetchCobalt(url) {
  const response = await http.post(
    "https://api.cobalt.tools/",
    { url },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.data) {
    throw new Error("Empty response from Cobalt.");
  }

  if (response.data.status === "error") {
    throw new Error(response.data.text || "Cobalt could not process this URL.");
  }

  return response.data;
}

async function ytDlpMetadata(url, options = {}) {
  const args = {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    noPlaylist: true,
    skipDownload: true,
    addHeader: [`User-Agent:${USER_AGENT}`],
    cookies: options.cookies,
    ...options,
  };

  return ytDlp(url, args);
}

async function ytDlpToTemp(
  url,
  { format, filenameBase, remuxVideo, extractAudio, audioFormat, extractorArgs, retries, cookies } = {}
) {
  const tempId = uuidv4();
  const outputTemplate = path.join(TEMP_ROOT, `${tempId}.%(ext)s`);

  await ytDlp(url, {
    noWarnings: true,
    noCheckCertificates: true,
    noPlaylist: true,
    format,
    remuxVideo,
    extractAudio,
    audioFormat,
    maxFilesize: "500M",
    addHeader: [`User-Agent:${USER_AGENT}`],
    extractorArgs,
    retries,
    cookies,
    output: outputTemplate,
  });

  const matches = fs.readdirSync(TEMP_ROOT).filter((file) => file.startsWith(`${tempId}.`));
  if (!matches.length) {
    throw new Error("yt-dlp did not produce an output file.");
  }

  const fileName = matches[0];
  const filePath = path.join(TEMP_ROOT, fileName);
  const extension = path.extname(fileName).replace(".", "") || "bin";
  const contentType =
    extension === "mp3" || extension === "m4a"
      ? "audio/" + extension
      : extension === "mp4"
        ? "video/mp4"
        : "application/octet-stream";

  return registerTempFile(filePath, `${filenameBase}.${extension}`, contentType);
}

function selectYoutubeFormat(quality) {
  const map = {
    "360p": "bestvideo[height<=360]+bestaudio/best[height<=360]",
    "480p": "bestvideo[height<=480]+bestaudio/best[height<=480]",
    "720p": "bestvideo[height<=720]+bestaudio/best[height<=720]",
    "1080p": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
  };
  return map[quality] || "bestvideo+bestaudio/best";
}

function getYoutubeShortsCandidates(rawUrl) {
  const candidates = [];
  const seen = new Set();

  const pushUnique = (url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push(url);
  };

  pushUnique(String(rawUrl || "").trim());

  try {
    const parsed = new URL(rawUrl);
    if (/youtu\.be$/i.test(parsed.hostname)) {
      const id = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      if (id) {
        pushUnique(`https://www.youtube.com/shorts/${id}`);
        pushUnique(`https://www.youtube.com/watch?v=${id}`);
      }
      return candidates;
    }

    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?#&]+)/i);
    if (shortsMatch?.[1]) {
      const id = shortsMatch[1];
      pushUnique(`https://www.youtube.com/shorts/${id}`);
      pushUnique(`https://www.youtube.com/watch?v=${id}`);
      return candidates;
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId) {
      pushUnique(`https://www.youtube.com/watch?v=${watchId}`);
      pushUnique(`https://www.youtube.com/shorts/${watchId}`);
    }
  } catch (_) {
    // ignore malformed candidate derivation
  }

  return candidates;
}

async function handleTikTok(url, platform) {
  const data = await fetchTikwm(url);
  const title = safeTitle(data.title, platform === "douyin" ? "Douyin Download" : "TikTok Download");
  const thumbnail = data.cover || data.origin_cover || null;

  if (Array.isArray(data.images) && data.images.length) {
    const files = data.images.map((imageUrl, index) => ({
      name: `${title} ${index + 1}.jpg`,
      type: "image",
      downloadUrl: buildProxyUrl(imageUrl, `${title}-${index + 1}.jpg`),
      originalUrl: imageUrl,
    }));

    return {
      success: true,
      platform,
      title,
      type: "image",
      thumbnail,
      files,
    };
  }

  const videoUrl = data.hdplay || data.play || data.wmplay;
  if (!videoUrl) {
    throw new Error("Media URL not found.");
  }

  return {
    success: true,
    platform,
    title,
    type: "video",
    thumbnail,
    downloadUrl: buildProxyUrl(videoUrl, `${title}.mp4`),
  };
}

async function handleCobaltVideo(url, platform, fallbackOptions = {}) {
  try {
    const data = await fetchCobalt(url);
    const directUrl = data.url || data.download;
    if (!directUrl) {
      throw new Error("No download URL from Cobalt.");
    }

    return {
      success: true,
      platform,
      title: safeTitle(data.filename || data.title, `${platform} download`),
      type: data.audioOnly ? "audio" : "video",
      thumbnail: data.thumbnail || null,
      downloadUrl: buildProxyUrl(directUrl, data.filename || `${platform}.mp4`),
    };
  } catch (primaryError) {
    logDownload("Cobalt fallback engaged", { platform, error: primaryError.message });
    return handleYtDlp(url, platform, fallbackOptions);
  }
}

async function handleYtDlp(url, platform, options = {}) {
  let metadata = null;
  let title = safeTitle(null, `${platform} download`);
  let thumbnail = null;

  const baseOptions = {
    format: options.format,
    extractorArgs: options.extractorArgs,
    retries: options.retries ?? 2,
  };

  let metadataErrorRef = null;
  try {
    metadata = await ytDlpMetadata(url, baseOptions);
    title = safeTitle(metadata?.title, `${platform} download`);
    thumbnail = metadata?.thumbnail || null;
  } catch (metadataError) {
    metadataErrorRef = metadataError;
    logDownload("yt-dlp metadata failed, continuing with download", {
      platform,
      error: normalizeYtDlpError(metadataError),
    });
  }

  let lastDownloadError = null;

  try {
    const downloadUrl = await ytDlpToTemp(url, {
      ...baseOptions,
      filenameBase: title,
      remuxVideo: options.remuxVideo,
      extractAudio: options.extractAudio,
      audioFormat: options.audioFormat,
    });

    return {
      success: true,
      platform,
      title,
      type: options.extractAudio ? "audio" : "video",
      thumbnail,
      downloadUrl,
    };
  } catch (downloadError) {
    lastDownloadError = downloadError;
  }

  const firstRaw = String(
    lastDownloadError?.stderr ||
      lastDownloadError?.stdout ||
      metadataErrorRef?.stderr ||
      metadataErrorRef?.stdout ||
      lastDownloadError?.message ||
      metadataErrorRef?.message ||
      ""
  );

  const shouldRetryWithCookies =
    YTDLP_COOKIES_FILE &&
    (isYtAuthChallenge(firstRaw) || ["youtube", "youtube-shorts", "facebook", "instagram", "twitter"].includes(platform));

  if (shouldRetryWithCookies) {
    logDownload("yt-dlp retrying with cookies", {
      platform,
      cookiesFile: YTDLP_COOKIES_FILE,
    });

    try {
      const metadataWithCookies = await ytDlpMetadata(url, {
        ...baseOptions,
        cookies: YTDLP_COOKIES_FILE,
      });
      title = safeTitle(metadataWithCookies?.title, `${platform} download`);
      thumbnail = metadataWithCookies?.thumbnail || thumbnail;
    } catch (metaCookieErr) {
      logDownload("yt-dlp metadata with cookies failed, continuing", {
        platform,
        error: normalizeYtDlpError(metaCookieErr),
      });
    }

    try {
      const downloadUrl = await ytDlpToTemp(url, {
        ...baseOptions,
        filenameBase: title,
        remuxVideo: options.remuxVideo,
        extractAudio: options.extractAudio,
        audioFormat: options.audioFormat,
        cookies: YTDLP_COOKIES_FILE,
      });

      return {
        success: true,
        platform,
        title,
        type: options.extractAudio ? "audio" : "video",
        thumbnail,
        downloadUrl,
      };
    } catch (cookieDownloadError) {
      throw new Error(normalizeYtDlpError(cookieDownloadError));
    }
  }

  throw new Error(normalizeYtDlpError(lastDownloadError || metadataErrorRef));
}

async function handleInstagram(url) {
  const normalizedUrl = normalizeUrl(url, "instagram");
  const type = normalizedUrl.includes("/stories/")
    ? "Story"
    : normalizedUrl.includes("/p/")
      ? "Post"
      : "Reel";

  // Primary: Ferdev IG endpoints (works for many shared links)
  try {
    const endpoint = type === "Story" ? "igstory" : "instagram";
    const apiUrl = `https://api.ferdev.my.id/downloader/${endpoint}?link=${encodeURIComponent(normalizedUrl)}&apikey=${FERDEV_API_KEY}`;
    const response = await http.get(apiUrl, { headers: { Accept: "application/json" } });
    const data = response?.data?.data || response?.data?.result || response?.data;
    const mediaUrl = data?.url || data?.video || data?.download || data?.dlink || data?.link;

    if (mediaUrl) {
      return {
        success: true,
        platform: "instagram",
        title: safeTitle(data?.title || data?.caption, `Instagram ${type}`),
        type: "video",
        thumbnail: data?.thumbnail || null,
        contentTypeLabel: type,
        downloadUrl: buildProxyUrl(mediaUrl, `instagram-${type.toLowerCase()}.mp4`),
      };
    }
    throw new Error("Ferdev: no media URL found");
  } catch (ferdevError) {
    logDownload("Instagram Ferdev failed, fallback engaged", {
      error: ferdevError?.message || String(ferdevError),
    });
  }

  // Fallback: Cobalt -> yt-dlp (yt-dlp will retry with cookies when needed)
  const result = await handleCobaltVideo(normalizedUrl, "instagram", {
    remuxVideo: "mp4",
    format: "bestvideo[height<=1080]+bestaudio/best",
    retries: 3,
  });
  result.contentTypeLabel = type;
  return result;
}

async function handlePinterest(url) {
  const response = await http.get(
    `https://www.savepin.app/download.php?url=${encodeURIComponent(url)}&lang=en&type=redirect`,
    { headers: { Referer: "https://www.savepin.app/" } }
  );
  const $ = cheerio.load(response.data);
  const rows = $("tbody tr").toArray();
  const downloads = [];

  for (const row of rows) {
    const element = $(row);
    const quality = element.find(".video-quality").text().trim() || element.find("td").eq(0).text().trim();
    const href = element.find("a").attr("href");
    if (!href) {
      continue;
    }
    const directUrl = href.includes("url=") ? decodeURIComponent(href.split("url=").pop()) : href;
    downloads.push({
      quality,
      downloadUrl: directUrl,
      type: /\.(jpg|jpeg|png|webp)(\?|$)/i.test(directUrl) ? "image" : "video",
    });
  }

  if (!downloads.length) {
    throw new Error("No Pinterest download links found.");
  }

  const best = downloads.find((entry) => /1080|720|hd/i.test(entry.quality)) || downloads[0];
  return {
    success: true,
    platform: "pinterest",
    title: "Pinterest Download",
    type: best.type,
    downloadUrl: buildProxyUrl(best.downloadUrl, `pinterest.${best.type === "image" ? "jpg" : "mp4"}`),
    files: downloads.map((entry, index) => ({
      name: `Pinterest ${entry.quality || index + 1}.${entry.type === "image" ? "jpg" : "mp4"}`,
      type: entry.type,
      quality: entry.quality,
      downloadUrl: buildProxyUrl(entry.downloadUrl, `pinterest-${index + 1}.${entry.type === "image" ? "jpg" : "mp4"}`),
    })),
  };
}

async function handleTwitter(url) {
  const form = new URLSearchParams({
    page: url,
    ftype: "all",
  });

  const response = await http.post("https://twmate.com/en2/", form.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: "https://twmate.com/",
    },
  });

  const $ = cheerio.load(response.data);
  const rows = $(".files-table tbody tr").toArray();
  const candidates = [];

  for (const row of rows) {
    const element = $(row);
    const cols = element.find("td");
    const quality = cols.eq(0).text().trim();
    const type = cols.eq(1).text().trim() || (quality.toLowerCase().includes("image") ? "image" : "video");
    const href = element.find("a").attr("href");
    if (!href) {
      continue;
    }
    candidates.push({
      quality,
      type: /image/i.test(type) ? "image" : "video",
      url: href,
    });
  }

  if (!candidates.length) {
    throw new Error("No Twitter/X media found.");
  }

  const priority =
    candidates.find((item) => item.type === "video" && /hd|1080|720/i.test(item.quality)) ||
    candidates.find((item) => item.type === "video") ||
    candidates.find((item) => item.type === "image");

  return {
    success: true,
    platform: "twitter",
    title: "Twitter / X Download",
    type: priority.type,
    downloadUrl: buildProxyUrl(priority.url, `twitter.${priority.type === "image" ? "jpg" : "mp4"}`),
    files: candidates.map((item, index) => ({
      name: `Twitter-${index + 1}.${item.type === "image" ? "jpg" : "mp4"}`,
      type: item.type,
      quality: item.quality,
      downloadUrl: buildProxyUrl(item.url, `twitter-${index + 1}.${item.type === "image" ? "jpg" : "mp4"}`),
    })),
  };
}

async function handleFacebook(url) {
  const normalized = normalizeUrl(url, "facebook");

  // Primary: Gimita API
  try {
    const response = await http.get(
      `https://api.gimita.id/api/downloader/facebook?url=${encodeURIComponent(normalized)}`,
      {
        headers: {
          Accept: "application/json",
          Referer: "https://www.facebook.com/",
        },
      }
    );

    const result = response.data;
    if (!result?.success || !result?.data) {
      throw new Error(result?.message || "Facebook media unavailable.");
    }

    const qualities = Array.isArray(result.data.all_qualities) ? result.data.all_qualities : [];
    const preferred =
      qualities.find((entry) => /hd|1080|720/i.test(entry?.resolution || entry?.quality || entry?.label || "")) ||
      qualities[0];

    const mediaUrl = preferred?.url || result.data.best_url || result.data.url || result.data.download;
    if (!mediaUrl) {
      throw new Error("No Facebook download URL found.");
    }

    return {
      success: true,
      platform: "facebook",
      title: safeTitle(result.data.title || result.data.caption, "Facebook Reel"),
      type: "video",
      thumbnail: result.data.thumbnail || null,
      downloadUrl: buildProxyUrl(mediaUrl, "facebook-reel.mp4"),
    };
  } catch (primaryError) {
    logDownload("Facebook Gimita failed, fallback engaged", {
      error: primaryError?.message || String(primaryError),
    });
  }

  // Fallback #2: direct DASH parse + merge audio/video via ffmpeg
  try {
    return await tryFacebookDashMerge(normalized, "Facebook Reel");
  } catch (dashError) {
    logDownload("Facebook DASH merge failed, fallback engaged", {
      error: dashError?.message || String(dashError),
    });
  }

  // Fallback #3: yt-dlp direct (prefer merged audio+video)
  try {
    return await handleYtDlp(normalized, "facebook", {
      remuxVideo: "mp4",
      format: "bestvideo[height<=1080]+bestaudio/best[ext=mp4]/best",
      retries: 3,
    });
  } catch (ytError) {
    logDownload("Facebook yt-dlp failed, fallback engaged", {
      error: ytError?.message || String(ytError),
    });
  }

  // Fallback #4: Ferdev API (note: some links may return video-only stream)
  try {
    const ferdevUrl = `https://api.ferdev.my.id/downloader/facebook?link=${encodeURIComponent(normalized)}&apikey=${FERDEV_API_KEY}`;
    const ferdevResponse = await http.get(ferdevUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = ferdevResponse?.data?.data || ferdevResponse?.data;
    const mediaUrl = data?.sd || data?.hd || data?.url || data?.download;

    if (mediaUrl) {
      const cleanedMediaUrl = decodeHtmlEntities(mediaUrl);
      const isDirectFriendly = /(?:snapcdn\.app|fbcdn\.net)/i.test(cleanedMediaUrl);
      return {
        success: true,
        platform: "facebook",
        title: safeTitle(data?.title || data?.caption, "Facebook Reel"),
        type: "video",
        thumbnail: data?.thumbnail || null,
        warning: "Fallback source used. Some Facebook sources may have no audio.",
        downloadUrl: isDirectFriendly ? cleanedMediaUrl : buildProxyUrl(cleanedMediaUrl, "facebook-reel.mp4"),
      };
    }

    throw new Error("Ferdev: no media URL found");
  } catch (ferdevError) {
    logDownload("Facebook Ferdev failed", {
      error: ferdevError?.message || String(ferdevError),
    });
  }

  throw new Error("Semua fallback Facebook gagal untuk link ini.");
}

async function handleYoutube(url, quality) {
  const format = selectYoutubeFormat(quality);
  return handleCobaltVideo(url, "youtube", {
    format,
    remuxVideo: "mp4",
    extractorArgs: ["youtube:player_client=android,web"],
    retries: 3,
  });
}

async function handleYoutubeShorts(url) {
  const candidates = getYoutubeShortsCandidates(url);
  const fallbackOptions = {
    remuxVideo: "mp4",
    format: "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/best",
    extractorArgs: ["youtube:player_client=android,web"],
    retries: 3,
  };

  let lastErr = null;
  for (const candidate of candidates) {
    try {
      logDownload("Trying YouTube Shorts candidate", { candidate });
      return await handleCobaltVideo(candidate, "youtube-shorts", fallbackOptions);
    } catch (err) {
      lastErr = err;
      logDownload("YouTube Shorts candidate failed", {
        candidate,
        error: normalizeYtDlpError(err),
      });
    }
  }

  throw new Error(normalizeYtDlpError(lastErr));
}

async function handleCapcut(url) {
  return handleYtDlp(url, "capcut", { remuxVideo: "mp4" });
}

async function handleLinkedin(url) {
  return handleCobaltVideo(url, "linkedin", { remuxVideo: "mp4" });
}

async function handleReddit(url) {
  return handleYtDlp(url, "reddit", { remuxVideo: "mp4" });
}

async function handleAppleMusic(url) {
  try {
    const cobalt = await fetchCobalt(url);
    const directUrl = cobalt.url || cobalt.download;
    if (directUrl) {
      const extension = /\.mp3(\?|$)/i.test(directUrl) ? "mp3" : "m4a";
      return {
        success: true,
        platform: "apple-music",
        title: safeTitle(cobalt.filename || cobalt.title, "Apple Music Preview"),
        type: "audio",
        thumbnail: cobalt.thumbnail || null,
        downloadUrl: buildProxyUrl(directUrl, `apple-music-preview.${extension}`),
      };
    }
  } catch (error) {
    logDownload("Apple Music cobalt failed", { error: error.message });
  }

  return handleYtDlp(url, "apple-music", {
    extractAudio: true,
    audioFormat: "mp3",
  });
}

async function downloadDispatcher(url, platform, quality) {
  switch (platform) {
    case "tiktok":
    case "douyin":
      return handleTikTok(url, platform);
    case "youtube-shorts":
      return handleYoutubeShorts(url);
    case "instagram":
      return handleInstagram(url);
    case "pinterest":
      return handlePinterest(url);
    case "twitter":
      return handleTwitter(url);
    case "facebook":
      return handleFacebook(url);
    case "youtube":
      return handleYoutube(url, quality);
    case "capcut":
      return handleCapcut(url);
    case "apple-music":
      return handleAppleMusic(url);
    case "linkedin":
      return handleLinkedin(url);
    case "reddit":
      return handleReddit(url);
    default:
      throw new Error("Unsupported platform.");
  }
}

app.get("/api/platforms", (req, res) => {
  res.json({
    success: true,
    platforms: platformDefinitions.map(({ key, name, typeLabel }) => ({
      key,
      name,
      typeLabel,
    })),
  });
});

app.post("/api/download", async (req, res) => {
  const inputUrl = String(req.body?.url || "").trim();
  const quality = req.body?.quality;
  let platform = req.body?.platform ? String(req.body.platform).trim() : "";

  if (!validateUrl(inputUrl)) {
    return res.status(400).json({ success: false, error: "Invalid URL." });
  }

  platform = platform || detectPlatform(inputUrl);
  if (!platform) {
    return res.status(400).json({ success: false, error: "Unsupported or unrecognized platform URL." });
  }

  if (!isUrlCompatibleWithPlatform(inputUrl, platform)) {
    return res.status(400).json({
      success: false,
      error: `URL tidak cocok dengan platform ${platform}. Cek lagi link yang lo paste.`,
    });
  }

  const normalizedUrl = normalizeUrl(inputUrl, platform);

  try {
    logDownload("Download requested", { platform, url: normalizedUrl });
    const result = await downloadDispatcher(normalizedUrl, platform, quality);
    return res.json(result);
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Download failed.";
    const lowered = message.toLowerCase();
    const ytDlpFriendly = normalizeYtDlpError(error);

    const isYoutubeFamily = platform === "youtube" || platform === "youtube-shorts";

    const publicMessage =
      platform === "instagram" && (lowered.includes("private") || lowered.includes("login"))
        ? "Instagram link ini kebaca private / butuh login. Coba pakai link Reel publik (tanpa close-friends / private account)."
        : !isYoutubeFamily && (lowered.includes("private") || lowered.includes("login"))
          ? "This content appears to be private or requires login."
          : lowered.includes("530")
            ? "Provider Facebook lagi gangguan (HTTP 530). Coba lagi bentar atau pakai link Facebook publik lain."
            : lowered.includes("404") || lowered.includes("deleted") || lowered.includes("not found")
              ? "This content appears to be unavailable or deleted."
              : ytDlpFriendly;

    logDownload("Download failed", { platform, error: publicMessage });
    return res.status(500).json({ success: false, platform, error: publicMessage });
  }
});

app.get("/api/fetch", async (req, res) => {
  const fileId = req.query.file ? String(req.query.file) : "";
  if (fileId) {
    const entry = tempFiles.get(fileId);
    if (!entry) {
      return res.status(404).json({ success: false, error: "Temporary file expired." });
    }

    res.setHeader("Content-Type", entry.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${entry.filename}"`);
    const stream = fs.createReadStream(entry.filePath);
    stream.on("error", () => res.status(500).end());
    stream.on("close", () => {
      tempFiles.delete(fileId);
      fs.promises.unlink(entry.filePath).catch(() => {});
    });
    return stream.pipe(res);
  }

  const targetUrl = String(req.query.url || "");
  const filename = safeTitle(req.query.filename, "download");
  const customReferer = String(req.query.referer || "").trim();

  if (!validateUrl(targetUrl)) {
    return res.status(400).json({ success: false, error: "Invalid fetch URL." });
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const response = await http.get(targetUrl, {
      responseType: "stream",
      headers: {
        Referer: customReferer || parsedTarget.origin,
        Origin: parsedTarget.origin,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });
    const contentLength = Number(response.headers["content-length"] || 0);
    if (contentLength > MAX_FILE_SIZE) {
      return res.status(413).json({ success: false, error: "File exceeds 500MB limit." });
    }

    res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    let total = 0;
    response.data.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_FILE_SIZE) {
        response.data.destroy(new Error("File exceeds 500MB limit."));
      }
    });
    response.data.on("error", () => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Proxy download failed." });
      } else {
        res.end();
      }
    });

    return response.data.pipe(res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Proxy download failed.",
    });
  }
});

app.listen(PORT, () => {
  logDownload(`Server running on http://localhost:${PORT}`);
});
