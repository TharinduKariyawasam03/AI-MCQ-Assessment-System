// Loads demo data: one teacher, three students, a class with a syllabus, two marked papers.
// Safe to run again: it replaces only the demo accounts and what belongs to them.
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './config/db.js';
import { uploadsRoot } from './middleware/upload.js';
import Class from './models/Class.js';
import Paper from './models/Paper.js';
import Submission from './models/Submission.js';
import User from './models/User.js';
import { gradeAnswers } from './services/grading.js';

const PASSWORD = 'password123';

const TEACHER = { name: 'Nimal Perera', email: 'teacher@myteacher.lk', institute: 'Sigma Institute, Colombo', subjects: ['Physics'], bio: 'A/L Physics teacher with 12 years of tuition experience.' };

const STUDENTS = [
  { name: 'Kavindu Silva', email: 'kavindu@myteacher.lk', school: 'Royal College', grade: 'Grade 13', avatarColor: '#0d9488', weak: ['Electricity'] },
  { name: 'Sanduni Fernando', email: 'sanduni@myteacher.lk', school: 'Visakha Vidyalaya', grade: 'Grade 13', avatarColor: '#7c3aed', weak: ['Waves', 'Thermal physics'] },
  { name: 'Tharushi Jayasinghe', email: 'tharushi@myteacher.lk', school: 'Devi Balika Vidyalaya', grade: 'Grade 13', avatarColor: '#ea580c', weak: [] },
];

const TOPICS = [
  { name: 'Mechanics', theory: 'Motion is described by velocity and acceleration: a = (v - u) / t. Newton\'s second law gives the net force F = ma. Momentum is p = mv and kinetic energy is KE = ½mv². Always list the known quantities first, then choose the equation that links them.' },
  { name: 'Waves', theory: 'Wave speed is v = fλ and the period is T = 1/f. Sound is a mechanical wave, so it needs a medium and cannot travel through a vacuum. Refraction is the bending of a wave when its speed changes on entering a new medium.' },
  { name: 'Electricity', theory: 'Ohm\'s law: V = IR. Resistors in series add: R = R1 + R2. In parallel: 1/R = 1/R1 + 1/R2, so the total is smaller than the smallest resistor. Power dissipated is P = VI = I²R.' },
  { name: 'Thermal physics', theory: 'Heat needed to change temperature is Q = mcΔθ. Conduction and convection need a medium, radiation does not. Absolute zero is 0 K = -273 °C. For a fixed mass of gas at constant temperature, pV is constant (Boyle\'s law).' },
  { name: 'Modern physics', theory: 'The photoelectric effect shows light arrives as particles called photons, each with energy E = hf. After each half-life, half of the remaining radioactive nuclei have decayed. An alpha particle is a helium nucleus (2 protons, 2 neutrons); a neutron has no charge.' },
];

// [question, options, index of the correct option, topic name]
const PAPERS = [
  {
    title: 'Term Test 1 - Mixed MCQ',
    daysAgo: 21,
    questions: [
      ['A car accelerates uniformly from rest to 20 m/s in 5 s. What is its acceleration?', ['2 m/s²', '4 m/s²', '5 m/s²', '10 m/s²'], 1, 'Mechanics'],
      ['What net force gives a 2 kg mass an acceleration of 3 m/s²?', ['1.5 N', '5 N', '6 N', '9 N'], 2, 'Mechanics'],
      ['A wave has a frequency of 50 Hz and a wavelength of 0.4 m. What is its speed?', ['12.5 m/s', '20 m/s', '125 m/s', '200 m/s'], 1, 'Waves'],
      ['Sound cannot travel through which of these?', ['Air', 'Water', 'Steel', 'A vacuum'], 3, 'Waves'],
      ['What current flows through a 10 Ω resistor connected across 5 V?', ['0.2 A', '0.5 A', '2 A', '50 A'], 1, 'Electricity'],
      ['Two 6 Ω resistors are connected in parallel. What is the total resistance?', ['12 Ω', '6 Ω', '3 Ω', '1.5 Ω'], 2, 'Electricity'],
      ['How much heat raises the temperature of 2 kg of water by 10 K? (c = 4200 J/kg K)', ['8 400 J', '42 000 J', '84 000 J', '840 000 J'], 2, 'Thermal physics'],
      ['Which method of heat transfer does not need a medium?', ['Conduction', 'Convection', 'Radiation', 'Evaporation'], 2, 'Thermal physics'],
      ['The photoelectric effect is evidence that light behaves as', ['a transverse wave', 'a stream of particles', 'a longitudinal wave', 'a sound wave'], 1, 'Modern physics'],
      ['A radioactive sample has a half-life of 2 days. What fraction remains after 6 days?', ['1/2', '1/4', '1/6', '1/8'], 3, 'Modern physics'],
    ],
  },
  {
    title: 'Term Test 2 - Mixed MCQ',
    daysAgo: 7,
    questions: [
      ['What is the momentum of a 3 kg object moving at 4 m/s?', ['0.75 kg m/s', '7 kg m/s', '12 kg m/s', '24 kg m/s'], 2, 'Mechanics'],
      ['What is the kinetic energy of a 2 kg object moving at 3 m/s?', ['3 J', '6 J', '9 J', '18 J'], 2, 'Mechanics'],
      ['What is the period of a wave with a frequency of 4 Hz?', ['0.25 s', '0.4 s', '2.5 s', '4 s'], 0, 'Waves'],
      ['The bending of light as it passes from air into glass is called', ['reflection', 'refraction', 'diffraction', 'dispersion'], 1, 'Waves'],
      ['What power is dissipated by a 4 Ω resistor carrying a current of 2 A?', ['2 W', '8 W', '16 W', '32 W'], 2, 'Electricity'],
      ['Three 2 Ω resistors are connected in series. What is the total resistance?', ['0.67 Ω', '2 Ω', '6 Ω', '8 Ω'], 2, 'Electricity'],
      ['Absolute zero is approximately', ['0 °C', '-100 °C', '-273 °C', '-373 °C'], 2, 'Thermal physics'],
      ['The volume of a fixed mass of gas is halved at constant temperature. Its pressure', ['halves', 'stays the same', 'doubles', 'becomes four times larger'], 2, 'Thermal physics'],
      ['Which particle has no electric charge?', ['Proton', 'Electron', 'Neutron', 'Alpha particle'], 2, 'Modern physics'],
      ['An alpha particle is', ['an electron', 'a helium nucleus', 'a photon', 'a neutron'], 1, 'Modern physics'],
    ],
  },
];

const PLACEHOLDER_SHEET = '/uploads/sheets/demo-sheet.svg';

function writePlaceholderSheet() {
  const dir = path.join(uploadsRoot, 'sheets');
  fs.mkdirSync(dir, { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#f0fdf4"/><rect x="40" y="40" width="520" height="720" rx="12" fill="#fff" stroke="#16a34a" stroke-width="2"/><text x="300" y="390" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#15803d">Demo answer sheet</text><text x="300" y="424" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#5b6b62">Seeded data has no real photo</text></svg>`;
  fs.writeFileSync(path.join(dir, 'demo-sheet.svg'), svg);
}

async function removeDemoData() {
  const emails = [TEACHER.email, ...STUDENTS.map((s) => s.email)];
  const users = await User.find({ email: { $in: emails } }).select('_id');
  const userIds = users.map((u) => u._id);
  const classes = await Class.find({ teacher: { $in: userIds } }).select('_id');
  const classIds = classes.map((c) => c._id);

  await Submission.deleteMany({ $or: [{ class: { $in: classIds } }, { student: { $in: userIds } }] });
  await Paper.deleteMany({ class: { $in: classIds } });
  await Class.deleteMany({ _id: { $in: classIds } });
  await Class.updateMany({}, { $pull: { students: { $in: userIds } } });
  await User.deleteMany({ _id: { $in: userIds } });
}

await connectDb();
await removeDemoData();
writePlaceholderSheet();

const passwordHash = await bcrypt.hash(PASSWORD, 10);
const teacher = await User.create({ ...TEACHER, role: 'teacher', passwordHash });
const students = await User.insertMany(
  STUDENTS.map(({ weak, ...student }) => ({ ...student, role: 'student', passwordHash }))
);

const cls = await Class.create({
  name: 'A/L Physics 2026 Theory',
  subject: 'Physics',
  grade: 'Grade 13',
  teacher: teacher._id,
  joinCode: 'PHY26A',
  students: students.map((s) => s._id),
  topics: TOPICS,
});
const topicId = (name) => cls.topics.find((t) => t.name === name)._id;

for (const [paperIndex, def] of PAPERS.entries()) {
  const testDate = new Date(Date.now() - def.daysAgo * 864e5);
  const paper = await Paper.create({
    class: cls._id,
    teacher: teacher._id,
    title: def.title,
    testDate,
    optionCount: 4,
    status: 'published',
    questions: def.questions.map(([text, options, correctOption, topic], i) => ({
      number: i + 1,
      text,
      options,
      correctOption,
      topicId: topicId(topic),
    })),
  });

  for (const [studentIndex, student] of students.entries()) {
    const weak = STUDENTS[studentIndex].weak;
    // Wrong on weak topics, plus one slip elsewhere so nobody is perfect on every paper.
    const slip = (studentIndex + paperIndex * 3) % def.questions.length;
    const selections = def.questions.map(([, , correct, topic], i) =>
      weak.includes(topic) || i === slip ? (correct + 1) % 4 : correct
    );
    await Submission.create({
      paper: paper._id,
      class: cls._id,
      student: student._id,
      imageUrl: PLACEHOLDER_SHEET,
      createdAt: new Date(testDate.getTime() + 36e5),
      ...gradeAnswers(paper, selections),
    });
  }
}

console.log('\nDemo data loaded. Log in with:');
console.log(`  Teacher  ${TEACHER.email}  /  ${PASSWORD}`);
for (const s of STUDENTS) console.log(`  Student  ${s.email}  /  ${PASSWORD}`);
console.log(`  Class join code: ${cls.joinCode}\n`);

await disconnectDb();
process.exit(0);
