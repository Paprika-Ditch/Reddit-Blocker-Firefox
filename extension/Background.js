// Keeps track of whether blocking is currently enabled (in-memory)
let isBlocking = true;

// Define unique rule IDs for declarativeNetRequest rules
const REDDIT_RULE_ID = 1;

// The rules to block Reddit
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
];

const DISABLE_ALARM_NAME = "reEnableBlocking";

/**
 * Updates the declarativeNetRequest rules and storage based on the blocking state.
 * @param {boolean} block - True to enable blocking, false to disable.
 */
async function updateBlockingState(block) {
  try {
    isBlocking = block; // Update in-memory state
    await chrome.storage.local.set({ isBlocking });

    if (block) {
      console.log("updateBlockingState: Enabling blocking.");
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: blockingRules,
        // This ensures that rule ID 1 is effectively updated/added.
        // declarativeNetRequest removes specified rule IDs first, then adds the new rules.
        removeRuleIds: [REDDIT_RULE_ID]
      });
      await chrome.storage.local.remove('resumeTime');
      console.log("updateBlockingState: resumeTime removed.");
    } else {
      console.log("updateBlockingState: Disabling blocking.");
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [REDDIT_RULE_ID]
      });
      const resumeTime = Date.now() + 5 * 60 * 1000;
      await chrome.storage.local.set({ resumeTime });
      console.log(`updateBlockingState: Blocking disabled. Resume time set to ${new Date(resumeTime)}`);
    }
  } catch (e) {
    console.error("Failed to update blocking state:", e);
  }
}

/**
 * Called at startup or installation.
 * Resets the extension to its default state: blocking enabled.
 */
async function init() {
  try {
    console.log("Extension initializing: Resetting to default blocking state.");

    // Clear any alarm that might have persisted from a previous session.
    await chrome.alarms.clear(DISABLE_ALARM_NAME);
    console.log("Init: Cleared any existing alarms.");

    // Force the extension into its default state: blocking enabled.
    // updateBlockingState(true) will handle:
    // - Setting isBlocking = true (in-memory and storage)
    // - Applying declarativeNetRequest rules for blocking
    // - Removing 'resumeTime' from storage
    await updateBlockingState(true);
    console.log("Init: Extension state reset. Blocking is now enabled.");
  } catch (e) {
    console.error("Failed to initialize and reset extension state:", e);
    // If the main init fails, as a last resort, try to set a basic blocking state.
    // This is a "best effort" and might not always succeed if Chrome APIs are failing.
    try {
        console.warn("Init failed, attempting direct fallback to enable blocking.");
        isBlocking = true;
        await chrome.storage.local.set({ isBlocking: true });
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: blockingRules,
            removeRuleIds: [REDDIT_RULE_ID]
        });
        await chrome.storage.local.remove('resumeTime');
    } catch (fallbackError) {
        console.error("Init: Fallback attempt to enable blocking also failed:", fallbackError);
    }
  }
}

// Called when the extension is first installed
chrome.runtime.onInstalled.addListener(init);

// Called when the browser starts up and the extension is loaded
chrome.runtime.onStartup.addListener(init);

// Handles messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleBlocking") {
    const newState = !isBlocking; // Toggle based on current in-memory state

    // Clear any existing alarm first. This is important if the user manually
    // re-enables blocking before a "disable" alarm fires, or chains disable actions.
    chrome.alarms.clear(DISABLE_ALARM_NAME).then(() => {
      console.log("onMessage: Cleared alarm due to manual toggle.");
      return updateBlockingState(newState); // Update state (will set new resumeTime if disabling)
    }).then(() => {
      if (!newState) { // If blocking was just disabled
        // updateBlockingState(false) has set a new resumeTime.
        // Create an alarm to re-enable blocking in 5 minutes.
        chrome.alarms.create(DISABLE_ALARM_NAME, { delayInMinutes: 5 });
        console.log("onMessage: Blocking disabled, 5-minute re-enable alarm created.");
      } else {
        console.log("onMessage: Blocking enabled manually.");
        // If blocking is enabled, updateBlockingState(true) already cleared resumeTime.
      }
      sendResponse({ isBlocking: newState });
    }).catch((e) => {
      console.error("Error toggling blocking state:", e);
      sendResponse({ isBlocking }); // Respond with the last known in-memory state
    });

    return true; // Indicates sendResponse will be called asynchronously
  }
});

// Listener for when an alarm fires
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`Alarm fired: ${alarm.name}`);
  if (alarm.name === DISABLE_ALARM_NAME) {
    console.log("DISABLE_ALARM_NAME alarm received. Re-enabling blocking.");
    // The alarm fired, so re-enable blocking.
    updateBlockingState(true).catch((e) => {
      console.error("Error re-enabling blocking after alarm:", e);
    });
  }
});