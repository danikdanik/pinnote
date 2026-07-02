var STORAGE_KEY = 'pinnote:tabState';

async function getState() {
  try {
    var data = await chrome.storage.session.get(STORAGE_KEY);
    return data[STORAGE_KEY] || {};
  } catch (e) {
    return {};
  }
}

async function setRunning(tabId, running) {
  var state = await getState();
  if (running) state[tabId] = true;
  else delete state[tabId];
  await chrome.storage.session.set({ [STORAGE_KEY]: state });
}

chrome.action.onClicked.addListener(async function(tab) {
  var state = await getState();
  var current = !!state[tab.id];
  var action = current ? 'stop' : 'start';

  try {
    var response = await chrome.tabs.sendMessage(tab.id, { action: action });
    if (response && response.ok) {
      await setRunning(tab.id, !current);
      updateBadge(tab.id);
    }
  } catch (err) {
    console.warn('[PinNote] Tab not ready:', err.message);
  }
});

chrome.tabs.onRemoved.addListener(async function(tabId) {
  await setRunning(tabId, false);
});

chrome.tabs.onUpdated.addListener(async function(tabId, info) {
  if (info.status === 'loading') {
    await setRunning(tabId, false);
    chrome.action.setBadgeText({ tabId: tabId, text: '' });
  }
});

async function updateBadge(tabId) {
  try {
    var response = await chrome.tabs.sendMessage(tabId, { action: 'getNoteCount' });
    if (response && response.count !== undefined) {
      chrome.action.setBadgeText({ tabId: tabId, text: String(response.count) });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#3182ce' });
    }
  } catch (e) {}
}
