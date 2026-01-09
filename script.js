const defaultConfig = {
  app_name: "NIRBHAAS",
  tagline: "Silent Understanding",
  composer_title: "Create Emotion",
  send_button_text: "Send"
};

// Contacts database
const contacts = [
  { id: 1, name: 'Priya', status: 'Feeling deeply connected', active: true, emotion: { hue: 300, shape: 'wave', motion: 3, rhythm: 1.2 } },
  { id: 2, name: 'Arjun', status: 'Calm and thoughtful', active: true, emotion: { hue: 180, shape: 'circle', motion: 2, rhythm: 0.8 } },
  { id: 3, name: 'Arbin', status: 'Energetic mood', active: true, emotion: { hue: 60, shape: 'shard', motion: 7, rhythm: 2.1 } },
  { id: 4, name: 'Alif', status: 'Peaceful state', active: true, emotion: { hue: 120, shape: 'wave', motion: 1.5, rhythm: 0.6 } },
  { id: 5, name: 'Tanvir', status: 'Creative flow', active: true, emotion: { hue: 240, shape: 'circle', motion: 4, rhythm: 1.5 } },
  { id: 6, name: 'Meera', status: 'Last seen yesterday', active: false, emotion: null }
];

let currentContact = null;
let currentEmotion = {
  hue: 0,
  shape: 'circle',
  motion: 5,
  rhythm: 1.0,
  customShape: { enabled: false, type: 'polygon', sides: 5 },
  customMotion: { enabled: false, path: 'linear' },
  customRhythm: { enabled: false, pattern: 'steady', variation: 0 },
  customSound: { enabled: false, waveform: 'auto', pitch: 400, duration: 1, volume: 15 },
  particleDensity: 30,
  previewMode: 'live'
};

let messages = [];
let previewSketch = null;
let messageCanvases = [];

// Audio Context for sounds
let audioContext = null;
let currentTone = null;

// Custom colors and emotions learning
let customColors = JSON.parse(localStorage.getItem('nirbhaas_custom_colors') || '[]');
let learnedEmotions = JSON.parse(localStorage.getItem('nirbhaas_learned_emotions') || '[]');

// Initialize audio context on first user interaction
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Generate emotion sound based on parameters
function playEmotionSound(emotion) {
  initAudio();
  
  // Stop any currently playing sound
  if (currentTone) {
    currentTone.stop();
  }

  let baseFrequency, duration, volume, waveType;

  // Use custom sound settings if enabled
  if (emotion.customSound && emotion.customSound.enabled) {
    baseFrequency = emotion.customSound.pitch;
    duration = emotion.customSound.duration;
    volume = emotion.customSound.volume / 100;
    
    if (emotion.customSound.waveform === 'auto') {
      // Auto-select based on shape
      if (emotion.shape === 'circle') {
        waveType = 'sine';
      } else if (emotion.shape === 'wave') {
        waveType = 'triangle';
      } else if (emotion.shape === 'shard') {
        waveType = 'square';
      } else {
        waveType = 'sine';
      }
    } else {
      waveType = emotion.customSound.waveform;
    }
  } else {
    // Default sound generation
    baseFrequency = 200 + (emotion.hue / 360) * 600;
    duration = 0.5 + (emotion.rhythm * 0.5);
    volume = 0.15;
    
    // Shape determines waveform
    if (emotion.shape === 'circle') {
      waveType = 'sine';
    } else if (emotion.shape === 'wave') {
      waveType = 'triangle';
    } else if (emotion.shape === 'shard') {
      waveType = 'square';
    } else {
      waveType = 'sine';
    }
  }

  // Create oscillator for base tone
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(baseFrequency, audioContext.currentTime);
  
  // Motion affects frequency modulation (unless custom settings override)
  if (!emotion.customSound || !emotion.customSound.enabled) {
    const modulator = audioContext.createOscillator();
    const modulatorGain = audioContext.createGain();
    modulator.frequency.setValueAtTime(emotion.motion, audioContext.currentTime);
    modulatorGain.gain.setValueAtTime(30, audioContext.currentTime);
    
    modulator.connect(modulatorGain);
    modulatorGain.connect(oscillator.frequency);
    modulator.start(audioContext.currentTime);
    modulator.stop(audioContext.currentTime + duration);
  }

  // Envelope for smooth sound
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);

  currentTone = oscillator;
}

// Navigation
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// Render contacts
function renderContacts() {
  const container = document.getElementById('contactsList');
  container.innerHTML = '';
  
  contacts.forEach(contact => {
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = `
      <div class="contact-avatar ${contact.active ? 'active' : ''}" id="avatar-${contact.id}"></div>
      <div class="contact-info">
        <h3 class="contact-name">${contact.name}</h3>
        <p class="contact-status">${contact.status}</p>
      </div>
    `;
    item.addEventListener('click', () => openChat(contact));
    container.appendChild(item);
  });

  // Create p5 avatar sketches
  contacts.forEach(contact => {
    createAvatarSketch(contact);
  });
}

function createAvatarSketch(contact) {
  const emotion = contact.emotion || { hue: 200, shape: 'circle', motion: 2, rhythm: 1 };
  
  new p5((p) => {
    let time = 0;
    
    p.setup = function() {
      const canvas = p.createCanvas(54, 54);
      canvas.parent(`avatar-${contact.id}`);
    };
    
    p.draw = function() {
      p.colorMode(p.HSB);
      p.background(emotion.hue, 60, 30);
      
      time += 0.02 * emotion.motion;
      
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        const alpha = p.map(p.sin(time + i), -1, 1, 100, 255);
        p.fill(emotion.hue, 70, 90, alpha);
        const size = 15 + p.sin(time * emotion.rhythm + i) * 5;
        p.ellipse(27 + p.cos(time + i) * 10, 27 + p.sin(time + i) * 10, size);
      }
    };
  });
}

function openChat(contact) {
  currentContact = contact;
  document.getElementById('chatName').textContent = contact.name;
  messages = [];
  renderMessages();
  showScreen('chatScreen');
}

function renderMessages() {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';
  messageCanvases.forEach(canvas => canvas.remove());
  messageCanvases = [];

  messages.forEach((msg, index) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.type}`;
    
    const tile = document.createElement('div');
    tile.className = 'pattern-tile';
    tile.id = `message-canvas-${index}`;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = msg.time;
    
    messageDiv.appendChild(tile);
    messageDiv.appendChild(time);
    container.appendChild(messageDiv);

    createMessagePattern(msg.emotion, `message-canvas-${index}`);
  });

  // Check for sync ONLY when emotions align
  if (messages.length >= 2) {
    const lastTwo = messages.slice(-2);
    if (lastTwo[0].type === 'sent' && lastTwo[1].type === 'received') {
      const syncScore = calculateSync(lastTwo[0].emotion, lastTwo[1].emotion);
      if (syncScore > 70) {
        showSyncIndicator();
      }
    }
  }

  container.scrollTop = container.scrollHeight;
}

function createMessagePattern(emotion, containerId) {
  const sketch = new p5((p) => {
    let time = 0;
    let particles = [];
    
    p.setup = function() {
      const canvas = p.createCanvas(200, 200);
      canvas.parent(containerId);
      
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: p.random(200),
          y: p.random(200),
          offset: p.random(p.TWO_PI)
        });
      }
    };
    
    p.draw = function() {
      p.background(0, 0, 0, 30);
      
      time += 0.015 * emotion.motion;
      
      p.colorMode(p.HSB);
      p.noStroke();
      
      particles.forEach(particle => {
        const alpha = p.map(p.sin(time * emotion.rhythm + particle.offset), -1, 1, 100, 255);
        p.fill(emotion.hue, 70, 90, alpha);
        
        let x = particle.x;
        let y = particle.y;
        
        if (emotion.shape === 'circle') {
          x = 100 + p.cos(time + particle.offset) * 40;
          y = 100 + p.sin(time + particle.offset) * 40;
        } else if (emotion.shape === 'wave') {
          x = particle.x + p.sin(time + particle.offset) * 20;
          y = particle.y + p.cos(time * 0.5 + particle.offset) * 15;
        } else if (emotion.shape === 'shard') {
          x = particle.x + p.random(-3, 3) * emotion.motion;
          y = particle.y + p.random(-3, 3) * emotion.motion;
        }
        
        const size = 5 + p.sin(time + particle.offset) * 2;
        p.ellipse(x, y, size);
      });
    };
  });
  
  messageCanvases.push(sketch);
}

function calculateSync(emotion1, emotion2) {
  const hueScore = 100 - Math.abs(emotion1.hue - emotion2.hue) / 360 * 100;
  const motionScore = 100 - Math.abs(emotion1.motion - emotion2.motion) / 10 * 100;
  const rhythmScore = 100 - Math.abs(emotion1.rhythm - emotion2.rhythm) / 3 * 100;
  const shapeScore = emotion1.shape === emotion2.shape ? 100 : 50;
  
  return (hueScore + motionScore + rhythmScore + shapeScore) / 4;
}

function showSyncIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'sync-indicator';
  indicator.innerHTML = `
    <span class="sync-icon">✨</span>
    <p class="sync-text">Understanding achieved</p>
  `;
  
  document.getElementById('messagesContainer').appendChild(indicator);
  
  setTimeout(() => {
    indicator.classList.add('visible');
  }, 100);
}

// Composer
document.getElementById('composeButton').addEventListener('click', () => {
  document.getElementById('composerOverlay').classList.add('active');
  if (!previewSketch) {
    createPreviewSketch();
  }
});

document.getElementById('closeComposer').addEventListener('click', () => {
  document.getElementById('composerOverlay').classList.remove('active');
});

// Color picker
const defaultColors = [
  { hue: 0, gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)' },
  { hue: 60, gradient: 'linear-gradient(135deg, #f9ca24, #f0932b)' },
  { hue: 120, gradient: 'linear-gradient(135deg, #6dd5ed, #2193b0)' },
  { hue: 180, gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { hue: 240, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { hue: 300, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' }
];

function renderColorGrid() {
  const colorGrid = document.getElementById('colorGrid');
  colorGrid.innerHTML = '';
  
  const allColors = [...defaultColors, ...customColors];
  
  allColors.forEach((color, index) => {
    const btn = document.createElement('button');
    btn.className = `color-btn ${index === 0 ? 'selected' : ''}`;
    btn.style.background = color.gradient;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentEmotion.hue = color.hue;
    });
    colorGrid.appendChild(btn);
  });
}

// Add custom color button
document.getElementById('addCustomColorBtn').addEventListener('click', () => {
  const colorPicker = document.getElementById('customColorPicker');
  const hexColor = colorPicker.value;
  
  // Convert hex to HSL to get hue
  const r = parseInt(hexColor.substr(1, 2), 16) / 255;
  const g = parseInt(hexColor.substr(3, 2), 16) / 255;
  const b = parseInt(hexColor.substr(5, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  const hue = Math.round(h * 360);
  
  // Create gradient for the custom color
  const customColor = {
    hue: hue,
    gradient: `linear-gradient(135deg, ${hexColor}, ${hexColor}dd)`
  };
  
  customColors.push(customColor);
  localStorage.setItem('nirbhaas_custom_colors', JSON.stringify(customColors));
  
  renderColorGrid();
  
  // Show success feedback
  const btn = document.getElementById('addCustomColorBtn');
  const originalText = btn.textContent;
  btn.textContent = '✓ Color Added!';
  btn.style.background = '#10b981';
  btn.style.color = 'white';
  btn.style.borderColor = '#10b981';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }, 2000);
});

// Shape selector
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentEmotion.shape = btn.dataset.shape;
    
    // Show/hide custom shape controls
    if (btn.dataset.shape === 'custom') {
      document.getElementById('customShapeControls').style.display = 'block';
      currentEmotion.customShape.enabled = true;
    } else {
      document.getElementById('customShapeControls').style.display = 'none';
      currentEmotion.customShape.enabled = false;
    }
  });
});

// Custom shape controls
document.getElementById('customShapeType').addEventListener('change', (e) => {
  currentEmotion.customShape.type = e.target.value;
});

document.getElementById('customShapeSides').addEventListener('input', (e) => {
  currentEmotion.customShape.sides = parseInt(e.target.value) || 5;
});

// Sliders
document.getElementById('motionSlider').addEventListener('input', (e) => {
  currentEmotion.motion = parseFloat(e.target.value);
  document.getElementById('motionValue').textContent = e.target.value;
});

document.getElementById('rhythmSlider').addEventListener('input', (e) => {
  currentEmotion.rhythm = parseFloat(e.target.value);
  document.getElementById('rhythmValue').textContent = parseFloat(e.target.value).toFixed(1);
});

// Custom Motion Toggle
document.getElementById('customMotionToggle').addEventListener('change', (e) => {
  currentEmotion.customMotion.enabled = e.target.checked;
  document.getElementById('customMotionControls').style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('customMotionPath').addEventListener('change', (e) => {
  currentEmotion.customMotion.path = e.target.value;
});

// Custom Rhythm Toggle
document.getElementById('customRhythmToggle').addEventListener('change', (e) => {
  currentEmotion.customRhythm.enabled = e.target.checked;
  document.getElementById('customRhythmControls').style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('customRhythmPattern').addEventListener('change', (e) => {
  currentEmotion.customRhythm.pattern = e.target.value;
});

document.getElementById('rhythmVariation').addEventListener('input', (e) => {
  currentEmotion.customRhythm.variation = parseInt(e.target.value);
  document.getElementById('rhythmVariationValue').textContent = e.target.value + '%';
});

// Particle Density
document.getElementById('particleDensity').addEventListener('input', (e) => {
  currentEmotion.particleDensity = parseInt(e.target.value);
  document.getElementById('particleDensityValue').textContent = e.target.value;
  
  // Recreate preview with new particle count
  if (previewSketch) {
    previewSketch.remove();
    previewSketch = null;
    createPreviewSketch();
  }
});

// Preview Mode Buttons
document.querySelectorAll('.preview-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preview-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentEmotion.previewMode = btn.dataset.mode;
  });
});

// Preview Control Buttons
let previewPaused = false;
document.getElementById('pausePreviewBtn').addEventListener('click', () => {
  if (previewSketch) {
    if (previewPaused) {
      previewSketch.loop();
      document.getElementById('pausePreviewBtn').textContent = '⏸ Pause';
    } else {
      previewSketch.noLoop();
      document.getElementById('pausePreviewBtn').textContent = '▶ Play';
    }
    previewPaused = !previewPaused;
  }
});

document.getElementById('resetPreviewBtn').addEventListener('click', () => {
  if (previewSketch) {
    previewSketch.remove();
    previewSketch = null;
    createPreviewSketch();
    previewPaused = false;
    document.getElementById('pausePreviewBtn').textContent = '⏸ Pause';
  }
});

document.getElementById('screenshotPreviewBtn').addEventListener('click', () => {
  if (previewSketch) {
    previewSketch.saveCanvas('nirbhaas-emotion', 'png');
  }
});

// Custom Sound Toggle
document.getElementById('customSoundToggle').addEventListener('change', (e) => {
  currentEmotion.customSound.enabled = e.target.checked;
  document.getElementById('customSoundControls').style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById('customWaveform').addEventListener('change', (e) => {
  currentEmotion.customSound.waveform = e.target.value;
});

document.getElementById('customPitch').addEventListener('input', (e) => {
  currentEmotion.customSound.pitch = parseInt(e.target.value);
  document.getElementById('customPitchValue').textContent = e.target.value + 'Hz';
});

document.getElementById('customDuration').addEventListener('input', (e) => {
  currentEmotion.customSound.duration = parseFloat(e.target.value);
  document.getElementById('customDurationValue').textContent = parseFloat(e.target.value).toFixed(1) + 's';
});

document.getElementById('customVolume').addEventListener('input', (e) => {
  currentEmotion.customSound.volume = parseInt(e.target.value);
  document.getElementById('customVolumeValue').textContent = e.target.value + '%';
});

function createPreviewSketch() {
  previewSketch = new p5((p) => {
    let time = 0;
    let particles = [];
    let paused = false;
    
    p.setup = function() {
      const canvas = p.createCanvas(342, 140);
      canvas.parent('previewCanvas');
      
      const density = currentEmotion.particleDensity || 30;
      for (let i = 0; i < density; i++) {
        particles.push({
          x: p.random(342),
          y: p.random(140),
          offset: p.random(p.TWO_PI),
          vx: p.random(-1, 1),
          vy: p.random(-1, 1)
        });
      }
    };
    
    p.draw = function() {
      // Background based on preview mode
      if (currentEmotion.previewMode === 'speed') {
        p.background(248, 249, 250, 50); // Trail effect
      } else {
        p.background(248, 249, 250);
      }
      
      // Apply custom rhythm pattern
      let rhythmMultiplier = 1;
      if (currentEmotion.customRhythm.enabled) {
        switch (currentEmotion.customRhythm.pattern) {
          case 'accelerate':
            rhythmMultiplier = 1 + (time * 0.01);
            break;
          case 'decelerate':
            rhythmMultiplier = Math.max(0.5, 2 - (time * 0.01));
            break;
          case 'heartbeat':
            rhythmMultiplier = Math.abs(p.sin(time * 2)) > 0.5 ? 2 : 0.5;
            break;
          case 'morse':
            rhythmMultiplier = p.floor(time * 2) % 2 === 0 ? 2 : 0.5;
            break;
        }
        rhythmMultiplier += (p.random() - 0.5) * (currentEmotion.customRhythm.variation / 100);
      }
      
      time += 0.015 * currentEmotion.motion * rhythmMultiplier;
      
      p.colorMode(p.HSB);
      p.noStroke();
      
      particles.forEach((particle, i) => {
        const alpha = p.map(p.sin(time * currentEmotion.rhythm + particle.offset), -1, 1, 100, 255);
        
        // Density mode shows particle count visually
        if (currentEmotion.previewMode === 'density') {
          p.fill(currentEmotion.hue, 70, 90, 200);
        } else {
          p.fill(currentEmotion.hue, 70, 90, alpha);
        }
        
        let x = particle.x;
        let y = particle.y;
        
        // Apply custom motion paths
        if (currentEmotion.customMotion.enabled) {
          switch (currentEmotion.customMotion.path) {
            case 'bounce':
              particle.vy += 0.2;
              y += particle.vy;
              if (y > 140 || y < 0) particle.vy *= -0.8;
              break;
            case 'zigzag':
              x = particle.x + p.sin(time + particle.offset) * 30;
              y = (time * currentEmotion.motion + particle.offset * 20) % 140;
              break;
            case 'orbit':
              const radius = 40 + (i % 3) * 15;
              x = 171 + p.cos(time * (i % 2 ? 1 : -1) + particle.offset) * radius;
              y = 70 + p.sin(time * (i % 2 ? 1 : -1) + particle.offset) * radius;
              break;
            case 'random':
              particle.x += particle.vx * currentEmotion.motion * 0.5;
              particle.y += particle.vy * currentEmotion.motion * 0.5;
              if (particle.x < 0 || particle.x > 342) particle.vx *= -1;
              if (particle.y < 0 || particle.y > 140) particle.vy *= -1;
              x = particle.x;
              y = particle.y;
              break;
          }
        } else {
          // Standard shape behaviors
          if (currentEmotion.shape === 'circle') {
            x = 171 + p.cos(time + particle.offset) * 30;
            y = 70 + p.sin(time + particle.offset) * 30;
          } else if (currentEmotion.shape === 'wave') {
            x = particle.x + p.sin(time + particle.offset) * 15;
            y = particle.y + p.cos(time * 0.5 + particle.offset) * 10;
          } else if (currentEmotion.shape === 'shard') {
            x = particle.x + p.random(-2, 2) * currentEmotion.motion;
            y = particle.y + p.random(-2, 2) * currentEmotion.motion;
          } else if (currentEmotion.shape === 'spiral') {
            const spiralRadius = (time + particle.offset * 10) % 60;
            x = 171 + p.cos(time * 2 + particle.offset) * spiralRadius;
            y = 70 + p.sin(time * 2 + particle.offset) * spiralRadius;
          } else if (currentEmotion.shape === 'burst') {
            const burstDist = ((time * 2 + particle.offset * 5) % 50);
            x = 171 + p.cos(particle.offset * 10) * burstDist;
            y = 70 + p.sin(particle.offset * 10) * burstDist;
          } else if (currentEmotion.shape === 'custom' && currentEmotion.customShape.enabled) {
            const sides = currentEmotion.customShape.sides;
            const angle = (p.TWO_PI / sides) * (i % sides);
            const radius = 30 + p.sin(time + particle.offset) * 10;
            
            if (currentEmotion.customShape.type === 'polygon') {
              x = 171 + p.cos(angle + time) * radius;
              y = 70 + p.sin(angle + time) * radius;
            } else if (currentEmotion.customShape.type === 'star') {
              const r = i % 2 === 0 ? radius : radius * 0.5;
              x = 171 + p.cos(angle + time) * r;
              y = 70 + p.sin(angle + time) * r;
            } else if (currentEmotion.customShape.type === 'flower') {
              const petalRadius = radius * (1 + p.sin(angle * sides + time * 2));
              x = 171 + p.cos(angle + time * 0.5) * petalRadius;
              y = 70 + p.sin(angle + time * 0.5) * petalRadius;
            } else if (currentEmotion.customShape.type === 'chaos') {
              x = 171 + p.cos(angle * p.sin(time) + time) * radius * p.random(0.5, 1.5);
              y = 70 + p.sin(angle * p.cos(time) + time) * radius * p.random(0.5, 1.5);
            }
          }
        }
        
        const size = 4 + p.sin(time + particle.offset) * 2;
        p.ellipse(x, y, size);
      });
    };
  });
}

// Learn custom emotion
function learnEmotion(emotion, name) {
  if (!name || name.trim() === '') return;
  
  const emotionData = {
    name: name.trim(),
    hue: emotion.hue,
    shape: emotion.shape,
    motion: emotion.motion,
    rhythm: emotion.rhythm,
    timestamp: Date.now()
  };
  
  // Check if similar emotion already exists
  const exists = learnedEmotions.some(e => 
    e.name.toLowerCase() === emotionData.name.toLowerCase()
  );
  
  if (!exists) {
    learnedEmotions.push(emotionData);
    localStorage.setItem('nirbhaas_learned_emotions', JSON.stringify(learnedEmotions));
    updateLearnedEmotionsDisplay();
  }
}

// Update learned emotions display in guide
function updateLearnedEmotionsDisplay() {
  const container = document.getElementById('learnedEmotionsDisplay');
  
  if (learnedEmotions.length === 0) {
    container.innerHTML = '<p style="font-size: 13px; color: #868e96; margin: 0; text-align: center;">No custom emotions learned yet. Create your first!</p>';
    return;
  }
  
  container.innerHTML = '';
  learnedEmotions.forEach(emotion => {
    const tag = document.createElement('div');
    tag.className = 'learned-emotion-tag';
    tag.innerHTML = `
      <div class="learned-emotion-color" style="background: hsl(${emotion.hue}, 70%, 60%);"></div>
      <span>${emotion.name}</span>
      <span style="font-size: 10px; opacity: 0.6;">${emotion.shape} • ${emotion.motion}/10</span>
    `;
    container.appendChild(tag);
  });
}

// Send emotion
document.getElementById('sendButton').addEventListener('click', () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Learn custom emotion if name provided
  const emotionName = document.getElementById('emotionNameInput').value;
  if (emotionName && emotionName.trim() !== '') {
    learnEmotion(currentEmotion, emotionName);
    document.getElementById('emotionNameInput').value = ''; // Clear input
  }
  
  messages.push({
    type: 'sent',
    emotion: { ...currentEmotion },
    time: timeStr
  });

  document.getElementById('composerOverlay').classList.remove('active');
  renderMessages();

  // Simulate response after 2 seconds
  setTimeout(() => {
    const responseVariations = [
      {
        hue: currentEmotion.hue + (Math.random() - 0.5) * 30,
        shape: currentEmotion.shape,
        motion: currentEmotion.motion + (Math.random() - 0.5) * 1,
        rhythm: currentEmotion.rhythm + (Math.random() - 0.5) * 0.3
      },
      {
        hue: (currentEmotion.hue + 180 + (Math.random() - 0.5) * 60) % 360,
        shape: ['circle', 'wave', 'shard'][Math.floor(Math.random() * 3)],
        motion: Math.random() * 10,
        rhythm: 0.5 + Math.random() * 2.5
      },
      {
        hue: (currentEmotion.hue + 120) % 360,
        shape: currentEmotion.shape === 'circle' ? 'wave' : currentEmotion.shape === 'wave' ? 'shard' : 'circle',
        motion: 10 - currentEmotion.motion,
        rhythm: currentEmotion.rhythm * 1.5
      }
    ];

    const responseEmotion = responseVariations[Math.floor(Math.random() * responseVariations.length)];

    messages.push({
      type: 'received',
      emotion: responseEmotion,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });

    renderMessages();
    
    // Play sound for received emotion
    playEmotionSound(responseEmotion);
  }, 2000);
});

// Back button
document.getElementById('backButton').addEventListener('click', () => {
  showScreen('homeScreen');
  messageCanvases.forEach(canvas => canvas.remove());
  messageCanvases = [];
});

// Info button (in chat header)
document.getElementById('infoButton').addEventListener('click', () => {
  document.getElementById('guideSidebar').classList.add('active');
});

// External info button (not used, kept for compatibility)
document.getElementById('externalInfoButton').addEventListener('click', () => {
  document.getElementById('guideSidebar').classList.add('active');
});

document.getElementById('closeGuide').addEventListener('click', () => {
  document.getElementById('guideSidebar').classList.remove('active');
});

// Haptic feedback demo
function triggerHaptic(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Preview sound button
document.getElementById('previewSoundBtn').addEventListener('click', () => {
  playEmotionSound(currentEmotion);
});

document.getElementById('hapticHeart').addEventListener('click', () => {
  triggerHaptic([100, 50, 100, 50, 100, 300, 100, 50, 100]);
});

document.getElementById('hapticBurst').addEventListener('click', () => {
  triggerHaptic([50, 30, 50, 30, 50, 30, 50]);
});

document.getElementById('hapticWave').addEventListener('click', () => {
  triggerHaptic([200, 100, 300, 100, 400, 100, 300, 100, 200]);
});

// Elements SDK
async function onConfigChange(config) {
  document.getElementById('appName').textContent = config.app_name || defaultConfig.app_name;
  document.getElementById('tagline').textContent = config.tagline || defaultConfig.tagline;
  document.getElementById('composerTitle').textContent = config.composer_title || defaultConfig.composer_title;
  document.getElementById('sendButtonText').textContent = config.send_button_text || defaultConfig.send_button_text;
  document.getElementById('composeButtonText').textContent = `+ ${config.composer_title || defaultConfig.composer_title}`;
}

if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig: defaultConfig,
    onConfigChange: onConfigChange,
    mapToCapabilities: (config) => ({
      recolorables: [],
      borderables: [],
      fontEditable: undefined,
      fontSizeable: undefined
    }),
    mapToEditPanelValues: (config) => new Map([
      ["app_name", config.app_name || defaultConfig.app_name],
      ["tagline", config.tagline || defaultConfig.tagline],
      ["composer_title", config.composer_title || defaultConfig.composer_title],
      ["send_button_text", config.send_button_text || defaultConfig.send_button_text]
    ])
  });
}

// Initialize
renderContacts();
renderColorGrid();
updateLearnedEmotionsDisplay();