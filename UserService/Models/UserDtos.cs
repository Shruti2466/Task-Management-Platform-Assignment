using System.ComponentModel.DataAnnotations;

namespace UserService.Models;

public class UserCreateDto
{
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [RegularExpression("Admin|Manager|Engineer")]
    public string Role { get; set; } = "Engineer";
}

public class UserUpdateDto
{
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [RegularExpression("Admin|Manager|Engineer")]
    public string Role { get; set; } = "Engineer";
}

public class UserReadDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class LoginRequestDto
{
    [Required]
    public string Username { get; set; } = string.Empty;
    [Required]
    public string Password { get; set; } = string.Empty;
}
