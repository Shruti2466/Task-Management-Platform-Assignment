namespace TaskService.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Low"; // Low, Medium, High
    public string Status { get; set; } = "Open"; // Open, In Progress, Blocked, Completed
    public int? AssigneeId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DueDate { get; set; }
}
