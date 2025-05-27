// Wait for the popup's DOM to fully load before running script
document.addEventListener('DOMContentLoaded', () => {
  // Get a reference to the toggle button element in the popup
  const toggleButton = document.getElementById('toggleButton');

  // Load the current blocking state from extension storage
  chrome.storage.local.get('isBlocking', (data) => {
    // If value is undefined, default to true (blocking enabled)
    const isBlocking = data.isBlocking !== false;
    updateButton(isBlocking); // Set initial button label
  });

  // Add a click listener to the button to toggle the blocking state
  toggleButton.addEventListener('click', () => {
    // Send a message to the background script to toggle blocking
    chrome.runtime.sendMessage({ action: 'toggleBlocking' }, (response) => {
      // When background responds with new state, update button label
      if (response && typeof response.isBlocking === "boolean") {
        updateButton(response.isBlocking);
      }
    });
  });

  // Updates the button's text based on current blocking state
  function updateButton(isBlocking) {
    toggleButton.textContent = isBlocking
      ? 'Disable for 5 min' // When blocking is on
      : 'Re-enabling in 5 min...'; // When blocking is temporarily off
  }
});