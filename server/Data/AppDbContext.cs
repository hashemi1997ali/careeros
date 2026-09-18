using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Skill> Skills => Set<Skill>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ProjectSkill> ProjectSkills => Set<ProjectSkill>();

    public DbSet<JobApplication> JobApplications => Set<JobApplication>();

    public DbSet<JobRequirement> JobRequirements => Set<JobRequirement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Skill>(entity =>
        {
            entity.Property(skill => skill.Name).IsRequired();
            entity.Property(skill => skill.Category).IsRequired();
            entity.Property(skill => skill.Level)
                .HasConversion<string>()
                .IsRequired();
            entity.HasIndex(skill => new { skill.Name, skill.Category });
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(project => project.Title).HasMaxLength(150).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(4000).IsRequired();
            entity.Property(project => project.RepositoryUrl).HasMaxLength(2048);
            entity.Property(project => project.LiveUrl).HasMaxLength(2048);
            entity.Property(project => project.CreatedAtUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(project => project.UpdatedAtUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<ProjectSkill>(entity =>
        {
            entity.HasKey(projectSkill => new { projectSkill.ProjectId, projectSkill.SkillId });

            entity.HasOne(projectSkill => projectSkill.Project)
                .WithMany(project => project.ProjectSkills)
                .HasForeignKey(projectSkill => projectSkill.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(projectSkill => projectSkill.Skill)
                .WithMany(skill => skill.ProjectSkills)
                .HasForeignKey(projectSkill => projectSkill.SkillId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JobApplication>(entity =>
        {
            entity.Property(application => application.Company).HasMaxLength(150).IsRequired();
            entity.Property(application => application.Position).HasMaxLength(150).IsRequired();
            entity.Property(application => application.JobUrl).HasMaxLength(2048);
            entity.Property(application => application.Location).HasMaxLength(150);
            entity.Property(application => application.Salary).HasPrecision(12, 2);
            entity.Property(application => application.Status)
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
            entity.Property(application => application.Notes).HasMaxLength(4000);
            entity.Property(application => application.JobDescription).HasMaxLength(30000);
            entity.Property(application => application.CreatedAtUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(application => application.UpdatedAtUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(application => application.Status);
        });

        modelBuilder.Entity<JobRequirement>(entity =>
        {
            entity.ToTable(
                "JobRequirements",
                table => table.HasCheckConstraint(
                    "CK_JobRequirements_Weight",
                    "\"Weight\" BETWEEN 1 AND 5"));
            entity.Property(requirement => requirement.Name).HasMaxLength(100).IsRequired();
            entity.HasIndex(requirement => new { requirement.JobApplicationId, requirement.Name });

            entity.HasOne(requirement => requirement.JobApplication)
                .WithMany(application => application.Requirements)
                .HasForeignKey(requirement => requirement.JobApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
