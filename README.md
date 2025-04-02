# Gmail Domain Blocker: Setup & Installation Guide

This document explains how to **deploy** the Gmail Domain Blocker add-on into your own Google Workspace (G Suite) account for **personal testing**. After following these steps, you will see a custom “Block Domain” button in the Gmail sidebar whenever you open an email.

---

## 1. Overview

- **Code repository**: Contains two main files:
  1. `Code.gs` – the Apps Script code that builds the add-on interface and handles filtering/archiving logic.
  2. `appsscript.json` – the manifest with metadata and required scopes.

- **What it does**:
  - Shows a button in Gmail’s side panel titled “🚫 Domain” (or similar).
  - When clicked, it parses the sender’s domain, creates a Gmail filter for that domain, and labels + archives the current message. All future messages from that domain also skip the inbox.

- **Limitations**:
  - This guide covers **personal** or **test** installations (visible only to you).
  - For domain-wide installs or publishing to all users, you must involve the Workspace admin console or the Google Workspace Marketplace SDK.

---

## 2. Prerequisites

1. A **Google Workspace** (G Suite) or personal Gmail account.
2. Ability to **create or manage** a [Google Cloud Platform (GCP)](https://console.cloud.google.com/) project, or use the default Apps Script-managed project for testing.
3. A local or GitHub copy of `Code.gs` and `appsscript.json`.

> **Note**: For a simple **private/test** install, the default Apps Script-managed GCP project is fine. If you plan a broader release or domain-wide install, a standard GCP project and marketplace listing may be required.

---

## 3. Create an Apps Script Project & Import the Code

1. **Go to** [script.google.com](https://script.google.com/) and sign in with your Google account.
2. Click **“New project.”**  
3. A blank project opens with a default file named `Code.gs`.

### 3.1 Show the Manifest

- In the left sidebar, click the gear icon (**Project Settings**).
- Enable **“Show ‘appsscript.json’ manifest file in editor.”**  
- You will now see `appsscript.json` listed with your script files.

### 3.2 Copy Your Files

- In **`Code.gs`** (in the online editor), paste the entire contents of the `Code.gs` from this repo.
- In **`appsscript.json`**, paste the manifest content from this repo, **removing any `//` comments** to keep the JSON valid.
- Save your changes.

Your Apps Script project structure should look like:
