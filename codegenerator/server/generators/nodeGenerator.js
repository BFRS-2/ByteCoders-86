/**
 * Generate Node.js integration code
 * @param {Object} parsedData - Parsed API data
 * @param {string} fileName - Original file name
 * @returns {Object} Generated code files
 */
async function generateNodeCode(parsedData, fileName) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  const generatedCode = {};
  
  // Package.json
  generatedCode['package.json'] = generatePackageJson(title);
  
  // Main API client
  generatedCode['src/ApiClient.js'] = generateApiClient(parsedData);
  
  // Authentication handler
  generatedCode['src/auth/AuthHandler.js'] = generateAuthHandler(authMethod);
  
  // Request handler
  generatedCode['src/utils/RequestHandler.js'] = generateRequestHandler();
  
  // Error handler
  generatedCode['src/utils/ErrorHandler.js'] = generateErrorHandler();
  
  // Configuration
  generatedCode['src/config/Config.js'] = generateConfig();
  
  // Test files
  generatedCode['tests/ApiClient.test.js'] = generateTests(parsedData);
  
  // Example usage
  generatedCode['examples/basic-usage.js'] = generateExampleUsage(parsedData);
  
  // Environment template
  generatedCode['.env.example'] = generateEnvExample(authMethod);
  
  return generatedCode;
}

/**
 * Generate package.json
 */
function generatePackageJson(title) {
  return `{
  "name": "${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-integration",
  "version": "1.0.0",
  "description": "Auto-generated integration client for ${title}",
  "main": "src/ApiClient.js",
  "scripts": {
    "start": "node examples/basic-usage.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}`;
}

/**
 * Generate main API client
 */
function generateApiClient(parsedData) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  return `const axios = require('axios');
const AuthHandler = require('./auth/AuthHandler');
const RequestHandler = require('./utils/RequestHandler');
const ErrorHandler = require('./utils/ErrorHandler');
const Config = require('./config/Config');

/**
 * ${title} API Client
 * Auto-generated integration client for ${title}
 */
class ApiClient {
  constructor(config = {}) {
    this.config = new Config(config);
    this.authHandler = new AuthHandler(this.config);
    this.requestHandler = new RequestHandler(this.config);
    this.errorHandler = new ErrorHandler();
    
    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '${title}-Integration/1.0.0'
      }
    });
  }

${endpoints.map(endpoint => generateEndpointMethod(endpoint)).join('\n\n')}

  /**
   * Test connection to the API
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ApiClient;`;
}

/**
 * Generate endpoint method
 */
function generateEndpointMethod(endpoint) {
  const { method, path, operationId, parameters, requestBody, summary, description } = endpoint;
  
  const params = parameters.filter(p => p.in === 'path');
  const queryParams = parameters.filter(p => p.in === 'query');
  const hasBody = requestBody && method !== 'GET' && method !== 'DELETE';
  
  let methodSignature = `  /**
   * ${summary || description || `${method} ${path}`}
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async ${operationId}(options = {}) {`;
  
  if (params.length > 0) {
    methodSignature += `\n    const { ${params.map(p => p.name).join(', ')}, ...restOptions } = options;`;
  }
  
  if (queryParams.length > 0) {
    methodSignature += `\n    const { ${queryParams.map(p => p.name).join(', ')}, ...requestOptions } = restOptions || options;`;
  } else if (params.length > 0) {
    methodSignature += `\n    const requestOptions = restOptions;`;
  }
  
  // Build URL with path parameters
  let urlBuilding = `    let url = '${path}';`;
  params.forEach(param => {
    urlBuilding += `\n    url = url.replace('{${param.name}}', ${param.name});`;
  });
  
  // Build query parameters
  let queryBuilding = '';
  if (queryParams.length > 0) {
    queryBuilding = `\n    const queryParams = {};`;
    queryParams.forEach(param => {
      queryBuilding += `\n    if (${param.name} !== undefined) queryParams.${param.name} = ${param.name};`;
    });
  }
  
  // Build request config
  let requestConfig = `\n    const config = {
      method: '${method}',
      url,
      ${queryParams.length > 0 ? 'params: queryParams,' : ''}
      ...requestOptions
    };`;
  
  if (hasBody) {
    requestConfig += `\n    
    if (options.body) {
      config.data = options.body;
    }`;
  }
  
  const methodBody = `${methodSignature}
${urlBuilding}${queryBuilding}${requestConfig}

    return this.requestHandler.makeRequest(config);
  }`;
  
  return methodBody;
}

/**
 * Generate authentication handler
 */
function generateAuthHandler(authMethod) {
  return `/**
 * Authentication Handler
 * Handles different types of authentication for API requests
 */
class AuthHandler {
  constructor(config) {
    this.config = config;
  }

  /**
   * Get authentication headers based on configured auth method
   * @returns {Promise<Object>} Authentication headers
   */
  async getAuthHeaders() {
    const authType = this.config.authType;
    
    switch (authType) {
      case 'bearer':
        return this.getBearerHeaders();
      case 'apiKey':
        return this.getApiKeyHeaders();
      case 'basic':
        return this.getBasicHeaders();
      case 'oauth2':
        return this.getOAuth2Headers();
      default:
        return {};
    }
  }

  /**
   * Get Bearer token headers
   * @returns {Object} Bearer token headers
   */
  getBearerHeaders() {
    const token = this.config.apiKey || this.config.bearerToken;
    if (!token) {
      throw new Error('Bearer token is required but not provided');
    }
    return {
      'Authorization': \`Bearer \${token}\`
    };
  }

  /**
   * Get API Key headers
   * @returns {Object} API Key headers
   */
  getApiKeyHeaders() {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('API Key is required but not provided');
    }
    
    const headerName = this.config.authHeaderName || 'X-API-Key';
    return {
      [headerName]: apiKey
    };
  }

  /**
   * Get Basic authentication headers
   * @returns {Object} Basic auth headers
   */
  getBasicHeaders() {
    const username = this.config.username;
    const password = this.config.password;
    
    if (!username || !password) {
      throw new Error('Username and password are required for Basic authentication');
    }
    
    const credentials = Buffer.from(\`\${username}:\${password}\`).toString('base64');
    return {
      'Authorization': \`Basic \${credentials}\`
    };
  }

  /**
   * Get OAuth2 headers
   * @returns {Object} OAuth2 headers
   */
  getOAuth2Headers() {
    const accessToken = this.config.accessToken;
    if (!accessToken) {
      throw new Error('OAuth2 access token is required but not provided');
    }
    return {
      'Authorization': \`Bearer \${accessToken}\`
    };
  }
}

module.exports = AuthHandler;`;
}

/**
 * Generate request handler
 */
function generateRequestHandler() {
  return `/**
 * Request Handler
 * Handles HTTP requests with retry logic and proper error handling
 */
class RequestHandler {
  constructor(config) {
    this.config = config;
  }

  /**
   * Make HTTP request with retry logic
   * @param {Object} config - Axios request config
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(config) {
    const maxRetries = this.config.maxRetries || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.config.client(config);
        return response.data;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
          throw error;
        }
        
        // Don't retry on server errors (5xx) if it's the last attempt
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RequestHandler;`;
}

/**
 * Generate error handler
 */
function generateErrorHandler() {
  return `/**
 * Error Handler
 * Handles and formats API errors consistently
 */
class ErrorHandler {
  /**
   * Handle API errors and throw formatted exceptions
   * @param {Error} error - Axios error
   * @throws {ApiError} Formatted API error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, statusText, data } = error.response;
      throw new ApiError(
        status,
        statusText,
        data,
        error.request,
        error.config
      );
    } else if (error.request) {
      // Request was made but no response received
      throw new ApiError(
        0,
        'No response received',
        null,
        error.request,
        error.config
      );
    } else {
      // Something else happened
      throw new ApiError(
        0,
        error.message,
        null,
        null,
        error.config
      );
    }
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(status, message, data, request, config) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.request = request;
    this.config = config;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = ErrorHandler;
module.exports.ApiError = ApiError;`;
}

/**
 * Generate configuration
 */
function generateConfig() {
  return `require('dotenv').config();

/**
 * Configuration Manager
 * Manages API client configuration with environment variable support
 */
class Config {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.API_BASE_URL || '',
      timeout: config.timeout || parseInt(process.env.API_TIMEOUT) || 30000,
      maxRetries: config.maxRetries || parseInt(process.env.API_MAX_RETRIES) || 3,
      
      // Authentication
      authType: config.authType || process.env.API_AUTH_TYPE || 'none',
      apiKey: config.apiKey || process.env.API_KEY,
      bearerToken: config.bearerToken || process.env.API_BEARER_TOKEN,
      username: config.username || process.env.API_USERNAME,
      password: config.password || process.env.API_PASSWORD,
      accessToken: config.accessToken || process.env.API_ACCESS_TOKEN,
      authHeaderName: config.authHeaderName || process.env.API_AUTH_HEADER_NAME
    };
  }

  // Getters for common properties
  get baseUrl() { return this.config.baseUrl; }
  get timeout() { return this.config.timeout; }
  get maxRetries() { return this.config.maxRetries; }
  get authType() { return this.config.authType; }
  get apiKey() { return this.config.apiKey; }
  get bearerToken() { return this.config.bearerToken; }
  get username() { return this.config.username; }
  get password() { return this.config.password; }
  get accessToken() { return this.config.accessToken; }
  get authHeaderName() { return this.config.authHeaderName; }
}

module.exports = Config;`;
}

/**
 * Generate test files
 */
function generateTests(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `const ApiClient = require('../src/ApiClient');

describe('${title} API Client', () => {
  let client;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-api-key'
    });
  });

  describe('Configuration', () => {
    test('should initialize with correct configuration', () => {
      expect(client.config.baseUrl).toBe('https://api.example.com');
      expect(client.config.apiKey).toBe('test-api-key');
    });
  });

${endpoints.map(endpoint => generateEndpointTest(endpoint)).join('\n\n')}
});`;
}

/**
 * Generate endpoint test
 */
function generateEndpointTest(endpoint) {
  const { method, path, operationId } = endpoint;
  
  return `  describe('${operationId}', () => {
    test('should make ${method} request to ${path}', async () => {
      const mockResponse = { data: { success: true } };
      client.requestHandler.makeRequest = jest.fn().mockResolvedValue(mockResponse);
      
      const result = await client.${operationId}();
      
      expect(client.requestHandler.makeRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: '${method}',
          url: '${path}'
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });`;
}

/**
 * Generate example usage
 */
function generateExampleUsage(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `require('dotenv').config();
const ApiClient = require('../src/ApiClient');

/**
 * Example usage of ${title} API Client
 */
async function main() {
  try {
    // Initialize the API client
    const client = new ApiClient({
      baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
      apiKey: process.env.API_KEY,
      timeout: 30000
    });

    console.log('🚀 ${title} API Client initialized');

    // Test connection
    const isConnected = await client.testConnection();
    console.log('🔗 Connection test:', isConnected ? '✅ Success' : '❌ Failed');

${endpoints.slice(0, 2).map(endpoint => `    // Example: ${endpoint.method} ${endpoint.path}
    try {
      console.log('\\n📡 Testing ${endpoint.operationId}...');
      const ${endpoint.operationId}Result = await client.${endpoint.operationId}();
      console.log('✅ ${endpoint.operationId} result:', JSON.stringify(${endpoint.operationId}Result, null, 2));
    } catch (error) {
      console.error('❌ ${endpoint.operationId} failed:', error.message);
    }`).join('\n\n')}

    console.log('\\n🎉 Example completed successfully!');

  } catch (error) {
    console.error('💥 Example failed:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main();
}

module.exports = { main };`;
}

/**
 * Generate environment example
 */
function generateEnvExample(authMethod) {
  let envContent = `# ${authMethod.type === 'none' ? 'No authentication required' : `${authMethod.type.toUpperCase()} Authentication`}

# API Configuration
API_BASE_URL=https://api.example.com
API_TIMEOUT=30000
API_MAX_RETRIES=3

`;

  switch (authMethod.type) {
    case 'bearer':
      envContent += `# Bearer Token Authentication
API_AUTH_TYPE=bearer
API_BEARER_TOKEN=your-bearer-token-here
`;
      break;
      
    case 'apiKey':
      envContent += `# API Key Authentication
API_AUTH_TYPE=apiKey
API_KEY=your-api-key-here
API_AUTH_HEADER_NAME=X-API-Key
`;
      break;
      
    case 'basic':
      envContent += `# Basic Authentication
API_AUTH_TYPE=basic
API_USERNAME=your-username
API_PASSWORD=your-password
`;
      break;
      
    case 'oauth2':
      envContent += `# OAuth 2.0 Authentication
API_AUTH_TYPE=oauth2
API_ACCESS_TOKEN=your-access-token-here
`;
      break;
  }

  return envContent;
}

module.exports = { generateNodeCode }; 