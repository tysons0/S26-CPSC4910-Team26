const BASE_URL = "http://team26api.us-east-1.elasticbeanstalk.com";

const ebayService = {
  searchProducts: async (keyword, limit = 12) => {
    try {
      const params = new URLSearchParams({
        keyword: keyword,
        limit: limit.toString(),
      });

      const response = await fetch(`${BASE_URL}/api/Ebay/products?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Product search failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("eBay Product Search Error:", error);
      throw error;
    }
  },
};

export default ebayService;
