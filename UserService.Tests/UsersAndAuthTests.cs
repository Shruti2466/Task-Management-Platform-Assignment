using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using UserService.Controllers;
using UserService.Data;
using UserService.Models;
using Xunit;

namespace UserService.Tests;

// ─────────────────────────────────────────────
// Unit Tests — AuthController
// ─────────────────────────────────────────────
public class AuthControllerUnitTests
{
    private UserDbContext GetMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var ctx = new UserDbContext(options);
        ctx.Database.EnsureCreated(); // applies seed data
        return ctx;
    }

    [Fact]
    public void Login_WithValidAdminCredentials_ReturnsToken()
    {
        // Arrange
        var context = GetMemoryContext(Guid.NewGuid().ToString());
        var controller = new AuthController(context);
        var request = new LoginRequest { Username = "admin", Password = "admin" };

        // Act
        var result = controller.Login(request);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var body = ok.Value!.ToString()!;
        Assert.Contains("Token", body);
    }

    [Fact]
    public void Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var context = GetMemoryContext(Guid.NewGuid().ToString());
        var controller = new AuthController(context);
        var request = new LoginRequest { Username = "admin", Password = "wrongpassword" };

        // Act
        var result = controller.Login(request);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }
}

// ─────────────────────────────────────────────
// Unit Tests — UsersController (Role-based access)
// ─────────────────────────────────────────────
public class UsersControllerUnitTests
{
    private UserDbContext GetMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var ctx = new UserDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    private UsersController CreateControllerWithRole(UserDbContext ctx, string role)
    {
        var controller = new UsersController(ctx);
        // Simulate a logged-in user with the given role via HttpContext
        var claims = new[] { new Claim(ClaimTypes.Name, "testuser"), new Claim(ClaimTypes.Role, role) };
        var identity = new ClaimsIdentity(claims, "Test");
        var user = new System.Security.Claims.ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    [Fact]
    public async Task GetUser_WithExistingId_ReturnsUser()
    {
        // Arrange
        var ctx = GetMemoryContext(Guid.NewGuid().ToString());
        var controller = CreateControllerWithRole(ctx, "Admin");

        // Act — admin user seeded with Id=1
        var result = await controller.GetUser(1);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var returnedUser = Assert.IsType<User>(ok.Value);
        Assert.Equal("admin", returnedUser.Username);
    }

    [Fact]
    public async Task GetUser_WithNonExistingId_ReturnsNotFound()
    {
        var ctx = GetMemoryContext(Guid.NewGuid().ToString());
        var controller = CreateControllerWithRole(ctx, "Admin");

        var result = await controller.GetUser(999);

        Assert.IsType<NotFoundResult>(result);
    }
}

// ─────────────────────────────────────────────
// Integration Tests — UserService HTTP
// ─────────────────────────────────────────────
public class UserServiceIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public UserServiceIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace the real DB with an in-memory DB for isolation
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<UserDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                services.AddDbContext<UserDbContext>(options => options.UseInMemoryDatabase("IntegrationUserDb"));
            });
        });
    }

    private string GetAdminToken()
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes("SuperSecretKeyForTaskManagementPlatform12345!");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, "admin"),
                new Claim(ClaimTypes.Role, "Admin")
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = "TaskManagementPlatform",
            Audience = "TaskManagementPlatform",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        return tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));
    }

    [Fact]
    public async Task Post_Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Seed the user — the EnsureCreated won't run in integration tests because it's replaced
        // so we POST a login with a user we inject first via the Users endpoint (admin seeded)
        // Actually we need to manually seed since OnModelCreating uses HasData
        // Use the scope approach:
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
            db.Database.EnsureCreated();
        }

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new { username = "admin", password = "admin" });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        Assert.NotNull(body);
        Assert.True(body!.ContainsKey("token") || body.ContainsKey("Token"));
    }

    [Fact]
    public async Task Get_Users_WithoutToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_Users_WithAdminToken_ReturnsOk()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GetAdminToken());

        // Seed
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
            db.Database.EnsureCreated();
        }

        var response = await client.GetAsync("/api/users");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
