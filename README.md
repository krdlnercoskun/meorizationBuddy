# Memorization Buddy

A comprehensive web application designed to help users memorize any text through intelligent speech recognition and detailed feedback analysis. Built with React, TypeScript, and modern web APIs.

## Features

### Core Functionality
- **Multi-input Text Entry**: Add text via typing, file upload (.txt), or OCR scanning with webcam
- **Advanced Speech Recognition**: Real-time speech-to-text using Web Speech API with intelligent fallbacks
- **Sophisticated Text Comparison**: Dynamic programming algorithm with Levenshtein distance for precise alignment
- **Visual Error Highlighting**: Color-coded feedback system (green=correct, amber=near-miss, red=error)
- **Multi-language Support**: Full support for Latin, Turkish, and Arabic scripts with RTL layout
- **Privacy-First Design**: All data stored locally with optional cloud sync

### Practice Features
- **Distraction-Free Interface**: Clean, minimal design optimized for memorization sessions
- **Real-time Feedback**: Live transcription display during recording
- **Flexible Practice Modes**: Hide/show reference text, timer, audio level monitoring
- **Detailed Results Analysis**: Comprehensive error breakdown with severity levels
- **Export Capabilities**: Generate PDF reports and highlighted text images

### Accessibility & Localization
- **Screen Reader Support**: Full ARIA compliance and keyboard navigation
- **High Contrast Mode**: Enhanced visibility options
- **Adjustable Font Sizes**: From small to extra-large text
- **RTL Layout Support**: Native right-to-left text handling for Arabic
- **Cultural Sensitivity**: Respectful handling of religious texts (e.g., Quran)

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety and modern hooks
- **Tailwind CSS** for responsive design and consistent styling
- **React Router** for client-side navigation
- **Lucide React** for consistent iconography

### Core Services
- **TextComparisonEngine**: Advanced text alignment using Wagner-Fischer algorithm
- **SpeechRecognitionService**: Web Speech API wrapper with error handling
- **OCRService**: Tesseract.js integration for image-to-text conversion
- **StorageService**: IndexedDB for offline-first data persistence
- **ExportService**: PDF and image generation for reports

### Data Management
- **IndexedDB**: Local storage for texts, practice sessions, and user settings
- **Privacy-First**: No data sent to external servers unless explicitly enabled
- **Import/Export**: Full data portability for backup and migration

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Usage Guide

### Adding Text
1. **Type**: Directly input text in the editor
2. **Upload**: Support for .txt files with automatic language detection
3. **Scan**: Use device camera with OCR to extract text from images

### Practice Session
1. Select text from home page and click "Practice"
2. Optionally hide reference text for memory testing
3. Click microphone button to start recording
4. Speak clearly at natural pace
5. Click "Complete & Review" to see detailed results

### Results Analysis
- **Overall Score**: Circular accuracy indicator with color coding
- **Word-by-Word Analysis**: Highlighted text showing errors and corrections
- **Error Breakdown**: Detailed list of mistakes with severity levels
- **Export Options**: PDF reports and highlighted text images

## Testing

The application includes comprehensive unit tests covering:
- **Text Comparison Algorithm**: Edge cases, different languages, normalization
- **Component Rendering**: UI components with various props and states
- **User Interactions**: Click handlers, keyboard navigation, form inputs

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test textComparison.test.ts
```

## Browser Compatibility

### Fully Supported
- **Chrome 25+**: Complete feature set including speech recognition
- **Edge 79+**: Full functionality with Chromium engine
- **Safari 14+**: Most features, limited speech recognition

### Limitations
- **Firefox**: OCR and file upload only (no speech recognition)
- **Mobile**: Optimized responsive design, may have platform-specific limitations

## Deployment

The application is designed for static hosting and can be deployed to:
- **Netlify/Vercel**: Zero-config deployment from Git repository
- **GitHub Pages**: Static site hosting with build actions
- **Self-hosted**: Any web server capable of serving static files

Build output is optimized and includes:
- Code splitting for faster loading
- Asset optimization and minification  
- Progressive Web App capabilities

## Architecture Decisions & Trade-offs

### Text Comparison Algorithm
**Choice**: Dynamic Programming with Levenshtein distance
**Trade-off**: Higher computational complexity for superior accuracy in word alignment
**Alternative**: Simple string matching (faster but less accurate)

### Local Storage Strategy  
**Choice**: IndexedDB for client-side persistence
**Trade-off**: More complex implementation for better offline capabilities
**Alternative**: Cloud-first storage (simpler but requires internet connectivity)

### Speech Recognition Approach
**Choice**: Web Speech API with graceful fallbacks
**Trade-off**: Browser dependency vs. consistent cross-platform experience
**Alternative**: Cloud-based APIs (more reliable but privacy concerns)

### UI Framework Decision
**Choice**: React with TypeScript and Tailwind CSS
**Trade-off**: Learning curve vs. developer productivity and maintainability
**Alternative**: Vanilla JavaScript (lighter but harder to maintain)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript best practices and maintain test coverage
4. Ensure accessibility compliance and responsive design
5. Submit pull request with comprehensive description

## Privacy & Security

- **No External API Calls**: All processing happens client-side by default
- **Local Data Storage**: User data never leaves the device unless explicitly enabled
- **No Analytics**: No tracking or data collection
- **Secure by Design**: Input validation and sanitization throughout

## License

MIT License - see LICENSE file for details.

## Support

For bug reports, feature requests, or general questions:
- Create an issue on GitHub repository
- Include browser version, operating system, and steps to reproduce
- For accessibility issues, please specify assistive technology used