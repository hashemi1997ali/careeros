using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectSkill> ProjectSkills => Set<ProjectSkill>();
    public DbSet<JobPosting> JobPostings => Set<JobPosting>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<JobRequirement> JobRequirements => Set<JobRequirement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(user => user.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(user => user.AuthSub).IsRequired();
            entity.Property(user => user.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(user => user.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(user => user.AuthSub).IsUnique();
        });

        modelBuilder.Entity<Skill>(entity =>
        {
            entity.Property(skill => skill.Name).IsRequired();
            entity.Property(skill => skill.Category).IsRequired();
            entity.Property(skill => skill.Level)
                .HasConversion<string>()
                .IsRequired();
            entity.HasOne(skill => skill.User)
                .WithMany(user => user.Skills)
                .HasForeignKey(skill => skill.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(skill => new { skill.UserId, skill.Name, skill.Category });
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(project => project.Title).HasMaxLength(150).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(4000).IsRequired();
            entity.Property(project => project.RepositoryUrl).HasMaxLength(2048);
            entity.Property(project => project.LiveUrl).HasMaxLength(2048);
            entity.Property(project => project.CreatedAtUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(project => project.UpdatedAtUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(project => project.User)
                .WithMany(user => user.Projects)
                .HasForeignKey(project => project.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(project => project.UserId);
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

        modelBuilder.Entity<JobPosting>(entity =>
        {
            entity.Property(posting => posting.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(posting => posting.Title).IsRequired();
            entity.Property(posting => posting.Company).IsRequired();
            entity.Property(posting => posting.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(posting => posting.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasOne(posting => posting.User)
                .WithMany(user => user.JobPostings)
                .HasForeignKey(posting => posting.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(posting => posting.UserId);
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
            entity.HasOne(application => application.User)
                .WithMany(user => user.JobApplications)
                .HasForeignKey(application => application.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(application => new { application.UserId, application.Status });
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

    public override int SaveChanges()
    {
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyTimestamps()
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is User user)
            {
                if (entry.State == EntityState.Added)
                {
                    user.CreatedAt = now;
                }

                if (entry.State is EntityState.Added or EntityState.Modified)
                {
                    user.UpdatedAt = now;
                }
            }
            else if (entry.Entity is JobPosting posting)
            {
                if (entry.State == EntityState.Added)
                {
                    posting.CreatedAt = now;
                }

                if (entry.State is EntityState.Added or EntityState.Modified)
                {
                    posting.UpdatedAt = now;
                }
            }
        }
    }
}
