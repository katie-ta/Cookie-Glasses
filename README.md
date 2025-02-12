# Cookie Glasses
CookieGlasses is a browser extension that displays information registered by cookie banners implemented according to the IAB's [Transparency &amp; Consent Framework (TCF)](https://iabeurope.eu/transparency-consent-framework/).

## Introduction

In the paper [Do Cookie Banners Respect my Choice? Measuring Legal Compliance of Banners from IAB Europe's Transparency and Consent Framework](https://arxiv.org/abs/1911.09964), it is shown that Consent Management Providers (CMPs) of IAB Europe's Transparency & Consent Framework (TCF) do not always respect user's choice. This extension allows you to verify that your consent is stored appropriately.

This extension for Firefox and Chrome queries CMPs of IAB Europe's TCF in the same position as a third-party advertiser, making it possible to see consent set by CMPs in real time. In other words, you can see whether consent registered by cookie banners is actually the consent you gave.
This extension only works with cookie banners of [IAB Europe's TCF](https://iabeurope.eu/transparency-consent-framework/).

<img width="512" alt="Screen Shot 2021-12-04 at 1 41 32 AM" src="https://user-images.githubusercontent.com/16495787/144700617-de120d8e-9c75-4ea2-826d-9aa7242ae54e.png">

The extension obtains its information via the TCF Consent String (TCString), obtained from [IAB's public API's](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md).

Author: Célestin Matte (Université Côte d'Azur, Inria, France)
Contributors: Katie Ta, Charles Tan (Providence, RI, USA)

## Features

Based on the TC string from the CMP, we decode and show the following information on the browser extension
- The TCF data processing purposes you've consented to and the purposes that are allowed based on legitimate interests
- List of all the vendors who are allowed to process your data and a list of the data processing purposes and features for each vendor
- Several aggregate values including the number of active and inactive vendors (inactive means they are allowed to process your data but you've rejected all of the purposes for which they would process your data)

<img src="./screenshots/cookie-glasses-purposes.gif" alt="purposes" width="256"/> <img src="./screenshots/cookie-glasses-features.gif" alt="features" width="256"/>

Other features:
- Functionality to manually decode a so-called "consent string" of the framework
- Communicates if the current webpage does not implement the TCF

<img src="./screenshots/manual_decode_tcstring.png" alt="manual_decode" width="512"/>
<img src="./screenshots/no_cmp_found.png" alt="no_cmp" width="512"/>

#### Update the CMP list

Run the `fetch_cmp_list.py` script to scrape the IAB website (https://iabeurope.eu/cmp-list/) to get the most up-to-date CMP list information and save it to `cmp_list_full.json`. According to the IAB documentation, the list can change daily, but in practice, we've observed it changes less frequently.

```
python3 Cookie-Glasses/src/scripts/fetch_cmp_list.py
```

Any CMP not included in the list provided by IAB is either not compliant or not registered with the TCF, and the extension will warn the user accordingly:

<img src="./screenshots/unknown_cmp.png" alt="no_cmp" width="512"/>

Ideally we should fetch the list regularly, and we hope to provide future functionality to get the latest CMP list directly from the extension ([Issue #56](https://github.com/katie-ta/Cookie-Glasses/issues/56)).

## Install

This version of Cookie Glasses is not available on the Chrome Webstore of Firefox Addons, so it must be manually installed from source.

### Chrome / Chromium

1. Download & unpack the ZIP file for this repo (green `Code` button above > `Download ZIP`)
2. In the `Cookie-Glasses` directory, run `yarn run build`. This should produce a new `build` folder.
3. Open Chrome and visit the Chrome extensions settings: chrome://extensions/
4. Enable Developer mode in the top right.
5. Choose "Load unpacked"
6. Choose the `build` folder generated in Step 2.
7. Visit websites implementing the Transparency & Consent Framework (note that you may need a VPN for some sites if you are not residing in the EU) 
8. Enjoy detecting violations!

### Firefox

On Firefox, out-of-store addons can only be loaded for the duration of the session (you will have to redo these steps if you close your browser).

1. Download & unpack the ZIP file for this repo (green `Code` button above > `Download ZIP`)
3. In the `Cookie-Glasses` directory, run `yarn run build`. This should produce a new `build` folder.
4. Open Firefox and visit: about:debugging#/runtime/this-firefox
5. Click `Load Temporary Add-on...`
6. Choose any file in the `build` folder generated in Step 2.
7. Visit websites implementing the Transparency & Consent Framework (note that you may need a VPN for some sites if you are not residing in the EU) 
8. Enjoy detecting violations!

## Limitations

As explained in the paper, there are two ways for advertisers to query the CMP:
1. through a direct call to the __tcfapi() function if they are in a first-party position,
2. through a postMessage sent to the __tcfapiLocator (formerly known as __cmpLocator in v1) iframe if they are in a third-party position.

Because of the security mechanisms of browsers extensions, Cookie Glasses can only use the second method. According to our measurement, this method is working on 79% of websites using the TCF.

If you want to see consent on the remaining 21% of websites, here's a manual workaround:
1. Open the developer console (ctrl+maj+i)
2. Run the following snippet in the console of the webpage in question: 
```__tcfapi("getTCData", 2, function(v, success) { console.log(v); });```
3. If you obtain a response, copy the string in the "tcString" field and decode it in the "Manually decode Consent String" section of the extension. You can find this section by clicking on the Tool icon at the bottom of the extension.

For now, the extension does not display the global shared cookie (which is a cookie storing consent, readable and writable by all CMPs of the framework).

## Run in developer mode
Follow the same instructions for both Chrome and Firefox as above, but instead of building the extension via `yarn build`, start the hot-reloading script with:
```
yarn run start
```

This will pick up any local changes made and automatically upload them to the unpacked extension in your browser.

## Privacy Policy
Cookie Glasses does not handle any personal information.
Cookie Glasses only processes consent information from IAB Europe's Transparency and Consent Framework (TCF) locally, and does not send any information to a distant server.
