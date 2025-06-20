# API Code Generator

A full-stack tool that generates production-ready integration code from various API documentation formats including Swagger/OpenAPI JSON, Postman Collection JSON, and unstructured HTML API documentation.

## Features

- **Multiple Input Formats**: Supports Swagger/OpenAPI, Postman Collections, and HTML documentation
- **Multiple Output Languages**: Generates code for Node.js, Java, PHP, and Go
- **Production-Ready Code**: Includes authentication, error handling, configuration, and tests
- **Modern UI**: Beautiful React frontend with drag-and-drop file upload
- **Code Preview**: Syntax-highlighted preview of generated code
- **ZIP Download**: Download generated code as a complete project structure

## Supported Languages

- **Node.js**: Express.js with axios, comprehensive error handling, and Jest tests
- **Java**: Spring Boot with RestTemplate, proper exception handling, and JUnit tests
- **PHP**: Guzzle HTTP client with PSR-7, error handling, and PHPUnit tests
- **Go**: Standard library with proper error handling and testing

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd codegenerator
```

2. Install dependencies:
```bash
npm run install-all
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload API Documentation**: Drag and drop a file or paste raw content
2. **Select Input Type**: Choose between Swagger/OpenAPI, Postman Collection, or HTML
3. **Choose Language**: Select your target programming language
4. **Generate Code**: Click "Generate Integration Code"
5. **Preview & Download**: Review the generated code and download as ZIP

## Project Structure

```
codegenerator/
├── server/                 # Backend API
│   ├── parsers/           # Input format parsers
│   ├── generators/        # Language-specific code generators
│   └── index.js          # Express server
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   └── App.js        # Main application
│   └── public/
├── uploads/               # Temporary file storage
└── package.json
```

## API Endpoints

- `POST /api/generate` - Generate code from API documentation
- `POST /api/download` - Download generated code as ZIP
- `GET /api/health` - Health check endpoint

## Generated Code Structure

Each generated project includes:

```
project-name/
├── src/                   # Main source code
│   ├── api/              # API client classes
│   ├── config/           # Configuration files
│   ├── utils/            # Helper utilities
│   └── index.js          # Main entry point
├── tests/                # Test files
├── docs/                 # Documentation
├── examples/             # Usage examples
├── package.json          # Dependencies
└── README.md            # Project documentation
```

## Features

### Input Parsing
- **Swagger/OpenAPI**: Full OpenAPI 3.0 specification support
- **Postman Collections**: V2.1 collection format support
- **HTML Documentation**: Extracts API endpoints from HTML pages

### Code Generation
- **Authentication**: Bearer tokens, API keys, Basic auth, OAuth2
- **Error Handling**: Comprehensive error handling and logging
- **Configuration**: Environment-based configuration
- **Testing**: Unit tests with standard frameworks
- **Documentation**: Auto-generated usage guides

### Frontend Features
- **Drag & Drop**: Easy file upload interface
- **Raw Content**: Paste JSON/HTML directly
- **Code Preview**: Syntax-highlighted code viewing
- **Endpoint List**: Parsed API endpoints display
- **Responsive Design**: Works on desktop and mobile

## Development

### Backend Development
```bash
npm run server
```

### Frontend Development
```bash
cd client && npm start
```

### Production Build
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub. 