# Generic Button Component

A reusable, feat### With Icons from IconsConstant

```html
<!-- Using icons from your IconsConstant.SVG_ICONS -->
<app-button 
  text="Download Resume"
  iconLeft="downlaod"
  variant="success"
  (clicked)="downloadResume()">
</app-button>

<app-button 
  text="Generate"
  iconLeft="sparkles"
  variant="primary">
</app-button>

<app-button 
  text="Next"
  iconRight="arrowRight"
  variant="outline">
</app-button>
```

### External Icons/Images

```html
<!-- External Image URL -->
<app-button 
  text="GitHub" 
  externalIconLeft="https://img.icons8.com/fluency/24/github.png"
  externalIconAlt="GitHub icon"
  variant="secondary">
</app-button>

<!-- Local Image File -->
<app-button 
  text="Company Logo" 
  externalIconLeft="/assets/images/logo.png"
  variant="outline">
</app-button>

<!-- Custom SVG Content -->
<app-button 
  text="Custom Icon" 
  customSvgLeft="<svg...>...</svg>"
  variant="primary">
</app-button>
```utton component for Angular applications with support for multiple variants, sizes, icons, and states.

## Features

✅ **Multiple Variants**: primary, secondary, success, danger, warning, info, outline, ghost
✅ **Different Sizes**: xs, sm, md, lg, xl
✅ **Icon Support**: Built-in popular icons (download, sparkles, target, arrows, etc.) + External images/SVG support
✅ **Loading State**: Automatic spinner with disabled interaction
✅ **Disabled State**: Visual and functional disabled state
✅ **Event Emitters**: Clean event handling with `(clicked)` output
✅ **Button Types**: button, submit, reset
✅ **Full Width Option**: Responsive full-width support
✅ **Accessibility**: ARIA labels and proper focus management
✅ **Custom Content**: Content projection for complex button content
✅ **Theme Colors**: Consistent with your app's gradient color scheme

## Quick Start

### 1. Import the Component

```typescript
import { ButtonComponent } from './shared/components/ui/button/button.component';

@Component({
  imports: [ButtonComponent],
  // ...
})
export class YourComponent {
  handleClick(event: Event) {
    console.log('Button clicked!', event);
  }
}
```

### 2. Basic Usage

```html
<app-button
  text="Click me"
  variant="primary"
  (clicked)="handleClick($event)">
</app-button>
```

### 3. With Icons

```html
<app-button
  text="Download Resume"
  iconLeft="download"
  variant="success"
  (clicked)="downloadResume()">
</app-button>
```

## Replacing Existing Buttons

### Before (Old Button)
```html
<button
  class="justify-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl disabled:from-slate-400 disabled:to-slate-500"
  [disabled]="!selectedTemplate()"
  (click)="handleGenerateResume()">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles h-4 w-4">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
    <path d="M20 3v4"></path>
    <path d="M22 5h-4"></path>
    <path d="M4 17v2"></path>
    <path d="M5 18H3"></path>
  </svg>
  ✨ Generate Tailored Resume
</button>
```

### After (New Button Component)
```html
<app-button
  text="✨ Generate Tailored Resume"
  iconLeft="sparkles"
  variant="primary"
  [disabled]="selectedTemplateDisabled"
  (clicked)="handleGenerateResume()">
</app-button>
```

## Available Icons

- `download` - Download icon
- `sparkles` - Sparkles/magic icon
- `target` - Target/aim icon
- `arrow-left` - Left arrow
- `arrow-right` - Right arrow
- `check` - Checkmark
- `x` - Close/X icon
- `plus` - Plus/add icon
- `edit` - Edit/pencil icon
- `save` - Save/disk icon

## Migration Guide

### Step 1: Import ButtonComponent
Add `ButtonComponent` to your component's imports array.

### Step 2: Replace Button Elements
Replace `<button>` elements with `<app-button>` using these mappings:

| Old Attribute | New Property | Example |
|---------------|--------------|---------|
| `class="bg-gradient-to-r from-purple-600..."` | `variant="primary"` | Default gradient |
| `class="bg-gradient-to-r from-emerald-600..."` | `variant="success"` | Green gradient |
| `class="bg-gradient-to-r from-blue-600..."` | `variant="info"` | Blue gradient |
| `class="border-slate-300 hover:bg-slate-50"` | `variant="outline"` | Outline style |
| `[disabled]="condition"` | `[disabled]="signal(condition)"` | Reactive disabled |
| `(click)="handler()"` | `(clicked)="handler($event)"` | Click events |

### Step 3: Handle Loading States
```html
<!-- Before -->
<button [disabled]="isProcessing">
  @if (isProcessing) { Loading... } @else { Generate }
</button>

<!-- After -->
<app-button
  text="Generate"
  [loading]="isProcessing"
  (clicked)="generate()">
</app-button>
```

## Component API

### Inputs
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `variant` | `ButtonVariant` | `'primary'` | Visual style variant |
| `size` | `ButtonSize` | `'md'` | Button size |
| `disabled` | `WritableSignal<boolean>` | `signal(false)` | Disabled state |
| `loading` | `WritableSignal<boolean>` | `signal(false)` | Loading state |
| `fullWidth` | `boolean` | `false` | Full width button |
| `text` | `string` | `''` | Button text |
| `ariaLabel` | `string` | `''` | Accessibility label |
| `iconLeft` | `string` | `''` | Left icon name |
| `iconRight` | `string` | `''` | Right icon name |
| `iconClass` | `string` | `'h-4 w-4'` | Icon CSS classes |
| `customClass` | `string` | `''` | Additional CSS classes |

### Outputs
| Event | Type | Description |
|-------|------|-------------|
| `clicked` | `EventEmitter<Event>` | Emitted when button is clicked |

### Types
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonType = 'button' | 'submit' | 'reset';
```

## Benefits

1. **Consistency**: All buttons follow the same design system
2. **Maintainability**: Update button styles in one place
3. **Developer Experience**: Simple, intuitive API
4. **Accessibility**: Built-in ARIA support
5. **Performance**: Optimized with OnPush change detection
6. **Type Safety**: Full TypeScript support
7. **Flexibility**: Content projection for custom layouts
