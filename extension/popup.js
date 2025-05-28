let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleButton');

  // Function to start or stop countdown based on blocking state
  function checkCountdown(isBlocking, resumeTime) {
    // Clear any previous interval
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!isBlocking && resumeTime && resumeTime > Date.now()) {
      // Start countdown
      updateCountdownButton(resumeTime);
      timerInterval = setInterval(() => {
        updateCountdownButton(resumeTime);
      }, 1000);
    } else {
      // Not counting down, just show enable/disable button
      toggleButton.textContent = isBlocking
        ? 'Disable for 5 min'
        : 'Re-enabling in 5 min...';
    }
  }

  // Update the countdown button label
  function updateCountdownButton(resumeTime) {
    const remainingMs = resumeTime - Date.now();
    if (remainingMs > 0) {
      const min = Math.floor(remainingMs / 60000);
      const sec = Math.floor((remainingMs % 60000) / 1000);
      toggleButton.textContent = `Re-enabling in ${min}:${sec < 10 ? '0' : ''}${sec}...`;
    } else {
      // Time's up, switch UI back to normal
      clearInterval(timerInterval);
      timerInterval = null;
      // Force reload the popup state from storage (gets new isBlocking)
      chrome.storage.local.get('isBlocking', (data) => {
        updateButton(data.isBlocking !== false);
      });
    }
  }

  // Combined state update
  function updateButton(isBlocking) {
    chrome.storage.local.get('resumeTime', (data) => {
      checkCountdown(isBlocking, data.resumeTime);
    });
  }

  // Load the current blocking state from extension storage
  chrome.storage.local.get(['isBlocking', 'resumeTime'], (data) => {
    const isBlocking = data.isBlocking !== false;
    checkCountdown(isBlocking, data.resumeTime);
  });

  toggleButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggleBlocking' }, (response) => {
      if (response && typeof response.isBlocking === "boolean") {
        updateButton(response.isBlocking);
      }
    });
  });
});
