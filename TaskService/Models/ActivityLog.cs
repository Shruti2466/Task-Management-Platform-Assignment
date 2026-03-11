namespace TaskService.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string StatusChange { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
