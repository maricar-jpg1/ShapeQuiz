
const API_URL = "http://localhost:5286/api";

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
  } catch {
    throw new Error(
      "Cannot connect to ShapeQuiz API. Make sure the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export const api = {
  createQuiz: (quiz) =>
    request("/quizzes", {
      method: "POST",
      body: JSON.stringify(quiz)
    }),

  joinQuiz: (student) =>
    request("/student/join", {
      method: "POST",
      body: JSON.stringify(student)
    }),

  submitAnswer: (answer) =>
    request("/student/answer", {
      method: "POST",
      body: JSON.stringify(answer)
    }),

  finishQuiz: (submissionId) =>
    request(`/student/finish/${submissionId}`, {
      method: "POST"
    }),

  getLeaderboard: (accessCode) =>
    request(`/student/leaderboard/${encodeURIComponent(accessCode)}`)
};
