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

        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleUserMessage = () => {
        const message = userInput.value.trim();
        if (message) {
            appendMessage("user", message);
            userInput.value = "";

            // Simulate bot response
            setTimeout(() => {
                appendMessage("bot", "I'm processing your request...");
            }, 1000);
        }
    };

    sendButton.addEventListener("click", handleUserMessage);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleUserMessage();
        }
    });
});
