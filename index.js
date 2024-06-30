process.stdout.write('\x1b]0;ShellMind\x07');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const wordwrap = require("wordwrapjs");
const util = require("util");
const readline = require('node:readline');
require('dotenv').config({ path: '/home/lilaf/projects/shellmind/.env'});

const gemini = new GoogleGenerativeAI(process.env.API_KEY);

const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash"});

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout
});

const askQuestion = util.promisify(rl.question).bind(rl);


let conversationHistory = [];

function addToHistory(role, content) {
    conversationHistory.push({
      role: role,
      parts: [{ text: content }]
    });
  }
  
function paddedWrap(text, options = {}) {
    let wrapped = wordwrap.wrap(text, options);

    const paddingStr = '  ';
    return wrapped.split('\n').map(line => paddingStr + line).join('\n');
}

async function generateResponse(text) {
    const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 4000,
        },
      });
  
      const result = await chat.sendMessage(text);
      const response = result.response;
      
      addToHistory('model', response.text());
  
      return response.text();
}

async function main() {
  try {
    const startupText = await generateResponse(`This message comes from the code of ShellMind.
      You are an AI assistant named ShellMind.
      You exist within a console, and must respond to the user.
      Here is some info about ShellMind:
        It is purely withing the terminal.
        It is created by Lilaf.
        It is created in Node.js.
      
      Stay friendly and AVOID FORMATTING. Seriously, avoid formatting.
      This is because formatting doesn't work in the Node console without a bunch of annoying code.

      Start by greeting the user named ${process.env.USER}, please.`);
    console.log("  ShellMind: " + paddedWrap(startupText, { width: 50, break: false}));
    while(true) {
        const question = await askQuestion("   > ");
        addToHistory("user", question);
        const response = await generateResponse(question);
        console.log(`\n  ShellMind: ${paddedWrap(response, { width: 50, break: false})}`);
    }
  } catch (err) {
    console.log("ShellMind had an error: ", err);
    console.log('Press any key to exit');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
  }
}

let logo = `

     ____  _          _ _ __  __ _           _ 
    / ___|| |__   ___| | |  \\/  (_)_ __   __| |
    \\___ \\| '_ \\ / _ \\ | | |\\/| | | '_ \\ / _\` |
     ___) | | | |  __/ | | |  | | | | | | (_| |
    |____/|_| |_|\\___|_|_|_|  |_|_|_| |_|\\__,_|
  v0.3.0 - Terminal AI Assistant - Created by Lilaf
  `

console.log(logo);

main();