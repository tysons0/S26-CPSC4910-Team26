const BASE_URL = "http://team26api.us-east-1.elasticbeanstalk.com";

class Api {
  constructor() {
    this.baseURL = BASE_URL;
    this.token = localStorage.getItem("authToken");
  }
}

async function getTeamInfo() {
  const url = BASE_URL + "/ApiInfo/TeamInfo";

  try 
  {
    const response = await fetch(url);
    const teamInfo = await response.json(); 

    return teamInfo;
  } 
  catch (ex) 
  {
    console.log("Error Getting TeamInfo From Api: " + ex.message);
  }
}


const api = new Api();
export default api;
