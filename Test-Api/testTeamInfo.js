const baseUrl = "http://team26api.us-east-1.elasticbeanstalk.com";

async function getTeamInfo() {
  const url = baseUrl + "/ApiInfo/TeamInfo";
  const output = document.getElementById("api-output");
  output.textContent = "Loading...";

  try 
  {
    const response = await fetch(url);
    const teamInfo = await response.json(); // ✅ THIS is the object

    console.log("Team Number:", teamInfo.teamNumber);
    console.log("Version:", teamInfo.version);
    console.log("Release Date:", teamInfo.releaseDate);
    console.log("Product Name:", teamInfo.productName);
    console.log("Product Description:", teamInfo.productDescription);

    output.textContent = JSON.stringify(teamInfo);
  } 
  catch (ex) 
  {
    output.textContent = ex.message;
  }
}

document.getElementById("callApiBtn").onclick = getTeamInfo;
