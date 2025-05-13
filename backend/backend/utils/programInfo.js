// utils/programInfo.js

export const getFacultyByProgram = (program) => {
  const facultyMap = {
    // ✅ Health Programs
    "Bachelor of Medicine & Bachelor of Surgery": "Faculty of Health Sciences",
    "BSc. Nursing": "Faculty of Health Sciences",
    "BSc. Medical Laboratory Science": "Faculty of Health Sciences",
    "BSc. Public Health": "Faculty of Health Sciences",
    "Diploma in Pharmacology": "Faculty of Health Sciences",
    "Diploma in Midwifery": "Faculty of Health Sciences",
    "Diploma in Optometry": "Faculty of Health Sciences",

    // ✅ Business & Economics
    "BSc. in Business Administration": "Faculty of Business & Economics",
    "BSc. in Accounting & Finance": "Faculty of Business & Economics",
    "BSc. in Public Administration": "Faculty of Business & Economics",

    // ✅ Computing
    "Bachelor of Science in Computer Applications": "Faculty of Computing & IT",
  };

  return facultyMap[program] || "Unknown Faculty";
};

export const programDurations = {
  // ✅ Health Programs
  "Bachelor of Medicine & Bachelor of Surgery": 6,
  "BSc. Nursing": 4,
  "BSc. Medical Laboratory Science": 4,
  "BSc. Public Health": 4,
  "Diploma in Pharmacology": 1,
  "Diploma in Midwifery": 1,
  "Diploma in Optometry": 1,

  // ✅ Business Programs
  "BSc. in Business Administration": 4,
  "BSc. in Accounting & Finance": 4,
  "BSc. in Public Administration": 4,

  // ✅ IT Programs
  "Bachelor of Science in Computer Applications": 5,
};

  
  // Define program prefixes for student ID generation
  export const programPrefixes = {
    "Bachelor of Medicine & Bachelor of Surgery": "MB",
    "BSc. Nursing": "NU",
    "BSc. Medical Laboratory Science": "ML",
    "BSc. Public Health": "PH",
    "Diploma in Pharmacology": "DP",
    "Diploma in Midwifery": "DM",
    "Diploma in Optometry": "DO",
    "BSc. in Business Administration": "BA",
    "BSc. in Accounting & Finance": "AF",
    "BSc. in Public Administration": "PA",
    "Bachelor of Science in Computer Applications": "CA"
  };
  