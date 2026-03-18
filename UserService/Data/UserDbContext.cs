using Microsoft.EntityFrameworkCore;
using UserService.Models;
using BCrypt.Net;

namespace UserService.Data;

public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Seed default users representing all three assignment roles
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"),
                Role = "Admin"
            },
            new User
            {
                Id = 2,
                Username = "manager1",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager1"),
                Role = "Manager"
            },
            new User
            {
                Id = 3,
                Username = "engineer1",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("engineer1"),
                Role = "Engineer"
            }
        );
    }
}
