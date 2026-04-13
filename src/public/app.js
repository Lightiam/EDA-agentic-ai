const chatLog = document.getElementById('chatLog');
const promptForm = document.getElementById('promptForm');
const promptInput = document.getElementById('promptInput');
const clearButton = document.getElementById('btn-clear');

function appendMessage(text, role) {
  const entry = document.createElement('div');
  entry.className = `chat-entry ${role}`;

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = role === 'user' ? 'You' : 'AutoClaw';
  entry.appendChild(label);

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  entry.appendChild(bubble);

  chatLog.appendChild(entry);
  chatLog.scrollTop = chatLog.scrollHeight;
}

promptForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  appendMessage(prompt, 'user');
  promptInput.value = '';
  appendMessage('Working on it…', 'agent');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to get a response.');
    }

    const lastNote = chatLog.lastElementChild;
    if (lastNote && lastNote.querySelector('.label') && lastNote.querySelector('.bubble').textContent === 'Working on it…') {
      lastNote.querySelector('.bubble').textContent = data.result;
    } else {
      appendMessage(data.result, 'agent');
    }
  } catch (error) {
    appendMessage(`Error: ${error.message}`, 'agent');
  }
});

clearButton.addEventListener('click', () => {
  chatLog.innerHTML = '';
});
