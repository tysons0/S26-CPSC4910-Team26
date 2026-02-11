const BASE_URL = "http://team26api.us-east-1.elasticbeanstalk.com";

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
};

//API Service Object
const apiService = {
  //GET request
  getData: async (endpoint) => {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`);
      return await handleResponse(response);
    } catch (error) {
      console.error("API GET Error:", error);
      throw error;
    }
  },

  postData: async (endpoint, data) => {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("API POST Error:", error);
      throw error;
    }
  },

  getTeamInfo: async () => {
    try {
      const response = await fetch(
        "http://team26api.us-east-1.elasticbeanstalk.com/ApiInfo/TeamInfo",
      );
      return await handleResponse(response);
    } catch (error) {
      console.error("API GET Team Info Error:", error);
      throw error;
    }
  },

  registerDriver: async (userData) => {
    try {
      const response = await fetch(`${BASE_URL}/Auth/register/driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: userData.userName,
          password: userData.password,
        }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("API POST Register Driver Error:", error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await fetch(`${BASE_URL}/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: credentials.userName,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Login failed");
      }

      const token = await response.text(); // IMPORTANT: not json()

      // Store token
      localStorage.setItem("token", token);

      const userInfo = await apiService.getUserInfo();

      if (!userInfo) {
        throw new Error("Failed to retrieve user information");
      }

      localStorage.setItem("user", JSON.stringify(userInfo));

      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },

  //Get current user info from API
  getUserInfo: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`${BASE_URL}/Auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(error || "Failed to fetch user info");
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error("Get User Info Error:", error);
      return null;
    }
  },

  //Refresh user info
  refreshUserInfo: async () => {
    try {
      const userInfo = await apiService.getUserInfo();
      if (userInfo) {
        localStorage.setItem("user", JSON.stringify(userInfo));
        return userInfo;
      }
      return null;
    } catch (error) {
      console.error("Refresh User Info Error:", error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  },

  getUserRole: () => {
    const user = apiService.getCurrentUser();
    return user?.role || null;
  },

  hasRole: (role) => {
    const userRole = apiService.getUserRole();
    if (!userRole) return false;
    return userRole.toLowerCase() === role.toLowerCase();
  },
};

export default apiService;
