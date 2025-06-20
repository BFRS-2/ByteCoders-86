import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';

const FileUpload = ({ uploadedFile, onFileUpload, rawContent, onRawContentChange, inputType }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/html': ['.html', '.htm'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const removeFile = () => {
    onFileUpload(null);
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.json')) return '📄';
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return '🌐';
    if (fileName.endsWith('.txt')) return '📝';
    return '📄';
  };

  const getPlaceholderText = () => {
    switch (inputType) {
      case 'swagger':
        return `// Paste your Swagger/OpenAPI JSON here
{
  "openapi": "3.0.0",
  "info": {
    "title": "Example API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "Get users",
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}`;
      case 'postman':
        return `// Paste your Postman Collection JSON here
{
  "info": {
    "name": "Example Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Users",
      "request": {
        "method": "GET",
        "url": {
          "raw": "https://api.example.com/users"
        }
      }
    }
  ]
}`;
      case 'html':
        return `<!-- Paste your HTML API documentation here -->
<html>
<head>
  <title>API Documentation</title>
</head>
<body>
  <h1>API Endpoints</h1>
  <h2>GET /users</h2>
  <p>Get all users</p>
  <h2>POST /users</h2>
  <p>Create a new user</p>
</body>
</html>`;
      default:
        return 'Paste your content here...';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Input Content</h2>
      
      {/* File Upload Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Upload File</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-slate-600 mb-1">
                Drag & drop a file here, or <span className="text-primary-600 font-medium">click to select</span>
              </p>
              <p className="text-xs text-slate-500">
                Supports: {inputType === 'swagger' ? '.json' : inputType === 'postman' ? '.json' : '.html, .htm, .txt'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="mb-6">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getFileIcon(uploadedFile.name)}</span>
              <div>
                <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
                <p className="text-xs text-green-600">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Raw Content Section */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Or Paste Raw Content</h3>
        <div className="relative">
          <textarea
            value={rawContent}
            onChange={(e) => onRawContentChange(e.target.value)}
            placeholder={getPlaceholderText()}
            className="w-full h-48 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors font-mono text-sm"
            disabled={!!uploadedFile}
          />
          {uploadedFile && (
            <div className="absolute inset-0 bg-slate-50 bg-opacity-75 flex items-center justify-center rounded-lg">
              <p className="text-slate-600 text-sm">
                File uploaded - clear file to edit raw content
              </p>
            </div>
          )}
        </div>
        {rawContent && !uploadedFile && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {rawContent.length} characters
            </p>
            <button
              onClick={() => onRawContentChange('')}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="space-y-1">
              {inputType === 'swagger' && (
                <>
                  <li>• Use valid OpenAPI 3.0 or Swagger 2.0 JSON</li>
                  <li>• Include all endpoints, parameters, and responses</li>
                </>
              )}
              {inputType === 'postman' && (
                <>
                  <li>• Export your Postman collection as JSON</li>
                  <li>• Include environment variables if needed</li>
                </>
              )}
              {inputType === 'html' && (
                <>
                  <li>• Include endpoint URLs and HTTP methods</li>
                  <li>• Add authentication information if available</li>
                </>
              )}
              <li>• You can upload a file or paste content directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 