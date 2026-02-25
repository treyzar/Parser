# Design Document: shadcn/ui Migration

## Overview

This design outlines the systematic migration of the BreslerEDO frontend application from a custom CSS-based design system to shadcn/ui component library. The migration will be executed in phases to minimize risk and ensure all functionality is preserved. The approach prioritizes maintaining existing functionality while improving consistency, accessibility, and maintainability.

The migration strategy follows these principles:
- Install and configure infrastructure first (Tailwind CSS, shadcn/ui CLI)
- Migrate simple, isolated components before complex ones
- Test each component migration independently
- Preserve all existing functionality and user workflows
- Maintain TypeScript type safety throughout
- Remove obsolete CSS only after successful component migration

## Architecture

### Current Architecture

The application currently uses:
- **Styling**: Custom CSS with CSS variables (design-system.css)
- **Components**: Custom React components with className-based styling
- **Icons**: lucide-react for all icons
- **State Management**: React hooks (useState, useCallback, useRef)
- **Build Tool**: Vite with TypeScript
- **Routing**: react-router-dom

### Target Architecture

After migration, the application will use:
- **Styling**: Tailwind CSS utility classes + shadcn/ui components
- **Components**: shadcn/ui components for common UI elements, custom components for specialized functionality
- **Icons**: lucide-react (unchanged)
- **State Management**: React hooks (unchanged)
- **Build Tool**: Vite with TypeScript + Tailwind CSS PostCSS plugin
- **Routing**: react-router-dom (unchanged)

### Migration Phases

**Phase 1: Infrastructure Setup**
- Install Tailwind CSS and dependencies
- Configure Tailwind with custom theme matching existing design tokens
- Install shadcn/ui CLI
- Set up component directory structure
- Configure path aliases

**Phase 2: Design Token Migration**
- Map CSS variables to Tailwind theme configuration
- Configure dark mode
- Set up custom colors, spacing, shadows, and border radius

**Phase 3: Basic Component Migration**
- Migrate Button components (all variants)
- Migrate Input components (text, number, color)
- Migrate Label components
- Migrate Textarea components

**Phase 4: Complex Component Migration**
- Migrate Select/Dropdown components
- Migrate Card components
- Migrate Badge components
- Migrate Tabs components
- Migrate Slider components
- Migrate Checkbox components

**Phase 5: Modal/Dialog Migration**
- Migrate Modal to Dialog component
- Migrate HelpModal
- Preserve signature editor canvas within Dialog

**Phase 6: Layout and Navigation**
- Update Layout component with shadcn/ui components
- Ensure navigation remains functional
- Update page layouts

**Phase 7: CSS Cleanup**
- Remove obsolete CSS rules from design-system.css
- Remove inline style tags where shadcn/ui provides styling
- Preserve CSS for custom components (Canvas, ResizeHandles, etc.)

**Phase 8: Testing and Validation**
- Verify TypeScript compilation
- Test all user interactions
- Validate accessibility
- Test dark mode
- Verify all exports (PDF, DOCX, HTML)

## Components and Interfaces

### shadcn/ui Components to Install

The following shadcn/ui components will be installed via CLI:

1. **button** - For all button elements
2. **input** - For text, number, and other input fields
3. **label** - For form labels
4. **textarea** - For multi-line text inputs
5. **select** - For dropdown menus
6. **card** - For content containers
7. **badge** - For status indicators
8. **dialog** - For modals and overlays
9. **tabs** - For tab navigation
10. **slider** - For range inputs
11. **checkbox** - For checkbox inputs

### Component Mapping

| Current Component | shadcn/ui Component | Notes |
|------------------|---------------------|-------|
| `.btn` | `<Button>` | Variants: default, secondary, ghost, destructive |
| `.input` | `<Input>` | Preserve all input types |
| `.label` | `<Label>` | Maintain htmlFor associations |
| `.textarea` | `<Textarea>` | Preserve resize behavior |
| `.select` | `<Select>` | Use Select, SelectTrigger, SelectContent, SelectItem |
| `.card-bs` | `<Card>` | Use Card, CardHeader, CardContent |
| `.badge` | `<Badge>` | Custom variants for template types |
| `Modal` | `<Dialog>` | Use Dialog, DialogContent, DialogHeader, DialogTitle |
| `.tabs` | `<Tabs>` | Use Tabs, TabsList, TabsTrigger, TabsContent |
| `.input-range` | `<Slider>` | Preserve min, max, step, value |
| `checkbox` | `<Checkbox>` | Maintain checked state and handlers |

### Custom Components to Preserve

These components have no direct shadcn/ui equivalents and will be preserved:

1. **Canvas** - Custom drag-drop canvas with multi-page support
2. **ElementRenderer** - Renders different element types on canvas
3. **ResizeHandles** - Provides resize handles for selected elements
4. **Signature Editor Canvas** - Custom canvas for drawing signatures
5. **All custom hooks** - useAutoZoom, useHistory, useDragResize, useKeyboard

These components will be updated to use shadcn/ui for their internal UI elements (buttons, inputs, etc.) but their core functionality remains custom.

## Data Models

### Tailwind Configuration

```typescript
// tailwind.config.js
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### CSS Variables Mapping

The existing CSS variables will be mapped to Tailwind/shadcn/ui conventions:

```css
/* Current → New */
--c-bg-100 → --background
--c-bg-200 → --muted
--c-ink-800 → --foreground
--c-accent (#e73f0c) → --primary
--radius-sm (6px) → --radius (8px with adjustments)
--radius-md (10px) → --radius
--shadow-sm → Tailwind shadow-sm
--shadow-md → Tailwind shadow-md
```

### Component Props Interfaces

shadcn/ui components come with their own TypeScript interfaces. Key interfaces to be aware of:

```typescript
// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Select
interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  // ... other props
}

// Dialog
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // ... other props
}
```

### Migration Compatibility Layer

To ease migration, we'll maintain compatibility with existing event handlers:

```typescript
// Example: Select onChange compatibility
// Current: onChange={(e) => setValue(e.target.value)}
// shadcn/ui: onValueChange={(value) => setValue(value)}

// We'll handle this in migration by updating all handlers
```

## Data Models

### Configuration Files

**tailwind.config.js**
- Extends default Tailwind theme
- Defines custom colors matching existing design system
- Configures dark mode
- Includes shadcn/ui required plugins

**components.json** (shadcn/ui config)
- Defines component installation path
- Configures TypeScript paths
- Sets up styling preferences

**postcss.config.js**
- Configures Tailwind CSS plugin
- Configures autoprefixer

### Component Structure

shadcn/ui components will be installed in `src/components/ui/` directory:

```
src/
  components/
    ui/              # shadcn/ui components
      button.tsx
      input.tsx
      label.tsx
      textarea.tsx
      select.tsx
      card.tsx
      badge.tsx
      dialog.tsx
      tabs.tsx
      slider.tsx
      checkbox.tsx
    editor/          # Custom editor components (preserved)
      Canvas.tsx
      ElementRenderer.tsx
      ResizeHandles.tsx
      PropertiesPanel.tsx
      ElementsPanel.tsx
      CanvasToolbar.tsx
      documentation/
        HelpModal.tsx
        Modal.tsx
    Layout.tsx       # Updated to use shadcn/ui
```

### Type Definitions

All existing type definitions will be preserved:

```typescript
// Existing types remain unchanged
interface IEditorElement {
  id: string
  type: TElementType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  properties: ITextProperties | IImageProperties | ITableProperties | ISignatureProperties | IDividerProperties
}

// These types are not affected by UI migration
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties. Many criteria are about configuration and file structure (examples), while others test behavioral properties across all inputs. Several criteria are redundant or covered by other properties:

- Criteria 1.7, 12.5, 14.4 (covered by other properties)
- Criteria 16.3, 16.4, 16.6 (covered by design token requirements 2.5, 2.6, 2.2)
- Criteria 20.4 (covered by 14.8)
- Criteria 22.1, 22.4, 22.5, 22.6 (covered by other specific requirements)

The remaining properties fall into three categories:
1. **Configuration/Structure Examples** - Verify files, directories, and configuration exist with correct content
2. **Behavioral Properties** - Verify functionality works correctly across all inputs
3. **Visual/Subjective** - Cannot be automatically tested (focus indicators, visual styling, etc.)

### Configuration and Structure Properties (Examples)

Property 1: Tailwind CSS dependency installation
*For the* package.json file, it should contain "tailwindcss" in devDependencies
**Validates: Requirements 1.1**

Property 2: Tailwind configuration file exists
*For the* project root, a tailwind.config.js file should exist and contain shadcn/ui compatible configuration including darkMode, content paths, and theme extensions
**Validates: Requirements 1.2**

Property 3: Components UI directory exists
*For the* src/components directory, a ui subdirectory should exist
**Validates: Requirements 1.4**

Property 4: Path aliases configured
*For the* tsconfig.json and vite.config.ts files, they should contain path alias configuration for @/components/ui
**Validates: Requirements 1.5**

Property 5: Vite proxy configuration preserved
*For the* vite.config.ts file, it should contain the server.proxy configuration for /api endpoint
**Validates: Requirements 1.6**

Property 6: Design tokens mapped to Tailwind
*For the* tailwind.config.js file, it should contain theme extensions for colors, spacing, borderRadius, and boxShadow that match existing CSS variable values
**Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 7: Dark mode configured
*For the* tailwind.config.js file, it should contain darkMode configuration set to "class"
**Validates: Requirements 2.2**

Property 8: Button component uses shadcn/ui
*For all* button elements in the codebase, they should import Button from @/components/ui/button
**Validates: Requirements 3.1**

Property 9: Button variants supported
*For the* button.tsx file, it should support variant prop with values: default, secondary, ghost, destructive
**Validates: Requirements 3.2**

Property 10: Button sizes supported
*For the* button.tsx file, it should support size prop with values: default, sm, lg, icon
**Validates: Requirements 3.6**

Property 11: Button icons preserved
*For any* Button component with an icon child, the icon should be rendered within the button
**Validates: Requirements 3.4**

Property 12: Input component uses shadcn/ui
*For all* input elements in the codebase, they should import Input from @/components/ui/input
**Validates: Requirements 4.1**

Property 13: Input types supported
*For the* Input component, it should accept type prop with values: text, number, color, file
**Validates: Requirements 4.2**

Property 14: Input placeholder preserved
*For any* Input component with placeholder prop, the placeholder text should be displayed when the input is empty
**Validates: Requirements 4.5**

Property 15: Select component uses shadcn/ui
*For all* select elements in the codebase, they should import Select from @/components/ui/select
**Validates: Requirements 5.1**

Property 16: Select options preserved
*For any* Select component, all option values from the original select should be present in SelectItem components
**Validates: Requirements 5.2**

Property 17: Select keyboard navigation
*For any* open Select component, pressing ArrowDown should move focus to the next option
**Validates: Requirements 5.6**

Property 18: Label component uses shadcn/ui
*For all* label elements in the codebase, they should import Label from @/components/ui/label
**Validates: Requirements 6.1**

Property 19: Label text preserved
*For any* Label component, the label text content should match the original label text
**Validates: Requirements 6.3**

Property 20: Label icons preserved
*For any* Label component with an icon child, the icon should be rendered within the label
**Validates: Requirements 6.4**

Property 21: Textarea component uses shadcn/ui
*For all* textarea elements in the codebase, they should import Textarea from @/components/ui/textarea
**Validates: Requirements 7.1**

Property 22: Textarea rows preserved
*For any* Textarea component with rows prop, the textarea should render with the specified number of rows
**Validates: Requirements 7.2**

Property 23: Textarea resize behavior
*For any* Textarea component, it should support CSS resize property
**Validates: Requirements 7.3**

Property 24: Textarea placeholder preserved
*For any* Textarea component with placeholder prop, the placeholder text should be displayed when empty
**Validates: Requirements 7.5**

Property 25: Card component uses shadcn/ui
*For all* card elements in the codebase, they should import Card from @/components/ui/card
**Validates: Requirements 8.1**

Property 26: Card content preserved
*For any* Card component, it should contain all original content including CardHeader, CardContent, icons, titles, descriptions, and action buttons
**Validates: Requirements 8.4**

Property 27: Card grid layout preserved
*For the* Dashboard page, cards should be arranged in a grid layout
**Validates: Requirements 8.5**

Property 28: Badge component uses shadcn/ui
*For all* badge elements in the codebase, they should import Badge from @/components/ui/badge
**Validates: Requirements 9.1**

Property 29: Badge variants supported
*For the* badge.tsx file, it should support custom variants for public, restricted, html, docx
**Validates: Requirements 9.2**

Property 30: Badge content preserved
*For any* Badge component, it should display the original badge text and icons
**Validates: Requirements 9.4**

Property 31: Dialog component uses shadcn/ui
*For all* modal components in the codebase, they should import Dialog from @/components/ui/dialog
**Validates: Requirements 10.1**

Property 32: Dialog content preserved
*For any* Dialog component, it should contain all original modal content including headers, body, and footer
**Validates: Requirements 10.3**

Property 33: Dialog Escape key closes
*For any* open Dialog component, pressing the Escape key should close the dialog
**Validates: Requirements 10.4**

Property 34: Dialog focus trapping
*For any* open Dialog component, pressing Tab should cycle focus through focusable elements within the dialog without leaving it
**Validates: Requirements 10.5**

Property 35: Dialog backdrop closes
*For any* open Dialog component, clicking the backdrop should close the dialog
**Validates: Requirements 10.6**

Property 36: Tabs component uses shadcn/ui
*For all* tab elements in the codebase, they should import Tabs from @/components/ui/tabs
**Validates: Requirements 11.1**

Property 37: Tabs content preserved
*For any* Tabs component, it should contain all original tab triggers and content panels
**Validates: Requirements 11.3**

Property 38: Tabs keyboard navigation
*For any* Tabs component, pressing ArrowRight should move focus to the next tab
**Validates: Requirements 11.5**

Property 39: Slider component uses shadcn/ui
*For all* range slider elements in the codebase, they should import Slider from @/components/ui/slider
**Validates: Requirements 12.1**

Property 40: Slider constraints preserved
*For any* Slider component, it should have the same min, max, and step values as the original range input
**Validates: Requirements 12.2**

Property 41: Checkbox component uses shadcn/ui
*For all* checkbox elements in the codebase, they should import Checkbox from @/components/ui/checkbox
**Validates: Requirements 13.1**

Property 42: Checkbox state preserved
*For any* Checkbox component, it should maintain the same checked state as the original checkbox
**Validates: Requirements 13.2**

Property 43: Checkbox labels preserved
*For any* Checkbox component, it should have an associated label with the original label text
**Validates: Requirements 13.4**

Property 44: Checkbox grid layout preserved
*For any* checkbox group, checkboxes should be arranged in the same grid layout as before
**Validates: Requirements 13.5**

Property 45: Canvas component preserved
*For the* Canvas component file, it should exist and contain the same drag-resize functionality
**Validates: Requirements 20.1**

Property 46: ElementRenderer preserved
*For the* ElementRenderer component file, it should exist and render all element types correctly
**Validates: Requirements 20.2**

Property 47: ResizeHandles preserved
*For the* ResizeHandles component file, it should exist and render resize handles
**Validates: Requirements 20.3**

Property 48: Custom hooks preserved
*For all* custom hook files (useAutoZoom, useHistory, useDragResize, useKeyboard), they should exist and be unchanged
**Validates: Requirements 20.5**

Property 49: Custom components use shadcn/ui elements
*For all* custom components (Canvas, PropertiesPanel, ElementsPanel, CanvasToolbar), their internal UI elements should use shadcn/ui components
**Validates: Requirements 20.6**

Property 50: TypeScript compilation succeeds
*For the* Frontend_Application, running tsc should complete without errors
**Validates: Requirements 15.1, 18.1**

Property 51: Type definitions preserved
*For all* type definition files, they should contain the same type definitions as before migration
**Validates: Requirements 15.2**

Property 52: shadcn/ui components properly typed
*For all* shadcn/ui component usages, TypeScript should validate prop types without errors
**Validates: Requirements 15.3**

Property 53: Vite build succeeds
*For the* Frontend_Application, running vite build should complete without errors
**Validates: Requirements 18.2**

Property 54: Vite dev server starts
*For the* Frontend_Application, running vite dev should start the development server without errors
**Validates: Requirements 18.3**

Property 55: ESLint passes
*For the* Frontend_Application, running eslint should complete without errors
**Validates: Requirements 18.4**

Property 56: Build output structure preserved
*For the* dist directory after build, it should contain index.html and assets directory
**Validates: Requirements 18.6**

Property 57: shadcn/ui dependencies added
*For the* package.json file, it should contain @radix-ui/* packages and class-variance-authority
**Validates: Requirements 19.1**

Property 58: Tailwind dependencies added
*For the* package.json file, it should contain tailwindcss, autoprefixer, and postcss
**Validates: Requirements 19.2**

Property 59: No dependency conflicts
*For the* Frontend_Application, running npm install should complete without peer dependency errors
**Validates: Requirements 19.3, 19.4**

Property 60: Obsolete CSS removed
*For the* design-system.css file, CSS rules for migrated components (.btn, .input, .select, etc.) should be removed
**Validates: Requirements 21.1**

Property 61: Custom component CSS preserved
*For the* design-system.css file, CSS rules for Canvas, ResizeHandles, and other custom components should be preserved
**Validates: Requirements 21.2**

Property 62: Inline styles removed
*For all* component files, inline <style> tags should be removed where shadcn/ui provides equivalent styling
**Validates: Requirements 21.3**

Property 63: Layout CSS preserved
*For the* design-system.css file, CSS rules for .container-1600, .grid, .flex utilities should be preserved
**Validates: Requirements 21.4**

Property 64: Canvas CSS preserved
*For the* design-system.css file, CSS rules for .canvas-layer, .canvas-viewport, and canvas-specific classes should be preserved
**Validates: Requirements 21.5**

Property 65: Build completes without warnings
*For the* Frontend_Application, running vite build should complete with exit code 0 and no warning messages
**Validates: Requirements 22.2**

Property 66: Semantic HTML structure
*For the* Frontend_Application, interactive elements should use appropriate semantic HTML elements (button, input, label, etc.)
**Validates: Requirements 17.5**

### Behavioral Properties (Universal)

Property 67: Button onClick handlers preserved
*For any* Button component with onClick handler, clicking the button should trigger the handler function
**Validates: Requirements 3.3**

Property 68: Disabled buttons don't trigger actions
*For any* Button component with disabled=true, clicking the button should not trigger the onClick handler
**Validates: Requirements 3.5**

Property 69: Input onChange handlers preserved
*For any* Input component with onChange handler, typing in the input should trigger the handler with the new value
**Validates: Requirements 4.4**

Property 70: Input constraints enforced
*For any* Input component with min/max constraints, the input should enforce those constraints on the value
**Validates: Requirements 4.3**

Property 71: Controlled input value binding
*For any* controlled Input component, changing the value prop should update the displayed value in the input
**Validates: Requirements 4.7**

Property 72: Select onValueChange handlers preserved
*For any* Select component with onValueChange handler, changing the selection should trigger the handler with the new value
**Validates: Requirements 5.3**

Property 73: Controlled select value binding
*For any* controlled Select component, changing the value prop should update the displayed selection
**Validates: Requirements 5.4**

Property 74: Label-input associations maintained
*For any* Label component with htmlFor attribute, there should exist an input element with matching id attribute
**Validates: Requirements 6.2**

Property 75: Textarea onChange handlers preserved
*For any* Textarea component with onChange handler, typing in the textarea should trigger the handler with the new value
**Validates: Requirements 7.4**

Property 76: Dialog open/close functionality
*For any* Dialog component, setting open=true should display the dialog, and setting open=false should hide the dialog
**Validates: Requirements 10.2**

Property 77: Tabs switching functionality
*For any* Tabs component, clicking a tab trigger should display the corresponding tab content
**Validates: Requirements 11.2**

Property 78: Slider onValueChange handlers preserved
*For any* Slider component with onValueChange handler, changing the slider position should trigger the handler with the new value
**Validates: Requirements 12.3**

Property 79: Controlled slider value binding
*For any* controlled Slider component, changing the value prop should update the displayed slider position
**Validates: Requirements 12.4**

Property 80: Checkbox onCheckedChange handlers preserved
*For any* Checkbox component with onCheckedChange handler, toggling the checkbox should trigger the handler with the new checked state
**Validates: Requirements 13.3**

Property 81: Template CRUD operations preserved
*For any* template operation (create, read, update, delete), the operation should complete successfully and produce the expected result
**Validates: Requirements 14.1**

Property 82: Canvas drag functionality preserved
*For any* draggable element on the canvas, dragging it should update its x and y coordinates
**Validates: Requirements 14.2**

Property 83: Element resize functionality preserved
*For any* resizable element on the canvas, resizing it should update its width and height
**Validates: Requirements 14.3**

Property 84: Undo/redo functionality preserved
*For any* sequence of actions, undoing should restore the previous state, and redoing should restore the action
**Validates: Requirements 14.4**

Property 85: Document export functionality preserved
*For any* export operation (PDF, DOCX, HTML), the operation should generate a valid file without errors
**Validates: Requirements 14.5**

Property 86: Element property editing preserved
*For any* element property change, updating the property should reflect in the element's state
**Validates: Requirements 14.6**

Property 87: Zoom functionality preserved
*For any* zoom value change, the canvas should scale accordingly
**Validates: Requirements 14.7**

Property 88: Grid toggle functionality preserved
*For any* grid visibility toggle, the grid should show when true and hide when false
**Validates: Requirements 14.7**

Property 89: Signature editor functionality preserved
*For any* signature canvas, drawing strokes should create visible marks on the canvas
**Validates: Requirements 14.8**

Property 90: Navigation functionality preserved
*For any* route navigation, the application should display the correct page component
**Validates: Requirements 14.9**

Property 91: API integration preserved
*For any* API call, the request should complete and return data in the expected format
**Validates: Requirements 14.10**

Property 92: TypeScript type safety for event handlers
*For any* event handler in shadcn/ui components, TypeScript should validate the event parameter type
**Validates: Requirements 15.5**

Property 93: shadcn/ui component prop types validated
*For any* shadcn/ui component usage, TypeScript should validate all props match the component's interface
**Validates: Requirements 15.4**

Property 94: Pages render without console errors
*For any* page in the application, loading the page should not produce console errors
**Validates: Requirements 22.3**

Property 95: Interactive elements keyboard accessible
*For any* interactive element (button, input, select, etc.), it should be reachable via Tab key navigation
**Validates: Requirements 17.1**

Property 96: ARIA labels for unlabeled elements
*For any* interactive element without visible text, it should have an aria-label or aria-labelledby attribute
**Validates: Requirements 17.2**

## Error Handling

### Migration Error Scenarios

**TypeScript Compilation Errors**
- Cause: Incompatible prop types between custom components and shadcn/ui
- Handling: Update prop interfaces to match shadcn/ui component APIs
- Prevention: Migrate components incrementally and compile after each change

**Runtime Errors**
- Cause: Missing imports or incorrect component usage
- Handling: Use getDiagnostics to catch errors early
- Prevention: Test each migrated component in the browser

**Styling Regressions**
- Cause: Missing Tailwind classes or incorrect theme configuration
- Handling: Compare visual output before and after migration
- Prevention: Map all CSS variables to Tailwind theme before migrating components

**Event Handler Incompatibilities**
- Cause: Different event signatures between native elements and shadcn/ui components
- Handling: Update event handlers to match shadcn/ui APIs (e.g., onChange → onValueChange)
- Prevention: Review shadcn/ui component documentation before migration

**Dependency Conflicts**
- Cause: Incompatible versions between existing dependencies and shadcn/ui requirements
- Handling: Update dependency versions to compatible ranges
- Prevention: Check peer dependencies before installation

### Error Recovery

**Rollback Strategy**
- Each phase is independent and can be rolled back via git
- Keep design-system.css until all components are migrated
- Test thoroughly before removing old CSS

**Validation Checkpoints**
- After Phase 1: Verify Tailwind compiles and dev server starts
- After Phase 2: Verify design tokens match existing styles
- After Phase 3-4: Verify each component renders correctly
- After Phase 5: Verify modals work correctly
- After Phase 6: Verify navigation works
- After Phase 7: Verify no visual regressions
- After Phase 8: Verify all functionality works end-to-end

## Testing Strategy

### Dual Testing Approach

The migration will be validated using both unit tests and property-based tests:

**Unit Tests** - Focus on:
- Specific component migration examples (Button renders with correct variant)
- Configuration file structure (tailwind.config.js contains required fields)
- Integration points (shadcn/ui components work within custom components)
- Edge cases (empty inputs, disabled states, error conditions)

**Property-Based Tests** - Focus on:
- Universal properties across all component instances (all buttons trigger onClick)
- Event handler preservation across all components
- Type safety across all component usages
- Functional preservation across all user interactions

### Property-Based Testing Configuration

**Library**: fast-check (TypeScript/JavaScript property-based testing library)
- Mature library with good TypeScript support
- Integrates well with Vitest/Jest
- Supports complex generators for React components

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `// Feature: shadcn-ui-migration, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('shadcn-ui-migration properties', () => {
  it('Property 67: Button onClick handlers preserved', () => {
    // Feature: shadcn-ui-migration, Property 67: Button onClick handlers preserved
    fc.assert(
      fc.property(
        fc.string(), // button text
        fc.boolean(), // disabled state
        (text, disabled) => {
          let clicked = false
          const handleClick = () => { clicked = true }
          
          const button = render(
            <Button onClick={handleClick} disabled={disabled}>
              {text}
            </Button>
          )
          
          fireEvent.click(button.getByRole('button'))
          
          if (disabled) {
            expect(clicked).toBe(false)
          } else {
            expect(clicked).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Testing Phases

**Phase 1: Configuration Testing**
- Unit tests: Verify all config files exist and contain required content
- Validate Tailwind compiles without errors
- Verify path aliases resolve correctly

**Phase 2: Component Migration Testing**
- Unit tests: Verify each migrated component renders correctly
- Property tests: Verify event handlers work across all inputs
- Verify TypeScript compilation after each component migration

**Phase 3: Integration Testing**
- Unit tests: Verify custom components work with shadcn/ui elements
- Property tests: Verify all user interactions work correctly
- Test all pages render without errors

**Phase 4: Functional Testing**
- Property tests: Verify all CRUD operations work
- Property tests: Verify canvas drag/resize works
- Property tests: Verify undo/redo works
- Property tests: Verify exports work (PDF, DOCX, HTML)

**Phase 5: Accessibility Testing**
- Unit tests: Verify ARIA labels present
- Property tests: Verify keyboard navigation works
- Manual testing: Verify screen reader compatibility

**Phase 6: Visual Regression Testing**
- Manual testing: Compare before/after screenshots
- Verify dark mode works correctly
- Verify responsive behavior maintained

### Test Coverage Goals

- 100% of migrated components have unit tests
- All behavioral properties have property-based tests
- All configuration requirements have validation tests
- TypeScript compilation validates type safety
- ESLint validates code quality

### Continuous Validation

Throughout migration:
1. Run TypeScript compiler after each component migration
2. Run ESLint after each file change
3. Test in browser after each component migration
4. Run property tests after completing each phase
5. Validate no console errors on all pages
