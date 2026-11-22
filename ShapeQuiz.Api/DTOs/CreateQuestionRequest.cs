using System.ComponentModel.DataAnnotations;

namespace ShapeQuiz.Api.DTOs;

public class CreateQuestionRequest
{
    [Required]
    [StringLength(500)]
    public string QuestionText { get; set; } = string.Empty;

    [Required]
    public string OptionA { get; set; } = string.Empty;

    [Required]
    public string OptionB { get; set; } = string.Empty;

    [Required]
    public string OptionC { get; set; } = string.Empty;

    [Required]
    public string OptionD { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[A-D]$",
        ErrorMessage = "CorrectOption must be A, B, C, or D.")]
    public string CorrectOption { get; set; } = string.Empty;
}