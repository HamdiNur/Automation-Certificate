import React, { useState } from "react";
import LibrarySidebar from "../components/LibrarySidebar";
import "./styles/style.css";

const sampleBooks = [
  { id: 1, group: "Group 1", title: "Smart Farming", submitted: true },
  { id: 2, group: "Group 2", title: "Blockchain Voting", submitted: false },
  { id: 3, group: "Group 3", title: "AI Diagnosis", submitted: true },
  { id: 4, group: "Group 4", title: "Vehicle Tracking", submitted: false },
];

function LibraryBooks() {
  const [books, setBooks] = useState(sampleBooks);

  const toggleSubmission = (id) => {
    const updated = books.map((b) =>
      b.id === id ? { ...b, submitted: !b.submitted } : b
    );
    setBooks(updated);
  };

  return (
    <div className="dashboard-wrapper">
      <LibrarySidebar />
      <div className="dashboard-main">
        <h2>Thesis Book Submissions</h2>

        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Thesis Title</th>
              <th>Status</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.group}</td>
                <td>{b.title}</td>
                <td>
                  <span className={`badge ${b.submitted ? "returned" : "not-returned"}`}>
                    {b.submitted ? "Submitted" : "Not Submitted"}
                  </span>
                </td>
                <td>
                  <button
                    className={b.submitted ? "btn-reject" : "btn-approve"}
                    onClick={() => toggleSubmission(b.id)}
                  >
                    Mark as {b.submitted ? "Not Submitted" : "Submitted"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LibraryBooks;
