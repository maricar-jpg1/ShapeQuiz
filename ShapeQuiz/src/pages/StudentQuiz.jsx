
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Send,
  LogOut,
  Trophy,
  Shapes,
  XCircle,
  Medal
} from "lucide-react";

const shapes = [
  { id: "A", symbol: "●", style: "circle" },
  { id: "B", symbol: "▲", style: "triangle" },
  { id: "C", symbol: "■", style: "square" },
  { id: "D", symbol: "◆", style: "diamond" }
];

function StudentQuiz() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResultId, setSubmittedResultId] = useState(null);
  const [error, setError] = useState("");

  // LOAD QUIZ
  useEffect(() => {
    const savedQuiz = localStorage.getItem("shapeQuiz");
    const name = sessionStorage.getItem("studentName");
    const code = sessionStorage.getItem("quizCode");

    if (!name || !code) {
      navigate("/student/login");
      return;
    }

    if (!savedQuiz) {
      setError("No quiz found. Please ask your teacher to create a quiz.");
      return;
    }

    try {
      const parsedQuiz = JSON.parse(savedQuiz);

      if (
        !parsedQuiz.code ||
        parsedQuiz.code.toUpperCase() !== code.toUpperCase()
      ) {
        setError("Invalid quiz access code. Please check with your teacher.");
        return;
      }

      if (
        !Array.isArray(parsedQuiz.questions) ||
        parsedQuiz.questions.length !== 10
      ) {
        setError("The quiz must contain exactly 10 questions.");
        return;
      }

      const validQuestions = parsedQuiz.questions.every(
        (question) =>
          question.id &&
          question.question &&
          Array.isArray(question.options) &&
          question.options.length === 4 &&
          ["A", "B", "C", "D"].includes(question.correctAnswer)
      );

      if (!validQuestions) {
        setError("Some quiz questions are incomplete or invalid.");
        return;
      }

      setQuiz(parsedQuiz);
      setStudentName(name);
    } catch {
      setError("Unable to load the quiz. Please try again.");
    }
  }, [navigate]);

  // SELECT ANSWER
  const selectAnswer = (questionId, answer) => {
    if (submitted || answers[questionId]) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer
    }));
  };

  // CALCULATE SCORE
  const calculateScore = () => {
    if (!quiz) return 0;

    return quiz.questions.filter(
      (question) =>
        answers[question.id] === question.correctAnswer
    ).length;
  };

  // SAVE STUDENT RESULT
  const saveStudentResult = (score) => {
    const storageKey = `shapeQuizResults_${quiz.code}`;

    const previousResults = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    const result = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      studentName,
      score,
      totalQuestions: 10,
      answers: { ...answers },
      submittedAt: new Date().toISOString()
    };

    const updatedResults = [...previousResults, result];

    localStorage.setItem(
      storageKey,
      JSON.stringify(updatedResults)
    );

    return result.id;
  };

  // SUBMIT QUIZ
  const handleSubmit = () => {
    if (!quiz || submitted) return;

    const unanswered = quiz.questions.filter(
      (question) => !answers[question.id]
    );

    if (unanswered.length > 0) {
      setError(
        `You still have ${unanswered.length} unanswered question(s).`
      );
      return;
    }

    try {
      const score = calculateScore();
      const resultId = saveStudentResult(score);

      setSubmittedResultId(resultId);
      setError("");
      setSubmitted(true);
    } catch {
      setError("Unable to save your quiz result. Please try again.");
    }
  };

  // NAVIGATION
  const handleNext = () => {
    if (currentQuestion < 9) {
      setCurrentQuestion((previous) => previous + 1);
      setError("");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
      setError("");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("studentName");
    sessionStorage.removeItem("quizCode");
    navigate("/");
  };

  // LOADING / ERROR
  if (error && !quiz) {
    return (
      <div className="student-quiz-page">
        <div className="student-error-card">
          <Shapes size={45} />
          <h2>Unable to Join Quiz</h2>
          <p>{error}</p>

          <button
            onClick={() => navigate("/student/login")}
            className="student-main-button"
          >
            Back to Student Login
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="student-quiz-page">
        <div className="student-loading">
          Loading your classroom quiz...
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / 10) * 100;

  const selectedAnswer = answers[question.id];

  // RESULT SCREEN
  if (submitted) {
    const score = calculateScore();

    const storageKey = `shapeQuizResults_${quiz.code}`;

    const results = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    const rankedResults = [...results].sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.submittedAt) - new Date(b.submittedAt)
    );

    const myRank =
      rankedResults.findIndex(
        (result) => result.id === submittedResultId
      ) + 1;

    return (
      <div className="student-quiz-page">

        <header className="student-quiz-header">
          <div className="student-brand">
            <div className="student-brand-icon">
              <Shapes size={24} />
            </div>
            <h2>Shape<span>Quiz</span></h2>
          </div>

          <div className="student-header-profile">
            <div className="student-avatar">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{studentName}</strong>
              <small>Student</small>
            </div>
          </div>
        </header>

        <main className="student-quiz-container">

          {/* FINAL SCORE */}
          <section className="result-card">

            <div className="result-trophy">
              <Trophy size={55} />
            </div>

            <span className="student-eyebrow">
              QUIZ SUBMITTED SUCCESSFULLY
            </span>

            <h1>Great job, {studentName}!</h1>

            <p>Your answers have been submitted.</p>

            <div className="score-circle">
              <strong>{score}/10</strong>
              <span>Your Score</span>
            </div>

            <div className="result-details">
              <div>
                <strong>{score}</strong>
                <span>Correct</span>
              </div>

              <div>
                <strong>{10 - score}</strong>
                <span>Incorrect</span>
              </div>

              <div>
                <strong>10</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="submission-message">
              <CheckCircle2 size={20} />
              Your quiz submission is complete.
            </div>

            <h2>Your Classroom Ranking</h2>

            <div className="student-rank-highlight">
              <Trophy size={28} />
              <div>
                <strong>#{myRank}</strong>
                <span>Your current position</span>
              </div>
            </div>

          </section>

          {/* LEADERBOARD */}
          <section className="student-question-card">

            <div className="leaderboard-heading">
              <Medal size={27} />
              <div>
                <h2>Classroom Leaderboard</h2>
                <p>Ranked by highest quiz score</p>
              </div>
            </div>

            <div className="leaderboard-table">

              <div className="leaderboard-row leaderboard-header">
                <span>RANK</span>
                <span>STUDENT NAME</span>
                <span>SCORE</span>
              </div>

              {rankedResults.map((result, index) => (

                <div
                  className={`leaderboard-row ${
                    result.id === submittedResultId
                      ? "my-ranking"
                      : ""
                  }`}
                  key={result.id}
                >

                  <strong>
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `#${index + 1}`}
                  </strong>

                  <span>{result.studentName}</span>

                  <strong>
                    {result.score}/10
                  </strong>

                </div>
              ))}

              {rankedResults.length === 0 && (
                <p>No student results yet.</p>
              )}

            </div>

            <p className="leaderboard-note">
              Higher scores rank first. Earlier submissions
              rank higher when scores are tied.
            </p>

          </section>

          {/* ANSWER REVIEW */}
          <section className="student-question-card">

            <div className="leaderboard-heading">
              <ClipboardList size={25} />
              <div>
                <h2>Answer Review</h2>
                <p>Review all your answers.</p>
              </div>
            </div>

            {quiz.questions.map((q, index) => {
              const isCorrect =
                answers[q.id] === q.correctAnswer;

              const correctIndex =
                ["A", "B", "C", "D"].indexOf(q.correctAnswer);

              const studentIndex =
                ["A", "B", "C", "D"].indexOf(answers[q.id]);

              return (
                <div
                  className={`answer-review-item ${
                    isCorrect
                      ? "review-correct"
                      : "review-incorrect"
                  }`}
                  key={q.id}
                >

                  <div className="review-question-title">
                    <strong>Question {index + 1}</strong>

                    <span>
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>

                  <p>{q.question}</p>

                  <div className="review-answer-line">
                    Your answer:{" "}
                    <strong>
                      {answers[q.id]}. {q.options[studentIndex]}
                    </strong>
                  </div>

                  <div className="review-answer-line">
                    Correct answer:{" "}
                    <strong>
                      {q.correctAnswer}. {q.options[correctIndex]}
                    </strong>
                  </div>

                </div>
              );
            })}

          </section>

          <button
            className="student-main-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Finish
          </button>

        </main>
      </div>
    );
  }

  // ACTIVE QUIZ SCREEN
  return (
    <div className="student-quiz-page">

      {/* HEADER */}
      <header className="student-quiz-header">

        <div className="student-brand">
          <div className="student-brand-icon">
            <Shapes size={24} />
          </div>
          <h2>Shape<span>Quiz</span></h2>
        </div>

        <div className="student-header-profile">
          <div className="student-avatar">
            {studentName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{studentName}</strong>
            <small>Student</small>
          </div>
        </div>

      </header>

      <main className="student-quiz-container">

        {/* QUIZ INFORMATION */}
        <section className="student-quiz-info">

          <span className="student-eyebrow">
            CLASSROOM QUIZ
          </span>

          <h1>{quiz.title}</h1>

          <p>
            Answer all 10 questions. Choose one answer
            for each question.
          </p>

          <div className="student-quiz-meta">

            <span>
              <ClipboardList size={16} />
              10 Questions
            </span>

            <span>
              <Clock size={16} />
              Multiple Choice
            </span>

          </div>

        </section>

        {/* PROGRESS */}
        <section className="student-progress-card">

          <div className="progress-heading">
            <strong>Your Progress</strong>
            <span>{answeredCount} of 10 answered</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="question-navigation">

            {quiz.questions.map((q, index) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentQuestion(index);
                  setError("");
                }}
                className={`question-dot ${
                  currentQuestion === index ? "active" : ""
                } ${
                  answers[q.id] ? "answered" : ""
                }`}
              >
                {index + 1}
              </button>
            ))}

          </div>

        </section>

        {/* QUESTION CARD */}
        <section className="student-question-card">

          <div className="student-question-heading">

            <span className="question-badge">
              QUESTION {currentQuestion + 1} OF 10
            </span>

            <span className="question-points">
              1 POINT
            </span>

          </div>

          <h2>{question.question}</h2>

          <p className="answer-instruction">
            Select your answer below.
          </p>

          {/* ANSWER CHOICES */}
          <div className="student-answer-grid">

            {shapes.map((shape, index) => {

              const isSelected = selectedAnswer === shape.id;
              const isCorrect = question.correctAnswer === shape.id;
              const hasAnswered = Boolean(selectedAnswer);

              let choiceClass = "";

              if (hasAnswered && isCorrect) {
                choiceClass = "correct-choice";
              } else if (hasAnswered && isSelected && !isCorrect) {
                choiceClass = "wrong-choice";
              }

              return (
                <button
                  key={shape.id}
                  type="button"
                  disabled={hasAnswered}
                  className={`student-answer-card ${shape.style} ${
                    isSelected ? "selected" : ""
                  } ${choiceClass}`}
                  onClick={() => selectAnswer(question.id, shape.id)}
                >

                  <span className="student-answer-symbol">
                    {shape.symbol}
                  </span>

                  <span className="student-answer-letter">
                    OPTION {shape.id}
                  </span>

                  <strong>
                    {question.options[index]}
                  </strong>

                  {hasAnswered && isCorrect && (
                    <span className="answer-check">
                      <CheckCircle2 size={21} />
                    </span>
                  )}

                  {hasAnswered && isSelected && !isCorrect && (
                    <span className="answer-check wrong-check">
                      <XCircle size={21} />
                    </span>
                  )}

                </button>
              );
            })}

          </div>

          {/* IMMEDIATE FEEDBACK */}
          {selectedAnswer && (

            <div
              className={`instant-feedback ${
                selectedAnswer === question.correctAnswer
                  ? "feedback-correct"
                  : "feedback-incorrect"
              }`}
            >

              {selectedAnswer === question.correctAnswer ? (
                <>
                  <CheckCircle2 size={27} />

                  <div>
                    <strong>Correct Answer! 🎉</strong>
                    <p>Excellent! You earned 1 point.</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={27} />

                  <div>
                    <strong>Not Quite! Keep Learning.</strong>

                    <p>
                      The correct answer is:{" "}
                      <strong>
                        {question.correctAnswer}.{" "}
                        {question.options[
                          ["A", "B", "C", "D"].indexOf(
                            question.correctAnswer
                          )
                        ]}
                      </strong>
                    </p>
                  </div>
                </>
              )}

            </div>
          )}

          {error && (
            <div className="student-form-error">
              {error}
            </div>
          )}

          {/* NAVIGATION */}
          <div className="student-question-actions">

            <button
              type="button"
              className="student-previous-button"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft size={19} />
              Previous
            </button>

            {currentQuestion < 9 ? (

              <button
                type="button"
                className="student-next-button"
                onClick={handleNext}
                disabled={!selectedAnswer}
              >
                Next Question
                <ChevronRight size={19} />
              </button>

            ) : (

              <button
                type="button"
                className="student-submit-button"
                onClick={handleSubmit}
                disabled={!selectedAnswer || answeredCount !== 10}
              >
                <Send size={18} />
                Submit Quiz
              </button>

            )}

          </div>

        </section>

        <p className="student-footer">
          ✦ ShapeQuiz · Do your best!
        </p>

      </main>
    </div>
  );
}

export default StudentQuiz;
