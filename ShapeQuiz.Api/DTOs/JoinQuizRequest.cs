namespace ShapeQuiz.Api.DTOs;

public class JoinQuizRequest
{
    public string AccessCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}