namespace ShapeQuiz.Api.DTOs;

public class SubmitAnswerRequest
{
    public Guid SubmissionId { get; set; }
    public Guid QuestionId { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
}