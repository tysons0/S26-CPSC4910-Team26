using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface INotificationService
{
    Task<bool> CreateNotification(int userId, string message, string type = "");
    Task MarkNotificationAsSeen(int notificationId);
    Task<List<Notification>?> GetNotificationsForUser(int userId);
}
