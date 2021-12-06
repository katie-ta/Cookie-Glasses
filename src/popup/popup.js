/* eslint-disable no-loop-func */
/* eslint-disable no-underscore-dangle */
/* eslint-disable guard-for-in */
/* global chrome */
/* global browser */
import { TCString } from '@iabtcf/core';
import './img/Octicons-tools.png';
import './img/question_mark.svg';
import './ucookie.css';
import greenIcon19 from '../button/19_green.png';
import greenIcon38 from '../button/38_green.png';
import redIcon19 from '../button/19_red.png';
import redIcon38 from '../button/38_red.png';
import neutralIcon19 from '../button/19.png';
import neutralIcon38 from '../button/38.png';
import handleVendors from '../js/vendorUtils';
import { hideElement, showHiddenElement, isElementHidden } from '../js/htmlUtils';
import handlePurposes from '../js/purposeUtils';

const cmpListFull = require('../scripts/cmp_list_full.json');

const VENDOR_LIST_VERSION = 2;
let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

const tz = Intl.DateTimeFormat().resolvedOptions().locale;
const CHECK_TAB_STORAGE_RETRIES = 3;

function handleCmpLocatorFound(cmpLocatorFound) {
  try {
    if (cmpLocatorFound === true) {
      hideElement('nothing_found');
      showHiddenElement('cmplocator_found');
    } else {
      showHiddenElement('nothing_found');
      hideElement('cmplocator_found');
    }
  } catch {
    // popup not open
  }
}

function handleGdprApplies(gdprApplies) {
  try {
    if (gdprApplies === true) {
      hideElement('gdpr_applies_false');
      showHiddenElement('cmplocator_found');
      hideElement('error_fetching_retry');
      hideElement('error_fetching');
      hideElement('nothing_found');
    } else {
      showHiddenElement('gdpr_applies_false');
      hideElement('cmplocator_found');
      hideElement('error_fetching_retry');
      hideElement('error_fetching');
      hideElement('nothing_found');
    }
  } catch {
    // popup not open
  }
}

function showTCString(tcString) {
  document.getElementById('consent_string').textContent = tcString;
}

function showCmp(cmpId) {
  const cmpElement = document.getElementById('cmp');
  const cmp = cmpListFull[String(cmpId)];
  document.getElementById('cmpid').textContent = ` (ID: ${cmpId})`;
  if (cmpId in cmpListFull) {
    cmpElement.textContent = cmp.name;
    cmpElement.href = cmp.url;
    hideElement('unknown_cmp_container');
  } else {
    cmpElement.textContent = 'Unknown CMP';
    showHiddenElement('unknown_cmp_container');
  }
}

function setIcon(
  numConsentPurposes,
  numConsentVendors,
  numLegitimateInterestPurposes,
  numLegitimateInterestVendors,
  tabId,
) {
  if (numConsentPurposes * numConsentVendors === 0
    && numLegitimateInterestPurposes * numLegitimateInterestVendors === 0) {
    api.browserAction.setIcon({
      tabId,
      path: {
        19: greenIcon19,
        38: greenIcon38,
      },
    });
  } else {
    api.browserAction.setIcon({
      tabId,
      path: {
        19: redIcon19,
        38: redIcon38,
      },
    });
  }

  api.browserAction.setBadgeText({
    tabId,
    text: (numConsentPurposes + numLegitimateInterestPurposes).toString(),
  });
}

function formatDate(date) {
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatIntlDate(date) {
  return new Intl.DateTimeFormat(tz, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function showTimestamps(createdAt, lastUpdated, lastFetched) {
  document.getElementById('created').textContent = formatDate(createdAt);
  document.getElementById('last_updated').textContent = formatDate(lastUpdated);
  if (lastFetched !== undefined) {
    document.getElementById('last_fetched').textContent = formatIntlDate(lastFetched);
  } else {
    document.getElementById('last_fetched').textContent = 'N/A';
  }
}

function handleTCData(data, timestampTcDataLoaded, tabId) {
  const forceUpdate = timestampTcDataLoaded === undefined;
  showCmp(data.cmpId_);
  showTimestamps(data.created, data.lastUpdated, timestampTcDataLoaded);

  // handle vendors section
  handleVendors(data, VENDOR_LIST_VERSION, forceUpdate);
  // handle purposes section
  handlePurposes(data, forceUpdate);

  // set icon based on number of purposes
  setIcon(
    data.purposeConsents.set_.size,
    data.vendorConsents.set_.size,
    data.purposeLegitimateInterests.set_.size,
    data.vendorLegitimateInterests.set_.size,
    tabId,
  );
}

function getActiveTabStorage() {
  let count = 0;
  function loop() {
    count += 1;
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      console.log('active tab id', tabs[0].id);

      // reset icon
      api.browserAction.setIcon({
        tabId: activeTabId,
        path: {
          19: neutralIcon19,
          38: neutralIcon38,
        },
      });
      api.browserAction.setBadgeText({
        tabId: activeTabId,
        text: '0',
      });

      api.storage.local.get([String(activeTabId)], (result) => {
        const data = result[activeTabId];
        console.log('data from storage', data);
        if (data === undefined) {
          if (count <= CHECK_TAB_STORAGE_RETRIES) {
            hideElement('nothing_found');
            showHiddenElement('error_fetching_retry');
            setTimeout(() => { console.log(`Could not find TCF data in local storage, try ${count}/${CHECK_TAB_STORAGE_RETRIES}`); loop(); }, 1000);
          } else {
            hideElement('nothing_found');
            hideElement('error_fetching_retry');
            showHiddenElement('error_fetching');
            return false;
          }
        }

        // we've confirmed if the tcfapiLocator has been found
        if (data.tcfapiLocatorFound !== undefined) {
          handleCmpLocatorFound(data.tcfapiLocatorFound);
        } else {
          return true;
        }

        if (data.gdprApplies !== undefined && data.tcfapiLocatorFound) {
          handleGdprApplies(data.gdprApplies);
        }

        // tcfapiLocator has been found & received tcString
        if (data.tcfapiLocatorFound === true && data.tcString !== undefined) {
          // no longer need to show found message or any fetching messages
          hideElement('nothing_found');
          hideElement('error_fetching');
          hideElement('error_fetching_retry');
          hideElement('cmplocator_found');
          showHiddenElement('cmp_content');
          showTCString(data.tcString);

          const decodedString = TCString.decode(data.tcString);
          console.log('decoded string', decodedString);
          handleTCData(decodedString, data.timestampTcDataLoaded, activeTabId);
        }
        return true;
      });
      return true;
    });
  }
  loop();
}

/**
 * Prunes tab storage, called when the popup is opened
 * 1. If there are over 200 keys in local storage
 * 2. Check if the key is something we set (ie from cookie glasses)
 * 3. If the storage item is from cookie glasses and is over 12 hours old, remove it from storage
 */
function pruneTabStorage() {
  chrome.storage.local.get(null, (result) => {
    console.log('Pruning local tabs storage');
    const keys = Object.keys(result);
    if (keys.length > 200) {
      keys.map((key) => {
        const item = result[key];
        if (item.tcfapiLocatorFound !== undefined
          && item.gdprApplies !== undefined
          && item.timestamp !== undefined) {
          if (item.timestamp < Date.now() - 43200000) {
            chrome.storage.local.remove(key);
          }
        }
        return true;
      });
    }
  });
}

if (document.getElementById('decode_cs')) {
  document.getElementById('decode_cs').onclick = function () {
    const rawConsentString = document.getElementById('cs_to_decode').value;
    try {
      const decodedString = TCString.decode(rawConsentString);
      handleTCData(decodedString, undefined);
      hideElement('decode_cs_error');
      showHiddenElement('warning_header');
    } catch {
      showHiddenElement('decode_cs_error');
    }
  };
}

if (document.getElementById('open_decoder')) {
  document.getElementById('open_decoder').onclick = (e) => {
    e.preventDefault();
    if (isElementHidden(document.getElementById('decoder'))) {
      showHiddenElement('decoder');
      hideElement('details');
    } else {
      hideElement('decoder');
    }
  };
}

if (document.getElementById('open_details')) {
  document.getElementById('open_details').onclick = (e) => {
    e.preventDefault();
    if (isElementHidden(document.getElementById('details'))) {
      showHiddenElement('details');
      hideElement('decoder');
    } else {
      hideElement('details');
    }
  };
}

pruneTabStorage();
getActiveTabStorage();

// ----------------------------- OLD LOGIC -----------------------------

// https://bugzilla.mozilla.org/show_bug.cgi?id=1425829#c12
async function firefoxWorkaroundForBlankPanel() {
  if (chrome !== undefined || browser === undefined) {
    return;
  }
  const { id, width, height } = await browser.windows.getCurrent();
  browser.windows.update(id, {
    width: width + 1,
    height: height + 1,
  });
}
firefoxWorkaroundForBlankPanel();
