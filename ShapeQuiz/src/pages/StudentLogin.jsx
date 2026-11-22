import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  KeyRound,
  ArrowLeft,
  Shapes,
  LoaderCircle
} from "lucide-react";

const API_URL = "http://localhost:5286/api";

function StudentLogin() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();

    setError("");

    if (!name.trim() || !code.trim()) {
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
          fullName: name.trim(),
          accessCode: code.trim().toUpperCase()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to join the quiz. Please check your details."
        );
      }

      // Save the backend response for the quiz page.
      sessionStorage.setItem("studentName", data.studentName);
      sessionStorage.setItem("quizCode", code.trim().toUpperCase());
      sessionStorage.setItem("submissionId", data.submissionId);
      sessionStorage.setItem("studentQuiz", JSON.stringify(data));

      navigate("/student/quiz");
    } catch (err) {
      setError(
        err.message ||
        "Cannot connect to the server. Please make sure the backend is running."
      );
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
              required
            />
          </div>

          {error && (
            <p className="error-message">
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