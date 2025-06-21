const toggleButton = document.getElementById("toggleButton");
const challengeDiv = document.getElementById("challengeContainer");
const challengeText = document.getElementById("challengeText");
const challengeInput = document.getElementById("challengeInput");
const confirmButton = document.getElementById("confirmButton");
const errorMsg = document.getElementById("errorMsg");
const port = chrome.runtime.connect({ name: "popup" });

let timerInterval = null;
let currentResumeTime = null;

function refreshState() {
  chrome.runtime.sendMessage({ type: "getStatus" }, (res) => {
    const { isBlocking, resumeTime, challengeActive } = res;
    currentResumeTime = resumeTime;
    if (isBlocking) {
      toggleButton.textContent = "Disable for 5 min";
    } else {
      updateCountdownButton(resumeTime);
      startCountdown(resumeTime);
    }
    toggleButton.disabled = challengeActive;
  });
}

toggleButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "getStatus" }, (res) => {
    if (res.isBlocking) {
      chrome.runtime.sendMessage({ type: "requestChallenge" }, (response) => {
        showChallenge(response.challenge);
      });
    } else {
      chrome.runtime.sendMessage({ type: "reEnableNow" }, (res) => {
        if (res.success) {
          if (timerInterval) clearInterval(timerInterval); // stop countdown
          refreshState(); // now it will correctly reflect new state
        }
      });
    }
  });
});


function showChallenge(code) {
  toggleButton.style.display = "none";
  challengeDiv.style.display = "block";
  challengeText.innerText = code;
  challengeInput.value = '';
  errorMsg.style.display = 'none';
  challengeInput.focus();

  confirmButton.onclick = () => {
    const answer = challengeInput.value.trim();
    chrome.runtime.sendMessage({ type: "submitChallenge", answer }, (res) => {
      if (res.success) {
        challengeDiv.style.display = "none";
        toggleButton.style.display = "block";
        refreshState();
      } else {
        errorMsg.style.display = "block";
      }
    });
  };

  challengeInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      confirmButton.click();
    }
  };
}

function startCountdown(resumeTime) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => updateCountdownButton(resumeTime), 1000);
}

function updateCountdownButton(resumeTime) {
  const remainingMs = resumeTime - Date.now();
  if (remainingMs > 0) {
    const min = Math.floor(remainingMs / 60000);
    const sec = Math.floor((remainingMs % 60000) / 1000);
    toggleButton.textContent = `Re-enabling in ${min}:${sec < 10 ? '0' : ''}${sec}...`;
  } else {
    clearInterval(timerInterval);
    refreshState();
  }
}

document.addEventListener("DOMContentLoaded", refreshState);