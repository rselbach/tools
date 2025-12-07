// Package main generates the index.html for tools.rselbach.com
package main

import (
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

// Tool represents the metadata for a single tool.
type Tool struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Icon        string `yaml:"icon"`
	Path        string // derived from directory name
}

// PageData holds all data passed to the template.
type PageData struct {
	Title    string
	Tagline  string
	RepoURL  string
	Tools    []Tool
	HasTools bool
}

const (
	defaultIcon = "🔧"
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
	tools, err := discoverTools(toolsDir)
	if err != nil {
		return fmt.Errorf("discovering tools: %w", err)
	}

	// sort alphabetically, case-insensitive
	sort.Slice(tools, func(i, j int) bool {
		return strings.ToLower(tools[i].Name) < strings.ToLower(tools[j].Name)
	})

	data := PageData{
		Title:    "Roberto's Toolset",
		Tagline:  "A collection of small web utilities",
		RepoURL:  "https://github.com/rselbach/tools",
		Tools:    tools,
		HasTools: len(tools) > 0,
	}

	tmplPath := filepath.Join(templateDir, "index.tmpl")
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("parsing template: %w", err)
	}

	out, err := os.Create(outputFile)
	if err != nil {
		return fmt.Errorf("creating output file: %w", err)
	}
	defer out.Close()

	if err := tmpl.Execute(out, data); err != nil {
		return fmt.Errorf("executing template: %w", err)
	}

	fmt.Printf("generated %s with %d tools\n", outputFile, len(tools))
	return nil
}

// discoverTools walks the tools directory and reads tool.yaml from each subdir.
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
		tool, err := readToolYAML(toolPath)
		if err != nil {
			// skip directories without tool.yaml
			if os.IsNotExist(err) {
				continue
			}
			return nil, fmt.Errorf("reading %s: %w", toolPath, err)
		}

		tool.Path = entry.Name()
		if tool.Icon == "" {
			tool.Icon = defaultIcon
		}

		tools = append(tools, tool)
	}

	return tools, nil
}

// readToolYAML parses a tool.yaml file.
func readToolYAML(path string) (Tool, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Tool{}, err
	}

	var tool Tool
	if err := yaml.Unmarshal(data, &tool); err != nil {
		return Tool{}, err
	}

	return tool, nil
}
