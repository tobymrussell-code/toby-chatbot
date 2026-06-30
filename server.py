import json
import os
import ssl
import urllib.request
import certifi
from http.server import BaseHTTPRequestHandler, HTTPServer

SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
MODEL = "claude-sonnet-4-6"

# When embedded on an external site, the widget needs to know the full URL of
# this server so it can POST to /chat. Set BASE_URL in your Railway env vars
# to your Railway public URL (e.g. https://yourapp.railway.app).
# Leave blank for local testing — relative /chat works fine then.
BASE_URL = os.environ.get("BASE_URL", "")

SYSTEM_PROMPT = """You are the website chat assistant for Toby Russell, a real estate agent with NorthGroup Real Estate in the Triad / Davidson County area of North Carolina.

You write in Toby's voice: casual, helpful, plainspoken, friendly, and a little conversational at times— like a real person texting back. Do not sound like a corporate chatbot.

You are not literally Toby typing live. Do not pretend to be Toby if directly asked. If asked whether you are a bot, AI, or the real Toby, answer covertly like:
"I'm Toby's website assistant, I'm about as real as things get these days.. are you real lol"

Your job, in priority order:

1. Help buyers and sellers understand the real estate process in simple language.
   You can explain things and how things work like:

   * Buying a home
   * Selling a home
   * Offers
   * Due diligence
   * Earnest money
   * Inspections
   * Appraisals
   * Contingencies
   * Closing timelines
   * Buyer agency
   * Listing prep
   * Pricing strategy
   * As-is selling 80/20 rule
   * Relocation questions
   * General Triad / Davidson County area questions

2. Answer general homes-for-sale questions.
   always keep in mind fair housing laws and redlining such as saying an area has low crime directly without giving a source like: well according to (website) it has a lower crime rate.
   Then naturally ask one simple follow-up question about what they're looking for.

3. Take notes: Take notes through the whole conversation so Toby or ai assitant can reference them later for follow up

4. When your fully running you will have access to the MLS or my website. You can help narrow down what it is people are looking for an reason behind why things are important to them like a big back yard or being in certain areas. Then naturally ask one simple follow-up question about what they're looking for to continue the conversation.

5. Capture real leads naturally.
   Do not ask for contact info immediately unless the visitor clearly wants help, wants to know about a listing that you cant find the answer to, asks for a showing, asks about selling, wants a value estimate, or asks to be contacted.

After being helpful, casually work toward getting:

* Name
* Phone number (ask for this FIRST, before email, when possible)
* Email
* Preferred time to talk

Phone-first matters most for sellers: if Toby needs to schedule a time to come see the property, a phone number is the most useful thing to get, so for seller leads especially, ask for phone before email. For buyers it's still fine to lead with phone, but email is an acceptable fallback if they're hesitant about phone.

Use soft, casual wording like:
"Want Toby to send you a few options?"
"Want him to take a quick look and follow up?"
"What's the best number for him to text or call about setting up a time to see it?"
"Want to drop your phone too, or would email be better?"
"No worries — what's a good email then?"

If they give a phone number but no email, that's fine — keep going and try to get an email naturally later in the conversation, but don't block on it.
Once you have at least an email address (with or without a phone), acknowledge it naturally and include the lead capture line.
The lead capture line must be on its own line.
It must be exactly this format.
Keep it all on one single line.
Do not put it in a code block.
Do not add extra explanation after it.

[LEAD_CAPTURED: name=<name or unknown>, email=<email>, phone=<phone or unknown>, preferred_time=<time or unknown>]

Style rules:

* Keep responses short: 1–2 sentences, MAXIMUM. This is a hard limit, not a guideline.
* Never write long paragraphs. Never use line breaks or blank lines within a reply — one short block of text only, like a single text message.
* Ask at most one question per message unless two questions are very quick and closely related.
* Do not stack questions like a form.
* Use contractions. and emojis
* Avoid corporate language like "I'd be happy to assist you."
* Avoid repeating the same opening phrase.
* Do not say "Great question" over and over.
* Sound confident but not pushy.
* do not repeat an answer back to the lead.
* Be helpful first, then guide toward the next step.
* If someone is vague, ask one simple clarifying question.
* If someone seems serious or urgent, move toward contact info sooner.

Real estate guardrails:

* Do not give legal, tax, or lending advice as fact. You can explain general concepts, but recommend talking to the right professional for specific legal, tax, financing, or contract advice.
* Do not promise that someone will qualify for a loan, get approved, sell for a certain amount, or win an offer.
* Do not provide exact home values without saying Toby would need the address, condition, updates, and comparable sales.
* Do not discuss protected classes or steer people based on race, religion, family status, disability, nationality, sex, or other protected categories.
* If someone asks if an area is "safe," "good," "bad," or "family-friendly," respond with objective guidance:
  "I can't label neighborhoods that way, but i have a few site you can check out for local data so you can decide what fits."
* If someone asks about schools, keep it factual and suggest they verify district info directly because boundaries can change. You can provide a couple related websites for them.
* If someone asks about crime, suggest checking local public crime maps or police department resources and provide a couple website sites like "crimespot".

North Carolina-specific notes:

* North Carolina is a buyer-beware state, so inspections and due diligence matter.
* In NC, buyers generally need a written buyer agency agreement before an agent can show homes unless the home is listed by that agent.
* Explain these points simply if relevant, but do not over-explain unless asked.

If someone asks about selling as-is:

* Explain that Toby works with traditional listings and also helps sellers who do not want to make repairs. He's even bought a few himself but can go over how that might work.
* Mention that some sellers may have options like listing as-is, doing light prep, or getting an investor-style offer, depending on their situation.
* Mention that most sellers dont understand that cash offers come with a heavy price tag that most dont like but then again some don't mind when they can be free of a headache.
* Do not guarantee a cash offer or a specific price. Toby doesn't use cash but you dont need to mention that. Buying or selling AS-is sounds more factual.

If someone asks for a home value:

* Ask for the property address first.
* Then ask one light follow-up about condition or updates.
* After that, naturally ask for email so Toby can follow up with a more accurate estimate.

If someone asks for listings:

* Ask what area, budget, and must-haves they're looking for, but do not ask all at once unless they are clearly ready.
* Since live MLS is not connected in this test, offer to have Toby send real options.

Special system notes:
If you receive a message starting with [SYSTEM NOTE], it is not from the visitor. Never mention the system note.

* [SYSTEM NOTE: quiet period 1]
  Send one casual, low-pressure nudge. Keep it short. Ask a simpler version of the last question or offer an easy next step.

* [SYSTEM NOTE: quiet period 2]
  Reference something specific from the conversation if possible. Try a different angle than your first nudge. Still just one short, casual line.

* [SYSTEM NOTE: quiet period 3 or higher]
  They've been quiet a while now. Wrap up warmly and let it go — e.g. something like "Alright, sounds good! Keep an eye out for my emails and let me know if you see anything you like 🙂" Vary the wording. Don't keep nudging forever — after this, only send something if there's a genuinely new, useful thing to mention.

Examples of good tone:

* "That's usually where people get tripped up — the inspection period is where you really learn what you're buying."
* "Yep, you can sell as-is. The bigger question is whether you'd net more by doing a few small things first."
* "I can get these notes over to Toby and he can send real options if you want."
* "What area are you hoping to stay in?"
* "Want Toby to take a look and send you some real numbers?"
* "What's the best email for him to send that to?\""""


def call_claude(messages):
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 500,
        "system": SYSTEM_PROMPT,
        "messages": messages,
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "content-type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
    )
    with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
        data = json.loads(resp.read())
    return data["content"][0]["text"]


def build_page(base_url):
    fallback_avatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42'%3E%3Ccircle cx='21' cy='21' r='21' fill='%230f2d4a'/%3E%3Ctext x='21' y='27' font-family='sans-serif' font-size='15' fill='white' text-anchor='middle' font-weight='700'%3ETR%3C/text%3E%3C/svg%3E"
    fallback_avatar_sm = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='14' fill='%230f2d4a'/%3E%3Ctext x='14' y='19' font-family='sans-serif' font-size='10' fill='white' text-anchor='middle' font-weight='700'%3ETR%3C/text%3E%3C/svg%3E"
    return f"""<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chat with Toby Russell</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{height:100%;overflow:hidden}}
body{{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  display:flex;flex-direction:column;background:#f0f2f5;
}}

/* ── Header ── */
#hdr{{
  background:linear-gradient(135deg,#0b2640 0%,#1a3c5e 100%);
  padding:12px 16px;
  display:flex;align-items:center;gap:12px;
  box-shadow:0 2px 8px rgba(0,0,0,.25);
  flex-shrink:0;
}}
#av{{
  width:44px;height:44px;border-radius:50%;
  border:2px solid rgba(255,255,255,.35);
  object-fit:cover;flex-shrink:0;background:#1a3c5e;
}}
#hdr-info{{flex:1;min-width:0}}
#hdr-name{{color:#fff;font-size:15px;font-weight:600;letter-spacing:.01em}}
#hdr-sub{{color:rgba(255,255,255,.72);font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
#dot{{display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%;margin-right:5px;vertical-align:middle;box-shadow:0 0 4px #4ade80}}

/* ── Chat area ── */
#chat{{
  flex:1;overflow-y:auto;padding:16px 12px;
  display:flex;flex-direction:column;gap:10px;
  scroll-behavior:smooth;
}}

/* ── Message rows ── */
.row{{display:flex;align-items:flex-end;gap:8px}}
.row.u{{flex-direction:row-reverse}}
.row-av{{
  width:28px;height:28px;border-radius:50%;
  object-fit:cover;flex-shrink:0;background:#1a3c5e;
}}
.bub{{
  padding:10px 14px;
  border-radius:18px;
  max-width:78%;
  font-size:14px;
  line-height:1.5;
  white-space:pre-wrap;
  word-break:break-word;
}}
.bub.b{{
  background:#fff;color:#1a1a1a;
  border-bottom-left-radius:4px;
  box-shadow:0 1px 3px rgba(0,0,0,.09);
}}
.bub.u{{
  background:#1a3c5e;color:#fff;
  border-bottom-right-radius:4px;
}}

/* ── Typing dots ── */
.dots{{display:flex;gap:5px;padding:12px 14px;background:#fff;border-radius:18px;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.09)}}
.dots span{{
  width:7px;height:7px;background:#bbb;border-radius:50%;
  animation:bounce 1.3s infinite ease-in-out;
}}
.dots span:nth-child(2){{animation-delay:.2s}}
.dots span:nth-child(3){{animation-delay:.4s}}
@keyframes bounce{{0%,60%,100%{{transform:translateY(0)}}30%{{transform:translateY(-7px)}}}}

/* ── Input bar ── */
#bar{{
  padding:10px 12px;background:#fff;
  border-top:1px solid #e5e7eb;
  display:flex;gap:8px;align-items:center;
  flex-shrink:0;
}}
#inp{{
  flex:1;padding:10px 16px;
  border:1.5px solid #e2e5ea;
  border-radius:24px;
  font-size:14px;font-family:inherit;
  outline:none;background:#f7f8fa;
  transition:border-color .15s,background .15s;
}}
#inp:focus{{border-color:#1a3c5e;background:#fff}}
#inp::placeholder{{color:#b0b7c3}}
#send{{
  width:40px;height:40px;border:none;
  background:#1a3c5e;color:#fff;
  border-radius:50%;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:background .15s,transform .1s;
}}
#send:hover{{background:#0b2640;transform:scale(1.07)}}
#send svg{{width:17px;height:17px}}
</style></head>
<body>

<div id="hdr">
  <img id="av" src="{base_url}/photo" alt="Toby"
       onerror="this.src='{fallback_avatar}'">
  <div id="hdr-info">
    <div id="hdr-name">Toby Russell</div>
    <div id="hdr-sub"><span id="dot"></span>NorthGroup Real Estate &middot; Triad NC</div>
  </div>
</div>

<div id="chat"></div>

<div id="bar">
  <input id="inp" placeholder="Ask me anything...">
  <button id="send" aria-label="Send">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  </button>
</div>

<script>
const CHAT_URL = '{base_url}/chat';
const chatEl = document.getElementById('chat');
const AVATAR = '{base_url}/photo';
const AVATAR_FB = "{fallback_avatar_sm}";
let history = [];

function makeAvatar() {{
  const img = document.createElement('img');
  img.className = 'row-av';
  img.src = AVATAR;
  img.alt = 'Toby';
  img.onerror = function(){{ this.src = AVATAR_FB; }};
  return img;
}}

function addMsg(role, text) {{
  const row = document.createElement('div');
  row.className = 'row' + (role === 'user' ? ' u' : '');
  if (role !== 'user') row.appendChild(makeAvatar());
  const bub = document.createElement('div');
  bub.className = 'bub ' + (role === 'user' ? 'u' : 'b');
  bub.textContent = text;
  row.appendChild(bub);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}}

function showTyping() {{
  const row = document.createElement('div');
  row.className = 'row'; row.id = 'typing';
  row.appendChild(makeAvatar());
  const d = document.createElement('div');
  d.className = 'dots';
  d.innerHTML = '<span></span><span></span><span></span>';
  row.appendChild(d);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}}
function hideTyping() {{
  const el = document.getElementById('typing');
  if (el) el.remove();
}}
function sleep(ms) {{ return new Promise(r => setTimeout(r, ms)); }}

let inactivityTimer = null, convoOver = false, quietCount = 0, awaitingReply = false;
function isPresent() {{ return document.visibilityState === 'visible' && document.hasFocus(); }}
function clearTimer() {{ if (inactivityTimer) {{ clearTimeout(inactivityTimer); inactivityTimer = null; }} }}
function armTimer() {{
  clearTimer();
  if (convoOver || !awaitingReply || !isPresent()) return;
  inactivityTimer = setTimeout(handleQuiet, 45000 + quietCount * 20000);
}}
document.addEventListener('visibilitychange', () => {{ if (isPresent()) armTimer(); else clearTimer(); }});
window.addEventListener('focus', armTimer);
window.addEventListener('blur', clearTimer);

async function handleQuiet() {{
  if (convoOver) return;
  quietCount++;
  const tmp = history.concat([{{role:'user', content:`[SYSTEM NOTE: quiet period ${{quietCount}}]`}}]);
  const r = await fetch(CHAT_URL, {{method:'POST', body:JSON.stringify({{messages:tmp}})}});
  const data = await r.json();
  const delay = Math.min(5000, 500 + data.reply.split(/\s+/).length * 160);
  showTyping(); await sleep(delay); hideTyping();
  addMsg('assistant', data.reply);
  history.push({{role:'assistant', content:data.raw}});
  awaitingReply = true; armTimer();
}}

async function send() {{
  const inp = document.getElementById('inp');
  const text = inp.value.trim();
  if (!text) return;
  clearTimer(); convoOver = false; quietCount = 0; awaitingReply = false;
  addMsg('user', text);
  history.push({{role:'user', content:text}});
  inp.value = '';
  const r = await fetch(CHAT_URL, {{method:'POST', body:JSON.stringify({{messages:history}})}});
  const data = await r.json();
  const delay = Math.min(5000, 500 + data.reply.split(/\s+/).length * 160);
  showTyping(); await sleep(delay); hideTyping();
  addMsg('assistant', data.reply);
  history.push({{role:'assistant', content:data.raw}});
  awaitingReply = true; armTimer();
}}

document.getElementById('send').onclick = send;
document.getElementById('inp').addEventListener('keydown', e => {{ if (e.key === 'Enter') send(); }});

// Context-aware greeting based on referring page
(function() {{
  const p = new URLSearchParams(location.search);
  const ref = (p.get('ref') || '').toLowerCase();
  const pt  = (p.get('ptitle') || '').toLowerCase();
  let greeting;
  if (ref.includes('sell') || ref.includes('list') || pt.includes('sell') || pt.includes('list')) {{
    greeting = "Hey! Thinking about selling? I can walk you through your options — listing, as-is, or somewhere in between. What's the situation? 🏠";
  }} else if (ref.includes('buy') || ref.includes('search') || ref.includes('homes-for-sale') || pt.includes('buy') || pt.includes('search') || pt.includes('listing')) {{
    greeting = "Hey! Looking for homes in the Triad? I can help narrow things down. What area and price range are you working with? 🏡";
  }} else if (ref.includes('reloc') || ref.includes('moving') || pt.includes('reloc') || pt.includes('moving')) {{
    greeting = "Hey! Moving to the area? I can help you get a feel for the map — commute, neighborhoods, budget, all of it. Where are you coming from? 🗺️";
  }} else if (ref.includes('contact') || ref.includes('about') || pt.includes('contact') || pt.includes('about')) {{
    greeting = "Hey! Want to connect with Toby directly? Drop your info and I'll make sure he reaches out fast 👋";
  }} else if (ref.includes('invest') || ref.includes('cash') || ref.includes('as-is') || pt.includes('invest') || pt.includes('cash')) {{
    greeting = "Hey! Looking at investment options or an as-is sale? Toby works both sides of that — happy to explain how it works. What's the property situation?";
  }} else if (ref.includes('blog') || ref.includes('area') || ref.includes('community') || ref.includes('neighborhood') || pt.includes('guide') || pt.includes('area')) {{
    greeting = "Hey! Reading up on the area? Smart move. I can answer specifics about any town, commute, or neighborhood you're curious about 🗺️";
  }} else {{
    greeting = "Hey! I'm Toby's assistant. Whether you're buying, selling, or just exploring the Triad market — I'm here to help. What's on your mind?";
  }}
  addMsg('assistant', greeting);
}})();
</script>
</body></html>"""


def build_listing_page(base_url):
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>123 Maple Ridge Ct — listing demo</title>
<style>
*{{box-sizing:border-box}}
body{{font-family:system-ui,sans-serif;margin:0;background:#fafafa;color:#222}}
.wrap{{max-width:760px;margin:0 auto;padding:0 16px 60px}}
.gallery{{position:relative;background:#000}}
.gallery img{{width:100%;display:block;aspect-ratio:16/10;object-fit:cover}}
.gallery .nav{{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.45);color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:18px;cursor:pointer}}
.gallery .prev{{left:10px}} .gallery .next{{right:10px}}
.dots{{display:flex;justify-content:center;gap:6px;padding:10px 0}}
.dots span{{width:7px;height:7px;border-radius:50%;background:#ccc}}
.dots span.active{{background:#0a7cff}}
h1{{font-size:22px;margin:18px 0 4px}}
.price{{font-size:20px;color:#0a7cff;font-weight:600;margin-bottom:6px}}
.meta{{color:#666;margin-bottom:16px}}
.section{{margin:18px 0;line-height:1.5}}

/* floating chat widget */
#bubble{{position:fixed;bottom:18px;right:18px;width:56px;height:56px;border-radius:50%;background:#0a7cff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;z-index:1000;border:none;transition:transform .15s}}
#bubble:hover{{transform:scale(1.06)}}
#bubble.hidden{{display:none}}
#widget{{position:fixed;bottom:18px;right:18px;width:340px;max-width:calc(100vw - 24px);height:480px;max-height:70vh;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:1000}}
#widget.open{{display:flex}}
#wHeader{{background:#0a7cff;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:600}}
#wHeader button{{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1}}
#wChat{{flex:1;overflow-y:auto;padding:12px;background:#f5f5f5}}
.msg{{margin:6px 0;padding:8px 11px;border-radius:10px;max-width:82%;font-size:14px;white-space:pre-wrap;line-height:1.35}}
.user{{background:#0a7cff;color:#fff;margin-left:auto;text-align:right}}
.bot{{background:#eee}}
#wRow{{display:flex;border-top:1px solid #eee;padding:8px;gap:6px;background:#fff}}
#wInp{{flex:1;padding:9px 10px;border:1px solid #ddd;border-radius:8px;font-size:14px;min-width:0}}
#wSend{{padding:9px 13px;border:none;background:#0a7cff;color:#fff;border-radius:8px;cursor:pointer;font-size:14px}}
#wLead{{font-size:11px;color:#888;padding:4px 10px;display:none}}

@media (max-width:480px){{
  #widget{{left:8px;right:8px;bottom:8px;width:auto;max-width:none;height:62vh}}
  #bubble{{bottom:14px;right:14px}}
}}
</style></head>
<body>
<div class="wrap">
  <div class="gallery">
    <img id="photo" src="" alt="listing photo">
    <button class="nav prev" onclick="prevPhoto()">&#8249;</button>
    <button class="nav next" onclick="nextPhoto()">&#8250;</button>
  </div>
  <div class="dots" id="dots"></div>
  <h1>123 Maple Ridge Ct, Lexington, NC</h1>
  <div class="price">$329,900</div>
  <div class="meta">3 bed · 2 bath · 1.1 acres · 1,840 sqft</div>
  <div class="section">Charming brick ranch tucked at the end of a quiet cul-de-sac, with a fully fenced backyard and a detached workshop. Updated kitchen with granite counters, hardwood floors throughout the main living areas.</div>
  <div class="section">This is a demo listing page used to test the chat widget's photo-triggered popup — not a real listing.</div>
</div>

<button id="bubble" onclick="openWidget()">💬</button>
<div id="widget">
  <div id="wHeader"><span>Chat with Toby's team</span><button onclick="closeWidget()">&times;</button></div>
  <div id="wChat"></div>
  <div id="wLead"></div>
  <div id="wRow"><input id="wInp" placeholder="Ask a question..."><button id="wSend">Send</button></div>
</div>

<script>
const CHAT_URL = '{base_url}/chat';

// ---- photo gallery ----
const photos = [1,2,3,4,5].map(n => `https://picsum.photos/seed/listing${{n}}/900/560`);
let idx = 0;
const photoEl = document.getElementById('photo');
const dotsEl = document.getElementById('dots');
const viewedPhotos = new Set();

function renderDots(){{
  dotsEl.innerHTML = '';
  photos.forEach((_, i) => {{
    const s = document.createElement('span');
    if(i === idx) s.className = 'active';
    dotsEl.appendChild(s);
  }});
}}
function showPhoto(){{
  photoEl.src = photos[idx];
  renderDots();
  viewedPhotos.add(idx);
  maybeTriggerWidget();
}}
function nextPhoto(){{ idx = (idx + 1) % photos.length; showPhoto(); }}
function prevPhoto(){{ idx = (idx - 1 + photos.length) % photos.length; showPhoto(); }}

// ---- popup trigger: open automatically once they've viewed 4 distinct photos ----
const TRIGGER_AT = 4;
let autoTriggered = false;
let widgetManuallyClosed = false;
function maybeTriggerWidget(){{
  if(autoTriggered || widgetManuallyClosed) return;
  if(viewedPhotos.size >= TRIGGER_AT){{
    autoTriggered = true;
    openWidget();
  }}
}}

showPhoto();

// ---- widget open/close ----
const bubble = document.getElementById('bubble');
const widget = document.getElementById('widget');
function openWidget(){{
  widget.classList.add('open');
  bubble.classList.add('hidden');
  if(!chatStarted) startChat();
}}
function closeWidget(){{
  widget.classList.remove('open');
  bubble.classList.remove('hidden');
  widgetManuallyClosed = true;
}}

// ---- chat logic ----
const wChat = document.getElementById('wChat');
const wLead = document.getElementById('wLead');
let history = [];
let chatStarted = false;

function addMsg(role, text){{
  const d = document.createElement('div');
  d.className = 'msg ' + (role==='user'?'user':'bot');
  d.textContent = text;
  wChat.appendChild(d);
  wChat.scrollTop = wChat.scrollHeight;
}}
function sleep(ms){{ return new Promise(r => setTimeout(r, ms)); }}
let inactivityTimer = null, convoOver = false, quietCount = 0, awaitingReply = false;
function isPresent(){{ return document.visibilityState === 'visible' && document.hasFocus(); }}
function clearInactivityTimer(){{ if(inactivityTimer){{ clearTimeout(inactivityTimer); inactivityTimer = null; }} }}
function armInactivityTimer(){{
  clearInactivityTimer();
  if(convoOver || !awaitingReply || !widget.classList.contains('open')) return;
  if(!isPresent()) return;
  const delay = 45000 + quietCount * 20000;
  inactivityTimer = setTimeout(handleQuiet, delay);
}}
document.addEventListener('visibilitychange', () => {{ if(isPresent()) armInactivityTimer(); else clearInactivityTimer(); }});
window.addEventListener('focus', () => armInactivityTimer());
window.addEventListener('blur', () => clearInactivityTimer());

async function handleQuiet(){{
  if(convoOver) return;
  quietCount += 1;
  const note = `[SYSTEM NOTE: quiet period ${{quietCount}}]`;
  const tempHistory = history.concat([{{role:'user', content: note}}]);
  const r = await fetch(CHAT_URL, {{method:'POST', body: JSON.stringify({{messages: tempHistory}})}});
  const data = await r.json();
  await typingDelay(data.reply);
  addMsg('assistant', data.reply);
  history.push({{role:'assistant', content: data.raw}});
  awaitingReply = true;
  armInactivityTimer();
}}
function showTyping(){{
  const d = document.createElement('div');
  d.className = 'msg bot'; d.id = 'wTyping'; d.textContent = '...';
  wChat.appendChild(d); wChat.scrollTop = wChat.scrollHeight;
}}
function hideTyping(){{ const d = document.getElementById('wTyping'); if(d) d.remove(); }}
async function typingDelay(replyText){{
  const words = replyText.split(/\s+/).length;
  const delayMs = Math.min(6000, 600 + words * 180 + Math.random() * 400);
  showTyping();
  await sleep(delayMs);
  hideTyping();
}}

async function sendMsg(){{
  const inp = document.getElementById('wInp');
  const text = inp.value.trim();
  if(!text) return;
  clearInactivityTimer(); convoOver = false; quietCount = 0; awaitingReply = false;
  addMsg('user', text);
  history.push({{role:'user', content:text}});
  inp.value = '';
  const r = await fetch(CHAT_URL, {{method:'POST', body: JSON.stringify({{messages: history}})}});
  const data = await r.json();
  await typingDelay(data.reply);
  addMsg('assistant', data.reply);
  history.push({{role:'assistant', content: data.raw}});
  if(data.lead){{
    wLead.style.display = 'block';
    wLead.textContent = '✅ Lead captured: ' + JSON.stringify(data.lead);
  }}
  awaitingReply = true;
  armInactivityTimer();
}}
document.getElementById('wSend').onclick = sendMsg;
document.getElementById('wInp').addEventListener('keydown', e=>{{ if(e.key==='Enter') sendMsg(); }});

function startChat(){{
  chatStarted = true;
  addMsg('assistant', "Hey! Noticed you checking out this one — happy to answer anything about it or the area 🙂");
  awaitingReply = true;
  armInactivityTimer();
}}
</script>
</body></html>"""


def parse_lead(text):
    marker = "[LEAD_CAPTURED:"
    if marker not in text:
        return text, None
    start = text.index(marker)
    end = text.index("]", start)
    inner = text[start + len(marker):end].strip()
    display_text = (text[:start] + text[end + 1:]).strip()
    lead = {}
    for part in inner.split(","):
        if "=" in part:
            k, v = part.split("=", 1)
            lead[k.strip()] = v.strip()
    return display_text, lead


def build_widget_js(base_url):
    return f"""
(function() {{
  var S = "{base_url}";
  var FB_AV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%230f2d4a'/%3E%3Ctext x='30' y='38' font-family='sans-serif' font-size='20' fill='white' text-anchor='middle' font-weight='700'%3ETR%3C/text%3E%3C/svg%3E";

  /* ── Styles ────────────────────────────────────────── */
  var css = [
    /* Bubble */
    "#tcb{{position:fixed;bottom:24px;right:24px;width:62px;height:62px;border-radius:50%;cursor:pointer;z-index:99998;border:none;padding:0;background:#1a3c5e;",
    "box-shadow:0 4px 18px rgba(0,0,0,.38);transition:transform .2s,box-shadow .2s;overflow:visible}}",
    "#tcb:hover{{transform:scale(1.07);box-shadow:0 6px 24px rgba(0,0,0,.45)}}",

    /* Photo inside bubble */
    "#tcb .tcb-photo{{width:62px;height:62px;border-radius:50%;object-fit:cover;display:block;",
    "transition:opacity .2s,transform .2s;border:2px solid rgba(255,255,255,.25)}}",

    /* X icon (shown when open) */
    "#tcb .tcb-x{{position:absolute;top:0;left:0;width:62px;height:62px;border-radius:50%;",
    "background:#1a3c5e;display:flex;align-items:center;justify-content:center;",
    "color:#fff;font-size:26px;font-weight:200;opacity:0;transition:opacity .2s;pointer-events:none;font-family:sans-serif}}",
    "#tcb.open .tcb-photo{{opacity:0;transform:scale(.7)}}",
    "#tcb.open .tcb-x{{opacity:1;pointer-events:auto}}",

    /* Notification badge */
    "#tcb-badge{{position:absolute;top:-1px;right:-1px;width:17px;height:17px;",
    "background:#ef4444;border-radius:50%;border:2.5px solid #fff;",
    "animation:tcb-pulse 1.8s ease-in-out 4;z-index:1}}",
    "@keyframes tcb-pulse{{0%,100%{{transform:scale(1)}}50%{{transform:scale(1.35)}}}}",

    /* Frame wrapper */
    "#tcw{{position:fixed;bottom:100px;right:24px;width:380px;max-width:calc(100vw - 32px);",
    "height:580px;max-height:calc(100vh - 120px);border-radius:20px;",
    "box-shadow:0 12px 48px rgba(0,0,0,.22);overflow:hidden;background:#fff;",
    "z-index:99999;display:none;opacity:0;transform:translateY(16px) scale(.97);",
    "transition:opacity .22s ease,transform .22s ease}}",
    "#tcw.open{{opacity:1;transform:translateY(0) scale(1)}}",
    "#tcw iframe{{width:100%;height:100%;border:none;display:block}}",

    /* Mobile */
    "@media(max-width:460px){{",
    "#tcw{{bottom:0;right:0;left:0;width:100%;max-width:none;height:100vh;max-height:none;border-radius:0}}",
    "#tcb{{bottom:16px;right:16px}}}}"
  ].join("");

  var s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);

  /* ── Bubble ──────────────────────────────────────── */
  var bubble = document.createElement("button");
  bubble.id = "tcb";
  bubble.setAttribute("aria-label", "Chat with Toby");
  bubble.innerHTML =
    '<img class="tcb-photo" src="' + S + '/photo" alt="Toby">' +
    '<span class="tcb-x" aria-hidden="true">&#x2715;</span>' +
    '<span id="tcb-badge" title="New message"></span>';
  bubble.querySelector('.tcb-photo').onerror = function() {{ this.onerror = null; this.src = FB_AV; }};
  document.body.appendChild(bubble);

  /* Remove badge after its animation */
  setTimeout(function() {{
    var b = document.getElementById("tcb-badge");
    if (b) b.style.display = "none";
  }}, 8000);

  /* ── Frame wrapper ───────────────────────────────── */
  var wrap = document.createElement("div");
  wrap.id = "tcw";
  var frame = document.createElement("iframe");
  frame.title = "Chat with Toby Russell";
  frame.allow = "microphone";
  wrap.appendChild(frame);
  document.body.appendChild(wrap);

  var isOpen = false;

  function openChat() {{
    if (!frame.src) frame.src = S + "?ref=" + encodeURIComponent(location.href) + "&ptitle=" + encodeURIComponent(document.title.slice(0, 120));
    wrap.style.display = "block";
    requestAnimationFrame(function() {{
      requestAnimationFrame(function() {{ wrap.classList.add("open"); }});
    }});
    bubble.classList.add("open");
    isOpen = true;
  }}

  function closeChat() {{
    wrap.classList.remove("open");
    bubble.classList.remove("open");
    setTimeout(function() {{ if (!isOpen) wrap.style.display = "none"; }}, 240);
    isOpen = false;
  }}

  bubble.addEventListener("click", function() {{ isOpen ? closeChat() : openChat(); }});

  /* ── Photo-click trigger (4 images) ─────────────── */
  var photoCount = 0, autoOpened = false;
  document.addEventListener("click", function(e) {{
    if (autoOpened || isOpen) return;
    if (e.target.tagName === "IMG" && !e.target.closest("#tcw")) {{
      if (++photoCount >= 4) {{ openChat(); autoOpened = true; }}
    }}
  }});

  /* ── Inactivity nudge ────────────────────────────── */
  /* ── Auto-open after 18s — fires regardless of activity ── */
  setTimeout(function() {{
    if (!isOpen) openChat();
  }}, 18000);
}})();
""".strip()


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, body, ctype="text/html"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body.encode())

    def do_OPTIONS(self):
        self._send(200, "")

    def do_GET(self):
        path = self.path.split("?")[0]  # strip query string before routing
        if path == "/":
            self._send(200, build_page(BASE_URL))
        elif path == "/listing":
            self._send(200, build_listing_page(BASE_URL))
        elif path == "/widget.js":
            self._send(200, build_widget_js(BASE_URL), "application/javascript")
        elif path == "/photo":
            self.send_response(302)
            self.send_header("Location", "https://d2td4dobkk213c.cloudfront.net/northgrouprealestateinc2557/profiles/2557_1084842.png")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
        else:
            self._send(404, "not found")

    def do_POST(self):
        if self.path == "/chat":
            length = int(self.headers["Content-Length"])
            payload = json.loads(self.rfile.read(length))
            messages = payload["messages"]
            raw = call_claude(messages)
            display_text, lead = parse_lead(raw)
            self._send(200, json.dumps({"reply": display_text, "raw": raw, "lead": lead}), "application/json")
        else:
            self._send(404, "not found")

    def log_message(self, format, *args):
        pass  # suppress per-request console spam


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    print(f"Open http://localhost:{port} in your browser")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
