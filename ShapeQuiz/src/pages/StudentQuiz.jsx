
import { useEffect, useState } from "react";
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
  Medal,
  LoaderCircle
} from "lucide-react";
import { api } from "../services/api";

const shapes = [
  { id: "A", symbol: "●", style: "circle" },
  { id: "B", symbol: "▲", style: "triangle" },
  { id: "C", symbol: "■", style: "square" },
  { id: "D", symbol: "◆", style: "diamond" }
];

function normalizeQuestion(question) {
  const options = Array.isArray(question.options)
    ? question.options.map((option) =>
        typeof option === "string" ? option : option.label
      )
    : [
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD
      ];

  return {
    id: question.id || question.questionId,
    question: question.question || question.questionText,
    options,
    // Never receive or display the correct answer before submission.
  };
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.leaderboard)) return data.leaderboard;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.submissions)) return data.submissions;
  return [];
}

function StudentQuiz() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  // LOAD QUIZ FROM STUDENT LOGIN
  useEffect(() => {
    try {
      const savedQuiz = sessionStorage.getItem("studentQuiz");
      const name = sessionStorage.getItem("studentName");
      const code = sessionStorage.getItem("quizCode");
      const savedSubmissionId = sessionStorage.getItem("submissionId");

      if (!name || !code || !savedSubmissionId || !savedQuiz) {
        navigate("/student/login");
        return;
      }

      const parsed = JSON.parse(savedQuiz);
      const quizData = parsed.quiz || parsed;

      const questions = (
        quizData.questions ||
        parsed.questions ||
        []
      ).map(normalizeQuestion);

      if (questions.length !== 10) {
        setError("This quiz does not contain exactly 10 questions.");
        setLoading(false);
        return;
      }

      const validQuestions = questions.every(
        (question) =>
          question.id &&
          question.question &&
          Array.isArray(question.options) &&
          question.options.length === 4 &&
          question.options.every(Boolean)
      );

      if (!validQuestions) {
        setError("Some quiz questions are incomplete or invalid.");
        setLoading(false);
        return;
      }

      setQuiz({
        title:
          quizData.title ||
          quizData.quizTitle ||
          parsed.title ||
          "Classroom Quiz",
        questions
      });

      setStudentName(name);
      setAccessCode(code);
      setSubmissionId(savedSubmissionId);
    } catch {
      setError("Unable to load your quiz. Please join again.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // SUBMIT ONE ANSWER TO THE BACKEND
  const selectAnswer = async (questionId, selectedOption) => {
    if (answers[questionId] || answering || submitted) return;

    setAnswering(true);
    setError("");

    try {
      const result = await api.submitAnswer({
        submissionId,
        questionId,
        selectedOption
      });

      setAnswers((previous) => ({
        ...previous,
        [questionId]: {
          selectedOption,
          isCorrect: Boolean(result.isCorrect),
          correctOption: result.correctOption || null
        }
      }));
    } catch (err) {
      setError(err.message || "Unable to submit your answer.");
    } finally {
      setAnswering(false);
    }
  };

  // FINISH QUIZ AND GET THE SERVER SCORE
  const handleSubmit = async () => {
    if (!quiz || submitted || finishing) return;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer all 10 questions first.");
      return;
    }

    setFinishing(true);
    setError("");

    try {
      const result = await api.finishQuiz(submissionId);

      setFinalResult(result);
      setSubmitted(true);

      // Load shared leaderboard from the backend
      try {
        const leaderboardData = await api.getLeaderboard(accessCode);
        setLeaderboard(getList(leaderboardData));
      } catch {
        setLeaderboard([]);
      }
    } catch (err) {
      setError(err.message || "Unable to finish your quiz.");
    } finally {
      setFinishing(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
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

  const handleLogout = () => {
    sessionStorage.removeItem("studentName");
    sessionStorage.removeItem("quizCode");
    sessionStorage.removeItem("submissionId");
    sessionStorage.removeItem("studentQuiz");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="student-quiz-page">
        <div className="student-loading">
          Loading your classroom quiz...
        </div>
      </div>
    );
  }

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

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;
  const currentAnswer = answers[question.id];
  const selectedAnswer = currentAnswer?.selectedOption;

  // FINAL RESULT
  if (submitted) {
    const score =
      finalResult?.score ??
      finalResult?.totalCorrect ??
      finalResult?.correctAnswers ??
      0;

    const totalQuestions =
      finalResult?.totalQuestions ?? quiz.questions.length;

    const myIndex = leaderboard.findIndex(
      (item) =>
        item.submissionId === submissionId ||
        item.id === submissionId
    );

    const myRank =
      myIndex >= 0 ? myIndex + 1 : null;

    return (
      <div className="student-quiz-page">
        <header className="student-quiz-header">
          <div className="student-brand">
            <div className="student-brand-icon">
              <Shapes size={24} />
            </div>
            <h2>
              Shape<span>Quiz</span>
            </h2>
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
              <strong>{score}/{totalQuestions}</strong>
              <span>Your Score</span>
            </div>

            <div className="result-details">
              <div>
                <strong>{score}</strong>
                <span>Correct</span>
              </div>

              <div>
                <strong>{totalQuestions - score}</strong>
                <span>Incorrect</span>
              </div>

              <div>
                <strong>{totalQuestions}</strong>
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
                <strong>{myRank ? `#${myRank}` : "Submitted"}</strong>
                <span>
                  {myRank
                    ? "Your current position"
                    : "Your result is saved"}
                </span>
              </div>
            </div>
          </section>

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

              {leaderboard.map((item, index) => {
                const name =
                  item.studentName || item.name || "Student";
                const itemScore =
                  item.score ?? item.totalScore ?? 0;
                const itemId =
                  item.submissionId || item.id;

                return (
                  <div
                    className={`leaderboard-row ${
                      itemId === submissionId ? "my-ranking" : ""
                    }`}
                    key={itemId || `${name}-${index}`}
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

                    <span>{name}</span>
                    <strong>{itemScore}/10</strong>
                  </div>
                );
              })}

              {leaderboard.length === 0 && (
                <p>
                  Leaderboard could not be loaded. Your result
                  has still been submitted.
                </p>
              )}
            </div>

            <p className="leaderboard-note">
              Higher scores rank first. Earlier submissions
              rank higher when scores are tied.
            </p>
          </section>

          <section className="student-question-card">
            <div className="leaderboard-heading">
              <ClipboardList size={25} />
              <div>
                <h2>Answer Review</h2>
                <p>Review your submitted answers.</p>
              </div>
            </div>

            {quiz.questions.map((q, index) => {
              const answer = answers[q.id];
              const correctOption = answer?.correctOption;
              const isCorrect = answer?.isCorrect;

              const selectedIndex = ["A", "B", "C", "D"].indexOf(
                answer?.selectedOption
              );

              const correctIndex = ["A", "B", "C", "D"].indexOf(
                correctOption
              );

              return (
                <div
                  className={`answer-review-item ${
                    isCorrect ? "review-correct" : "review-incorrect"
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
                      {answer?.selectedOption}.{" "}
                      {q.options[selectedIndex]}
                    </strong>
                  </div>

                  {correctOption && (
                    <div className="review-answer-line">
                      Correct answer:{" "}
                      <strong>
                        {correctOption}. {q.options[correctIndex]}
                      </strong>
                    </div>
                  )}
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
      <header className="student-quiz-header">
        <div className="student-brand">
          <div className="student-brand-icon">
            <Shapes size={24} />
          </div>
          <h2>
            Shape<span>Quiz</span>
          </h2>
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
        <section className="student-quiz-info">
          <span className="student-eyebrow">
            CLASSROOM QUIZ
          </span>

          <h1>{quiz.title}</h1>

          <p>
            Answer all 10 questions. Choose one answer for each
            question.
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
                } ${answers[q.id] ? "answered" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </section>

        <section className="student-question-card">
          <div className="student-question-heading">
            <span className="question-badge">
              QUESTION {currentQuestion + 1} OF 10
            </span>
            <span className="question-points">1 POINT</span>
          </div>

          <h2>{question.question}</h2>

          <p className="answer-instruction">
            Select your answer below.
          </p>

          <div className="student-answer-grid">
            {shapes.map((shape, index) => {
              const isSelected = selectedAnswer === shape.id;
              const hasAnswered = Boolean(currentAnswer);
              const isCorrect =
                hasAnswered &&
                currentAnswer.correctOption === shape.id;

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
                  disabled={hasAnswered || answering}
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

                  <strong>{question.options[index]}</strong>

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

          {answering && (
            <div className="student-form-error">
              <LoaderCircle size={18} />
              Submitting your answer...
            </div>
          )}

          {currentAnswer && (
            <div
              className={`instant-feedback ${
                currentAnswer.isCorrect
                  ? "feedback-correct"
                  : "feedback-incorrect"
              }`}
            >
              {currentAnswer.isCorrect ? (
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
                    {currentAnswer.correctOption && (
                      <p>
                        The correct answer is:{" "}
                        <strong>
                          {currentAnswer.correctOption}.{" "}
                          {
                            question.options[
                              ["A", "B", "C", "D"].indexOf(
                                currentAnswer.correctOption
                              )
                            ]
                          }
                        </strong>
                      </p>
                    )}
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

          <div className="student-question-actions">
            <button
              type="button"
              className="student-previous-button"
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || answering}
            >
              <ChevronLeft size={19} />
              Previous
            </button>

            {currentQuestion < 9 ? (
              <button
                type="button"
                className="student-next-button"
                onClick={handleNext}
                disabled={!selectedAnswer || answering}
              >
                Next Question
                <ChevronRight size={19} />
              </button>
            ) : (
              <button
                type="button"
                className="student-submit-button"
                onClick={handleSubmit}
                disabled={
                  !selectedAnswer ||
                  answeredCount !== 10 ||
                  answering ||
                  finishing
                }
              >
                {finishing ? (
                  <>
                    <LoaderCircle size={18} />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Quiz
                  </>
                )}
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
