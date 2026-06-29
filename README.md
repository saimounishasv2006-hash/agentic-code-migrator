# CodeShift

AI-powered code migration tool that analyzes, plans, rewrites, and validates code transformations.

## Features

- **Analyze** - Detect code patterns, complexity, and structure
- **Plan** - Generate ordered migration steps with reasoning
- **Rewrite** - Transform code file-by-file automatically
- **Validate** - Check for errors and incomplete migrations
- **Export** - Download migrated files with documentation

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Ollama (local AI inference)
- Anthropic Claude API (optional)
- Zustand (state management)
- Tailwind CSS v3
- Framer Motion (animations)

## Prerequisites

- Node.js 18+
- pnpm
- Ollama
- codellama:7b model

## Installation

1. Clone the repository

```bash
git clone https://github.com/Prabodh-dev/agentic-code-migrator.git
cd agentic-code-migrator
```

2. Install dependencies

```bash
pnpm install
```

3. Setup Ollama

```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

In another terminal:

```bash
ollama pull codellama:7b
```

4. Setup environment

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY if needed (optional)
```

5. Run development server

```bash
pnpm dev
```

Open http://localhost:3000

## Usage

1. Upload code files (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.md`)
2. Describe migration goal (e.g., "Convert to TypeScript")
3. Agent analyzes and plans migration
4. Review plan and proceed with rewrite
5. Validate results
6. Download migrated files

## Project Structure

src/

├── app/

│ ├── page.tsx # Upload page

│ ├── migrate/

│ │ ├── page.tsx # Analyze phase

│ │ ├── plan/page.tsx # Plan phase

│ │ ├── rewrite/page.tsx # Rewrite phase

│ │ ├── validate/page.tsx # Validate phase

│ │ └── export/page.tsx # Export phase

│ └── api/

│ ├── analyze/route.ts # Analysis endpoint

│ ├── plan/route.ts # Planning endpoint

│ ├── migrate/route.ts # Rewriting endpoint

│ └── validate/route.ts # Validation endpoint

├── components/

│ ├── AnalysisResults.tsx

│ └── PlanStepper.tsx

├── store/

│ └── migrationStore.ts # Zustand store

└── globals.css

## Environment Variables

ANTHROPIC*API_KEY=sk_live*... # Optional: for Claude-based rewrite

OLLAMA_API=http://localhost:11434 # Ollama server URL

## API Endpoints

| Endpoint        | Method | Purpose                           |
| --------------- | ------ | --------------------------------- |
| `/api/analyze`  | POST   | Analyze files and detect patterns |
| `/api/plan`     | POST   | Generate migration plan           |
| `/api/migrate`  | POST   | Rewrite code file                 |
| `/api/validate` | POST   | Validate migrated code            |

## Performance

- Analyze (3 files): ~20s
- Plan: ~9s
- Rewrite (per file): ~3-5s
- Validate (3 files): ~15s

## Known Issues

- Ollama JSON responses sometimes include comments - auto-cleaned
- Large files (>10KB) may timeout
- SessionStorage limited to ~5-10MB

## Future Enhancements

- Side-by-side diff viewer
- File-level rollback
- Migration success metrics
- Custom migration templates
- Batch mode for multiple projects
- GitHub PR integration

## Author

Prabodh
