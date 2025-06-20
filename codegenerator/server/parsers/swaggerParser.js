const SwaggerParser = require('swagger-parser');

/**
 * Parse Swagger/OpenAPI specification
 * @param {string} content - Swagger JSON content
 * @returns {Object} Parsed API data
 */
async function parseSwagger(content) {
  try {
    // Parse and validate the Swagger spec
    const api = await SwaggerParser.parse(JSON.parse(content));
    
    const baseUrl = api.servers?.[0]?.url || api.host || '';
    const authMethod = extractAuthMethod(api);
    const endpoints = extractEndpoints(api);
    
    return {
      baseUrl,
      authMethod,
      endpoints,
      title: api.info?.title || 'API',
      version: api.info?.version || '1.0.0',
      description: api.info?.description || ''
    };
  } catch (error) {
    throw new Error(`Failed to parse Swagger specification: ${error.message}`);
  }
}

/**
 * Extract authentication method from Swagger spec
 */
function extractAuthMethod(api) {
  const securitySchemes = api.components?.securitySchemes || {};
  
  for (const [name, scheme] of Object.entries(securitySchemes)) {
    switch (scheme.type) {
      case 'http':
        if (scheme.scheme === 'bearer') {
          return { type: 'bearer', name: 'Authorization', description: scheme.description };
        } else if (scheme.scheme === 'basic') {
          return { type: 'basic', name: 'Authorization', description: scheme.description };
        }
        break;
      case 'apiKey':
        return { 
          type: 'apiKey', 
          name: scheme.name, 
          in: scheme.in || 'header',
          description: scheme.description 
        };
      case 'oauth2':
        return { type: 'oauth2', name: 'Authorization', description: scheme.description };
    }
  }
  
  return { type: 'none' };
}

/**
 * Extract endpoints from Swagger spec
 */
function extractEndpoints(api) {
  const endpoints = [];
  const paths = api.paths || {};
  
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
        const endpoint = {
          method: method.toUpperCase(),
          path,
          fullUrl: `${api.servers?.[0]?.url || ''}${path}`,
          summary: operation.summary || '',
          description: operation.description || '',
          operationId: operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          parameters: extractParameters(operation.parameters || []),
          requestBody: extractRequestBody(operation.requestBody),
          responses: extractResponses(operation.responses || {}),
          security: operation.security || api.security || [],
          tags: operation.tags || []
        };
        
        endpoints.push(endpoint);
      }
    }
  }
  
  return endpoints;
}

/**
 * Extract parameters from endpoint
 */
function extractParameters(parameters) {
  return parameters.map(param => ({
    name: param.name,
    in: param.in, // path, query, header, cookie
    required: param.required || false,
    type: param.schema?.type || 'string',
    description: param.description || '',
    example: param.example || param.schema?.example,
    format: param.schema?.format,
    enum: param.schema?.enum
  }));
}

/**
 * Extract request body schema
 */
function extractRequestBody(requestBody) {
  if (!requestBody) return null;
  
  const content = requestBody.content || {};
  const mediaType = Object.keys(content)[0] || 'application/json';
  const schema = content[mediaType]?.schema;
  
  if (!schema) return null;
  
  return {
    required: requestBody.required || false,
    mediaType,
    schema: {
      type: schema.type,
      properties: schema.properties || {},
      required: schema.required || [],
      example: content[mediaType]?.example
    }
  };
}

/**
 * Extract response schemas
 */
function extractResponses(responses) {
  const extracted = {};
  
  for (const [code, response] of Object.entries(responses)) {
    const content = response.content || {};
    const mediaType = Object.keys(content)[0] || 'application/json';
    const schema = content[mediaType]?.schema;
    
    extracted[code] = {
      description: response.description || '',
      mediaType,
      schema: schema ? {
        type: schema.type,
        properties: schema.properties || {},
        example: content[mediaType]?.example
      } : null
    };
  }
  
  return extracted;
}

module.exports = { parseSwagger }; 