import { ApplicationLoadBalancedServiceRecordType } from "aws-cdk-lib/aws-ecs-patterns";

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

  postDataWithAuth: async (endpoint, jsonData, token) => {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: jsonData,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("API POST With Auth Error:", error);
      throw error;
    }
  },

  patchDataWithAuth: async (endpoint, jsonData, token) => {
    try {
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: jsonData ? JSON.stringify(jsonData) : null,
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("API PATCH Error:", error);
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
        throw new Error(
          "You must be logged in as a admin or sponsor to register a sponsor",
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
        throw new Error("You must be logged in as a admin to register a admin");
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

  createOrganization: async (orgData) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Creating organization with data:", orgData);
      const response = await apiService.postDataWithAuth(
        "Organization",
        JSON.stringify(orgData),
        token,
      );
      console.log("Organization created successfully:", response);
      return response;
    } catch (error) {
      console.error("Create Organization Error:", error);
      throw error;
    }
  },

  changePassword: async (userName, currentPassword, newPassword) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await fetch(`${BASE_URL}/Auth/password-change`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: userName,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to change password");
      }

      return await response.json();
    } catch (error) {
      console.error("Change password error", error);
      throw error;
    }
  },

  changeDriverPassword: async (currentPassword, newPassword) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/Auth/driver/password-change`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to reset password");
      }

      return await response.json();
    } catch (error) {
      console.error("Driver password reset error", error);
      throw error;
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

  getOrganizations: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found!");
      }

      const response = await fetch(`${BASE_URL}/Organization`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json",
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Failed to get Organization", error);
      throw error;
    }
  },

  getDriverByUserId: async (userId) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      return await apiService.getDataWithAuth(`Driver/${userId}`, token);
    } catch (error) {
      console.error("Failed to get driver profile", error);
      throw error;
    }
  },

  getMySponsorInfo: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      return await apiService.getDataWithAuth("Sponsor/me", token);
    } catch (error) {
      console.error("Failed to get sponsor info", error);
      throw error;
    }
  },

  getCatalog: async (orgId) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Catalog/${orgId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to get catalog", error);
      throw error;
    }
  },

  addCatalogItem: async (orgId, itemData) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Catalog/${orgId}/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ebayItemId: itemData.ebayItemId,
          points: Number(itemData.points),
        }),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to add catalog item", error);
      throw error;
    }
  },

  //Application API Calls
  applyToOrganization: async (orgId, message = "") => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Application/${orgId}/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error("Failed to apply to organization." || error);
      }

      const text = await response.text();
      return { success: true, message: text };
    } catch (error) {
      console.error("Apply to Organization error", error);
      throw error;
    }
  },

  getApplications: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Application`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to get Applications.", error);
      throw error;
    }
  },

  updateApplicationStatus: async (
    applicationId,
    newStatus,
    changeReason = "",
  ) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const params = new URLSearchParams({
        newStatus: newStatus,
        changeReason: changeReason,
      });

      const url = `${BASE_URL}/Application/${applicationId}/status?${params}`;

      console.log("Full URL:", url); // DEBUG - see the exact URL being called
      console.log("Parameters:", { newStatus, changeReason }); // DEBUG

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status); // DEBUG
      const responseText = await response.text();
      console.log("Response text:", responseText); // DEBUG

      if (!response.ok) {
        throw new Error(responseText || "Failed to update application status");
      }

      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error) {
      console.error("Failed to update application status", error);
      throw error;
    }
  },

  getMyApplications: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const allApplications = await apiService.getApplications();
      const currentUser = apiService.getCurrentUser();

      // Get driver info using user ID
      const driverInfo = await apiService.getDriverByUserId(currentUser.id);
      const driverId = driverInfo.driverId;

      console.log("User ID:", currentUser.id);
      console.log("Driver ID:", driverId);

      if (!driverId) {
        console.error("Could not determine driver ID");
        return [];
      }

      const filtered = (
        Array.isArray(allApplications) ? allApplications : []
      ).filter((app) => String(app.driverId) === String(driverId));

      console.log("Filtered applications:", filtered);
      return filtered;
    } catch (error) {
      console.error("Failed to get my applications:", error);
      return [];
    }
  },

  getTokenInfo: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found!");
      }

      const response = await apiService.getDataWithAuth("Auth/me", token);

      return response;
    } catch (error) {
      console.error("Failed to get token info", error);
      throw error;
    }
  },

  //Notifications API Calls
  getNotifications: async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found!");
      }

      const response = await apiService.getDataWithAuth(
        "Notification/me",
        token,
      );

      return response;
    } catch (error) {
      console.error("Failed to get notifications", error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found!");
      }

      const response = await apiService.patchDataWithAuth(
        `Notification/${notificationId}/seen`,
        null,
        token,
      );

      return response;
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      throw error;
    }
  },

  //Driver Address API Calls
  getDriverAddresses: async (driverId) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Driver/${driverId}/address`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Unable to Get Driver Address.");
      throw error;
    }
  },

  addDriverAddress: async (driverId, addressData) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Driver/${driverId}/address`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to add Driver Address.");
      throw error;
    }
  },

  deleteDriverAddress: async (driverId) => {
    try {
      const token = apiService.getToken();
      if (!token) {
        throw new Error("No Authentication token found. Please log in.");
      }

      const response = await fetch(`${BASE_URL}/Driver/${driverId}/address`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to delete driver address.");
      throw error;
    }
  },

  // Sponsor-specific API calls
  getSponsor: async () => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");

      return await apiService.getDataWithAuth("Sponsor/me", token);
    } catch (error) {
      console.error("Failed to get sponsor info", error);
      throw error;
    }
  },
  getSponsorsByOrg: async (orgId) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");
      return await apiService.getDataWithAuth(
        `Sponsor/organization/${orgId}`,
        token,
      );
    } catch (error) {
      console.error("Failed to get sponsors by organization", error);
      throw error;
    }
  },

  // Organization-specific API calls
  getOrganizationById: async (orgId) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");

      return await apiService.getDataWithAuth(`Organization/${orgId}`, token);
    } catch (error) {
      console.error("Failed to get organization info", error);
      throw error;
    }
  },

  // Catalog-specific API calls
  getSponsorCatalog: async (orgId) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");
      return await apiService.getDataWithAuth(`Catalog/${orgId}`, token);
    } catch (error) {
      console.error("Failed to get sponsor catalog", error);
      throw error;
    }
  },

  addCatalogItem: async (orgId, request) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");

      const response = await apiService.postDataWithAuth(
        `Catalog/${orgId}`,
        JSON.stringify(request),
        token,
      );
      return response;
    } catch (error) {
      console.error("Failed to add catalog item", error);
      throw error;
    }
  },

  updateCatalogItem: async (orgId, catalogItemId, request) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");

      const response = await fetch(
        `${BASE_URL}/Catalog/${orgId}/${catalogItemId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to update catalog item", error);
      throw error;
    }
  },

  removeCatalogItem: async (orgId, catalogItemId) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");
      const response = await fetch(
        `${BASE_URL}/Catalog/${orgId}/${catalogItemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to remove catalog item", error);
      throw error;
    }
  },

  // Ebay-specific API calls
  searchEbayProducts: async (keyword, limit = 12) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");
      const params = new URLSearchParams({
        keyword: keyword,
        limit: limit.toString(),
      });
      const response = await fetch(`${BASE_URL}/api/Ebay/products?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to search eBay products", error);
      throw error;
    }
  },

  getEbayProductById: async (itemId) => {
    try {
      const token = apiService.getToken();
      if (!token) throw new Error("No authentication token found!");
      return await apiService.getDataWithAuth(
        `api/Ebay/products/${itemId}`,
        token,
      );
    } catch (error) {
      console.error("Failed to get eBay product by ID", error);
      throw error;
    }
  },
};

export default apiService;
