import apiService from "./api";

const ebayService = {
  searchProducts: async (keyword = "electronics", limit = 24, offset = 0) => {
    const token = apiService.getToken(); // <-- pull from localStorage

    if (!token) {
      throw new Error("No auth token found. User may not be logged in.");
    }

    const q = keyword && keyword.trim() !== "" ? keyword : "electronics";

    const params = new URLSearchParams({
      keyword: q,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    // Use apiService to ensure we hit the same backend base URL and auth handling
    const data = await apiService.getDataWithAuth(`api/Ebay/products?${params}`, token);
    return (data && data.products) || [];
  },
};

export default ebayService;
