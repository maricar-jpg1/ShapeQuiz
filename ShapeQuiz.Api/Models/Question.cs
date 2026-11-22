namespace ShapeQuiz.Api.Models;

public class Question
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid QuizId { get; set; }

    public int QuestionNumber { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string CorrectOption { get; set; } = string.Empty;

    public Quiz? Quiz { get; set; }
}