using System.Text;
using Class4910Api.Configuration.Database;
using Class4910Api.Models;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

namespace Class4910Api.Configuration;

public static class Startup
{
    public const string corsPolicyName = "AllowAll";

    public static WebApplicationBuilder CreateBuilder(WebApplicationBuilder builder)
    {
        builder = AddServices(builder);

        DatabaseConnection dbConn = builder.Configuration.GetRequiredSection("DatabaseConnection").Get<DatabaseConnection>()!;
        SeedDatabaseMethods.SeedDatabase(dbConn.Connection);

        return builder;
    }

    public static WebApplicationBuilder AddServices(WebApplicationBuilder builder)
    {
        JwtSettings jwt = builder.Configuration.GetRequiredSection("JwtSettings").Get<JwtSettings>()!;

        builder.Services.AddControllers();
        builder.Services.AddOpenApi();

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwt.JwtKey)
                        ),
                    ClockSkew = TimeSpan.Zero
                };
            });

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(corsPolicyName, policy =>
            {
                policy
                    .AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        builder = AddLifetimeServices(builder);

        return builder;
    }

    public static WebApplicationBuilder AddLifetimeServices(WebApplicationBuilder builder)
    {
        builder.Services.Configure<JwtSettings>(builder.Configuration.GetRequiredSection("JwtSettings"));
        builder.Services.Configure<AppSettings>(builder.Configuration.GetRequiredSection("AppSettings"));
        builder.Services.Configure<DatabaseConnection>(builder.Configuration.GetRequiredSection("DatabaseConnection"));

        builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<IContextService, ContextService>();
        builder.Services.AddScoped<IUserService, UserService>();

        return builder;
    }

    public static WebApplication ConfigureApp(WebApplicationBuilder builder)
    {
        WebApplication app = builder.Build();

        app.MapOpenApi();
        app.MapScalarApiReference();

        app.UseCors(corsPolicyName);

        app.UseAuthorization();

        app.MapControllers();

        return app;
    }
}
