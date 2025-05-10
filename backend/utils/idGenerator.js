import Student from '../models/Student.js';
import { programPrefixes } from './programInfo.js';

import User from '../models/User.js';

// Role prefix ma
const rolePrefixes = {
  admin: 'AD',
  finance: 'FI',
  library: 'LI',
  lab: 'LB',
  exam_office: 'EX',
  faculty: 'FA'
};

export const generateStaffUserId = async (role, yearOfEmployment) => {
    const prefix = rolePrefixes[role.toLowerCase()] || 'ST';
    const year = yearOfEmployment.toString().slice(-2); // '2021' => '21'
  
    const basePrefix = `${prefix}${year}`;
  
    const count = await User.countDocuments({
      role,
      userId: { $regex: `^${basePrefix}` }
    });
  
    const serial = (count + 1).toString().padStart(4, '0');
    return `${basePrefix}${serial}`;
  };
  

//ID GEnerator

export const generateStudentUserId = async (program, yearOfAdmission) => {
  const prefix = programPrefixes[program] || "ST";
  const year = yearOfAdmission.toString().slice(-2);

  const count = await Student.countDocuments({ program, yearOfAdmission });
  const serial = (count + 1).toString().padStart(4, '0');

  return `${prefix}${year}${serial}`; // e.g., NU230001
};
