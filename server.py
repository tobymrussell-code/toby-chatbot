import json
import os
import ssl
import urllib.request
import certifi
from http.server import BaseHTTPRequestHandler, HTTPServer

SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
BASE_URL = os.environ.get("BASE_URL", "")
PORT = int(os.environ.get("PORT", 8765))

SYSTEM_PROMPT = """You are the website chat assistant for Toby Russell, a real estate agent with NorthGroup Real Estate in the Triad / Davidson County area of North Carolina.

You write in Toby's voice: casual, helpful, plainspoken, friendly, and a little conversational at times— like a real person texting back. Do not sound like a corporate chatbot.

You are not literally Toby typing live. Do not pretend to be Toby if directly asked. If asked whether you are a bot, AI, or the real Toby, answer covertly like:
"I'm Toby's website assistant, I'm about as real as things get these days.. are you real lol"

Your job, in priority order:

1. Help buyers and sellers understand the real estate process in simple language.
   You can explain things and how things work like:
   * Buying a home, Selling a home, Offers, Due diligence, Earnest money, Inspections, Appraisals
   * Contingencies, Closing timelines, Buyer agency, Listing prep, Pricing strategy
   * As-is selling 80/20 rule, Relocation questions, General Triad / Davidson County area questions

2. Answer general homes-for-sale questions.
   Always keep fair housing laws in mind — never label an area as safe/unsafe directly. If asked, say:
   "I can't label neighborhoods that way, but I have a few sites you can check for local data so you can decide what fits."
   Then naturally ask one simple follow-up about what they're looking for.

3. Take notes through the whole conversation so Toby can reference them later for follow-up.

4. Help narrow down what people are looking for and the reasons behind their priorities (big backyard, school zone, commute, etc.). Ask one simple follow-up question to continue the conversation.

5. Capture real leads naturally.
   Do NOT ask for contact info immediately. Only move toward it when the visitor clearly wants help finding a listing, asks for a showing, asks about selling, wants a home value, or asks to be contacted.

After being helpful, casually work toward getting:
* Phone number FIRST (especially for sellers — Toby needs to schedule a visit)
* Name
* Email
* Preferred time to talk

Use soft casual wording like:
"What's the best number for him to text or call?"
"Want to drop your phone too, or would email work better?"
"No worries — what's a good email then?"
"Want Toby to send you a few real options?"

If they give phone but no email, keep going — try to get email naturally later but don't block on it.
Once you have at least an email, acknowledge it naturally and include the lead capture line on its own line, exactly this format, one line only, no code block:

[LEAD_CAPTURED: name=<name or unknown>, email=<email>, phone=<phone or unknown>, preferred_time=<time or unknown>]

Style rules:
* 1-2 sentences MAX per reply. Hard limit. One short text-message-style block, no line breaks inside.
* Ask at most 1 question per message (2 only if very quick and closely related).
* Use contractions and emojis naturally.
* No corporate language. No "I'd be happy to assist."
* Don't repeat opening phrases. Don't say "Great question" repeatedly.
* Vary how you start messages — sometimes just dive in, sometimes a quick reaction.
* Be helpful first, then guide to next step. If vague, ask one clarifying question.
* If someone seems urgent or serious, move toward contact info sooner.

Real estate guardrails:
* No legal, tax, or lending advice as fact — recommend the right professional.
* Don't promise loan approval, offer wins, or specific sale prices.
* Don't give exact home values — say Toby needs address, condition, updates, and comps.
* No steering based on protected classes (race, religion, family status, disability, sex, etc.).
* Schools: keep factual, suggest verifying district boundaries directly (they change). Offer related websites.
* Crime: suggest checking local police department resources or sites like crimespot.com.

NC-specific notes:
* NC is a buyer-beware state — inspections and due diligence matter a lot.
* Buyers generally need a written buyer agency agreement before an agent can show homes (unless listed by that agent).
* Mention these only if relevant, don't over-explain.

If someone asks about selling as-is:
* Toby works traditional listings AND helps sellers who don't want to make repairs — he's bought a few himself.
* Options include listing as-is, doing light prep, or an investor-style offer depending on their situation.
* Most sellers don't realize cash offers come with a heavy discount — some mind, some don't.
* Don't guarantee a cash offer or specific price.

If someone asks for a home value:
* Ask for the address first.
* Ask one light follow-up about condition or updates.
* Then naturally ask for email so Toby can follow up with a real estimate.

If someone asks for listings:
* Ask area, budget, and must-haves — but not all at once.
* Since live MLS is not connected yet, offer to have Toby send real options.

Special system notes — if a message starts with [SYSTEM NOTE] it is NOT from the visitor, never mention it:
* [SYSTEM NOTE: quiet period 1] — send one casual low-pressure nudge, short, simpler version of last question or easy next step.
* [SYSTEM NOTE: quiet period 2] — reference something specific from the conversation, different angle from first nudge, one short line.
* [SYSTEM NOTE: quiet period 3 or higher] — wrap up warmly and let it go. Vary the wording. Stop nudging after this.

Good tone examples:
* "That's usually where people get tripped up — the inspection period is where you really learn what you're buying."
* "Yep, you can sell as-is. The bigger question is whether you'd net more by doing a few small things first."
* "What area are you hoping to stay in?"
* "Want Toby to take a look and send you some real numbers?"
* "What's the best email for him to send that to?\""""


def get_greeting():
    body = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 60,
        "system": "You are Toby Russell's website chat assistant (NorthGroup Real Estate, Triad NC). Write ONE very short casual opening message — like a quick text from a friendly agent. Under 12 words. Vary it every time. No emoji required but fine if natural.",
        "messages": [{"role": "user", "content": "Generate a fresh opening greeting. Never repeat the same one."}],
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={"content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
    )
    with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
        data = json.loads(resp.read())
    return data["content"][0]["text"].strip()


def call_claude(messages):
    body = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": 500,
        "system": SYSTEM_PROMPT,
        "messages": messages,
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={"content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
    )
    with urllib.request.urlopen(req, context=SSL_CONTEXT) as resp:
        data = json.loads(resp.read())
    return data["content"][0]["text"]


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


def build_chat_page(base_url, ref="", ptitle="", generic=False):
    if generic or (not ref and not ptitle):
        greetings = [
            "Hey! Buying, selling, or just checking out the market? 👋",
            "Hey there! What can I help you figure out today? 😊",
            "Hey! Just browsing or is there something specific I can help with? 🙂",
        ]
        import time
        greeting = greetings[int(time.time()) % len(greetings)]
    elif any(x in ref.lower() + ptitle.lower() for x in ["sell", "list"]):
        greeting = "Hey! Thinking about selling? I can walk you through your options — listing, as-is, or somewhere in between. What's the situation? 🏠"
    elif any(x in ref.lower() + ptitle.lower() for x in ["buy", "search", "homes-for-sale", "listing"]):
        greeting = "Hey! Looking for homes in the Triad? I can help narrow things down. What area and price range are you working with? 🏡"
    elif any(x in ref.lower() + ptitle.lower() for x in ["reloc", "moving"]):
        greeting = "Hey! Moving to the area? I can help you get a feel for the map — commute, neighborhoods, budget, all of it. Where are you coming from? 🗺️"
    elif any(x in ref.lower() + ptitle.lower() for x in ["invest", "cash", "as-is"]):
        greeting = "Hey! Looking at investment options or an as-is sale? Toby works both sides of that — happy to explain how it works. What's the property situation?"
    else:
        greeting = "Hey! I'm Toby's assistant. Whether you're buying, selling, or just exploring the Triad market — what's on your mind?"

    seed_history = ""
    if ref or ptitle:
        import json as _json
        seed_history = f"history.push({{role:'user',content:'[SYSTEM NOTE: visitor is viewing page {_json.dumps(ref)} titled {_json.dumps(ptitle)}. After 1-2 exchanges you can gently bring up relevant topics if they haven\\'t come up. Don\\'t force it.]'}});history.push({{role:'assistant',content:{_json.dumps(greeting)}}});"

    return f"""<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chat with Toby Russell</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}}
body{{display:flex;flex-direction:column;background:#f0f2f5}}
#hdr{{background:linear-gradient(135deg,#0b2640 0%,#1a3c5e 100%);padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.25);flex-shrink:0}}
#av{{width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.35);object-fit:cover;flex-shrink:0;background:#1a3c5e}}
#hdr-info{{flex:1;min-width:0}}
#hdr-name{{color:#fff;font-size:15px;font-weight:600}}
#hdr-sub{{color:rgba(255,255,255,.72);font-size:12px;margin-top:2px}}
.dot{{display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%;margin-right:5px;vertical-align:middle}}
#chat{{flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:10px}}
.row{{display:flex;align-items:flex-end;gap:8px}}
.row.u{{flex-direction:row-reverse}}
.rav{{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#1a3c5e}}
.bub{{padding:10px 14px;border-radius:18px;max-width:78%;font-size:14px;line-height:1.5;word-break:break-word}}
.bub.b{{background:#fff;color:#1a1a1a;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.09)}}
.bub.u{{background:#1a3c5e;color:#fff;border-bottom-right-radius:4px}}
.dots{{display:flex;gap:5px;padding:12px 14px;background:#fff;border-radius:18px;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.09)}}
.dots span{{width:7px;height:7px;background:#bbb;border-radius:50%;animation:bounce 1.3s infinite ease-in-out}}
.dots span:nth-child(2){{animation-delay:.2s}}.dots span:nth-child(3){{animation-delay:.4s}}
@keyframes bounce{{0%,60%,100%{{transform:translateY(0)}}30%{{transform:translateY(-7px)}}}}
#bar{{padding:10px 12px;background:#fff;border-top:1px solid #e5e7eb;display:flex;gap:8px;align-items:center;flex-shrink:0}}
#inp{{flex:1;padding:10px 16px;border:1.5px solid #e2e5ea;border-radius:24px;font-size:14px;font-family:inherit;outline:none;background:#f7f8fa;transition:border-color .15s}}
#inp:focus{{border-color:#1a3c5e;background:#fff}}
#send{{width:40px;height:40px;border:none;background:#1a3c5e;color:#fff;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .1s}}
#send:hover{{background:#0b2640;transform:scale(1.07)}}
</style></head><body>
<div id="hdr">
  <img id="av" src="{base_url}/photo" alt="Toby" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22%3E%3Ccircle cx=%2222%22 cy=%2222%22 r=%2222%22 fill=%22%230f2d4a%22/%3E%3Ctext x=%2222%22 y=%2228%22 font-family=%22sans-serif%22 font-size=%2213%22 fill=%22white%22 text-anchor=%22middle%22 font-weight=%22700%22%3ETR%3C/text%3E%3C/svg%3E'">
  <div id="hdr-info">
    <div id="hdr-name">Toby Russell</div>
    <div id="hdr-sub"><span class="dot"></span>NorthGroup Real Estate &middot; Triad NC</div>
  </div>
</div>
<div id="chat"></div>
<div id="bar">
  <input id="inp" placeholder="Ask me anything...">
  <button id="send" aria-label="Send">
    <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  </button>
</div>
<script>
const BASE = '{base_url}';
const chatEl = document.getElementById('chat');
let history = [];
{seed_history}

function av(){{
  const img=document.createElement('img');img.className='rav';
  img.src=BASE+'/photo';img.alt='Toby';
  img.onerror=function(){{this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2228%22 height=%2228%22%3E%3Ccircle cx=%2214%22 cy=%2214%22 r=%2214%22 fill=%22%230f2d4a%22/%3E%3Ctext x=%2214%22 y=%2219%22 font-family=%22sans-serif%22 font-size=%2210%22 fill=%22white%22 text-anchor=%22middle%22%3ETR%3C/text%3E%3C/svg%3E';}};
  return img;
}}
function addMsg(role,text){{
  const row=document.createElement('div');row.className='row'+(role==='user'?' u':'');
  if(role!=='user')row.appendChild(av());
  const b=document.createElement('div');b.className='bub '+(role==='user'?'u':'b');b.textContent=text;
  row.appendChild(b);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;
}}
function showTyping(){{
  const row=document.createElement('div');row.className='row';row.id='typ';row.appendChild(av());
  const d=document.createElement('div');d.className='dots';d.innerHTML='<span></span><span></span><span></span>';
  row.appendChild(d);chatEl.appendChild(row);chatEl.scrollTop=chatEl.scrollHeight;
}}
function hideTyping(){{const e=document.getElementById('typ');if(e)e.remove();}}
function sleep(ms){{return new Promise(r=>setTimeout(r,ms));}}

let timer=null,convoOver=false,quietCount=0,awaitingReply=false;
function present(){{return document.visibilityState==='visible'&&document.hasFocus();}}
function clearT(){{if(timer){{clearTimeout(timer);timer=null;}}}}
function armT(){{
  clearT();
  if(convoOver||!awaitingReply||!present())return;
  timer=setTimeout(handleQuiet,45000+quietCount*20000);
}}
document.addEventListener('visibilitychange',()=>{{present()?armT():clearT();}});
window.addEventListener('focus',armT);window.addEventListener('blur',clearT);

async function handleQuiet(){{
  if(convoOver)return;
  quietCount++;
  const tmp=history.concat([{{role:'user',content:`[SYSTEM NOTE: quiet period ${{quietCount}}]`}}]);
  const r=await fetch(BASE+'/chat',{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{messages:tmp}})}});
  const d=await r.json();
  const delay=Math.min(5000,500+d.reply.split(/\s+/).length*160);
  showTyping();await sleep(delay);hideTyping();
  addMsg('assistant',d.reply);history.push({{role:'assistant',content:d.raw}});
  awaitingReply=true;armT();
}}
async function send(){{
  const inp=document.getElementById('inp');
  const text=inp.value.trim();if(!text)return;
  clearT();convoOver=false;quietCount=0;awaitingReply=false;
  addMsg('user',text);history.push({{role:'user',content:text}});inp.value='';
  const r=await fetch(BASE+'/chat',{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{messages:history}})}});
  const d=await r.json();
  const delay=Math.min(5000,500+d.reply.split(/\s+/).length*160);
  showTyping();await sleep(delay);hideTyping();
  addMsg('assistant',d.reply);history.push({{role:'assistant',content:d.raw}});
  awaitingReply=true;armT();
}}
document.getElementById('send').onclick=send;
document.getElementById('inp').addEventListener('keydown',e=>{{if(e.key==='Enter')send();}});
addMsg('assistant',{json.dumps(greeting)});
awaitingReply=true;armT();
</script></body></html>"""


def build_widget_js(base_url):
    return """(function(){
  if(window.__tcbLoaded)return;window.__tcbLoaded=true;
  var S='""" + base_url + """';
  var FB='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2262%22 height=%2262%22%3E%3Ccircle cx=%2231%22 cy=%2231%22 r=%2231%22 fill=%22%230f2d4a%22/%3E%3Ctext x=%2231%22 y=%2239%22 font-family=%22sans-serif%22 font-size=%2218%22 fill=%22white%22 text-anchor=%22middle%22 font-weight=%22700%22%3ETR%3C/text%3E%3C/svg%3E';

  var css=`
    #tcb{position:fixed;bottom:24px;right:24px;width:62px;height:62px;border-radius:50%;cursor:pointer;z-index:99998;border:none;padding:0;background:#1a3c5e;box-shadow:0 4px 18px rgba(0,0,0,.38);transition:transform .2s,box-shadow .2s;overflow:visible}
    #tcb:hover{transform:scale(1.07)}
    #tcb .tcb-photo{width:62px;height:62px;border-radius:50%;object-fit:cover;display:block;border:2px solid rgba(255,255,255,.25);transition:opacity .2s,transform .2s}
    #tcb .tcb-x{position:absolute;top:0;left:0;width:62px;height:62px;border-radius:50%;background:#1a3c5e;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;font-weight:200;opacity:0;transition:opacity .2s;pointer-events:none;font-family:sans-serif}
    #tcb.open .tcb-photo{opacity:0;transform:scale(.7)}
    #tcb.open .tcb-x{opacity:1;pointer-events:auto}
    @keyframes tcb-wave{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-15deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(5deg)}}
    #tcb.wave{animation:tcb-wave .6s ease-in-out}
    #tcw{position:fixed;bottom:100px;right:24px;width:380px;max-width:calc(100vw - 32px);height:580px;max-height:calc(100vh - 120px);border-radius:20px;box-shadow:0 12px 48px rgba(0,0,0,.22);overflow:hidden;background:#fff;z-index:99999;display:none;opacity:0;transform:translateY(16px) scale(.97);transition:opacity .22s ease,transform .22s ease}
    #tcw.open{opacity:1;transform:translateY(0) scale(1)}
    #tcw iframe{width:100%;height:100%;border:none;display:block}
    @media(max-width:460px){#tcw{bottom:0;right:0;left:0;width:100%;max-width:none;height:100vh;max-height:none;border-radius:0}#tcb{bottom:16px;right:16px}}
  `;
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var bubble=document.createElement('button');
  bubble.id='tcb';bubble.setAttribute('aria-label','Chat with Toby');
  bubble.innerHTML='<img class="tcb-photo" src="'+S+'/photo" alt="Toby"><span class="tcb-x" aria-hidden="true">&#x2715;</span>';
  bubble.querySelector('.tcb-photo').onerror=function(){this.onerror=null;this.src=FB;};
  document.body.appendChild(bubble);

  var wrap=document.createElement('div');wrap.id='tcw';
  var frame=document.createElement('iframe');frame.title='Chat with Toby Russell';
  wrap.appendChild(frame);document.body.appendChild(wrap);

  var isOpen=false;

  // Wave reminder every 15s when chat is closed
  setInterval(function(){
    if(!isOpen){
      bubble.classList.remove('wave');
      void bubble.offsetWidth; // reflow to restart animation
      bubble.classList.add('wave');
      setTimeout(function(){bubble.classList.remove('wave');},700);
    }
  },15000);

  function openChat(){
    if(!frame.src)frame.src=S+'?ref='+encodeURIComponent(location.href)+'&ptitle='+encodeURIComponent(document.title.slice(0,120));
    wrap.style.display='block';
    requestAnimationFrame(function(){requestAnimationFrame(function(){wrap.classList.add('open');});});
    bubble.classList.add('open');
    isOpen=true;
  }
  function closeChat(){
    wrap.classList.remove('open');bubble.classList.remove('open');
    setTimeout(function(){if(!isOpen)wrap.style.display='none';},240);
    isOpen=false;
    // First wave fires 1s after closing so user sees bubble is still there
    setTimeout(function(){
      bubble.classList.remove('wave');void bubble.offsetWidth;bubble.classList.add('wave');
      setTimeout(function(){bubble.classList.remove('wave');},700);
    },1000);
  }
  bubble.addEventListener('click',function(){isOpen?closeChat():openChat();});

  // Photo-click trigger (4 images viewed)
  var photoCount=0,autoOpened=false;
  document.addEventListener('click',function(e){
    if(autoOpened||isOpen)return;
    if(e.target.tagName==='IMG'&&!e.target.closest('#tcw')){
      if(++photoCount>=4){openChat();autoOpened=true;}
    }
  });

  // Auto-open after 20s
  setTimeout(function(){if(!isOpen)openChat();},20000);
})();"""


def build_listing_demo(base_url):
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>123 Maple Ridge Ct — Demo Listing</title>
<style>
*{{box-sizing:border-box}}body{{font-family:system-ui,sans-serif;margin:0;background:#fafafa}}
.wrap{{max-width:760px;margin:0 auto;padding:0 16px 80px}}
.gallery{{position:relative;background:#000;border-radius:8px;overflow:hidden;margin-bottom:8px}}
.gallery img{{width:100%;display:block;aspect-ratio:16/10;object-fit:cover}}
.nav{{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer}}
.prev{{left:10px}}.next{{right:10px}}
.gdots{{display:flex;justify-content:center;gap:6px;padding:8px 0}}
.gdots span{{width:7px;height:7px;border-radius:50%;background:#ccc}}
.gdots span.on{{background:#1a3c5e}}
h1{{font-size:22px;margin:16px 0 4px}}
.price{{font-size:20px;color:#1a3c5e;font-weight:700;margin-bottom:6px}}
.meta{{color:#666;margin-bottom:12px}}p{{line-height:1.6;color:#444;margin-bottom:12px}}
.note{{font-size:12px;color:#aaa;border-top:1px solid #eee;padding-top:10px;margin-top:20px}}
</style></head>
<body>
<div class="wrap">
  <div class="gallery">
    <img id="gp" src="" alt="listing photo">
    <button class="nav prev" onclick="prevP()">&#8249;</button>
    <button class="nav next" onclick="nextP()">&#8250;</button>
  </div>
  <div class="gdots" id="gd"></div>
  <h1>123 Maple Ridge Ct, Lexington, NC</h1>
  <div class="price">$329,900</div>
  <div class="meta">3 bed · 2 bath · 1.1 acres · 1,840 sqft</div>
  <p>Charming brick ranch tucked at the end of a quiet cul-de-sac, with a fully fenced backyard and a detached workshop. Updated kitchen with granite counters, hardwood floors throughout the main living areas.</p>
  <p class="note">Demo listing — not a real property. Click through 4 photos to trigger the chat widget.</p>
</div>
<script src="{base_url}/widget.js"></script>
<script>
const photos=[1,2,3,4,5].map(n=>`https://picsum.photos/seed/listing${{n}}/900/560`);
let idx=0;
const gp=document.getElementById('gp'),gd=document.getElementById('gd');
function renderDots(){{gd.innerHTML='';photos.forEach((_,i)=>{{const s=document.createElement('span');if(i===idx)s.className='on';gd.appendChild(s);}});}}
function showP(){{gp.src=photos[idx];renderDots();}}
function nextP(){{idx=(idx+1)%photos.length;showP();}}
function prevP(){{idx=(idx-1+photos.length)%photos.length;showP();}}
showP();
</script>
</body></html>"""


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send(self, status, body, ctype="text/html"):
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.end_headers()
        if isinstance(body, str):
            self.wfile.write(body.encode())
        else:
            self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)
        ref = params.get("ref", [""])[0]
        ptitle = params.get("ptitle", [""])[0]
        generic = params.get("generic", [""])[0] == "1"

        if path == "/":
            self._send(200, build_chat_page(BASE_URL, ref, ptitle, generic))
        elif path == "/listing":
            self._send(200, build_listing_demo(BASE_URL))
        elif path == "/widget.js":
            self._send(200, build_widget_js(BASE_URL), "application/javascript")
        elif path == "/greeting":
            self._send(200, json.dumps({"text": get_greeting()}), "application/json")
        elif path == "/photo":
            self.send_response(302)
            self._cors()
            self.send_header("Location", "https://d2td4dobkk213c.cloudfront.net/northgrouprealestateinc2557/profiles/2557_1084842.png")
            self.end_headers()
        elif path == "/health":
            self._send(200, "ok", "text/plain")
        else:
            self._send(404, "not found")

    def do_POST(self):
        if self.path == "/chat":
            length = int(self.headers["Content-Length"])
            payload = json.loads(self.rfile.read(length))
            messages = payload["messages"]
            raw = call_claude(messages)
            display_text, lead = parse_lead(raw)
            if lead:
                print(f"[LEAD] {lead}")
            self._send(200, json.dumps({"reply": display_text, "raw": raw, "lead": lead}), "application/json")
        else:
            self._send(404, "not found")

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    print(f"Starting on port {PORT}")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
