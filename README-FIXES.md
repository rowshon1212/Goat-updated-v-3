# GoatBot / Mari-GboT — Error Fix Pack

## Current repair status

The uploaded project was checked with Node.js 24:

- JSON validation now uses Node's built-in parser instead of an `npx jsonlint`
  executable, so startup no longer fails when archive permissions are lost.
- The launcher no longer uses `shell: true`, removing the child-process
  deprecation/security warning.
- Missing, malformed, expired, or rejected account/appstate data is reported
  clearly and does not trigger an endless automatic restart loop.
- All project JavaScript files pass `node --check`.

The release archive intentionally does not include `node_modules`. The uploaded
dependency folder contained incomplete, platform-specific native binaries
(including Windows-only Koffi files), so it could not be a reliable Linux or
Windows install. After extracting the release, run:

```bash
npm ci
node index.js
```

Use a current, valid Facebook appstate JSON file before starting the bot.

আমি পুরো `goatbot.zip` (৬০৫ MB, node_modules সহ) আবার পাঠাচ্ছি না —
কারণ ২ নাম্বার সমস্যাটা (canvas) Windows-এর native build tool দিয়ে
আপনার নিজের PC-তেই কম্পাইল করতে হবে, আমি Linux sandbox থেকে সেই
`.node` ফাইল বানাতে পারব না, এবং পুরো node_modules না বদলেও কাজ চলে।
তাই শুধু যেই ৪টা ফাইল বদলেছি, সেগুলোই এই zip-এ আছে — একই folder path
বজায় রেখে। নিচের "কী করবেন" অংশ অনুসরণ করুন।

## যা fix করা হয়েছে (4 files)

### 1. `includes/handler/shared.js`
**Error:** `TypeError: Cannot read properties of undefined (reading 'hideNotiMessage')`
**কারণ:** পুরোনো/আংশিক thread document-এ (MongoDB-তে আগে থেকে থাকা কিছু
thread) `settings`, `data`, `banned`, `adminIDs` field মিসিং ছিল। কোড
ধরে নিচ্ছিল এগুলো সবসময় থাকবে।
**Fix:** `buildContext()`-এ threadData লোড হওয়ার পরপরই এই ৪টা field
না থাকলে খালি default বসিয়ে দেয়া হয়েছে, তাই আর crash করবে না।

### 2. `includes/controller/threadsData.js`
**Error:** `TypeError: Cannot read properties of undefined (reading '-1')`
**কারণ:** একই কারণ — পুরোনো thread doc-এ `members` array না থাকলে
`oldMembers` হয়ে যাচ্ছিল `undefined`, আর `undefined[-1]` অ্যাক্সেস করতে
গিয়ে ওই আজব error message আসছিল।
**Fix:** `threadInfo.members || []` fallback, আর thread একদমই না
পাওয়া গেলে একটা সাধারণ `THREAD_NOT_FOUND` error reject করা হয়।

### 3. `node_modules/@rxabdullah/xdi-fca/extra/monitor/memoryUsage.js`
**Error:** `[ MEMORY MONITOR ] Failed To Start: startMonitoring is not a function`
**কারণ:** এটা `@rxabdullah/xdi-fca` লাইব্রেরির নিজেরই bug (আপনার কোডে না)।
`index.js`-এ `require('./extra/monitor/memoryUsage').startMonitoring()`
সরাসরি কল করা হয়, কিন্তু ফাইলটা `startMonitoring` কে একটা factory
function-এর ভেতরের return object-এ রাখে, বাইরে exposed করে না।
**Fix:** ফাংশনগুলো `module.exports` এর উপরেও সরাসরি বসানো হয়েছে,
যাতে দুইভাবেই কল করা যায়।

### 4. `node_modules/@rxabdullah/xdi-fca/node_modules/undici/lib/web/webidl/index.js`
**Error:** `TypeError: webidl.util.markAsUncloneable is not a function` → এর
কারণেই E2EE bridge connect fail করছিল।
**কারণ:** এই ফাইল `node:worker_threads` থেকে `markAsUncloneable` নামের
একটা function আশা করে। আপনার Node.js build-এ সেটা নেই/অন্যরকম বলে
`undefined` এসে যাচ্ছে, আর পরে সেটাকে function হিসেবে কল করতে গিয়ে crash।
**Fix:** `markAsUncloneable` না পাওয়া গেলে একটা no-op fallback function
ব্যবহার হবে — এই marking feature (structured-clone protection) স্রেফ
skip হয়ে যাবে, বট চালানোর জন্য এটা জরুরি না।

---

## যা আমি fix করতে পারিনি — এগুলো আপনাকে নিজের PC-তে করতে হবে

### canvas.node build error (balance.js, bank.js, rank.js, welcome.js ইত্যাদি)
```
Cannot find module '../build/Release/canvas.node'
```
এটা `canvas` npm প্যাকেজের native (C++) addon, যেটা আপনার নিজের
Windows machine-এর architecture আর Node ABI-এর জন্য compile হতে হবে —
আমি Linux sandbox থেকে সেই বাইনারি বানিয়ে দিতে পারব না, অন্য machine-এ
বানানো `.node` ফাইল আপনার PC-তে কাজ করবে না।

আপনার PC-তে PowerShell-এ (`goatbot` folder-এর ভেতরে থেকে) এভাবে try করুন:

1. `.windows-build-tools` আগেই install করা দেখলাম — তবু নিশ্চিত করতে:
   ```
   npm install --global windows-build-tools
   ```
   (Admin PowerShell-এ চালাতে হতে পারে)
2. তারপর শুধু canvas rebuild করুন:
   ```
   npm rebuild canvas --update-binary
   ```
3. এখনো fail করলে, প্রিবিল্ট বাইনারিসহ ফ্রেশ ইনস্টল try করুন:
   ```
   npm uninstall canvas
   npm install canvas@^2.11.2
   ```
   (2.9.1 এর চেয়ে নতুন patch ভার্সনে prebuilt binary পাওয়ার সম্ভাবনা বেশি)
4. এরপরও সমস্যা থাকলে, `canvas` এর বদলে `@napi-rs/canvas` ব্যবহার করা
   অনেক সহজ (আলাদা C++ build tool লাগে না) — কিন্তু তাহলে
   `balance.js`, `bank.js`, `rank.js` ইত্যাদি command file-এ
   `require('canvas')` কল করা জায়গাগুলো `@napi-rs/canvas`-এর API
   অনুযায়ী ছোট করে বদলাতে হবে। এই migration চাইলে বলবেন, আমি করে দিব।

---

## Fix pack কীভাবে বসাবেন

আপনার আসল `goatbot` folder-এ, এই zip-এর ভেতরের ৪টা ফাইল একই path-এ
কপি করে বসিয়ে দিন (overwrite করবেন):

```
includes/handler/shared.js
includes/controller/threadsData.js
node_modules/@rxabdullah/xdi-fca/extra/monitor/memoryUsage.js
node_modules/@rxabdullah/xdi-fca/node_modules/undici/lib/web/webidl/index.js
```

⚠️ মনে রাখবেন: `node_modules` এর ২টা ফাইল **আবার `npm install` চালালে
মুছে/আগের মত হয়ে যাবে** (কারণ npm প্রতিবার fresh package নামায়)। তাই
`npm install` করার পর আবার এই ২টা ফাইল বসাতে হবে। স্থায়ী সমাধানের জন্য
`patch-package` ব্যবহার করতে পারেন, চাইলে সেটাও সেট করে দিতে পারি।

`includes/` এর ২টা ফাইল আপনার নিজের bot code-এর অংশ, `npm install`-এ
touch হবে না — একবার বসালেই থাকবে।

canvas fix করার পর `npm start` দিয়ে আবার চালিয়ে দেখুন।
