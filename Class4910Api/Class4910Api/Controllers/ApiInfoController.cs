using System.Data;
using System.Data.Common;
using System.Globalization;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

namespace Class4910Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ApiInfoController(ILogger<ApiInfoController> logger, IOptions<DatabaseConnection> dbConnection) : ControllerBase
{
    private readonly ILogger<ApiInfoController> _logger = logger;
    private readonly string _dbConnection = dbConnection.Value.Connection;

    #region Request Testing
    [HttpGet("bad-request")]
    public async Task<ActionResult<string>> GetBadRequest()
    {
        _logger.LogInformation("GetBadResult method called.");
        return BadRequest("This is a bad request response.");
    }
    [HttpGet("unauthorized")]
    public async Task<ActionResult<string>> GetUnauthorized()
    {
        _logger.LogInformation("GetUnauthorizedResult method called.");
        return Unauthorized("This is an unauthorized response.");
    }
    [HttpGet("not-found")]
    public async Task<ActionResult<string>> GetNotFound()
    {
        _logger.LogInformation("GetNotFound method called.");
        return NotFound("This is a not found response.");
    }
    [HttpGet("ok-query")]
    public async Task<ActionResult<string>> GetOkQuery([FromQuery] string input)
    {
        _logger.LogInformation("GetOkQuery method called.");
        return Ok(input);
    }
    [HttpPost("ok-body")]
    public async Task<ActionResult<string>> GetOkBody([FromBody] string input)
    {
        _logger.LogInformation("GetOkQuery method called.");
        return Ok(input);
    }
    #endregion

    [HttpGet("TeamInfo")]
    public async Task<ActionResult<TeamInformation>> GetTeamInformation()
    {
        _logger.LogInformation("GetTeamInformation method called.");

        int TeamNumber;
        string Version;
        DateTime ReleaseDate;
        string ProductName;
        string ProductDescription;
        List<string> TeamMembers = [];

        await using MySqlConnection conn = new(_dbConnection);
        await conn.OpenAsync();
        MySqlCommand command = conn.CreateCommand();

        command.CommandText =
            @$"SELECT * 
               FROM TeamInformation 
               ORDER BY {ConstantValues.TeamInfoReleaseDateField.SelectName} DESC
               limit 1";

        await using (DbDataReader reader = await command.ExecuteReaderAsync())
        {

            // Get just the team information
            if (await reader.ReadAsync())
            {
                TeamNumber = reader.GetInt32(ConstantValues.TeamInfoNumberField.Name);
                Version = reader.GetString(ConstantValues.TeamInfoVersionField.Name);
                ReleaseDate = reader.GetDateTime(ConstantValues.TeamInfoReleaseDateField.Name);
                ProductName = reader.GetString(ConstantValues.TeamInfoProductNameField.Name);
                ProductDescription = reader.GetString(ConstantValues.TeamInfoProductDescriptionField.Name);
            }
            else
            {
                _logger.LogWarning("No team information found in the database.");
                return NotFound("Team information not found.");
            }
        }


        command.CommandText =
            @$"SELECT *
               FROM {ConstantValues.TeamMembersTable.Name}";

        await using (DbDataReader reader = await command.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                TeamMembers.Add(reader.GetString(ConstantValues.TeamMemberNameField.Name));
            }
        }

        TeamInformation teamInfo = new()
        {
            TeamName = ConstantValues.TeamName,
            TeamNumber = TeamNumber,
            Version = Version,
            ReleaseDate = ReleaseDate,
            ProductName = ProductName,
            ProductDescription = ProductDescription,
            TeamMembers = TeamMembers
        };

        _logger.LogInformation("Team information retrieved: {TeamInfo}", teamInfo);
        return Ok(teamInfo);
    }
}
