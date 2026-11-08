// Package main generates the index.html for tools.rselbach.com
package main

import (
	"bytes"
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// Tool is a browser tool that lives in this repository under tools/<Path>/.
type Tool struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Path        string `yaml:"-"`
}

// App is a project developed in another repository that deploys its own site.
type App struct {
	Name        string   `yaml:"name"`
	Description string   `yaml:"description"`
	URL         string   `yaml:"url"`
	Icon        string   `yaml:"icon"`
	Platforms   []string `yaml:"platforms"`
	Feed        string   `yaml:"feed"`
}

// PageData holds all data passed to the template.
type PageData struct {
	Apps  []App
	Tools []Tool
	Year  int
}

const (
	appsDir     = "apps"
	toolsDir    = "tools"
	templateDir = "template"
	outputFile  = "index.html"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	apps, err := discoverApps(appsDir)
	if err != nil {
		return fmt.Errorf("discovering apps: %w", err)
	}

	tools, err := discoverTools(toolsDir)
	if err != nil {
		return fmt.Errorf("discovering tools: %w", err)
	}

	sort.Slice(apps, func(i, j int) bool {
		return strings.ToLower(apps[i].Name) < strings.ToLower(apps[j].Name)
	})
	sort.Slice(tools, func(i, j int) bool {
		return strings.ToLower(tools[i].Name) < strings.ToLower(tools[j].Name)
	})

	funcs := template.FuncMap{
		"join":       strings.Join,
		"displayURL": displayURL,
	}
	tmplPath := filepath.Join(templateDir, "index.tmpl")
	tmpl, err := template.New(filepath.Base(tmplPath)).Funcs(funcs).ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("parsing template: %w", err)
	}

	var out bytes.Buffer
	data := PageData{Apps: apps, Tools: tools, Year: time.Now().Year()}
	if err := tmpl.Execute(&out, data); err != nil {
		return fmt.Errorf("executing template: %w", err)
	}
	if err := os.WriteFile(outputFile, out.Bytes(), 0o644); err != nil {
		return fmt.Errorf("writing %s: %w", outputFile, err)
	}

	fmt.Printf("generated %s with %d apps and %d tools\n", outputFile, len(apps), len(tools))
	return nil
}

// discoverApps reads every <slug>.yaml file in the apps directory.
func discoverApps(dir string) ([]App, error) {
	paths, err := filepath.Glob(filepath.Join(dir, "*.yaml"))
	if err != nil {
		return nil, err
	}

	apps := make([]App, 0, len(paths))
	for _, path := range paths {
		app, err := readYAML[App](path)
		if err != nil {
			return nil, fmt.Errorf("reading %s: %w", path, err)
		}
		if app.Name == "" || app.Description == "" || app.URL == "" || app.Icon == "" {
			return nil, fmt.Errorf("%s: name, description, url, and icon are required", path)
		}
		apps = append(apps, app)
	}
	return apps, nil
}

// discoverTools reads tool.yaml from each subdirectory of the tools directory.
func discoverTools(dir string) ([]Tool, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var tools []Tool
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		toolPath := filepath.Join(dir, entry.Name(), "tool.yaml")
		tool, err := readYAML[Tool](toolPath)
		switch {
		case errors.Is(err, fs.ErrNotExist):
			continue
		case err != nil:
			return nil, fmt.Errorf("reading %s: %w", toolPath, err)
		}

		tool.Path = entry.Name()
		tools = append(tools, tool)
	}
	return tools, nil
}

// readYAML parses the YAML file at path into a T.
func readYAML[T any](path string) (T, error) {
	var v T
	data, err := os.ReadFile(path)
	if err != nil {
		return v, err
	}
	if err := yaml.Unmarshal(data, &v); err != nil {
		return v, err
	}
	return v, nil
}

// displayURL drops the scheme and trailing slash, so https://rselbach.com/onda/
// reads as rselbach.com/onda.
func displayURL(u string) string {
	u = strings.TrimPrefix(u, "https://")
	u = strings.TrimPrefix(u, "http://")
	return strings.TrimSuffix(u, "/")
}
