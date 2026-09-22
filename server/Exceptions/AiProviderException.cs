namespace server.Exceptions;

public sealed class AiProviderException(string message, Exception? innerException = null)
    : Exception(message, innerException);
