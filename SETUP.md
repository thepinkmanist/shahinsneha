# One-time setup: face search index

The "Find someone in the photos" button on each gallery page needs a small
index built once — it's what lets the site compare an uploaded selfie
against every photo. This has to run in a real, foregrounded browser tab
(not automation) since it does hundreds of face detections and browsers
slow that way down when a tab is hidden/backgrounded.

1. Open `index-faces.html` locally (or on the live site once deployed) in
   Chrome or Edge.
2. Click **Start building the index** and leave the tab open and focused —
   for ~770 photos this takes a few minutes.
3. When it finishes, three files land in your Downloads folder:
   `registration-faces.json`, `reception1-faces.json`, `reception2-faces.json`.
4. Move all three into this project's `data/` folder (next to
   `registration.json` etc.), then commit and push.

Until you do this, the gallery pages work fully — "Find someone in the
photos" will just say search isn't available yet for that event.

---

# One-time setup: visitor log (Google Sheet)

The site asks first-time visitors for their name + phone number, then
remembers them (via `localStorage`) so they're never asked again on that
device. To also collect those answers somewhere you can check, follow these
steps once. If you skip this, the gate still works — it just won't log
anyone anywhere.

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Rename it something like `Wedding Gallery Visitors`.
3. In row 1, add headers: `Timestamp`, `Name`, `Phone`, `Page`.

## 2. Add the script

1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete anything in the editor and paste this:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.name || "",
    data.phone || "",
    data.page || "",
  ]);
  return ContentService.createTextOutput("OK");
}
```

3. Click **Save** (disk icon), name the project anything.

## 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**. Google will ask you to authorize it — approve it (it's
   your own script, only touching your own Sheet).
5. Copy the **Web app URL** it gives you (ends in `/exec`).

## 4. Paste the URL into the site

Open [`gate.js`](gate.js) and find this line near the top:

```javascript
const GATE_WEBHOOK_URL = "";
```

Paste your URL between the quotes:

```javascript
const GATE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

Save, commit, and push. From then on, every new visitor's name, phone
number, page, and timestamp will show up as a new row in your Sheet —
check it any time, no login system needed.

## Notes

- Nothing is uploaded anywhere else — this is the only place visitor
  answers go, and it's a spreadsheet in your own Google Drive.
- If someone clears their browser data (or visits from a different device),
  they'll be asked again — that's expected with this simple, no-login
  approach.
- This isn't identity verification — anyone can type any name. It's a
  lightweight guestbook, not a security gate.
