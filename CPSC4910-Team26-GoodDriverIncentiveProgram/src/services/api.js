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
      throw new Error(error);
    }

    const token = await response.text(); // IMPORTANT: not json()

    // Store token
    localStorage.setItem("token", token);

    return token;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
},

};

export default apiService;
