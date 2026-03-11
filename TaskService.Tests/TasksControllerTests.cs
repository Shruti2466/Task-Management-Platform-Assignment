using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TaskService.Controllers;
using TaskService.Data;
using TaskService.Models;
using Xunit;

namespace TaskService.Tests;

public class TaskLogicUnitTests
{
    private TaskDbContext GetMemoryContext()
    {
        var options = new DbContextOptionsBuilder<TaskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TaskDbContext(options);
    }

    [Fact]
    public async Task UpdateTask_ChangingStatus_CreatesActivityLog()
    {
        // Arrange
        var context = GetMemoryContext();
        var controller = new TasksController(context);
        
        var task = new TaskItem { Title = "Unit Test Task", Status = "Open" };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        var updatedTask = new TaskItem { Title = "Unit Test Task", Status = "In Progress" };

        // Act
        var result = await controller.UpdateTask(task.Id, updatedTask);

        // Assert
        Assert.IsType<NoContentResult>(result);
        var logs = await context.ActivityLogs.ToListAsync();
        Assert.Single(logs);
        Assert.Equal("Open -> In Progress", logs[0].StatusChange);
        Assert.Equal(task.Id, logs[0].TaskId);
    }

    [Fact]
    public async Task CreateTask_SetsDefaultStatusToOpen()
    {
        var context = GetMemoryContext();
        var controller = new TasksController(context);
        
        var task = new TaskItem { Title = "New Task" };
        
        // Act
        var result = await controller.CreateTask(task);
        
        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var createdTask = Assert.IsType<TaskItem>(createdResult.Value);
        Assert.Equal("Open", createdTask.Status);
    }
}

public class TasksApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public TasksApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        // Setup in-memory DB for integration tests
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<TaskDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                services.AddDbContext<TaskDbContext>(options => options.UseInMemoryDatabase("IntegrationDb"));
            });
        });
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes("SuperSecretKeyForTaskManagementPlatform12345!");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, "IntegrationUser") }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = "TaskManagementPlatform",
            Audience = "TaskManagementPlatform",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenHandler.WriteToken(token));
        return client;
    }

    [Fact]
    public async Task Post_And_Get_Task_ReturnsSuccess() 
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var newTask = new TaskItem { Title = "Integration Task", Priority = "High" };

        // Act - Create
        var createResponse = await client.PostAsJsonAsync("/api/tasks", newTask);
        createResponse.EnsureSuccessStatusCode();
        var createdTask = await createResponse.Content.ReadFromJsonAsync<TaskItem>();

        Assert.NotNull(createdTask);
        Assert.Equal("Integration Task", createdTask.Title);

        // Act - Get
        var getResponse = await client.GetAsync($"/api/tasks/{createdTask.Id}");
        getResponse.EnsureSuccessStatusCode();
    }
}
