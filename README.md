# Vuln Dependency Upgrader

> [!NOTE]
> 🎨 **This project is 100% vibe coded** – created through creative AI collaboration without manually typing a single line of code.

---

## What does this project do?

**Vuln Dependency Upgrader** is a local web tool that scans your projects for vulnerable React and Next.js versions and allows you to upgrade them with a single click.

### Features

- 🔍 **Recursive Scanning** – Searches a directory (up to 4 levels deep) for `package.json` files
- ⚠️ **Vulnerability Detection** – Identifies vulnerable versions affected by:
  - [CVE-2025-55184](https://www.cve.org/CVERecord?id=CVE-2025-55184) (DoS)
  - [CVE-2025-55183](https://www.cve.org/CVERecord?id=CVE-2025-55183) (Source Code Exposure)
  - [CVE-2025-67779](https://www.cve.org/CVERecord?id=CVE-2025-67779) (DoS variant)
  
  Patched versions:
  - **Next.js 13.3+** → upgrade to 14.2.35
  - **Next.js 14.x** → 14.2.35
  - **Next.js 15.0.x** → 15.0.7
  - **Next.js 15.1.x** → 15.1.11
  - **Next.js 15.2.x** → 15.2.8
  - **Next.js 15.3.x** → 15.3.8
  - **Next.js 15.4.x** → 15.4.10
  - **Next.js 15.5.x** → 15.5.9
  - **Next.js 16.0.x** → 16.0.10
  - **React 19.x** – fix comes via Next.js upgrade
  - **@types/react** & **@types/react-dom** – updated silently (no security concern)
- 📦 **Package Manager Detection** – Automatically detects npm, yarn, pnpm, or bun
- 🌿 **Git Status Overview** – Shows for each project:
  - Current branch
  - Number of uncommitted files
  - Commits behind `main`/`master`
  - Commits behind `production`/`prod`
- ⬆️ **One-Click Upgrade** – Updates vulnerable dependencies directly from the UI

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Enter a path to a directory (e.g. `~/dev` or `/Users/your-name/projects`) to scan all projects within it.

---

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** Components
- **Lucide Icons**

---

## License

MIT
