# Changelog

All notable changes to the Jobpare CV Generator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-09-20

### Added

- **Live Preview Functionality**: Real-time CV preview in the preview container that updates automatically as users type
- **Full-Screen Preview Modal**: New "Open Full Preview" button that opens CV in a full-screen modal dialog
- **Multiple Download Options**:
  - PDF download via browser's print-to-PDF functionality
  - HTML download as standalone file
  - DOC download for Microsoft Word compatibility
- **Enhanced Preview UI**:
  - Live preview with iframe isolation to prevent style conflicts
  - Professional preview header with clear labeling
  - Smart data detection that only shows preview when meaningful CV data is present
- **Responsive Download Interface**: Color-coded download buttons in modal (PDF=red, HTML=blue, DOC=dark blue)
- **Keyboard Shortcuts**: ESC key closes the full-screen preview modal
- **Click Outside to Close**: Modal closes when clicking outside the content area

### Changed

- **Preview System Overhaul**:
  - Replaced static placeholder with dynamic live preview
  - Changed from inline preview to modal-based full-screen viewing
  - Updated preview panel header from "Live Preview" to "Preview"
- **Button State Management**:
  - Preview button now shows different states: Loading, Add Data to Preview, Open Full Preview, Preview Error
  - Button is disabled when no CV data is available
  - Real-time button text updates based on data availability
- **Enhanced User Experience**:
  - Better visual feedback throughout the editing process
  - Improved error handling and user messaging
  - More intuitive workflow with guided user actions

### Fixed

- **Double Scroll Bar Issue**: Removed duplicate scroll bars in CV preview modal by changing modal body overflow from `auto` to `hidden`
- **Preview Container Styling**: Improved responsive design for better mobile experience
- **Modal Layout**: Enhanced modal header and actions layout for better organization

### Improved

- **Code Organization**:
  - Cleaned up unused CSS classes and functions
  - Better separation of concerns between live preview and modal functionality
  - Streamlined event listener management
- **Performance**:
  - Optimized preview generation with better template compilation
  - Reduced DOM manipulation for smoother user experience
- **Accessibility**:
  - Added proper ARIA labels and tooltips
  - Improved keyboard navigation support
  - Better color contrast for download buttons

### Technical Details

- **New CSS Classes**:
  - `.live-preview-wrapper`, `.preview-header`, `.preview-label`, `.preview-hint`
  - `.preview-modal`, `.preview-modal-content`, `.preview-modal-header`, `.preview-modal-body`
  - `.btn-pdf`, `.btn-html`, `.btn-doc` for color-coded download buttons
- **New JavaScript Methods**:
  - `createPreviewModal()`: Creates and manages the full-screen preview modal
  - `openFullPreview()`: Opens CV in full-screen modal
  - `closeFullPreview()`: Closes the preview modal
  - `downloadAsPDF()`: Generates PDF using browser print functionality
  - `downloadAsDoc()`: Creates Word-compatible document
- **Enhanced Methods**:
  - `generatePreview()`: Now handles both live preview and modal preparation
  - `init()`: Added preview button state initialization
  - `setupEventListeners()`: Added keyboard shortcuts and modal event handling

### Dependencies

- **FileSaver.js**: Already included for file download functionality
- **Handlebars.js**: Already included for template compilation

---

## Previous Versions

### [Initial Release]

- Basic CV form editor with role-based templates
- JSON editor with validation
- Simple preview functionality
- Download JSON capability
- Role selection for different developer types
- Local storage for data persistence
