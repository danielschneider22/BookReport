import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';



const BOOK_REPORT_COMMAND = {
  name: 'bookreport',
  description: 'Save a book report',
  options: [],
  type: 1,
};
const VIEW_YOUR_BOOK_REPORTS_COMMAND = {
  name: 'mybookreports',
  description: 'View all your book reports',
  options: [],
  type: 1,
};

const VIEW_ALL_BOOK_REPORTS_COMMAND = {
  name: 'allbookreports',
  description: 'View all your book reports',
  options: [],
  type: 1,
};

const ALL_COMMANDS = [BOOK_REPORT_COMMAND, VIEW_YOUR_BOOK_REPORTS_COMMAND, VIEW_ALL_BOOK_REPORTS_COMMAND];

console.log('Registering commands:', ALL_COMMANDS);
console.log('APP_ID:', process.env.APP_ID);

InstallGlobalCommands(process.env.APP_ID as string, ALL_COMMANDS)
  .then(() => console.log('Commands registered successfully'))
  .catch(error => console.error('Error registering commands:', error));