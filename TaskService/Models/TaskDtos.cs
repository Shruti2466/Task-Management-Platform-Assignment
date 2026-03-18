using System.ComponentModel.DataAnnotations;

namespace TaskService.Models;

public class TaskCreateDto
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [RegularExpression("Low|Medium|High")]
    public string Priority { get; set; } = "Low";

    public int? AssigneeId { get; set; }
    
    public DateTime? DueDate { get; set; }
}

public class TaskUpdateDto
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [RegularExpression("Low|Medium|High")]
    public string Priority { get; set; } = "Low";

    [RegularExpression("Open|In Progress|Blocked|Completed")]
    public string Status { get; set; } = "Open";

    public int? AssigneeId { get; set; }
    
    public DateTime? DueDate { get; set; }
}

public class TaskReadDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? AssigneeId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DueDate { get; set; }
}
