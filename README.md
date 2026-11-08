# Roberto's Toolset

The index at tools.rselbach.com. It lists small web utilities that live in
this repository and apps from other repositories that publish their own sites.

## Adding a browser tool

1. Create a directory under `tools/`:
   ```
   tools/my-tool/
   ```

2. Add a `tool.yaml` with metadata:
   ```yaml
   name: My Tool
   description: What it does
   ```

3. Add your tool files (`index.html`, scripts, etc.)

4. Push to `main`. GitHub Actions regenerates the index and deploys.

## Adding an app

Apps are built and deployed from their own repositories. This repository only
lists them. Add `apps/<slug>.yaml`:

```yaml
name: Onda
description: What it does
url: https://rselbach.com/onda/
icon: https://rselbach.com/onda/icon.png
platforms: [macOS, Linux]
feed: https://rselbach.github.io/onda/update.json  # optional
```

`name`, `description`, `url`, and `icon` are required. When `feed` points to
an app's signed update feed, the index shows the latest version in the browser.

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
├── apps/                 # One YAML file per external app
├── build/main.go         # Index generator
├── template/index.tmpl   # HTML template
├── static/
│   ├── style.css         # Index and 404 styles
│   ├── common.css        # Shared tool styles
│   └── favicon.svg
├── tools/                # Browser tools
│   └── example/
│       ├── tool.yaml
│       └── index.html
└── index.html            # Generated
```

## License

MIT
