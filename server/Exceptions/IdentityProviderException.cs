namespace server.Exceptions;

public class IdentityProviderException(string message, Exception? innerException = null)
    : Exception(message, innerException);
