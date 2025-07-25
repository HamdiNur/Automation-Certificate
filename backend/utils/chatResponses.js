// 🤖 Chatbot Response Templates for Jamhuriya University
export const chatResponses = {
  // 🕌 Islamic greetings responses
  greeting: [
    "Wa alaykumu salaam wa rahmatullahi wa barakatuh! 🕌 Welcome to Jamhuriya University clearance system. How can I assist you today?",
    "Assalamu alaykum! 👋 I'm here to help with your student clearance process at Jamhuriya University. What can I help you with?",
    "Peace be upon you! 🌟 Welcome to your clearance assistant. How may I guide you through the process today?",
    "Wa alaykumu salaam! 📚 Ready to help you with your Jamhuriya University clearance. What would you like to know?"
  ],

  // 🏫 University information
  app_info: `🏫 **Welcome to Jamhuriya University Student Clearance System**

This system helps you complete your graduation clearance process smoothly. Here's what you can do:

📋 **Track Progress**: See your clearance status in real-time
📄 **Upload Documents**: Submit required papers and forms  
💰 **Make Payments**: Pay graduation fees securely
📅 **Schedule Appointments**: Book your certificate pickup
🔔 **Get Updates**: Receive notifications about your progress

**🎯 Clearance Process Order:**
1️⃣ **Faculty** - Submit thesis & get supervisor approval
2️⃣ **Library** - Return thesis book to library
3️⃣ **Lab** - Return all borrowed equipment  
4️⃣ **Finance** - Pay graduation fee ($250)
5️⃣ **Examination** - Final approval & certificate pickup

May Allah make your graduation journey easy! 🤲`,

  // 📚 General help
  help_general: `📚 **Jamhuriya University Clearance Guide**

**Step-by-Step Process:**

🎓 **Faculty Clearance:**
- Submit printed thesis (3 copies)
- Get supervisor signature
- Submit soft copy
- Wait for faculty approval

📖 **Library Clearance:**  
- Return thesis book to library
- Ensure no outstanding library dues
- Get library stamp

🔬 **Lab Clearance:**
- Return all borrowed equipment
- Clear any lab dues
- Get lab clearance certificate

💰 **Finance Clearance:**
- Pay graduation fee: $250
- Use Waafi/EVC Plus payment
- Keep receipt for records

🎓 **Final Examination:**
- Name correction (if needed)
- Final document review
- Certificate preparation

**Need specific help with any department? Just ask! 🤝**`,

  // 📊 Status help message
  status_help: `📊 Let me check your current clearance status at Jamhuriya University...`,

  // 🏢 Department routing messages
  routing_messages: {
    finance: "💰 I see you're asking about payments or fees. Let me connect you with our Finance Department who can help with:\n• Payment processing\n• Fee inquiries\n• Waafi/EVC transactions\n• Receipt issues\n\n**Connecting you now...**",
    
    library: "📖 You're asking about library clearance or thesis submission. I'll connect you with our Library staff who handle:\n• Thesis book returns\n• Library clearance\n• Outstanding dues\n• Library requirements\n\n**Connecting you now...**",
    
    lab: "🔬 This looks like a lab equipment or clearance question. Let me route you to our Lab Department who manage:\n• Equipment returns\n• Lab clearance certificates\n• Lab dues and issues\n• Equipment tracking\n\n**Connecting you now...**",
    
    faculty: "📚 You're asking about faculty clearance or thesis issues. I'll connect you with our Faculty Department who handle:\n• Thesis submissions\n• Supervisor approvals\n• Faculty clearance\n• Academic requirements\n\n**Connecting you now...**",
    
    examination: "🎓 This is about examination, certificates, or name correction. Let me connect you with our Examination Office who handle:\n• Final approvals\n• Name corrections\n• Certificate processing\n• Graduation requirements\n\n**Connecting you now...**"
  },

  // 🤲 Islamic closing phrases
  closing_phrases: [
    "May Allah make it easy for you! 🤲",
    "Barakallahu feeki/feeka! 🌟",     
    "In sha Allah, everything will go smoothly! 🤝",
    "May your graduation be blessed! 🎓✨"
  ],

  // 🌍 Somali language responses
  somali_responses: {
    greeting: [
      "Wacalaykum salaam! Soo dhawoow Jamhuriya University clearance system-ka. Sidee kaa caawin karaa?",
      "Assalamu calaykum! Waxaan halkan u joogaa in aan kaa caawiyo clearance-kaaga. Maxaad doonaysaa?",
    ],
    app_info: `🏫 **Jamhuriya University - Nidaamka Clearance-ka**

App-kani wuxuu kaa caawinayaa:
📋 **La socosho**: Arag xaaladda clearance-kaaga
📄 **Soo dir dukumiintiyada**: Soo geli warqadaha loo baahan yahay
💰 **Bixinta lacagta**: Bixi kharashka kharaajka ($250)
📅 **Ballan qabasho**: Qaado waqtiga aad shahaadada ka qaadan doonto

**Habka Clearance-ka:**
1️⃣ Faculty → 2️⃣ Library → 3️⃣ Lab → 4️⃣ Finance → 5️⃣ Examination

Maxaad doonaysaa in aan kaa caawiyo?`
  }
};

// Helper function to get random response
export const getRandomResponse = (responses) => {
  if (Array.isArray(responses)) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  return responses;
};

// Helper function to add Islamic blessing to responses
export const addBlessing = (message) => {
  const blessings = chatResponses.closing_phrases;
  const blessing = blessings[Math.floor(Math.random() * blessings.length)];
  return `${message}\n\n${blessing}`;
};

// Helper function to detect language and get appropriate response
export const getLocalizedResponse = (message, responseType) => {
  const lowerMsg = message.toLowerCase();
  const isSomali = lowerMsg.includes("maxaa") || lowerMsg.includes("waa maxay") || 
                   lowerMsg.includes("app-kan") || lowerMsg.includes("sidee");
  
  if (isSomali && chatResponses.somali_responses[responseType]) {
    return getRandomResponse(chatResponses.somali_responses[responseType]);
  }
  
  return getRandomResponse(chatResponses[responseType]);
};