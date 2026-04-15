# Social Downloader

A fast, free social media downloader web application. Download videos, images, and audio from 12 popular platforms — no login, no watermark, no limits.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

## Supported Platforms

| Platform | Content Types |
|----------|--------------|
| TikTok | Video (no watermark), photo posts |
| YouTube | MP4 video (360p–1080p) |
| YouTube Shorts | Short videos |
| Instagram | Reels, stories, posts |
| Pinterest | Videos, image pins |
| Twitter / X | Videos, images |
| Facebook | Reels, videos |
| Douyin | Videos, images |
| CapCut | Templates, share videos |
| Apple Music | Preview audio clips |
| LinkedIn | Videos, posts |
| Reddit | Videos, images |

## Tech Stack

- **Runtime:** Node.js
- **Server:** Express.js
- **Scraping:** Cheerio, Axios
- **Media Processing:** yt-dlp
- **Frontend:** Vanilla HTML/CSS/JS with Inter font

## Features

- Auto-detect platform from pasted URL
- Quality selector for YouTube (360p–1080p)
- Proxy download to bypass CORS restrictions
- Rate limiting (30 requests per 15 minutes per IP)
- Temporary file management with auto-cleanup
- Download history stored locally in browser
- Responsive dark theme UI
- Max file size: 500MB

## Installation

```bash
# Clone the repository
git clone https://github.com/exd77/social-downloader.git
cd social-downloader

# Install dependencies
npm install

# Install yt-dlp (required for YouTube, CapCut, Reddit, and fallback downloads)
# Ubuntu/Debian
sudo apt install yt-dlp
# or via pip
pip install yt-dlp
```

## Usage

```bash
# Start the server
npm start

# Server runs on http://localhost:3000
```

Open your browser and navigate to `http://localhost:3000`. Paste any supported social media URL and click Download.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/download` | Process a download request |
| `GET` | `/api/platforms` | List supported platforms |
| `GET` | `/api/fetch` | Proxy/stream downloaded files |

### POST /api/download

```json
{
  "url": "https://www.tiktok.com/@user/video/123",
  "platform": "tiktok",
  "quality": "720p"
}
```

## Project Structure

```
social-downloader/
├── server.js              # Express server & download handlers
├── package.json           # Dependencies & scripts
├── public/
│   ├── index.html         # Landing page
│   ├── css/style.css      # Styles
│   ├── js/app.js          # Frontend logic
│   └── icons/             # Platform icon assets
└── README.md
```

## Environment

No environment variables are required. The server runs on port `3000` by default.

## License

ISC
