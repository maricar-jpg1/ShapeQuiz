using System.ComponentModel.DataAnnotations;

namespace ShapeQuiz.Api.DTOs;

public class CreateQuizRequest
{
    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    [Required]
    [MinLength(10)]
    [MaxLength(10)]
    public List<CreateQuestionRequest> Questions { get; set; }
        = new();
}