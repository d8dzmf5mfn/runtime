# Codex Updates Plugin

> Browse official Codex desktop app release notes directly inside Codex.

A **Codex plugin** that fetches and displays the latest changelog from the official Codex desktop app at `developers.openai.com/codex/changelog`.

## Features

- Fetch latest Codex desktop app release notes
- See new features, improvements, and bug fixes per release
- Works entirely inside Codex — no browser needed

## Installation

### In Codex Desktop App

1. Open the **Plugins** panel in Codex
2. Search for **"Codex Updates"**
3. Click **Install**
4. Ask Codex: *"What's new in the latest Codex update?"*

### Manual Installation (from GitHub)

```bash
git clone https://github.com/d8dzmf5mfn/runtime.git
cd runtime/plugins/codex-updates
# Restart Codex desktop app, then open Plugins
```

## Usage

Once installed, just ask:

> *"What's new in the latest Codex update?"*
> *"Show me the Codex changelog"*

Codex will automatically invoke the plugin to fetch and display release notes.

## Development

```bash
node scripts/fetch-codex-updates.js --count 5
```

## Source

Release notes sourced from: [developers.openai.com/codex/changelog](https://developers.openai.com/codex/changelog)

## License

MIT — Built by [Runtime Team](https://github.com/d8dzmf5mfn/runtime)
