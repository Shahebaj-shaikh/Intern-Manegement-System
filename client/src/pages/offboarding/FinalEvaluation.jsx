import { useState } from "react";
import api from "../../api/axios";

const FinalEvaluation = () => {
  const [form, setForm] = useState({
    intern: "",
    outcome: "",
    feedbackSummary: "",
    comments: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/final-evaluations", form);

      alert("Final evaluation submitted successfully!");

      setForm({
        intern: "",
        outcome: "",
        feedbackSummary: "",
        comments: "",
      });
    } catch (error) {
      console.error("Final evaluation error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to submit final evaluation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">

        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Final Internship Evaluation
        </h1>

        <p className="mb-6 text-gray-500">
          Complete the final evaluation before offboarding the intern.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="mb-2 block font-medium">
              Intern ID
            </label>

            <input
              type="text"
              name="intern"
              value={form.intern}
              onChange={handleChange}
              required
              placeholder="Enter intern MongoDB ID"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Final Outcome
            </label>

            <select
              name="outcome"
              value={form.outcome}
              onChange={handleChange}
              required
              className="w-full rounded-lg border p-3"
            >
              <option value="">Select outcome</option>
              <option value="COMPLETED">
                Internship Completed
              </option>
              <option value="EXTENDED">
                Internship Extended
              </option>
              <option value="TERMINATED">
                Internship Terminated
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Feedback Summary
            </label>

            <textarea
              name="feedbackSummary"
              value={form.feedbackSummary}
              onChange={handleChange}
              rows="4"
              placeholder="Enter final feedback summary..."
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Comments
            </label>

            <textarea
              name="comments"
              value={form.comments}
              onChange={handleChange}
              rows="4"
              placeholder="Add any additional comments..."
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Final Evaluation"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default FinalEvaluation;