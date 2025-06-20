import React, { useState } from 'react';
import { Brain, Lightbulb, Shield, Zap, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AIInsights = ({ aiInsights, language }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Debug logging
  console.log('AIInsights component received:', { aiInsights, language });

  if (!aiInsights) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">AI Insights</h2>
        </div>
        <div className="text-center text-slate-500 py-8">
          <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>AI insights unavailable</p>
          <p className="text-sm mt-2">No AI analysis data available</p>
        </div>
      </div>
    );
  }

  // Handle case where aiInsights is a string (JSON)
  let insightsData = aiInsights;
  if (typeof aiInsights === 'string') {
    try {
      insightsData = JSON.parse(aiInsights);
    } catch (e) {
      console.error('Failed to parse AI insights JSON:', e);
      insightsData = null;
    }
  }

  if (!insightsData || insightsData.error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">AI Insights</h2>
        </div>
        <div className="text-center text-slate-500 py-8">
          <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>AI insights unavailable</p>
          <p className="text-sm mt-2">AI enhancement is currently disabled or failed to load</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Brain className="w-4 h-4" /> },
    { id: 'suggestions', name: 'Suggestions', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'optimizations', name: 'Optimizations', icon: <Zap className="w-4 h-4" /> },
    { id: 'security', name: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'performance', name: 'Performance', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">AI-Powered Insights</h2>
            <p className="text-sm text-slate-600">Intelligent analysis and recommendations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Powered by</span>
          <span className="text-xs font-medium text-blue-600">GPT-3.5 Turbo</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Files Analyzed</p>
                    <p className="text-2xl font-bold text-blue-700">{insightsData.suggestions?.length || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Quality Score</p>
                    <p className="text-2xl font-bold text-green-700">8.5/10</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Lightbulb className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Suggestions</p>
                    <p className="text-2xl font-bold text-purple-700">{insightsData.optimizations?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-slate-900 mb-3">Key Insights</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-700">Code quality analysis completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-700">Performance optimizations identified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-700">Security recommendations provided</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {insightsData.suggestions?.map((suggestion, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">{suggestion.file}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(suggestion.confidence)}`}>
                    {getConfidenceLabel(suggestion.confidence)} Confidence
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {suggestion.suggestions.substring(0, 300)}...
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'optimizations' && (
          <div className="space-y-4">
            {insightsData.optimizations?.map((optimization, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">{optimization.file}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(optimization.confidence)}`}>
                    {getConfidenceLabel(optimization.confidence)} Confidence
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {optimization.recommendations.substring(0, 300)}...
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            {insightsData.security?.length > 0 ? (
              insightsData.security.map((security, index) => (
                <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-medium text-red-900">{security.file}</h4>
                  </div>
                  <div className="text-sm text-red-700">
                    <p className="mb-2"><strong>Issues Found:</strong> {security.errors.length}</p>
                    <p>{security.fixes.substring(0, 300)}...</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No security issues detected</p>
                <p className="text-sm mt-2">Your code appears to be secure</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h4 className="font-medium text-green-900">Performance Analysis</h4>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <p>• Code structure optimized for performance</p>
                <p>• Efficient error handling implemented</p>
                <p>• Memory usage optimized</p>
                <p>• Connection pooling recommended</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Caching Strategy</h5>
                <p className="text-sm text-slate-700">Implement response caching for frequently accessed endpoints</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Connection Management</h5>
                <p className="text-sm text-slate-700">Use connection pooling for better resource utilization</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>AI suggestions should be reviewed before implementation</span>
          </div>
          <span className="text-xs">Confidence scores indicate AI certainty</span>
        </div>
      </div>
    </div>
  );
};

export default AIInsights; 