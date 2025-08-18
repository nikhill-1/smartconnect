const userMessage = [
  ["hi", "hey", "hello"],//1
  [
    "what is the name of principal",
    "who is the principal of your college",
    "who is the principal",
    "principal of your college",
    "principal"
  ],//2
  ["who is the secretary of your college",
    "who is the secretary ",
    "name of the secretary",
    "who is secretary of your college",
    "secretary"
  ],//3
  ["who is the vice principal of your college",
    "who is the vice principal",
    "vice principal of college",
    "vice principal",
    "what is the name of principal"
  ],//4
  ["how are you", "how is life", "how are things", "how are you doing"],//5
  [ "what courses are offered by the college",
    "courses offered by the college",
    "courses offered",
    "what courses are offered?",
    "groups offered by the college",
    "courses offered by the college?",
    "what groups are there",
    "what branches are there in the college",
    "branches available",
    "groups available",
    "courses",
    "departments",
    "braches"
  ],//6
  ["what are you doing", "what is going on", "what is up"],//7
  ["how old are you"],//8
  ["who are you", "are you human", "are you bot", "are you human or bot"],//9
  ["who created you", "who made you", "who is your creator"],//10

  [
    "your name please",
    "your name",
    "may i know your name",
    "what is your name",
    "what call yourself"
  ],//11
  ["what are the college timings",
    "college timings",
    "what are the timings of college",
    "at what time the college will start",
    "timings of college",
    "timings of the college",
    "timings of your college"
  ],//12
  ["when the college is established",
    "when the college was established",
    "in which year the college is established"
  ],//13
  ["faculty of cse department",
    "faculty of the cse department",
    "cse department faculty"
  ],//14
  ["tell me about college",
    "tell about college",
    "tell about the college",
    "tell me about the college",
    "tell me about the trr college of technology",
    "about college"
  ],//15
  ["why should i join this college",
    "specifications of the college"
  ],//16
  ["is campus hostel available",
    "is college hostel available",
    "is college contain boys hostel",
    "is college contain girls hostel"
  ],//17
  ["rules and regulations of college",
    "rules and regulations",
    "rules of college",
    "rules of the college",
    "rules"
  ],//18
  ["will college organise fests",
    "tell about fests"
  ],//19
  ["founder of the college",
    "who is the founder of the college",
    "founder of college",
    "college founder"
  ],//20
  ["fee structure of the college",
    "fee",
    "tell about fee",
  "structure of fee"],//21
  [
    "extra curricular activities in the college",
    "extra curricular activities in the campus",
    "extra curricular activities",
    "cultural activities",
    "cultural programs",

  ],//22
  ["about health care",
    "health care",
    "health safety",
  ],//23
  ["boring"],//24
  ["im tired"],//25
  ["get your college information","college info","more about your college",],//26
  [
    "your college",
    "name your college",
    "what is the college",
    "what's the college",
    "name of the college"
  ],//27
  [
    "address?",
    "address",
    "address of the college",
    "where is the college",
    "where is the college located",
    "location of the college"
  ],//28
  [ "more about college",
    "about college",
    "about the college"
  ],//29
  [
    "contact",
    "contact detalis",
    "contact info",
    "contact information"
  ],//30
  ["documents required for admission",
    "what are the documents required for admission",
    "requirments for admissions",
    "admission process",
    "documents to sumbit for admission process",
    "process of admission"
  ],//31
  
];
const botReply = [
  ["Hello!", "Hi!", "Hey!", "Hi there!"],//1
  ["Vishal Khanna sir"],//2
  ["Ms. Teegala Mona Reddy "],//3
  ["Srinivas sir"],//4
  [
    "Fine... ",
    "Pretty well",
    "Fantastic"
  ],//5
  ["CSE,ECE,ME,CE"],//6

  [
    "Nothing much",
    "I don't know actually"
  ],//7
  ["I am age less."],//8
  ["I am just a bot", "I am a bot. "],//9
  ["TRR Student's from CSE"],//10
  ["my name is 'Smart-connect'"],//11
  ["starts at 9:00AM and ends by 3:20PM"],//12
  ["TRR College of Technology was established in 2004"],//13
  [

"K VISHAL KHANNA<br>PATAN WAHEEDA<br>DEVALLA SURYANARAYANA<br>MAITHILI MANCHANA<br>SANTHOSHI NEELA<br>USHASHWINI BEESU<br>LASYA CHIDURALA<br>SRI LAKSHMI M<br>JADALA SRAVANI<br>SUMALATHA VANDANAPU<br>KATRAVATH MAHESH<br>VINOOTHNA DINGARI<br>MADHAGONI PRIYANKA"

],//14
  ["TRR College of technology is the first private Polytechnic college in AP and Telangana. <br>And it is certified by NBA team in 2024.<br>college is located in meerpet."],//15
  ["TRR College of technology is the first private Polytechnic college in AP and Telangana.<br>And it is certified by NBA team in 2024.<br>TRR college of technology provides placements."],//16
  ["Yes.Hostel is available  "],//17
  ["RULES-<br>mobile phones strictly prohibited<br>no one should bunk college<br>After entering into college the gates will be closed<br>ragging is strictly prohibited"],//18
  ["Yes.. college organizes many fests.<br>for every festival there will be a fest"],//19
  ["Mr Teegala Krupakar Reddy sir"],//20
  ["For counselling students-12600rs per year & For Management students is not defined,change according to group."],//21
  ["National Space Day Celebration <br> Teachers day celebrations <br> orientation day <br> international yoga day <br> signature and farewell day <br> plantation day"],//22
  ["YES, We have a health care team and you can assure insurance"],//23
  ["Sorry for that. Let's chat!"],//24
  ["Take some rest"],//25
  ["here is the information of the college.The college will run 9:00AM to 3:20PM."],//26
  ["T.R.R college of technology"],//27
  ["Meerpet,Balapur(m),Hyderabad,500097,telangana"],//28
  ["TRR College of technology is the first private Polytechnic college in AP and Telangana. <br>And it is certified by NBA team in 2024.<br>college is located in meerpet. the late Mr. Teegala Krupakar Reddy, the esteemed founder of Teegala Ram Reddy Educational Society, whose legacy of self-reliance and educational enlightenment continues to inspire.<br> he vibrant leadership of Mr. Teegala Nitesh Reddy, the dynamic Chairman of Teegala Ram Reddy Educational Society, whose fervor and vigilance have guided the institution since its inception in 2004. <br> Ms. Teegala Mona Reddy plays a pivotal role as a key member of the management team, dedicated to fostering excellence in education at Teegala Ram Reddy Group of Institutions. "],//29
  ["engineering department :- 7396067291 <br> polytechnic department :- 91543 64291, 91543 64299 <br>"],//30
  ["rank card <br> conselling form <br> SSC Memo <br> Transfer Certificate<br> bonafide <br> 3 Passphotos <br> Admission Form <br>"],//31
  
];
const alternative =[
  "Sorry,I didn't understand."
];

document.querySelectorAll(".chat-button").forEach((button) => {
  button.addEventListener("click", () => {
    const message = button.getAttribute("data-message");
    output(message);
  });
});

const inputField = document.getElementById("input");

// Trigger message sending when Enter key is pressed
inputField.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// Define the sendMessage function
function sendMessage() {
  let input = inputField.value.trim();
  if (input !== "") {
    inputField.value = ""; // Clear input field after sending
    output(input);
  }
}

// Add a click event listener to the button
document.getElementById("btn").addEventListener("click", sendMessage);

// Ensure input is focused on DOM load
document.addEventListener("DOMContentLoaded", () => {
  inputField.focus();
});
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
    [
      "Good Bye, dude",
      "Bye, See you!",
      "Dude, Bye. Take care of your health in this situation."
    ],
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
  voiceControl(product);
}