import xlsx from 'xlsx';
import { writeFileSync } from 'fs';

const names = [
  'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis',
  'Frank Miller', 'Grace Wilson', 'Henry Moore', 'Iris Taylor', 'Jack Anderson',
  'Kevin Lee', 'Laura Garcia', 'Mike Chen', 'Nancy Patel', 'Oliver Kim',
  'Paula Rodriguez', 'Quinn Thompson', 'Rachel Nguyen', 'Steven Davis', 'Tina Martinez',
  'Ursula Wilson', 'Victor Brown', 'Wendy Taylor', 'Xavier Johnson', 'Yara Smith',
  'Zachary Williams', 'Aaron Brown', 'Bella Davis', 'Caleb Miller', 'Diana Wilson',
  'Ethan Moore', 'Fiona Taylor', 'Gavin Anderson', 'Hannah Lee', 'Ian Garcia',
  'Julia Chen', 'Kyle Patel', 'Lily Kim', 'Mason Rodriguez', 'Nora Thompson',
  'Owen Nguyen', 'Piper Davis', 'Quincy Martinez', 'Riley Wilson', 'Samantha Brown',
  'Tyler Taylor', 'Uma Johnson', 'Vincent Smith', 'Willow Williams', 'Xander Brown',
  'Yasmine Davis', 'Zoe Miller', 'Adrian Wilson', 'Brooke Moore', 'Carter Taylor',
  'Delilah Anderson', 'Eli Lee', 'Faith Garcia', 'Gideon Chen', 'Harper Patel',
  'Isaac Kim', 'Jasmine Rodriguez', 'Kai Thompson', 'Luna Nguyen', 'Milo Davis',
  'Nova Martinez', 'Oscar Wilson', 'Penelope Brown', 'Quinn Taylor', 'Roman Johnson',
  'Scarlett Smith', 'Theo Williams', 'Violet Brown', 'Wyatt Davis', 'Xanthe Miller',
  'Yusuf Wilson', 'Zara Moore', 'Asher Taylor', 'Bailey Anderson', 'Caden Lee',
  'Daniel Garcia', 'Elena Patel', 'Felix Kim', 'Gabriella Rodriguez', 'Hunter Thompson',
  'Isabella Nguyen', 'Julian Davis', 'Katherine Martinez', 'Liam Wilson', 'Maya Brown',
  'Nathan Taylor', 'Olivia Johnson', 'Parker Smith', 'Quinn Williams', 'Ryan Brown',
  'Sophia Davis', 'Tristan Miller', 'Ulysses Wilson', 'Victoria Moore', 'William Taylor'
];

const data = names.map((name, index) => ({
  Name: name,
  'Registration Number': `REG${String(index + 1).padStart(3, '0')}`,
  Email: `${name.toLowerCase().replace(' ', '.')}@student.edu`
}));

const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

xlsx.write(workbook, { bookType: 'xlsx', type: 'file', file: '../sample_students.xlsx' });
console.log('Excel file created: sample_students.xlsx');
