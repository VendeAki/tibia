/**
 * Tibia Mana Alert
 * Ferramenta visual manual, sem qualquer integração de automação com o jogo.
 */

const elements = {
  panel: document.getElementById("manaPanel"),
  currentMana: document.getElementById("currentMana"),
  maxMana: document.getElementById("maxMana"),
  alertPercent: document.getElementById("alertPercent"),
  statusText: document.getElementById("statusText"),
  statusMeta: document.getElementById("statusMeta"),
  beepButton: document.getElementById("toggleBeep")
};

const state = {
  beepEnabled: false,
  wasLow: false
};

function sanitizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function calculateManaPercent(current, max) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function playBeep() {
  if (!state.beepEnabled) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.22);

  oscillator.onended = () => {
    ctx.close();
  };
}

function updateStatus() {
  const current = Math.max(0, sanitizeNumber(elements.currentMana.value, 0));
  const max = Math.max(1, sanitizeNumber(elements.maxMana.value, 1));
  const threshold = Math.max(1, Math.min(99, sanitizeNumber(elements.alertPercent.value, 30)));

  const currentPercent = calculateManaPercent(current, max);
  const isLow = currentPercent < threshold;

  elements.statusMeta.textContent = `${currentPercent.toFixed(1)}% de mana atual • alerta em ${threshold}%`;

  if (isLow) {
    elements.statusText.textContent = "MANA BAIXA";
    elements.statusText.classList.add("is-low");
    elements.panel.classList.add("is-low");

    // Beep dispara somente na transição de estado normal -> baixo.
    if (!state.wasLow) {
      playBeep();
    }
  } else {
    elements.statusText.textContent = "Mana OK";
    elements.statusText.classList.remove("is-low");
    elements.panel.classList.remove("is-low");
  }

  state.wasLow = isLow;
}

function toggleBeep() {
  state.beepEnabled = !state.beepEnabled;
  elements.beepButton.setAttribute("aria-pressed", String(state.beepEnabled));
  elements.beepButton.textContent = state.beepEnabled ? "🔊 Beep: Ligado" : "🔈 Beep: Desligado";
}

[elements.currentMana, elements.maxMana, elements.alertPercent].forEach((input) => {
  input.addEventListener("input", updateStatus);
});

elements.beepButton.addEventListener("click", toggleBeep);

// Render inicial
updateStatus();
