/**
 * Parse Postman Collection
 * @param {string} content - Postman Collection JSON content
 * @returns {Object} Parsed API data
 */
async function parsePostman(content) {
  try {
    if (!content || content.trim() === '') {
      throw new Error('Empty or invalid Postman collection content');
    }
    
    const collection = JSON.parse(content);
    
    if (!collection || typeof collection !== 'object') {
      throw new Error('Invalid Postman collection format');
    }
    
    const baseUrl = extractBaseUrl(collection);
    const authMethod = extractAuthMethod(collection);
    const endpoints = extractEndpoints(collection);
    
    return {
      baseUrl,
      authMethod,
      endpoints,
      title: collection.info?.name || 'Postman Collection',
      version: collection.info?.schema || '1.0.0',
      description: collection.info?.description || ''
    };
  } catch (error) {
    throw new Error(`Failed to parse Postman Collection: ${error.message}`);
  }
}

/**
 * Extract base URL from Postman collection
 */
function extractBaseUrl(collection) {
  // Check for collection-level variables
  const variables = collection.variable || [];
  const baseUrlVar = variables.find(v => 
    v.key === 'baseUrl' || v.key === 'BASE_URL' || v.key === 'url'
  );
  
  if (baseUrlVar?.value) {
    return baseUrlVar.value;
  }
  
  // Check for environment variables or default values
  return '';
}

/**
 * Extract authentication method from Postman collection
 */
function extractAuthMethod(collection) {
  const auth = collection.auth;
  
  if (!auth) {
    return { type: 'none' };
  }
  
  switch (auth.type) {
    case 'bearer':
      return {
        type: 'bearer',
        name: 'Authorization',
        description: 'Bearer token authentication'
      };
      
    case 'apikey':
      return {
        type: 'apiKey',
        name: auth.apikey?.[0]?.key || 'X-API-Key',
        in: 'header',
        description: 'API Key authentication'
      };
      
    case 'basic':
      return {
        type: 'basic',
        name: 'Authorization',
        description: 'Basic authentication'
      };
      
    case 'oauth2':
      return {
        type: 'oauth2',
        name: 'Authorization',
        description: 'OAuth 2.0 authentication'
      };
      
    default:
      return { type: 'none' };
  }
}

/**
 * Extract endpoints from Postman collection
 */
function extractEndpoints(collection) {
  const endpoints = [];
  
  if (!collection.item || !Array.isArray(collection.item)) {
    return endpoints;
  }
  
  function processItems(items, parentPath = '') {
    for (const item of items) {
      if (!item) continue;
      
      if (item.request) {
        // This is a request item
        const endpoint = extractEndpointFromRequest(item, parentPath);
        if (endpoint) {
          endpoints.push(endpoint);
        }
      } else if (item.item && Array.isArray(item.item)) {
        // This is a folder, recursively process its items
        const folderPath = parentPath ? `${parentPath}/${item.name || 'unnamed'}` : (item.name || 'unnamed');
        processItems(item.item, folderPath);
      }
    }
  }
  
  processItems(collection.item);
  return endpoints;
}

/**
 * Extract endpoint from Postman request
 */
function extractEndpointFromRequest(item, parentPath) {
  const request = item.request;
  
  if (!request) {
    return null;
  }
  
  const url = request.url;
  
  if (!url) return null;
  
  let fullUrl = '';
  let path = '';
  
  if (typeof url === 'string') {
    fullUrl = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch (e) {
      path = url;
    }
  } else if (url.raw) {
    fullUrl = url.raw;
    path = url.path?.join('/') || '';
  } else {
    return null;
  }
  
  const method = (request.method || 'GET').toUpperCase();
  const headers = extractHeaders(request.header || []);
  const queryParams = extractQueryParams(url.query || []);
  const body = extractRequestBody(request.body);
  const auth = extractRequestAuth(request.auth);
  
  return {
    method,
    path: path.startsWith('/') ? path : `/${path}`,
    fullUrl,
    summary: item.name || '',
    description: item.description || '',
    operationId: generateOperationId(method, path, item.name),
    parameters: [
      ...queryParams.map(param => ({
        ...param,
        in: 'query'
      })),
      ...headers.filter(h => h.key && !h.key.toLowerCase().includes('authorization')).map(header => ({
        name: header.key,
        in: 'header',
        required: false,
        type: 'string',
        description: header.description || '',
        example: header.value
      }))
    ],
    requestBody: body,
    responses: extractPostmanResponses(item.response || []),
    security: auth ? [auth] : [],
    tags: parentPath ? [parentPath] : []
  };
}

/**
 * Extract headers from Postman request
 */
function extractHeaders(headers) {
  return headers.map(header => ({
    key: header.key,
    value: header.value,
    description: header.description || '',
    disabled: header.disabled || false
  }));
}

/**
 * Extract query parameters from Postman URL
 */
function extractQueryParams(queryParams) {
  return queryParams.map(param => ({
    name: param.key,
    required: param.disabled !== true,
    type: 'string',
    description: param.description || '',
    example: param.value
  }));
}

/**
 * Extract request body from Postman request
 */
function extractRequestBody(body) {
  if (!body) return null;
  
  switch (body.mode) {
    case 'raw':
      return {
        required: true,
        mediaType: body.options?.raw?.language || 'application/json',
        schema: {
          type: 'object',
          properties: {},
          example: body.raw
        }
      };
      
    case 'urlencoded':
      return {
        required: true,
        mediaType: 'application/x-www-form-urlencoded',
        schema: {
          type: 'object',
          properties: {},
          example: body.urlencoded?.map(item => ({
            key: item.key,
            value: item.value
          }))
        }
      };
      
    case 'formdata':
      return {
        required: true,
        mediaType: 'multipart/form-data',
        schema: {
          type: 'object',
          properties: {},
          example: body.formdata?.map(item => ({
            key: item.key,
            value: item.value,
            type: item.type
          }))
        }
      };
      
    default:
      return null;
  }
}

/**
 * Extract authentication from Postman request
 */
function extractRequestAuth(auth) {
  if (!auth) return null;
  
  switch (auth.type) {
    case 'bearer':
      return {
        type: 'bearer',
        name: 'Authorization'
      };
      
    case 'apikey':
      return {
        type: 'apiKey',
        name: auth.apikey?.[0]?.key || 'X-API-Key',
        in: 'header'
      };
      
    case 'basic':
      return {
        type: 'basic',
        name: 'Authorization'
      };
      
    default:
      return null;
  }
}

/**
 * Extract responses from Postman request
 */
function extractPostmanResponses(responses) {
  const extracted = {};
  
  responses.forEach((response, index) => {
    const code = response.code || '200';
    extracted[code] = {
      description: response.name || `Response ${index + 1}`,
      mediaType: response.header?.find(h => h.key === 'Content-Type')?.value || 'application/json',
      schema: {
        type: 'object',
        properties: {},
        example: response.body
      }
    };
  });
  
  return extracted;
}

/**
 * Generate operation ID from method, path, and name
 */
function generateOperationId(method, path, name) {
  const cleanPath = path.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanName = name ? name.replace(/[^a-zA-Z0-9]/g, '_') : '';
  
  if (cleanName) {
    return `${method.toLowerCase()}_${cleanName}`;
  }
  
  return `${method.toLowerCase()}_${cleanPath}`;
}

module.exports = { parsePostman }; 