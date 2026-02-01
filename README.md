# Hyrox Application

Application pour le suivi de sport Hyrox personnalisable.

## 🏗️ Architecture

This project uses a **3-layer architecture** for reliable AI-assisted development:

```
├── directives/          # Layer 1: SOPs in Markdown (what to do)
├── execution/           # Layer 3: Deterministic Python scripts
├── .tmp/                # Intermediate files (gitignored)
├── .env                 # Environment variables (gitignored)
├── CLAUDE.md            # Agent instructions (mirrored)
├── AGENTS.md            # Agent instructions (mirrored)
└── GEMINI.md            # Agent instructions (mirrored)
```

### Why This Works

| Layer | Role | Contents |
|-------|------|----------|
| **Directives** | What to do | SOPs, goals, inputs, outputs, edge cases |
| **Orchestration** | Decision-making | The AI agent routes, handles errors, learns |
| **Execution** | Doing the work | Python scripts, API calls, data processing |

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd hyrox_application
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env  # Then fill in your values
   pip install python-dotenv  # Minimum dependency
   ```

3. **Create new directives**
   - Copy `directives/_template.md`
   - Define goals, inputs, execution steps, outputs

4. **Create new scripts**
   - Copy `execution/_template.py`
   - Implement deterministic logic

## 📁 File Organization

- **Deliverables** → Google Sheets, Slides, cloud services
- **Intermediates** → `.tmp/` (always regenerated, never committed)
- **Credentials** → `.env`, `credentials.json`, `token.json` (gitignored)

## 🔄 Self-Annealing

When errors occur:
1. Fix the script
2. Test it
3. Update the directive with learnings
4. System improves over time
