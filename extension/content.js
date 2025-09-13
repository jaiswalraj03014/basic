// ======================================================================
// Senova AI Widget - Full Version with Backend Integration
// ======================================================================

function injectSenovaWidget() {
    // Prevent duplicate injections
    if (window.__senovaInjected || document.getElementById('senova-logo-btn')) {
      console.log('Senova widget already injected');
      return;
    }
    window.__senovaInjected = true;
    console.log('Injecting Senova widget...');
  
    // Utility function to wait for DOM body
    function waitForBody(callback, attempts = 0) {
      if (document.body) {
        callback();
      } else if (attempts < 100) {
        setTimeout(() => waitForBody(callback, attempts + 1), 10);
      } else {
        console.error('Senova: Failed to find document.body after 1 second');
      }
    }
  
    // ===================== Backend Communication Logic =====================
  
    /**
     * Listens for new messages on the page (e.g., in a GPT chat).
     * NOTE: The selector might need adjustment for different websites.
     */
    function observeGPTMessages() {
      // This selector is a common pattern for chat applications.
      const chatContainer = document.querySelector('[class*="react-scroll-to-bottom"]') || document.querySelector('[class*="chat-messages"]') || document.body;
  
      if (!chatContainer) {
        console.warn("Senova: Could not find a suitable chat container to observe.");
        return;
      }
      console.log("Senova is now observing the chat for messages.");
  
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          for (let node of mutation.addedNodes) {
            // Check if the node is an element and has meaningful text content
            if (node.nodeType === 1 && node.innerText && node.innerText.trim().length > 10) {
              // A simple heuristic to identify user-sent messages
              // You might need to refine this selector for your target site
              if (node.querySelector('[data-message-author-role="user"]')) {
                 handleUserMessage(node.innerText);
              }
            }
          }
        }
      });
  
      observer.observe(chatContainer, { childList: true, subtree: true });
    }
  
    /**
     * Handles the detected user message, sends it to the backend, and displays the result.
     * @param {string} message The text content of the user's message.
     */
    function handleUserMessage(message) {
      console.log("Senova detected message:", message);
  
      // Show the widget and a loading state
      const logoBtn = document.getElementById('senova-logo-btn');
      const container = document.getElementById('senova-chatbox');
      if (logoBtn) logoBtn.style.display = 'none';
      if (container) container.style.display = 'flex';
  
      const analysisCard = displayAnalysisResult({ loading: true });
  
      // Ensure your backend is running on http://localhost:8000
      // And has a POST endpoint at /api/analyze
      fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ FIXED: Changed "message" key to "text" to match FastAPI Pydantic model
        body: JSON.stringify({ text: message }),
      })
      .then(res => {
          if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
      })
      .then(data => {
          console.log("Senova received from backend:", data);
          // Update the card with the actual data
          displayAnalysisResult(data, analysisCard);
      })
      .catch(err => {
          console.error("Senova backend error:", err);
          // Update the card with an error message
          displayAnalysisResult({ error: "Could not connect to backend." }, analysisCard);
      });
    }
  
    /**
     * Creates or updates a card in the UI to show the analysis from the backend.
     * @param {object} data The data from the backend or a status object.
     * @param {HTMLElement} [existingCard] - Optional. An existing card to update.
     * @returns {HTMLElement} The created or updated card element.
     */
    function displayAnalysisResult(data, existingCard) {
        const mainContent = document.getElementById("senova-main-content");
        if (!mainContent) return;
  
        let card = existingCard;
        if (!card) {
            card = document.createElement("div");
            card.className = "senova-action-card";
            card.style.cssText = `
                display: flex; align-items: center; gap: 14px; background: #fff;
                border-radius: 14px; box-shadow: 0 1px 4px 0 rgba(180,180,200,0.07);
                padding: 14px; transition: all 0.2s; border: 1.5px solid #e7c6ff;
            `;
            // Add the new card to the top of the list
            mainContent.prepend(card);
        }
  
        let icon = "🤔", title = "Analyzing your message...", subtitle = "Please wait a moment.", color = "#e0e7ff";
  
        if (data.loading) { /* Use default loading state */ }
        else if (data.error) { icon = "⚠️"; title = "Error"; subtitle = data.error; color = "#fee2e2"; }
        else if (data.game) { icon = "🎮"; title = "Game Suggestion"; subtitle = data.game; color = "#fef3c7"; }
        else if (data.wellness) { icon = "🌱"; title = "Wellness Tip"; subtitle = data.wellness; color = "#dcfce7"; }
        else if (data.response) { icon = "💡"; title = "AI Analysis"; subtitle = data.response; color = "#e0e7ff"; }
        else { icon = "🤷"; title = "No Action Needed"; subtitle = "No suggestions at this time."; color = "#f3f4f6"; }
  
        card.innerHTML = `
            <div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:${color};border-radius:10px;font-size:1.35em; flex-shrink: 0;">${icon}</div>
            <div style="flex:1;">
                <div style="font-weight:600;font-size:1.05em;color:#222;">${title}</div>
                <div style="font-size:0.97em;color:#888;margin-top:2px;">${subtitle}</div>
            </div>
        `;
        return card;
    }
  
    // ===================== Widget UI Creation =====================
  
    function createWidget() {
      try {
        console.log('Creating Senova widget elements...');
  
        const style = document.createElement('style');
        style.textContent = `
          .senova-widget * { box-sizing: border-box; }
          .senova-action-card:hover {
            box-shadow: 0 4px 16px 0 rgba(231, 198, 255, 0.3);
            transform: translateY(-2px) scale(1.012);
            border-color: #e7c6ff;
          }
          .senova-scrollbar::-webkit-scrollbar { width: 8px; background: #f3f0ff; }
          .senova-scrollbar::-webkit-scrollbar-thumb { background: #e7c6ff; border-radius: 8px; }
          .senova-game-iframe {
            width: 100%;
            height: 500px;
            border: none;
            border-radius: 16px;
            box-shadow: 0 4px 32px rgba(0,0,0,0.15);
            background: white;
          }
        `;
        document.head.appendChild(style);
  
        // Floating Logo Button
        const logoBtn = document.createElement("div");
        logoBtn.id = "senova-logo-btn";
        logoBtn.className = "senova-widget";
        logoBtn.style.cssText = `
          position: fixed; bottom: 15px; right: 15px; width: 56px; height: 56px;
          border-radius: 50%; background: linear-gradient(135deg, #e7c6ff 0%, #b8c0ff 100%);
          display: flex; justify-content: center; align-items: center; cursor: pointer;
          z-index: 99999; box-shadow: 0 2px 12px 0 rgba(80,80,120,0.18); transition: transform 0.2s ease;
        `;
        logoBtn.innerHTML = `<img src="https://res.cloudinary.com/dbgzq41x2/image/upload/v1756282806/logo_yvfsfs.svg" alt="Senova AI" style="width:36px;height:36px;border-radius:50%;">`;
  
        // Main Container
        const container = document.createElement("div");
        container.id = "senova-chatbox";
        container.className = "senova-widget senova-scrollbar";
        container.style.cssText = `
          position: fixed; bottom: 15px; right: 15px; width: 370px; height: 720px;
          max-height: 90vh; background: linear-gradient(135deg, #f8f0fc 0%, #f1f3fc 100%);
          border: none; border-radius: 18px; display: none; flex-direction: column;
          z-index: 99999; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #222;
          box-shadow: 0 8px 32px 0 rgba(80,80,120,0.18); overflow: hidden;
        `;
  
        // Header
        const header = document.createElement("div");
        header.style.cssText = `
          display: flex; align-items: center; justify-content: space-between; padding: 8px 18px;
          background: linear-gradient(135deg, #e7c6ff 0%, #b8c0ff 100%);
          box-shadow: 0 2px 12px 0 rgba(80,80,120,0.10); flex-shrink: 0;
        `;
        header.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="https://res.cloudinary.com/dbgzq41x2/image/upload/v1756282806/logo_yvfsfs.svg" alt="logo" style="width:28px;height:28px;border-radius:8px;">
            <span style="font-size:1.15em;font-weight:700;">Senova AI</span>
          </div>
          <span id="senova-close" style="cursor:pointer;font-size:22px;font-weight:600;">&times;</span>
        `;
  
        // Status & Streak Section
        const statusStreak = document.createElement("div");
        statusStreak.style.cssText = `
          display: flex; flex-direction: column; gap: 10px; padding: 8px 18px 18px 18px;
          background: linear-gradient(135deg, #e7c6ff 0%, #b8c0ff 100%); flex-shrink: 0;
        `;
        statusStreak.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 1px 4px 0 rgba(180,180,200,0.07);">
            <span style="font-size:0.98em;color:#888;">Current Status</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <span id="status-emoji" style="font-size:1.2em;">😊</span>
              <select id="senova-status-select" style="border:none;background:transparent;font-weight:600;color:#555;font-size:1em;outline:none;cursor:pointer;">
                <option value="neutral">Neutral</option><option value="happy">Happy</option>
                <option value="tired">Tired</option><option value="stressed">Stressed</option>
              </select>
            </span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 1px 4px 0 rgba(180,180,200,0.07);">
            <span style="font-size:0.98em;color:#888;">Study Streak</span>
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="color:#ff9100;font-size:1.1em;">🔥</span>
              <span style="font-weight:600;color:#555;">3 days</span>
            </span>
          </div>
        `;
  
        // Main Content Area
        const mainContent = document.createElement("div");
        mainContent.id = "senova-main-content";
        mainContent.style.cssText = `
          flex: 1; overflow-y: auto; padding: 18px 12px;
          display: flex; flex-direction: column; gap: 10px;
        `;
  
        // Action Cards Data
        const actionCardsData = [
          { id: "senova-quiz", icon: "🧑‍🎓", color: "#e7c6ff", title: "Quick Learning Quiz", subtitle: "Test your knowledge" },
          { id: "senova-wellness", icon: "💚", color: "#d0f5e8", title: "Wellness Check-in", subtitle: "How are you feeling?" },
          { id: "senova-breathing", icon: "🧘‍♂️", color: "#ffe0ef", title: "Breathing Exercise", subtitle: "Calm your mind" },
          { id: "senova-energy", icon: "⚡", color: "#e0e7ff", title: "2-Min Energy Boost", subtitle: "Quick movement" },
          { id: "senova-games", icon: "🎮", color: "#fef3c7", title: "Mini Games", subtitle: "Fun brain training" }
        ];
  
        actionCardsData.forEach(card => {
          const cardElement = document.createElement("div");
          cardElement.id = card.id;
          cardElement.className = "senova-action-card";
          cardElement.style.cssText = `
            display: flex; align-items: center; gap: 14px; background: #fff; border-radius: 14px;
            box-shadow: 0 1px 4px 0 rgba(180,180,200,0.07); padding: 14px; cursor: pointer;
            transition: box-shadow 0.15s, transform 0.12s; border: 1.5px solid #f3f0ff;
          `;
          cardElement.innerHTML = `
            <div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:${card.color};border-radius:10px;font-size:1.35em;">${card.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:1.05em;color:#222;">${card.title}</div>
              <div style="font-size:0.97em;color:#888;margin-top:2px;">${card.subtitle}</div>
            </div>
            <div style="color:#b8b8b8;font-size:1.3em;">&#8250;</div>
          `;
          mainContent.appendChild(cardElement);
        });
  
        // Footer
        const footer = document.createElement("div");
        footer.style.cssText = `
          display: flex; justify-content: space-between; align-items: center; padding: 12px 18px;
          background: #f8f0fc; box-shadow: 0 -4px 12px -4px rgba(120,120,120,0.13); flex-shrink: 0;
        `;
        footer.innerHTML = `
          <div style="color:#222;display:flex;align-items:center;gap:8px;cursor:pointer;" id="senova-settings"><span style="font-size:1.2em;">⚙️</span> Settings</div>
          <div style="color:#222;display:flex;align-items:center;gap:8px;cursor:pointer;" id="senova-help"><span style="font-size:1.2em;">❓</span> Help</div>
        `;
  
        // Dynamic content overlay
        const dynamicContent = document.createElement("div");
        dynamicContent.id = "senova-dynamic-content";
        dynamicContent.className = "senova-scrollbar";
        dynamicContent.style.cssText = `
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(255,255,255,0.98); z-index: 100; display: none;
          flex-direction: column; overflow-y: auto;
        `;
  
        // Assemble container
        container.appendChild(header);
        container.appendChild(statusStreak);
        container.appendChild(mainContent);
        container.appendChild(footer);
        container.appendChild(dynamicContent);
  
        // Add to DOM
        document.body.appendChild(logoBtn);
        document.body.appendChild(container);
  
        console.log('Senova widget elements created and added to DOM');
        setupEventHandlers(logoBtn, container, header, statusStreak, mainContent, footer, dynamicContent);
  
      } catch (error) {
        console.error('Error creating Senova widget:', error);
      }
    }
  
    // ===================== Event Handlers Setup =====================
    function setupEventHandlers(logoBtn, container, header, statusStreak, mainContent, footer, dynamicContent) {
      try {
        logoBtn.addEventListener("click", () => {
          logoBtn.style.display = "none";
          container.style.display = "flex";
        });
  
        header.querySelector("#senova-close").addEventListener("click", () => {
          container.style.display = "none";
          logoBtn.style.display = "flex";
        });
  
        const statusSelect = statusStreak.querySelector("#senova-status-select");
        statusSelect.addEventListener("change", function() {
          const emojiMap = { neutral: "😊", happy: "😃", tired: "😴", stressed: "😰" };
          statusStreak.querySelector("#status-emoji").textContent = emojiMap[this.value] || "😊";
        });
  
        function showDynamicContent(html, options = {}) {
          const title = options.title || "Back";
          dynamicContent.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;padding:18px;background:#f8f0fc;border-bottom:1px solid #e5e7eb;">
              <span id="senova-back" style="font-size:1.5em;cursor:pointer;color:#6b7280;">&#8592;</span>
              <span style="font-weight:700;font-size:1.1em;color:#1f2937;">${title}</span>
            </div>
            <div style="padding:18px;flex:1;">${html}</div>
          `;
          dynamicContent.style.display = "flex";
          dynamicContent.querySelector("#senova-back").addEventListener("click", () => {
            dynamicContent.style.display = "none";
          });
        }
  
        mainContent.querySelector("#senova-breathing").addEventListener("click", () => {
          showDynamicContent(`
            <div style="text-align:center;">
              <div style="font-size:2em;margin-bottom:16px;">🧘‍♂️ Breathing Exercise</div>
              <div style="background:#fef3c7;padding:20px;border-radius:12px;border:1px solid #f59e0b;">
                <p style="margin:0 0 15px 0;font-weight:600;color:#92400e;">Let's practice mindful breathing</p>
                <div id="breathing-circle" style="width:120px;height:120px;border:3px solid #f59e0b;border-radius:50%;margin:20px auto;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#92400e;transition:transform 4s ease-in-out;">Ready?</div>
                <button id="start-breathing" style="padding:12px 24px;background:#f59e0b;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Start Exercise</button>
              </div>
            </div>
          `, { title: "Breathing Exercise" });
  
          const startBtn = dynamicContent.querySelector('#start-breathing');
          startBtn.addEventListener('click', () => {
            const circle = dynamicContent.querySelector('#breathing-circle');
            let count = 0;
            startBtn.style.display = 'none';
            function breathingCycle() {
              if (count >= 4) {
                circle.innerHTML = 'Complete!';
                circle.style.transform = 'scale(1)';
                startBtn.textContent = 'Start Again';
                startBtn.style.display = 'inline-block';
                return;
              }
              circle.innerHTML = 'Breathe In...';
              circle.style.transform = 'scale(1.3)';
              setTimeout(() => {
                circle.innerHTML = 'Hold';
                setTimeout(() => {
                  circle.innerHTML = 'Breathe Out...';
                  circle.style.transform = 'scale(1)';
                  setTimeout(() => { count++; breathingCycle(); }, 4000);
                }, 4000);
              }, 4000);
            }
            breathingCycle();
          });
        });
  
        const games = [
            { id: 'memory', title: '🧩 Memory Match', desc: 'Improve working memory and concentration.', color: '#e0f2fe', accent: '#0891b2', url: '/games/Breathing_Maze/static/index.html' },
            { id: 'focus', title: '🎯 Focus Target', desc: 'Practice sustained attention and mindfulness.', color: '#fef3c7', accent: '#f59e0b', url: 'https://www.google.com/search?q=focus+game' },
            { id: 'garden', title: '🌱 Calm Garden', desc: 'A relaxing cultivation game for stress relief.', color: '#f0fdf4', accent: '#22c55e', url: 'https://www.google.com/search?q=calm+garden+game' }
        ];
  
        function launchGame(game) {
            showDynamicContent(`
              <p style="color:#6b7280;margin-bottom:15px;text-align:center;">${game.desc}</p>
              <iframe src="${game.url}" class="senova-game-iframe" title="${game.title}"></iframe>
            `, { title: game.title });
        }
  
        mainContent.querySelector("#senova-games").addEventListener("click", () => {
          const gameSelectionHTML = games.map(game => `
            <a href="${game.url}" target="_blank"><div class="senova-action-card game-choice" data-game-id="${game.id}" style="border-color:${game.accent};">
              <div style="background:${game.color};width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:1.35em;">${game.title.split(' ')[0]}</div>
              <div>
                <div style="font-weight:600;color:#222;">${game.title.substring(game.title.indexOf(' ') + 1)}</div>
                <div style="font-size:0.9em;color:#888;margin-top:2px;">${game.desc}</div>
              </div>
              <div style="color:#b8b8b8;font-size:1.3em;">&#8250;</div>
            </div>
            </a>
          `).join('');
          showDynamicContent(`<div style="display:flex;flex-direction:column;gap:12px;">${gameSelectionHTML}</div>`, { title: "Choose a Game" });
  
          dynamicContent.querySelectorAll('.game-choice').forEach(card => {
              card.addEventListener('click', () => {
                  const gameId = card.getAttribute('data-game-id');
                  const selectedGame = games.find(g => g.id === gameId);
                  if (selectedGame) launchGame(selectedGame);
              });
          });
        });
  
        console.log('Event handlers setup complete');
  
        // ✅ ACTIVATE THE AUTOMATIC MESSAGE LISTENER
        observeGPTMessages();
  
      } catch (error) {
        console.error('Error setting up event handlers:', error);
      }
    }
  
    // ===================== Initialization =====================
    waitForBody(createWidget);
  }
  
  // Execute with comprehensive error handling
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectSenovaWidget);
    } else {
      injectSenovaWidget();
    }
  } catch (error) {
    console.error('Senova widget injection failed:', error);
  }
  
  