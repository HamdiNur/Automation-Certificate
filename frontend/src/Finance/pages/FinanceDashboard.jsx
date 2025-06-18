"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import FinanceSidebar from "../components/FinanceSidebar"
import SkeletonTable from "../../components/loaders/skeletonTable";

import "./FinanceDashboard.css"

function FinanceDashboard() {
  // Dashboard Stats State
  const [stats, setStats] = useState({
    graduationFeePaid: 0,
    pendingPayments: 0,
    totalCollected: 0,
  })

  // Pending Records State
  const [pendingRecords, setPendingRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Search State
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/finance/stats")
      setStats(res.data)
    } catch (err) {
      console.error("Failed to fetch stats", err)
    }
  }

  // Fetch Pending Records
  const fetchPendingRecords = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/finance/pending")
      setPendingRecords(res.data)
    } catch (err) {
      console.error("Error reloading pending finance records", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchPendingRecords()

    const socket = io("http://localhost:5000")

    socket.on("connect", () => {
      console.log("✅ Connected to finance socket:", socket.id)
    })

    socket.on("finance:new-charge", (data) => {
      console.log("📡 New finance charge received:", data)
      fetchPendingRecords()
      fetchStats() // Refresh stats when new charge comes in
      toast.info("📢 New finance charge received for a student!")
    })

      // ✅ ADD THIS HERE
  socket.on("finance:cleared", (data) => {
    console.log("🎉 Student cleared in finance:", data)
    fetchPendingRecords()
    fetchStats()
    toast.success(`✅ ${data.fullName} has been cleared in finance!`)
  })
    return () => {
      socket.disconnect()
    }
  }, [])

  const handleApprove = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/finance/approve", {
        studentId,
        approvedBy: "admin",
      })
      setPendingRecords(pendingRecords.filter((r) => r.studentId !== studentId))
      fetchStats() // Refresh stats after approval
      toast.success("✅ Payment approved successfully!")
    } catch (err) {
      alert("Approve failed.")
    }
  }

  const handleReject = async (studentId) => {
    try {
      await axios.post("http://localhost:5000/api/finance/reject", {
        studentId,
        remarks: "Rejected by admin",
      })
      setPendingRecords(pendingRecords.filter((r) => r.studentId !== studentId))
      fetchStats() // Refresh stats after rejection
      toast.error("❌ Payment rejected!")
    } catch (err) {
      alert("Reject failed.")
    }
  }

  // Filter records based on search term
  const filteredRecords = pendingRecords.filter((record) => {
    const searchLower = searchTerm.toLowerCase()
    return record.studentId?.toLowerCase().includes(searchLower) || record.fullName?.toLowerCase().includes(searchLower)
  })

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <h2>Finance Dashboard</h2>

        {/* Stats Widgets */}
        <div className="finance-widgets">
          <div className="widget-card blue">
            <h3>Graduation Fee Paid</h3>
            <p>{stats.graduationFeePaid}</p>
          </div>
          <div className="widget-card yellow">
            <h3>Pending Payments</h3>
            <p>{stats.pendingPayments}</p>
          </div>
          <div className="widget-card green">
            <h3>Total Collected ($)</h3>
            <p>${stats.totalCollected.toLocaleString()}</p>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="pending-section">
          <h3>Pending Finance Approvals</h3>

          {/* Search Bar */}
          <div className="filter-bar">
            <input
              type="text"
              placeholder="🔍 Search by Student ID or Student Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
  <SkeletonTable rows={5} cols={8} />
          ) : filteredRecords.length === 0 ? (
            <p className="no-records">
              {searchTerm ? `No records found matching "${searchTerm}"` : "No pending records found."}
            </p>
          ) : (
            <table className="pending-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{record.studentId}</td>
                    <td>{record.fullName}</td>
                    <td>{record.description}</td>
                    <td>${record.amount}</td>
                    <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td>{record.type}</td>
                    <td>
                      <button className="approve-btn" onClick={() => handleApprove(record.studentId)}>
                        Approve
                      </button>
                      <button className="reject-btn" onClick={() => handleReject(record.studentId)}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default FinanceDashboard
