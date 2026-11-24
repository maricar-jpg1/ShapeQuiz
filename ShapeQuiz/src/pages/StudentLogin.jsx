
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  KeyRound,
  ArrowLeft,
  Shapes,
  LoaderCircle
} from "lucide-react";

// Deployed ShapeQuiz backend
const API_URL = "https://shapequiz-api.onrender.com/api";

function StudentLogin() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");

    const studentName = name.trim();
    const accessCode = code.trim().toUpperCase();

    if (!studentName || !accessCode) {
      setError("Please enter your name and quiz code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/student/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: studentName,
          accessCode: accessCode
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.detail ||
          "Unable to join the quiz. Please check your name and access code."
        );
      }

      if (!data.submissionId || !data.questions) {
        throw new Error(
          "The server returned an incomplete quiz response. Please contact your teacher."
        );
      }

      // Save the successful backend response for StudentQuiz.jsx.
      sessionStorage.setItem("studentName", data.studentName || studentName);
      sessionStorage.setItem("quizCode", accessCode);
      sessionStorage.setItem("submissionId", data.submissionId);
      sessionStorage.setItem("studentQuiz", JSON.stringify(data));

      // Open the student quiz page.
      navigate("/student/quiz");

    } catch (err) {
      console.error("Student join error:", err);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to ShapeQuiz server. Please check the server connection."
        );
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page student-login-page">
      <a href="/" className="back-home">
        <ArrowLeft size={18} />
        Back to Home
      </a>

      <div className="login-card">
        <div className="login-logo pink-logo">
          <Shapes size={35} />
        </div>

        <span className="eyebrow pink-eyebrow">
          STUDENT ACCESS
        </span>

        <h1>Ready to play?</h1>

        <p className="login-description">
          Enter your name and classroom quiz code to get started.
        </p>

        <form onSubmit={handleJoin}>
          <label>Student Name</label>

          <div className="input-wrapper">
            <UserRound size={19} />

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              maxLength={100}
              required
            />
          </div>

          <label>Quiz Access Code</label>

          <div className="input-wrapper">
            <KeyRound size={19} />

            <input
              type="text"
              placeholder="Enter your quiz code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase())
              }
              disabled={loading}
              maxLength={6}
              required
            />
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button pink-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="loading-icon" />
                Joining Quiz...
              </>
            ) : (
              "Join Classroom Quiz →"
            )}
          </button>
        </form>

        <div className="student-note">
          <span>✦</span>
          Ask your teacher for the quiz access code.
        </div>

        <p className="login-bottom">
          ShapeQuiz · Student Portal
        </p>
      </div>
    </div>
  );
}

export default StudentLogin;
