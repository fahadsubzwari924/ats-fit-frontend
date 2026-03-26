# Design Tokens Reference

Quick reference guide for all design tokens defined in the styling system.

## Color Palette

### Light Mode (Default)

#### Primary
```
Primary: hsl(222.2 47.4% 11.2%) - #0f172a (dark navy)
Primary Foreground: hsl(210 40% 98%) - #f0f7ff (off-white)
```

#### Secondary
```
Secondary: hsl(210 40% 96.1%) - #e8f1fd (light blue)
Secondary Foreground: hsl(222.2 47.4% 11.2%) - #0f172a (dark navy)
```

#### Background & Surface
```
Background: hsl(0 0% 100%) - #ffffff (white)
Foreground: hsl(222.2 84% 4.9%) - #0a0e27 (almost black)
Card: hsl(0 0% 100%) - #ffffff (white)
Card Foreground: hsl(222.2 84% 4.9%) - #0a0e27 (almost black)
```

#### States
```
Muted: hsl(210 40% 96.1%) - #e8f1fd (light)
Muted Foreground: hsl(215.4 16.3% 46.9%) - #6b7280 (gray)
Accent: hsl(210 40% 96.1%) - #e8f1fd (light blue)
Accent Foreground: hsl(222.2 47.4% 11.2%) - #0f172a (dark)
```

#### Destructive
```
Destructive: hsl(0 84.2% 60.2%) - #ef4444 (red)
Destructive Foreground: hsl(210 40% 98%) - #f0f7ff (off-white)
```

#### Borders
```
Border: hsl(214.3 31.8% 91.4%) - #e2e8f0 (light gray)
Input: hsl(214.3 31.8% 91.4%) - #e2e8f0 (light gray)
Ring: hsl(222.2 84% 4.9%) - #0a0e27 (almost black)
```

### Dark Mode

#### Primary
```
Primary: hsl(210 40% 98%) - #f0f7ff (off-white)
Primary Foreground: hsl(222.2 47.4% 11.2%) - #0f172a (dark navy)
```

#### Secondary
```
Secondary: hsl(217.2 32.6% 17.5%) - #1f2937 (dark gray)
Secondary Foreground: hsl(210 40% 98%) - #f0f7ff (off-white)
```

#### Background & Surface
```
Background: hsl(222.2 84% 4.9%) - #0a0e27 (dark navy)
Foreground: hsl(210 40% 98%) - #f0f7ff (off-white)
Card: hsl(222.2 84% 4.9%) - #0a0e27 (dark navy)
Card Foreground: hsl(210 40% 98%) - #f0f7ff (off-white)
```

#### Borders
```
Border: hsl(217.2 32.6% 17.5%) - #1f2937 (dark gray)
Input: hsl(217.2 32.6% 17.5%) - #1f2937 (dark gray)
```

## Spacing Scale

All measurements use 0.25rem (4px) base unit:

```
xs:  0.25rem =   4px
sm:  0.5rem  =   8px
md:  1rem    =  16px
lg:  1.5rem  =  24px
xl:  2rem    =  32px
2xl: 2.5rem  =  40px
3xl: 3rem    =  48px
4xl: 4rem    =  64px
```

**Usage**: `padding($spacing-lg)`, `margin($spacing-md)`, `gap: $spacing-sm`

## Typography Scale

### Font Families
```scss
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                   'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
                   'Droid Sans', 'Helvetica Neue', sans-serif

$font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace
```

### Font Sizes

```
xs:  0.75rem  = 12px   (caption)
sm:  0.875rem = 14px   (small body)
base: 1rem    = 16px   (body)
lg:  1.125rem = 18px   (large body)
xl:  1.25rem  = 20px   (small heading)
2xl: 1.5rem   = 24px   (heading)
3xl: 1.875rem = 30px   (large heading)
4xl: 2.25rem  = 36px   (section heading)
5xl: 3rem     = 48px   (hero heading)
6xl: 3.75rem  = 60px   (page title)
7xl: 4.5rem   = 72px   (banner title)
```

### Font Weights

```
light:     300
normal:    400 (default body text)
medium:    500 (labels, small headings)
semibold:  600 (headings, emphasis)
bold:      700 (strong emphasis)
```

### Line Heights

```
tight:    1     (headings, compact text)
snug:     1.25  (headings with more space)
normal:   1.5   (body text)
relaxed:  1.625 (large text)
loose:    2     (very loose spacing)
```

### Typography Presets

Using the `@include typography()` mixin:

```scss
@include typography(xs);   // 12px, weight 500, line-height 1
@include typography(sm);   // 14px, weight 400, line-height 1.25
@include typography(base); // 16px, weight 400, line-height 1.5
@include typography(lg);   // 18px, weight 500, line-height 1.5
@include typography(xl);   // 20px, weight 600, line-height 1.25
@include typography(2xl);  // 24px, weight 600, line-height 1
@include typography(3xl);  // 30px, weight 700, line-height 1

// Semantic typography mixins
@include heading-1;        // h1 styles (3xl preset)
@include heading-2;        // h2 styles (2xl preset)
@include heading-3;        // h3 styles (xl preset)
@include heading-4;        // h4 styles (lg preset)
@include body-text;        // body styles (base preset)
@include body-small;       // small body (sm preset)
@include caption;          // caption styles (xs preset, muted color)
```

## Border Radius

```
sm:   4px  (calc(0.5rem - 4px))
md:   8px  (0.5rem)
lg:   12px (0.75rem)
xl:   16px (1rem)
full: 9999px (fully rounded)
```

**Usage**: `@include rounded(lg)` or `.rounded-md` utility class

## Shadows

```
none: no shadow
xs:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
md:   0 4px 6px -1px rgba(0, 0, 0, 0.1), 
      0 2px 4px -2px rgba(0, 0, 0, 0.1)
lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -4px rgba(0, 0, 0, 0.1)
xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 8px 10px -6px rgba(0, 0, 0, 0.1)
2xl:  0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

**Usage**: `@include shadow(lg)` or `.shadow-lg` utility class

## Transitions

### Durations
```
fast:   150ms
normal: 300ms (default)
slow:   500ms
```

### Timing Functions
```
linear:       linear
ease:         ease
ease-in:      ease-in
ease-out:     ease-out
ease-in-out:  ease-in-out (default)
cubic-bezier: cubic-bezier(0.4, 0, 0.2, 1)
```

**Usage**: `@include transition(all, normal)`

## Responsive Breakpoints

```
xs:  0px    (mobile first)
sm:  640px  (small devices)
md:  768px  (tablets)
lg:  1024px (small desktops)
xl:  1280px (desktops)
2xl: 1536px (large desktops)
```

**Usage**: 
```scss
@include respond-to(md) {
  // Styles for md and up
}
```

## Component Tokens

### Button Sizes
```
sm: height 36px, padding 8px 12px
md: height 40px, padding 16px 24px (default)
lg: height 44px, padding 16px 32px
icon: 40x40px, no padding
```

### Form Input Sizes
```
sm: height 36px, padding 8px 12px
md: height 40px, padding 16px 12px (default)
lg: height 44px, padding 16px 16px
```

### Sidebar Colors (Optional)
```
background:       hsl(0 0% 98%)
foreground:       hsl(240 5.3% 26.1%)
primary:          hsl(240 5.9% 10%)
primary-foreground: hsl(0 0% 98%)
accent:           hsl(240 4.8% 95.9%)
accent-foreground: hsl(240 5.9% 10%)
border:           hsl(220 13% 91%)
ring:             hsl(217.2 91.2% 59.8%)
```

## Usage Examples

### In SCSS Files

```scss
// Import tokens and mixins
@import '../../scss/design-tokens';
@import '../../scss/mixins';

// Use variables
.my-component {
  color: $color-foreground;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  
  // Use mixins
  @include flex(row, center, center);
  @include typography(lg);
  @include shadow(md);
  @include transition(all, normal);
  
  // Dark mode
  @include dark-mode {
    color: $color-dark-foreground;
    background-color: $color-dark-background;
  }
  
  // Responsive
  @include respond-to(md) {
    padding: $spacing-xl;
  }
}
```

### In HTML (Using Utility Classes)

```html
<!-- Spacing -->
<div class="p-lg m-md">Content</div>

<!-- Typography -->
<h1 class="text-3xl font-bold">Heading</h1>
<p class="text-sm text-muted-foreground">Caption</p>

<!-- Colors -->
<div class="bg-card text-foreground">Card</div>
<span class="text-primary">Primary text</span>

<!-- Layout -->
<div class="flex items-center justify-between gap-md">
  <span>Label</span>
  <span>Value</span>
</div>

<!-- Border & Shadow -->
<div class="border rounded-lg shadow-md">
  Boxed content
</div>
```

## Theme Customization

To customize colors, edit `src/scss/_design-tokens.scss`:

```scss
// Change primary color
$color-primary: hsl(210 100% 50%);        // Different hue
$color-primary: hsl(222.2 60% 20%);       // Different saturation/lightness
```

Changes automatically propagate throughout the entire application!

## Sidebar Theme (Advanced)

For applications with sidebars, sidebar-specific colors are included:

```scss
$color-sidebar-background: hsl(0 0% 98%);
$color-sidebar-foreground: hsl(240 5.3% 26.1%);
$color-sidebar-primary: hsl(240 5.9% 10%);
// ... and more
```

These can be used for sidebar-specific styling without affecting main theme colors.
