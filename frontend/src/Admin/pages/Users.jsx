import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const sampleUsers = [
  { id: 1, name: "Admin One", email: "admin1@just.edu.so", role: "Super Admin" },
  { id: 2, name: "Fatima Admin", email: "fatima@just.edu.so", role: "Faculty Admin" },
  { id: 3, name: "Ali Finance", email: "ali@just.edu.so", role: "Finance Admin" },
];

function Users() {
  const [users, setUsers] = useState(sampleUsers);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = () => {
    const newEntry = {
      id: Date.now(),
      ...newUser,
    };
    setUsers([...users, newEntry]);
    setNewUser({ name: "", email: "", role: "" });
    setShowAddModal(false);
  };

  const handleDelete = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleSaveEdit = () => {
    setUsers((prev) =>
      prev.map((u) => (u.id === editUser.id ? editUser : u))
    );
    setShowEditModal(false);
    setEditUser(null);
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <h2>System Users</h2>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-approve" onClick={() => setShowAddModal(true)}>
            + Add User
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    className="btn-view"
                    onClick={() => {
                      setEditUser(user);
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn-reject" onClick={() => handleDelete(user.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#777" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ➕ Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New User</h3>
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            />
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={handleAddUser}>
                Add User
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowAddModal(false);
                  setNewUser({ name: "", email: "", role: "" });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit User Modal */}
      {showEditModal && editUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit User</h3>
            <input
              type="text"
              placeholder="Name"
              value={editUser.name}
              onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={editUser.email}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Role"
              value={editUser.role}
              onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
            />
            <div className="modal-buttons">
              <button className="btn-confirm" onClick={handleSaveEdit}>
                Save Changes
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowEditModal(false);
                  setEditUser(null);
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

export default Users;
