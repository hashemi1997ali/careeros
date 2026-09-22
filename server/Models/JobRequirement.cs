namespace server.Models;

public class JobRequirement
{
    public int Id { get; set; }

    public int JobApplicationId { get; set; }

    public JobApplication JobApplication { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public bool IsRequired { get; set; } = true;

}
