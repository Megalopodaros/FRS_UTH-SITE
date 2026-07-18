# 🐨 KoalaHost Deployment & Setup Guide

This guide explains how to deploy and run your **Foititika Radio Show (FRS)** live application on **KoalaHost** (cPanel / LiteSpeed / Apache hosting).

---

## 🛠️ Step 1: Build Your Production Bundle

Before uploading to KoalaHost, generate the static production build on your local machine:

```bash
npm run build
```

This creates a `dist/` folder containing:
- `index.html` (main entry point)
- `assets/` (optimized CSS & JS bundles)
- `.htaccess` (pre-configured for KoalaHost Apache/LiteSpeed SPA routing & HTTPS redirection)

---

## 📤 Step 2: Upload to KoalaHost (cPanel File Manager or FTP)

1. Log into your **KoalaHost Client Area** and open **cPanel**.
2. Go to **File Manager** and open your website's root folder:
   - For your primary domain: open `public_html/`
   - For a subdomain (e.g. `live.yourdomain.gr`): open that subdomain's directory inside `public_html/` or root.
3. If there are existing old files or default index files in `public_html/`, delete or archive them.
4. Upload all files from your local `dist/` folder directly into `public_html/`:
   - `index.html`
   - `.htaccess` *(Make sure "Show Hidden Files (dotfiles)" is enabled in cPanel File Manager Settings so you can verify `.htaccess` is uploaded)*
   - `assets/` folder (along with all its contents)

---

## 🔒 Step 3: Verify HTTPS (AutoSSL) & Radio.co Stream Links

1. KoalaHost provides free **Let's Encrypt / AutoSSL certificates**. Ensure your domain loads securely over `https://yourdomain.gr`.
2. **Important note for audio streams (`radio.co`)**:
   - Because your site is served securely over `https://`, any live audio stream URL entered into the player **MUST ALSO begin with `https://`** (`https://stream.radio.co/.../listen`).
   - If you enter an `http://` (unencrypted) stream link, web browsers will block it for security (Mixed Content warning). `radio.co` and modern Icecast servers provide `https://` stream links by default.

---

## 🔥 Step 4: Firebase Domain Whitelisting (For Live Chat & Firestore)

Your live chat connects directly to Firebase Firestore in real-time (`messages` collection).
To ensure your live domain is allowed to communicate with Firebase:

1. Go to your [Firebase Console](https://console.firebase.google.com/) for project **`upbeat-boulder-bfbwx`**.
2. If you have Authentication or specific Firestore security rules enabled in the future, add your KoalaHost domain (`yourdomain.gr` and `www.yourdomain.gr`) under **Authentication -> Settings -> Authorized Domains**.
3. Currently, your `firestore.rules` allow read/write access (`allow read, write: if true;`), which means the live chat will start working immediately across all tabs and devices as soon as your site goes live!

---

## 🎧 Step 5: How Station Admins / Listeners Set the `radio.co` Stream

Once live on KoalaHost:
1. Open the website on your desktop or mobile device.
2. Click the **`Stream Setup / Radio.co` (⚙️)** button inside the bottom player bar.
3. Paste your exact `radio.co` stream URL into the **Live Stream URL** input field (e.g. `https://stream.radio.co/s37e5e324c/listen`) and give your station a title.
4. Click **`Save & Connect Stream`**. The player will immediately connect to your live broadcast and remember the URL on that browser!
