import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";  // 🔵 NEW ICON

export default function Analytics() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const stored = JSON.parse(localStorage.getItem("parkingHistory")) || [];
    setHistory(stored);
  };

  // 🔵 CLEAR HISTORY FUNCTION
  const clearHistory = () => {
    if (!window.confirm("Are you sure you want to clear all parking history?")) return;

    localStorage.removeItem("parkingHistory");
    setHistory([]);
  };

  const totalRevenue = history.reduce((sum, s) => sum + s.fee, 0);
  const totalSessions = history.length;
  const avgDuration =
    totalSessions > 0
      ? history.reduce((sum, s) => sum + s.duration, 0) / totalSessions
      : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">

      {/* HEADER WITH BACK + ACTION BUTTONS */}
      <div className="flex justify-between items-center mb-6">

        {/* BACK BUTTON */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-semibold">Back</span>
          </Link>

          <h1 className="text-3xl font-bold ml-4">Analytics — Spot #101</h1>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">

          {/* REFRESH BUTTON */}
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold"
          >
            Refresh Data
          </button>

          {/* 🔵 CLEAR HISTORY BUTTON */}
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold flex items-center gap-2 border border-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>

        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mb-10">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h2 className="text-sm text-slate-400">Total Sessions</h2>
          <p className="text-2xl font-bold">{totalSessions}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h2 className="text-sm text-slate-400">Total Revenue</h2>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h2 className="text-sm text-slate-400">Average Duration</h2>
          <p className="text-xl font-bold">
            {(avgDuration / 60).toFixed(1)} mins
          </p>
        </div>
      </div>

      {/* SESSION HISTORY TABLE */}
      <div>
        <h2 className="text-xl font-bold mb-3">Session History</h2>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-700 text-slate-300">
              <tr>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Fee</th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-400">
                    No data recorded yet.
                  </td>
                </tr>
              )}

              {history.map((s, i) => (
                <tr key={i} className="border-b border-slate-700/50 text-slate-300">
                  <td className="p-3">{new Date(s.start).toLocaleString()}</td>
                  <td className="p-3">{new Date(s.end).toLocaleString()}</td>
                  <td className="p-3">{(s.duration / 60).toFixed(1)} mins</td>
                  <td className="p-3">${s.fee.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
