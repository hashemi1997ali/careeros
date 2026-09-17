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

    public DbSet<User> Users => Set<User>();

    public DbSet<JobPosting> JobPostings => Set<JobPosting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");

            entity.HasIndex(u => u.AuthSub).IsUnique();

            entity.Property(u => u.AuthSub).IsRequired();

            entity.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(u => u.UpdatedAt).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<JobPosting>(entity =>
        {
            entity.Property(j => j.Id).HasDefaultValueSql("gen_random_uuid()");

            entity.Property(j => j.Title).IsRequired();
            entity.Property(j => j.Company).IsRequired();

            entity.Property(j => j.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(j => j.UpdatedAt).HasDefaultValueSql("now()");

            entity
                .HasOne(j => j.User)
                .WithMany(u => u.JobPostings)
                .HasForeignKey(j => j.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(j => j.UserId);
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
                if (entry.State == EntityState.Added) user.CreatedAt = now;
                if (entry.State is EntityState.Added or EntityState.Modified) user.UpdatedAt = now;
            }
            else if (entry.Entity is JobPosting job)
            {
                if (entry.State == EntityState.Added) job.CreatedAt = now;
                if (entry.State is EntityState.Added or EntityState.Modified) job.UpdatedAt = now;
            }
        }
    }
}
