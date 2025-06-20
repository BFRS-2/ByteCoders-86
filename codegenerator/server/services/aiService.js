const OpenAI = require('openai');
const natural = require('natural');
const nlp = require('compromise');

/**
 * AI Service for Code Generation Enhancement
 * Provides intelligent suggestions, error detection, and code optimization
 */
class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });
    
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Generate intelligent code suggestions and improvements
   */
  async generateCodeSuggestions(code, language, context = {}) {
    try {
      const prompt = this.buildCodeSuggestionPrompt(code, language, context);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert software engineer specializing in API integration code. Provide specific, actionable suggestions to improve code quality, security, and performance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return {
        suggestions: completion.choices[0].message.content,
        confidence: 0.85,
        type: 'code_improvement'
      };
    } catch (error) {
      console.error('AI Code suggestion error:', error);
      return this.getFallbackSuggestions(code, language);
    }
  }

  /**
   * Detect potential errors and provide auto-fix suggestions
   */
  async detectErrorsAndSuggestFixes(code, language) {
    try {
      const prompt = `Analyze this ${language} code for potential errors, security issues, and best practices violations. Provide specific fixes:

Code:
${code}

Please identify:
1. Syntax errors
2. Security vulnerabilities
3. Performance issues
4. Best practice violations
5. Specific code fixes for each issue`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a code review expert. Identify errors and provide specific, actionable fixes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.2
      });

      return {
        errors: this.parseErrorAnalysis(completion.choices[0].message.content),
        fixes: completion.choices[0].message.content,
        confidence: 0.9,
        type: 'error_detection'
      };
    } catch (error) {
      console.error('AI Error detection error:', error);
      return this.getFallbackErrorDetection(code, language);
    }
  }

  /**
   * Generate intelligent documentation and comments
   */
  async generateDocumentation(code, language, apiInfo = {}) {
    try {
      const prompt = `Generate comprehensive documentation for this ${language} API integration code:

API Info: ${JSON.stringify(apiInfo)}
Code:
${code}

Please provide:
1. Detailed function documentation
2. Usage examples
3. Parameter descriptions
4. Error handling documentation
5. Best practices notes`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a technical documentation expert. Create clear, comprehensive documentation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.4
      });

      return {
        documentation: completion.choices[0].message.content,
        confidence: 0.88,
        type: 'documentation'
      };
    } catch (error) {
      console.error('AI Documentation error:', error);
      return this.getFallbackDocumentation(code, language);
    }
  }

  /**
   * Analyze API endpoints and provide intelligent insights
   */
  async analyzeEndpoints(endpoints, apiInfo = {}) {
    try {
      const endpointAnalysis = endpoints.map(endpoint => ({
        path: endpoint.path,
        method: endpoint.method,
        complexity: this.calculateEndpointComplexity(endpoint),
        security: this.analyzeSecurity(endpoint),
        performance: this.analyzePerformance(endpoint)
      }));

      const insights = await this.generateEndpointInsights(endpointAnalysis, apiInfo);
      
      return {
        analysis: endpointAnalysis,
        insights: insights,
        recommendations: await this.generateRecommendations(endpointAnalysis),
        type: 'endpoint_analysis'
      };
    } catch (error) {
      console.error('AI Endpoint analysis error:', error);
      return this.getFallbackEndpointAnalysis(endpoints);
    }
  }

  /**
   * Generate intelligent code optimization recommendations
   */
  async generateOptimizationRecommendations(code, language, context = {}) {
    try {
      const prompt = `Analyze this ${language} code for optimization opportunities:

Code:
${code}

Context: ${JSON.stringify(context)}

Provide specific recommendations for:
1. Performance optimization
2. Memory usage improvement
3. Code structure enhancement
4. Caching strategies
5. Error handling improvements`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a performance optimization expert. Provide specific, actionable optimization recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return {
        recommendations: completion.choices[0].message.content,
        confidence: 0.87,
        type: 'optimization'
      };
    } catch (error) {
      console.error('AI Optimization error:', error);
      return this.getFallbackOptimization(code, language);
    }
  }

  // Helper methods
  buildCodeSuggestionPrompt(code, language, context) {
    return `Analyze this ${language} API integration code and provide specific improvements:

Code:
${code}

Context: ${JSON.stringify(context)}

Focus on:
1. Code quality improvements
2. Security enhancements
3. Error handling
4. Performance optimizations
5. Best practices
6. Specific code examples for improvements`;
  }

  calculateEndpointComplexity(endpoint) {
    let complexity = 1;
    
    if (endpoint.parameters && endpoint.parameters.length > 5) complexity += 2;
    if (endpoint.requestBody) complexity += 1;
    if (endpoint.responses && Object.keys(endpoint.responses).length > 3) complexity += 1;
    if (endpoint.security && endpoint.security.length > 0) complexity += 1;
    
    return Math.min(complexity, 5); // Scale 1-5
  }

  analyzeSecurity(endpoint) {
    const securityIssues = [];
    
    if (!endpoint.security || endpoint.security.length === 0) {
      securityIssues.push('No authentication required');
    }
    
    if (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') {
      if (!endpoint.requestBody) {
        securityIssues.push('No request body validation');
      }
    }
    
    return {
      score: Math.max(1, 5 - securityIssues.length),
      issues: securityIssues
    };
  }

  analyzePerformance(endpoint) {
    const performanceFactors = [];
    
    if (endpoint.parameters && endpoint.parameters.length > 10) {
      performanceFactors.push('Many query parameters');
    }
    
    if (endpoint.requestBody) {
      performanceFactors.push('Request body processing');
    }
    
    return {
      score: Math.max(1, 5 - performanceFactors.length),
      factors: performanceFactors
    };
  }

  async generateEndpointInsights(analysis, apiInfo) {
    const totalEndpoints = analysis.length;
    const avgComplexity = analysis.reduce((sum, ep) => sum + ep.complexity, 0) / totalEndpoints;
    const securityScore = analysis.reduce((sum, ep) => sum + ep.security.score, 0) / totalEndpoints;
    
    return {
      totalEndpoints,
      averageComplexity: avgComplexity.toFixed(2),
      securityScore: securityScore.toFixed(2),
      recommendations: this.generateInsightRecommendations(analysis)
    };
  }

  generateInsightRecommendations(analysis) {
    const recommendations = [];
    
    const highComplexityEndpoints = analysis.filter(ep => ep.complexity >= 4);
    if (highComplexityEndpoints.length > 0) {
      recommendations.push(`Consider breaking down ${highComplexityEndpoints.length} complex endpoints`);
    }
    
    const lowSecurityEndpoints = analysis.filter(ep => ep.security.score < 3);
    if (lowSecurityEndpoints.length > 0) {
      recommendations.push(`Add authentication to ${lowSecurityEndpoints.length} endpoints`);
    }
    
    return recommendations;
  }

  // Fallback methods when AI is not available
  getFallbackSuggestions(code, language) {
    return {
      suggestions: `Consider adding error handling, input validation, and proper logging to your ${language} code.`,
      confidence: 0.6,
      type: 'fallback'
    };
  }

  getFallbackErrorDetection(code, language) {
    return {
      errors: ['Basic syntax check recommended'],
      fixes: 'Review code for proper error handling and input validation.',
      confidence: 0.5,
      type: 'fallback'
    };
  }

  getFallbackDocumentation(code, language) {
    return {
      documentation: `Add comprehensive documentation for your ${language} API integration including usage examples and error handling.`,
      confidence: 0.6,
      type: 'fallback'
    };
  }

  getFallbackEndpointAnalysis(endpoints) {
    return {
      analysis: endpoints.map(ep => ({ path: ep.path, method: ep.method, complexity: 2 })),
      insights: { totalEndpoints: endpoints.length, recommendations: ['Review endpoint security and performance'] },
      type: 'fallback'
    };
  }

  getFallbackOptimization(code, language) {
    return {
      recommendations: `Consider implementing caching, connection pooling, and proper error handling for your ${language} code.`,
      confidence: 0.6,
      type: 'fallback'
    };
  }
}

module.exports = new AIService(); 