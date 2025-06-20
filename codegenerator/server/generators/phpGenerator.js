/**
 * Generate PHP integration code
 * @param {Object} parsedData - Parsed API data
 * @param {string} fileName - Original file name
 * @returns {Object} Generated code files
 */
async function generatePhpCode(parsedData, fileName) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  const generatedCode = {};
  
  // Composer.json
  generatedCode['composer.json'] = generateComposerJson(title);
  
  // Main API client
  generatedCode['src/ApiClient.php'] = generateApiClient(parsedData);
  
  // Authentication handler
  generatedCode['src/Auth/AuthHandler.php'] = generateAuthHandler(authMethod);
  
  // Request handler
  generatedCode['src/Utils/RequestHandler.php'] = generateRequestHandler();
  
  // Error handler
  generatedCode['src/Utils/ErrorHandler.php'] = generateErrorHandler();
  
  // Configuration
  generatedCode['src/Config/Config.php'] = generateConfig();
  
  // Response model
  generatedCode['src/Models/ApiResponse.php'] = generateApiResponse();
  
  // Test files
  generatedCode['tests/ApiClientTest.php'] = generateTests(parsedData);
  
  // Example usage
  generatedCode['examples/basic-usage.php'] = generateExampleUsage(parsedData);
  
  // Environment template
  generatedCode['.env.example'] = generateEnvExample(authMethod);
  
  return generatedCode;
}

/**
 * Generate composer.json
 */
function generateComposerJson(title) {
  return `{
    "name": "example/${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-integration",
    "description": "Auto-generated integration client for ${title}",
    "type": "library",
    "license": "MIT",
    "authors": [
        {
            "name": "API Code Generator",
            "email": "generator@example.com"
        }
    ],
    "require": {
        "php": ">=7.4",
        "guzzlehttp/guzzle": "^7.0",
        "vlucas/phpdotenv": "^5.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^9.0",
        "mockery/mockery": "^1.0"
    },
    "autoload": {
        "psr-4": {
            "Example\\\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "test:coverage": "phpunit --coverage-html coverage"
    }
}`;
}

/**
 * Generate main API client
 */
function generateApiClient(parsedData) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  return `<?php

namespace Example;

use Example\\Auth\\AuthHandler;
use Example\\Config\\Config;
use Example\\Models\\ApiResponse;
use Example\\Utils\\RequestHandler;
use Example\\Utils\\ErrorHandler;
use GuzzleHttp\\Client;
use GuzzleHttp\\Exception\\GuzzleException;

/**
 * ${title} API Client
 * Auto-generated integration client for ${title}
 */
class ApiClient
{
    private Config $config;
    private AuthHandler $authHandler;
    private RequestHandler $requestHandler;
    private ErrorHandler $errorHandler;
    private Client $httpClient;

    public function __construct(array $config = [])
    {
        $this->config = new Config($config);
        $this->authHandler = new AuthHandler($this->config);
        $this->requestHandler = new RequestHandler($this->config);
        $this->errorHandler = new ErrorHandler();
        
        $this->httpClient = new Client([
            'base_uri' => $this->config->getBaseUrl(),
            'timeout' => $this->config->getTimeout(),
            'headers' => [
                'Content-Type' => 'application/json',
                'User-Agent' => '${title}-Integration/1.0.0'
            ]
        ]);
    }

${endpoints.map(endpoint => generateEndpointMethod(endpoint)).join('\n\n')}

    /**
     * Test connection to the API
     * @return bool Connection status
     */
    public function testConnection(): bool
    {
        try {
            $response = $this->requestHandler->makeRequest(
                $this->httpClient,
                'GET',
                '/',
                null,
                $this->authHandler->getAuthHeaders()
            );
            return $response->getStatusCode() === 200;
        } catch (\\Exception $e) {
            return false;
        }
    }

    /**
     * Get client configuration
     * @return Config Current configuration
     */
    public function getConfig(): Config
    {
        return $this->config;
    }
}`;
}

/**
 * Generate endpoint method
 */
function generateEndpointMethod(endpoint) {
  const { method, path, operationId, parameters, requestBody, summary, description } = endpoint;
  
  const params = parameters.filter(p => p.in === 'path');
  const queryParams = parameters.filter(p => p.in === 'query');
  const hasBody = requestBody && method !== 'GET' && method !== 'DELETE';
  
  let methodSignature = `    /**
     * ${summary || description || `${method} ${path}`}
     * ${description ? `\n     * ${description}` : ''}
     * @return ApiResponse API response
     * @throws \\Exception if request fails
     */
    public function ${operationId}()`;
  
  if (params.length > 0 || queryParams.length > 0 || hasBody) {
    methodSignature += `(${generateMethodParameters(params, queryParams, hasBody)})`;
  }
  
  methodSignature += `: ApiResponse`;
  
  // Build URL with path parameters
  let urlBuilding = `        $url = '${path}';`;
  params.forEach(param => {
    urlBuilding += `\n        $url = str_replace('{${param.name}}', $${param.name}, $url);`;
  });
  
  // Build query parameters
  let queryBuilding = '';
  if (queryParams.length > 0) {
    queryBuilding = `\n        $queryParams = [];`;
    queryParams.forEach(param => {
      queryBuilding += `\n        if ($${param.name} !== null) {`;
      queryBuilding += `\n            $queryParams['${param.name}'] = $${param.name};`;
      queryBuilding += `\n        }`;
    });
    queryBuilding += `\n        if (!empty($queryParams)) {`;
    queryBuilding += `\n            $url .= '?' . http_build_query($queryParams);`;
    queryBuilding += `\n        }`;
  }
  
  // Build request body
  let bodyBuilding = '';
  if (hasBody) {
    bodyBuilding = `\n        $requestBody = null;`;
    bodyBuilding += `\n        if ($body !== null) {`;
    bodyBuilding += `\n            $requestBody = json_encode($body);`;
    bodyBuilding += `\n        }`;
  }
  
  const methodBody = `${methodSignature}
    {
${urlBuilding}${queryBuilding}${bodyBuilding}

        return $this->requestHandler->makeRequest(
            $this->httpClient,
            '${method}',
            $url,
            $requestBody,
            $this->authHandler->getAuthHeaders()
        );
    }`;
  
  return methodBody;
}

/**
 * Generate method parameters
 */
function generateMethodParameters(params, queryParams, hasBody) {
  const parameters = [];
  
  params.forEach(param => {
    parameters.push(`?string $${param.name} = null`);
  });
  
  queryParams.forEach(param => {
    parameters.push(`?string $${param.name} = null`);
  });
  
  if (hasBody) {
    parameters.push('?array $body = null');
  }
  
  return parameters.join(', ');
}

/**
 * Generate authentication handler
 */
function generateAuthHandler(authMethod) {
  return `<?php

namespace Example\\Auth;

use Example\\Config\\Config;

/**
 * Authentication Handler
 * Handles different types of authentication for API requests
 */
class AuthHandler
{
    private Config $config;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * Get authentication headers based on configured auth method
     * @return array Authentication headers
     */
    public function getAuthHeaders(): array
    {
        $authType = $this->config->getAuthType();
        
        switch ($authType) {
            case 'bearer':
                return $this->getBearerHeaders();
            case 'apiKey':
                return $this->getApiKeyHeaders();
            case 'basic':
                return $this->getBasicHeaders();
            case 'oauth2':
                return $this->getOAuth2Headers();
            default:
                return [];
        }
    }

    /**
     * Get Bearer token headers
     * @return array Bearer token headers
     */
    private function getBearerHeaders(): array
    {
        $token = $this->config->getApiKey() ?: $this->config->getBearerToken();
        
        if (empty($token)) {
            throw new \\RuntimeException('Bearer token is required but not provided');
        }
        
        return [
            'Authorization' => 'Bearer ' . $token
        ];
    }

    /**
     * Get API Key headers
     * @return array API Key headers
     */
    private function getApiKeyHeaders(): array
    {
        $apiKey = $this->config->getApiKey();
        
        if (empty($apiKey)) {
            throw new \\RuntimeException('API Key is required but not provided');
        }
        
        $headerName = $this->config->getAuthHeaderName() ?: 'X-API-Key';
        return [
            $headerName => $apiKey
        ];
    }

    /**
     * Get Basic authentication headers
     * @return array Basic auth headers
     */
    private function getBasicHeaders(): array
    {
        $username = $this->config->getUsername();
        $password = $this->config->getPassword();
        
        if (empty($username) || empty($password)) {
            throw new \\RuntimeException('Username and password are required for Basic authentication');
        }
        
        $credentials = base64_encode($username . ':' . $password);
        return [
            'Authorization' => 'Basic ' . $credentials
        ];
    }

    /**
     * Get OAuth2 headers
     * @return array OAuth2 headers
     */
    private function getOAuth2Headers(): array
    {
        $accessToken = $this->config->getAccessToken();
        
        if (empty($accessToken)) {
            throw new \\RuntimeException('OAuth2 access token is required but not provided');
        }
        
        return [
            'Authorization' => 'Bearer ' . $accessToken
        ];
    }
}`;
}

/**
 * Generate request handler
 */
function generateRequestHandler() {
  return `<?php

namespace Example\\Utils;

use Example\\Config\\Config;
use Example\\Models\\ApiResponse;
use GuzzleHttp\\Client;
use GuzzleHttp\\Exception\\GuzzleException;

/**
 * Request Handler
 * Handles HTTP requests with retry logic and proper error handling
 */
class RequestHandler
{
    private Config $config;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * Make HTTP request with retry logic
     * @param Client $client Guzzle HTTP client
     * @param string $method HTTP method
     * @param string $url Request URL
     * @param string|null $body Request body
     * @param array $headers Request headers
     * @return ApiResponse Response data
     * @throws \\Exception if request fails
     */
    public function makeRequest(Client $client, string $method, string $url, 
                              ?string $body, array $headers): ApiResponse
    {
        $maxRetries = $this->config->getMaxRetries();
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                return $this->executeRequest($client, $method, $url, $body, $headers);
            } catch (\\Exception $e) {
                $lastException = $e;
                
                // Don't retry on client errors (4xx) except 429 (rate limit)
                if ($e instanceof ApiException) {
                    $apiException = $e;
                    if ($apiException->getStatusCode() >= 400 && $apiException->getStatusCode() < 500 
                        && $apiException->getStatusCode() !== 429) {
                        throw $e;
                    }
                }
                
                // Don't retry on server errors (5xx) if it's the last attempt
                if ($attempt === $maxRetries) {
                    throw $e;
                }
                
                // Wait before retrying (exponential backoff)
                $delay = min(1000 * pow(2, $attempt - 1), 10000);
                usleep($delay * 1000);
            }
        }

        throw $lastException;
    }

    /**
     * Execute single HTTP request
     * @param Client $client Guzzle HTTP client
     * @param string $method HTTP method
     * @param string $url Request URL
     * @param string|null $body Request body
     * @param array $headers Request headers
     * @return ApiResponse Response data
     * @throws \\Exception if request fails
     */
    private function executeRequest(Client $client, string $method, string $url, 
                                  ?string $body, array $headers): ApiResponse
    {
        $options = [
            'headers' => array_merge([
                'Content-Type' => 'application/json'
            ], $headers)
        ];

        if ($body !== null && !in_array($method, ['GET', 'DELETE'])) {
            $options['body'] = $body;
        }

        try {
            $response = $client->request($method, $url, $options);
            $responseBody = $response->getBody()->getContents();
            
            return new ApiResponse(
                $response->getStatusCode(),
                $response->getReasonPhrase(),
                $responseBody
            );
        } catch (GuzzleException $e) {
            if ($e->hasResponse()) {
                $response = $e->getResponse();
                throw new ApiException(
                    $response->getStatusCode(),
                    $response->getReasonPhrase(),
                    $response->getBody()->getContents()
                );
            }
            throw new \\RuntimeException('Request failed: ' . $e->getMessage(), 0, $e);
        }
    }
}`;
}

/**
 * Generate error handler
 */
function generateErrorHandler() {
  return `<?php

namespace Example\\Utils;

/**
 * Error Handler
 * Handles and formats API errors consistently
 */
class ErrorHandler
{
    /**
     * Custom API Exception
     */
    public static class ApiException extends \\RuntimeException
    {
        private int $statusCode;
        private string $responseBody;

        public function __construct(int $statusCode, string $message, string $responseBody)
        {
            parent::__construct($message);
            $this->statusCode = $statusCode;
            $this->responseBody = $responseBody;
        }

        public function getStatusCode(): int
        {
            return $this->statusCode;
        }

        public function getResponseBody(): string
        {
            return $this->responseBody;
        }

        public function __toString(): string
        {
            return sprintf(
                'ApiException{statusCode=%d, message="%s", responseBody="%s"}',
                $this->statusCode,
                $this->getMessage(),
                $this->responseBody
            );
        }
    }
}`;
}

/**
 * Generate configuration
 */
function generateConfig() {
  return `<?php

namespace Example\\Config;

use Dotenv\\Dotenv;

/**
 * Configuration Manager
 * Manages API client configuration with environment variable support
 */
class Config
{
    private string $baseUrl;
    private int $timeout;
    private int $maxRetries;
    private string $authType;
    private ?string $apiKey;
    private ?string $bearerToken;
    private ?string $username;
    private ?string $password;
    private ?string $accessToken;
    private ?string $authHeaderName;

    public function __construct(array $config = [])
    {
        $this->loadEnvironmentVariables();
        $this->loadConfig($config);
        $this->setDefaults();
    }

    /**
     * Load environment variables
     */
    private function loadEnvironmentVariables(): void
    {
        if (file_exists('.env')) {
            $dotenv = Dotenv::createImmutable('.');
            $dotenv->load();
        }
    }

    /**
     * Load configuration from array
     */
    private function loadConfig(array $config): void
    {
        $this->baseUrl = $config['baseUrl'] ?? $_ENV['API_BASE_URL'] ?? '';
        $this->timeout = (int) ($config['timeout'] ?? $_ENV['API_TIMEOUT'] ?? 30000);
        $this->maxRetries = (int) ($config['maxRetries'] ?? $_ENV['API_MAX_RETRIES'] ?? 3);
        $this->authType = $config['authType'] ?? $_ENV['API_AUTH_TYPE'] ?? 'none';
        $this->apiKey = $config['apiKey'] ?? $_ENV['API_KEY'] ?? null;
        $this->bearerToken = $config['bearerToken'] ?? $_ENV['API_BEARER_TOKEN'] ?? null;
        $this->username = $config['username'] ?? $_ENV['API_USERNAME'] ?? null;
        $this->password = $config['password'] ?? $_ENV['API_PASSWORD'] ?? null;
        $this->accessToken = $config['accessToken'] ?? $_ENV['API_ACCESS_TOKEN'] ?? null;
        $this->authHeaderName = $config['authHeaderName'] ?? $_ENV['API_AUTH_HEADER_NAME'] ?? null;
    }

    /**
     * Set default values
     */
    private function setDefaults(): void
    {
        if ($this->timeout <= 0) $this->timeout = 30000;
        if ($this->maxRetries <= 0) $this->maxRetries = 3;
        if (empty($this->authType)) $this->authType = 'none';
    }

    // Getters
    public function getBaseUrl(): string { return $this->baseUrl; }
    public function getTimeout(): int { return $this->timeout; }
    public function getMaxRetries(): int { return $this->maxRetries; }
    public function getAuthType(): string { return $this->authType; }
    public function getApiKey(): ?string { return $this->apiKey; }
    public function getBearerToken(): ?string { return $this->bearerToken; }
    public function getUsername(): ?string { return $this->username; }
    public function getPassword(): ?string { return $this->password; }
    public function getAccessToken(): ?string { return $this->accessToken; }
    public function getAuthHeaderName(): ?string { return $this->authHeaderName; }

    // Setters
    public function setBaseUrl(string $baseUrl): void { $this->baseUrl = $baseUrl; }
    public function setTimeout(int $timeout): void { $this->timeout = $timeout; }
    public function setMaxRetries(int $maxRetries): void { $this->maxRetries = $maxRetries; }
    public function setAuthType(string $authType): void { $this->authType = $authType; }
    public function setApiKey(?string $apiKey): void { $this->apiKey = $apiKey; }
    public function setBearerToken(?string $bearerToken): void { $this->bearerToken = $bearerToken; }
    public function setUsername(?string $username): void { $this->username = $username; }
    public function setPassword(?string $password): void { $this->password = $password; }
    public function setAccessToken(?string $accessToken): void { $this->accessToken = $accessToken; }
    public function setAuthHeaderName(?string $authHeaderName): void { $this->authHeaderName = $authHeaderName; }
}`;
}

/**
 * Generate API response model
 */
function generateApiResponse() {
  return `<?php

namespace Example\\Models;

/**
 * API Response Model
 * Represents a standard API response
 */
class ApiResponse
{
    private int $statusCode;
    private string $statusMessage;
    private string $body;

    public function __construct(int $statusCode, string $statusMessage, string $body)
    {
        $this->statusCode = $statusCode;
        $this->statusMessage = $statusMessage;
        $this->body = $body;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getStatusMessage(): string
    {
        return $this->statusMessage;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    public function getJsonBody(): array
    {
        return json_decode($this->body, true) ?? [];
    }

    public function __toString(): string
    {
        return sprintf(
            'ApiResponse{statusCode=%d, statusMessage="%s", body="%s"}',
            $this->statusCode,
            $this->statusMessage,
            $this->body
        );
    }
}`;
}

/**
 * Generate test files
 */
function generateTests(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `<?php

namespace Tests;

use Example\\ApiClient;
use Example\\Config\\Config;
use Example\\Models\\ApiResponse;
use PHPUnit\\Framework\\TestCase;
use Mockery;

class ApiClientTest extends TestCase
{
    private ApiClient $apiClient;
    
    protected function setUp(): void
    {
        $this->apiClient = new ApiClient();
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testConfiguration()
    {
        $config = $this->apiClient->getConfig();
        $this->assertInstanceOf(Config::class, $config);
        $this->assertEquals('none', $config->getAuthType());
    }

${endpoints.map(endpoint => generateEndpointTest(endpoint)).join('\n\n')}

    public function testErrorHandling()
    {
        // Test error handling with invalid configuration
        $config = new Config(['baseUrl' => 'invalid-url']);
        $client = new ApiClient($config);
        
        $this->assertFalse($client->testConnection());
    }
}`;
}

/**
 * Generate endpoint test
 */
function generateEndpointTest(endpoint) {
  const { method, path, operationId } = endpoint;
  
  return `    public function test${operationId.charAt(0).toUpperCase() + operationId.slice(1)}()
    {
        // This is a basic test structure
        // In a real implementation, you would mock the HTTP client
        $this->assertInstanceOf(ApiClient::class, $this->apiClient);
        // Add more specific tests based on the endpoint requirements
    }`;
}

/**
 * Generate example usage
 */
function generateExampleUsage(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Example\\ApiClient;
use Example\\Models\\ApiResponse;

/**
 * Example usage of ${title} API Client
 */
function main()
{
    try {
        // Initialize the API client
        $client = new ApiClient();
        
        echo "🚀 ${title} API Client initialized\\n";
        
        // Test connection
        $isConnected = $client->testConnection();
        echo "🔗 Connection test: " . ($isConnected ? "✅ Success" : "❌ Failed") . "\\n";
        
        if (!$isConnected) {
            echo "❌ Cannot connect to API. Please check your configuration.\\n";
            return;
        }

${endpoints.slice(0, 2).map(endpoint => `        // Example: ${endpoint.method} ${endpoint.path}
        try {
            echo "\\n📡 Testing ${endpoint.operationId}...\\n";
            $${endpoint.operationId}Result = $client->${endpoint.operationId}();
            echo "✅ ${endpoint.operationId} result: " . $${endpoint.operationId}Result . "\\n";
        } catch (Exception $e) {
            echo "❌ ${endpoint.operationId} failed: " . $e->getMessage() . "\\n";
        }`).join('\n\n')}

        echo "\\n🎉 Example completed successfully!\\n";
        
    } catch (Exception $e) {
        echo "💥 Example failed: " . $e->getMessage() . "\\n";
        exit(1);
    }
}

// Run the example
if (php_sapi_name() === 'cli') {
    main();
}`;
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

module.exports = { generatePhpCode }; 