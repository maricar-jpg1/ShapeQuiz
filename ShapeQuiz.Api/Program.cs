
using Microsoft.EntityFrameworkCore;
using ShapeQuiz.Api.Data;
using ShapeQuiz.Api.DTOs;
using ShapeQuiz.Api.Models;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// REGISTER SERVICES
// ==========================================

builder.Services.AddOpenApi();

builder.Services.AddDbContext<ShapeQuizDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ==========================================
// CORS CONFIGURATION
// ==========================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("ShapeQuizFrontend", policy =>
    {
        policy
            .WithOrigins(
                "https://shapequiz-frontend.onrender.com",
                "http://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// ==========================================
// MIDDLEWARE
// ==========================================

app.UseCors("ShapeQuizFrontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// ==========================================
// API HEALTH CHECK
// ==========================================

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "ShapeQuiz API is running"
    });
});

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

app.MapGet("/api/health/database", async (ShapeQuizDbContext db) =>
{
    try
    {
        bool connected = await db.Database.CanConnectAsync();

        return connected
            ? Results.Ok(new { status = "Database connected successfully" })
            : Results.Problem("Could not connect to the database.");
    }
    catch
    {
        return Results.Problem(
            "Database connection failed. Check your configuration."
        );
    }
});

// ==========================================
// CREATE AND PUBLISH QUIZ
// ==========================================

app.MapPost("/api/quizzes", async (
    CreateQuizRequest? request,
    ShapeQuizDbContext db) =>
{
    if (request == null)
    {
        return Results.BadRequest(new
        {
            message = "Quiz request is required."
        });
    }

    string title = request.Title?.Trim() ?? "";
    string createdBy = request.CreatedBy?.Trim() ?? "";

    if (string.IsNullOrWhiteSpace(title) || title.Length > 100)
    {
        return Results.BadRequest(new
        {
            message = "Enter a quiz title between 1 and 100 characters."
        });
    }

    if (string.IsNullOrWhiteSpace(createdBy) || createdBy.Length > 100)
    {
        return Results.BadRequest(new
        {
            message = "Enter a valid teacher name."
        });
    }

    if (request.Questions == null || request.Questions.Count != 10)
    {
        return Results.BadRequest(new
        {
            message = "A quiz must contain exactly 10 questions."
        });
    }

    // Validate all questions.

    for (int i = 0; i < request.Questions.Count; i++)
    {
        var question = request.Questions[i];

        if (question == null)
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} is required."
            });
        }

        string questionText = question.QuestionText?.Trim() ?? "";

        var options = new[]
        {
            question.OptionA?.Trim() ?? "",
            question.OptionB?.Trim() ?? "",
            question.OptionC?.Trim() ?? "",
            question.OptionD?.Trim() ?? ""
        };

        string correctOption =
            question.CorrectOption?.Trim().ToUpperInvariant() ?? "";

        if (string.IsNullOrWhiteSpace(questionText) ||
            questionText.Length > 500)
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} must have valid text."
            });
        }

        if (options.Any(string.IsNullOrWhiteSpace) ||
            options.Any(option => option.Length > 200))
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} must have four valid choices."
            });
        }

        if (options.Distinct(
            StringComparer.OrdinalIgnoreCase).Count() != 4)
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} must have four different choices."
            });
        }

        if (!new[] { "A", "B", "C", "D" }.Contains(correctOption))
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} has an invalid correct option."
            });
        }
    }

    // Generate unique access code.

    const string characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    string accessCode;

    do
    {
        accessCode = new string(
            Enumerable.Range(0, 6)
                .Select(_ => characters[
                    RandomNumberGenerator.GetInt32(characters.Length)
                ])
                .ToArray()
        );
    }
    while (await db.Quizzes.AnyAsync(q => q.AccessCode == accessCode));

    // Create quiz.

    var quiz = new Quiz
    {
        Title = title,
        CreatedBy = createdBy,
        AccessCode = accessCode,
        CreatedAt = DateTime.UtcNow,
        IsPublished = true,
        StudentLimit = 39
    };

    for (int i = 0; i < request.Questions.Count; i++)
    {
        var item = request.Questions[i];

        quiz.Questions.Add(new Question
        {
            QuestionNumber = i + 1,
            QuestionText = item.QuestionText.Trim(),
            OptionA = item.OptionA.Trim(),
            OptionB = item.OptionB.Trim(),
            OptionC = item.OptionC.Trim(),
            OptionD = item.OptionD.Trim(),
            CorrectOption = item.CorrectOption.Trim().ToUpperInvariant()
        });
    }

    db.Quizzes.Add(quiz);

    await db.SaveChangesAsync();

    return Results.Created(
        $"/api/quizzes/{quiz.Id}",
        new
        {
            message = "Quiz created and published successfully.",
            quizId = quiz.Id,
            title = quiz.Title,
            accessCode = quiz.AccessCode,
            totalQuestions = quiz.Questions.Count,
            studentLimit = quiz.StudentLimit,
            isPublished = quiz.IsPublished
        }
    );
});

// ==========================================
// GET QUIZ FOR EDITING
// ==========================================

app.MapGet("/api/quizzes/{accessCode}/edit", async (
    string accessCode,
    ShapeQuizDbContext db) =>
{
    string code = accessCode.Trim().ToUpperInvariant();

    var quiz = await db.Quizzes
        .Include(q => q.Questions)
        .FirstOrDefaultAsync(q => q.AccessCode == code);

    if (quiz == null)
    {
        return Results.NotFound(new
        {
            message = "Quiz not found."
        });
    }

    bool hasStudents = await db.Submissions
        .AnyAsync(s => s.QuizId == quiz.Id);

    if (hasStudents)
    {
        return Results.BadRequest(new
        {
            message = "This quiz cannot be edited because students have already joined."
        });
    }

    return Results.Ok(new
    {
        quiz.Title,
        quiz.AccessCode,
        quiz.CreatedBy,

        questions = quiz.Questions
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new
            {
                q.Id,
                q.QuestionNumber,
                q.QuestionText,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD,
                q.CorrectOption
            })
    });
});

// ==========================================
// UPDATE EXISTING QUIZ
// ==========================================

app.MapPut("/api/quizzes/{accessCode}", async (
    string accessCode,
    CreateQuizRequest? request,
    ShapeQuizDbContext db) =>
{
    if (request == null || request.Questions == null ||
        request.Questions.Count != 10)
    {
        return Results.BadRequest(new
        {
            message = "The quiz must contain exactly 10 questions."
        });
    }

    string code = accessCode.Trim().ToUpperInvariant();
    string title = request.Title?.Trim() ?? "";

    if (string.IsNullOrWhiteSpace(title) || title.Length > 100)
    {
        return Results.BadRequest(new
        {
            message = "Enter a valid quiz title."
        });
    }

    // Validate before updating.

    for (int i = 0; i < request.Questions.Count; i++)
    {
        var item = request.Questions[i];

        if (item == null)
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} is required."
            });
        }

        string questionText = item.QuestionText?.Trim() ?? "";

        var options = new[]
        {
            item.OptionA?.Trim() ?? "",
            item.OptionB?.Trim() ?? "",
            item.OptionC?.Trim() ?? "",
            item.OptionD?.Trim() ?? ""
        };

        string correct = item.CorrectOption?
            .Trim().ToUpperInvariant() ?? "";

        if (string.IsNullOrWhiteSpace(questionText) ||
            questionText.Length > 500)
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} has invalid text."
            });
        }

        if (options.Any(string.IsNullOrWhiteSpace) ||
            options.Any(x => x.Length > 200))
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} must have four valid choices."
            });
        }

        if (options.Distinct(
            StringComparer.OrdinalIgnoreCase).Count() != 4)
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} must have four different choices."
            });
        }

        if (!new[] { "A", "B", "C", "D" }.Contains(correct))
        {
            return Results.BadRequest(new
            {
                message = $"Question {i + 1} has an invalid correct answer."
            });
        }
    }

    // Start transaction.

    await using var transaction =
        await db.Database.BeginTransactionAsync();

    var quiz = await db.Quizzes
        .Include(q => q.Questions)
        .FirstOrDefaultAsync(q => q.AccessCode == code);

    if (quiz == null)
    {
        return Results.NotFound(new
        {
            message = "Quiz not found."
        });
    }

    // Do not allow edits after students join.

    bool hasStudents = await db.Submissions
        .AnyAsync(s => s.QuizId == quiz.Id);

    if (hasStudents)
    {
        return Results.BadRequest(new
        {
            message = "Editing is disabled because students have already joined this quiz."
        });
    }

    if (quiz.Questions.Count != 10)
    {
        return Results.BadRequest(new
        {
            message = "The existing quiz does not contain exactly 10 questions."
        });
    }

    // Update existing records.

    quiz.Title = title;

    var existingQuestions = quiz.Questions
        .OrderBy(q => q.QuestionNumber)
        .ToList();

    for (int i = 0; i < 10; i++)
    {
        var item = request.Questions[i];
        var existing = existingQuestions[i];

        existing.QuestionText = item.QuestionText.Trim();
        existing.OptionA = item.OptionA.Trim();
        existing.OptionB = item.OptionB.Trim();
        existing.OptionC = item.OptionC.Trim();
        existing.OptionD = item.OptionD.Trim();
        existing.CorrectOption =
            item.CorrectOption.Trim().ToUpperInvariant();
    }

    await db.SaveChangesAsync();
    await transaction.CommitAsync();

    return Results.Ok(new
    {
        message = "Quiz updated successfully.",
        title = quiz.Title,
        accessCode = quiz.AccessCode,
        totalQuestions = quiz.Questions.Count
    });
});

// ==========================================
// STUDENT JOINS QUIZ
// ==========================================

app.MapPost("/api/student/join", async (
    JoinQuizRequest? request,
    ShapeQuizDbContext db) =>
{
    if (request == null)
    {
        return Results.BadRequest(new
        {
            message = "Student information is required."
        });
    }

    string code = request.AccessCode?.Trim().ToUpperInvariant() ?? "";
    string name = request.FullName?.Trim() ?? "";

    if (string.IsNullOrWhiteSpace(code) ||
        string.IsNullOrWhiteSpace(name) ||
        name.Length > 100)
    {
        return Results.BadRequest(new
        {
            message = "Enter a valid access code and student name."
        });
    }

    var quiz = await db.Quizzes
        .Include(q => q.Questions)
        .FirstOrDefaultAsync(q =>
            q.AccessCode == code && q.IsPublished);

    if (quiz == null)
    {
        return Results.NotFound(new
        {
            message = "Quiz not found. Check your access code."
        });
    }

    int joinedCount = await db.Submissions
        .CountAsync(s => s.QuizId == quiz.Id);

    if (joinedCount >= quiz.StudentLimit)
    {
        return Results.BadRequest(new
        {
            message = "This quiz has reached its student limit."
        });
    }

    bool alreadyJoined = await db.Submissions
        .Include(s => s.Student)
        .AnyAsync(s =>
            s.QuizId == quiz.Id &&
            s.Student != null &&
            s.Student.FullName.ToLower() == name.ToLower());

    if (alreadyJoined)
    {
        return Results.Conflict(new
        {
            message = "This student has already joined the quiz."
        });
    }

    var student = new Student
    {
        FullName = name
    };

    var submission = new Submission
    {
        QuizId = quiz.Id,
        Student = student,
        Score = 0,
        TotalQuestions = quiz.Questions.Count
    };

    db.Submissions.Add(submission);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "You joined the quiz successfully.",
        submissionId = submission.Id,
        studentId = student.Id,
        studentName = student.FullName,
        quizId = quiz.Id,
        quizTitle = quiz.Title,
        totalQuestions = quiz.Questions.Count,

        // Never send correct answers before students answer.

        questions = quiz.Questions
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new
            {
                q.Id,
                q.QuestionNumber,
                q.QuestionText,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD
            })
    });
});

// ==========================================
// STUDENT SUBMITS AN ANSWER
// ==========================================

app.MapPost("/api/student/answer", async (
    SubmitAnswerRequest? request,
    ShapeQuizDbContext db) =>
{
    if (request == null ||
        request.SubmissionId == Guid.Empty ||
        request.QuestionId == Guid.Empty)
    {
        return Results.BadRequest(new
        {
            message = "Valid submission and question IDs are required."
        });
    }

    string selected = request.SelectedOption?
        .Trim().ToUpperInvariant() ?? "";

    if (!new[] { "A", "B", "C", "D" }.Contains(selected))
    {
        return Results.BadRequest(new
        {
            message = "Select an option from A to D."
        });
    }

    var submission = await db.Submissions
        .FirstOrDefaultAsync(s => s.Id == request.SubmissionId);

    if (submission == null)
    {
        return Results.NotFound(new
        {
            message = "Student submission not found."
        });
    }

    var question = await db.Questions
        .FirstOrDefaultAsync(q =>
            q.Id == request.QuestionId &&
            q.QuizId == submission.QuizId);

    if (question == null)
    {
        return Results.NotFound(new
        {
            message = "Question not found."
        });
    }

    bool alreadyAnswered = await db.Answers.AnyAsync(a =>
        a.SubmissionId == submission.Id &&
        a.QuestionId == question.Id);

    if (alreadyAnswered)
    {
        return Results.Conflict(new
        {
            message = "You have already answered this question."
        });
    }

    bool isCorrect = selected == question.CorrectOption;

    var answer = new Answer
    {
        SubmissionId = submission.Id,
        QuestionId = question.Id,
        SelectedOption = selected,
        IsCorrect = isCorrect
    };

    db.Answers.Add(answer);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Answer saved successfully.",
        questionId = question.Id,
        selectedOption = selected,
        isCorrect,
        correctOption = question.CorrectOption
    });
});

// ==========================================
// FINISH QUIZ AND CALCULATE SCORE
// ==========================================

app.MapPost("/api/student/finish/{submissionId:guid}",
    async (Guid submissionId, ShapeQuizDbContext db) =>
{
    var submission = await db.Submissions
        .Include(s => s.Answers)
        .FirstOrDefaultAsync(s => s.Id == submissionId);

    if (submission == null)
    {
        return Results.NotFound(new
        {
            message = "Submission not found."
        });
    }

    int totalQuestions = await db.Questions
        .CountAsync(q => q.QuizId == submission.QuizId);

    int answeredQuestions = submission.Answers.Count;

    if (answeredQuestions != totalQuestions)
    {
        return Results.BadRequest(new
        {
            message = "Answer all questions before finishing.",
            answeredQuestions,
            totalQuestions
        });
    }

    submission.Score = submission.Answers.Count(a => a.IsCorrect);
    submission.TotalQuestions = totalQuestions;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "Quiz completed successfully.",
        score = submission.Score,
        totalQuestions = submission.TotalQuestions,
        percentage = totalQuestions == 0
            ? 0
            : Math.Round(
                (double)submission.Score / totalQuestions * 100,
                2
            )
    });
});

// ==========================================
// LEADERBOARD
// ==========================================

app.MapGet("/api/student/leaderboard/{accessCode}",
    async (string accessCode, ShapeQuizDbContext db) =>
{
    string code = accessCode.Trim().ToUpperInvariant();

    var quiz = await db.Quizzes
        .FirstOrDefaultAsync(q => q.AccessCode == code);

    if (quiz == null)
    {
        return Results.NotFound(new
        {
            message = "Quiz not found."
        });
    }

    var leaderboard = await db.Submissions
        .Where(s => s.QuizId == quiz.Id)
        .Include(s => s.Student)
        .OrderByDescending(s => s.Score)
        .ThenBy(s => s.SubmittedAt)
        .Select(s => new
        {
            studentName = s.Student!.FullName,
            s.Score,
            s.TotalQuestions,
            s.SubmittedAt
        })
        .ToListAsync();

    return Results.Ok(new
    {
        quizTitle = quiz.Title,
        leaderboard
    });
});

// ==========================================
// RUN APPLICATION
// ==========================================

app.Run();
