import React, { useState } from "react";
import LabSidebar from "../components/LabSidebar";
import "./style/style.css"
const initialEquipment = [
  { id: 1, group: "Group 1", equipment: "Arduino Kit", status: "Returned" },
  { id: 2, group: "Group 2", equipment: "Multimeter", status: "Not Returned" },
  { id: 3, group: "Group 3", equipment: "Projector", status: "Returned" },
  { id: 4, group: "Group 4", equipment: "Sensor Board", status: "Not Returned" },
];

function LabEquipment() {
  const [equipmentList, setEquipmentList] = useState(initialEquipment);

  const toggleStatus = (id) => {
    const updated = equipmentList.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === "Returned" ? "Not Returned" : "Returned",
          }
        : item
    );
    setEquipmentList(updated);
  };

  return (
    <div className="dashboard-wrapper">
      <LabSidebar />
      <div className="dashboard-main">
        <h2>Equipment Return Tracker</h2>

        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Equipment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.map((item) => (
              <tr key={item.id}>
                <td>{item.group}</td>
                <td>{item.equipment}</td>
                <td>
                  <span className={`badge ${item.status.toLowerCase().replace(" ", "-")}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button
                    className={item.status === "Returned" ? "btn-reject" : "btn-approve"}
                    onClick={() => toggleStatus(item.id)}
                  >
                    Mark as {item.status === "Returned" ? "Not Returned" : "Returned"}
                  </button>
                </td>
              </tr>
            ))}
            {equipmentList.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#777" }}>
                  No equipment data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LabEquipment;
