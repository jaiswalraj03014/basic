document.getElementById("sendBtn").addEventListener("click", async () => {
    const message = document.getElementById("message").value;
    
    const res = await chrome.runtime.sendMessage({ type: "chat", message });
    document.getElementById("response").innerText = res.reply;
  });
  