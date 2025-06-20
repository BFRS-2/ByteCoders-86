/**
 * Generate Java integration code
 * @param {Object} parsedData - Parsed API data
 * @param {string} fileName - Original file name
 * @returns {Object} Generated code files
 */
async function generateJavaCode(parsedData, fileName) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  const generatedCode = {};
  
  // Maven pom.xml
  generatedCode['pom.xml'] = generatePomXml(title);
  
  // Main API client
  generatedCode['src/main/java/com/example/ApiClient.java'] = generateApiClient(parsedData);
  
  // Authentication handler
  generatedCode['src/main/java/com/example/auth/AuthHandler.java'] = generateAuthHandler(authMethod);
  
  // Request handler
  generatedCode['src/main/java/com/example/utils/RequestHandler.java'] = generateRequestHandler();
  
  // Error handler
  generatedCode['src/main/java/com/example/utils/ErrorHandler.java'] = generateErrorHandler();
  
  // Configuration
  generatedCode['src/main/java/com/example/config/Config.java'] = generateConfig();
  
  // Response models
  generatedCode['src/main/java/com/example/models/ApiResponse.java'] = generateApiResponse();
  
  // Test files
  generatedCode['src/test/java/com/example/ApiClientTest.java'] = generateTests(parsedData);
  
  // Example usage
  generatedCode['src/main/java/com/example/ExampleUsage.java'] = generateExampleUsage(parsedData);
  
  // Application properties
  generatedCode['src/main/resources/application.properties'] = generateApplicationProperties(authMethod);
  
  return generatedCode;
}

/**
 * Generate Maven pom.xml
 */
function generatePomXml(title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-integration</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>${title} API Integration</name>
    <description>Auto-generated integration client for ${title}</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- HTTP Client -->
        <dependency>
            <groupId>com.squareup.okhttp3</groupId>
            <artifactId>okhttp</artifactId>
            <version>4.9.3</version>
        </dependency>

        <!-- JSON Processing -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.13.0</version>
        </dependency>

        <!-- Logging -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.32</version>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.8.2</version>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.mockito</groupId>
            <artifactId>mockito-core</artifactId>
            <version>4.2.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>2.22.2</version>
            </plugin>
        </plugins>
    </build>
</project>`;
}

/**
 * Generate main API client
 */
function generateApiClient(parsedData) {
  const { baseUrl, authMethod, endpoints, title } = parsedData;
  
  return `package com.example;

import com.example.auth.AuthHandler;
import com.example.config.Config;
import com.example.models.ApiResponse;
import com.example.utils.RequestHandler;
import com.example.utils.ErrorHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import java.util.concurrent.TimeUnit;

/**
 * ${title} API Client
 * Auto-generated integration client for ${title}
 */
public class ApiClient {
    private final Config config;
    private final AuthHandler authHandler;
    private final RequestHandler requestHandler;
    private final ErrorHandler errorHandler;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ApiClient() {
        this(new Config());
    }

    public ApiClient(Config config) {
        this.config = config;
        this.authHandler = new AuthHandler(config);
        this.requestHandler = new RequestHandler(config);
        this.errorHandler = new ErrorHandler();
        this.objectMapper = new ObjectMapper();
        
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(config.getTimeout(), TimeUnit.MILLISECONDS)
            .readTimeout(config.getTimeout(), TimeUnit.MILLISECONDS)
            .writeTimeout(config.getTimeout(), TimeUnit.MILLISECONDS)
            .build();
    }

${endpoints.map(endpoint => generateEndpointMethod(endpoint)).join('\n\n')}

    /**
     * Test connection to the API
     * @return boolean Connection status
     */
    public boolean testConnection() {
        try {
            ApiResponse response = requestHandler.makeRequest(httpClient, "GET", "/", null, null);
            return response.getStatusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get client configuration
     * @return Config Current configuration
     */
    public Config getConfig() {
        return config;
    }

    /**
     * Close HTTP client resources
     */
    public void close() {
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
            httpClient.connectionPool().evictAll();
        }
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
     * @throws Exception if request fails
     */
    public ApiResponse ${operationId}() throws Exception {`;
  
  if (params.length > 0 || queryParams.length > 0 || hasBody) {
    methodSignature = methodSignature.replace('()', `(${generateMethodParameters(params, queryParams, hasBody)})`);
  }
  
  // Build URL with path parameters
  let urlBuilding = `        String url = "${path}";`;
  params.forEach(param => {
    urlBuilding += `\n        url = url.replace("{${param.name}}", ${param.name});`;
  });
  
  // Build query parameters
  let queryBuilding = '';
  if (queryParams.length > 0) {
    queryBuilding = `\n        StringBuilder queryString = new StringBuilder();`;
    queryParams.forEach((param, index) => {
      if (index === 0) {
        queryBuilding += `\n        if (${param.name} != null) {`;
      } else {
        queryBuilding += `\n        } else if (${param.name} != null) {`;
      }
      queryBuilding += `\n            queryString.append("${param.name}=").append(${param.name});`;
    });
    queryBuilding += `\n        }`;
    queryBuilding += `\n        if (queryString.length() > 0) {`;
    queryBuilding += `\n            url += "?" + queryString.toString();`;
    queryBuilding += `\n        }`;
  }
  
  // Build request body
  let bodyBuilding = '';
  if (hasBody) {
    bodyBuilding = `\n        String requestBody = null;`;
    bodyBuilding += `\n        if (body != null) {`;
    bodyBuilding += `\n            requestBody = objectMapper.writeValueAsString(body);`;
    bodyBuilding += `\n        }`;
  }
  
  const methodBody = `${methodSignature}
${urlBuilding}${queryBuilding}${bodyBuilding}

        return requestHandler.makeRequest(httpClient, "${method}", url, requestBody, authHandler.getAuthHeaders());
    }`;
  
  return methodBody;
}

/**
 * Generate method parameters
 */
function generateMethodParameters(params, queryParams, hasBody) {
  const parameters = [];
  
  params.forEach(param => {
    parameters.push(`String ${param.name}`);
  });
  
  queryParams.forEach(param => {
    parameters.push(`String ${param.name}`);
  });
  
  if (hasBody) {
    parameters.push('Object body');
  }
  
  return parameters.join(', ');
}

/**
 * Generate authentication handler
 */
function generateAuthHandler(authMethod) {
  return `package com.example.auth;

import com.example.config.Config;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;

/**
 * Authentication Handler
 * Handles different types of authentication for API requests
 */
public class AuthHandler {
    private final Config config;

    public AuthHandler(Config config) {
        this.config = config;
    }

    /**
     * Get authentication headers based on configured auth method
     * @return Map<String, String> Authentication headers
     */
    public Map<String, String> getAuthHeaders() {
        String authType = config.getAuthType();
        
        switch (authType) {
            case "bearer":
                return getBearerHeaders();
            case "apiKey":
                return getApiKeyHeaders();
            case "basic":
                return getBasicHeaders();
            case "oauth2":
                return getOAuth2Headers();
            default:
                return new HashMap<>();
        }
    }

    /**
     * Get Bearer token headers
     * @return Map<String, String> Bearer token headers
     */
    private Map<String, String> getBearerHeaders() {
        Map<String, String> headers = new HashMap<>();
        String token = config.getApiKey() != null ? config.getApiKey() : config.getBearerToken();
        
        if (token == null || token.isEmpty()) {
            throw new RuntimeException("Bearer token is required but not provided");
        }
        
        headers.put("Authorization", "Bearer " + token);
        return headers;
    }

    /**
     * Get API Key headers
     * @return Map<String, String> API Key headers
     */
    private Map<String, String> getApiKeyHeaders() {
        Map<String, String> headers = new HashMap<>();
        String apiKey = config.getApiKey();
        
        if (apiKey == null || apiKey.isEmpty()) {
            throw new RuntimeException("API Key is required but not provided");
        }
        
        String headerName = config.getAuthHeaderName() != null ? config.getAuthHeaderName() : "X-API-Key";
        headers.put(headerName, apiKey);
        return headers;
    }

    /**
     * Get Basic authentication headers
     * @return Map<String, String> Basic auth headers
     */
    private Map<String, String> getBasicHeaders() {
        Map<String, String> headers = new HashMap<>();
        String username = config.getUsername();
        String password = config.getPassword();
        
        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            throw new RuntimeException("Username and password are required for Basic authentication");
        }
        
        String credentials = username + ":" + password;
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        headers.put("Authorization", "Basic " + encodedCredentials);
        return headers;
    }

    /**
     * Get OAuth2 headers
     * @return Map<String, String> OAuth2 headers
     */
    private Map<String, String> getOAuth2Headers() {
        Map<String, String> headers = new HashMap<>();
        String accessToken = config.getAccessToken();
        
        if (accessToken == null || accessToken.isEmpty()) {
            throw new RuntimeException("OAuth2 access token is required but not provided");
        }
        
        headers.put("Authorization", "Bearer " + accessToken);
        return headers;
    }
}`;
}

/**
 * Generate request handler
 */
function generateRequestHandler() {
  return `package com.example.utils;

import com.example.config.Config;
import com.example.models.ApiResponse;
import okhttp3.*;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Request Handler
 * Handles HTTP requests with retry logic and proper error handling
 */
public class RequestHandler {
    private final Config config;

    public RequestHandler(Config config) {
        this.config = config;
    }

    /**
     * Make HTTP request with retry logic
     * @param client OkHttpClient instance
     * @param method HTTP method
     * @param url Request URL
     * @param body Request body
     * @param headers Request headers
     * @return ApiResponse Response data
     * @throws Exception if request fails
     */
    public ApiResponse makeRequest(OkHttpClient client, String method, String url, 
                                 String body, Map<String, String> headers) throws Exception {
        int maxRetries = config.getMaxRetries();
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return executeRequest(client, method, url, body, headers);
            } catch (Exception e) {
                lastException = e;
                
                // Don't retry on client errors (4xx) except 429 (rate limit)
                if (e instanceof ApiException) {
                    ApiException apiException = (ApiException) e;
                    if (apiException.getStatusCode() >= 400 && apiException.getStatusCode() < 500 
                        && apiException.getStatusCode() != 429) {
                        throw e;
                    }
                }
                
                // Don't retry on server errors (5xx) if it's the last attempt
                if (attempt == maxRetries) {
                    throw e;
                }
                
                // Wait before retrying (exponential backoff)
                long delay = Math.min(1000L * (long) Math.pow(2, attempt - 1), 10000L);
                Thread.sleep(delay);
            }
        }

        throw lastException;
    }

    /**
     * Execute single HTTP request
     * @param client OkHttpClient instance
     * @param method HTTP method
     * @param url Request URL
     * @param body Request body
     * @param headers Request headers
     * @return ApiResponse Response data
     * @throws Exception if request fails
     */
    private ApiResponse executeRequest(OkHttpClient client, String method, String url, 
                                     String body, Map<String, String> headers) throws Exception {
        Request.Builder requestBuilder = new Request.Builder()
            .url(config.getBaseUrl() + url);

        // Add headers
        if (headers != null) {
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                requestBuilder.addHeader(entry.getKey(), entry.getValue());
            }
        }

        // Add request body
        if (body != null && !method.equals("GET") && !method.equals("DELETE")) {
            RequestBody requestBody = RequestBody.create(body, MediaType.get("application/json"));
            requestBuilder.method(method, requestBody);
        } else {
            requestBuilder.method(method, null);
        }

        Request request = requestBuilder.build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            
            if (!response.isSuccessful()) {
                throw new ApiException(response.code(), response.message(), responseBody);
            }
            
            return new ApiResponse(response.code(), response.message(), responseBody);
        } catch (IOException e) {
            throw new RuntimeException("Request failed: " + e.getMessage(), e);
        }
    }
}`;
}

/**
 * Generate error handler
 */
function generateErrorHandler() {
  return `package com.example.utils;

/**
 * Error Handler
 * Handles and formats API errors consistently
 */
public class ErrorHandler {
    
    /**
     * Custom API Exception
     */
    public static class ApiException extends RuntimeException {
        private final int statusCode;
        private final String responseBody;

        public ApiException(int statusCode, String message, String responseBody) {
            super(message);
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        public int getStatusCode() {
            return statusCode;
        }

        public String getResponseBody() {
            return responseBody;
        }

        @Override
        public String toString() {
            return String.format("ApiException{statusCode=%d, message='%s', responseBody='%s'}", 
                               statusCode, getMessage(), responseBody);
        }
    }
}`;
}

/**
 * Generate configuration
 */
function generateConfig() {
  return `package com.example.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Configuration Manager
 * Manages API client configuration with properties file support
 */
public class Config {
    private String baseUrl;
    private int timeout;
    private int maxRetries;
    private String authType;
    private String apiKey;
    private String bearerToken;
    private String username;
    private String password;
    private String accessToken;
    private String authHeaderName;

    public Config() {
        loadProperties();
        setDefaults();
    }

    /**
     * Load configuration from properties file
     */
    private void loadProperties() {
        Properties props = new Properties();
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("application.properties")) {
            if (input != null) {
                props.load(input);
                
                this.baseUrl = props.getProperty("api.baseUrl", "");
                this.timeout = Integer.parseInt(props.getProperty("api.timeout", "30000"));
                this.maxRetries = Integer.parseInt(props.getProperty("api.maxRetries", "3"));
                this.authType = props.getProperty("api.authType", "none");
                this.apiKey = props.getProperty("api.apiKey");
                this.bearerToken = props.getProperty("api.bearerToken");
                this.username = props.getProperty("api.username");
                this.password = props.getProperty("api.password");
                this.accessToken = props.getProperty("api.accessToken");
                this.authHeaderName = props.getProperty("api.authHeaderName");
            }
        } catch (IOException e) {
            // Use defaults if properties file not found
        }
    }

    /**
     * Set default values
     */
    private void setDefaults() {
        if (this.timeout <= 0) this.timeout = 30000;
        if (this.maxRetries <= 0) this.maxRetries = 3;
        if (this.authType == null) this.authType = "none";
    }

    // Getters
    public String getBaseUrl() { return baseUrl; }
    public int getTimeout() { return timeout; }
    public int getMaxRetries() { return maxRetries; }
    public String getAuthType() { return authType; }
    public String getApiKey() { return apiKey; }
    public String getBearerToken() { return bearerToken; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getAccessToken() { return accessToken; }
    public String getAuthHeaderName() { return authHeaderName; }

    // Setters
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public void setTimeout(int timeout) { this.timeout = timeout; }
    public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
    public void setAuthType(String authType) { this.authType = authType; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public void setBearerToken(String bearerToken) { this.bearerToken = bearerToken; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setAuthHeaderName(String authHeaderName) { this.authHeaderName = authHeaderName; }
}`;
}

/**
 * Generate API response model
 */
function generateApiResponse() {
  return `package com.example.models;

/**
 * API Response Model
 * Represents a standard API response
 */
public class ApiResponse {
    private final int statusCode;
    private final String statusMessage;
    private final String body;

    public ApiResponse(int statusCode, String statusMessage, String body) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.body = body;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public String getBody() {
        return body;
    }

    @Override
    public String toString() {
        return String.format("ApiResponse{statusCode=%d, statusMessage='%s', body='%s'}", 
                           statusCode, statusMessage, body);
    }
}`;
}

/**
 * Generate test files
 */
function generateTests(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `package com.example;

import com.example.models.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApiClientTest {
    
    private ApiClient apiClient;
    
    @BeforeEach
    void setUp() {
        apiClient = new ApiClient();
    }

    @Test
    void testConfiguration() {
        Config config = apiClient.getConfig();
        assertNotNull(config);
        assertEquals("none", config.getAuthType());
    }

${endpoints.map(endpoint => generateEndpointTest(endpoint)).join('\n\n')}

    @Test
    void testErrorHandling() {
        // Test error handling with invalid configuration
        Config config = new Config();
        config.setBaseUrl("invalid-url");
        ApiClient client = new ApiClient(config);
        
        assertFalse(client.testConnection());
    }
}`;
}

/**
 * Generate endpoint test
 */
function generateEndpointTest(endpoint) {
  const { method, path, operationId } = endpoint;
  
  return `    @Test
    void test${operationId.charAt(0).toUpperCase() + operationId.slice(1)}() {
        // This is a basic test structure
        // In a real implementation, you would mock the HTTP client
        assertNotNull(apiClient);
        // Add more specific tests based on the endpoint requirements
    }`;
}

/**
 * Generate example usage
 */
function generateExampleUsage(parsedData) {
  const { endpoints, title } = parsedData;
  
  return `package com.example;

import com.example.models.ApiResponse;

/**
 * Example usage of ${title} API Client
 */
public class ExampleUsage {
    
    public static void main(String[] args) {
        try {
            // Initialize the API client
            ApiClient client = new ApiClient();
            
            System.out.println("🚀 ${title} API Client initialized");
            
            // Test connection
            boolean isConnected = client.testConnection();
            System.out.println("🔗 Connection test: " + (isConnected ? "✅ Success" : "❌ Failed"));
            
            if (!isConnected) {
                System.err.println("❌ Cannot connect to API. Please check your configuration.");
                return;
            }

${endpoints.slice(0, 2).map(endpoint => `            // Example: ${endpoint.method} ${endpoint.path}
            try {
                System.out.println("\\n📡 Testing ${endpoint.operationId}...");
                ApiResponse ${endpoint.operationId}Result = client.${endpoint.operationId}();
                System.out.println("✅ ${endpoint.operationId} result: " + ${endpoint.operationId}Result);
            } catch (Exception e) {
                System.err.println("❌ ${endpoint.operationId} failed: " + e.getMessage());
            }`).join('\n\n')}

            System.out.println("\\n🎉 Example completed successfully!");
            
            // Clean up resources
            client.close();
            
        } catch (Exception e) {
            System.err.println("💥 Example failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}`;
}

/**
 * Generate application properties
 */
function generateApplicationProperties(authMethod) {
  let properties = `# ${authMethod.type === 'none' ? 'No authentication required' : `${authMethod.type.toUpperCase()} Authentication`}

# API Configuration
api.baseUrl=https://api.example.com
api.timeout=30000
api.maxRetries=3

`;

  switch (authMethod.type) {
    case 'bearer':
      properties += `# Bearer Token Authentication
api.authType=bearer
api.bearerToken=your-bearer-token-here
`;
      break;
      
    case 'apiKey':
      properties += `# API Key Authentication
api.authType=apiKey
api.apiKey=your-api-key-here
api.authHeaderName=X-API-Key
`;
      break;
      
    case 'basic':
      properties += `# Basic Authentication
api.authType=basic
api.username=your-username
api.password=your-password
`;
      break;
      
    case 'oauth2':
      properties += `# OAuth 2.0 Authentication
api.authType=oauth2
api.accessToken=your-access-token-here
`;
      break;
  }

  return properties;
}

module.exports = { generateJavaCode }; 