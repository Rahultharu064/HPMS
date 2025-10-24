export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// API Debug Helper
export const apiDebug = {
  log: (message, data = null) => {
    if (import.meta.env.DEV) {
      console.log(`[API Debug] ${message}`, data);
    }
  },

  error: (message, error = null) => {
    console.error(`[API Error] ${message}`, error);
  },

  testConnection: async () => {
    try {
      apiDebug.log("Testing API connection to:", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/rooms`);
      apiDebug.log("Connection test response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });
      return { success: response.ok, status: response.status };
    } catch (error) {
      apiDebug.error("Connection test failed:", error);
      return { success: false, error: error.message };
    }
  },
};

// Enhanced fetch wrapper with better error handling
export const apiRequest = async (url, options = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  apiDebug.log(`Making ${options.method || "GET"} request to:`, fullUrl);

  try {
    const isFormData =
      options &&
      options.body &&
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;
    const headers = {
      ...(options.headers || {}),
    };
    // Only set JSON content-type when NOT sending FormData
    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    apiDebug.log("Response received:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    // Handle 204 No Content or non-JSON responses safely
    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (response.status === 204) {
      data = {};
    } else if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    if (!response.ok) {
      const errorMessage =
        (data && (data.error || data.message)) ||
        (data && Array.isArray(data.errors) && data.errors.join(", ")) ||
        `HTTP ${response.status}: ${response.statusText}`;
      apiDebug.error("API request failed:", {
        status: response.status,
        error: errorMessage,
        data: data,
      });
      throw new Error(errorMessage);
    }

    apiDebug.log("Request successful:", data);
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const networkError = new Error(
        "Network error: Cannot connect to server. Please check if the backend is running.",
      );
      apiDebug.error("Network error detected:", networkError);
      throw networkError;
    }

    apiDebug.error("Request failed:", error);
    throw error;
  }
};
