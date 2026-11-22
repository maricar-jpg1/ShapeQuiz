
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom";

import TeacherLogin from "./pages/TeacherLogin";
import StudentLogin from "./pages/StudentLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentQuiz from "./pages/StudentQuiz";

import "./App.css";

// HOME PAGE
function Home() {
  return (
    <div className="home-page">

      <nav className="navbar">
        <Link to="/" className="brand-link">
          <h2>
            Shape<span>Quiz</span>
          </h2>
        </Link>

        <span className="nav-label">
          LEARNING PLATFORM
        </span>
      </nav>

      <main className="home-container">

        <div className="hero-text">
          <span className="eyebrow">
            WELCOME TO SHAPE QUIZ
          </span>

          <h1>
            Learning is more fun
            <br />
            with <span>shapes!</span>
          </h1>

          <p>
            An interactive classroom quiz platform.
            Join your class and show what you know!
          </p>
        </div>

        <div className="portal-grid">

          {/* TEACHER PORTAL */}
          <div className="portal-card teacher-card">

            <div className="portal-icon">♧</div>

            <span className="portal-tag">
              FOR EDUCATORS
            </span>

            <h2>Teacher Portal</h2>

            <p>
              Create quizzes, manage questions,
              and check student results.
            </p>

            <Link
              to="/teacher/login"
              className="portal-button purple-button"
            >
              Teacher Login →
            </Link>

          </div>

          {/* STUDENT PORTAL */}
          <div className="portal-card student-card">

            <div className="portal-icon">✿</div>

            <span className="portal-tag">
              FOR LEARNERS
            </span>

            <h2>Student Portal</h2>

            <p>
              Enter your name and quiz code
              to join your classroom quiz.
            </p>

            <Link
              to="/student/login"
              className="portal-button pink-button"
            >
              Student Login →
            </Link>

          </div>

        </div>

        <div className="home-footer">
          <span>✦</span>
          ONE CLASSROOM · 39 STUDENTS · 10 QUESTIONS
        </div>

      </main>
    </div>
  );
}

// MAIN APPLICATION
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME PAGE */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* TEACHER PAGES */}
        <Route
          path="/teacher/login"
          element={<TeacherLogin />}
        />

        <Route
          path="/teacher/dashboard"
          element={<TeacherDashboard />}
        />

        {/* STUDENT PAGES */}
        <Route
          path="/student/login"
          element={<StudentLogin />}
        />

        <Route
          path="/student/quiz"
          element={<StudentQuiz />}
        />

        {/* UNKNOWN PAGE */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
