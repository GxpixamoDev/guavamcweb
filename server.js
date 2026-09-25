const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "guava-admin-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

const PUBLIC = path.join(__dirname, "public");
const UPLOADS = path.join(PUBLIC, "uploads");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "content.json");
const ADMINS_FILE = path.join(DATA_DIR, "admins.json");
fs.mkdirSync(UPLOADS, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultContent = {
  site: {
    heroImage: "/assets/hero.jpg",
    heroMediaType: "auto",
    communityImage: "",
    economyImage: "",
    boxpvpImage: "",
    practiceImage: "",
    discordUrl: "#",
    serverIp: "play.guavamc.net",
    serverCount: "31"
  },
  blogs: [
    {
      id: "blog-1",
      title: "Welcome to GuavaMC",
      date: "September 2026",
      author: "GuavaMC",
      excerpt: "Welcome to GuavaMC! Explore Economy, BoxPvP and PracticePvP, collect rewards, compete with friends and build your own journey.",
      content: "Welcome to GuavaMC! This is the first official news post. More updates, events and announcements will appear here.",
      image: ""
    },
    {
      id: "blog-2",
      title: "New Season, New Adventures",
      date: "Coming Soon",
      author: "GuavaMC",
      excerpt: "A new chapter is on the way. Keep an eye on the news for new maps, rewards, events and gameplay updates.",
      content: "More information about the next season will be posted here.",
      image: ""
    },
    {
      id: "blog-3",
      title: "Community Events",
      date: "Announcement",
      author: "GuavaMC",
      excerpt: "Take part in community events, challenges and server activities. More details will be announced here.",
      content: "Community events and activities will be announced in this post.",
      image: ""
    }
  ],
  guides: [
    {
      id: "guide-1",
      title: "Getting Started",
      category: "Beginner",
      description: "Learn how to join GuavaMC and get started on the network.",
      content: "Connect using play.guavamc.net, choose a gamemode and start playing. More detailed guide content can be added from the admin panel.",
      image: ""
    },
    {
      id: "guide-2",
      title: "Economy Basics",
      category: "Economy",
      description: "Learn the basics of earning, trading and spending on GuavaMC.",
      content: "Explore the economy, sell items, earn currency and build your balance.",
      image: ""
    },
    {
      id: "guide-3",
      title: "PracticePvP Basics",
      category: "PvP",
      description: "Get ready for practice fights and improve your mechanics.",
      content: "Use PracticePvP to warm up, duel players and improve your skills.",
      image: ""
    }
  ],
  team: [
    {
      id: "team-1",
      name: "GuavaMC Team",
      role: "Server Administration",
      roleType: "STAFF",
      description: "Responsible for the server's systems, updates, moderation and keeping the network running smoothly for everyone.",
      image: ""
    },
    {
      id: "team-2",
      name: "GuavaMC Team",
      role: "Developer",
      roleType: "STAFF",
      description: "Creating plugins, systems and new gameplay features while improving the experience across every GuavaMC gamemode.",
      image: ""
    },
    {
      id: "team-3",
      name: "GuavaMC Team",
      role: "Community Staff",
      roleType: "STAFF",
      description: "Helping players, organizing events and making sure the GuavaMC community stays friendly and active.",
      image: ""
    }
  ],
  jobs: [
    {
      id: "job-1",
      title: "Minecraft Developer",
      type: "Part-time",
      location: "Remote",
      description: "Help build plugins, features and systems for GuavaMC.",
      buttonText: "APPLY NOW",
      applyUrl: "https://example.com/apply"
    },
    {
      id: "job-2",
      title: "Community Staff",
      type: "Volunteer",
      location: "Remote",
      description: "Help players, host events and keep the GuavaMC community welcoming.",
      buttonText: "APPLY NOW",
      applyUrl: "https://example.com/apply"
    }
  ]
};

function readContent() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultContent, null, 2));
    return structuredClone(defaultContent);
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return structuredClone(defaultContent);
  }
}

function saveContent(content) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2));
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, salt, expectedHex] = String(stored || "").split(":");
    if (scheme !== "scrypt" || !salt || !expectedHex) return false;
    const expected = Buffer.from(expectedHex, "hex");
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function readAdmins() {
  if (!fs.existsSync(ADMINS_FILE)) {
    const initial = [{ id: id("admin"), username: ADMIN_USERNAME, passwordHash: hashPassword(ADMIN_PASSWORD), createdAt: new Date().toISOString() }];
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const admins = JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8"));
    if (Array.isArray(admins) && admins.length) return admins;
  } catch {}
  const fallback = [{ id: id("admin"), username: ADMIN_USERNAME, passwordHash: hashPassword(ADMIN_PASSWORD), createdAt: new Date().toISOString() }];
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(fallback, null, 2));
  return fallback;
}

function saveAdmins(admins) {
  fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
}


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const safe = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "-").slice(0, 50) || "image";
    cb(null, `${Date.now()}-${safe}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype) || file.mimetype === "video/mp4") cb(null, true);
    else cb(new Error("Only PNG, JPG, WEBP, GIF images and MP4 videos are allowed."));
  }
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 8 }
}));

function adminOnly(req, res, next) {
  if (req.session?.isAdmin && req.session?.adminId) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

app.use(express.static(PUBLIC));

// Public content API
app.get("/api/content", (_req, res) => res.json(readContent()));

// Admin authentication
app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const admin = readAdmins().find((x) => x.username.toLowerCase() === username.toLowerCase());
  if (!admin || !verifyPassword(password, admin.passwordHash)) return res.status(401).json({ error: "Invalid username or password" });
  req.session.isAdmin = true;
  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;
  res.json({ ok: true, username: admin.username });
});

app.post("/api/admin/logout", adminOnly, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => res.json({ authenticated: !!req.session?.isAdmin, username: req.session?.adminUsername || null }));

app.get("/api/admin/content", adminOnly, (_req, res) => res.json(readContent()));

// Admin user management. Passwords are stored as salted scrypt hashes, never plaintext.
app.get("/api/admin/users", adminOnly, (_req, res) => {
  res.json(readAdmins().map(({ id, username, createdAt }) => ({ id, username, createdAt })));
});

app.post("/api/admin/users", adminOnly, (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ error: "Username must be 3-32 characters and use letters, numbers, _, ., or -." });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  const admins = readAdmins();
  if (admins.some((x) => x.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: "That username already exists." });
  const admin = { id: id("admin"), username, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
  admins.push(admin);
  saveAdmins(admins);
  res.json({ id: admin.id, username: admin.username, createdAt: admin.createdAt });
});

app.put("/api/admin/users/:id", adminOnly, (req, res) => {
  const admins = readAdmins();
  const admin = admins.find((x) => x.id === req.params.id);
  if (!admin) return res.status(404).json({ error: "Admin user not found." });
  const username = String(req.body.username ?? admin.username).trim();
  const password = String(req.body.password || "");
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ error: "Username must be 3-32 characters and use letters, numbers, _, ., or -." });
  if (admins.some((x) => x.id !== admin.id && x.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: "That username already exists." });
  if (password && password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  admin.username = username;
  if (password) admin.passwordHash = hashPassword(password);
  saveAdmins(admins);
  if (req.session.adminId === admin.id) req.session.adminUsername = admin.username;
  res.json({ id: admin.id, username: admin.username, createdAt: admin.createdAt });
});

app.delete("/api/admin/users/:id", adminOnly, (req, res) => {
  const admins = readAdmins();
  if (admins.length <= 1) return res.status(400).json({ error: "You cannot remove the last admin account." });
  if (req.session.adminId === req.params.id) return res.status(400).json({ error: "You cannot remove the account you are currently using." });
  const next = admins.filter((x) => x.id !== req.params.id);
  if (next.length === admins.length) return res.status(404).json({ error: "Admin user not found." });
  saveAdmins(next);
  res.json({ ok: true });
});

// Site settings / named image slots
app.put("/api/admin/site", adminOnly, (req, res) => {
  const content = readContent();
  content.site = { ...content.site, ...req.body };
  saveContent(content);
  res.json(content.site);
});

// Team CRUD
app.post("/api/admin/team", adminOnly, (req, res) => {
  const content = readContent();
  const member = { id: id("team"), name: req.body.name || "Unnamed", role: req.body.role || "Team Member", roleType: req.body.roleType || "STAFF", description: req.body.description || "", image: req.body.image || "" };
  content.team.push(member);
  saveContent(content);
  res.json(member);
});

app.put("/api/admin/team/:id", adminOnly, (req, res) => {
  const content = readContent();
  const member = content.team.find((x) => x.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Team member not found" });
  Object.assign(member, { name: req.body.name ?? member.name, role: req.body.role ?? member.role, roleType: req.body.roleType ?? member.roleType, description: req.body.description ?? member.description, image: req.body.image ?? member.image });
  saveContent(content);
  res.json(member);
});

app.delete("/api/admin/team/:id", adminOnly, (req, res) => {
  const content = readContent();
  content.team = content.team.filter((x) => x.id !== req.params.id);
  saveContent(content);
  res.json({ ok: true });
});

// Blog CRUD
app.post("/api/admin/blogs", adminOnly, (req, res) => {
  const content = readContent();
  const blog = { id: id("blog"), title: req.body.title || "Untitled", date: req.body.date || "", author: req.body.author || "GuavaMC", excerpt: req.body.excerpt || "", content: req.body.content || "", image: req.body.image || "" };
  content.blogs.unshift(blog);
  saveContent(content);
  res.json(blog);
});

app.put("/api/admin/blogs/:id", adminOnly, (req, res) => {
  const content = readContent();
  const blog = content.blogs.find((x) => x.id === req.params.id);
  if (!blog) return res.status(404).json({ error: "Blog post not found" });
  Object.assign(blog, req.body);
  saveContent(content);
  res.json(blog);
});

app.delete("/api/admin/blogs/:id", adminOnly, (req, res) => {
  const content = readContent();
  content.blogs = content.blogs.filter((x) => x.id !== req.params.id);
  saveContent(content);
  res.json({ ok: true });
});

// Guide CRUD
app.post("/api/admin/guides", adminOnly, (req, res) => {
  const content = readContent();
  const guide = { id: id("guide"), title: req.body.title || "Untitled Guide", category: req.body.category || "General", description: req.body.description || "", content: req.body.content || "", image: req.body.image || "" };
  content.guides.unshift(guide);
  saveContent(content);
  res.json(guide);
});

app.put("/api/admin/guides/:id", adminOnly, (req, res) => {
  const content = readContent();
  const guide = content.guides.find((x) => x.id === req.params.id);
  if (!guide) return res.status(404).json({ error: "Guide not found" });
  Object.assign(guide, req.body);
  saveContent(content);
  res.json(guide);
});

app.delete("/api/admin/guides/:id", adminOnly, (req, res) => {
  const content = readContent();
  content.guides = content.guides.filter((x) => x.id !== req.params.id);
  saveContent(content);
  res.json({ ok: true });
});

// Jobs CRUD. Jobs link directly to the owner's application URL; there are no job detail pages.
app.post("/api/admin/jobs", adminOnly, (req, res) => {
  const content = readContent();
  const job = { id: id("job"), title: req.body.title || "Untitled Job", type: req.body.type || "", location: req.body.location || "", description: req.body.description || "", buttonText: req.body.buttonText || "APPLY NOW", applyUrl: req.body.applyUrl || "#" };
  content.jobs.push(job);
  saveContent(content);
  res.json(job);
});

app.put("/api/admin/jobs/:id", adminOnly, (req, res) => {
  const content = readContent();
  const job = content.jobs.find((x) => x.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  Object.assign(job, req.body);
  saveContent(content);
  res.json(job);
});

app.delete("/api/admin/jobs/:id", adminOnly, (req, res) => {
  const content = readContent();
  content.jobs = content.jobs.filter((x) => x.id !== req.params.id);
  saveContent(content);
  res.json({ ok: true });
});

// Image management. Uploads are saved in public/uploads and can be assigned to site slots.
app.post("/api/admin/upload", adminOnly, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename, originalName: req.file.originalname });
});

app.get("/api/admin/images", adminOnly, (_req, res) => {
  const files = fs.readdirSync(UPLOADS).filter((file) => /\.(png|jpe?g|webp|gif|mp4)$/i.test(file));
  res.json(files.map((file) => ({ filename: file, url: `/uploads/${file}` })));
});

app.delete("/api/admin/images/:filename", adminOnly, (req, res) => {
  const filename = path.basename(req.params.filename);
  const target = path.join(UPLOADS, filename);
  if (!fs.existsSync(target)) return res.status(404).json({ error: "Image not found" });
  fs.unlinkSync(target);
  res.json({ ok: true });
});

// Friendly pages. /admin is intentionally not linked from the public site.
app.get("/admin", (_req, res) => res.sendFile(path.join(PUBLIC, "admin.html")));
app.get("/blogs", (_req, res) => res.sendFile(path.join(PUBLIC, "blogs.html")));
app.get("/guides", (_req, res) => res.sendFile(path.join(PUBLIC, "guides.html")));
app.get("/blog/:id", (_req, res) => res.sendFile(path.join(PUBLIC, "blogs.html")));
app.get("/guide/:id", (_req, res) => res.sendFile(path.join(PUBLIC, "guides.html")));
app.get("/jobs", (_req, res) => res.sendFile(path.join(PUBLIC, "jobs.html")));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(PORT, () => {
  console.log(`GuavaMC website running at http://localhost:${PORT}`);
  if (ADMIN_PASSWORD === "guava-admin-change-me") console.log("Admin password is the default. Set ADMIN_PASSWORD before production use.");
});
