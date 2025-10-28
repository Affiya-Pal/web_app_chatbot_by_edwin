document.addEventListener("DOMContentLoaded", function() {
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    const appendMessage = (sender, message) => {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message", `${sender}-message`);

        const messageSpan = document.createElement("span");
        messageSpan.textContent = message;

        messageContainer.appendChild(messageSpan);
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showTypingIndicator = () => {
        appendMessage("bot", "Thinking...");
    };

    const removeTypingIndicator = () => {
        const typingMessage = Array.from(chatMessages.querySelectorAll('.bot-message span'))
                                   .find(el => el.textContent === 'Thinking...');
        if (typingMessage) {
            typingMessage.closest('.message').remove();
        }
    };

    const handleUserMessage = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage("user", message);
        userInput.value = "";
        showTypingIndicator();

        try {
            const response = await fetch('/chatbot-api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            removeTypingIndicator();

            if (!response.ok) {
                let errorMessage;
                try {
                    // Try to parse a JSON error response from the server
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Server returned an error: ${response.status}`;
                } catch (e) {
                    // If parsing fails, use the HTTP status text
                    errorMessage = `Could not connect to the AI service. Status: ${response.status} ${response.statusText}`;
                }
                appendMessage("bot", `Sorry, I encountered an issue: ${errorMessage}`);
                return;
            }

            const data = await response.json();
            
            const botMessage = data.history && data.history.length > 0 
                ? data.history[data.history.length - 1].parts.find(p => p.text)?.text || JSON.stringify(data)
                : JSON.stringify(data);
            
            appendMessage("bot", botMessage);

        } catch (error) {
            removeTypingIndicator();
            console.error("Chat API Error:", error);
            appendMessage("bot", "Sorry, I'm having trouble connecting to the server. Please check your connection and try again.");
        }
    };

    sendButton.addEventListener("click", handleUserMessage);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleUserMessage();
        }
    });
});
