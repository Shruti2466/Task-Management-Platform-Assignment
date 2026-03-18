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
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

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

    private Mock<Microsoft.Extensions.Logging.ILogger<TasksController>> MockLogger() => new Mock<Microsoft.Extensions.Logging.ILogger<TasksController>>();

    [Fact]
    public async Task UpdateTask_ChangingStatus_CreatesActivityLog()
    {
        // Arrange
        var context = GetMemoryContext();
        var controller = new TasksController(context, MockLogger().Object);
        
        var task = new TaskItem { Title = "Unit Test Task", Status = "Open" };
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        var updateDto = new TaskUpdateDto { Title = "Unit Test Task", Status = "In Progress" };

        // Act
        var result = await controller.UpdateTask(task.Id, updateDto);

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
        var controller = new TasksController(context, MockLogger().Object);
        
        var taskDto = new TaskCreateDto { Title = "New Task" };
        
        // Act
        var result = await controller.CreateTask(taskDto);
        
        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var createdTask = Assert.IsType<TaskReadDto>(createdResult.Value);
        Assert.Equal("Open", createdTask.Status);
    }
}

public class TasksApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public TasksApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "Jwt:Key", "IntegrationTestSecretKey1234567890!" }
                });
            });
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
        var key = Encoding.UTF8.GetBytes(Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"));
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { 
                new Claim(ClaimTypes.Name, "IntegrationUser"),
                new Claim(ClaimTypes.Role, "Admin") 
            }),
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
        var newTask = new TaskCreateDto { Title = "Integration Task", Priority = "High" };

        // Act - Create
        var createResponse = await client.PostAsJsonAsync("/api/tasks", newTask);
        createResponse.EnsureSuccessStatusCode();
        var createdTask = await createResponse.Content.ReadFromJsonAsync<TaskReadDto>();

        Assert.NotNull(createdTask);
        Assert.Equal("Integration Task", createdTask.Title);

        // Act - Get
        var getResponse = await client.GetAsync($"/api/tasks/{createdTask.Id}");
        getResponse.EnsureSuccessStatusCode();
    }
}
