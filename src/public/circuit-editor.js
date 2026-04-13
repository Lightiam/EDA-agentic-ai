class CircuitComponent {
  static idCounter = 0;
  static nextId() {
    return `${CircuitComponent.idCounter++}`;
  }

  constructor(type, x, y) {
    this.id = CircuitComponent.nextId();
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 40;
    this.value = '';
    this.unit = '';
    this.rotation = 0;
  }

  contains(x, y) {
    return (
      x >= this.x - this.width / 2 &&
      x <= this.x + this.width / 2 &&
      y >= this.y - this.height / 2 &&
      y <= this.y + this.height / 2
    );
  }

  draw(ctx, selected = false) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);

    if (selected) {
      ctx.strokeStyle = '#4f7bff';
      ctx.lineWidth = 3;
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    ctx.fillStyle = 'rgba(79, 123, 255, 0.1)';
    ctx.strokeStyle = '#4f7bff';
    ctx.lineWidth = 2;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.fillStyle = '#e7ecff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = this.type[0].toUpperCase();
    ctx.fillText(label, 0, -12);
    ctx.font = '11px system-ui';
    ctx.fillStyle = '#a6c8ff';
    if (this.value) {
      ctx.fillText(`${this.value}${this.unit}`, 0, 6);
    } else {
      ctx.fillText(this.id, 0, 6);
    }

    ctx.restore();
  }
}

class Connection {
  constructor(fromId, toId, fromPort = 'out', toPort = 'in') {
    this.fromId = fromId;
    this.toId = toId;
    this.fromPort = fromPort;
    this.toPort = toPort;
    this.label = '';
  }

  draw(ctx, fromComponent, toComponent) {
    if (!fromComponent || !toComponent) return;

    ctx.strokeStyle = 'rgba(79, 123, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromComponent.x, fromComponent.y);

    const midX = (fromComponent.x + toComponent.x) / 2;
    const midY = (fromComponent.y + toComponent.y) / 2;
    ctx.quadraticCurveTo(midX, midY - 40, toComponent.x, toComponent.y);
    ctx.stroke();

    if (this.label) {
      ctx.fillStyle = '#28d6ff';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, midX, midY - 20);
    }
  }
}

class CircuitEditor {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.components = [];
    this.connections = [];
    this.selectedComponent = null;
    this.draggingComponent = null;
    this.dragOffset = { x: 0, y: 0 };
    this.connectingFrom = null;
    this.tempConnectionEnd = null;
    this.pendingComponentType = null;

    this.setupEventListeners();
    this.draw();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));

    document.querySelectorAll('.component-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.pendingComponentType = btn.dataset.type;
        this.canvas.style.cursor = 'crosshair';
      });
    });

    document.getElementById('btn-clear-canvas').addEventListener('click', () => {
      this.components = [];
      this.connections = [];
      this.selectedComponent = null;
      this.draw();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      this.exportSVG();
    });

    document.getElementById('promptForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendPrompt();
    });
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.pendingComponentType) {
      const comp = new CircuitComponent(this.pendingComponentType, x, y);
      this.components.push(comp);
      this.selectedComponent = comp;
      this.pendingComponentType = null;
      this.canvas.style.cursor = 'default';
      this.updatePropertiesPanel();
      this.draw();
      return;
    }

    for (const comp of this.components) {
      if (comp.contains(x, y)) {
        this.selectedComponent = comp;
        this.draggingComponent = comp;
        this.dragOffset.x = x - comp.x;
        this.dragOffset.y = y - comp.y;
        this.updatePropertiesPanel();
        this.draw();
        return;
      }
    }

    this.selectedComponent = null;
    this.updatePropertiesPanel();
    this.draw();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.pendingComponentType) {
      this.tempConnectionEnd = { x, y };
      this.draw();
      return;
    }

    if (this.draggingComponent) {
      this.draggingComponent.x = x - this.dragOffset.x;
      this.draggingComponent.y = y - this.dragOffset.y;
      this.draw();
    }
  }

  handleMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.draggingComponent) {
      this.draggingComponent = null;
      this.draw();
    }

    if (e.ctrlKey || e.metaKey) {
      if (this.connectingFrom) {
        for (const comp of this.components) {
          if (comp.contains(x, y) && comp !== this.connectingFrom) {
            const conn = new Connection(this.connectingFrom.id, comp.id);
            this.connections.push(conn);
            this.connectingFrom = null;
            this.draw();
            return;
          }
        }
        this.connectingFrom = null;
      } else if (this.selectedComponent) {
        this.connectingFrom = this.selectedComponent;
        this.canvas.style.cursor = 'pointer';
      }
    }
  }

  handleRightClick(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < this.components.length; i++) {
      if (this.components[i].contains(x, y)) {
        const comp = this.components[i];
        this.components.splice(i, 1);
        this.connections = this.connections.filter(
          (c) => c.fromId !== comp.id && c.toId !== comp.id
        );
        this.selectedComponent = null;
        this.updatePropertiesPanel();
        this.draw();
        return;
      }
    }
  }

  updatePropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    if (!this.selectedComponent) {
      panel.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Select a component to edit properties</p>';
      return;
    }

    const comp = this.selectedComponent;
    panel.innerHTML = `
      <div class="property-item">
        <label>ID:</label>
        <input type="text" readonly value="${comp.id}" />
      </div>
      <div class="property-item">
        <label>Type:</label>
        <input type="text" readonly value="${comp.type}" />
      </div>
      <div class="property-item">
        <label>Value:</label>
        <input type="text" id="prop-value" placeholder="e.g., 10" value="${comp.value}" />
      </div>
      <div class="property-item">
        <label>Unit:</label>
        <select id="prop-unit">
          <option value="" ${!comp.unit ? 'selected' : ''}>-</option>
          <option value="Ω" ${comp.unit === 'Ω' ? 'selected' : ''}>Ω (Ohm)</option>
          <option value="kΩ" ${comp.unit === 'kΩ' ? 'selected' : ''}>kΩ (Kilo Ohm)</option>
          <option value="MΩ" ${comp.unit === 'MΩ' ? 'selected' : ''}>MΩ (Mega Ohm)</option>
          <option value="F" ${comp.unit === 'F' ? 'selected' : ''}>F (Farad)</option>
          <option value="μF" ${comp.unit === 'μF' ? 'selected' : ''}>μF (Micro Farad)</option>
          <option value="nF" ${comp.unit === 'nF' ? 'selected' : ''}>nF (Nano Farad)</option>
          <option value="pF" ${comp.unit === 'pF' ? 'selected' : ''}>pF (Pico Farad)</option>
          <option value="H" ${comp.unit === 'H' ? 'selected' : ''}>H (Henry)</option>
          <option value="mH" ${comp.unit === 'mH' ? 'selected' : ''}>mH (Milli Henry)</option>
          <option value="μH" ${comp.unit === 'μH' ? 'selected' : ''}>μH (Micro Henry)</option>
          <option value="V" ${comp.unit === 'V' ? 'selected' : ''}>V (Volt)</option>
          <option value="mV" ${comp.unit === 'mV' ? 'selected' : ''}>mV (Milli Volt)</option>
          <option value="A" ${comp.unit === 'A' ? 'selected' : ''}>A (Ampere)</option>
          <option value="mA" ${comp.unit === 'mA' ? 'selected' : ''}>mA (Milli Ampere)</option>
        </select>
      </div>
      <div class="property-item">
        <label>Rotation (°):</label>
        <input type="number" id="prop-rotation" min="0" max="360" value="${comp.rotation}" />
      </div>
      <button id="btn-connect" style="width: 100%; margin-top: 12px; padding: 8px; cursor: pointer;">Connect (Ctrl+Click)</button>
    `;

    document.getElementById('prop-value').addEventListener('change', (e) => {
      comp.value = e.target.value;
      this.draw();
    });

    document.getElementById('prop-unit').addEventListener('change', (e) => {
      comp.unit = e.target.value;
      this.draw();
    });

    document.getElementById('prop-rotation').addEventListener('change', (e) => {
      comp.rotation = parseInt(e.target.value);
      this.draw();
    });

    document.getElementById('btn-connect').addEventListener('click', () => {
      if (this.connectingFrom === null) {
        this.connectingFrom = comp;
        this.canvas.style.cursor = 'pointer';
      } else if (this.connectingFrom !== comp) {
        const conn = new Connection(this.connectingFrom.id, comp.id);
        this.connections.push(conn);
        this.connectingFrom = null;
        this.canvas.style.cursor = 'default';
        this.draw();
      }
    });
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.fillStyle = 'rgba(8, 16, 23, 0.95)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let i = 0; i <= w; i += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, h);
      this.ctx.stroke();
    }
    for (let i = 0; i <= h; i += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(w, i);
      this.ctx.stroke();
    }

    for (const conn of this.connections) {
      const from = this.components.find((c) => c.id === conn.fromId);
      const to = this.components.find((c) => c.id === conn.toId);
      conn.draw(this.ctx, from, to);
    }

    for (const comp of this.components) {
      comp.draw(this.ctx, comp === this.selectedComponent);
    }

    if (this.connectingFrom && this.tempConnectionEnd) {
      this.ctx.strokeStyle = 'rgba(79, 123, 255, 0.4)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.connectingFrom.x, this.connectingFrom.y);
      this.ctx.lineTo(this.tempConnectionEnd.x, this.tempConnectionEnd.y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  exportSVG() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    svg += `  <defs>\n`;
    svg += `    <style>text { font-family: system-ui; } .comp { stroke: #4f7bff; stroke-width: 2; fill: rgba(79, 123, 255, 0.1); }</style>\n`;
    svg += `  </defs>\n`;
    svg += `  <rect width="${width}" height="${height}" fill="#081017"/>\n`;

    for (const conn of this.connections) {
      const from = this.components.find((c) => c.id === conn.fromId);
      const to = this.components.find((c) => c.id === conn.toId);
      if (from && to) {
        svg += `  <path d="M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 40} ${to.x} ${to.y}" stroke="rgba(79, 123, 255, 0.6)" stroke-width="2" fill="none"/>\n`;
      }
    }

    for (const comp of this.components) {
      const x = comp.x - comp.width / 2;
      const y = comp.y - comp.height / 2;
      svg += `  <rect class="comp" x="${x}" y="${y}" width="${comp.width}" height="${comp.height}"/>\n`;
      svg += `  <text x="${comp.x}" y="${comp.y - 6}" text-anchor="middle" fill="#e7ecff" font-weight="bold">${comp.type[0].toUpperCase()}</text>\n`;
      if (comp.value) {
        svg += `  <text x="${comp.x}" y="${comp.y + 8}" text-anchor="middle" fill="#a6c8ff" font-size="11">${comp.value}${comp.unit}</text>\n`;
      }
    }

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'circuit.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  async sendPrompt() {
    const input = document.getElementById('promptInput');
    const prompt = input.value.trim();
    if (!prompt) return;

    const chatLog = document.getElementById('chatLog');
    const entry = document.createElement('div');
    entry.className = 'chat-entry user';
    entry.innerHTML = `<div class="label">You</div><div class="bubble">${prompt}</div>`;
    chatLog.appendChild(entry);
    chatLog.scrollTop = chatLog.scrollHeight;
    input.value = '';

    const circuitData = {
      components: this.components.map((c) => ({
        id: c.id,
        type: c.type,
        value: c.value,
        unit: c.unit,
        x: c.x,
        y: c.y,
      })),
      connections: this.connections.map((c) => ({
        fromId: c.fromId,
        toId: c.toId,
      })),
    };

    const reqBody = `${prompt}\n\nCurrent circuit: ${JSON.stringify(circuitData)}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: reqBody }),
      });

      const data = await response.json();
      const agentEntry = document.createElement('div');
      agentEntry.className = 'chat-entry agent';
      agentEntry.innerHTML = `<div class="label">AI</div><div class="bubble">${data.result || data.error}</div>`;
      chatLog.appendChild(agentEntry);
      chatLog.scrollTop = chatLog.scrollHeight;
    } catch (error) {
      const errEntry = document.createElement('div');
      errEntry.className = 'chat-entry agent';
      errEntry.innerHTML = `<div class="label">AI</div><div class="bubble">Error: ${error.message}</div>`;
      chatLog.appendChild(errEntry);
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CircuitEditor('circuitCanvas');
});
