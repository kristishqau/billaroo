using Microsoft.IdentityModel.Tokens;
using Server.Models;
using Server.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Server.Services
{
    public interface IAuthService
    {
        void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt);
        bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt);
        string CreateToken(User user);
        PasswordValidationDto ValidatePassword(string password);
        string GenerateSecureToken(int length = 32);
        bool IsValidEmail(string email);
        bool IsValidUsername(string username);
    }

    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            if (string.IsNullOrEmpty(password))
                throw new ArgumentException("Password cannot be null or empty", nameof(password));

            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        public bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
        {
            if (string.IsNullOrEmpty(password) || passwordHash.Length == 0 || passwordSalt.Length == 0)
                return false;

            using (var hmac = new HMACSHA512(passwordSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                return computedHash.SequenceEqual(passwordHash);
            }
        }

        public string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("email_verified", user.IsEmailVerified.ToString().ToLower())
            };

            var tokenKey = _configuration.GetSection("AppSettings:Token").Value;
            if (string.IsNullOrEmpty(tokenKey))
            {
                throw new ArgumentException("JWT Token key is not configured");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Token expires in 7 days
                SigningCredentials = credentials,
                Issuer = _configuration["AppSettings:Issuer"],
                Audience = _configuration["AppSettings:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public PasswordValidationDto ValidatePassword(string password)
        {
            var result = new PasswordValidationDto
            {
                Requirements = new List<string>
                {
                    "At least 6 characters long",
                    "Contains at least one uppercase letter",
                    "Contains at least one lowercase letter",
                    "Contains at least one number",
                    "Contains at least one special character"
                },
                Violations = new List<string>()
            };

            if (string.IsNullOrEmpty(password))
            {
                result.IsValid = false;
                result.Strength = "weak";
                result.Violations.Add("Password is required");
                return result;
            }

            var score = 0;
            var violations = new List<string>();

            // Check length
            if (password.Length < 6)
            {
                violations.Add("Password must be at least 6 characters long");
            }
            else if (password.Length >= 8)
            {
                score++;
            }

            // Check for uppercase
            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                violations.Add("Password must contain at least one uppercase letter");
            }
            else
            {
                score++;
            }

            // Check for lowercase
            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                violations.Add("Password must contain at least one lowercase letter");
            }
            else
            {
                score++;
            }

            // Check for numbers
            if (!Regex.IsMatch(password, @"[0-9]"))
            {
                violations.Add("Password must contain at least one number");
            }
            else
            {
                score++;
            }

            // Check for special characters
            if (!Regex.IsMatch(password, @"[^A-Za-z0-9]"))
            {
                violations.Add("Password must contain at least one special character");
            }
            else
            {
                score++;
            }

            // Check for common passwords (basic check)
            var commonPasswords = new[] { "password", "123456", "password123", "admin", "qwerty", "letmein", "welcome", "monkey", "dragon", "master" };
            if (commonPasswords.Any(cp => password.ToLower().Contains(cp.ToLower())))
            {
                violations.Add("Password contains common patterns and is not secure");
                score = Math.Max(0, score - 2);
            }

            // Additional checks for better security
            if (password.Length > 12)
            {
                score++;
            }

            // Check for repeated characters
            if (Regex.IsMatch(password, @"(.)\1{2,}"))
            {
                violations.Add("Password should not contain repeated characters");
                score = Math.Max(0, score - 1);
            }

            result.Violations = violations;
            result.IsValid = violations.Count == 0;

            // Determine strength based on score
            if (score >= 5)
            {
                result.Strength = "strong";
            }
            else if (score >= 3)
            {
                result.Strength = "medium";
            }
            else
            {
                result.Strength = "weak";
            }

            return result;
        }

        public string GenerateSecureToken(int length = 32)
        {
            if (length <= 0)
                throw new ArgumentException("Length must be positive", nameof(length));

            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[length];
            rng.GetBytes(bytes);

            // Convert to URL-safe base64 string
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        public bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                // Basic regex pattern for email validation
                var emailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

                if (!Regex.IsMatch(email, emailPattern, RegexOptions.IgnoreCase))
                    return false;

                // Additional checks
                if (email.Length > 254) // RFC 5321 limit
                    return false;

                var parts = email.Split('@');
                if (parts.Length != 2)
                    return false;

                var localPart = parts[0];
                var domainPart = parts[1];

                // Local part checks
                if (localPart.Length > 64 || localPart.Length == 0)
                    return false;

                // Domain part checks
                if (domainPart.Length > 253 || domainPart.Length == 0)
                    return false;

                // Check for consecutive dots
                if (email.Contains(".."))
                    return false;

                // Check for valid domain format
                var domainPattern = @"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$";
                return Regex.IsMatch(domainPart, domainPattern, RegexOptions.IgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        public bool IsValidUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            // Username requirements:
            // - 3-50 characters
            // - Can contain letters, numbers, underscores, and hyphens
            // - Must start with a letter or number
            // - Cannot end with underscore or hyphen
            // - Cannot contain consecutive special characters

            if (username.Length < 3 || username.Length > 50)
                return false;

            // Check if starts with letter or number
            if (!char.IsLetterOrDigit(username[0]))
                return false;

            // Check if ends with letter or number
            if (!char.IsLetterOrDigit(username[username.Length - 1]))
                return false;

            // Check for valid characters and no consecutive special characters
            var allowedChars = @"^[a-zA-Z0-9_-]+$";
            if (!Regex.IsMatch(username, allowedChars))
                return false;

            // Check for consecutive special characters
            if (Regex.IsMatch(username, @"[_-]{2,}"))
                return false;

            // Reserved usernames
            var reservedUsernames = new[]
            {
                "admin", "administrator", "root", "user", "guest", "test", "demo",
                "api", "www", "mail", "email", "support", "help", "info", "contact",
                "about", "login", "register", "signup", "signin", "auth", "oauth",
                "null", "undefined", "true", "false"
            };

            if (reservedUsernames.Contains(username.ToLower()))
                return false;

            return true;
        }
    }
}