
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  CheckCircle2,
  Copy,
  Sparkles,
  PlusCircle,
  LoaderCircle
} from "lucide-react";
import { api } from "../services/api";

const shapes = [
  { id: "A", symbol: "●", name: "Circle", style: "circle" },
  { id: "B", symbol: "▲", name: "Triangle", style: "triangle" },
  { id: "C", symbol: "■", name: "Square", style: "square" },
  { id: "D", symbol: "◆", name: "Diamond", style: "diamond" }
];

const createQuestion = (id) => ({
  id,
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "A"
});

function TeacherDashboard() {
  const navigate = useNavigate();

  const [quizTitle, setQuizTitle] = useState("Classroom Quiz");

  const [questions, setQuestions] = useState(
    Array.from({ length: 10 }, (_, i) => createQuestion(i + 1))
  );

  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const teacherName =
    sessionStorage.getItem("teacherName") || "Teacher";

  // UPDATE QUESTION
  const updateQuestion = (index, value) => {
    setQuestions((previous) =>
      previous.map((q, i) =>
        i === index ? { ...q, question: value } : q
      )
    );

    setSuccess(false);
    setError("");
  };

  // UPDATE ANSWER CHOICE
  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((option, j) =>
                j === optionIndex ? value : option
              )
            }
          : q
      )
    );

    setSuccess(false);
    setError("");
  };

  // SELECT CORRECT ANSWER
  const updateCorrectAnswer = (questionIndex, value) => {
    setQuestions((previous) =>
      previous.map((q, i) =>
        i === questionIndex
          ? { ...q, correctAnswer: value }
          : q
      )
    );

    setSuccess(false);
    setError("");
  };

  // SUBMIT QUIZ TO BACKEND
  const handleSubmitQuiz = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(false);
    setAccessCode("");

    if (!quizTitle.trim()) {
      setError("Please enter a quiz title.");
      return;
    }

    if (questions.length !== 10) {
      setError("Your quiz must contain exactly 10 questions.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question.trim()) {
        setError(`Please complete Question ${i + 1}.`);
        return;
      }

      if (q.options.some((option) => !option.trim())) {
        setError(`Please complete all choices in Question ${i + 1}.`);
        return;
      }

      if (
        new Set(
          q.options.map((option) => option.trim().toLowerCase())
        ).size !== 4
      ) {
        setError(
          `Question ${i + 1} must have four different choices.`
        );
        return;
      }

      if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
        setError(
          `Please select a correct answer for Question ${i + 1}.`
        );
        return;
      }
    }

    const quizData = {
      title: quizTitle.trim(),
      createdBy: teacherName,
      questions: questions.map((q) => ({
        questionText: q.question.trim(),
        optionA: q.options[0].trim(),
        optionB: q.options[1].trim(),
        optionC: q.options[2].trim(),
        optionD: q.options[3].trim(),
        correctOption: q.correctAnswer
      }))
    };

    setLoading(true);

    try {
      const result = await api.createQuiz(quizData);

      setAccessCode(result.accessCode);
      setSuccess(true);

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    } catch (err) {
      setError(
        err.message || "Unable to create quiz. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // COPY CODE
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      alert("Quiz access code copied!");
    } catch {
      setError("Unable to copy the code. Please copy it manually.");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("teacherName");
    navigate("/");
  };

  return (
    <div className="teacher-dashboard">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">
          <div className="brand-icon">✿</div>
          <h2>Shape<span>Quiz</span></h2>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <div className="sidebar-link active">
          <LayoutDashboard size={19} />
          Dashboard
        </div>

        <div className="sidebar-link">
          <ClipboardList size={19} />
          Create Quiz
        </div>

        <div className="sidebar-link">
          <Users size={19} />
          Students (39)
        </div>

        <div className="sidebar-bottom">

          <div className="teacher-profile">
            <div className="profile-avatar">T</div>

            <div>
              <strong>{teacherName}</strong>
              <small>Teacher Account</small>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>
            <span className="eyebrow">TEACHER WORKSPACE</span>
            <h1>Quiz Creator ✨</h1>
            <p>Create your classroom quiz and share the access code.</p>
          </div>

          <div className="header-avatar">T</div>

        </header>

        {/* STATISTICS */}
        <div className="dashboard-stats">

          <div className="stat-card">
            <div className="stat-icon purple-stat">
              <ClipboardList size={22} />
            </div>

            <div>
              <strong>10</strong>
              <span>Total Questions</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pink-stat">
              <Users size={22} />
            </div>

            <div>
              <strong>39</strong>
              <span>Student Capacity</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue-stat">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <strong>4</strong>
              <span>Choices per Question</span>
            </div>
          </div>

        </div>

        <form onSubmit={handleSubmitQuiz}>

          {/* QUIZ INFORMATION */}
          <section className="quiz-settings">

            <div className="section-heading">
              <div>
                <span className="eyebrow">QUIZ SETTINGS</span>
                <h2>Basic Information</h2>
              </div>

              <Sparkles color="#A477E8" />
            </div>

            <label>Quiz Title</label>

            <input
              className="quiz-title-input"
              type="text"
              value={quizTitle}
              onChange={(e) => {
                setQuizTitle(e.target.value);
                setSuccess(false);
                setError("");
              }}
              placeholder="Enter quiz title"
              disabled={loading}
            />

            <div className="quiz-info">
              <span>✦ 10 Questions</span>
              <span>✦ Multiple Choice</span>
              <span>✦ Maximum 39 Students</span>
            </div>

          </section>

          {/* QUESTION BUILDER */}
          <div className="question-section-heading">

            <div>
              <span className="eyebrow">QUESTION BUILDER</span>
              <h2>Your 10 Questions</h2>
              <p>Write your questions and four answer choices.</p>
            </div>

            <span className="question-count">10 / 10</span>

          </div>

          {questions.map((q, index) => (

            <section className="question-editor" key={q.id}>

              <div className="question-editor-header">

                <div className="question-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <h3>Question {index + 1}</h3>
                  <span>Multiple Choice</span>
                </div>

              </div>

              <label>Question Text</label>

              <textarea
                value={q.question}
                onChange={(e) =>
                  updateQuestion(index, e.target.value)
                }
                placeholder={`Write Question ${index + 1} here...`}
                rows="3"
                disabled={loading}
              />

              <div className="choices-heading">
                <strong>Answer Choices</strong>
                <span>Click a choice card to mark it correct.</span>
              </div>

              {/* FOUR ANSWER CHOICES */}
              <div className="shape-choice-grid">

                {shapes.map((shape, optionIndex) => {

                  const selected = q.correctAnswer === shape.id;

                  return (
                    <div
                      className={`shape-choice ${shape.style} ${
                        selected ? "selected" : ""
                      }`}
                      key={shape.id}
                      onClick={() => {
                        if (!loading) {
                          updateCorrectAnswer(index, shape.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      onKeyDown={(e) => {
                        if (
                          !loading &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          updateCorrectAnswer(index, shape.id);
                        }
                      }}
                    >

                      <div className="choice-top">

                        <span className="shape-symbol">
                          {shape.symbol}
                        </span>

                        <span className="correct-selector">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={selected}
                            disabled={loading}
                            onChange={() =>
                              updateCorrectAnswer(index, shape.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />

                          <span>
                            {selected
                              ? "Correct Answer"
                              : "Select as Correct"}
                          </span>
                        </span>

                      </div>

                      <span className="choice-name">
                        Choice {shape.id} · {shape.name}
                      </span>

                      <input
                        type="text"
                        value={q.options[optionIndex]}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          updateOption(index, optionIndex, e.target.value)
                        }
                        placeholder={`Enter choice ${shape.id}`}
                        aria-label={`Question ${index + 1}, choice ${shape.id}`}
                        disabled={loading}
                      />

                    </div>
                  );
                })}

              </div>

              <div className="correct-answer-summary">
                <CheckCircle2 size={16} />
                Correct answer: <strong>Choice {q.correctAnswer}</strong>
              </div>

            </section>
          ))}

          {/* ERROR */}
          {error && (
            <div className="quiz-error">
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className="submit-quiz-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={20} className="loading-icon" />
                Saving Quiz...
              </>
            ) : (
              <>
                <PlusCircle size={20} />
                Submit Quiz & Generate Access Code
              </>
            )}
          </button>

        </form>

        {/* GENERATED CODE */}
        {success && (

          <div className="generated-code-card">

            <div className="generated-icon">
              <CheckCircle2 size={35} />
            </div>

            <span className="eyebrow">
              QUIZ CREATED SUCCESSFULLY
            </span>

            <h2>Your Quiz Access Code</h2>

            <p>Share this code with your 39 students.</p>

            <div className="generated-code">
              {accessCode}
            </div>

            <button
              type="button"
              className="copy-code-button"
              onClick={handleCopyCode}
            >
              <Copy size={17} />
              Copy Access Code
            </button>

            <p className="code-note">
              Students will use this code to join your classroom quiz.
            </p>

          </div>
        )}

      </main>
    </div>
  );
}

export default TeacherDashboard;
