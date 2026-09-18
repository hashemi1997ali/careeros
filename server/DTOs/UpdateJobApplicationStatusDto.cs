using System.ComponentModel.DataAnnotations;
using server.Models;

namespace server.DTOs;

public class UpdateJobApplicationStatusDto
{
    [Required]
    [EnumDataType(typeof(JobApplicationStatus))]
    public JobApplicationStatus? Status { get; set; }
}
