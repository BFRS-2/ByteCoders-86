/**
 * Generate Go integration code
 * @param {Object} parsedData - Parsed API data
 * @param {string} fileName - Original file name
 * @returns {Object} Generated code files
 */
async function generateGoCode(parsedData, fileName) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  const generatedCode = {};
  
  // Go module
  generatedCode['go.mod'] = generateGoMod(title);
  
  // Main API client
  generatedCode['client.go'] = generateApiClient(parsedData);
  
  // Authentication handler
  generatedCode['auth.go'] = generateAuthHandler(authMethod);
  
  // Request handler
  generatedCode['request.go'] = generateRequestHandler();
  
  // Error handler
  generatedCode['errors.go'] = generateErrorHandler();
  
  // Configuration
  generatedCode['config.go'] = generateConfig();
  
  // Response models
  generatedCode['models.go'] = generateModels();
  
  // Test files
  generatedCode['client_test.go'] = generateTests(parsedData);
  
  // Example usage
  generatedCode['example/main.go'] = generateExampleUsage(parsedData);
  
  // Environment template
  generatedCode['.env.example'] = generateEnvExample(authMethod);
  
  return generatedCode;
}

/**
 * Generate go.mod
 */
function generateGoMod(title) {
  return `module ${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-integration

go 1.19

require (
	github.com/joho/godotenv v1.4.0
)

require (
	github.com/stretchr/testify v1.8.1 // indirect
	golang.org/x/net v0.5.0 // indirect
)`;
}

/**
 * Generate main API client
 */
function generateApiClient(parsedData) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ApiClient represents the ${title} API client
type ApiClient struct {
	config       *Config
	authHandler  *AuthHandler
	requestHandler *RequestHandler
	httpClient   *http.Client
}

// NewApiClient creates a new API client instance
func NewApiClient(config *Config) *ApiClient {
	if config == nil {
		config = NewConfig()
	}

	client := &ApiClient{
		config:       config,
		authHandler:  NewAuthHandler(config),
		requestHandler: NewRequestHandler(config),
		httpClient: &http.Client{
			Timeout: time.Duration(config.Timeout) * time.Millisecond,
		},
	}

	return client
}

${endpoints.map(endpoint => generateEndpointMethod(endpoint)).join('\n\n')}

// TestConnection tests the connection to the API
func (c *ApiClient) TestConnection() bool {
	resp, err := c.requestHandler.MakeRequest(c.httpClient, "GET", "/", nil, c.authHandler.GetAuthHeaders())
	if err != nil {
		return false
	}
	return resp.StatusCode == 200
}

// GetConfig returns the current configuration
func (c *ApiClient) GetConfig() *Config {
	return c.config
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
  
  let methodSignature = `// ${operationId} ${summary || description || `${method} ${path}`}
// ${description ? description : ''}
func (c *ApiClient) ${operationId.charAt(0).toUpperCase() + operationId.slice(1)}()`;
  
  if (params.length > 0 || queryParams.length > 0 || hasBody) {
    methodSignature += `(${generateMethodParameters(params, queryParams, hasBody)})`;
  }
  
  methodSignature += ` (*ApiResponse, error) {`;
  
  // Build URL with path parameters
  let urlBuilding = `	url := "${path}"`;
  params.forEach(param => {
    urlBuilding += `\n	url = strings.ReplaceAll(url, "{${param.name}}", ${param.name})`;
  });
  
  // Build query parameters
  let queryBuilding = '';
  if (queryParams.length > 0) {
    queryBuilding = `\n	queryParams := make(map[string]string)`;
    queryParams.forEach(param => {
      queryBuilding += `\n	if ${param.name} != "" {`;
      queryBuilding += `\n		queryParams["${param.name}"] = ${param.name}`;
      queryBuilding += `\n	}`;
    });
    queryBuilding += `\n	if len(queryParams) > 0 {`;
    queryBuilding += `\n		url += "?" + buildQueryString(queryParams)`;
    queryBuilding += `\n	}`;
  }
  
  // Build request body
  let bodyBuilding = '';
  if (hasBody) {
    bodyBuilding = `\n	var requestBody []byte`;
    bodyBuilding += `\n	var err error`;
    bodyBuilding += `\n	if body != nil {`;
    bodyBuilding += `\n		requestBody, err = json.Marshal(body)`;
    bodyBuilding += `\n		if err != nil {`;
    bodyBuilding += `\n			return nil, fmt.Errorf("failed to marshal request body: %w", err)`;
    bodyBuilding += `\n		}`;
    bodyBuilding += `\n	}`;
  }
  
  const methodBody = `${methodSignature}
${urlBuilding}${queryBuilding}${bodyBuilding}

	return c.requestHandler.MakeRequest(c.httpClient, "${method}", url, requestBody, c.authHandler.GetAuthHeaders())
}`;
  
  return methodBody;
}

/**
 * Generate method parameters
 */
function generateMethodParameters(params, queryParams, hasBody) {
  const parameters = [];
  
  params.forEach(param => {
    parameters.push(`${param.name} string`);
  });
  
  queryParams.forEach(param => {
    parameters.push(`${param.name} string`);
  });
  
  if (hasBody) {
    parameters.push('body interface{}');
  }
  
  return parameters.join(', ');
}

/**
 * Generate authentication handler
 */
function generateAuthHandler(authMethod) {
  return `package main

import (
	"encoding/base64"
	"fmt"
)

// AuthHandler handles authentication for API requests
type AuthHandler struct {
	config *Config
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(config *Config) *AuthHandler {
	return &AuthHandler{
		config: config,
	}
}

// GetAuthHeaders returns authentication headers based on configured auth method
func (a *AuthHandler) GetAuthHeaders() map[string]string {
	headers := make(map[string]string)

	switch a.config.AuthType {
	case "bearer":
		return a.getBearerHeaders()
	case "apiKey":
		return a.getApiKeyHeaders()
	case "basic":
		return a.getBasicHeaders()
	case "oauth2":
		return a.getOAuth2Headers()
	default:
		return headers
	}
}

// getBearerHeaders returns Bearer token headers
func (a *AuthHandler) getBearerHeaders() map[string]string {
	headers := make(map[string]string)
	token := a.config.ApiKey
	if token == "" {
		token = a.config.BearerToken
	}

	if token == "" {
		panic("Bearer token is required but not provided")
	}

	headers["Authorization"] = "Bearer " + token
	return headers
}

// getApiKeyHeaders returns API Key headers
func (a *AuthHandler) getApiKeyHeaders() map[string]string {
	headers := make(map[string]string)
	apiKey := a.config.ApiKey

	if apiKey == "" {
		panic("API Key is required but not provided")
	}

	headerName := a.config.AuthHeaderName
	if headerName == "" {
		headerName = "X-API-Key"
	}

	headers[headerName] = apiKey
	return headers
}

// getBasicHeaders returns Basic authentication headers
func (a *AuthHandler) getBasicHeaders() map[string]string {
	headers := make(map[string]string)
	username := a.config.Username
	password := a.config.Password

	if username == "" || password == "" {
		panic("Username and password are required for Basic authentication")
	}

	credentials := username + ":" + password
	encodedCredentials := base64.StdEncoding.EncodeToString([]byte(credentials))
	headers["Authorization"] = "Basic " + encodedCredentials
	return headers
}

// getOAuth2Headers returns OAuth2 headers
func (a *AuthHandler) getOAuth2Headers() map[string]string {
	headers := make(map[string]string)
	accessToken := a.config.AccessToken

	if accessToken == "" {
		panic("OAuth2 access token is required but not provided")
	}

	headers["Authorization"] = "Bearer " + accessToken
	return headers
}`;
}

/**
 * Generate request handler
 */
function generateRequestHandler() {
  return `package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// RequestHandler handles HTTP requests with retry logic
type RequestHandler struct {
	config *Config
}

// NewRequestHandler creates a new request handler
func NewRequestHandler(config *Config) *RequestHandler {
	return &RequestHandler{
		config: config,
	}
}

// MakeRequest makes an HTTP request with retry logic
func (r *RequestHandler) MakeRequest(client *http.Client, method, url string, body []byte, headers map[string]string) (*ApiResponse, error) {
	maxRetries := r.config.MaxRetries
	var lastError error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err := r.executeRequest(client, method, url, body, headers)
		if err == nil {
			return resp, nil
		}

		lastError = err

		// Don't retry on client errors (4xx) except 429 (rate limit)
		if apiErr, ok := err.(*ApiError); ok {
			if apiErr.StatusCode >= 400 && apiErr.StatusCode < 500 && apiErr.StatusCode != 429 {
				return nil, err
			}
		}

		// Don't retry on server errors (5xx) if it's the last attempt
		if attempt == maxRetries {
			return nil, err
		}

		// Wait before retrying (exponential backoff)
		delay := time.Duration(min(1000*int64(1<<(attempt-1)), 10000)) * time.Millisecond
		time.Sleep(delay)
	}

	return nil, lastError
}

// executeRequest executes a single HTTP request
func (r *RequestHandler) executeRequest(client *http.Client, method, url string, body []byte, headers map[string]string) (*ApiResponse, error) {
	fullURL := r.config.BaseURL + url

	var req *http.Request
	var err error

	if body != nil && method != "GET" && method != "DELETE" {
		req, err = http.NewRequest(method, fullURL, bytes.NewBuffer(body))
	} else {
		req, err = http.NewRequest(method, fullURL, nil)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add default headers
	req.Header.Set("Content-Type", "application/json")

	// Add custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if !isSuccessStatus(resp.StatusCode) {
		return nil, &ApiError{
			StatusCode: resp.StatusCode,
			Message:    resp.Status,
			Body:       string(respBody),
		}
	}

	return &ApiResponse{
		StatusCode:    resp.StatusCode,
		StatusMessage: resp.Status,
		Body:          string(respBody),
	}, nil
}

// isSuccessStatus checks if the status code indicates success
func isSuccessStatus(statusCode int) bool {
	return statusCode >= 200 && statusCode < 300
}

// min returns the minimum of two int64 values
func min(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

// buildQueryString builds a query string from a map
func buildQueryString(params map[string]string) string {
	var pairs []string
	for key, value := range params {
		pairs = append(pairs, key+"="+value)
	}
	return strings.Join(pairs, "&")
}`;
}

/**
 * Generate error handler
 */
function generateErrorHandler() {
  return `package main

import "fmt"

// ApiError represents an API error
type ApiError struct {
	StatusCode int
	Message    string
	Body       string
}

// Error implements the error interface
func (e *ApiError) Error() string {
	return fmt.Sprintf("API Error %d: %s - %s", e.StatusCode, e.Message, e.Body)
}

// GetStatusCode returns the HTTP status code
func (e *ApiError) GetStatusCode() int {
	return e.StatusCode
}

// GetBody returns the response body
func (e *ApiError) GetBody() string {
	return e.Body
}`;
}

/**
 * Generate configuration
 */
function generateConfig() {
  return `package main

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config represents the API client configuration
type Config struct {
	BaseURL        string
	Timeout        int
	MaxRetries     int
	AuthType       string
	ApiKey         string
	BearerToken    string
	Username       string
	Password       string
	AccessToken    string
	AuthHeaderName string
}

// NewConfig creates a new configuration instance
func NewConfig() *Config {
	// Load environment variables
	godotenv.Load()

	config := &Config{
		BaseURL:        getEnv("API_BASE_URL", ""),
		Timeout:        getEnvAsInt("API_TIMEOUT", 30000),
		MaxRetries:     getEnvAsInt("API_MAX_RETRIES", 3),
		AuthType:       getEnv("API_AUTH_TYPE", "none"),
		ApiKey:         getEnv("API_KEY", ""),
		BearerToken:    getEnv("API_BEARER_TOKEN", ""),
		Username:       getEnv("API_USERNAME", ""),
		Password:       getEnv("API_PASSWORD", ""),
		AccessToken:    getEnv("API_ACCESS_TOKEN", ""),
		AuthHeaderName: getEnv("API_AUTH_HEADER_NAME", ""),
	}

	// Set defaults
	if config.Timeout <= 0 {
		config.Timeout = 30000
	}
	if config.MaxRetries <= 0 {
		config.MaxRetries = 3
	}
	if config.AuthType == "" {
		config.AuthType = "none"
	}

	return config
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as an integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}`;
}

/**
 * Generate models
 */
function generateModels() {
  return `package main

import (
	"encoding/json"
	"fmt"
)

// ApiResponse represents an API response
type ApiResponse struct {
	StatusCode    int    \`json:"statusCode"\`
	StatusMessage string \`json:"statusMessage"\`
	Body          string \`json:"body"\`
}

// GetJsonBody returns the response body as a map
func (r *ApiResponse) GetJsonBody() (map[string]interface{}, error) {
	var result map[string]interface{}
	err := json.Unmarshal([]byte(r.Body), &result)
	return result, err
}

// String implements the Stringer interface
func (r *ApiResponse) String() string {
	return fmt.Sprintf("ApiResponse{StatusCode=%d, StatusMessage=\"%s\", Body=\"%s\"}", 
		r.StatusCode, r.StatusMessage, r.Body)
}`;
}

/**
 * Generate test files
 */
function generateTests(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `package main

import (
	"testing"
)

func TestNewApiClient(t *testing.T) {
	client := NewApiClient(nil)
	if client == nil {
		t.Error("Expected client to be created")
	}

	config := client.GetConfig()
	if config == nil {
		t.Error("Expected config to be set")
	}

	if config.AuthType != "none" {
		t.Errorf("Expected auth type to be 'none', got '%s'", config.AuthType)
	}
}

func TestConfig(t *testing.T) {
	config := NewConfig()
	if config == nil {
		t.Error("Expected config to be created")
	}

	if config.Timeout <= 0 {
		t.Error("Expected timeout to be positive")
	}

	if config.MaxRetries <= 0 {
		t.Error("Expected max retries to be positive")
	}
}

${endpoints.map(endpoint => generateEndpointTest(endpoint)).join('\n\n')}

func TestErrorHandling(t *testing.T) {
	// Test error handling with invalid configuration
	config := &Config{
		BaseURL: "invalid-url",
	}
	client := NewApiClient(config)
	
	if client.TestConnection() {
		t.Error("Expected connection test to fail with invalid URL")
	}
}`;
}

/**
 * Generate endpoint test
 */
function generateEndpointTest(endpoint) {
  const { method, path, operationId } = endpoint;
  
  return `func Test${operationId.charAt(0).toUpperCase() + operationId.slice(1)}(t *testing.T) {
	client := NewApiClient(nil)
	if client == nil {
		t.Error("Expected client to be created")
	}
	// Add more specific tests based on the endpoint requirements
}`;
}

/**
 * Generate example usage
 */
function generateExampleUsage(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `package main

import (
	"fmt"
	"log"
)

func main() {
	// Initialize the API client
	client := NewApiClient(nil)
	
	fmt.Println("🚀 ${title} API Client initialized")
	
	// Test connection
	isConnected := client.TestConnection()
	if isConnected {
		fmt.Println("🔗 Connection test: ✅ Success")
	} else {
		fmt.Println("🔗 Connection test: ❌ Failed")
		fmt.Println("❌ Cannot connect to API. Please check your configuration.")
		return
	}

${endpoints.slice(0, 2).map(endpoint => `	// Example: ${endpoint.method} ${endpoint.path}
	fmt.Println("\\n📡 Testing ${endpoint.operationId}...")
	${endpoint.operationId}Result, err := client.${endpoint.operationId.charAt(0).toUpperCase() + operationId.slice(1)}()
	if err != nil {
		fmt.Printf("❌ ${endpoint.operationId} failed: %v\\n", err)
	} else {
		fmt.Printf("✅ ${endpoint.operationId} result: %s\\n", ${endpoint.operationId}Result)
	}`).join('\n\n')}

	fmt.Println("\\n🎉 Example completed successfully!")
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

module.exports = { generateGoCode }; 