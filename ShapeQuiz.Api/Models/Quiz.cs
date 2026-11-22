namespace ShapeQuiz.Api.Models;

public class Quiz
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string AccessCode { get; set; } = string.Empty;

    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsPublished { get; set; } = false;

    public int StudentLimit { get; set; } = 39;

    public ICollection<Question> Questions { get; set; }
        = new List<Question>();

    public ICollection<Submission> Submissions { get; set; }
        = new List<Submission>();
}