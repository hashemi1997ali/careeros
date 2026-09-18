using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Dtos;
using server.Extensions;
using server.Models;

using UserEntity = server.Models.User;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/jobs")]
public class JobsController : ControllerBase
{
    private readonly AppDbContext _context;

    public JobsController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<UserEntity?> CurrentUserAsync(CancellationToken cancellationToken)
    {
        var sub = HttpContext.User.Sub();

        if (string.IsNullOrEmpty(sub)) return null;

        return await _context.Users.FirstOrDefaultAsync(u => u.AuthSub == sub, cancellationToken);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var jobs = await _context.JobPostings
            .AsNoTracking()
            .Where(j => j.UserId == user.Id)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(new { jobs = jobs.Select(JobPostingDto.From) });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<JobPostingDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var job = await _context.JobPostings
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == id && j.UserId == user.Id, cancellationToken);

        if (job is null) return NotFound();

        return Ok(JobPostingDto.From(job));
    }

    [HttpPost]
    public async Task<ActionResult<JobPostingDto>> Create(
        JobPostingInput input,
        CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var job = new JobPosting
        {
            UserId = user.Id,
            Title = input.Title,
            Company = input.Company,
            Location = input.Location,
            Url = input.Url,
            Description = input.Description,
            RequiredSkills = input.RequiredSkills,
        };

        _context.JobPostings.Add(job);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = job.Id }, JobPostingDto.From(job));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<JobPostingDto>> Update(
        Guid id,
        JobPostingInput input,
        CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var job = await _context.JobPostings
            .FirstOrDefaultAsync(j => j.Id == id && j.UserId == user.Id, cancellationToken);

        if (job is null) return NotFound();

        job.Title = input.Title;
        job.Company = input.Company;
        job.Location = input.Location;
        job.Url = input.Url;
        job.Description = input.Description;
        job.RequiredSkills = input.RequiredSkills;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(JobPostingDto.From(job));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var user = await CurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var job = await _context.JobPostings
            .FirstOrDefaultAsync(j => j.Id == id && j.UserId == user.Id, cancellationToken);

        if (job is null) return NotFound();

        _context.JobPostings.Remove(job);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
