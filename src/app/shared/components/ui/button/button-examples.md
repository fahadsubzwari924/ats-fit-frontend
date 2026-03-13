# Button Component Usage Examples

## Basic Usage

### Import the component
```typescript
import { ButtonComponent } from './shared/components/ui/button/button.component';

@Component({
  imports: [ButtonComponent],
  // ...
})
```

### Basic button with text
```html
<app-button 
  text="Click me" 
  (clicked)="handleClick($event)">
</app-button>
```

## Button Variants

### Primary (default)
```html
<app-button variant="primary" text="Primary Button"></app-button>
```

### Secondary
```html
<app-button variant="secondary" text="Secondary Button"></app-button>
```

### Success
```html
<app-button variant="success" text="Success Button"></app-button>
```

### Danger
```html
<app-button variant="danger" text="Delete"></app-button>
```

### Warning
```html
<app-button variant="warning" text="Warning"></app-button>
```

### Info
```html
<app-button variant="info" text="Info"></app-button>
```

### Outline
```html
<app-button variant="outline" text="Outline Button"></app-button>
```

### Ghost
```html
<app-button variant="ghost" text="Ghost Button"></app-button>
```

## Button Sizes

### Extra Small
```html
<app-button size="xs" text="XS Button"></app-button>
```

### Small
```html
<app-button size="sm" text="Small Button"></app-button>
```

### Medium (default)
```html
<app-button size="md" text="Medium Button"></app-button>
```

### Large
```html
<app-button size="lg" text="Large Button"></app-button>
```

### Extra Large
```html
<app-button size="xl" text="XL Button"></app-button>
```

## Button with Icons

### Left Icon
```html
<app-button 
  text="Download" 
  iconLeft="download"
  variant="success">
</app-button>
```

### Right Icon
```html
<app-button 
  text="Next" 
  iconRight="arrow-right"
  variant="primary">
</app-button>
```

### Both Icons
```html
<app-button 
  text="Generate" 
  iconLeft="sparkles"
  iconRight="target"
  variant="primary">
</app-button>
```

## Available Icons
- `download`
- `sparkles`
- `target`
- `arrow-left`
- `arrow-right`
- `check`
- `x`
- `plus`
- `edit`
- `save`

## Button States

### Disabled
```html
<app-button 
  text="Disabled" 
  [disabled]="signal(true)">
</app-button>
```

### Loading
```html
<app-button 
  text="Processing..." 
  [loading]="isLoading">
</app-button>
```

### Full Width
```html
<app-button 
  text="Full Width Button" 
  [fullWidth]="true">
</app-button>
```

## Button Types

### Submit Button
```html
<app-button 
  type="submit" 
  text="Submit Form" 
  variant="primary">
</app-button>
```

### Reset Button
```html
<app-button 
  type="reset" 
  text="Reset" 
  variant="outline">
</app-button>
```

## Event Handling

```typescript
handleButtonClick(event: Event) {
  console.log('Button clicked:', event);
  // Your logic here
}
```

```html
<app-button 
  text="Click me" 
  (clicked)="handleButtonClick($event)">
</app-button>
```

## Custom Classes

```html
<app-button 
  text="Custom Button" 
  customClass="my-custom-class additional-class">
</app-button>
```

## Accessibility

```html
<app-button 
  text="Save Document" 
  ariaLabel="Save the current document to your computer"
  iconLeft="save">
</app-button>
```

## Content Projection

```html
<app-button variant="primary">
  <span class="font-bold">Custom</span>
  <span class="text-sm">Content</span>
</app-button>
```

## Real-world Examples

### Download Resume Button
```html
<app-button 
  text="📥 Download Resume"
  iconLeft="download"
  variant="success"
  size="lg"
  (clicked)="downloadResume()">
</app-button>
```

### Generate Tailored Resume Button
```html
<app-button 
  text="✨ Generate Tailored Resume"
  iconLeft="sparkles"
  variant="primary"
  size="md"
  [loading]="isGenerating"
  [disabled]="isGenerating"
  (clicked)="generateResume()">
</app-button>
```

### Back Button
```html
<app-button 
  text="← Back"
  iconLeft="arrow-left"
  variant="outline"
  size="md"
  (clicked)="goBack()">
</app-button>
```

### Close Modal Button
```html
<app-button 
  text="Done"
  variant="ghost"
  size="sm"
  (clicked)="closeModal()">
</app-button>
```

## Component Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'outline' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `disabled` | `WritableSignal<boolean>` | `signal(false)` | Whether button is disabled |
| `loading` | `WritableSignal<boolean>` | `signal(false)` | Whether button is in loading state |
| `fullWidth` | `boolean` | `false` | Whether button takes full width |
| `text` | `string` | `''` | Button text content |
| `ariaLabel` | `string` | `''` | Accessibility label |
| `iconLeft` | `string` | `''` | Left icon name |
| `iconRight` | `string` | `''` | Right icon name |
| `iconClass` | `string` | `'h-4 w-4'` | CSS classes for icons |
| `customClass` | `string` | `''` | Additional CSS classes |

## Component Events

| Event | Type | Description |
|-------|------|-------------|
| `clicked` | `EventEmitter<Event>` | Emitted when button is clicked (not disabled/loading) |
