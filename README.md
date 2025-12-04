# Vuln Dependency Upgrader

> [!NOTE]
> 🎨 **This project is 100% vibe coded** – created through creative AI collaboration without manually typing a single line of code.

---

## What does this project do?

**Vuln Dependency Upgrader** is a local web tool that scans your projects for vulnerable React and Next.js versions and allows you to upgrade them with a single click.

### Features

- 🔍 **Recursive Scanning** – Searches a directory (up to 4 levels deep) for `package.json` files
- ⚠️ **Vulnerability Detection** – Identifies vulnerable versions of:
  - **React 19.x** (safe: 19.0.1, 19.1.2, 19.2.1)
  - **Next.js 15.x & 16.x** (safe: 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 16.0.7)
  - **@types/react 19.x** (safe: 19.0.8, 19.1.6)
  - **@types/react-dom 19.x** (safe: 19.0.4, 19.1.5)
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
