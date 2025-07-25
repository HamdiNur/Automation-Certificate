"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { jwtDecode } from "jwt-decode"
import LabSidebar from "../components/LabSidebar"
import { MessageCircle, Send, User, Search, X } from "lucide-react"
import "./style/style.css"

function LabChat() {
  const [conversations, setConversations] = useState([])
  const [filteredConversations, setFilteredConversations] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const messagesEndRef = useRef(null)
  const readTracker = useRef({})

  const token = localStorage.getItem("token")
  const userId = jwtDecode(token)?.id

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/chat/department/lab", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const grouped = groupMessagesByStudent(res.data)
        setConversations(grouped)
        setFilteredConversations(grouped)
      } catch (err) {
        console.error("Failed to load messages:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    const saved = localStorage.getItem("labReadTracker")
    if (saved) readTracker.current = JSON.parse(saved)

    const s = io("http://localhost:5000")
    setSocket(s)

    return () => s.disconnect()
  }, [token])

  const saveReadTracker = () => {
    localStorage.setItem("labReadTracker", JSON.stringify(readTracker.current))
  }

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter((c) =>
        c.studentName.toLowerCase().includes(searchText.toLowerCase())
      )
      setFilteredConversations(filtered)
    }
  }, [searchText, conversations])

  useEffect(() => {
    if (!socket) return

    socket.on("newMessage", (newMsg) => {
      if (newMsg.department !== "lab") return
      if (newMsg.senderId === userId) return

      const isStudentMsg = newMsg.senderType === "student"
      const studentId = isStudentMsg ? newMsg.senderId : newMsg.receiverId

      setConversations((prev) => {
        const index = prev.findIndex((c) => c.studentId === studentId)
        if (index !== -1) {
          const convo = prev[index]
          const alreadyExists = convo.messages.some((m) => m._id === newMsg._id)
          if (alreadyExists) return prev

          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            messages: [...convo.messages, newMsg],
            lastMessage: newMsg.message,
            lastMessageTime: newMsg.timestamp,
            unreadCount: (() => {
              const lastRead = readTracker.current[studentId]
              const isUnread =
                (!lastRead || new Date(newMsg.timestamp) > new Date(lastRead)) &&
                selectedStudent?.studentId !== studentId

              return isUnread ? (convo.unreadCount || 0) + 1 : convo.unreadCount || 0
            })(),
          }

          if (selectedStudent?.studentId === studentId) {
            setSelectedStudent((prevSelected) => ({
              ...prevSelected,
              messages: [...prevSelected.messages, newMsg],
            }))
          }

          return updated.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
        } else {
          return [
            {
              studentId,
              studentName: newMsg.senderName || `ID: ${studentId}`,
              messages: [newMsg],
              lastMessage: newMsg.message,
              lastMessageTime: newMsg.timestamp,
              unreadCount: 1,
            },
            ...prev,
          ]
        }
      })
    })

    return () => socket.off("newMessage")
  }, [socket, selectedStudent, userId])

  useEffect(() => {
    if (!selectedStudent) return
    const updated = conversations.find((c) => c.studentId === selectedStudent.studentId)
    if (updated && updated.messages.length !== selectedStudent.messages.length) {
      setSelectedStudent(updated)
    }
  }, [conversations])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedStudent?.messages])

  const groupMessagesByStudent = (messages) => {
    const grouped = {}
    messages.forEach((msg) => {
      const isStudent = msg.senderType === "student"
      const studentId = isStudent ? msg.senderId : msg.receiverId
      if (!studentId) return

      if (!grouped[studentId]) {
        grouped[studentId] = {
          studentId,
          studentName: isStudent ? msg.senderName : "Unknown",
          messages: [],
          lastMessage: msg.message,
          lastMessageTime: msg.timestamp,
          unreadCount: 0,
        }
      }

      grouped[studentId].messages.push(msg)

      if (new Date(msg.timestamp) > new Date(grouped[studentId].lastMessageTime)) {
        grouped[studentId].lastMessage = msg.message
        grouped[studentId].lastMessageTime = msg.timestamp
      }

      const lastRead = readTracker.current[studentId]
      const isUnread = msg.senderType === "student" &&
        (!lastRead || new Date(msg.timestamp) > new Date(lastRead))

      if (isUnread) grouped[studentId].unreadCount += 1
    })

    return Object.values(grouped).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    )
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedStudent) return
    try {
      const res = await axios.post(
        `http://localhost:5000/api/chat/reply/${selectedStudent.messages[0]._id}`,
        { message: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const newMsg = res.data

      setSelectedStudent((prev) => ({
        ...prev,
        messages: [...prev.messages, newMsg],
      }))

      setConversations((prev) =>
        prev.map((c) =>
          c.studentId === selectedStudent.studentId
            ? {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: newMsg.message,
                lastMessageTime: newMsg.timestamp,
                unreadCount: 0,
              }
            : c
        )
      )

      setReplyText("")
    } catch (err) {
      alert("Failed to send message")
      console.error(err)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = (now - date) / (1000 * 60 * 60)
    return diff < 24
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString()
  }

  const clearSearch = () => setSearchText("")

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <div className="chat-container">
          <div className="chat-sidebar">
            <div className="chat-header">
              <MessageCircle size={20} />
              <h3>Lab Chat</h3>
            </div>

            <div className="search-container">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="search-input"
                />
                {searchText && (
                  <button onClick={clearSearch} className="clear-search">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="student-list">
              {loading ? (
                <div className="loading">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="no-messages">{searchText ? "No matches" : "No messages"}</div>
              ) : (
                filteredConversations.map((c, i) => (
                  <div
                    key={i}
                    className={`student-item ${selectedStudent?.studentId === c.studentId ? "active" : ""}`}
                    onClick={() => {
                      setSelectedStudent(c)
                      readTracker.current[c.studentId] = new Date().toISOString()
                      saveReadTracker()
                      setConversations((prev) =>
                        prev.map((x) =>
                          x.studentId === c.studentId ? { ...x, unreadCount: 0 } : x
                        )
                      )
                    }}
                  >
                    <div className="student-avatar"><User size={24} /></div>
                    <div className="student-info">
                      <div className="student-name">{c.studentName}</div>
                      <div className="last-message">{c.lastMessage}</div>
                    </div>
                    <div className="message-meta">
                      <div className="message-time">{formatTime(c.lastMessageTime)}</div>
                      {c.unreadCount > 0 && (
                        <div className="unread-badge">{c.unreadCount}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-main">
            {selectedStudent ? (
              <>
                <div className="conversation-header">
                  <div className="student-avatar">
                    <User size={32} />
                  </div>
                  <div className="student-details">
                    <h4>{selectedStudent.studentName}</h4>
                    <span className="student-status">Student</span>
                  </div>
                </div>

                <div className="messages-container">
                  {selectedStudent.messages.map((msg, i) => (
                    <div
                      key={msg._id || i}
                      className={`message ${msg.senderId === userId ? "sent" : "received"}`}
                    >
                      <div className="message-content">
                        <p>{msg.message}</p>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="reply-container">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleReply()
                      }
                    }}
                    placeholder="Type a reply..."
                    className="reply-input"
                    rows={3}
                  />
                  <button
                    onClick={handleReply}
                    className="send-button"
                    disabled={!replyText.trim()}
                  >
                    <Send size={20} /> Send
                  </button>
                </div>
              </>
            ) : (
              <div className="no-conversation">
                <MessageCircle size={64} />
                <h3>Select a student to chat</h3>
                <p>Choose a conversation from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabChat
