import React, { useState } from 'react';
import { Upload, Code, Download, FileText, Globe, Zap, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import FileUpload from './components/FileUpload';
import LanguageSelector from './components/LanguageSelector';
import CodePreview from './components/CodePreview';
import EndpointList from './components/EndpointList';
import AIInsights from './components/AIInsights';
import './App.css';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('node.js');
  const [inputType, setInputType] = useState('swagger');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [rawContent, setRawContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [parsedEndpoints, setParsedEndpoints] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const languages = [
    { id: 'node.js', name: 'Node.js', icon: '⚡' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'php', name: 'PHP', icon: '🐘' },
    { id: 'go', name: 'Go', icon: '🐹' }
  ];

  const inputTypes = [
    { id: 'swagger', name: 'Swagger/OpenAPI', icon: <FileText className="w-5 h-5" /> },
    { id: 'postman', name: 'Postman Collection', icon: <Globe className="w-5 h-5" /> },
    { id: 'html', name: 'HTML Documentation', icon: <Code className="w-5 h-5" /> }
  ];

  const handleGenerate = async () => {
    if (!uploadedFile && !rawContent.trim()) {
      setError('Please provide either a file or raw content');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('language', selectedLanguage);
      formData.append('inputType', inputType);
      
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        formData.append('rawContent', rawContent);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate code');
      }

      setGeneratedCode(result.data.generatedCode);
      setParsedEndpoints(result.data.parsedEndpoints);
      setAiInsights(result.data.aiInsights);
      setActiveTab('preview');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedCode) return;

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generatedCode,
          fileName: `api-integration-${selectedLanguage}.zip`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-integration-${selectedLanguage}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">API Code Generator</h1>
                <p className="text-sm text-slate-600">Generate production-ready integration code with AI-powered insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload & Configure
            </button>
            {generatedCode && (
              <>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'preview'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-2" />
                  Generated Code
                </button>
                <button
                  onClick={() => setActiveTab('endpoints')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'endpoints'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-2" />
                  API Endpoints
                </button>
                <button
                  onClick={() => setActiveTab('ai-insights')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ai-insights'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Brain className="w-4 h-4 inline mr-2" />
                  AI Insights
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Upload & Configuration */}
            <div className="space-y-6">
              {/* Input Type Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Input Type</h2>
                <div className="grid grid-cols-1 gap-3">
                  {inputTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        inputType === type.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="inputType"
                        value={type.id}
                        checked={inputType === type.id}
                        onChange={(e) => setInputType(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded ${
                          inputType === type.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {type.icon}
                        </div>
                        <span className="font-medium text-slate-900">{type.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <LanguageSelector
                languages={languages}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />

              {/* File Upload */}
              <FileUpload
                uploadedFile={uploadedFile}
                onFileUpload={setUploadedFile}
                rawContent={rawContent}
                onRawContentChange={setRawContent}
                inputType={inputType}
              />
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Generate Button */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Code</h2>
                <div className="space-y-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!uploadedFile && !rawContent.trim())}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Generate Integration Code
                      </div>
                    )}
                  </button>
                  
                  {generatedCode && (
                    <button
                      onClick={handleDownload}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      <Download className="w-5 h-5 inline mr-2" />
                      Download ZIP
                    </button>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Features</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">Production-ready code</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">Comprehensive error handling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">Authentication support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">Auto-generated tests</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">Clean, modular architecture</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <span className="text-slate-700">AI-powered code suggestions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <span className="text-slate-700">Intelligent error detection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-blue-500" />
                    <span className="text-slate-700">Performance optimization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && generatedCode && (
          <CodePreview generatedCode={generatedCode} language={selectedLanguage} />
        )}

        {activeTab === 'endpoints' && parsedEndpoints.length > 0 && (
          <EndpointList endpoints={parsedEndpoints} />
        )}

        {activeTab === 'ai-insights' && aiInsights && (
          <AIInsights aiInsights={aiInsights} language={selectedLanguage} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 API Code Generator. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 