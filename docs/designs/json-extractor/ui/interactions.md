# JSON Extractor - Interactions Design

## Overview
This document describes the user interaction patterns and behaviors for the JSON Extractor tool.

## User Interactions

### 1. Input Interactions

#### Text Input
- **Primary**: Type/paste JSON into the textarea
- **Actions**:
  - Paste button: Read from clipboard
  - File upload: Drag-drop or click to select `.json` file
  - URL import: Fetch JSON from URL
  - Clear: Reset input and paths

#### JSON Validation
- Automatic validation with 500ms debounce
- Visual indicator (green checkmark / red X) in input header
- Validation runs on every input change

### 2. Path Expression

#### Manual Entry
- Type JSONPath expression in the path input
- Press Enter or click Extract to execute

#### Auto-Detect
- Click "可用路径" (detected paths) button
- Popup shows all detectable JSONPath expressions
- Click a path to auto-fill the input

### 3. Extraction

#### Trigger Methods
1. Click "提取" (Extract) button
2. Press Enter in path input

#### Loading State
- Extract button shows loading spinner
- Input/Output panels remain interactive

### 4. Output Interactions

#### Format Selection
- Dropdown to select: JSON, CSV, Text, YAML
- Output updates automatically on format change

#### Copy & Download
- Copy button: Copy output to clipboard with toast notification
- Download button: Save as file with appropriate extension

### 5. Context Menu

#### Right-Click on Input
- Shows "Copy JSONPath" option
- Copies selected text or full input to clipboard
- Click anywhere to dismiss

### 6. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+V | Paste from clipboard |
| Ctrl+Enter | Execute extraction |
| Escape | Close modals/popups |

### 7. Error Handling

#### Error States
- Invalid JSON: Red indicator + error message
- Invalid path: Error message in output area
- Network error (URL import): Toast notification

#### Toast Notifications
- Success: Green, auto-dismiss after 3s
- Error: Red, requires manual dismiss
- Warning: Yellow, auto-dismiss after 5s
- Info: Blue, auto-dismiss after 3s

### 8. Platform-Specific

#### Desktop Mode (Tauri)
- History section in sidebar
- Favorites section (future)
- Settings access
- Data persists locally

#### Web Mode
- Stateless (no storage)
- Session-only persistence
- Lighter UI (no history/favorites)

## Component States

### InputPanel
```
States: empty | valid | invalid | loading
- empty: Placeholder visible
- valid: Green checkmark
- invalid: Red X mark
- loading: Extract button disabled
```

### OutputPanel
```
States: empty | success | error
- empty: Placeholder text
- success: Formatted output display
- error: Red error message
```

### Extract Button
```
States: default | hover | active | disabled | loading
- default: Accent color background
- hover: Slightly darker
- active: Pressed effect
- disabled: 50% opacity (when no input/loading)
- loading: Spinner icon
```

## Accessibility

- All buttons have accessible labels
- Keyboard navigation support
- Focus indicators on interactive elements
- Screen reader friendly toast notifications
