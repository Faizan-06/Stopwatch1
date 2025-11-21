(function() {
  'use strict';

  const display = document.getElementById('display');
  const startBtn = document.getElementById('startBtn');
  const lapBtn = document.getElementById('lapBtn');
  const resetBtn = document.getElementById('resetBtn');
  const clearLapsBtn = document.getElementById('clearLapsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const lapsContainer = document.getElementById('laps');
  const lapsCount = document.getElementById('lapsCount');

  let running = false;
  let startTime = 0;
  let elapsedBefore = 0;
  let laps = [];
  let animationId = null;

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  function updateDisplay() {
    const currentMs = elapsedBefore + (performance.now() - startTime);
    display.textContent = formatTime(currentMs);
    if (running) animationId = requestAnimationFrame(updateDisplay);
  }

  function start() {
    if (running) return;
    running = true;
    startTime = performance.now();
    startBtn.textContent = 'Pause';
    startBtn.classList.remove('primary');
    lapBtn.disabled = false;
    updateDisplay();
  }

  function pause() {
    if (!running) return;
    running = false;
    elapsedBefore += (performance.now() - startTime);
    startBtn.textContent = 'Resume';
    startBtn.classList.add('primary');
    if (animationId) cancelAnimationFrame(animationId);
  }

  function reset() {
    pause();
    running = false;
    startTime = 0;
    elapsedBefore = 0;
    display.textContent = '00:00.000';
    startBtn.textContent = 'Start';
    startBtn.classList.add('primary');
    lapBtn.disabled = true;
  }

  function lap() {
    if (elapsedBefore === 0 && !running) return;
    const currentMs = elapsedBefore + (running ? (performance.now() - startTime) : 0);
    const lapTime = currentMs - (laps.length ? laps[laps.length - 1].cumulativeMs : 0);
    const entry = {
      index: laps.length + 1,
      time: formatTime(lapTime),
      cumulative: formatTime(currentMs),
      cumulativeMs: currentMs,
      lapMs: lapTime
    };
    laps.push(entry);
    renderLaps();
    highlightFastestSlowest();
  }

  function highlightFastestSlowest() {
    if (laps.length < 2) return;
    
    const lapTimes = laps.map(l => l.lapMs);
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);

    document.querySelectorAll('.lap').forEach((el, idx) => {
      const reversedIdx = laps.length - 1 - idx;
      el.classList.remove('fastest', 'slowest');
      
      if (laps[reversedIdx].lapMs === fastest && fastest !== slowest) {
        el.classList.add('fastest');
      }
      if (laps[reversedIdx].lapMs === slowest && fastest !== slowest) {
        el.classList.add('slowest');
      }
    });
  }

  function renderLaps() {
    lapsContainer.innerHTML = '';
    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const div = document.createElement('div');
      div.className = 'lap';
      div.innerHTML = `<div><strong>Lap ${l.index}</strong></div><div>${l.time} <span class="small">(${l.cumulative})</span></div>`;
      lapsContainer.appendChild(div);
    }
    lapsCount.textContent = laps.length;
    clearLapsBtn.disabled = laps.length === 0;
    exportBtn.disabled = laps.length === 0;
  }

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
    a.download = `stopwatch-laps-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  startBtn.addEventListener('click', () => {
    running ? pause() : start();
  });
  
  lapBtn.addEventListener('click', lap);
  
  resetBtn.addEventListener('click', () => {
    reset();
    laps = [];
    renderLaps();
  });
  
  clearLapsBtn.addEventListener('click', () => {
    if (confirm('Clear all lap times?')) {
      laps = [];
      renderLaps();
    }
  });
  
  exportBtn.addEventListener('click', exportCSV);

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
      if (elapsedBefore > 0 || running) {
        reset();
        laps = [];
        renderLaps();
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) pause();
  });

  lapBtn.disabled = true;
  clearLapsBtn.disabled = true;
  exportBtn.disabled = true;

})();