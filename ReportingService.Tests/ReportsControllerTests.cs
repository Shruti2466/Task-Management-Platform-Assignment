using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using ReportingService.Models;
using Xunit;

namespace ReportingService.Tests;

public class ReportsControllerTests
{
    private Mock<Microsoft.Extensions.Caching.Memory.IMemoryCache> MockCache()
    {
        var mock = new Mock<Microsoft.Extensions.Caching.Memory.IMemoryCache>();
        object? value = null;
        mock.Setup(c => c.TryGetValue(It.IsAny<object>(), out value)).Returns(false);
        mock.Setup(c => c.CreateEntry(It.IsAny<object>())).Returns(new Mock<Microsoft.Extensions.Caching.Memory.ICacheEntry>().Object);
        return mock;
    }

    private Mock<IHttpClientFactory> MockHttpClientFactory(List<TaskItemDto> tasks)
    {
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = JsonContent.Create(tasks)
            });

        var client = new HttpClient(mockHandler.Object)
        {
            BaseAddress = new Uri("http://localhost")
        };

        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(_ => _.CreateClient("TaskServiceClient")).Returns(client);
        return mockFactory;
    }

    [Fact]
    public async Task GetTasksByStatus_ReturnsAggregatedData()
    {
        // Arrange
        var tasks = new List<TaskItemDto>
        {
            new TaskItemDto { Id = 1, Status = "Open", AssigneeId = 1 },
            new TaskItemDto { Id = 2, Status = "Open", AssigneeId = 2 },
            new TaskItemDto { Id = 3, Status = "Completed", AssigneeId = 1 }
        };

        var mockFactory = MockHttpClientFactory(tasks);
        var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<Controllers.ReportsController>>();
        var controller = new Controllers.ReportsController(mockFactory.Object, mockLogger.Object, MockCache().Object);

        // Act
        var result = await controller.GetTasksByStatus();

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var body = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Equal(2, body.Count());
    }

    [Fact]
    public async Task GetTasksByUser_ReturnsAggregatedData()
    {
        // Arrange
        var tasks = new List<TaskItemDto>
        {
            new TaskItemDto { Id = 1, Status = "Open", AssigneeId = 1 },
            new TaskItemDto { Id = 2, Status = "Open", AssigneeId = 1 },
            new TaskItemDto { Id = 3, Status = "Completed", AssigneeId = 2 }
        };

        var mockFactory = MockHttpClientFactory(tasks);
        var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<Controllers.ReportsController>>();
        var controller = new Controllers.ReportsController(mockFactory.Object, mockLogger.Object, MockCache().Object);

        // Act
        var result = await controller.GetTasksByUser();

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var body = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Equal(2, body.Count());
    }

    [Fact]
    public async Task GetSlaBreachReport_ReturnsOverdueTasks()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var tasks = new List<TaskItemDto>
        {
            new TaskItemDto { Id = 1, Title = "Overdue", DueDate = today.AddDays(-1), Status = "Open", AssigneeId = 1 },
            new TaskItemDto { Id = 2, Title = "Not Overdue", DueDate = today.AddDays(1), Status = "Open", AssigneeId = 1 },
            new TaskItemDto { Id = 3, Title = "Overdue but Completed", DueDate = today.AddDays(-1), Status = "Completed", AssigneeId = 2 }
        };

        var mockFactory = MockHttpClientFactory(tasks);
        var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<Controllers.ReportsController>>();
        var controller = new Controllers.ReportsController(mockFactory.Object, mockLogger.Object, MockCache().Object);

        // Act
        var result = await controller.GetSlaBreachReport();

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var body = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Single(body);
    }
}
