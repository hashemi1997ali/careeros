namespace server.Exceptions;

public sealed class AiRateLimitException(string message) : Exception(message);
