// Use Django backend endpoint (which proxies to Cloud Run)
const CHATBOT_API_URL = '/chatbot-api/';

document.addEventListener('DOMContentLoaded', function () {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const languageSelector = document.getElementById('language-selector');
  const modelSelector = document.getElementById('model-selector'); // optional UI element

  let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
  let currentModel = localStorage.getItem('preferredModel') || ''; // e.g. "claude-haiku-4.5"

  const appendMessage = (sender, message) => {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', `${sender}-message`);
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageContainer.appendChild(messageSpan);
    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveChatHistory();
  };

  const showTypingIndicator = () => {
    removeTypingIndicator();
    const typingContainer = document.createElement('div');
    typingContainer.classList.add('message', 'bot-message', 'typing-indicator');
    typingContainer.innerHTML = '<span>Thinking...</span>';
    chatMessages.appendChild(typingContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const removeTypingIndicator = () => {
    const typingMessage = chatMessages.querySelector('.typing-indicator');
    if (typingMessage) typingMessage.remove();
  };

  const getCsrfToken = () => {
    return (
      document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1] ||
      ''
    );
  };

  const handleUserMessage = async () => {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    userInput.value = '';
    userInput.focus();
    showTypingIndicator();

    try {
      const resp = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          message,
          language: currentLanguage,
          session_id: getOrCreateSessionId(),
          model: currentModel || undefined,
        }),
      });

      removeTypingIndicator();

      if (!resp.ok) {
        const err = await resp
          .json()
          .catch(() => ({ error: `${resp.status} ${resp.statusText}` }));
        appendMessage(
          'bot',
          `Sorry, I encountered an issue: ${
            err.error || err.details || JSON.stringify(err)
          }`
        );
        console.error('API error:', err);
        return;
      }

      const data = await resp.json();
      const botMessage =
        data.response || data.message || data.text || JSON.stringify(data);
      appendMessage('bot', botMessage);
    } catch (e) {
      removeTypingIndicator();
      console.error('Chat API Error:', e);
      appendMessage(
        'bot',
        `Sorry, I'm having trouble connecting. Error: ${e.message}`
      );
    }
  };

  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem('chat_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      sessionStorage.setItem('chat_session_id', sessionId);
    }
    return sessionId;
  };

  if (languageSelector) {
    languageSelector.value = currentLanguage;
    languageSelector.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      localStorage.setItem('preferredLanguage', currentLanguage);
      appendMessage(
        'bot',
        currentLanguage === 'sw'
          ? 'Lugha imebadilishwa kuwa Swahili'
          : 'Language switched to English'
      );
    });
  }

  if (modelSelector) {
    modelSelector.value = currentModel || '';
    modelSelector.addEventListener('change', (e) => {
      currentModel = e.target.value;
      localStorage.setItem('preferredModel', currentModel);
      appendMessage('bot', `Model set to ${currentModel || 'default'}`);
    });
  }

  sendButton.addEventListener('click', handleUserMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
  });

  loadChatHistory();
});

// Persist chat history
const saveChatHistory = () => {
  const chatMessages = document.getElementById('chat-messages');
  const messages = Array.from(chatMessages.querySelectorAll('.message')).map(
    (msg) => ({
      sender: msg.classList.contains('user-message') ? 'user' : 'bot',
      text: msg.querySelector('span').textContent,
    })
  );
  sessionStorage.setItem('chat_history', JSON.stringify(messages));
};

const loadChatHistory = () => {
  const history = sessionStorage.getItem('chat_history');
  if (!history) return;
  const messages = JSON.parse(history);
  const chatMessages = document.getElementById('chat-messages');
  messages.forEach((msg) => {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', `${msg.sender}-message`);
    const messageSpan = document.createElement('span');
    messageSpan.textContent = msg.text;
    messageContainer.appendChild(messageSpan);
    chatMessages.appendChild(messageContainer);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
};
