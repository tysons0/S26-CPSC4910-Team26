import apiService from "./api";
const BASE_URL = "https://team26api.cpsc4911.com";

const ebayService = {
  searchProducts: async (keyword, limit = 12) => {
    const token = apiService.getToken(); // <-- pull from localStorage

    if (!token) {
      throw new Error("No auth token found. User may not be logged in.");
    }

    const params = new URLSearchParams({
      keyword: keyword ?? "",
      limit: String(limit),
    });

    const response = await fetch(`${BASE_URL}/api/Ebay/products?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Product search failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.products || [];
  },
};

export default ebayService;
