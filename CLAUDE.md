# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wordle Solver - A React-based web application that helps users solve Wordle puzzles by filtering possible words based on letter constraints.

## Commands

### Development
- `npm start` - Start development server on http://localhost:3000
- `npm run build` - Build production-ready files to `build/` directory
- `npm run deploy` - Build and deploy to robteix.com via rsync (builds then runs `rsync -avz --delete build/ robteix.com:/data/www/wsolver/`)

### Installation
- `npm install` - Install all dependencies

## Architecture

### Core Components

The application is a single-page React app with all logic contained in `src/App.js`:

1. **Grid System**: 6 rows × 5 columns of letter cells
   - Each cell has a `letter` and `state` (gray/yellow/green)
   - Letters automatically inherit colors from same position in previous rows
   - Clicking a cell cycles its color state

2. **Word Filtering Logic**: 
   - Loads wordlists from `public/wordlist.txt` (full) or `public/common.txt` (common words)
   - Filters based on three constraint types:
     - Green letters: Must be in exact position
     - Yellow letters: Must be in word but not in specified positions  
     - Gray letters: Must not be in word (unless also green/yellow elsewhere)

3. **Input Handling**:
   - Desktop: Global keyboard listener captures all keypresses
   - Mobile: Virtual QWERTY keyboard component fixed at bottom
   - Letters always fill the first empty cell
   - Backspace removes the last filled letter

### Key Implementation Details

- **Color Synchronization**: When a letter's color changes, all instances of that letter in the same position across all rows update automatically
- **No Focus Management**: Input works globally without tracking focus - typing always goes to first empty cell
- **Word Display**: Filtered words show with colored letters matching the constraints (green for confirmed positions, yellow for letters in word)

### File Structure

```
public/
  wordlist.txt     # Full word list (1379 words)
  common.txt       # Common words only
src/
  App.js          # Main application logic
  App.css         # All styling including virtual keyboard
```

## Special Behaviors

- Empty cells cannot have their color changed (always gray)
- Deleting a letter resets its color to gray
- Virtual keyboard only appears on mobile devices (≤768px width)
- Word list shows maximum of 10/20/50/100 words (user selectable)