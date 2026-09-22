namespace server.Exceptions;

public sealed class AiUnavailableException(string message, Exception? innerException = null)
    : Exception(message, innerException);
