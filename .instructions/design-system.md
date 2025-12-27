# SecureVault Design System

This document defines the design patterns, components, and styling conventions used throughout the SecureVault application.

## Design Philosophy

- **Boxy/Industrial**: Zero border radius (`--radius: 0px`) for a sharp, modern look
- **High Contrast**: Dark green primary color for strong visual hierarchy
- **Uppercase Labels**: All labels and buttons use uppercase text with wide letter-spacing
- **Minimal Shadows**: Subtle shadows for depth without being heavy

## Color Palette

### Light Mode
```css
--primary: 142 40% 10%        /* Dark forest green - main actions */
--primary-foreground: 0 0% 98% /* White text on primary */
--background: 0 0% 100%        /* Pure white background */
--foreground: 0 0% 3.9%        /* Near-black text */
--card: 0 0% 100%              /* White cards */
--muted: 0 0% 96.1%            /* Light gray for backgrounds */
--muted-foreground: 0 0% 45.1% /* Gray text */
--border: 0 0% 89.8%           /* Light gray borders */
--destructive: 0 84.2% 60.2%   /* Red for delete/danger */
```

### Dark Mode
```css
--primary: 142 70% 50%         /* Bright green for visibility */
--background: 0 0% 3.9%        /* Near-black background */
--card: 0 0% 7%                /* Slightly lighter cards */
--muted: 0 0% 14.9%            /* Dark gray backgrounds */
```

## Typography

### Labels
```tsx
<label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
  Label Text
</label>
```

### Headings
```tsx
<h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">
  Page Title
</h1>

<h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
  Section Title
</h2>
```

### Body Text
```tsx
<p className="text-sm text-muted-foreground">
  Description text
</p>
```

## Components

### Primary Button
```tsx
<button className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</button>
```

### Secondary/Outline Button
```tsx
<button className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</button>
```

### Icon Button
```tsx
<button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
  <Icon className="h-4 w-4" />
</button>
```

### Destructive Icon Button
```tsx
<button className="p-2 text-destructive hover:bg-destructive/10 transition-colors">
  <Trash2 className="h-4 w-4" />
</button>
```

### Input Field
```tsx
<input
  type="text"
  placeholder="Placeholder text..."
  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
/>
```

### Input with Icon
```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <input
    type="text"
    placeholder="Search..."
    className="block w-full border border-input bg-background pl-12 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
  />
</div>
```

### Textarea
```tsx
<textarea
  placeholder="Enter text..."
  rows={3}
  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
/>
```

### Select Dropdown
```tsx
<select className="block w-full border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all">
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

### Checkbox
```tsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="w-4 h-4 border border-input bg-background text-primary focus:ring-primary focus:ring-offset-0"
  />
  <span className="text-sm text-foreground">Checkbox label</span>
</label>
```

### Card
```tsx
<div className="bg-card border border-border shadow-sm">
  <div className="p-4 sm:p-5">
    {/* Card content */}
  </div>
</div>
```

### Card with Hover Effect
```tsx
<div className="bg-card border border-border shadow-sm hover:border-primary/30 transition-colors animate-fade-in">
  <div className="p-4 sm:p-5">
    {/* Card content */}
  </div>
</div>
```

### Badge/Tag
```tsx
{/* Environment badges */}
<span className="px-2 py-0.5 text-xs border uppercase tracking-wider bg-primary/10 text-primary border-primary">
  Development
</span>

<span className="px-2 py-0.5 text-xs border uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-500">
  Staging
</span>

<span className="px-2 py-0.5 text-xs border uppercase tracking-wider bg-destructive/10 text-destructive border-destructive">
  Production
</span>

{/* Neutral badge */}
<span className="px-2 py-0.5 text-xs bg-muted border border-border text-muted-foreground">
  Tag
</span>
```

### Tabs
```tsx
<div className="flex border border-border bg-muted/50">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
        activeTab === tab.id
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Icon Toggle Buttons
```tsx
<div className="flex border border-border bg-muted/50">
  <button
    onClick={() => setMode('list')}
    className={`px-3 py-2.5 transition-all ${
      mode === 'list'
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
    title="List view"
  >
    <LayoutList className="h-4 w-4" />
  </button>
  <button
    onClick={() => setMode('grid')}
    className={`px-3 py-2.5 transition-all ${
      mode === 'grid'
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
    title="Grid view"
  >
    <Grid className="h-4 w-4" />
  </button>
</div>
```

## Modal/Dialog

```tsx
{isDialogOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="w-full max-w-md bg-card border border-border shadow-elegant animate-fade-in">
      {/* Dialog Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
            Dialog Title
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dialog description text
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDialogOpen(false)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Dialog Body */}
      <div className="p-6 space-y-5">
        {/* Form fields or content */}
      </div>

      {/* Dialog Footer */}
      <div className="flex gap-3 p-6 pt-0">
        <button
          type="button"
          onClick={() => setIsDialogOpen(false)}
          className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

### Scrollable Dialog
```tsx
<div className="w-full max-w-lg bg-card border border-border shadow-elegant animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
  {/* Header - fixed */}
  <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
    ...
  </div>
  
  {/* Body - scrollable */}
  <div className="p-6 space-y-5 overflow-y-auto flex-1">
    ...
  </div>
</div>
```

## Error/Alert Messages

```tsx
{/* Error message */}
<div className="p-4 text-sm text-destructive bg-destructive/10 border-2 border-destructive flex items-center gap-2">
  <div className="w-2 h-2 bg-destructive flex-shrink-0" />
  Error message text
</div>

{/* Success message */}
<div className="p-4 text-sm text-primary bg-primary/10 border-2 border-primary flex items-center gap-2">
  <Check className="h-5 w-5" />
  Success message text
</div>

{/* Warning message */}
<div className="p-4 text-sm text-amber-700 bg-amber-50 border-2 border-amber-500 flex items-center gap-2">
  <AlertCircle className="h-5 w-5" />
  Warning message text
</div>
```

## Empty State

```tsx
<div className="bg-card border border-border shadow-sm p-8 sm:p-12 text-center">
  <div className="inline-flex p-4 bg-muted mb-4">
    <Icon className="h-10 w-10 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
    No Items Yet
  </h3>
  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
    Description of what to do next
  </p>
  <button className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200 uppercase tracking-wide">
    <Plus className="h-4 w-4 mr-2" />
    Add Item
  </button>
</div>
```

## Loading Spinner

```tsx
<svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
</svg>

{/* Inline spinner in button */}
<button disabled className="...">
  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
  Loading...
</button>
```

## Page Layout

```tsx
<div className="min-h-screen flex bg-background">
  <Sidebar />
  <main className="flex-1 min-w-0 pt-16 lg:pt-0">
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">
            Page Title
          </h1>
          <p className="text-sm text-muted-foreground">
            Page description
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Action buttons */}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search input, tabs, toggles */}
      </div>

      {/* Content */}
      {/* ... */}
    </div>
  </main>
</div>
```

## Collapsible Section

```tsx
<div className="bg-card border border-border shadow-sm">
  <button
    onClick={() => toggleExpanded(id)}
    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      {isExpanded ? (
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
      <FolderOpen className="h-5 w-5 text-primary" />
      <span className="font-bold text-foreground uppercase tracking-wide">
        Section Title
      </span>
      <span className="px-2 py-0.5 text-xs bg-muted border border-border text-muted-foreground">
        {count} items
      </span>
    </div>
  </button>

  {isExpanded && (
    <div className="border-t border-border">
      {/* Expanded content */}
    </div>
  )}
</div>
```

## File Upload Area

```tsx
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="w-full flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors"
>
  <Upload className="h-6 w-6 text-muted-foreground" />
  <span className="text-muted-foreground">
    Click to select a file
  </span>
</button>
<input ref={fileInputRef} type="file" className="hidden" />
```

## Code/Monospace Display

```tsx
{/* Inline code */}
<code className="font-mono font-bold text-foreground">
  VARIABLE_NAME
</code>

{/* Code block */}
<pre className="p-4 bg-muted border-2 border-border text-sm font-mono overflow-auto max-h-64 text-foreground">
  {codeContent}
</pre>

{/* Password/Secret field */}
<div className="flex items-center gap-1 bg-muted border-2 border-border px-3 py-2">
  <code className="text-sm font-mono flex-1 truncate text-foreground">
    {showValue ? value : '••••••••••••'}
  </code>
  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
    {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
    <Copy className="h-4 w-4" />
  </button>
</div>
```

## Animation Classes

```css
/* Fade in with slight upward movement */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Continuous rotation */
.animate-spin {
  animation: spin 1s linear infinite;
}
```

## Icons

We use **Lucide React** for all icons. Common icons used:
- `Shield` - App logo
- `Key` - Passwords
- `Variable` - Environment variables  
- `Smartphone` - TOTP/2FA
- `Plus` - Add new
- `Search` - Search
- `Eye` / `EyeOff` - Show/hide
- `Copy` - Copy to clipboard
- `Check` - Success/copied
- `Edit2` - Edit
- `Trash2` - Delete
- `Download` - Export
- `Upload` - Import
- `X` - Close
- `Menu` - Mobile menu
- `Lock` / `LogOut` - User actions
- `ChevronDown` / `ChevronRight` - Expand/collapse
- `FolderOpen` - Project/folder
- `LayoutList` - List view
- `AlertCircle` - Warning
- `FileCode` - File export

## Responsive Breakpoints

```tsx
{/* Mobile first, then responsive */}
<div className="p-4 sm:p-6 lg:p-8">
  {/* Padding increases at sm and lg */}
</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:flex">
  {/* Desktop only content */}
</div>

{/* Show on mobile, hide on desktop */}
<div className="lg:hidden">
  {/* Mobile only content */}
</div>

{/* Stack on mobile, row on desktop */}
<div className="flex flex-col lg:flex-row gap-4">
  {/* Items */}
</div>
```
