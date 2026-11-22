
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

var app = builder.Build();

// ==========================================
// OPENAPI
// ==========================================

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

        if (connected)
        {
            return Results.Ok(new
            {
                status = "Database connected successfully"
            });
        }

        return Results.Problem("Could not connect to the database.");
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
    if (request is null)
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

    if (string.IsNullOrWhiteSpace(createdBy) ||
        createdBy.Length > 100)
    {
        return Results.BadRequest(new
        {
            message = "Enter a teacher name between 1 and 100 characters."
        });
    }

    if (request.Questions == null ||
        request.Questions.Count != 10)
    {
        return Results.BadRequest(new
        {
            message = "A quiz must contain exactly 10 questions."
        });
    }

    // Validate all questions and choices.

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

    // Generate a unique six-character access code.

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
    while (await db.Quizzes.AnyAsync(
        q => q.AccessCode == accessCode));

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
            CorrectOption = item.CorrectOption
                .Trim()
                .ToUpperInvariant()
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

        // CorrectOption is intentionally not included.

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
        .Trim()
        .ToUpperInvariant() ?? "";

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
        isCorrect = isCorrect,
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
