// Keeps track of whether blocking is currently enabled
let isBlocking = true;

// Define unique rule IDs for declarativeNetRequest rules
const REDDIT_RULE_ID = 1;
const YOUTUBE_SHORTS_RULE_ID = 2;

// The rules to block Reddit and YouTube Shorts
const blockingRules = [
  {
    id: REDDIT_RULE_ID,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "*://*.reddit.com/*",
      resourceTypes: [
        "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
        "object", "xmlhttprequest", "ping", "media", "websocket", "csp_report", "other"
      ]
    }
  },
  {
    id: YOUTUBE_SHORTS_RULE_ID,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "*://*.youtube.com/*shorts*",
      resourceTypes: [
        "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
        "object", "xmlhttprequest", "ping", "media", "websocket", "csp_report", "other"
      ]
    }
  }
];

const DISABLE_ALARM_NAME = "reEnableBlocking";

/**
 * Updates the declarativeNetRequest rules based on the blocking state.
 * @param {boolean} block - True to enable blocking, false to disable.
 */
async function updateBlockingState(block) {
  try {
    isBlocking = block;
    await chrome.storage.local.set({ isBlocking });

    if (block) {
      // Add the blocking rules, remove any existing first
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: blockingRules,
        removeRuleIds: [REDDIT_RULE_ID, YOUTUBE_SHORTS_RULE_ID]
      });
    } else {
      // Remove the blocking rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [REDDIT_RULE_ID, YOUTUBE_SHORTS_RULE_ID]
      });
    }
  } catch (e) {
    console.error("Failed to update blocking state:", e);
  }
}

/**
 * Called at startup or installation to initialize the blocking state.
 */
async function init() {
  try {
    const data = await chrome.storage.local.get("isBlocking");
    isBlocking = data.isBlocking !== false;
    await updateBlockingState(isBlocking);
    chrome.alarms.clear(DISABLE_ALARM_NAME);
  } catch (e) {
    console.error("Failed to initialize extension:", e);
  }
}

// Called when the extension is first installed
chrome.runtime.onInstalled.addListener(init);

// Called when the browser starts up and the extension is loaded
chrome.runtime.onStartup.addListener(init);

// Handles messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleBlocking") {
    const newState = !isBlocking;

    // Clear any existing alarm if the user manually toggles
    chrome.alarms.clear(DISABLE_ALARM_NAME);

    updateBlockingState(newState)
      .then(() => {
        // If disabling temporarily, set a 5-minute alarm to re-enable it
        if (!newState) {
          chrome.alarms.create(DISABLE_ALARM_NAME, { delayInMinutes: 5 });
        }
        // Respond with the new blocking state after state has been updated
        sendResponse({ isBlocking: newState });
      })
      .catch((e) => {
        // Log error and respond with last known state
        console.error("Error toggling blocking state:", e);
        sendResponse({ isBlocking });
      });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Listener for when an alarm fires (e.g., the 5-minute re-enable alarm)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DISABLE_ALARM_NAME) {
    updateBlockingState(true).catch((e) => {
      console.error("Error re-enabling blocking after alarm:", e);
    });
  }
});
