const chatLog = document.getElementById('chatLog');
const promptForm = document.getElementById('promptForm');
const promptInput = document.getElementById('promptInput');
const clearButton = document.getElementById('btn-clear');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const analyzeButton = document.getElementById('btn-analyze-image');

let currentImageBase64 = null;
let currentImageFileName = '';

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
    const payload = {
      prompt,
      image: currentImageBase64,
      imageFileName: currentImageFileName
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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

if (imageUpload) {
  imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      currentImageBase64 = loadEvent.target.result;
      currentImageFileName = file.name;
      if (imagePreview && imagePreviewContainer) {
        imagePreview.src = currentImageBase64;
        imagePreviewContainer.style.display = 'block';
      }
      appendMessage(`Attached image: ${file.name}`, 'agent');
    };
    reader.readAsDataURL(file);
  });
}

if (analyzeButton) {
  analyzeButton.addEventListener('click', async () => {
    if (!currentImageBase64) {
      appendMessage('Please upload an image first.', 'agent');
      return;
    }

    const analysisPrompt = `Analyze this circuit reference image and extract the design requirements, component list, and connections. Return any suggested circuit topology, component values, and next steps.`;
    appendMessage('Analyzing the attached image...', 'user');
    appendMessage('Working on it…', 'agent');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          image: currentImageBase64,
          imageFileName: currentImageFileName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to get a response.');
      }

      appendMessage(data.result, 'agent');
    } catch (error) {
      appendMessage(`Error: ${error.message}`, 'agent');
    }
  });
}

clearButton.addEventListener('click', () => {
  chatLog.innerHTML = '';
});
