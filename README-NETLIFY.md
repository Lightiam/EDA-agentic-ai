# EDA Agentic AI - Circuit Design & Analysis

A modern web-based circuit design tool powered by AI agents. Design electronic circuits visually, ask AI to analyze or optimize them, and generate netlists.

## Features

- **Interactive Circuit Editor**: Drag-and-drop components, connect them visually
- **AI-Powered Analysis**: Ask the agent to analyze, optimize, or modify your circuits
- **Real-time Properties**: Edit component values, units, and rotation
- **Export**: Generate SVG diagrams and SPICE netlists
- **Cloud Hosted**: Deployed on Netlify for instant access

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Setup configuration
autoclaw setup

# Run development server
npm run dev:ui

# Or use the CLI
npm run dev -- ui
```

Visit `http://localhost:3000` or navigate to the circuit editor.

### CLI Usage

```bash
# Interactive chat interface
autoclaw chat "Design an RC filter circuit"

# Non-interactive (headless)
autoclaw chat -n "Generate a netlist for a voltage divider"

# Auto-confirm all tool executions
autoclaw chat -y "Create and validate a circuit"

# Web UI
autoclaw ui
```

## Project Structure

```
src/
  agent.ts           - Core AI agent
  server.ts          - Web server (Node.js)
  index.ts           - CLI entry point
  tools/
    circuit.ts       - Circuit design tool
    core.ts          - File/shell tools
    email.ts         - Email sending
    search.ts        - Web search
    ... other tools
  public/
    index.html       - Chat interface
    circuit.html     - Circuit editor UI
    circuit-editor.js - Canvas-based editor
    style.css        - Styling
    app.js           - Chat interaction logic

netlify/
  functions/
    chat.ts          - Serverless API endpoint

netlify.toml         - Netlify deployment config
```

## Deployment

### Deploy to Netlify

1. Fork or clone this repository
2. Connect your GitHub repo to Netlify
3. Set environment variables:
   - `OPENAI_API_KEY` (required)
   - `OPENAI_BASE_URL` (optional)
   - `OPENAI_MODEL` (default: gpt-4o)
4. Deploy!

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Lightiam/EDA-agentic-ai)

### Manual Build

```bash
npm run build
npm run ui  # Starts server on port 3000
```

## Usage Guide

### Circuit Editor

1. **Add Components**: Click a component button (V, R, C, L, D, Q) in the left panel
2. **Place on Canvas**: Click anywhere on the canvas to place it
3. **Edit Properties**: Select a component and modify its value/unit in the Properties panel
4. **Connect**: Hold Ctrl and click, then click another component, OR use the "Connect" button
5. **Delete**: Right-click on a component
6. **Export**: Click "Export SVG" to download the circuit diagram

### AI Chat

Ask the agent to:
- "Create an RC filter with 10k resistor and 1uF capacitor"
- "Validate this circuit topology"
- "Generate a SPICE netlist for simulation"
- "Analyze the frequency response"
- "Suggest optimizations"

The agent will use the circuit design tool to execute your requests.

## Tools Available

- **circuit_design**: Create, analyze, and validate circuits
- **execute_shell_command**: Run shell commands
- **read_file / write_file**: File operations
- **send_email**: Send emails
- **search**: Web search via Tavily
- **generate_image**: DALL-E image generation
- **notify**: Send notifications (Feishu, DingTalk, WeCom)

## Configuration

Create `.autoclaw/setting.json` in your project:

```json
{
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4o",
  "autoConfirm": false
}
```

Or set environment variables:
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

## Requirements

- Node.js 18+
- OpenAI API key (free tier works)
- For Netlify: GitHub account

## License

MIT

## Contributing

Contributions welcome! Open an issue or PR.

## Support

For issues, questions, or suggestions: [GitHub Issues](https://github.com/Lightiam/EDA-agentic-ai/issues)

---

Built with ❤️ by the AutoClaw team
