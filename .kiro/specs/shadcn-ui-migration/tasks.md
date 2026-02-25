# Implementation Plan: shadcn/ui Migration

## Overview

This implementation plan breaks down the migration into discrete, incremental steps. Each task builds on previous work, ensuring the application remains functional throughout the migration. The approach prioritizes infrastructure setup, then migrates simple components before complex ones, and concludes with cleanup and validation.

## Tasks

- [ ] 1. Install and configure Tailwind CSS and shadcn/ui infrastructure
  - Install Tailwind CSS, PostCSS, and Autoprefixer as dev dependencies
  - Create tailwind.config.js with shadcn/ui compatible configuration
  - Create postcss.config.js with Tailwind plugin
  - Update vite.config.ts to include path alias for @/components/ui
  - Update tsconfig.json to include path alias for @/components/ui
  - Create src/components/ui directory
  - Install shadcn/ui CLI globally or as dev dependency
  - Create components.json configuration file for shadcn/ui
  - Add Tailwind directives to main CSS file or create new index.css
  - Verify dev server starts and Tailwind compiles correctly
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_


- [ ] 2. Configure Tailwind theme with existing design tokens
  - Map CSS variables from design-system.css to Tailwind theme configuration
  - Configure custom colors (accent #e73f0c, background, foreground, etc.)
  - Configure custom spacing scale matching existing --sp-* variables
  - Configure border radius values matching existing --radius-* variables
  - Configure box shadow values matching existing --shadow-* variables
  - Configure font family matching existing --font-sans variable
  - Set up dark mode configuration with "class" strategy
  - Create CSS variables file for shadcn/ui (src/styles/variables.css or in index.css)
  - Test that design tokens render correctly in light and dark mode
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ]* 2.1 Write unit tests for Tailwind configuration
  - Test that tailwind.config.js contains all required theme extensions
  - Test that CSS variables are defined correctly
  - Test that dark mode is configured
  - _Requirements: 2.1, 2.2_

- [ ] 3. Install shadcn/ui Button component and migrate all buttons
  - [ ] 3.1 Install Button component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add button
    - Verify button.tsx created in src/components/ui/
    - _Requirements: 3.1_
  
  - [ ] 3.2 Update button.tsx to support custom variants
    - Add "danger" variant mapping to "destructive"
    - Ensure variants: default (primary), secondary, ghost, destructive work
    - _Requirements: 3.2_
  
  - [ ] 3.3 Migrate Layout component buttons
    - Replace className="btn btn-*" with <Button variant="*">
    - Update imports to use @/components/ui/button
    - Preserve all onClick handlers and icons
    - Test navigation buttons work correctly
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ] 3.4 Migrate Dashboard component buttons
    - Replace all button elements with <Button> component
    - Map btn-primary → variant="default", btn-secondary → variant="secondary"
    - Preserve all Link wrappers and navigation
    - Test template action buttons work correctly
    - _Requirements: 3.1, 3.3_
  
  - [ ] 3.5 Migrate CanvasToolbar component buttons
    - Replace all toolbar buttons with <Button> component
    - Preserve disabled states for undo/redo buttons
    - Preserve all icons and onClick handlers
    - Test all toolbar actions work correctly
    - _Requirements: 3.1, 3.3, 3.5_
  
  - [ ] 3.6 Migrate ElementsPanel component buttons
    - Replace element addition buttons with <Button> component
    - Preserve button grid layout
    - Preserve all icons and onClick handlers
    - Test element addition works correctly
    - _Requirements: 3.1, 3.3_
  
  - [ ] 3.7 Migrate PropertiesPanel component buttons
    - Replace all action buttons with <Button> component
    - Preserve layer movement and delete buttons
    - Preserve all onClick handlers
    - Test property panel actions work correctly
    - _Requirements: 3.1, 3.3_
  
  - [ ] 3.8 Migrate MainEditor component buttons
    - Replace save button and other buttons with <Button> component
    - Preserve loading states
    - Preserve all onClick handlers
    - Test save functionality works correctly
    - _Requirements: 3.1, 3.3_
  
  - [ ]* 3.9 Write property tests for Button component
    - **Property 67: Button onClick handlers preserved**
    - **Validates: Requirements 3.3**
    - **Property 68: Disabled buttons don't trigger actions**
    - **Validates: Requirements 3.5**

- [ ] 4. Install shadcn/ui Input component and migrate all inputs
  - [ ] 4.1 Install Input component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add input
    - Verify input.tsx created in src/components/ui/
    - _Requirements: 4.1_
  
  - [ ] 4.2 Migrate MainEditor template metadata inputs
    - Replace title and description inputs with <Input> component
    - Preserve value bindings and onChange handlers
    - Preserve placeholder text
    - Test template metadata editing works
    - _Requirements: 4.1, 4.4, 4.5, 4.7_
  
  - [ ] 4.3 Migrate PropertiesPanel position and size inputs
    - Replace x, y, width, height number inputs with <Input type="number">
    - Preserve min, max, step constraints
    - Preserve onChange and onBlur handlers
    - Preserve temporary value state management
    - Test element positioning and sizing works correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_
  
  - [ ] 4.4 Migrate PropertiesPanel color inputs
    - Replace color inputs with <Input type="color">
    - Preserve value bindings and onChange handlers
    - Test color selection works correctly
    - _Requirements: 4.1, 4.2, 4.4, 4.7_
  
  - [ ] 4.5 Migrate PropertiesPanel text content inputs
    - Replace text inputs with <Input> component
    - Preserve value bindings and onChange handlers
    - Test text property editing works correctly
    - _Requirements: 4.1, 4.4, 4.7_
  
  - [ ]* 4.6 Write property tests for Input component
    - **Property 69: Input onChange handlers preserved**
    - **Validates: Requirements 4.4**
    - **Property 70: Input constraints enforced**
    - **Validates: Requirements 4.3**
    - **Property 71: Controlled input value binding**
    - **Validates: Requirements 4.7**

- [ ] 5. Install shadcn/ui Label component and migrate all labels
  - [ ] 5.1 Install Label component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add label
    - Verify label.tsx created in src/components/ui/
    - _Requirements: 6.1_
  
  - [ ] 5.2 Migrate PropertiesPanel form labels
    - Replace className="label" with <Label> component
    - Preserve htmlFor attributes for input associations
    - Preserve label text and icons
    - Test form labels are properly associated with inputs
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 5.3 Migrate ElementsPanel section labels
    - Replace labels with <Label> component where appropriate
    - Preserve label text and icons
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ]* 5.4 Write property tests for Label component
    - **Property 74: Label-input associations maintained**
    - **Validates: Requirements 6.2**


- [ ] 6. Install shadcn/ui Textarea component and migrate all textareas
  - [ ] 6.1 Install Textarea component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add textarea
    - Verify textarea.tsx created in src/components/ui/
    - _Requirements: 7.1_
  
  - [ ] 6.2 Migrate PropertiesPanel text content textarea
    - Replace textarea with <Textarea> component
    - Preserve rows configuration
    - Preserve resize behavior (add resize class if needed)
    - Preserve onChange handler and value binding
    - Preserve placeholder text
    - Test multi-line text editing works correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 6.3 Write property tests for Textarea component
    - **Property 75: Textarea onChange handlers preserved**
    - **Validates: Requirements 7.4**

- [ ] 7. Install shadcn/ui Select component and migrate all selects
  - [ ] 7.1 Install Select component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add select
    - Verify select.tsx created in src/components/ui/
    - _Requirements: 5.1_
  
  - [ ] 7.2 Migrate MainEditor template type and visibility selects
    - Replace select elements with <Select>, <SelectTrigger>, <SelectContent>, <SelectItem>
    - Update onChange to onValueChange
    - Preserve all option values (PDF, HTML, DOCX, PUBLIC, RESTRICTED)
    - Preserve value bindings
    - Test template type and visibility selection works
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 7.3 Migrate PropertiesPanel font family select
    - Replace select with <Select> component
    - Preserve all font options (Inter, Arial, Times New Roman, etc.)
    - Update onChange to onValueChange
    - Test font family selection works correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 7.4 Migrate PropertiesPanel text style selects
    - Replace whiteSpace and wordBreak selects with <Select> components
    - Preserve all option values
    - Update onChange to onValueChange
    - Test text style selection works correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 7.5 Migrate PropertiesPanel table cell selects
    - Replace row and column selects with <Select> components
    - Preserve dynamic option generation
    - Update onChange to onValueChange
    - Test table cell selection works correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 7.6 Migrate PropertiesPanel divider style select
    - Replace select with <Select> component
    - Preserve style options (solid, dashed, dotted)
    - Update onChange to onValueChange
    - Test divider style selection works correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 7.7 Migrate CanvasToolbar grid step select
    - Replace select with <Select> component
    - Preserve grid step options (8px, 10px, 16px, 20px, 24px, 32px)
    - Update onChange to onValueChange
    - Test grid step selection works correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 7.8 Write property tests for Select component
    - **Property 72: Select onValueChange handlers preserved**
    - **Validates: Requirements 5.3**
    - **Property 73: Controlled select value binding**
    - **Validates: Requirements 5.4**

- [ ] 8. Install shadcn/ui Card component and migrate all cards
  - [ ] 8.1 Install Card component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add card
    - Verify card.tsx created in src/components/ui/
    - _Requirements: 8.1_
  
  - [ ] 8.2 Migrate Dashboard template cards
    - Replace className="card-bs" with <Card> component
    - Use <CardHeader>, <CardContent> for structure
    - Preserve card grid layout
    - Preserve all card content (icons, titles, badges, descriptions, buttons)
    - Preserve hover effects using Tailwind classes
    - Test template cards render and interact correctly
    - _Requirements: 8.1, 8.4, 8.5_
  
  - [ ] 8.3 Migrate Dashboard empty state card
    - Replace empty state card with <Card> component
    - Preserve centered text and button
    - Test empty state displays correctly
    - _Requirements: 8.1, 8.4_

- [ ] 9. Install shadcn/ui Badge component and migrate all badges
  - [ ] 9.1 Install Badge component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add badge
    - Verify badge.tsx created in src/components/ui/
    - _Requirements: 9.1_
  
  - [ ] 9.2 Update badge.tsx to support custom variants
    - Add custom variants for: public, restricted, html, docx
    - Configure colors for each variant matching existing design
    - _Requirements: 9.2_
  
  - [ ] 9.3 Migrate Dashboard template badges
    - Replace className="badge badge-*" with <Badge variant="*">
    - Preserve badge content and icons
    - Test badges display correctly with proper colors
    - _Requirements: 9.1, 9.4_
  
  - [ ] 9.4 Migrate ElementsPanel shift hint badge
    - Replace badge with <Badge> component
    - Preserve badge content and icon
    - Test shift hint displays correctly
    - _Requirements: 9.1, 9.4_

- [ ] 10. Install shadcn/ui Slider component and migrate all sliders
  - [ ] 10.1 Install Slider component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add slider
    - Verify slider.tsx created in src/components/ui/
    - _Requirements: 12.1_
  
  - [ ] 10.2 Migrate ElementsPanel zoom slider
    - Replace input type="range" with <Slider> component
    - Update onChange to onValueChange
    - Preserve min (0.5), max (2), step (0.05) values
    - Preserve value binding
    - Test zoom slider works correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 10.3 Migrate PropertiesPanel font size slider
    - Replace input type="range" with <Slider> component
    - Update onChange to onValueChange
    - Preserve min (8), max (72), step (1) values
    - Preserve value binding
    - Test font size slider works correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 10.4 Migrate PropertiesPanel line height slider
    - Replace input type="range" with <Slider> component
    - Update onChange to onValueChange
    - Preserve min (1), max (3), step (0.1) values
    - Preserve value binding
    - Test line height slider works correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 10.5 Migrate PropertiesPanel text indent slider
    - Replace input type="range" with <Slider> component
    - Update onChange to onValueChange
    - Preserve min (0), max (80), step (5) values
    - Preserve value binding
    - Test text indent slider works correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 10.6 Migrate PropertiesPanel paragraph spacing slider
    - Replace input type="range" with <Slider> component
    - Update onChange to onValueChange
    - Preserve min (0), max (40), step (2) values
    - Preserve value binding
    - Test paragraph spacing slider works correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 10.7 Migrate PropertiesPanel table rows and columns sliders
    - Replace input type="range" with <Slider> components
    - Update onChange to onValueChange
    - Preserve min (1), max (10), step (1) values
    - Preserve value bindings
    - Test table dimension sliders work correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 10.8 Migrate PropertiesPanel divider thickness slider
    - Replace input type="range" with <Slider> component
    - Update onChange to onValueChange
    - Preserve min (1), max (5), step (1) values
    - Preserve value binding
    - Test divider thickness slider works correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 10.9 Write property tests for Slider component
    - **Property 78: Slider onValueChange handlers preserved**
    - **Validates: Requirements 12.3**
    - **Property 79: Controlled slider value binding**
    - **Validates: Requirements 12.4**

- [ ] 11. Install shadcn/ui Checkbox component and migrate all checkboxes
  - [ ] 11.1 Install Checkbox component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add checkbox
    - Verify checkbox.tsx created in src/components/ui/
    - _Requirements: 13.1_
  
  - [ ] 11.2 Migrate PropertiesPanel text style checkboxes
    - Replace input type="checkbox" with <Checkbox> component
    - Update onChange to onCheckedChange
    - Preserve checked state bindings
    - Preserve checkbox labels (bold, italic, underline)
    - Preserve checkbox grid layout
    - Test text style checkboxes work correctly
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 11.3 Migrate ElementsPanel grid visibility checkbox
    - Replace input type="checkbox" with <Checkbox> component
    - Update onChange to onCheckedChange
    - Preserve checked state binding
    - Preserve label
    - Test grid visibility toggle works correctly
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 11.4 Migrate CanvasToolbar grid visibility checkbox
    - Replace input type="checkbox" with <Checkbox> component
    - Update onChange to onCheckedChange
    - Preserve checked state binding
    - Preserve label
    - Test grid visibility toggle works correctly
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ]* 11.5 Write property tests for Checkbox component
    - **Property 80: Checkbox onCheckedChange handlers preserved**
    - **Validates: Requirements 13.3**


- [ ] 12. Install shadcn/ui Tabs component and migrate tab navigation
  - [ ] 12.1 Install Tabs component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add tabs
    - Verify tabs.tsx created in src/components/ui/
    - _Requirements: 11.1_
  
  - [ ] 12.2 Migrate Dashboard scope tabs
    - Replace className="tabs" and "tab" with <Tabs>, <TabsList>, <TabsTrigger>
    - Update tab state management to use Tabs value and onValueChange
    - Preserve tab content (public, my templates, shared)
    - Preserve active tab indicators
    - Test tab switching works correctly
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ]* 12.3 Write property tests for Tabs component
    - **Property 77: Tabs switching functionality**
    - **Validates: Requirements 11.2**

- [ ] 13. Install shadcn/ui Dialog component and migrate modals
  - [ ] 13.1 Install Dialog component via shadcn/ui CLI
    - Run: npx shadcn-ui@latest add dialog
    - Verify dialog.tsx created in src/components/ui/
    - _Requirements: 10.1_
  
  - [ ] 13.2 Migrate HelpModal component
    - Replace Modal wrapper with <Dialog>, <DialogContent>, <DialogHeader>, <DialogTitle>
    - Update isOpen to open and onClose to onOpenChange
    - Preserve modal content and structure
    - Test help modal opens and closes correctly
    - Test Escape key closes modal
    - Test backdrop click closes modal
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_
  
  - [ ] 13.3 Migrate signature editor Modal
    - Replace Modal wrapper with <Dialog> component
    - Update isOpen to open and onClose to onOpenChange
    - Preserve signature canvas and all drawing functionality
    - Preserve modal buttons (clear, cancel, save)
    - Test signature editor modal works correctly
    - Test focus trapping within modal
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  
  - [ ] 13.4 Remove old Modal component
    - Delete src/components/editor/documentation/Modal.tsx if no longer needed
    - Verify no imports reference the old Modal component
    - _Requirements: 10.1_
  
  - [ ]* 13.5 Write property tests for Dialog component
    - **Property 76: Dialog open/close functionality**
    - **Validates: Requirements 10.2**

- [ ] 14. Checkpoint - Verify all basic components migrated
  - Run TypeScript compiler and verify no errors
  - Run ESLint and verify no errors
  - Test all pages in browser and verify no console errors
  - Test all migrated components work correctly
  - Verify dark mode still works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Update custom components to use shadcn/ui internally
  - [ ] 15.1 Update PropertiesPanel to use shadcn/ui components
    - Ensure all buttons use <Button> component
    - Ensure all inputs use <Input> component
    - Ensure all labels use <Label> component
    - Ensure all selects use <Select> component
    - Ensure all sliders use <Slider> component
    - Ensure all checkboxes use <Checkbox> component
    - Remove inline <style> tag
    - Test properties panel works correctly
    - _Requirements: 20.6, 21.3_
  
  - [ ] 15.2 Update ElementsPanel to use shadcn/ui components
    - Ensure all buttons use <Button> component
    - Ensure checkbox uses <Checkbox> component
    - Remove inline <style> tag
    - Test elements panel works correctly
    - _Requirements: 20.6, 21.3_
  
  - [ ] 15.3 Update CanvasToolbar to use shadcn/ui components
    - Ensure all buttons use <Button> component
    - Ensure checkbox uses <Checkbox> component
    - Ensure select uses <Select> component
    - Test canvas toolbar works correctly
    - _Requirements: 20.6_

- [ ] 16. Clean up obsolete CSS from design-system.css
  - [ ] 16.1 Remove button-related CSS rules
    - Remove .btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-danger classes
    - Remove .btn:focus, .btn:hover rules
    - Preserve any button-specific layout rules if needed
    - _Requirements: 21.1_
  
  - [ ] 16.2 Remove input-related CSS rules
    - Remove .input, .input:focus, .input-range classes
    - Remove .textarea class
    - Remove .label class
    - Remove .select, .select:focus classes
    - _Requirements: 21.1_
  
  - [ ] 16.3 Remove card-related CSS rules
    - Remove .card-bs, .card-bs:hover classes
    - Remove .card-header-bs, .card-icon classes
    - Preserve any card-specific layout rules if needed
    - _Requirements: 21.1_
  
  - [ ] 16.4 Remove badge-related CSS rules
    - Remove .badge, .badge-public, .badge-restricted, .badge-html, .badge-docx classes
    - _Requirements: 21.1_
  
  - [ ] 16.5 Remove tab-related CSS rules
    - Remove .tabs, .tab, .tab:hover, .tab.active, .tab.active::after classes
    - _Requirements: 21.1_
  
  - [ ] 16.6 Verify custom component CSS preserved
    - Ensure .canvas-layer, .canvas-viewport, .canvas-toolbar CSS remains
    - Ensure .properties-placeholder CSS remains
    - Ensure .editor-container CSS remains
    - Ensure layout utilities (.container-1600, .grid, .flex) remain
    - _Requirements: 21.2, 21.4, 21.5_

- [ ] 17. Update global styles and CSS organization
  - [ ] 17.1 Create or update src/index.css with Tailwind directives
    - Add @tailwind base, @tailwind components, @tailwind utilities
    - Import design-system.css after Tailwind directives
    - Ensure main.tsx imports index.css
    - _Requirements: 1.1_
  
  - [ ] 17.2 Create CSS variables file for shadcn/ui
    - Define HSL-based CSS variables for shadcn/ui theme
    - Map existing colors to HSL format
    - Configure light and dark mode variables
    - _Requirements: 2.1, 2.2_
  
  - [ ] 17.3 Update design-system.css organization
    - Keep only custom component styles
    - Keep layout utilities
    - Keep canvas-specific styles
    - Remove all migrated component styles
    - _Requirements: 21.1, 21.2_

- [ ] 18. Accessibility improvements
  - [ ] 18.1 Add ARIA labels to unlabeled interactive elements
    - Review all buttons, inputs, and interactive elements
    - Add aria-label where visible text is not present
    - Add aria-labelledby where labels exist but not properly associated
    - _Requirements: 17.2_
  
  - [ ] 18.2 Verify keyboard navigation
    - Test Tab key navigation through all pages
    - Ensure all interactive elements are reachable
    - Ensure focus order is logical
    - _Requirements: 17.1_
  
  - [ ] 18.3 Verify semantic HTML structure
    - Ensure buttons use <button> or <Button> component
    - Ensure inputs use <input> or <Input> component
    - Ensure proper heading hierarchy
    - _Requirements: 17.5_


- [ ] 19. Write comprehensive property-based tests for functional preservation
  - [ ]* 19.1 Install fast-check for property-based testing
    - Add fast-check as dev dependency
    - Configure Vitest or Jest for property testing
    - _Requirements: 14.1-14.10_
  
  - [ ]* 19.2 Write property test for template CRUD operations
    - **Property 81: Template CRUD operations preserved**
    - **Validates: Requirements 14.1**
  
  - [ ]* 19.3 Write property test for canvas drag functionality
    - **Property 82: Canvas drag functionality preserved**
    - **Validates: Requirements 14.2**
  
  - [ ]* 19.4 Write property test for element resize functionality
    - **Property 83: Element resize functionality preserved**
    - **Validates: Requirements 14.3**
  
  - [ ]* 19.5 Write property test for undo/redo functionality
    - **Property 84: Undo/redo functionality preserved**
    - **Validates: Requirements 14.4**
  
  - [ ]* 19.6 Write property test for document export functionality
    - **Property 85: Document export functionality preserved**
    - **Validates: Requirements 14.5**
  
  - [ ]* 19.7 Write property test for element property editing
    - **Property 86: Element property editing preserved**
    - **Validates: Requirements 14.6**
  
  - [ ]* 19.8 Write property test for zoom functionality
    - **Property 87: Zoom functionality preserved**
    - **Validates: Requirements 14.7**
  
  - [ ]* 19.9 Write property test for grid toggle functionality
    - **Property 88: Grid toggle functionality preserved**
    - **Validates: Requirements 14.7**
  
  - [ ]* 19.10 Write property test for signature editor functionality
    - **Property 89: Signature editor functionality preserved**
    - **Validates: Requirements 14.8**
  
  - [ ]* 19.11 Write property test for navigation functionality
    - **Property 90: Navigation functionality preserved**
    - **Validates: Requirements 14.9**
  
  - [ ]* 19.12 Write property test for API integration
    - **Property 91: API integration preserved**
    - **Validates: Requirements 14.10**
  
  - [ ]* 19.13 Write property test for page rendering without errors
    - **Property 94: Pages render without console errors**
    - **Validates: Requirements 22.3**
  
  - [ ]* 19.14 Write property test for keyboard accessibility
    - **Property 95: Interactive elements keyboard accessible**
    - **Validates: Requirements 17.1**
  
  - [ ]* 19.15 Write property test for ARIA labels
    - **Property 96: ARIA labels for unlabeled elements**
    - **Validates: Requirements 17.2**
  
  - [ ]* 19.16 Write property test for TypeScript type safety
    - **Property 92: TypeScript type safety for event handlers**
    - **Validates: Requirements 15.5**
    - **Property 93: shadcn/ui component prop types validated**
    - **Validates: Requirements 15.4**

- [ ] 20. Final validation and testing
  - [ ] 20.1 Run full TypeScript compilation
    - Execute: npm run build (includes tsc -b)
    - Verify no TypeScript errors
    - Verify no warnings
    - _Requirements: 15.1, 18.1, 18.2, 22.2_
  
  - [ ] 20.2 Run ESLint validation
    - Execute: npm run lint
    - Verify no ESLint errors
    - Fix any linting issues
    - _Requirements: 18.4_
  
  - [ ] 20.3 Test all pages in browser
    - Load Dashboard page and verify templates display correctly
    - Load MainEditor page and verify editor works correctly
    - Load Parser page and verify parser works correctly
    - Test all navigation links work
    - Verify no console errors on any page
    - _Requirements: 22.3, 14.9_
  
  - [ ] 20.4 Test all user interactions
    - Test template creation, editing, and deletion
    - Test element addition, movement, and resizing on canvas
    - Test all property panel controls
    - Test undo/redo functionality
    - Test zoom and grid controls
    - Test signature editor
    - Test document exports (PDF, DOCX, HTML)
    - _Requirements: 14.1-14.10_
  
  - [ ] 20.5 Test dark mode
    - Toggle system dark mode preference
    - Verify all components render correctly in dark mode
    - Verify colors and contrast are appropriate
    - _Requirements: 2.2, 16.6_
  
  - [ ] 20.6 Verify build output
    - Run: npm run build
    - Verify dist directory contains index.html and assets
    - Verify build completes without warnings
    - Test production build in browser
    - _Requirements: 18.2, 18.6_
  
  - [ ] 20.7 Verify dependency installation
    - Delete node_modules and package-lock.json
    - Run: npm install
    - Verify installation completes without peer dependency errors
    - Verify dev server starts correctly
    - _Requirements: 19.3, 19.4_

- [ ] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster migration
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, configuration, and edge cases
- The migration is designed to be incremental - the application should remain functional after each task
- Always test in the browser after migrating each component type
- Keep the old design-system.css until all components are migrated to enable easy rollback
- Use getDiagnostics tool frequently to catch TypeScript errors early
