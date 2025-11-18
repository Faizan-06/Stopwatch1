(function() {
  'use strict';

  // DOM elements
  const display = document.getElementById('display');
  const startBtn = document.getElementById('startBtn');
  const lapBtn = document.getElementById('lapBtn');
  const resetBtn = document.getElementById('resetBtn');
  const clearLapsBtn = document.getElementById('clearLapsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const lapsContainer = document.getElementById('laps');
  const lapsCount = document.getElementById('lapsCount');

  // State
  let running = false;
  let startTime = 0;
  let elapsedBefore = 0;
  let laps = [];
  let animationId = null;

  // Format milliseconds to MM:SS.mmm
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  // Update display continuously
  function updateDisplay() {
    const currentMs = elapsedBefore + (performance.now() - startTime);
    display.textContent = formatTime(currentMs);
    if (running) animationId = requestAnimationFrame(updateDisplay);
  }

  // Start stopwatch
  function start() {
    if (running) return;
    running = true;
    startTime = performance.now();
    startBtn.textContent = 'Pause';
    startBtn.classList.remove('primary');
    updateDisplay();
  }

  // Pause stopwatch
  function pause() {
    if (!running) return;
    running = false;
    elapsedBefore += (performance.now() - startTime);
    startBtn.textContent = 'Start';
    startBtn.classList.add('primary');
    if (animationId) cancelAnimationFrame(animationId);
  }

  // Reset stopwatch
  function reset() {
    pause();
    running = false;
    startTime = 0;
    elapsedBefore = 0;
    laps = [];
    display.textContent = '00:00.000';
    startBtn.textContent = 'Start';
    startBtn.classList.add('primary');
    renderLaps();
  }

  // Record lap
  function lap() {
    const currentMs = elapsedBefore + (running ? (performance.now() - startTime) : 0);
    const lapTime = currentMs - (laps.length ? laps[laps.length - 1].cumulativeMs : 0);
    const entry = {
      index: laps.length + 1,
      time: formatTime(lapTime),
      cumulative: formatTime(currentMs),
      cumulativeMs: currentMs
    };
    laps.push(entry);
    renderLaps();
  }

  // Render laps list
  function renderLaps() {
    lapsContainer.innerHTML = '';
    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const div = document.createElement('div');
      div.className = 'lap';
      div.innerHTML = `<div>Lap ${l.index}</div><div>${l.time} <span class="small">(Total ${l.cumulative})</span></div>`;
      lapsContainer.appendChild(div);
    }
    lapsCount.textContent = laps.length;
  }

  // Export laps to CSV
  function exportCSV() {
    if (!laps.length) {
      alert('No laps to export');
      return;
    }
    const header = ['Lap', 'LapTime', 'CumulativeTime'];
    const rows = laps.map(l => [l.index, l.time, l.cumulative]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laps.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Button listeners
  startBtn.addEventListener('click', () => {
    running ? pause() : start();
  });
  
  lapBtn.addEventListener('click', lap);
  
  resetBtn.addEventListener('click', reset);
  
  clearLapsBtn.addEventListener('click', () => {
    laps = [];
    renderLaps();
  });
  
  exportBtn.addEventListener('click', exportCSV);

  // Keyboard shortcuts: Space = start/pause, L = lap, R = reset
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      running ? pause() : start();
    }
    if (e.key.toLowerCase() === 'l') {
      e.preventDefault();
      lap();
    }
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      reset();
    }
  });

  // On page hide (tab close), pause to avoid runaway
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) pause();
  });

  // Expose for debugging (optional)
  window._stopwatch = { start, pause, reset, lap, formatTime };
})();