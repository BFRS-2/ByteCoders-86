import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Globe, Shield, Code } from 'lucide-react';

const EndpointList = ({ endpoints }) => {
  const [expandedEndpoints, setExpandedEndpoints] = useState(new Set());

  const toggleEndpoint = (index) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEndpoints(newExpanded);
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-green-100 text-green-800 border-green-200',
      POST: 'bg-blue-100 text-blue-800 border-blue-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PATCH: 'bg-orange-100 text-orange-800 border-orange-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      OPTIONS: 'bg-purple-100 text-purple-800 border-purple-200',
      HEAD: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[method.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getAuthIcon = (authMethod) => {
    if (!authMethod) return null;
    
    const authTypes = {
      'bearer': <Shield className="w-4 h-4 text-blue-500" />,
      'api_key': <Code className="w-4 h-4 text-green-500" />,
      'basic': <Shield className="w-4 h-4 text-purple-500" />,
      'oauth2': <Shield className="w-4 h-4 text-orange-500" />
    };
    
    return authTypes[authMethod.toLowerCase()] || <Shield className="w-4 h-4 text-gray-500" />;
  };

  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="text-center text-slate-500">
          <Globe className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No endpoints found in the parsed documentation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">API Endpoints</h2>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Globe className="w-4 h-4" />
            <span>{endpoints.length} endpoints found</span>
          </div>
        </div>

        <div className="space-y-3">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Endpoint Header */}
              <div 
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                onClick={() => toggleEndpoint(index)}
              >
                <div className="flex items-center space-x-3">
                  {expandedEndpoints.has(index) ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  
                  <span className="font-mono text-sm text-slate-900">{endpoint.path}</span>
                  
                  {endpoint.authMethod && (
                    <div className="flex items-center space-x-1">
                      {getAuthIcon(endpoint.authMethod)}
                      <span className="text-xs text-slate-600">{endpoint.authMethod}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  {endpoint.description && (
                    <span className="truncate max-w-xs">{endpoint.description}</span>
                  )}
                </div>
              </div>

              {/* Endpoint Details */}
              {expandedEndpoints.has(index) && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parameters */}
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-3">Parameters</h4>
                        <div className="space-y-2">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <div>
                                <span className="text-sm font-medium text-slate-900">{param.name}</span>
                                {param.required && (
                                  <span className="ml-2 px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded">Required</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-600">
                                <span className="font-mono">{param.type}</span>
                                {param.description && (
                                  <span className="ml-2">- {param.description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Headers */}
                    {endpoint.headers && endpoint.headers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-3">Headers</h4>
                        <div className="space-y-2">
                          {endpoint.headers.map((header, headerIndex) => (
                            <div key={headerIndex} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <span className="text-sm font-medium text-slate-900">{header.name}</span>
                              <div className="text-xs text-slate-600">
                                <span className="font-mono">{header.value}</span>
                                {header.description && (
                                  <span className="ml-2">- {header.description}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {endpoint.requestBody && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-slate-900 mb-3">Request Body</h4>
                        <div className="p-3 bg-slate-50 rounded border">
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                            {JSON.stringify(endpoint.requestBody, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    {endpoint.response && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-slate-900 mb-3">Response</h4>
                        <div className="p-3 bg-slate-50 rounded border">
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                            {JSON.stringify(endpoint.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EndpointList; 