namespace ShapeQuiz.Api.Models;

public class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string FullName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Submission> Submissions { get; set; }
        = new List<Submission>();
}