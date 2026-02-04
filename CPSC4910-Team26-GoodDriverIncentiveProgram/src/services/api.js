const BASE_URL = "http://team26api.us-east-1.elasticbeanstalk.com";

class Api {
  constructor() {
    this.baseURL = BASE_URL;
    this.token = localStorage.getItem("authToken");
  }
}

const api = new Api();
export default api;
