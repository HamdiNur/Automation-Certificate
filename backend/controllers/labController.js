import Lab from "../models/lab.js"
import Group from "../models/group.js"
import Student from "../models/Student.js"
import Clearance from "../models/clearance.js"
import { checkAndCreateExaminationRecord } from "../utils/examinationHelper.js"

export const getAllLabClearances = async (req, res) => {
  try {
    const records = await Lab.find()
      .populate("groupId", "groupNumber program faculty projectTitle")
      .populate("members", "fullName studentId email")
    res.status(200).json(records)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lab records", message: err.message })
  }
}

export const getLabByGroupId = async (req, res) => {
  try {
    const record = await Lab.findOne({ groupId: req.params.groupId })
      .populate("groupId", "groupNumber program")
      .populate("members", "fullName studentId email")
    if (!record) return res.status(404).json({ message: "Lab clearance not found for this group." })
    res.status(200).json(record)
  } catch (err) {
    res.status(500).json({ error: "Error fetching lab record by group ID", message: err.message })
  }
}

export const getLabByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId
    const record = await Lab.findOne({ members: studentId })
      .populate("groupId", "groupNumber program faculty")
      .populate("members", "fullName studentId email")
      .sort({ createdAt: 1 })

    if (!record) return res.status(404).json({ message: "Lab clearance not found for this student." })
    res.status(200).json(record)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lab record", message: err.message })
  }
}

export const getPendingLab = async (req, res) => {
  try {
    const query = req.query.search?.trim()

    const labs = await Lab.find({ status: { $in: ["Pending", "Incomplete"] } })
      .populate("groupId", "groupNumber projectTitle")
      .populate("members", "fullName studentId")

    const results = await Promise.all(
      labs.map(async (lab) => {
        const student = lab.members[0]
        const clearance = await Clearance.findOne({ studentId: student._id }).lean()

        const facultyCleared = clearance?.faculty?.status === "Approved"
        const libraryCleared = clearance?.library?.status === "Approved"
        const libraryDate = clearance?.library?.clearedAt

        return facultyCleared && libraryCleared ? { ...lab.toObject(), libraryDate } : null
      }),
    )

    const validLabs = results.filter(Boolean)
    validLabs.sort((a, b) => new Date(a.libraryDate) - new Date(b.libraryDate))

    const normalizedQuery = query?.toLowerCase().replace(/\s+/g, "") || ""

    const filtered = query
      ? validLabs.filter((lab) => {
          const groupNumber = lab.groupId?.groupNumber?.toString() || ""
          const groupFull = `group${groupNumber}`.toLowerCase().replace(/\s+/g, "")
          const projectTitle = lab.groupId?.projectTitle?.toLowerCase() || ""

          const matchGroup = groupFull.includes(normalizedQuery) || groupNumber.includes(normalizedQuery)
          const matchTitle = projectTitle.includes(normalizedQuery)
          const matchStudent = lab.members.some((m) =>
            `${m.fullName} ${m.studentId}`.toLowerCase().replace(/\s+/g, "").includes(normalizedQuery),
          )

          return matchGroup || matchTitle || matchStudent
        })
      : validLabs

    return res.status(200).json(filtered)
  } catch (err) {
    console.error("❌ Lab pending fetch error:", err)
    return res.status(500).json({ message: "Error fetching pending lab records", error: err.message })
  }
}

export const approveLab = async (req, res) => {
  try {
    const { groupId, approvedBy, returnedItems, issues } = req.body;
    const record = await Lab.findOne({ groupId });

    if (!record) {
      return res.status(404).json({ message: "Lab record not found" });
    }

    const expected = (record.expectedItems || []).map(i => i.trim().toLowerCase());
    const returned = Array.isArray(returnedItems)
      ? returnedItems.map(i => i.trim().toLowerCase())
      : (returnedItems || "").split(",").map(i => i.trim().toLowerCase());

    const missingItems = expected.filter(item => !returned.includes(item));

    if (missingItems.length > 0) {
      record.status = "Incomplete";
      record.issues = `Missing: ${missingItems.join(", ")}`;
    } else {
      record.status = "Approved";
      record.issues = issues || "None";
    }

    record.clearedAt = new Date();
    record.approvedBy = approvedBy || "System";
    record.returnedItems = returned;

    record.history = record.history || [];
    record.history.push({
      status: record.status,
      reason:
        record.status === "Incomplete"
          ? "Missing returned items"
          : issues || "All items returned",
      actor: req.user._id,
      date: new Date(),
    });

    await record.save();

    if (record.status === "Approved") {
      await Group.updateOne(
        { _id: groupId },
        {
          $set: {
            "clearanceProgress.lab.status": "Approved",
            "clearanceProgress.lab.date": new Date(),
          },
        }
      );
    }

    const students = await Student.find({ groupId }).select("_id");
    for (const student of students) {
      let clearance = await Clearance.findOne({ studentId: student._id });
      if (!clearance) {
        clearance = new Clearance({
          studentId: student._id,
          lab: {
            status: record.status,
            clearedAt: record.clearedAt,
          },
        });
      } else {
        clearance.lab.status = record.status;
        clearance.lab.clearedAt = record.clearedAt;
      }
      await clearance.save();

      if (record.status === "Approved") {
        const examResult = await checkAndCreateExaminationRecord(student._id);
        if (examResult.created && global._io) {
          global._io.emit("newStudentEligible", {
            studentId: student._id,
            message: "🧪 Lab approved and examination record created",
            timestamp: new Date(),
          });
        }
      }
    }

    // ✅ Emit full status update
    if (global._io) {
      global._io.emit("labStatusChanged", {
        groupId,
        status: record.status,
        issues: record.issues,
        expectedItems: record.expectedItems || [],
        returnedItems: record.returnedItems || [],
        timestamp: new Date(),
      });

      if (record.status === "Approved") {
        global._io.emit("lab:cleared", {
          groupId,
          message: "✅ Lab cleared. Students with approved finance can now proceed to examination.",
          timestamp: new Date(),
        });
      }
    }

    return res.status(200).json({
      message:
        record.status === "Incomplete"
          ? "Lab marked as incomplete. Returned items were not complete."
          : "✅ Lab approved! Students with approved finance can now proceed to examination.",
    });
  } catch (err) {
    console.error("❌ Lab approval error:", err);
    return res.status(500).json({ message: "Approval failed", error: err.message });
  }
};


export const rejectLab = async (req, res) => {
  try {
    const { groupId, issues } = req.body;

    const record = await Lab.findOne({ groupId });
    if (!record) {
      return res.status(404).json({ message: "Lab record not found" });
    }

    record.status = "Rejected";
    record.issues = issues || "Unspecified";
    record.clearedAt = null;

    record.history = record.history || [];
    record.history.push({
      status: "Rejected",
      reason: issues || "Unspecified",
      actor: req.user._id,
      date: new Date(),
    });

    await record.save();

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          "clearanceProgress.lab.status": "Rejected",
          "clearanceProgress.lab.date": new Date(),
        },
      }
    );

    const students = await Student.find({ groupId }).select("_id");
    for (const student of students) {
      const clearance = await Clearance.findOne({ studentId: student._id });
      if (clearance) {
        clearance.lab.status = "Rejected";
        clearance.lab.clearedAt = null;
        await clearance.save();
      }
    }

    if (global._io) {
      global._io.emit("labStatusChanged", {
        groupId,
        status: "Rejected",
        issues,
        expectedItems: record.expectedItems || [],
        returnedItems: record.returnedItems || [],
        timestamp: new Date(),
      });
    }

    res.status(200).json({ message: "Lab record rejected and student clearances updated." });
  } catch (err) {
    console.error("❌ Lab rejection error:", err);
    res.status(500).json({ error: "Rejection failed", message: err.message });
  }
};


export const getLabStats = async (req, res) => {
  try {
    const allLabs = await Lab.find().select("groupId status members")

    const results = await Promise.all(
      allLabs.map(async (lab) => {
        const student = lab.members[0]
        const clearance = await Clearance.findOne({ studentId: student }).lean()

        const facultyCleared = clearance?.faculty?.status === "Approved"
        const libraryCleared = clearance?.library?.status === "Approved"

        return {
          status: lab.status,
          isReady: facultyCleared && libraryCleared,
        }
      }),
    )

    let pending = 0,
      approved = 0,
      rejected = 0

    for (const r of results) {
      if (r.status === "Pending" && r.isReady) pending++
      else if (r.status === "Approved") approved++
      else if (r.status === "Rejected") rejected++
    }

    return res.status(200).json({ pending, approved, rejected })
  } catch (err) {
    console.error("❌ getLabStats error:", err)
    return res.status(500).json({ message: "Failed to fetch lab stats", error: err.message })
  }
}

export const getLabProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const profile = await Lab.findById(userId)

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }
    res.status(200).json(profile)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message })
  }
}

export const markLabReadyAgain = async (req, res) => {
  const { groupId } = req.body;
  const actorId = req.user._id;

  try {
    const lab = await Lab.findOne({ groupId });
    if (!lab) {
      return res.status(404).json({ message: "Lab record not found." });
    }

    if (lab.status !== "Rejected") {
      return res.status(400).json({
        message: "Only rejected lab records can be marked ready again.",
      });
    }

    lab.status = "Pending";
    lab.issues = "";
    lab.returnedItems = [];
    lab.clearedAt = null;

    lab.history = lab.history || [];
    lab.history.push({
      status: "Pending",
      reason: "Marked ready again after rejection",
      actor: actorId,
      date: new Date(),
    });

    await lab.save();

    await Group.updateOne(
      { _id: groupId },
      {
        $set: {
          "clearanceProgress.lab.status": "Pending",
          "clearanceProgress.lab.date": new Date(),
        },
      }
    );

    const students = await Student.find({ groupId }).select("_id");
    for (const student of students) {
      let clearance = await Clearance.findOne({ studentId: student._id });
      if (!clearance) {
        clearance = new Clearance({
          studentId: student._id,
          lab: {
            status: "Pending",
            clearedAt: null,
          },
        });
      } else {
        clearance.lab.status = "Pending";
        clearance.lab.clearedAt = null;
      }
      await clearance.save();
    }

    if (global._io) {
      global._io.emit("labStatusChanged", {
        groupId,
        status: "Pending",
        issues: "",
        expectedItems: lab.expectedItems || [],
        returnedItems: [],
        timestamp: new Date(),
      });

      global._io.emit("lab-resubmission", {
        groupId,
        status: "Pending",
        timestamp: new Date(),
      });
    }

    res.status(200).json({ message: "Lab marked as ready again." });
  } catch (err) {
    console.error("❌ markLabReadyAgain error:", err);
    res.status(500).json({
      message: "Failed to mark lab as ready again",
      error: err.message,
    });
  }
};

export const getLabHistory = async (req, res) => {
  try {
    const { groupId } = req.params
    const lab = await Lab.findOne({ groupId }).populate("history.actor", "fullName role")

    if (!lab) return res.status(404).json({ message: "Lab record not found" })

    return res.status(200).json({ history: lab.history || [] })
  } catch (err) {
    console.error("❌ Lab history fetch error:", err)
    res.status(500).json({ message: "Failed to fetch lab history", error: err.message })
  }
}

export const getMyGroupLab = async (req, res) => {
  try {
    console.log(`📥 getMyGroupLab called by: ${req.user?.id || req.user?.studentId}`)

    let student = null

    if (req.user.id) {
      student = await Student.findById(req.user.id)
    }
    if (!student && req.user.studentId) {
      student = await Student.findOne({ studentId: req.user.studentId })
    }

    if (!student) {
      console.warn("❌ Student not found.")
      return res.status(404).json({ ok: false, message: "Student not found" })
    }

    if (!student.groupId) {
      console.warn("⚠️ Student is not assigned to any group.")
      return res.status(404).json({ ok: false, message: "Student not assigned to a group" })
    }

    const labRecord = await Lab.findOne({ groupId: student.groupId })

    if (!labRecord) {
      console.info("ℹ️ No lab clearance started for this group.")
      return res.status(200).json({ ok: false, message: "No lab clearance started for this group" })
    }

    return res.status(200).json({
      ok: true,
      status: labRecord.status,
      issues: labRecord.issues || "",
      expectedItems: labRecord.expectedItems || [],
      returnedItems: labRecord.returnedItems || [],
      groupId: student.groupId,
      clearedAt: labRecord.clearedAt,
    })
  } catch (err) {
    console.error("❌ getMyGroupLab error:", err.message)
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch your group's lab clearance status",
      error: err.message,
    })
  }
}
