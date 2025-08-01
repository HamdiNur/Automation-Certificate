"use client"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { jwtDecode } from "jwt-decode"
import FinanceSidebar from "../components/FinanceSidebar"
import { MessageCircle, Send, User, Search, X } from "lucide-react"
import "./styling/style.css"

function FinanceChat() {
  const [conversations, setConversations] = useState([])
  const [filteredConversations, setFilteredConversations] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [typingUsers, setTypingUsers] = useState({})
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const readTracker = useRef({})
  const token = localStorage.getItem("token")
  const userId = jwtDecode(token)?.id

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/chat/department/finance", {
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
    const saved = localStorage.getItem("readTracker")
    if (saved) readTracker.current = JSON.parse(saved)

    const s = io("http://localhost:5000")
    setSocket(s)

    // Listen for typing events
    s.on("userTyping", ({ userId: typingUserId, studentId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [studentId]: isTyping ? typingUserId : null,
      }))
    })

    return () => s.disconnect()
  }, [token])

  const saveReadTracker = () => {
    localStorage.setItem("readTracker", JSON.stringify(readTracker.current))
  }

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !selectedStudent) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit("typing", {
        studentId: selectedStudent.studentId,
        userId,
        isTyping: true,
      })
    }

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit("typing", {
        studentId: selectedStudent.studentId,
        userId,
        isTyping: false,
      })
    }, 1000)
  }

  // Search functionality
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter((conversation) =>
        conversation.studentName.toLowerCase().includes(searchText.toLowerCase()),
      )
      setFilteredConversations(filtered)
    }
  }, [searchText, conversations])

  useEffect(() => {
    if (!socket) return

    socket.on("newMessage", (newMsg) => {
      if (newMsg.department !== "finance") return
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
              return isUnread ? (prev[index]?.unreadCount || 0) + 1 : prev[index]?.unreadCount || 0
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
          if (selectedStudent?.studentId === studentId) {
            setSelectedStudent((prevSelected) => ({
              ...prevSelected,
              messages: [...prevSelected.messages, newMsg],
            }))
          }
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
          studentName: isStudent ? msg.senderName : "Unknown Student",
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
      const isUnreadStudentMessage =
        msg.senderType === "student" && (!lastRead || new Date(msg.timestamp) > new Date(lastRead))

      if (isUnreadStudentMessage) {
        grouped[studentId].unreadCount += 1
      }
    })

    return Object.values(grouped).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedStudent) return

    try {
      const response = await axios.post(
        `http://localhost:5000/api/chat/reply/${selectedStudent.messages[0]._id}`,
        { message: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      const newMessage = response.data
      setSelectedStudent((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }))

      setConversations((prev) => {
        const updated = [...prev]
        const index = updated.findIndex((c) => c.studentId === selectedStudent.studentId)
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            messages: [...updated[index].messages, newMessage],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.timestamp,
            unreadCount: 0,
          }
        }
        return updated
      })

      setReplyText("")

      // Stop typing indicator
      if (socket) {
        socket.emit("typing", {
          studentId: selectedStudent.studentId,
          userId,
          isTyping: false,
        })
      }
      setIsTyping(false)
    } catch (err) {
      alert("Failed to send reply.")
      console.error(err)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    return diffInHours < 24
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString()
  }

  const clearSearch = () => {
    setSearchText("")
  }

  // Group messages by sender for WhatsApp-like display
  const groupConsecutiveMessages = (messages) => {
    const grouped = []
    let currentGroup = null

    messages.forEach((message, index) => {
      const isSameSender = currentGroup && currentGroup.senderId === message.senderId
      const timeDiff = currentGroup
        ? new Date(message.timestamp) - new Date(currentGroup.messages[currentGroup.messages.length - 1].timestamp)
        : 0
      const isWithinTimeLimit = timeDiff < 5 * 60 * 1000 // 5 minutes

      if (isSameSender && isWithinTimeLimit) {
        currentGroup.messages.push(message)
      } else {
        if (currentGroup) grouped.push(currentGroup)
        currentGroup = {
          senderId: message.senderId,
          senderName: message.senderName,
          senderType: message.senderType,
          messages: [message],
        }
      }
    })

    if (currentGroup) grouped.push(currentGroup)
    return grouped
  }

  return (
    <div className="dashboard-wrapper">
      <FinanceSidebar />
      <div className="dashboard-main">
        <div className="whatsapp-chat-container">
          <div className="whatsapp-sidebar">
            <div className="whatsapp-sidebar-header">
              <div className="sidebar-title">
                <MessageCircle size={20} />
                <h3>Finance Chat</h3>
              </div>
            </div>

            {/* Compact Search Bar */}
            <div className="whatsapp-search-container">
              <div className="whatsapp-search-wrapper">
                <Search size={16} className="whatsapp-search-icon" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="whatsapp-search-input"
                />
                {searchText && (
                  <button onClick={clearSearch} className="whatsapp-clear-search">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="whatsapp-conversations">
              {loading ? (
                <div className="whatsapp-loading">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="whatsapp-no-messages">{searchText ? "No conversations found" : "No messages yet"}</div>
              ) : (
                filteredConversations.map((conversation, index) => (
                  <div
                    key={index}
                    className={`whatsapp-conversation-item ${
                      selectedStudent?.studentId === conversation.studentId ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedStudent(conversation)
                      readTracker.current[conversation.studentId] = new Date().toISOString()
                      saveReadTracker()
                      setConversations((prev) =>
                        prev.map((c) => (c.studentId === conversation.studentId ? { ...c, unreadCount: 0 } : c)),
                      )
                    }}
                  >
                    <div className="whatsapp-avatar">
                      <User size={20} />
                    </div>
                    <div className="whatsapp-conversation-content">
                      <div className="whatsapp-conversation-header">
                        <span className="whatsapp-name">{conversation.studentName}</span>
                        <span className="whatsapp-time">{formatTime(conversation.lastMessageTime)}</span>
                      </div>
                      <div className="whatsapp-last-message-row">
                        <span className="whatsapp-last-message">{conversation.lastMessage}</span>
                        {conversation.unreadCount > 0 && (
                          <div className="whatsapp-unread-badge">{conversation.unreadCount}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="whatsapp-chat-main">
            {selectedStudent ? (
              <>
                <div className="whatsapp-chat-header">
                  <div className="whatsapp-header-content">
                    <div className="whatsapp-avatar">
                      <User size={24} />
                    </div>
                    <div className="whatsapp-header-info">
                      <h4 className="whatsapp-header-name">{selectedStudent.studentName}</h4>
                      <span className="whatsapp-header-status">
                        {typingUsers[selectedStudent.studentId] ? "typing..." : "Student"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="whatsapp-messages-container">
                  {groupConsecutiveMessages(selectedStudent.messages).map((group, groupIndex) => (
                    <div key={groupIndex} className="whatsapp-message-group">
                      {group.senderType === "student" && <div className="whatsapp-sender-name">{group.senderName}</div>}
                      {group.messages.map((message, messageIndex) => (
                        <div
                          key={message._id || messageIndex}
                          className={`whatsapp-message ${message.senderId === userId ? "sent" : "received"}`}
                        >
                          <div className="whatsapp-message-bubble">
                            <p className="whatsapp-message-text">{message.message}</p>
                            <span className="whatsapp-message-time">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {typingUsers[selectedStudent.studentId] && (
                    <div className="whatsapp-typing-indicator">
                      <div className="whatsapp-typing-bubble">
                        <div className="whatsapp-typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="whatsapp-input-container">
                  <div className="whatsapp-input-wrapper">
                    <textarea
                      value={replyText}
                      onChange={(e) => {
                        setReplyText(e.target.value)
                        handleTyping()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleReply()
                        }
                      }}
                      placeholder="Type a message..."
                      className="whatsapp-input"
                      rows={1}
                    />
                    <button onClick={handleReply} className="whatsapp-send-button" disabled={!replyText.trim()}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="whatsapp-no-conversation">
                <MessageCircle size={64} />
                <h3>Select a student to start chatting</h3>
                <p>Choose a conversation from the sidebar to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceChat
