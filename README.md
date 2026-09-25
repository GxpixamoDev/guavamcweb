# GuavaMC Website + Admin CMS

Node.js + Express website based on the current GuavaMC design.

## Run

```bash
npm install
npm start
```

Open:

- Home: `http://localhost:3000/`
- Blogs: `http://localhost:3000/blogs`
- Guides: `http://localhost:3000/guides`
- Jobs: `http://localhost:3000/jobs`
- Admin: `http://localhost:3000/admin`

The admin page is **not linked anywhere on the public website**.

## Admin password

The default password is:

```text
guava-admin-change-me
```

For a real server, set an environment variable before starting:

Windows PowerShell:

```powershell
$env:ADMIN_PASSWORD="your-strong-password"
npm start
```

Linux:

```bash
ADMIN_PASSWORD="your-strong-password" npm start
```

You can also set `SESSION_SECRET` to a long random value in production.

## Admin features

### Team
- Add team members
- Remove team members
- Edit team members
- Name
- Role
- Role type
- Description
- Picture URL

### Blogs
- Create posts
- Edit posts
- Remove posts
- Title, date, author, excerpt, full content and image
- Public `/blogs` page automatically updates
- Home page slideshow automatically uses the latest posts

### Guides
- Separate public `/guides` page
- Add, edit and remove guides
- Category, description, content and image

### Jobs
- Separate public `/jobs` page
- Add, edit and remove jobs
- Job name, role type, location, description, button text and application URL
- There is **no separate job page**. The Apply button opens the URL you enter.

### Images
- Upload PNG/JPG/WEBP/GIF images
- Copy image URLs
- Delete uploaded images
- Assign uploaded images to the hero, community, Economy, BoxPvP and PracticePvP slots
- Team/blog/guide pictures can use uploaded image URLs

## Data storage

Website content is stored in `data/content.json`.

Uploaded images are stored in `public/uploads/`.

Back up both folders before moving the site to another server.


## Slider timers

The Home page blog and Meet The Team sliders now have a progress line. The line fills from left to right while the current slide is shown; when it reaches 100%, the next slide is displayed and the timer restarts. Clicking arrows or thumbnails also resets the timer.

## Hero PNG / MP4

The Admin > Site settings page now supports a Hero Media URL plus Hero Media Type (Auto, Image, or MP4 Video). Upload PNG or MP4 files from Admin > Images. MP4 hero media is muted, autoplaying, looping, and uses `object-fit: cover`. Upload limit is 50 MB.

## Multiple admin accounts

The Admin panel now has an **ADMINS** section. Every account can sign in to `/admin` and manage the website.

- Add admin usernames and passwords
- Edit usernames
- Change passwords
- Remove admin accounts
- The last remaining admin cannot be removed
- The account currently being used cannot remove itself
- Passwords are stored as salted `scrypt` hashes in `data/admins.json`, not plaintext

On first startup, if `data/admins.json` does not exist, the site creates the first account from:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=guava-admin-change-me
```

For production, set both environment variables before starting the server. After the first login, additional admins can be created from **Admin → ADMINS**.

Example PowerShell:

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="a-long-strong-password"
npm start
```
