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
    public async Task<ActionResult<IEnumerable<TaskReadDto>>> ListTasks([FromQuery] string? status, [FromQuery] int? assigneeId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
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

        var tasks = await query.ToListAsync();
        return Ok(tasks.Select(t => new TaskReadDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            Priority = t.Priority,
            Status = t.Status,
            AssigneeId = t.AssigneeId,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            DueDate = t.DueDate
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        var activityLogs = await _context.ActivityLogs.Where(a => a.TaskId == id).OrderByDescending(a => a.Timestamp).ToListAsync();

        return Ok(new 
        { 
            Task = new TaskReadDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                Status = task.Status,
                AssigneeId = task.AssigneeId,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                DueDate = task.DueDate
            }, 
            ActivityLogs = activityLogs 
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> CreateTask([FromBody] TaskCreateDto taskDto)
    {
        _logger.LogInformation("Creating task: {Title}", taskDto.Title);
        
        var task = new TaskItem
        {
            Title = taskDto.Title,
            Description = taskDto.Description,
            Priority = taskDto.Priority,
            AssigneeId = taskDto.AssigneeId,
            DueDate = taskDto.DueDate,
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

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

        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, new TaskReadDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Priority = task.Priority,
            Status = task.Status,
            AssigneeId = task.AssigneeId,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            DueDate = task.DueDate
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskUpdateDto updatedTaskDto)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        var statusChanged = task.Status != updatedTaskDto.Status;
        var oldStatus = task.Status;

        task.Title = updatedTaskDto.Title;
        task.Description = updatedTaskDto.Description;
        task.Priority = updatedTaskDto.Priority;
        task.Status = updatedTaskDto.Status;
        task.AssigneeId = updatedTaskDto.AssigneeId;
        task.DueDate = updatedTaskDto.DueDate;
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

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        _logger.LogInformation("Deleting task: {Id}", id);
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound();

        _context.Tasks.Remove(task);
        
        // Also remove activity logs
        var logs = await _context.ActivityLogs.Where(a => a.TaskId == id).ToListAsync();
        _context.ActivityLogs.RemoveRange(logs);

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
