let isBlocking = true;
const REDDIT_RULE_ID = 1;
const DISABLE_ALARM_NAME = "reEnableBlocking";
let currentChallenge = null;

const blockingRules = [
  {
    id: REDDIT_RULE_ID,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "*://*.reddit.com/*",
      resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "media", "websocket", "csp_report", "other"]
    }
  },
];

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    port.onDisconnect.addListener(() => {
      console.log("Popup closed — clearing currentChallenge");
      currentChallenge = null;
    });
  }
});

async function updateBlockingState(block) {
  isBlocking = block;
  await chrome.storage.local.set({ isBlocking });

  if (block) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: blockingRules,
      removeRuleIds: [REDDIT_RULE_ID]
    });
    await chrome.storage.local.remove("resumeTime");
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [REDDIT_RULE_ID]
    });
    const resumeTime = Date.now() + 5 * 60 * 1000;
    await chrome.storage.local.set({ resumeTime });
    chrome.alarms.create(DISABLE_ALARM_NAME, { delayInMinutes: 5 });
  }

}

async function init() {
  await chrome.alarms.clear(DISABLE_ALARM_NAME);
  await updateBlockingState(true);
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getStatus") {
    chrome.storage.local.get(["isBlocking", "resumeTime"], (data) => {
      sendResponse({
        isBlocking: data.isBlocking !== false,
        resumeTime: data.resumeTime || null,
        challengeActive: !!currentChallenge
      });
    });
    return true;
  }

  if (message.type === "requestChallenge") {
    const length = 10 + Math.floor(Math.random() * 11); // random between 10 and 20
    const challenge = generateChallenge(length);
    currentChallenge = challenge;
    sendResponse({ challenge });
    return true;
  }

  if (message.type === "submitChallenge") {
    if (message.answer === currentChallenge) {
      currentChallenge = null;
      updateBlockingState(false).then(() => {
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }

if (message.type === "reEnableNow") {
  chrome.alarms.clear(DISABLE_ALARM_NAME).then(() => {
    updateBlockingState(true).then(() => {
      sendResponse({ success: true }); // <-- notify popup after update
    });
  });
  return true; // <-- important to allow async response
}

  if (message.type === "cancelChallenge") {
    currentChallenge = null;
    return true;
  }

});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DISABLE_ALARM_NAME) {
    updateBlockingState(true);
  }
});

function generateChallenge(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
