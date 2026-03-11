using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Moq;
using Moq.Protected;
using ReportingService.Models;
using Xunit;

namespace ReportingService.Tests;

public class ReportsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ReportsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetTasksByStatus_ReturnsAggregatedData()
    {
        // Integration-style test with mocked TaskService response
        // In a real scenario, we might use WireMock or a dedicated test server for TaskService
        // Here we'll use a unit test approach for the logic within the controller
        
        // Arrange
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
                Content = JsonContent.Create(new List<TaskItemDto>
                {
                    new TaskItemDto { Id = 1, Status = "Open", AssigneeId = 1 },
                    new TaskItemDto { Id = 2, Status = "Open", AssigneeId = 2 },
                    new TaskItemDto { Id = 3, Status = "Completed", AssigneeId = 1 }
                })
            });

        var client = new HttpClient(mockHandler.Object)
        {
            BaseAddress = new Uri("http://localhost")
        };

        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(_ => _.CreateClient("TaskServiceClient")).Returns(client);

        var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<Controllers.ReportsController>>();
        var controller = new Controllers.ReportsController(mockFactory.Object, mockLogger.Object);

        // Act
        var result = await controller.GetTasksByStatus();

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var body = okResult.Value as IEnumerable<dynamic>;
        Assert.NotNull(body);
        Assert.Equal(2, body.Count()); // Open and Completed
    }
}
