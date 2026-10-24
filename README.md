# 🐾 PICO PARK Web Online — Multiplayer Co-op Clone

A web-based cooperative multiplayer puzzle action game inspired by **PICO PARK**. Built with **Node.js, Express, Socket.io, and HTML5 Canvas**, featuring authentic 2D physics, player head-stacking, co-op push blocks, interactive switches, springboards, custom cat avatars, in-game chat, and retro sound effects!

---

## 🎮 Core Game Mechanics

- **Cat Head-Stacking**: Jump on your teammates' heads to reach high platforms and build tall cat ladders!
- **Cooperative Push Blocks**: Heavy blocks marked with `PUSH x2` require multiple players to push together.
- **The Golden Key & Exit Door**: Find the key, bring it to unlock the exit door, and make sure **all players** reach the door to clear the stage!
- **Interactive Puzzles**:
  - Pressure plates that lower gates, extend bridges, or disable dangerous laser beams.
  - Bouncy trampolines that launch cats high into the air.
  - Spike pits and hazards with funny respawns.
- **5 Progressive Puzzle Stages**:
  - *Stage 1: Getting Started* — Stacking & dual push block.
  - *Stage 2: The High Wall & Button Bridge* — Stacking and holding switches across chasms.
  - *Stage 3: Trampoline Bounce!* — Spring pad coordination.
  - *Stage 4: Laser Maze & Heavy Box* — Using heavy crates to hold switches and bypass laser hazards.
  - *Stage 5: The Grand Team Tower* — Ultimate multi-cat tower climbing.
- **Live Communication**:
  - Expressive speech bubble emotes (keys `1`–`7` or bottom toolbar: 👋, ⬆️, ➡️, ⚠️, 💖, 😱, 🎉).
  - In-game text chat with color-coded player names.
- **Synthesized Retro Audio**: Pure Web Audio API retro sound effects (jump, bounce, click, key collect, door fanfare) + toggleable chiptune music loop (zero external audio loading delay).

---

## 🚀 How to Run Locally

### 1. Requirements
- Node.js (v16 or newer)

### 2. Start the Server
Open a terminal in this project folder and run:

```bash
npm start
```

Then open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 How to Play Online with Friends

You have several easy options to play with your friends over the internet:

### Option A: Instant Free Share from Your PC (No hosting needed!)
You can generate a temporary secure public link right from your computer in 5 seconds using `localtunnel` or `ngrok`:

```bash
npx localtunnel --port 3000
```
This will give you a public URL (e.g. `https://funny-cats-play.loca.lt`). Send that link to your friends, click **Create Room**, and click **📋 Copy Link**!

---

### Option B: Free 24/7 Cloud Hosting on Render (Recommended)
1. Push this folder to a GitHub repository (e.g. `my-picopark-game`).
2. Go to **[Render.com](https://render.com)** and click **New Web Service**.
3. Connect your GitHub repository.
4. Set the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Deploy**. Render will give you a free HTTPS URL like:
   `https://my-picopark.onrender.com`
6. Open your link, click **Create New Room**, click **📋 Copy Link**, and share it with your friends!

---

### Option C: 1-Click Hosting on Railway or Glitch
- **Railway**: Go to [railway.app](https://railway.app), choose *Deploy from GitHub Repo*, and it will automatically detect `npm start` and provide a public domain.
- **Glitch**: Go to [glitch.com](https://glitch.com), click *New Project* -> *Import from GitHub*, and it will run live instantly.

---

### Option D: VPS / Dedicated Server (Ubuntu / Debian / CentOS)
1. Upload the files to `/var/www/picopark` or clone via git.
2. Install dependencies:
   ```bash
   npm install --production
   ```
3. Run with PM2 for background auto-restarts:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "picopark"
   pm2 startup
   pm2 save
   ```
4. Optional: Set up Nginx reverse proxy to port `3000` with WebSocket support:
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
   }
   ```

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `◄` / `►` | On-screen `◀` / `▶` buttons |
| **Jump** | `W` / `▲` / `Space` | On-screen `JUMP` button |
| **Emotes** | Number keys `1`–`7` | Bottom Emote Toolbar |
| **Open Chat** | `Enter` | Bottom Chat Input Box |
| **Mute / Unmute** | Sound Button in Header | Sound Button in Header |
| **Stage Select / Restart** | Dropdown (Host Only) | Dropdown (Host Only) |

---

## 📁 Project Structure

```text
picopark/
├── public/                 # Client assets
│   ├── index.html          # Main game UI & lobby
│   ├── style.css           # Modern arcade glassmorphism styling
│   └── js/
│       ├── audio.js        # Web Audio API sound synthesizer & music
│       ├── renderer.js     # HTML5 Canvas vector renderer (cats, puzzles, VFX)
│       └── client.js       # Client Socket.io networking & controls
├── shared/                 # Shared game engine logic
│   ├── constants.js        # Physics, player size, color palettes, emotes
│   ├── levels.js           # 5 distinct cooperative puzzle stages
│   └── physicsEngine.js    # Authoritative 60Hz physics & co-op puzzle solver
├── server.js               # Node.js + Socket.io room server
├── package.json            # Dependencies & start script
└── README.md               # Documentation & deployment guide
```
