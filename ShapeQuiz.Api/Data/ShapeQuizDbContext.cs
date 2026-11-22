using Microsoft.EntityFrameworkCore;
using ShapeQuiz.Api.Models;

namespace ShapeQuiz.Api.Data;

public class ShapeQuizDbContext : DbContext
{
    public ShapeQuizDbContext(
        DbContextOptions<ShapeQuizDbContext> options
    ) : base(options)
    {
    }

    public DbSet<Quiz> Quizzes => Set<Quiz>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<Student> Students => Set<Student>();

    public DbSet<Submission> Submissions => Set<Submission>();

    public DbSet<Answer> Answers => Set<Answer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Quiz>()
            .HasIndex(q => q.AccessCode)
            .IsUnique();

        modelBuilder.Entity<Question>()
            .HasIndex(q => new { q.QuizId, q.QuestionNumber })
            .IsUnique();

        modelBuilder.Entity<Submission>()
            .HasIndex(s => new { s.QuizId, s.StudentId })
            .IsUnique();

        modelBuilder.Entity<Answer>()
            .HasIndex(a => new { a.SubmissionId, a.QuestionId })
            .IsUnique();

        modelBuilder.Entity<Quiz>()
            .HasMany(q => q.Questions)
            .WithOne(q => q.Quiz)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Quiz>()
            .HasMany(q => q.Submissions)
            .WithOne(s => s.Quiz)
            .HasForeignKey(s => s.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Student>()
            .HasMany(s => s.Submissions)
            .WithOne(s => s.Student)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Submission>()
            .HasMany(s => s.Answers)
            .WithOne(a => a.Submission)
            .HasForeignKey(a => a.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Question>()
            .HasMany<Answer>()
            .WithOne(a => a.Question)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}