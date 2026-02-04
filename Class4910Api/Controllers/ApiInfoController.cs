using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using System.Data;
using Microsoft.AspNetCore.Identity;

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
    #endregion

    [HttpGet("TeamInfo")]
    public async Task<ActionResult<TeamInformation>> GetTeamInformation()
    {
        _logger.LogInformation("GetTeamInformation method called.");

        await using MySqlConnection conn = new(_dbConnection);
        await conn.OpenAsync();
        MySqlCommand command = conn.CreateCommand();

        command.CommandText =
            @$"SELECT * 
               FROM TeamInformation 
               ORDER BY {ConstantValues.TeamInfoReleaseDateField.SelectName} DESC
               limit 1";

        await using DbDataReader reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            TeamInformation teamInfo = new()
            {
                TeamNumber = reader.GetInt32(ConstantValues.TeamInfoNumberField.Name),
                Version = reader.GetString(ConstantValues.TeamInfoVersionField.Name),
                ReleaseDate = reader.GetDateTime(ConstantValues.TeamInfoReleaseDateField.Name),
                ProductName = reader.GetString(ConstantValues.TeamInfoProductNameField.Name),
                ProductDescription = reader.GetString(ConstantValues.TeamInfoProductDescriptionField.Name)
            };
            _logger.LogInformation("Team information retrieved: {TeamInfo}", teamInfo);
            return Ok(teamInfo);
        }
        else
        {
            _logger.LogWarning("No team information found in the database.");
            return NotFound("Team information not found.");
        }
    }
}
