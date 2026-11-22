
const API_URL = "https://shapequiz-api.onrender.com/api";

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  } catch (error) {
    throw new Error(
      "Unable to connect to ShapeQuiz server. Please check your internet connection or try again."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.detail ||
      `Server error: ${response.status} ${response.statusText}`
    );
  }

  return data;
}

export const api = {
  // Teacher: Create a quiz
  createQuiz: (quiz) =>
    request("/quizzes", {
      method: "POST",
      body: JSON.stringify(quiz)
    }),

  // Student: Join a quiz
  joinQuiz: (student) =>
    request("/student/join", {
      method: "POST",
      body: JSON.stringify(student)
    }),

  // Student: Submit an answer
  submitAnswer: (answer) =>
    request("/student/answer", {
      method: "POST",
      body: JSON.stringify(answer)
    }),

  // Student: Finish the quiz
  finishQuiz: (submissionId) =>
    request(`/student/finish/${submissionId}`, {
      method: "POST"
    }),

  // Get quiz leaderboard
  getLeaderboard: (accessCode) =>
    request(`/student/leaderboard/${encodeURIComponent(accessCode)}`)
};
