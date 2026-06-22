# Codex Updates Plugin

> Browse official Codex desktop app release notes directly inside Codex.

A **Codex plugin** that fetches and displays the latest changelog from the official Codex desktop app at `developers.openai.com/codex/changelog`.

## Features

- Fetch latest Codex desktop app release notes
- See new features, improvements, and bug fixes per release
- Works entirely inside Codex — no browser needed

## Installation

### From this repository

```bash
codex plugin marketplace add d8dzmf5mfn/runtime
```

Restart Codex, open **Plugins**, select the `runtime-plugins` marketplace, and install **Codex Updates**. Start a new thread after installation.

### Local development

```bash
git clone https://github.com/d8dzmf5mfn/runtime.git
cd runtime/plugins/codex-updates
node scripts/fetch-codex-updates.js --count 3
```

## Usage

Once installed, just ask:

> *"What's new in the latest Codex update?"*
> *"Show me the Codex changelog"*

Codex will automatically invoke the plugin to fetch and display release notes.

## Development

```bash
node scripts/fetch-codex-updates.js --count 5
node --test scripts/fetch-codex-updates.test.js
```

Version `0.1.1` updates the parser for the current official changelog structure and fails clearly if the upstream format changes.

## Source

Release notes sourced from: [developers.openai.com/codex/changelog](https://developers.openai.com/codex/changelog)

## License

MIT — Built by [Runtime Team](https://github.com/d8dzmf5mfn/runtime)
