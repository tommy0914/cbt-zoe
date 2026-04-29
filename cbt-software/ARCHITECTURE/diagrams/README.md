Generating SVG/PNG from Mermaid sources

Prerequisites:

- Node.js
- Install mermaid-cli (recommended) or use npx

Commands:

```bash
# install mermaid CLI globally (optional)
npm install -g @mermaid-js/mermaid-cli

# generate SVG
npx @mermaid-js/mermaid-cli -i system.mmd -o system.svg
npx @mermaid-js/mermaid-cli -i component.mmd -o component.svg
npx @mermaid-js/mermaid-cli -i erd.mmd -o erd.svg

# generate PNG
npx @mermaid-js/mermaid-cli -i system.mmd -o system.png
```

Place generated images under this folder or `cbt-software/ARCHITECTURE/diagrams/exported/` for committed artifacts.
