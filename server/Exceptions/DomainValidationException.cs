namespace server.Exceptions;

public class DomainValidationException : Exception
{
    public DomainValidationException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>
        {
            ["request"] = [message]
        };
    }

    public DomainValidationException(string field, string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>
        {
            [field] = [message]
        };
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
