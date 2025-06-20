const cheerio = require('cheerio');

/**
 * Parse HTML API documentation
 * @param {string} content - HTML content
 * @returns {Object} Parsed API data
 */
async function parseHtmlDocs(content) {
  try {
    const $ = cheerio.load(content);
    
    const baseUrl = extractBaseUrl($);
    const authMethod = extractAuthMethod($);
    const endpoints = extractEndpoints($);
    
    return {
      baseUrl,
      authMethod,
      endpoints,
      title: extractTitle($) || 'HTML API Documentation',
      version: '1.0.0',
      description: extractDescription($) || ''
    };
  } catch (error) {
    throw new Error(`Failed to parse HTML documentation: ${error.message}`);
  }
}

/**
 * Extract base URL from HTML content
 */
function extractBaseUrl($) {
  // Look for common patterns in HTML docs
  const patterns = [
    'base url',
    'base url:',
    'api base',
    'endpoint base',
    'server url',
    'host url'
  ];
  
  for (const pattern of patterns) {
    const element = $(`*:contains("${pattern}")`).first();
    if (element.length) {
      const text = element.text();
      const match = text.match(/(https?:\/\/[^\s]+)/i);
      if (match) {
        return match[1];
      }
    }
  }
  
  // Look for URLs in code blocks
  const codeBlocks = $('code, pre');
  for (let i = 0; i < codeBlocks.length; i++) {
    const text = $(codeBlocks[i]).text();
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      const url = new URL(urlMatch[1]);
      return `${url.protocol}//${url.host}`;
    }
  }
  
  return '';
}

/**
 * Extract authentication method from HTML content
 */
function extractAuthMethod($) {
  const authText = $('*').text().toLowerCase();
  
  if (authText.includes('bearer token') || authText.includes('bearer')) {
    return {
      type: 'bearer',
      name: 'Authorization',
      description: 'Bearer token authentication'
    };
  }
  
  if (authText.includes('api key') || authText.includes('apikey')) {
    return {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      description: 'API Key authentication'
    };
  }
  
  if (authText.includes('basic auth') || authText.includes('basic authentication')) {
    return {
      type: 'basic',
      name: 'Authorization',
      description: 'Basic authentication'
    };
  }
  
  if (authText.includes('oauth') || authText.includes('oauth2')) {
    return {
      type: 'oauth2',
      name: 'Authorization',
      description: 'OAuth 2.0 authentication'
    };
  }
  
  return { type: 'none' };
}

/**
 * Extract endpoints from HTML content
 */
function extractEndpoints($) {
  const endpoints = [];
  
  // Look for common endpoint patterns
  const endpointSelectors = [
    'h1, h2, h3, h4, h5, h6', // Headers
    'code', // Code blocks
    'pre', // Preformatted text
    '.endpoint, .api-endpoint, .route', // Common CSS classes
    '[class*="endpoint"], [class*="api"], [class*="route"]' // Partial class matches
  ];
  
  for (const selector of endpointSelectors) {
    const elements = $(selector);
    
    for (let i = 0; i < elements.length; i++) {
      const element = $(elements[i]);
      const text = element.text().trim();
      
      const endpoint = parseEndpointFromText(text, element);
      if (endpoint) {
        endpoints.push(endpoint);
      }
    }
  }
  
  // Remove duplicates based on method and path
  const uniqueEndpoints = [];
  const seen = new Set();
  
  for (const endpoint of endpoints) {
    const key = `${endpoint.method}:${endpoint.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEndpoints.push(endpoint);
    }
  }
  
  return uniqueEndpoints;
}

/**
 * Parse endpoint from text content
 */
function parseEndpointFromText(text, element) {
  // Common HTTP method patterns
  const methodPatterns = [
    /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s]+)/i,
    /([^\s]+)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i,
    /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*:\s*([^\s]+)/i
  ];
  
  for (const pattern of methodPatterns) {
    const match = text.match(pattern);
    if (match) {
      const method = match[1].toUpperCase();
      let path = match[2];
      
      // Clean up the path
      path = path.replace(/[^\w\/\-{}]/g, '');
      if (!path.startsWith('/')) {
        path = `/${path}`;
      }
      
      // Extract description from surrounding context
      const description = extractDescriptionFromContext(element);
      
      return {
        method,
        path,
        fullUrl: path,
        summary: description || `${method} ${path}`,
        description: description || '',
        operationId: generateOperationId(method, path),
        parameters: extractParametersFromText(text),
        requestBody: null,
        responses: {},
        security: [],
        tags: []
      };
    }
  }
  
  // Look for URL patterns without explicit methods
  const urlPattern = /(https?:\/\/[^\s]+)/i;
  const urlMatch = text.match(urlPattern);
  
  if (urlMatch) {
    try {
      const url = new URL(urlMatch[1]);
      const path = url.pathname;
      
      // Try to infer method from context
      const method = inferMethodFromContext(text, element);
      
      return {
        method,
        path,
        fullUrl: urlMatch[1],
        summary: `${method} ${path}`,
        description: extractDescriptionFromContext(element) || '',
        operationId: generateOperationId(method, path),
        parameters: extractParametersFromText(text),
        requestBody: null,
        responses: {},
        security: [],
        tags: []
      };
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  return null;
}

/**
 * Extract description from element context
 */
function extractDescriptionFromContext(element) {
  // Look for description in nearby elements
  const siblings = element.siblings();
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    const text = sibling.text?.() || '';
    if (text.length > 10 && text.length < 200) {
      return text.trim();
    }
  }
  
  // Look for description in parent
  const parent = element.parent();
  if (parent.length) {
    const text = parent.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
      if (line.length > 10 && line.length < 200 && !line.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i)) {
        return line;
      }
    }
  }
  
  return '';
}

/**
 * Infer HTTP method from context
 */
function inferMethodFromContext(text, element) {
  const context = text.toLowerCase();
  
  if (context.includes('get') || context.includes('retrieve') || context.includes('fetch')) {
    return 'GET';
  }
  
  if (context.includes('post') || context.includes('create') || context.includes('add')) {
    return 'POST';
  }
  
  if (context.includes('put') || context.includes('update') || context.includes('modify')) {
    return 'PUT';
  }
  
  if (context.includes('delete') || context.includes('remove')) {
    return 'DELETE';
  }
  
  if (context.includes('patch')) {
    return 'PATCH';
  }
  
  // Default to GET for most cases
  return 'GET';
}

/**
 * Extract parameters from text
 */
function extractParametersFromText(text) {
  const parameters = [];
  
  // Look for parameter patterns
  const paramPatterns = [
    /{(\w+)}/g, // Path parameters
    /[?&](\w+)=/g, // Query parameters
    /(\w+):\s*([^\s,]+)/g // Key-value pairs
  ];
  
  for (const pattern of paramPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const paramName = match[1];
      
      // Avoid duplicates
      if (!parameters.find(p => p.name === paramName)) {
        parameters.push({
          name: paramName,
          in: pattern.source.includes('{') ? 'path' : 'query',
          required: false,
          type: 'string',
          description: '',
          example: ''
        });
      }
    }
  }
  
  return parameters;
}

/**
 * Extract title from HTML
 */
function extractTitle($) {
  const title = $('title').text() || $('h1').first().text();
  return title.trim();
}

/**
 * Extract description from HTML
 */
function extractDescription($) {
  const metaDesc = $('meta[name="description"]').attr('content');
  if (metaDesc) {
    return metaDesc;
  }
  
  const firstP = $('p').first().text();
  if (firstP && firstP.length > 20) {
    return firstP.trim();
  }
  
  return '';
}

/**
 * Generate operation ID from method and path
 */
function generateOperationId(method, path) {
  const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '_');
  return `${method.toLowerCase()}_${cleanPath}`;
}

module.exports = { parseHtmlDocs }; 