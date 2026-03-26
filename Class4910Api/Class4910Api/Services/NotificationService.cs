using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;
    private readonly string _dbConnection;

    private readonly IEmailService _emailService;


    public NotificationService(ILogger<NotificationService> logger, IOptions<DatabaseConnection> databaseConnection, IEmailService emailService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _emailService = emailService;
    }

    public async Task<bool> CreateNotification(int userId, string message, NotificationType type, bool sendEmail = false)
    {
        try
        {
            _logger.LogInformation("Creating notification[{Type}:{Message}] for User[{Id}].",
                type, message, userId);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"INSERT INTO {NotificationsTable.Name}
                   ({UserIdField.SelectName},
                    {NotificationMessageField.SelectName}, {NotificationTypeField.SelectName}, {NotificationCreatedAtUtcField.SelectName})
                   VALUES
                   (@UserId, @Message, @Type, @CreatedAtUtc)";
            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", userId));
            command.Parameters.Add(NotificationMessageField.GenerateParameter("@Message", message));
            command.Parameters.Add(NotificationTypeField.GenerateParameter("@Type", type.ToString()));
            command.Parameters.Add(NotificationCreatedAtUtcField.GenerateParameter("@CreatedAtUtc", DateTime.UtcNow));

            await command.ExecuteNonQueryAsync();
            
            var (email, enabled, isDisabled) = await GetUserEmailSettings(userId);

            if (sendEmail && enabled && !isDisabled && !string.IsNullOrEmpty(email))
            {
                await _emailService.SendEmailAsync(
                    email,
                    $"New Notification: {type}",
                    message
                );
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification[{Type}:{Message}] for User[{Id}].",
                type, message, userId);
            return false;
        }
    }

    public async Task<List<Notification>?> GetNotificationsForUser(int userId)
    {
        try
        {
            List<Notification> notifications = [];

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {NotificationsTable.GetFields()} 
                   FROM {NotificationsTable.Name}
                   WHERE {UserIdField.SelectName} = @UserId
                   AND {NotificationSeenField.SelectName} = 0";
            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", userId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                notifications.Add(GetNotificationFromReader(reader));
            }

            _logger.LogInformation("Found {Count} notifications for User[{Id}]",
                notifications.Count, userId);

            return notifications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Notifications for User[{Id}]", userId);
            return null;
        }
    }

    public async Task MarkNotificationAsSeen(int notificationId)
    {
        try
        {
            _logger.LogInformation("Marking Notification[{Id}] as seen", notificationId);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"UPDATE {NotificationsTable.Name}
                   SET {NotificationSeenField.SelectName} = 1
                   WHERE {NotificationIdField.SelectName} = @NotifId";
            command.Parameters.Add(UserIdField.GenerateParameter("@NotifId", notificationId));

            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Marked Notification[{Id}] as seen.", notificationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Notification[{Id}] as seen.", notificationId);
        }
    }

    private static Notification GetNotificationFromReader(DbDataReader reader)
    {
        string pfx = "";

        int userId = reader.GetInt32($"{pfx}{UserIdField.Name}");
        int notificationId = reader.GetInt32($"{pfx}{NotificationIdField.Name}");
        string message = reader[$"{pfx}{NotificationMessageField.Name}"].ToString() ?? "";
        DateTime createdAtUtc = reader.GetDateTime($"{pfx}{NotificationCreatedAtUtcField.Name}");
        string type = reader.GetString($"{pfx}{NotificationTypeField.Name}");

        return new Notification()
        {
            UserId = userId,
            NotificationId = notificationId,
            Message = message,
            CreatedAtUtc = createdAtUtc,
            Type = type,
        };
    }

    private async Task<(string? Email, bool EmailEnabled, bool IsDisabled)> GetUserEmailSettings(int userId)
    {
        await using MySqlConnection conn = new(_dbConnection);
        await conn.OpenAsync();

        var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT Email, EmailNotificationsEnabled, Disabled
            FROM Users
            WHERE UserId = @UserId";

        cmd.Parameters.AddWithValue("@UserId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return (
                reader["Email"]?.ToString(),
                Convert.ToBoolean(reader["EmailNotificationsEnabled"]),
                Convert.ToBoolean(reader["Disabled"])
            );
        }

        return (null, false, true);
    }

}
