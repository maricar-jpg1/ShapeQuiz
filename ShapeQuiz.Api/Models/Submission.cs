namespace ShapeQuiz.Api.Models;

public class Submission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid QuizId { get; set; }

    public Guid StudentId { get; set; }

    public int Score { get; set; }

    public int TotalQuestions { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public Quiz? Quiz { get; set; }

    public Student? Student { get; set; }

    public ICollection<Answer> Answers { get; set; }
        = new List<Answer>();
}