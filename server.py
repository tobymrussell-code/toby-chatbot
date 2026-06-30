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
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Chatbot test</title>
<style>
body{{font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;background:#f5f5f5}}
#chat{{background:#fff;border-radius:12px;padding:16px;height:480px;overflow-y:auto;box-shadow:0 1px 4px rgba(0,0,0,.1)}}
.msg{{margin:8px 0;padding:8px 12px;border-radius:10px;max-width:80%;white-space:pre-wrap}}
.user{{background:#0a7cff;color:#fff;margin-left:auto;text-align:right}}
.bot{{background:#eee}}
#row{{display:flex;margin-top:10px;gap:8px}}
#inp{{flex:1;padding:10px;border:1px solid #ccc;border-radius:8px}}
#send{{padding:10px 16px;border:none;background:#0a7cff;color:#fff;border-radius:8px;cursor:pointer}}
#lead{{margin-top:12px;padding:10px;background:#fffbe6;border:1px solid #f0d000;border-radius:8px;display:none;font-size:14px}}
</style></head>
<body>
<h3>Real Estate Chatbot — local test</h3>
<div id="chat"></div>
<div id="row"><input id="inp" placeholder="Ask a question..."><button id="send">Send</button></div>
<div id="lead"></div>
<script>
const CHAT_URL = '{base_url}/chat';
const chat = document.getElementById('chat');
const lead = document.getElementById('lead');
let history = [];

function addMsg(role, text){{
  const d = document.createElement('div');
  d.className = 'msg ' + (role==='user'?'user':'bot');
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}}

function sleep(ms){{ return new Promise(r => setTimeout(r, ms)); }}
let inactivityTimer = null;
let convoOver = false;
let quietCount = 0;
let awaitingReply = false;

function isPresent(){{
  return document.visibilityState === 'visible' && document.hasFocus();
}}

function clearInactivityTimer(){{
  if(inactivityTimer){{ clearTimeout(inactivityTimer); inactivityTimer = null; }}
}}

function armInactivityTimer(){{
  clearInactivityTimer();
  if(convoOver || !awaitingReply) return;
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
  const words = data.reply.split(/\s+/).length;
  const delayMs = Math.min(6000, 600 + words * 180 + Math.random() * 400);
  showTyping();
  await sleep(delayMs);
  hideTyping();
  addMsg('assistant', data.reply);
  history.push({{role:'assistant', content: data.raw}});
  awaitingReply = true;
  armInactivityTimer();
}}

function showTyping(){{
  const d = document.createElement('div');
  d.className = 'msg bot';
  d.id = 'typing';
  d.textContent = '...';
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}}
function hideTyping(){{
  const d = document.getElementById('typing');
  if(d) d.remove();
}}

async function send(){{
  const inp = document.getElementById('inp');
  const text = inp.value.trim();
  if(!text) return;
  clearInactivityTimer();
  convoOver = false;
  quietCount = 0;
  awaitingReply = false;
  addMsg('user', text);
  history.push({{role:'user', content:text}});
  inp.value = '';

  const r = await fetch(CHAT_URL, {{method:'POST', body: JSON.stringify({{messages: history}})}});
  const data = await r.json();

  const words = data.reply.split(/\s+/).length;
  const delayMs = Math.min(6000, 600 + words * 180 + Math.random() * 400);

  showTyping();
  await sleep(delayMs);
  hideTyping();

  addMsg('assistant', data.reply);
  history.push({{role:'assistant', content: data.raw}});
  if(data.lead){{
    lead.style.display = 'block';
    lead.textContent = '✅ Lead captured: ' + JSON.stringify(data.lead);
  }}
  awaitingReply = true;
  armInactivityTimer();
}}

document.getElementById('send').onclick = send;
document.getElementById('inp').addEventListener('keydown', e=>{{ if(e.key==='Enter') send(); }});
addMsg('assistant', "Hi! I'm here to help with any questions about buying or selling a home, or homes for sale. What can I help with?");
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
        if self.path == "/":
            self._send(200, build_page(BASE_URL))
        elif self.path == "/listing":
            self._send(200, build_listing_page(BASE_URL))
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
