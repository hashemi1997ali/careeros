using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Exceptions;

namespace server.Infrastructure;

public class ApiExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, detail) = exception switch
        {
            ResourceNotFoundException => (
                StatusCodes.Status404NotFound,
                "Resource not found",
                exception.Message),
            ConflictException => (
                StatusCodes.Status409Conflict,
                "Conflict",
                exception.Message),
            DomainValidationException => (
                StatusCodes.Status400BadRequest,
                "Validation failed",
                exception.Message),
            UserNotProvisionedException => (
                StatusCodes.Status401Unauthorized,
                "Authentication required",
                exception.Message),
            IdentityProviderException => (
                StatusCodes.Status502BadGateway,
                "Identity provider unavailable",
                "The user profile could not be synchronized with the identity provider."),
            AiProviderException => (
                StatusCodes.Status502BadGateway,
                "Analysis unavailable",
                "Analysis was not successful. Please try again."),
            AiRateLimitException => (
                StatusCodes.Status429TooManyRequests,
                "Analysis unavailable",
                exception.Message),
            AiUnavailableException => (
                StatusCodes.Status503ServiceUnavailable,
                "AI unavailable",
                "AI is temporarily unavailable. Please try again later."),
            DbUpdateException => (
                StatusCodes.Status409Conflict,
                "Database conflict",
                "The operation conflicts with the current database state."),
            _ => (
                StatusCodes.Status500InternalServerError,
                "Unexpected server error",
                "An unexpected error occurred.")
        };

        if (httpContext.Request.Path.StartsWithSegments("/api/ai") &&
            statusCode >= StatusCodes.Status500InternalServerError &&
            exception is not AiUnavailableException)
        {
            title = "Analysis unavailable";
            detail = "Analysis was not successful. Please try again.";
        }

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception while processing {Path}", httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Request failed with status {StatusCode}", statusCode);
        }

        httpContext.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

        if (exception is DomainValidationException validationException)
        {
            problemDetails.Extensions["errors"] = validationException.Errors;
        }

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problemDetails,
            Exception = exception
        });
    }
}
