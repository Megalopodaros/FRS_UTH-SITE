# 📻 FRS UTH — Live Broadcasting Portal

[![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

A premium, modern, and highly interactive live broadcasting web application for **FRS UTH (Φοιτητικός Ραδιοφωνικός Σταθμός Πανεπιστημίου Θεσσαλίας)**. Built with React, TypeScript, and Tailwind CSS, featuring real-time interactive widgets, live audio streaming, and high-performance animations optimized for mobile devices.

---

## ✨ Features

- **⚡ Secure Live Audio Streaming**: Real-time Icecast stream connection over secure SSL (`streamguys1.com`) with automated fallback handling.
- **💬 Real-Time Live Chat**: Instant messaging powered by Google Firestore, with automatic session handling, user identity customization, and visual keyboard height adaptability for mobile devices.
- **👥 Active User Presence**: Real-time active site visitor counter driven by Firebase Realtime Database (RTDB).
- **📅 Dynamic Weekly Schedule**: Automatic local-time synchronization to showcase the active show, upcoming broadcasts (Up Next), and full program view in both Greek & English.
- **🎨 Premium Visual Experience**:
  - Glassmorphic UI overlays with dark and light theme options.
  - GPU-accelerated micro-interactions and optimized spring transitions.
  - Seamless horizontal text marquee for long track and host titles.
  - Custom SVG visualizer matching the state of the audio stream.
- **📐 Typographic Excellence**: Styled with **Jost**, a modern Futura alternative with full Greek and Latin geometric character sets.

---

## 🛠️ Tech Stack

- **Core**: React 18 (TypeScript)
- **Bundler**: Vite
- **Styling**: Tailwind CSS & Vanilla CSS Transitions
- **Real-time Backend**: Firebase (Firestore & Realtime Database)
- **Animations**: Framer Motion (Optimized for Mobile performance)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Megalopodaros/FRS_UTH-SITE.git
   cd FRS_UTH-SITE
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Configuration**:
   The application is fully pre-configured to connect to the FRS UTH Firebase instance for chat messages and active presence counting. The configuration keys are located in `src/lib/firebase.ts`.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📦 Building for Production

To compile the application into static HTML/JS/CSS assets ready for hosting:

```bash
npm run build
```

The production assets will be generated in the `dist/` directory.

---

## 📂 Project Structure

```text
├── public/                 # Static assets (logos, icons, htaccess)
├── src/
│   ├── assets/             # Raw asset imports
│   ├── components/         # Reusable React components
│   │   ├── MainPlayer.tsx  # Persistent Audio Player & Stream controller
│   │   ├── LiveChat.tsx    # Firebase-connected Live Chat panel
│   │   └── UthLogo.tsx     # Custom micro-microphone logo element
│   ├── data/
│   │   └── radioData.ts    # Weekly program schedule database (Greek & English)
│   ├── lib/
│   │   └── firebase.ts     # Firebase service initializations
│   ├── App.tsx             # App layout, header, footer, tabs & router
│   ├── index.css           # Tailwind configuration & global glassmorphic design system
│   └── main.tsx            # React application entrypoint
├── package.json            # Scripts & dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## 🔒 License

This project is open-source and developed for the **University of Thessaly Student Radio (FRS UTH)**. All branding and logos are property of FRS UTH.
