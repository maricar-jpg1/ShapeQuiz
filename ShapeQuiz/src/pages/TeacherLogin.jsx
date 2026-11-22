import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Lock, User, ArrowLeft } from "lucide-react";

function TeacherLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    // Frontend demonstration only.
    // Real teacher authentication will be implemented in the backend.
    sessionStorage.setItem("teacherName", username);
    navigate("/teacher/dashboard");
  };

  return (
    <div className="login-page">
      <a href="/" className="back-home">
        <ArrowLeft size={18} /> Back to Home
      </a>

      <div className="login-card">
        <div className="login-logo purple-logo">
          <GraduationCap size={35} />
        </div>

        <span className="eyebrow">TEACHER ACCESS</span>
        <h1>Welcome back!</h1>
        <p className="login-description">
          Sign in to create and manage your classroom quizzes.
        </p>

        <form onSubmit={handleLogin}>
          <label>Username</label>
          <div className="input-wrapper">
            <User size={19} />
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={19} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button purple-button">
            Login to Teacher Portal →
          </button>
        </form>

        <p className="login-bottom">
          ShapeQuiz · Teacher Portal
        </p>
      </div>
    </div>
  );
}

export default TeacherLogin;