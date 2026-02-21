const BASE_URL = "https://team26api.cpsc4911.com";

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.title || "Request failed";

    throw new Error(message);
  }

  return data;
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

  getDataWithAuth: async (endpoint, token) => {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("API GET With Auth Error:", error);
      throw error;
    }
  },

  postData: async (endpoint, jsonData) => {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonData,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("API POST Error:", error);
      throw error;
    }
  },

  getTeamInfo: async () => {
    try {
      return await apiService.getData("ApiInfo/TeamInfo");
    } catch (error) {
      console.error("API GET Team Info Error:", error);
      throw error;
    }
  },

  registerDriver: async (userData) => {
    try {
      const registerData = JSON.stringify({
        userName: userData.userName,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      });

      return await apiService.postData("Auth/register/driver", registerData);
    } catch (error) {
      console.error("API POST Register Driver Error:", error);
      throw error;
    }
  },

  registerSponsor: async (userData, orgId) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new error(
          "You must be loggen in as a admin or sponsor to register a sponsor",
        );
      }

      const response = await fetch(
        `${BASE_URL}/Auth/register/sponsor?orgId=${orgId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userName: userData.userName,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
          }),
        },
      );

      return await handleResponse(response);
    } catch (error) {
      console.error("API POST Register Sponsor Error:", error);
      throw error;
    }
  },

  registerAdmin: async (userData) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new error("You must be logged in as a admin to register a admin");
      }

      const response = await fetch(`${BASE_URL}/Auth/register/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userName: userData.userName,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        }),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("API POST Register Admin Error:", error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const loginData = JSON.stringify({
        userName: credentials.userName,
        password: credentials.password,
      });

      const response = await apiService.postData("Auth/login", loginData);

      const token = await response.token;

      console.log("Login successful, received token:", token);
      console.log("User info from login response:", response.user);

      // Store token
      localStorage.setItem("token", token);

      // Store user info
      localStorage.setItem("user", JSON.stringify(response.user));

      return {
        token,
        user: response.user,
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

      const userData = await apiService.getDataWithAuth("Auth/me", token);
      return userData;
    } catch (error) {
      console.error("Get User Info Error:", error);
      return null;
    }
  },

  updateUserProfile: async (userId, userData) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/User/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update profile");
      }

      const updatedUser = await response.json();
      return updatedUser;
    } catch (error) {
      console.error("Update Profile Error:", error);
      throw error;
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
    if (!user) return null;

    try {
      return JSON.parse(user);
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

  isAuthenticated: () => {
    const token = apiService.getToken();
    const user = apiService.getCurrentUser();
    return !!(token && user);
  },
};

export default apiService;
