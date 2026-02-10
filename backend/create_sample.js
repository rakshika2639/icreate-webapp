import xlsx from 'xlsx';
import { writeFileSync } from 'fs';

const data = [
  { Name: 'Alice Johnson', 'Registration Number': 'REG001', Email: 'alice.johnson@student.edu' },
  { Name: 'Bob Smith', 'Registration Number': 'REG002', Email: 'bob.smith@student.edu' },
  { Name: 'Carol Williams', 'Registration Number': 'REG003', Email: 'carol.williams@student.edu' },
  { Name: 'David Brown', 'Registration Number': 'REG004', Email: 'david.brown@student.edu' },
  { Name: 'Emma Davis', 'Registration Number': 'REG005', Email: 'emma.davis@student.edu' },
  { Name: 'Frank Miller', 'Registration Number': 'REG006', Email: 'frank.miller@student.edu' },
  { Name: 'Grace Wilson', 'Registration Number': 'REG007', Email: 'grace.wilson@student.edu' },
  { Name: 'Henry Moore', 'Registration Number': 'REG008', Email: 'henry.moore@student.edu' },
  { Name: 'Iris Taylor', 'Registration Number': 'REG009', Email: 'iris.taylor@student.edu' },
  { Name: 'Jack Anderson', 'Registration Number': 'REG010', Email: 'jack.anderson@student.edu' }
];

const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

xlsx.write(workbook, { bookType: 'xlsx', type: 'file', file: '../sample_students.xlsx' });
console.log('Excel file created: sample_students.xlsx');
