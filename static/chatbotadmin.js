const userMessage = [
  ["hi,hello,hey"]
];
const botReply = [
  ["Hello!", "Hi!", "Hey!", "Hi there!"]
];
const alternative = [
  ["sorry , Pin number Format or Pin number Does not Exist"]
];

document.getElementById("btn").onclick = sendMessage;

function sendMessage() {
  let H = document.getElementById("input").value;
  let y = H.toLowerCase();

  switch (y) {
    case "22124-cs-160":
      window.open("https://1drv.ms/x/c/76bcd8d7c93fffca/EZYfYGroehBMkWoaTR_CI_cB-wa3vVWMWuvpyDuD9Axz4g?e=60oE8S", "_blank");
      linkOpened = true;
      addChat("", "Opening course 22124-cs-160 spreadsheet.");
      break;
    case "22124-cs-131":
      window.open("https://1drv.ms/x/c/76bcd8d7c93fffca/EQOAz3rgzW1AmQPU2VFbHK4BCqzqWxmBlrGVl23wV76MSg?e=D2XjsW");
      linkOpened = true;
      addChat("", "Opening course 22124-cs-131 spreadsheet.");
      break;
    case "22124-cs-134":
      window.open("https://1drv.ms/x/c/76bcd8d7c93fffca/EUx27YM8zo5EmQP2bEeQLU8Bz60FWiLpsFgNE8gVI_GlPg?e=ecAy5n");
      linkOpened = true;
      addChat("Opening course 22124-cs-134 spreadsheet.");
      break;
    case "22124-cs-179":
      window.open("https://1drv.ms/x/c/76bcd8d7c93fffca/EVbOmXoAPWZPlvKRvvth8aMBPyANks0ETncA2y64m0Hr9g?e=0nqzDY");
      linkOpened = true;
      addChat("", "Opening course 22124-cs-179 spreadsheet.");
      break;
    default:
      output(H);
  }

  const inputField = document.getElementById("input");
  inputField.value = ""; // Clear input field after sending message
  inputField.focus(); // Focus back on the input field
}

function output(input) {
  let product;

  let text = input.toLowerCase().replace(/[^\w\s\d]/gi, "");

  text = text
    .replace(/[\W_]/g, " ")
    .replace(/ a /g, " ")
    .replace(/i feel /g, "")
    .replace(/whats/g, "what is")
    .replace(/please /g, "")
    .replace(/ please/g, "")
    .trim();

  let comparedText = compare(userMessage, botReply, text);

  product = comparedText
    ? comparedText
    : alternative[Math.floor(Math.random() * alternative.length)];
  addChat(input, product);
}

function compare(triggerArray, replyArray, string) {
  let item;
  for (let x = 0; x < triggerArray.length; x++) {
    for (let y = 0; y < replyArray.length; y++) {
      if (triggerArray[x][y] == string) {
        items = replyArray[x];
        item = items[Math.floor(Math.random() * items.length)];
      }
    }
  }
  //containMessageCheck(string);
  if (item) return item;
  else return containMessageCheck(string);
}

function containMessageCheck(string) {
  let expectedReply = [
    ["Good Bye, dude", "Bye, See you!", "Dude, Bye. Take care of your health in this situation."],
    ["Good Night, dude", "Have a sound sleep", "Sweet dreams"],
    ["Have a pleasant evening!", "Good evening too", "Evening!"],
    ["Good morning, Have a great day!", "Morning, dude!"],
    ["Good Afternoon", "Noon, dude!", "Afternoon, dude!"]
  ];
  let expectedMessage = [
    ["bye", "tc", "take care"],
    ["night", "good night"],
    ["evening", "good evening"],
    ["morning", "good morning"],
    ["noon"]
  ];
  let item;
  for (let x = 0; x < expectedMessage.length; x++) {
    if (expectedMessage[x].includes(string)) {
      items = expectedReply[x];
      item = items[Math.floor(Math.random() * items.length)];
    }
  }
  return item;
}

function addChat(input, product) {
  const mainDiv = document.getElementById("message-section");
  let userDiv = document.createElement("div");
  userDiv.id = "user";
  userDiv.classList.add("message");
  userDiv.innerHTML = `<span id="user-response">${input}</span>`;
  mainDiv.appendChild(userDiv);

  let botDiv = document.createElement("div");
  botDiv.id = "bot";
  botDiv.classList.add("message");
  botDiv.innerHTML = `<span id="bot-response">${product}</span>`;
  mainDiv.appendChild(botDiv);
  var scroll = document.getElementById("message-section");
  scroll.scrollTop = scroll.scrollHeight;
  voiceControl(product); // Assuming you have a voiceControl function
}

// Using `key` property for Enter key detection
document.getElementById("input").addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}
);