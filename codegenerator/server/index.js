const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const { parseSwagger } = require('./parsers/swaggerParser');
const { parsePostman } = require('./parsers/postmanParser');
const { parseHtmlDocs } = require('./parsers/htmlParser');
const { generateCode } = require('./generators/codeGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Code Generator is running' });
});

// Parse API documentation and generate code
app.post('/api/generate', upload.single('file'), async (req, res) => {
  try {
    const { language, inputType, rawContent } = req.body;
    
    if (!language || !inputType) {
      return res.status(400).json({ 
        error: 'Language and input type are required' 
      });
    }

    let parsedData = null;
    let fileName = '';

    // Parse based on input type
    switch (inputType) {
      case 'swagger':
        if (req.file) {
          const content = req.file.buffer.toString();
          if (!content || content.trim() === '') {
            return res.status(400).json({ 
              error: 'Uploaded file is empty. Please provide a valid Swagger/OpenAPI file.' 
            });
          }
          parsedData = await parseSwagger(content);
          fileName = req.file.originalname;
        } else if (rawContent) {
          parsedData = await parseSwagger(rawContent);
          fileName = 'swagger.json';
        }
        break;

      case 'postman':
        if (req.file) {
          const content = req.file.buffer.toString();
          if (!content || content.trim() === '') {
            return res.status(400).json({ 
              error: 'Uploaded file is empty. Please provide a valid Postman collection file.' 
            });
          }
          parsedData = await parsePostman(content);
          fileName = req.file.originalname;
        } else if (rawContent) {
          parsedData = await parsePostman(rawContent);
          fileName = 'postman_collection.json';
        }
        break;

      case 'html':
        if (req.file) {
          const content = req.file.buffer.toString();
          if (!content || content.trim() === '') {
            return res.status(400).json({ 
              error: 'Uploaded file is empty. Please provide a valid HTML documentation file.' 
            });
          }
          parsedData = await parseHtmlDocs(content);
          fileName = req.file.originalname;
        } else if (rawContent) {
          parsedData = await parseHtmlDocs(rawContent);
          fileName = 'api_docs.html';
        }
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid input type. Supported: swagger, postman, html' 
        });
    }

    if (!parsedData) {
      return res.status(400).json({ 
        error: 'Failed to parse the provided content' 
      });
    }

    // Generate code
    const generatedCode = await generateCode(parsedData, language, fileName);
    
    // Extract AI insights from generated code
    const aiInsights = generatedCode['ai-insights.json'] ? JSON.parse(generatedCode['ai-insights.json']) : null;
    
    res.json({
      success: true,
      data: {
        parsedEndpoints: parsedData.endpoints,
        generatedCode,
        aiInsights,
        summary: {
          totalEndpoints: parsedData.endpoints.length,
          baseUrl: parsedData.baseUrl,
          authMethod: parsedData.authMethod,
          language: language
        }
      }
    });

  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ 
      error: 'Failed to generate code', 
      details: error.message 
    });
  }
});

// Download generated code as ZIP
app.post('/api/download', async (req, res) => {
  try {
    const { generatedCode, fileName } = req.body;
    
    if (!generatedCode) {
      return res.status(400).json({ error: 'No code to download' });
    }

    const JSZip = require('jszip');
    const zip = new JSZip();

    // Add files to zip
    Object.keys(generatedCode).forEach(filePath => {
      zip.file(filePath, generatedCode[filePath]);
    });

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'api-integration-code.zip'}"`);
    res.send(zipBuffer);

  } catch (error) {
    console.error('Error creating download:', error);
    res.status(500).json({ 
      error: 'Failed to create download', 
      details: error.message 
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 API Code Generator server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
}); 