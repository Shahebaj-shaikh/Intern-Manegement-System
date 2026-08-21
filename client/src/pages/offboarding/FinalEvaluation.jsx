import { useEffect, useState } from "react";
import api from "../../api/axios";

const FinalEvaluation = () => {
  const [interns, setInterns] = useState([]);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    intern: "",
    outcome: "",
    feedbackSummary: "",
    comments: "",
  });

  // Fetch interns
  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const response = await api.get("/interns");

        setInterns(response.data.data.interns || []);
      } catch (error) {
        console.error("Failed to fetch interns:", error);
        alert(
          error.response?.data?.message || "Failed to load interns"
        );
      } finally {
        setLoadingInterns(false);
      }
    };

    fetchInterns();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.intern) {
      alert("Please select an intern");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/final-evaluations", form);

      console.log("Final evaluation:", response.data);

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

          {/* Intern */}
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Select Intern
            </label>

            <select
              name="intern"
              value={form.intern}
              onChange={handleChange}
              required
              disabled={loadingInterns}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">
                {loadingInterns
                  ? "Loading interns..."
                  : "Select an intern"}
              </option>

              {interns.map((intern) => (
                <option key={intern._id} value={intern._id}>
                  {intern.fullName} ({intern.email})
                </option>
              ))}
            </select>
          </div>

          {/* Outcome */}
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Final Outcome
            </label>

            <select
              name="outcome"
              value={form.outcome}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
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

          {/* Feedback */}
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Feedback Summary
            </label>

            <textarea
              name="feedbackSummary"
              value={form.feedbackSummary}
              onChange={handleChange}
              rows={4}
              placeholder="Enter final feedback summary..."
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Comments
            </label>

            <textarea
              name="comments"
              value={form.comments}
              onChange={handleChange}
              rows={4}
              placeholder="Add any additional comments..."
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || loadingInterns}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Submitting..."
              : "Submit Final Evaluation"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default FinalEvaluation;