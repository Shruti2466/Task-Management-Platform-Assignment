using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReportingService.Models;

namespace ReportingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IHttpClientFactory httpClientFactory, ILogger<ReportsController> logger)
    {
        _httpClient = httpClientFactory.CreateClient("TaskServiceClient");
        _logger = logger;
    }

    private void InheritAuthToken()
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue(
                    "Bearer", authHeader.Substring("Bearer ".Length).Trim());
        }
    }

    [HttpGet("tasks-by-user")]
    public async Task<IActionResult> GetTasksByUser()
    {
        _logger.LogInformation("Generating tasks-by-user report");
        InheritAuthToken();
        var response = await _httpClient.GetAsync("/api/tasks");
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Failed to fetch tasks from TaskService. Status: {StatusCode}", response.StatusCode);
            return StatusCode((int)response.StatusCode, "Failed to fetch tasks");
        }

        var tasks = await response.Content.ReadFromJsonAsync<List<TaskItemDto>>();
        if (tasks == null) return Ok(new { });

        var byUser = tasks.GroupBy(t => t.AssigneeId).Select(g => new {
            AssigneeId = g.Key,
            TaskCount = g.Count()
        }).ToList();

        _logger.LogInformation("tasks-by-user report generated with {Count} groups", byUser.Count);
        return Ok(byUser);
    }

    [HttpGet("tasks-by-status")]
    public async Task<IActionResult> GetTasksByStatus()
    {
        _logger.LogInformation("Generating tasks-by-status report");
        InheritAuthToken();
        var response = await _httpClient.GetAsync("/api/tasks");
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Failed to fetch tasks from TaskService. Status: {StatusCode}", response.StatusCode);
            return StatusCode((int)response.StatusCode, "Failed to fetch tasks");
        }

        var tasks = await response.Content.ReadFromJsonAsync<List<TaskItemDto>>();
        if (tasks == null) return Ok(new { });

        var byStatus = tasks.GroupBy(t => t.Status).Select(g => new {
            Status = g.Key,
            TaskCount = g.Count()
        }).ToList();

        _logger.LogInformation("tasks-by-status report generated with {Count} groups", byStatus.Count);
        return Ok(byStatus);
    }

    [HttpGet("sla-breach")]
    public async Task<IActionResult> GetSlaBreachReport()
    {
        _logger.LogInformation("Generating SLA breach report");
        InheritAuthToken();
        var response = await _httpClient.GetAsync("/api/tasks");
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Failed to fetch tasks from TaskService. Status: {StatusCode}", response.StatusCode);
            return StatusCode((int)response.StatusCode, "Failed to fetch tasks");
        }

        var tasks = await response.Content.ReadFromJsonAsync<List<TaskItemDto>>();
        if (tasks == null) return Ok(new { });

        var today = DateTime.UtcNow.Date;
        var breaches = tasks
            .Where(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != "Completed")
            .Select(t => new {
                TaskId = t.Id,
                Title = t.Title,
                AssigneeId = t.AssigneeId,
                DaysOverdue = (today - t.DueDate!.Value.Date).Days
            }).ToList();

        _logger.LogInformation("SLA breach report found {Count} overdue tasks", breaches.Count);
        return Ok(breaches);
    }
}
