# Roberto's Toolset

A collection of small web utilities, auto-indexed and served from a single site.

## Adding a new tool

1. Create a directory under `tools/`:
   ```
   tools/my-tool/
   ```

2. Add a `tool.yaml` with metadata:
   ```yaml
   name: My Tool
   description: What it does
   icon: "🔨"  # optional, defaults to 🔧
   ```

3. Add your tool files (`index.html`, scripts, etc.)

4. Push to `main` — GitHub Actions will regenerate the index

## Local development

Generate the index:
```bash
go run build/main.go
```

Preview locally:
```bash
python3 -m http.server 8080
```

## Structure

```
├── build/main.go         # Index generator
├── template/index.tmpl   # HTML template
├── static/
│   ├── style.css         # Shared styles
│   └── favicon.svg
├── tools/                # Your tools go here
│   └── example/
│       ├── tool.yaml
│       └── index.html
└── index.html            # Generated
```

## License

MIT
