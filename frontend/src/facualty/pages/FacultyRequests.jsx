import React, { useState, useEffect } from "react";
import axios from "axios";
import FacultySidebar from "../components/FacultySidebar";
import "./styling/style.css";

function FacultyRequests() {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [checklist, setChecklist] = useState({
    thesisSubmitted: false,
    formSubmitted: false,
    paperSubmitted: false,
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [groupToReject, setGroupToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/groups");
      setRequests(
        res.data.map((g) => ({
          id: g._id,
          groupNumber: g.groupNumber,
          student: `Group ${g.groupNumber}`,
          projectTitle: g.projectTitle,
          studentId: g.members?.[0]?.studentId || "",
          status: g.clearanceProgress.faculty.status,
          date: g.clearanceProgress.faculty.date?.slice(0, 10) || "Not updated",
          rejectionReason:
            g.clearanceProgress.faculty.status === "Rejected"
              ? g.clearanceProgress.faculty.facultyRemarks || "Reason not provided"
              : "",
        }))
      );
    } catch (err) {
      console.error("❌ Failed to fetch groups:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (field) => {
    const updated = {
      ...checklist,
      [field]: !checklist[field],
    };
    setChecklist(updated);
  };

  const handleApprove = async (groupId, studentId) => {
    try {
      if (
        checklist.thesisSubmitted &&
        checklist.formSubmitted &&
        checklist.paperSubmitted
      ) {
        await axios.patch("http://localhost:5000/api/faculty/update-checklist", {
          studentId,
          checklist: {
            printedThesisSubmitted: true,
            signedFormSubmitted: true,
            softCopyReceived: true,
          },
        });

        await axios.post("http://localhost:5000/api/faculty/approve", {
          studentId,
          groupId,
        });

        fetchGroups();
        setShowChecklistModal(false);
        setSelectedGroup(null);
      } else {
        alert("Please complete the checklist before approving.");
      }
    } catch (err) {
      console.error("❌ Failed to approve:", err.message);
    }
  };

 const handleReject = async (groupId) => {
  try {
    await axios.post("http://localhost:5000/api/groups/update-clearance", {
      groupId,
      type: "faculty",
      status: "Rejected",
      facultyRemarks: rejectionReason,
    });

    fetchGroups();
    setShowRejectModal(false);
    setGroupToReject(null);
    setRejectionReason("");
  } catch (err) {
    console.error("❌ Failed to reject:", err.message);
  }
};


  const filtered = requests.filter((r) => {
    const search = searchTerm.toLowerCase().trim();
    return (
      `group ${r.groupNumber}`.toLowerCase() === search ||
      r.groupNumber?.toString() === search ||
      r.projectTitle?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="dashboard-wrapper">
      <FacultySidebar />
      <div className="dashboard-main">
        <h2>Faculty Clearance Requests</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by group number or project title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Project Title</th>
              <th>Status</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                  <div className="spinner"></div>
                  <p>⏳ Loading clearance requests...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#777" }}>
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.student}</td>
                  <td>{r.projectTitle}</td>
                  <td>
                    <span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td>{r.date}</td>
                  <td>{r.rejectionReason || "—"}</td>
                  <td>
                    {r.status === "Pending" ? (
                      <>
                        <button
                          className="btn-approve"
                          onClick={() => {
                            setSelectedGroup(r);
                            setChecklist({
                              thesisSubmitted: false,
                              formSubmitted: false,
                              paperSubmitted: false,
                            });
                            setShowChecklistModal(true);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => {
                            setGroupToReject(r); // Includes studentId now
                            setRejectionReason("");
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Checklist Modal */}
      {showChecklistModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Faculty Clearance Checklist</h3>

            <div style={{ marginBottom: "15px" }}>
              <p>Printed and soft copies of thesis submitted</p>
              <input
                type="checkbox"
                checked={checklist.thesisSubmitted}
                onChange={() => handleChecklistChange("thesisSubmitted")}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <p>Signed Research Submission Form</p>
              <input
                type="checkbox"
                checked={checklist.formSubmitted}
                onChange={() => handleChecklistChange("formSubmitted")}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <p>Soft copy of research paper submitted</p>
              <input
                type="checkbox"
                checked={checklist.paperSubmitted}
                onChange={() => handleChecklistChange("paperSubmitted")}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <p>All Cleared</p>
              <input
                type="checkbox"
                disabled
                checked={
                  checklist.thesisSubmitted &&
                  checklist.formSubmitted &&
                  checklist.paperSubmitted
                }
              />
            </div>

            <div className="modal-buttons" style={{ marginTop: "30px" }}>
              <button
                className="btn-confirm"
                disabled={
                  !checklist.thesisSubmitted ||
                  !checklist.formSubmitted ||
                  !checklist.paperSubmitted
                }
                onClick={() =>
                  handleApprove(selectedGroup.id, selectedGroup.studentId)
                }
              >
                Approve
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowChecklistModal(false);
                  setSelectedGroup(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && groupToReject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Request</h3>
            <p>
              Provide a reason for rejecting <strong>{groupToReject.student}</strong>:
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{ width: "100%", marginTop: "10px", padding: "10px" }}
            ></textarea>

            <div className="modal-buttons" style={{ marginTop: "20px" }}>
              <button
                className="btn-confirm"
                disabled={!rejectionReason.trim()}
                onClick={() =>
                  handleReject(groupToReject.id, groupToReject.studentId)
                }
              >
                Confirm Reject
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setGroupToReject(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyRequests;
