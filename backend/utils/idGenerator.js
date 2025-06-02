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

// utils/idGenerator.js

export const generateStudentUserId = async (program, year, index = 0) => {
  const yearPart = year.toString().slice(-2); // e.g., 2021 → "21"
  const prefix = 'C1'; // Fixed for Computer Applications
  const serial = String(index + 1).padStart(4, '0'); // "0001", "0002", ...

  return `${prefix}${yearPart}${serial}`; // e.g., C1210001
};
