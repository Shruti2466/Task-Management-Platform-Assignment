using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskService.Data;
using TaskService.Models;

namespace TaskService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly TaskDbContext _context;
    private readonly ILogger<TasksController> _logger;

    public TasksController(TaskDbContext context, ILogger<TasksController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> ListTasks([FromQuery] string? status, [FromQuery] int? assigneeId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        _logger.LogInformation("Listing tasks with filters - Status: {Status}, Assignee: {AssigneeId}", status, assigneeId);
        var query = _context.Tasks.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status == status);

        if (assigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == assigneeId.Value);

        if (fromDate.HasValue)
            query = query.Where(t => t.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(t => t.CreatedAt <= toDate.Value);

        return Ok(await query.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        var activityLogs = await _context.ActivityLogs.Where(a => a.TaskId == id).OrderByDescending(a => a.Timestamp).ToListAsync();

        return Ok(new { Task = task, ActivityLogs = activityLogs });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] TaskItem task)
    {
        _logger.LogInformation("Creating task: {Title}", task.Title);
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(task.Status)) task.Status = "Open";

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var username = User.Identity?.Name ?? "Unknown";
        _context.ActivityLogs.Add(new ActivityLog
        {
            TaskId = task.Id,
            StatusChange = "Created",
            ChangedBy = username,
            Timestamp = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem updatedTask)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        var statusChanged = task.Status != updatedTask.Status;
        var oldStatus = task.Status;

        task.Title = updatedTask.Title;
        task.Description = updatedTask.Description;
        task.Priority = updatedTask.Priority;
        if (!string.IsNullOrEmpty(updatedTask.Status)) task.Status = updatedTask.Status;
        task.AssigneeId = updatedTask.AssigneeId;
        task.DueDate = updatedTask.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        if (statusChanged)
        {
            var username = User.Identity?.Name ?? "Unknown";
            _context.ActivityLogs.Add(new ActivityLog
            {
                TaskId = task.Id,
                StatusChange = $"{oldStatus} -> {task.Status}",
                ChangedBy = username,
                Timestamp = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
