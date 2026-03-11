using Microsoft.EntityFrameworkCore;
using UserService.Models;

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
                PasswordHash = "admin",
                Role = "Admin"
            },
            new User
            {
                Id = 2,
                Username = "manager1",
                PasswordHash = "manager1",
                Role = "Manager"
            },
            new User
            {
                Id = 3,
                Username = "engineer1",
                PasswordHash = "engineer1",
                Role = "Engineer"
            }
        );
    }
}
