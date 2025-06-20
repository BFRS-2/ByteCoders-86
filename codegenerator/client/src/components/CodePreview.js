import React, { useState } from 'react';
import { Copy, Check, Download, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodePreview = ({ generatedCode, language }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedFile, setCopiedFile] = useState(null);

  const fileList = Object.keys(generatedCode).sort();

  const getLanguageFromFile = (fileName) => {
    if (fileName.endsWith('.js')) return 'javascript';
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.php')) return 'php';
    if (fileName.endsWith('.go')) return 'go';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.xml')) return 'xml';
    if (fileName.endsWith('.md')) return 'markdown';
    if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return 'yaml';
    if (fileName.endsWith('.properties')) return 'properties';
    if (fileName.endsWith('.env')) return 'bash';
    return 'text';
  };

  const getFileIcon = (fileName) => {
    if (fileName.includes('src/')) return '📁';
    if (fileName.includes('tests/')) return '🧪';
    if (fileName.includes('docs/')) return '📚';
    if (fileName.includes('examples/')) return '💡';
    if (fileName.endsWith('.json')) return '📄';
    if (fileName.endsWith('.md')) return '📝';
    if (fileName.endsWith('.env')) return '⚙️';
    return '📄';
  };

  const copyToClipboard = async (fileName) => {
    try {
      await navigator.clipboard.writeText(generatedCode[fileName]);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getFileCategory = (fileName) => {
    if (fileName.startsWith('src/')) return 'Source Code';
    if (fileName.startsWith('tests/')) return 'Tests';
    if (fileName.startsWith('docs/')) return 'Documentation';
    if (fileName.startsWith('examples/')) return 'Examples';
    if (fileName.includes('package.json') || fileName.includes('composer.json') || fileName.includes('pom.xml') || fileName.includes('go.mod')) return 'Dependencies';
    if (fileName.includes('.env')) return 'Configuration';
    return 'Other';
  };

  const groupedFiles = fileList.reduce((acc, fileName) => {
    const category = getFileCategory(fileName);
    if (!acc[category]) acc[category] = [];
    acc[category].push(fileName);
    return acc;
  }, {});

  // Set default selected file if none selected
  if (!selectedFile && fileList.length > 0) {
    setSelectedFile(fileList[0]);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex h-96">
        {/* File Tree */}
        <div className="w-80 border-r border-slate-200 bg-slate-50 overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Generated Files</h3>
            <p className="text-xs text-slate-600 mt-1">{fileList.length} files</p>
          </div>
          
          <div className="p-2">
            {Object.entries(groupedFiles).map(([category, files]) => (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {files.map((fileName) => (
                    <button
                      key={fileName}
                      onClick={() => setSelectedFile(fileName)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                        selectedFile === fileName
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getFileIcon(fileName)}</span>
                        <span className="truncate">{fileName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Preview */}
        <div className="flex-1 flex flex-col">
          {selectedFile && (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(selectedFile)}</span>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">{selectedFile}</h3>
                    <p className="text-xs text-slate-600">
                      {getLanguageFromFile(selectedFile).toUpperCase()} • {generatedCode[selectedFile].length} characters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedFile)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                >
                  {copiedFile === selectedFile ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto">
                <SyntaxHighlighter
                  language={getLanguageFromFile(selectedFile)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    height: '100%',
                    backgroundColor: '#1e1e1e'
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {generatedCode[selectedFile]}
                </SyntaxHighlighter>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Generated for <span className="font-medium">{language.toUpperCase()}</span>
          </div>
          <div className="text-xs text-slate-500">
            Click any file to preview • Use copy button to copy code
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview; 