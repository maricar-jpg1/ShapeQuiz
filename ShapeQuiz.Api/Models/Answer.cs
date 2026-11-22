namespace ShapeQuiz.Api.Models;

public class Answer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SubmissionId { get; set; }

    public Guid QuestionId { get; set; }

    public string SelectedOption { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public Submission? Submission { get; set; }

    public Question? Question { get; set; }
}