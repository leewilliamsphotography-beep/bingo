(() => {
'use strict';

/* ============================== 1. HELPERS & DATA ============================== */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function rnd(){
  if (crypto && crypto.getRandomValues){ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
  return Math.random();
}
const rndInt = n => Math.floor(rnd() * n);
function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = rndInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function lum(hex){
  const c = parseInt(hex.slice(1), 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  return .2126 * f(c >> 16 & 255) + .7152 * f(c >> 8 & 255) + .0722 * f(c & 255);
}
const textOn = hex => lum(hex) > .22 ? '#26211A' : '#F8F1E0';
function hexA(hex, a){
  const c = parseInt(hex.slice(1), 16);
  return `rgba(${c >> 16 & 255},${c >> 8 & 255},${c & 255},${a})`;
}
const ONES = ['nought','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = { 2:'twenty', 3:'thirty', 4:'forty', 5:'fifty', 6:'sixty', 7:'seventy', 8:'eighty' };
function numWords(n){
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}

const MAX_BOARDS = 30;
const BOARD_OPTIONS = [30, 24, 18, 12, 6];
let boardOn = new Array(MAX_BOARDS).fill(true);

const DEC_SETS = {
  vintage:['#C0402E','#D89A26','#4F7A34','#3D6FA8','#B04E7C','#1F7A73','#7C5DA8','#8A5A38','#5A6B7A'],
  modern:['#D9534F','#E8963E','#3E9D6C','#2E86C1','#B85C8F','#2B9C96','#5B6FB8','#9A6BB0','#6E7F92'],
  future:['#FF4D6D','#FF9E3D','#FFD93D','#3DF0A0','#35E0FF','#3D8BFF','#B14CFF','#FF5CD1','#9DFF3D'],
  halloween:['#FF7A2F','#D64545','#FFC53D','#B14CFF','#7C4DFF','#39C48F','#4E9B47','#FF5CD1','#8E86A3'],
  christmas:['#C0392B','#E2634F','#F2C14E','#1F6E43','#3E9D6C','#7FB3D5','#A8D8EA','#8C2F39','#5E8F8B'],
  valentines:['#D94F6E','#E89A3C','#F2C14E','#C25E7C','#A34A68','#E8798F','#B74A5A','#D98CA0','#9E4560'],
  easter:['#7A9E3B','#E8B33C','#F2D06B','#E58FA0','#5C8A46','#4E7AC7','#9B8BC4','#6BBFA3','#C77FA0'],
  summer:['#E4572E','#F2B33D','#2E86C1','#3EA0B8','#D94F6E','#5C8A46','#F2994A','#7A4FA3','#20B2A6']
};
let DEC = DEC_SETS.vintage;
const dec = n => DEC[Math.floor(n / 10)];

const CALLS = {
  0:"Bogey nought",
  1:"Kelly's eye",2:"One little duck",3:"Cup of tea",4:"Knock at the door",5:"Man alive",
  6:"Half a dozen",7:"Lucky for some",8:"Garden gate",9:"Doctor's orders",
  10:"Downing Street",11:"Legs eleven",12:"One dozen",13:"Unlucky for some",14:"Valentine's Day",
  15:"Young and keen",16:"Sweet sixteen",17:"Dancing queen",18:"Key of the door",19:"Goodbye teens",
  20:"One score",21:"Royal salute",22:"Two little ducks",23:"Thee and me",24:"Two dozen",
  25:"Duck and dive",26:"Pick and mix",27:"Gateway to heaven",28:"In a state",29:"Rise and shine",
  30:"Dirty Gertie",31:"Get up and run",32:"Buckle my shoe",33:"All the threes",34:"Ask for more",
  35:"Jump and jive",36:"Three dozen",37:"More than eleven",38:"Christmas cake",39:"The thirty-nine steps",
  40:"Life begins",41:"Time for fun",42:"Winnie the Pooh",43:"Down on your knees",44:"Droopy drawers",
  45:"Halfway there",46:"Up to tricks",47:"Four and seven",48:"Four dozen",49:"PC",
  50:"Bullseye",51:"Tweak of the thumb",52:"Danny La Rue",53:"Stuck in the tree",54:"Clean the floor",
  55:"Snakes alive",56:"Was she worth it?",57:"Heinz varieties",58:"Make them wait",59:"The Brighton line",
  60:"Grandma's getting frisky",61:"Baker's bun",62:"Tickety-boo",63:"Tickle me",64:"The Beatles",
  65:"Old age pension",66:"Clickety click",67:"Stairway to heaven",68:"Pick a mate",69:"Either way up",
  70:"Three score and ten",71:"Bang on the drum",72:"Six dozen",73:"Queen bee",74:"Hit the floor",
  75:"Strive and strive",76:"Trombones",77:"Sunset strip",78:"Heaven's gate",79:"One more time",
  80:"Gandhi's breakfast"
};

let season = 'off';
let oneAwayOn = true;
let calmMode = false;
const recentCalls = [];
let booted = false;
let hallName = '';
let startTime = '';
let lastWinLabel = 'Board 1';
let boardNames = {};   /* board number → resident's name */

function theHall(){ return (hallName && hallName.trim()) || 'The Bingo Hall'; }
function getName(no){ return (boardNames[no] || '').trim(); }
function loadNames(){ try{ boardNames = JSON.parse(localStorage.getItem('tb-names')) || {}; }catch(_){ boardNames = {}; } }
function saveNames(){ try{ localStorage.setItem('tb-names', JSON.stringify(boardNames)); }catch(_){} }
let roster = [];            /* resident names, in order */
let pickedResident = null;  /* resident tapped for manual placement */
function loadRoster(){ try{ roster = JSON.parse(localStorage.getItem('tb-roster')) || []; }catch(_){ roster = []; } }
function saveRoster(){ try{ localStorage.setItem('tb-roster', JSON.stringify(roster)); }catch(_){} }
const SEASON_SUB = {
  off: 'for a full house',
  halloween: 'for a full house… if you dare…',
  christmas: 'for a full house — ho ho ho!',
  valentines: 'for a full house — with love',
  easter: 'for a full house — hop to it!',
  summer: 'for a full house — sunny days!'
};
function applySeasonCopy(){
  $('#eyesdownSub').textContent = SEASON_SUB[season];
  const tags = {
    off: `Eyes down! Britain&rsquo;s friendliest little hall — numbers <strong>0 to 80</strong>, called proper with all the old sayings, and the daubing done for you.`,
    halloween: `The haunted hall is open — numbers <strong>0 to 80</strong>, called with a shiver, and the daubing done for you. Mind the bats.`,
    christmas: `The hall is dressed for Christmas — numbers <strong>0 to 80</strong>, called with festive cheer, and the daubing done for you.`,
    valentines: `The hall is dressed for Valentine&rsquo;s — numbers <strong>0 to 80</strong>, called with love, and the daubing done for you.`,
    easter: `The hall is dressed for Easter — numbers <strong>0 to 80</strong>, called with a spring in the step, and the daubing done for you.`,
    summer: `A day at the seaside — numbers <strong>0 to 80</strong>, called with a bucket of cheer, and the daubing done for you. Mind the gulls.`
  };
  $('#brandTag').innerHTML = tags[season] || tags.off;
}
function applyHallName(){
  const el = $('#brandName');
  if (el) el.textContent = theHall();
  document.title = `${theHall()} — Eyes Down!`;
  const inp = $('#hallNameInput');
  if (inp && document.activeElement !== inp) inp.value = hallName;
}

/* ============================== 2. AUDIO HUB ============================== */
const AudioHub = {
  ctx: null, master: null, musicBus: null, musicFilter: null, noiseBuf: null,
  init(){
    if (this.ctx){ if (this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{}); return true; }
    try{ this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return false; }
    this.master = this.ctx.createGain(); this.master.gain.value = .9;
    this.master.connect(this.ctx.destination);
    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 2600;
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0;
    this.musicBus.connect(this.musicFilter); this.musicFilter.connect(this.master);
    return true;
  },
  noise(){
    if (this.noiseBuf) return this.noiseBuf;
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    return b;
  }
};

/* ============================== 3. THE BAND ============================== */
function buildTuneEvents(def){
  const ev = [];
  def.bars.forEach((bar, i) => {
    const t0 = i * def.meter;
    def.pulse.forEach(([off, kind]) => {
      if (kind === 'b')  ev.push({ t: t0 + off, kind: 'bass',  midi: bar.bass,     dur: def.bassDur });
      if (kind === 'b2') ev.push({ t: t0 + off, kind: 'bass',  midi: bar.bass + 7, dur: def.bassDur });
      if (kind === 'c')  ev.push({ t: t0 + off, kind: 'chord', notes: bar.chord,   dur: def.chordDur });
      if (kind === 'k' || kind === 's' || kind === 'h') ev.push({ t: t0 + off, kind, dur: .1 });
    });
  });
  def.melody.forEach(([t, m, d]) => ev.push({ t, kind: 'mel', midi: m, dur: d }));
  ev.sort((a, b) => a.t - b.t);
  return ev;
}

const INST = {
  vintage: { mel:'triangle', bass:'triangle', chord:'sine', melGain:.15, bassGain:.13, chordGain:.05, sub:true,  detune:false, drumGain:0 },
  modern:  { mel:'sine',     bass:'sine',     chord:'sine', melGain:.17, bassGain:.12, chordGain:.045, sub:true, detune:false, drumGain:.6 },
  future:  { mel:'sawtooth', bass:'sawtooth', chord:'sawtooth', melGain:.085, bassGain:.10, chordGain:.026, sub:false, detune:true, drumGain:1 }
};
const SPOOKY_INST = { mel:'square', bass:'triangle', chord:'triangle', melGain:.065, bassGain:.12, chordGain:.035, sub:false, detune:true, drumGain:.4 };
const XMAS_INST = { mel:'sine', bass:'triangle', chord:'sine', melGain:.15, bassGain:.11, chordGain:.04, sub:false, detune:false, drumGain:0, oct2:.05 };
const CLASSIC_INST = { mel:'triangle', bass:'sine', chord:'sine', melGain:.16, bassGain:.10, chordGain:.036, sub:false, detune:false, drumGain:0, melDecay:2.6, chDecay:2.2, bsDecay:2.4, oct2:.045 };

const VINTAGE_TUNES = [
  { name:"The Bandstand Waltz", tempo:116, meter:3, repeats:2, chordDur:.3, bassDur:.5,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[53,57,60],bass:41},{chord:[53,57,60],bass:41},{chord:[58,62,65],bass:46},{chord:[55,58,62],bass:43},{chord:[55,58,64],bass:48},{chord:[55,58,64],bass:48},{chord:[53,57,60],bass:41},{chord:[53,57,60],bass:41},{chord:[53,57,60],bass:41},{chord:[50,53,57],bass:50},{chord:[55,58,62],bass:43},{chord:[55,58,64],bass:48},{chord:[53,57,60],bass:41},{chord:[58,62,65],bass:46},{chord:[55,58,64],bass:48},{chord:[53,57,60],bass:41}],
    melody:[[0,72,2],[2,69,1],[3,65,2],[5,72,1],[6,70,2],[8,74,1],[9,74,2],[11,70,1],[12,67,2],[14,64,1],[15,67,1],[16,69,1],[17,70,1],[18,69,2],[20,72,1],[21,65,3],
      [24,77,2],[26,76,1],[27,74,2],[29,72,1],[30,74,2],[32,71,1],[33,72,2],[35,67,1],[36,69,2],[38,72,1],[39,70,1],[40,69,1],[41,67,1],[42,64,2],[44,67,1],[45,65,3]]},
  { name:"The Pier Rot Rag", tempo:104, meter:4, repeats:2, chordDur:.26, bassDur:.35,
    pulse:[[0,'b'],[1,'c'],[2,'b2'],[3,'c']],
    bars:[{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48},{chord:[57,60,65],bass:41},{chord:[55,60,64],bass:48},{chord:[55,59,65],bass:43},{chord:[55,59,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48},{chord:[57,60,65],bass:41},{chord:[57,60,65],bass:41},{chord:[55,60,64],bass:48},{chord:[55,59,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48}],
    melody:[[0.5,72,.5],[1,76,1],[2.5,75,.5],[3,72,1],[4.5,67,.5],[5,72,1],[6.5,71,.5],[7,67,1],[8.5,69,.5],[9,72,1],[10.5,77,.5],[11,76,1],[12.5,75,.5],[13,72,1],[14.5,71,.5],[15,72,1],
      [16.5,71,.5],[17,74,1],[18.5,73,.5],[19,71,1],[20.5,74,.5],[21,73,.5],[22,71,.5],[23,69,.5],[24,72,1.5],[26,67,.5],[27,64,1],[28.5,67,.5],[29,72,.5],[30,76,.5],[31,79,1],
      [32.5,72,.5],[33,76,1],[34.5,79,.5],[35,76,1],[36.5,74,.5],[37,77,1],[38.5,74,.5],[39,72,1],[40.5,77,.5],[41,81,1],[42.5,79,.5],[43,77,1],[44.5,76,.5],[45,77,1],[46.5,76,.5],[47,72,1],
      [48.5,76,.5],[49,72,1],[50.5,71,.5],[51,67,1],[52.5,71,.5],[53,74,.5],[54,73,.5],[55,71,.5],[56,72,2],[58,76,.5],[59,79,.5],[60,72,1],[61,76,1],[62,79,1],[63,84,1.5]]},
  { name:"The Seaside Foxtrot", tempo:88, meter:4, repeats:2, chordDur:.55, bassDur:.5,
    pulse:[[0,'b'],[1,'c'],[2,'b2'],[3,'c']],
    bars:[{chord:[55,59,62],bass:43},{chord:[52,59,62],bass:40},{chord:[57,60,64],bass:45},{chord:[54,57,62],bass:38},{chord:[55,59,62],bass:43},{chord:[52,59,62],bass:40},{chord:[57,60,64],bass:45},{chord:[54,57,62],bass:38},{chord:[55,59,62],bass:43},{chord:[55,60,64],bass:48},{chord:[57,60,64],bass:45},{chord:[54,57,62],bass:38},{chord:[55,59,62],bass:43},{chord:[55,60,64],bass:48},{chord:[54,57,62],bass:38},{chord:[55,59,62],bass:43}],
    melody:[[0,74,2],[2,71,1],[3,67,1],[4,71,3],[7,69,1],[8,69,2],[10,72,1],[11,71,1],[12,69,2],[14,66,1],[15,62,1],
      [16,67,2],[18,71,1],[19,74,1],[20,76,2],[22,74,1],[23,71,1],[24,72,2],[26,74,1],[27,72,1],[28,71,2],[30,69,1],[31,66,1],
      [32,67,3],[35,72,1],[36,76,2],[38,74,1],[39,72,1],[40,71,2],[42,69,1],[43,67,1],[44,66,2],[46,69,1],[47,71,1],
      [48,74,3],[51,79,1],[52,79,2],[54,76,1],[55,74,1],[56,74,2],[58,71,1],[59,69,1],[60,71,2],[62,69,1],[63,67,2]]},
  { name:"The Knees-Up", tempo:126, meter:4, repeats:3, chordDur:.2, bassDur:.32,
    pulse:[[0,'b'],[1,'c'],[2,'b2'],[3,'c']],
    bars:[{chord:[55,60,64],bass:48},{chord:[55,58,64],bass:48},{chord:[57,60,65],bass:41},{chord:[53,56,60],bass:41},{chord:[55,60,64],bass:48},{chord:[55,59,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,59,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,58,64],bass:48},{chord:[57,60,65],bass:41},{chord:[53,56,60],bass:41},{chord:[55,60,64],bass:48},{chord:[55,59,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48}],
    melody:[[0,72,1],[1,76,.5],[2,79,1],[3,76,.5],[4,75,1],[5,72,.5],[6,75,1],[7,76,.5],[8,77,1],[9,76,.5],[10,72,1],[11,69,.5],[12,72,1],[13,68,.5],[14,72,1],[15,75,.5],
      [16,76,1.5],[18,72,.5],[19,67,1],[20,71,1],[21,67,.5],[22,71,1],[23,74,.5],[24,76,2],[26,74,.5],[27,72,.5],[28,71,1],[29,74,.5],[30,71,.5],[31,67,.5],
      [32,72,1],[33,76,.5],[34,79,1],[35,76,.5],[36,75,1],[37,72,.5],[38,75,1],[39,76,.5],[40,81,1.5],[42,77,.5],[43,76,.5],[44,75,1],[45,72,.5],[46,68,1],[47,67,.5],
      [48,72,1.5],[50,76,.5],[51,79,.5],[52,79,1],[53,74,.5],[54,71,.5],[55,67,.5],[56,72,2],[58,71,.5],[59,72,.5],[60,76,2],[62,84,2]]},
  { name:"The Palm Court Tango", tempo:100, meter:4, repeats:2, chordDur:.2, bassDur:.5,
    pulse:[[0,'b'],[.75,'c'],[1,'c'],[1.5,'c'],[2,'b'],[2.75,'c'],[3,'c'],[3.5,'c']],
    bars:[{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[57,62,65],bass:38},{chord:[57,60,64],bass:45},{chord:[56,59,64],bass:40},{chord:[56,59,64],bass:40},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[57,62,65],bass:38},{chord:[56,59,64],bass:40},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[57,62,65],bass:38},{chord:[56,59,64],bass:40},{chord:[57,60,64],bass:45}],
    melody:[[0,76,1.5],[2,74,.5],[2.5,72,.5],[3,74,1],[4,76,2],[6,79,1],[7,76,1],[8,77,1.5],[9.5,76,.5],[10,74,1],[11,72,.5],[12,71,2],[14,72,.5],[15,74,.5],
      [16,76,1],[17,74,.5],[18,71,1],[19,68,.5],[20,69,1],[21,68,.5],[22,64,1],[23,68,.5],[24,69,2],[26,72,1],[27,69,1],[28,64,3],
      [32,72,1],[33,76,.5],[34,72,.5],[35,71,1],[36,74,1.5],[37.5,72,.5],[38,70,1],[39,69,.5],[40,68,1],[41,71,.5],[42,68,.5],[43,64,1],[44,69,2],[46,65,1],[47,69,1],
      [48,76,1.5],[50,74,.5],[50.5,72,.5],[51,74,.5],[52,72,1],[53,70,.5],[54,69,1],[55,70,.5],[56,71,1],[57,68,1],[58,64,1],[59,68,1],[60,69,3]]}
];

const MODERN_TUNES = [
  { name:"Skyline", tempo:86, meter:4, repeats:2, chordDur:1.9, bassDur:1.4,
    pulse:[[0,'k'],[0,'b'],[0,'c'],[1,'h'],[1.5,'h'],[2,'s'],[2,'b2'],[2,'c'],[3,'h'],[3.5,'h']],
    bars:[{chord:[60,64,67,71],bass:36},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[55,59,62,65],bass:31},{chord:[60,64,67,71],bass:36},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[55,59,62,65],bass:31},{chord:[60,64,67,71],bass:36},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[55,59,62,65],bass:31},{chord:[60,64,67,71],bass:36},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[55,59,62,65],bass:31}],
    melody:[[0,67,1.5],[2,64,.5],[2.5,62,1],[4,64,2],[7,60,.5],[8,62,1.5],[10,67,.5],[11,69,1],[12,67,2],[15,64,.5],[16,62,1],[18,60,1.5],[20,57,.5],[21,60,1],[22,64,1.5],
      [24,67,1],[26,69,.5],[27,67,1],[28,64,1],[30,62,.5],[31,64,.5],[32,72,1.5],[34,69,.5],[35,67,1],[36,64,2],[39,62,.5],[40,64,1.5],[42,67,.5],[43,69,1],[44,71,2],[47,67,.5],
      [48,69,1],[50,67,1],[52,64,1.5],[54,62,.5],[55,64,1],[56,67,2],[59,72,.5],[60,71,2],[62,67,1],[63,64,1]]},
  { name:"Riverbank", tempo:90, meter:4, repeats:2, chordDur:1.9, bassDur:1.4,
    pulse:[[0,'k'],[0,'b'],[0,'c'],[1,'h'],[1.5,'h'],[2,'s'],[2,'b2'],[2,'c'],[3,'h'],[3.5,'h']],
    bars:[{chord:[50,53,57,60],bass:38},{chord:[46,50,53,57],bass:34},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,58],bass:36},{chord:[50,53,57,60],bass:38},{chord:[46,50,53,57],bass:34},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,58],bass:36},{chord:[50,53,57,60],bass:38},{chord:[46,50,53,57],bass:34},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,58],bass:36},{chord:[50,53,57,60],bass:38},{chord:[46,50,53,57],bass:34},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,58],bass:36}],
    melody:[[0,69,1.5],[2,67,.5],[2.5,65,1],[3,62,1],[4,64,2],[6,65,.5],[7,67,1],[8,69,1.5],[10,70,.5],[11,69,1],[12,67,2],[14,65,.5],[15,64,.5],
      [16,62,1.5],[18,65,.5],[19,69,1],[20,67,2],[22,64,.5],[23,62,1],[24,60,2],[26,62,.5],[27,64,1],[28,65,2],[30,67,.5],[31,69,1],
      [32,70,1.5],[34,69,.5],[35,67,1],[36,64,2],[38,65,.5],[39,67,1],[40,69,1],[41.5,70,.5],[42,72,1.5],[44,69,1],[45,67,1],
      [46,65,1.5],[48,64,1],[49.5,62,.5],[50,64,1],[51,65,1],[52,67,2],[55,62,.5],[56,60,1],[57,62,1],[58,64,1.5],[60,62,.5],[61,60,1],[62,62,2]]},
  { name:"Golden Hour", tempo:82, meter:4, repeats:2, chordDur:1.9, bassDur:1.4,
    pulse:[[0,'k'],[0,'b'],[0,'c'],[1,'h'],[1.5,'h'],[2,'s'],[2,'b2'],[2,'c'],[3,'h'],[3.5,'h']],
    bars:[{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,59],bass:36},{chord:[55,59,62,65],bass:31},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,59],bass:36},{chord:[55,59,62,65],bass:31},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,59],bass:36},{chord:[55,59,62,65],bass:31},{chord:[57,60,64,67],bass:33},{chord:[53,57,60,64],bass:29},{chord:[48,52,55,59],bass:36},{chord:[55,59,62,65],bass:31}],
    melody:[[0,64,2],[2.5,62,.5],[3,60,1],[4,57,1.5],[6,60,.5],[7,62,1],[8,64,2],[10,67,.5],[11,64,1],[12,62,1.5],[14,60,.5],[15,57,1],
      [16,60,2],[18,64,.5],[19,67,1],[20,69,2],[22,67,.5],[23,64,1],[24,62,2],[26,60,.5],[27,62,1],[28,64,1.5],[30,62,.5],[31,60,1],
      [32,57,1.5],[34,60,.5],[35,64,1],[36,67,2],[38,69,.5],[39,67,1],[40,69,1.5],[42,72,.5],[43,69,1],[44,67,2],[46,64,.5],[47,62,1],
      [48,64,1],[49.5,67,.5],[50,64,1],[51,62,1],[52,60,2],[55,57,.5],[56,60,1],[57,62,1],[58,64,1.5],[60,62,.5],[61,60,1],[62,57,2]]}
];

const FUTURE_TUNES = [
  { name:"Neon Circuit", tempo:106, meter:4, repeats:2, chordDur:.16, bassDur:.21,
    pulse:[[0,'k'],[0,'b'],[0,'c'],[.5,'b'],[.5,'h'],[1,'k'],[1,'s'],[1,'b'],[1.5,'b'],[1.5,'h'],[1.5,'c'],[2,'k'],[2,'b'],[2,'c'],[2.5,'b'],[2.5,'h'],[3,'k'],[3,'s'],[3,'b'],[3.5,'b'],[3.5,'h'],[3.5,'c']],
    bars:[{chord:[57,60,64],bass:33},{chord:[53,57,60],bass:29},{chord:[60,64,67],bass:36},{chord:[55,59,62],bass:31},{chord:[57,60,64],bass:33},{chord:[53,57,60],bass:29},{chord:[60,64,67],bass:36},{chord:[55,59,62],bass:31},{chord:[57,60,64],bass:33},{chord:[53,57,60],bass:29},{chord:[60,64,67],bass:36},{chord:[55,59,62],bass:31},{chord:[57,60,64],bass:33},{chord:[53,57,60],bass:29},{chord:[60,64,67],bass:36},{chord:[55,59,62],bass:31}],
    melody:[[0,69,1],[1.5,67,.5],[2,64,1],[3,67,1],[4,69,.5],[5,72,.5],[6,69,1],[7,67,1],[8,64,1.5],[10,62,.5],[11,64,1],[12,67,2],[15,64,.5],[16,62,1],[17.5,64,.5],[18,67,1],[19,69,1],
      [20,72,.5],[21,69,.5],[22,67,1.5],[24,64,1],[25.5,62,.5],[26,60,1],[27,62,1],[28,64,2],[31,67,.5],[32,69,1],[33.5,67,.5],[34,64,1],[35,62,1],[36,60,1.5],[38,62,.5],[39,64,1],
      [40,67,1],[41.5,69,.5],[42,72,1],[43,74,1],[44,72,1.5],[46,69,.5],[47,67,1],[48,64,1],[49.5,65,.5],[50,64,1],[51,62,1],[52,64,2],[55,60,.5],[56,62,1],[58,64,1],[59,65,1],[60,64,2],[62,62,1],[63,60,1]]},
  { name:"Chrome Sunset", tempo:100, meter:4, repeats:2, chordDur:.16, bassDur:.21,
    pulse:[[0,'k'],[0,'b'],[0,'c'],[.5,'b'],[.5,'h'],[1,'k'],[1,'s'],[1,'b'],[1.5,'b'],[1.5,'h'],[1.5,'c'],[2,'k'],[2,'b'],[2,'c'],[2.5,'b'],[2.5,'h'],[3,'k'],[3,'s'],[3,'b'],[3.5,'b'],[3.5,'h'],[3.5,'c']],
    bars:[{chord:[57,62,65],bass:38},{chord:[58,62,65],bass:34},{chord:[57,60,65],bass:29},{chord:[55,60,64],bass:36},{chord:[57,62,65],bass:38},{chord:[58,62,65],bass:34},{chord:[57,60,65],bass:29},{chord:[55,60,64],bass:36},{chord:[57,62,65],bass:38},{chord:[58,62,65],bass:34},{chord:[57,60,65],bass:29},{chord:[55,60,64],bass:36},{chord:[57,62,65],bass:38},{chord:[58,62,65],bass:34},{chord:[57,60,65],bass:29},{chord:[55,60,64],bass:36}],
    melody:[[0,74,.5],[.5,72,.5],[1,70,1],[2,69,1],[3,67,1],[4,69,1.5],[6,67,.5],[7,65,1],[8,67,2],[10,65,.5],[11,62,1],[12,65,1.5],[14,67,.5],[15,69,1],
      [16,70,1],[17,69,.5],[18,67,.5],[19,65,.5],[20,67,1.5],[22,70,.5],[23,72,1],[24,74,2],[26,72,.5],[27,70,1],[28,69,2],[30,67,.5],[31,65,1],
      [32,67,1],[33.5,65,.5],[34,62,1],[35,65,1],[36,67,1.5],[38,69,.5],[39,70,1],[40,72,2],[42,70,.5],[43,69,1],[44,67,1.5],[46,65,.5],[47,62,1],
      [48,65,1],[49.5,67,.5],[50,65,1],[51,62,1],[52,65,2],[54,69,.5],[55,70,1],[56,72,1.5],[58,74,.5],[59,72,1],[60,70,2],[62,67,1],[63,65,1]]},
  { name:"Laser Line", tempo:112, meter:4, repeats:2, chordDur:.16, bassDur:.21,
    pulse:[[0,'k'],[0,'b'],[0,'c'],[.5,'b'],[.5,'h'],[1,'k'],[1,'s'],[1,'b'],[1.5,'b'],[1.5,'h'],[1.5,'c'],[2,'k'],[2,'b'],[2,'c'],[2.5,'b'],[2.5,'h'],[3,'k'],[3,'s'],[3,'b'],[3.5,'b'],[3.5,'h'],[3.5,'c']],
    bars:[{chord:[55,59,64],bass:40},{chord:[55,60,64],bass:36},{chord:[55,59,62],bass:31},{chord:[54,57,62],bass:38},{chord:[55,59,64],bass:40},{chord:[55,60,64],bass:36},{chord:[55,59,62],bass:31},{chord:[54,57,62],bass:38},{chord:[55,59,64],bass:40},{chord:[55,60,64],bass:36},{chord:[55,59,62],bass:31},{chord:[54,57,62],bass:38},{chord:[55,59,64],bass:40},{chord:[55,60,64],bass:36},{chord:[55,59,62],bass:31},{chord:[54,57,62],bass:38}],
    melody:[[0,67,1],[1.5,64,.5],[2,62,1],[3,64,1],[4,67,1],[5,69,1],[6,67,1.5],[7.5,64,.5],[8,62,1],[9,64,1],[10,67,1],[11,71,1],[12,69,2],[14,67,.5],[15,64,1],
      [16,67,1.5],[18,71,.5],[19,74,1],[20,71,1],[21,69,.5],[22,67,.5],[23,64,1],[24,62,1],[25,64,1],[26,67,2],[28,64,.5],[29,62,1],[30,59,2],
      [32,62,1],[33.5,64,.5],[34,67,1],[35,69,1],[36,71,2],[38,69,.5],[39,67,1],[40,64,1],[41,62,.5],[42,64,1],[43,67,1],[44,69,1.5],[46,67,.5],[47,64,1],
      [48,62,1],[49,64,1],[50,67,1],[51,71,1],[52,74,2],[54,71,.5],[55,69,1],[56,71,1.5],[58,74,.5],[59,76,1],[60,74,1],[61,71,.5],[62,69,1],[63,67,1]]}
];

const CLASSICAL_TUNES = [
  { name:"Canon in D", inst:CLASSIC_INST, tempo:72, meter:2, repeats:2, chordDur:1.6, bassDur:1.9,
    pulse:[[0,'b'],[0,'c'],[1,'c']],
    bars:[{chord:[62,66,69],bass:50},{chord:[57,61,64],bass:45},{chord:[59,62,66],bass:47},{chord:[57,61,66],bass:42},{chord:[59,62,67],bass:43},{chord:[62,66,69],bass:38},{chord:[59,62,67],bass:43},{chord:[57,61,64],bass:45},{chord:[62,66,69],bass:50},{chord:[57,61,64],bass:45},{chord:[59,62,66],bass:47},{chord:[57,61,66],bass:42},{chord:[59,62,67],bass:43},{chord:[62,66,69],bass:38},{chord:[59,62,67],bass:43},{chord:[57,61,64],bass:45},{chord:[62,66,69],bass:50},{chord:[57,61,64],bass:45},{chord:[59,62,66],bass:47},{chord:[57,61,66],bass:42},{chord:[59,62,67],bass:43},{chord:[62,66,69],bass:38},{chord:[59,62,67],bass:43},{chord:[57,61,64],bass:45}],
    melody:[[0,78,2],[2,76,2],[4,74,2],[6,73,2],[8,71,2],[10,69,2],[12,71,2],[14,73,2],[16,74,2],[18,73,2],[20,71,2],[22,69,2],[24,67,2],[26,66,2],[28,67,2],[30,64,2],
      [32,78,1],[33,76,1],[34,74,1],[35,73,1],[36,71,1],[37,69,1],[38,71,1],[39,73,1],[40,74,1],[41,73,1],[42,71,1],[43,69,1],[44,67,1],[45,66,1],[46,67,1],[47,64,1]]},
  { name:"Für Elise", inst:CLASSIC_INST, tempo:150, meter:3, repeats:4, chordDur:1.2, bassDur:1.4,
    pulse:[[0,'b'],[1,'c']],
    bars:[{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[52,56,59],bass:40},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[52,56,59],bass:40}],
    melody:[[0,76,.5],[.5,75,.5],[1,76,.5],[1.5,75,.5],[2,76,.5],[2.5,71,.5],[3,74,.5],[3.5,72,.5],[4,69,1.5],[6,60,.5],[6.5,64,.5],[7,69,.5],[7.5,71,1.5],
      [9,64,.5],[9.5,68,.5],[10,71,.5],[10.5,72,1.5],[12,76,.5],[12.5,75,.5],[13,76,.5],[13.5,75,.5],[14,76,.5],[14.5,71,.5],[15,74,.5],[15.5,72,.5],[16,69,1.5],
      [18,60,.5],[18.5,64,.5],[19,69,.5],[19.5,71,1.5],[21,64,.5],[21.5,68,.5],[22,71,.5],[22.5,72,1.5]]},
  { name:"Ode to Joy", inst:CLASSIC_INST, tempo:112, meter:4, repeats:3, chordDur:1.4, bassDur:1.7,
    pulse:[[0,'b'],[0,'c'],[2,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[59,62,65],bass:43},{chord:[60,64,67],bass:48},{chord:[59,62,65],bass:43},{chord:[60,64,67],bass:48},{chord:[59,62,65],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48}],
    melody:[[0,76,1],[1,76,1],[2,77,1],[3,79,1],[4,79,1],[5,77,1],[6,76,1],[7,74,1],[8,72,1],[9,72,1],[10,74,1],[11,76,1],[12,76,1.5],[13.5,74,.5],[14,74,2],
      [16,76,1],[17,76,1],[18,77,1],[19,79,1],[20,79,1],[21,77,1],[22,76,1],[23,74,1],[24,72,1],[25,72,1],[26,74,1],[27,76,1],[28,74,1.5],[29.5,72,.5],[30,72,2]]},
  { name:"Minuet in G", inst:CLASSIC_INST, tempo:118, meter:3, repeats:3, chordDur:.95, bassDur:1.3,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[59,62,67],bass:43},{chord:[59,62,67],bass:43},{chord:[54,57,60,62],bass:50},{chord:[59,62,67],bass:43},{chord:[59,62,67],bass:43},{chord:[59,62,67],bass:43},{chord:[54,57,60,62],bass:50},{chord:[59,62,67],bass:43}],
    melody:[[0,74,.5],[.5,67,.25],[.75,69,.25],[1,71,.5],[1.5,72,.25],[1.75,74,.25],[2,67,.5],[2.5,67,.5],[3,76,.5],[3.5,72,.25],[3.75,74,.25],[4,76,.5],[4.5,78,.25],[4.75,79,.25],[5,67,.5],[5.5,67,.5],
      [6,72,.5],[6.5,74,.25],[6.75,72,.25],[7,71,.5],[7.5,69,.25],[7.75,71,.25],[8,72,.5],[8.5,71,.5],[9,69,.5],[9.5,67,.25],[9.75,66,.25],[10,67,.5],[10.5,69,.25],[10.75,71,.25],[11,67,.5],[11.5,67,.5],
      [12,74,.5],[12.5,67,.25],[12.75,69,.25],[13,71,.5],[13.5,72,.25],[13.75,74,.25],[14,67,.5],[14.5,67,.5],[15,76,.5],[15.5,72,.25],[15.75,74,.25],[16,76,.5],[16.5,78,.25],[16.75,79,.25],[17,67,.5],[17.5,67,.5],
      [18,72,.5],[18.5,74,.25],[18.75,72,.25],[19,71,.5],[19.5,69,.25],[19.75,71,.25],[20,72,.5],[20.5,71,.5],[21,69,.5],[21.5,67,.25],[21.75,66,.25],[22,67,.5],[22.5,69,.25],[22.75,71,.25],[23,67,.5],[23.5,67,.5]]},
  { name:"Clair de Lune", inst:CLASSIC_INST, tempo:60, meter:3, repeats:2, chordDur:2.6, bassDur:2.9,
    pulse:[[0,'b'],[0,'c']],
    bars:[{chord:[60,64,67,71],bass:48},{chord:[53,57,60,64],bass:41},{chord:[55,60,64],bass:48},{chord:[55,60,62,65],bass:43},{chord:[57,60,64],bass:45},{chord:[55,59,64],bass:40},{chord:[57,62,65],bass:50},{chord:[55,60,64],bass:48},{chord:[55,59,62],bass:43},{chord:[55,60,64],bass:48},{chord:[53,57,60],bass:41},{chord:[57,62,65],bass:50},{chord:[60,64,67,71],bass:48}],
    melody:[[0,79,2],[2,79,1],[3,77,2],[5,77,1],[6,76,2],[8,76,1],[9,74,2],[11,74,1],[12,76,2],[15,79,2],
      [18,77,.5],[18.5,76,.5],[19,74,2],[21,76,.5],[21.5,74,.5],[22,72,2],[24,74,2],[27,76,.5],[27.5,77,.5],[28,79,2],
      [30,77,2],[33,77,.5],[33.5,76,.5],[34,74,2],[36,76,3]]},
  { name:"Brahms' Lullaby", inst:CLASSIC_INST, tempo:66, meter:3, repeats:3, chordDur:1.2, bassDur:1.5,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[55,60,64],bass:48},{chord:[55,59,62,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,59,62,65],bass:43},{chord:[57,62,66],bass:50},{chord:[55,59,62,65],bass:43},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48}],
    melody:[[0,67,.5],[.5,67,.5],[1,72,2],[3,71,1],[4,69,1],[5,67,1],[6,67,.5],[6.5,67,.5],[7,72,2],[9,71,1],[10,69,1],[11,67,1],
      [12,69,.5],[12.5,69,.5],[13,74,2],[15,72,1],[16,71,1],[17,69,1],[18,67,1],[19,69,1],[20,71,1],[21,72,3]]},
  { name:"Nocturne", inst:CLASSIC_INST, tempo:60, meter:3, repeats:2, chordDur:2.4, bassDur:2.7,
    pulse:[[0,'b'],[0,'c']],
    bars:[{chord:[55,60,64],bass:48},{chord:[57,60,64],bass:45},{chord:[57,62,66],bass:50},{chord:[55,60,64],bass:48},{chord:[55,60,64],bass:48},{chord:[53,57,60],bass:41},{chord:[55,60,64],bass:48},{chord:[57,62,66],bass:50},{chord:[57,60,64],bass:45},{chord:[55,59,62,65],bass:43},{chord:[55,60,64],bass:48}],
    melody:[[0,67,2.5],[3,76,2.5],[6,77,.5],[6.5,76,.5],[7,74,2],[9,76,.5],[9.5,74,.5],[10,72,2],
      [12,72,.5],[12.5,74,.5],[13,76,2],[15,77,.5],[15.5,79,.5],[16,81,2],[18,79,.5],[18.5,77,.5],[19,76,2],
      [21,77,.5],[21.5,76,.5],[22,74,2],[24,76,2.5],[27,74,.5],[27.5,72,2.5]]},
  { name:"Eine kleine Nachtmusik", inst:CLASSIC_INST, tempo:138, meter:4, repeats:5, chordDur:1, bassDur:1.2,
    pulse:[[0,'b'],[0,'c'],[2,'c']],
    bars:[{chord:[55,59,62],bass:43},{chord:[55,59,62,65],bass:43},{chord:[54,57,62],bass:50},{chord:[55,59,62],bass:43}],
    melody:[[0,67,.25],[.25,62,.25],[.5,67,.25],[.75,62,.25],[1,67,.25],[1.25,62,.25],[1.5,67,.25],[1.75,71,.25],[2,74,.5],[2.5,79,1.5],
      [4,74,2],[6,72,.5],[6.5,71,.5],[7,69,.5],[7.5,71,.5],[8,69,.5],[8.5,74,.5],[9,78,.5],[9.5,81,.5],[10,79,1],[11,78,1],[12,79,2],[14,71,.5],[14.5,74,.5],[15,79,1]]}
];

const CAROLS = [
  { name:"Jingle Bells", inst:XMAS_INST, tempo:132, meter:4, repeats:2, chordDur:.24, bassDur:.35,
    pulse:[[0,'b'],[1,'c'],[2,'b2'],[3,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[59,62,67],bass:43},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48}],
    melody:[[0,76,1],[1,76,1],[2,76,2],[4,76,1],[5,76,1],[6,76,2],[8,76,1],[9,79,1],[10,72,1],[11,74,1],[12,76,4],
      [16,74,1],[17,74,1],[18,74,1],[19,74,1],[20,76,1],[21,76,1],[22,74,1],[23,72,1],[24,79,3]]},
  { name:"Silent Night", inst:XMAS_INST, tempo:92, meter:3, repeats:2, chordDur:.5, bassDur:.7,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48},{chord:[57,60,65],bass:41},{chord:[60,64,67],bass:48},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48},{chord:[57,60,65],bass:41},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48},{chord:[59,62,67],bass:43},{chord:[57,60,65],bass:41},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48}],
    melody:[[0,67,1],[1,67,1],[2,69,2],[4,67,1],[5,67,1],[6,64,2],[8,74,1],[9,74,1],[10,71,2],[12,74,1],[13,74,1],[14,67,2],
      [16,69,1],[17,69,1],[18,72,1],[19,71,1],[20,69,1],[21,67,1],[22,69,1],[23,67,2],[24,69,1],[25,69,1],[26,72,1],[27,71,1],[28,69,1],[29,67,1],[30,69,1],[31,67,1],[32,64,2],
      [34,74,1],[35,74,1],[36,77,1],[37,74,1],[38,71,1],[39,72,1],[40,76,1],[41,72,2],[42,67,1],[43,64,1],[44,65,1],[45,62,1],[46,60,3]]}
];

const HALLOWEEN_TUNES = [
  { name:"The Haunted Waltz", inst:SPOOKY_INST, tempo:104, meter:3, repeats:2, chordDur:.34, bassDur:.55,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[50,53,57],bass:38},{chord:[52,56,59],bass:40},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[53,57,60],bass:41},{chord:[52,56,59],bass:40},{chord:[57,60,64],bass:45},{chord:[50,53,57],bass:38},{chord:[53,57,60],bass:41},{chord:[52,56,59],bass:40},{chord:[57,60,64],bass:45},{chord:[50,53,57],bass:38},{chord:[52,56,59],bass:40},{chord:[57,60,64],bass:45}],
    melody:[[0,81,1],[1,80,.5],[1.5,81,.5],[2,79,1],[3,76,1],[4,77,.5],[4.5,76,.5],[5,74,1],[6,74,1.5],[7.5,72,.5],[8,74,1],[9,71,2],[11,68,1],
      [12,69,1],[13,71,.5],[13.5,72,.5],[14,71,1],[15,69,1],[16,76,1],[17,74,1],[18,72,1],[19,77,1],[20,76,1],[21,76,1],[22,80,1],[23,79,1],
      [24,81,1.5],[25.5,79,.5],[26,77,1],[27,74,1],[28,77,1],[29,74,1],[30,81,1],[31,79,1],[32,77,1],[33,76,.5],[33.5,77,.5],[34,76,1],[35,80,1],
      [36,81,1],[37,79,1],[38,76,1],[39,77,1],[40,74,1],[41,71,1],[42,75,2],[44,71,1],[45,72,1],[46,69,2]]},
  { name:"The Skeleton Stomp", inst:SPOOKY_INST, tempo:112, meter:4, repeats:2, chordDur:.22, bassDur:.3,
    pulse:[[0,'b'],[0,'k'],[1,'c'],[1.5,'h'],[2,'b2'],[2,'k'],[3,'c'],[3.5,'h']],
    bars:[{chord:[50,53,57],bass:38},{chord:[50,53,57],bass:38},{chord:[46,50,53],bass:34},{chord:[45,49,52],bass:33},{chord:[50,53,57],bass:38},{chord:[46,50,53],bass:34},{chord:[43,46,50],bass:31},{chord:[45,49,52],bass:33},{chord:[50,53,57],bass:38},{chord:[46,50,53],bass:34},{chord:[43,46,50],bass:31},{chord:[45,49,52],bass:33},{chord:[50,53,57],bass:38},{chord:[46,50,53],bass:34},{chord:[45,49,52],bass:33},{chord:[50,53,57],bass:38}],
    melody:[[0,74,.5],[.5,75,.5],[1,74,1],[2,72,.5],[2.5,74,.5],[3,69,1],[4,69,1],[5,70,.5],[5.5,72,.5],[6,69,1],[7,65,1],
      [8,70,1],[9,74,1],[10,77,1],[11,74,1],[12,76,1.5],[13.5,75,.5],[14,73,1],[15,73,1],[16,74,1],[17,72,.5],[17.5,74,.5],[18,77,1],[19,74,1],
      [20,77,.5],[20.5,75,.5],[21,77,1],[22,74,1],[23,70,1],[24,72,1],[25,70,.5],[25.5,72,.5],[26,74,1],[27,72,1],[28,73,1],[29,76,1],[30,74,1],[31,73,1],
      [32,74,.5],[32.5,77,.5],[33,81,1],[34,79,1],[35,77,1],[36,77,1],[37,75,.5],[37.5,77,.5],[38,79,1],[39,75,1],[40,79,1],[41,77,.5],[41.5,79,.5],[42,81,1],[43,79,1],
      [44,80,1],[45,76,1],[46,73,1],[47,76,1],[48,74,2],[50,72,1],[51,69,1],[52,70,1],[53,72,1],[54,74,1],[55,77,1],
      [56,76,1],[57,73,1],[58,69,1],[59,73,1],[60,74,2.5],[62.5,72,.5],[63,74,1]]},
  { name:"Ghostly Carousel", inst:SPOOKY_INST, tempo:96, meter:3, repeats:2, chordDur:.3, bassDur:.5,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[52,55,59],bass:40},{chord:[52,55,59],bass:40},{chord:[48,52,55],bass:36},{chord:[47,51,54],bass:35},{chord:[52,55,59],bass:40},{chord:[48,52,55],bass:36},{chord:[45,48,52],bass:33},{chord:[47,51,54],bass:35},{chord:[52,55,59],bass:40},{chord:[48,52,55],bass:36},{chord:[43,47,50],bass:31},{chord:[47,51,54],bass:35},{chord:[52,55,59],bass:40},{chord:[48,52,55],bass:36},{chord:[45,48,52],bass:33},{chord:[47,51,54],bass:35}],
    melody:[[0,76,.5],[.5,74,.5],[1,72,.5],[1.5,74,.5],[2,76,1],[3,77,1],[4,76,1],[5,74,1],[6,72,1],[7,76,1],[8,79,1],[9,78,1],[10,75,1],[11,71,1],
      [12,71,1],[13,72,.5],[13.5,71,.5],[14,67,1],[15,67,1],[16,72,1],[17,76,1],[18,77,1],[19,76,1],[20,72,1],[21,74,1],[22,71,1],[23,66,1],
      [24,64,1],[25,67,1],[26,71,1],[27,72,1.5],[28.5,71,.5],[29,72,1],[30,74,1],[31,71,1],[32,67,1],[33,66,1],[34,69,1],[35,75,1],
      [36,76,1],[37,74,1],[38,72,1],[39,79,1],[40,77,1],[41,76,1],[42,74,1],[43,72,1],[44,74,1],[45,75,1.5],[46.5,71,.5],[47,71,1]]}
];

const VALENTINE_TUNES = [
  { name:"Greensleeves", inst:CLASSIC_INST, tempo:200, meter:6, repeats:2, chordDur:2.6, bassDur:3,
    pulse:[[0,'b'],[3,'c']],
    bars:[{chord:[57,60,64],bass:45},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[57,60,64],bass:45},{chord:[57,60,64],bass:45},{chord:[55,59,62],bass:43},{chord:[56,59,64],bass:40},{chord:[57,60,64],bass:45}],
    melody:[[0,69,2],[2,72,2],[4,74,2],[6,76,3],[9,77,1],[10,76,2],[12,74,3],[15,71,1],[16,67,2],[18,69,1],[19,71,1],[20,72,2],[22,71,1],[23,69,1],
      [24,69,2],[26,72,2],[28,74,2],[30,76,3],[33,77,1],[34,76,2],[36,74,2],[38,71,2],[40,67,1],[41,68,1],[42,69,6]]},
  { name:"The Valentine Waltz", inst:CLASSIC_INST, tempo:88, meter:3, repeats:2, chordDur:1.3, bassDur:1.6,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[57,60,64],bass:45},{chord:[53,57,60],bass:41},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48},{chord:[57,60,64],bass:45},{chord:[50,53,57],bass:38},{chord:[55,59,62],bass:43},{chord:[53,57,60],bass:41},{chord:[60,64,67],bass:48},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48}],
    melody:[[0,76,1],[1,74,1],[2,72,1],[3,72,2],[5,69,1],[6,69,1],[7,72,1],[8,77,1],[9,76,2],[11,74,1],[12,74,1],[13,76,1],[14,79,1],
      [15,81,2],[17,79,1],[18,77,1],[19,76,1],[20,74,1],[21,71,3],[24,72,1],[25,74,1],[26,76,1],[27,77,2],[29,76,1],[30,74,1],[31,71,1],[32,67,1],[33,72,3]]},
  { name:"The Bouquet Polka", inst:CLASSIC_INST, tempo:138, meter:2, repeats:2, chordDur:.45, bassDur:.6,
    pulse:[[0,'b'],[1,'c']],
    bars:[{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[54,57,62],bass:38},{chord:[55,59,62],bass:43}],
    melody:[[0,71,.5],[.5,74,.5],[1,79,1],[2,78,.5],[2.5,74,.5],[3,71,1],[4,72,.5],[4.5,76,.5],[5,79,1],[6,81,.5],[6.5,79,.5],[7,76,1],
      [8,71,.5],[8.5,74,.5],[9,74,.5],[9.5,79,.5],[10,78,.5],[10.5,74,.5],[11,71,1],[12,69,.5],[12.5,74,.5],[13,78,1],[14,79,2]]}
];

const EASTER_TUNES = [
  { name:"The Easter Parade", inst:XMAS_INST, tempo:116, meter:2, repeats:3, chordDur:.5, bassDur:.65,
    pulse:[[0,'b'],[1,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48}],
    melody:[[0,72,.5],[.5,76,.5],[1,79,1],[2,81,.5],[2.5,79,.5],[3,76,1],[4,74,.5],[4.5,79,.5],[5,83,1],[6,81,.5],[6.5,79,.5],[7,74,1],
      [8,72,.5],[8.5,76,.5],[9,79,.5],[9.5,81,.5],[10,84,.5],[10.5,83,.5],[11,79,1],[12,81,.5],[12.5,78,.5],[13,74,.5],[13.5,71,.5],[14,72,2]]},
  { name:"Skipping Through Spring", inst:XMAS_INST, tempo:190, meter:6, repeats:2, chordDur:2.4, bassDur:3,
    pulse:[[0,'b'],[3,'c']],
    bars:[{chord:[50,54,57],bass:38},{chord:[50,54,57],bass:38},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[50,54,57],bass:38},{chord:[50,54,57],bass:38},{chord:[49,52,57],bass:45},{chord:[50,54,57],bass:38}],
    melody:[[0,74,1],[1,76,1],[2,78,1],[3,78,1],[4,76,1],[5,74,1],[6,74,1],[7,74,1],[8,78,1],[9,81,2],[11,79,1],
      [12,78,1],[13,79,1],[14,81,1],[15,83,1],[16,81,1],[17,79,1],[18,78,1],[19,78,.5],[19.5,76,.5],[20,74,2],[22,73,1],
      [24,74,1],[25,76,1],[26,78,1],[27,81,1],[28,78,1],[29,76,1],[30,74,1],[31,76,1],[32,78,1],[33,78,1],[34,81,1],[35,86,1],
      [36,88,1],[37,85,1],[38,81,1],[39,83,1],[40,85,1],[41,83,1],[42,81,1],[43,78,1],[44,76,1],[45,74,3]]},
  { name:"The Little Chick Waltz", inst:XMAS_INST, tempo:108, meter:3, repeats:2, chordDur:1.1, bassDur:1.4,
    pulse:[[0,'b'],[1,'c'],[2,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[53,57,60],bass:41},{chord:[53,57,60],bass:41},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48}],
    melody:[[0,79,1],[1,76,1],[2,72,1],[3,74,1],[4,76,1],[5,74,1],[6,77,1],[7,76,1],[8,74,1],[9,72,3],
      [12,74,1],[13,71,1],[14,67,1],[15,69,1],[16,71,1],[17,72,1],[18,76,1],[19,74,1],[20,71,1],[21,72,3]]}
];

const SUMMER_TUNES = [
  { name:"The Sailor's Hornpipe", inst:INST.vintage, tempo:138, meter:4, repeats:2, chordDur:.4, bassDur:.45,
    pulse:[[0,'b'],[1,'c'],[2,'b2'],[3,'c']],
    bars:[{chord:[50,54,57],bass:38},{chord:[50,54,57],bass:38},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[50,54,57],bass:38},{chord:[50,54,57],bass:38},{chord:[49,52,57],bass:45},{chord:[50,54,57],bass:38}],
    melody:[[0,74,.5],[.5,71,.5],[1,74,.5],[1.5,71,.5],[2,74,1],[3,69,1],[4,71,.5],[4.5,74,.5],[5,76,.5],[5.5,74,.5],[6,73,1],[7,71,1],
      [8,67,.5],[8.5,71,.5],[9,74,.5],[9.5,71,.5],[10,67,1],[11,66,1],[12,67,.5],[12.5,69,.5],[13,71,.5],[13.5,69,.5],[14,71,1],[15,74,1],
      [16,78,.5],[16.5,74,.5],[17,78,.5],[17.5,74,.5],[18,78,1],[19,81,1],[20,81,.5],[20.5,78,.5],[21,81,.5],[21.5,78,.5],[22,81,1],[23,85,1],
      [24,86,.5],[24.5,85,.5],[25,81,.5],[25.5,78,.5],[26,74,1],[27,73,1],[28,74,2],[30,71,.5],[30.5,74,.5],[31,78,1]]},
  { name:"Beside the Seaside", inst:INST.vintage, tempo:120, meter:4, repeats:2, chordDur:.5, bassDur:.6,
    pulse:[[0,'b'],[1,'c'],[2,'b2'],[3,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[53,57,60],bass:41},{chord:[60,64,67],bass:48},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48}],
    melody:[[0,79,1],[1,76,.5],[1.5,72,.5],[2,76,1],[3,74,1],[4,72,.5],[4.5,76,.5],[5,79,.5],[5.5,76,.5],[6,72,1],[7,74,1],
      [8,77,1],[9,76,1],[10,74,1],[11,77,1],[12,76,1],[13,79,1],[14,84,2],[16,79,1],[17,74,.5],[17.5,71,.5],[18,74,1],[19,79,1],
      [20,78,.5],[20.5,76,.5],[21,74,.5],[21.5,76,.5],[22,71,1],[23,67,1],[24,72,.5],[24.5,76,.5],[25,79,.5],[25.5,84,.5],[26,79,1],[27,76,1],
      [28,74,.5],[28.5,76,.5],[29,77,.5],[29.5,76,.5],[30,72,2]]},
  { name:"The Ice Cream Galop", inst:INST.vintage, tempo:152, meter:2, repeats:2, chordDur:.32, bassDur:.38,
    pulse:[[0,'b'],[1,'c']],
    bars:[{chord:[60,64,67],bass:48},{chord:[55,59,62],bass:43},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48},{chord:[53,57,60],bass:41},{chord:[53,57,60],bass:41},{chord:[55,59,62],bass:43},{chord:[60,64,67],bass:48}],
    melody:[[0,76,.25],[.25,79,.25],[.5,84,.5],[1,79,.25],[1.25,76,.25],[1.5,74,.5],[2,71,.25],[2.25,74,.25],[2.5,79,.5],[3,74,.25],[3.25,71,.25],[3.5,67,.5],
      [4,71,.25],[4.25,74,.25],[4.5,79,.5],[5,83,.5],[5.5,79,.5],[6,84,.5],[6.5,79,.5],[7,76,1],
      [8,77,.25],[8.25,81,.25],[8.5,84,.5],[9,81,.25],[9.25,77,.25],[9.5,76,.5],[10,77,.25],[10.25,79,.25],[10.5,81,.5],[11,84,.5],[11.5,86,.5],
      [12,83,.5],[12.5,79,.5],[13,74,.5],[13.5,79,.5],[14,84,1],[15,79,.25],[15.25,76,.25],[15.5,72,.5]]}
];

const HAPPY_BIRTHDAY = { name:"Happy Birthday", tempo:116, meter:3, repeats:1, chordDur:.42, bassDur:.6,
  pulse:[[0,'b'],[1,'c'],[2,'c']],
  bars:[{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[59,62,67],bass:43},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48},{chord:[60,64,67],bass:48},{chord:[57,60,65],bass:41},{chord:[59,62,67],bass:43},{chord:[60,64,67],bass:48}],
  melody:[[0,67,.5],[.5,67,.5],[1,69,.75],[1.75,67,.75],[2.5,72,1],[3.5,71,1.5],[5,67,.5],[5.5,67,.5],[6,69,.75],[6.75,67,.75],[7.5,74,1],[8.5,72,1.5],
    [10,67,.5],[10.5,67,.5],[11,79,1],[12,76,.75],[12.75,72,.75],[13.5,71,.75],[14.25,69,.75],[15.5,77,.5],[16,77,.5],[16.5,76,.75],[17.25,72,.75],[18,74,.75],[18.75,72,.75],[19.5,72,2.5]]
};

const LIBRARIES = { vintage:VINTAGE_TUNES, modern:MODERN_TUNES, future:FUTURE_TUNES, classical:CLASSICAL_TUNES };
const MUSIC_FILTERS = { vintage:2600, modern:5200, future:6400, classical:3800, mix:5200 };

const TUNE_INTROS = ["The band strikes up…","And now, a little…","Next up from the bandstand…","By special request…","Fresh from the bandstand…","A little something from the band…"];
const CLASSIC_INTROS = ["At the piano…","From the repertoire…","Now, a classic…","By popular request…","From the music room…","A little something from the greats…"];

function announceTune(t){
  $('#nowPlaying').textContent = `Now playing — ${t.name}`;
  if (!$('#jukeOverlay').hidden) renderJukebox();
  const intros = Music.libName === 'classical' ? CLASSIC_INTROS : TUNE_INTROS;
  toast(`<strong>${intros[rndInt(intros.length)]}</strong> ${t.name}`, 3400);
}

const Music = {
  on: false, prefOn: false, volume: .55, duckLevel: .28, ducked: false,
  timer: null, passStart: 0, idx: 0, tuneIdx: -1, tune: null, repeatsLeft: 0,
  tunes: null, libName: 'vintage', gap: 1.4, oneShot: false,

  init(){
    const bake = name => LIBRARIES[name].map(t => ({ ...t, inst: t.inst || INST[name] }));
    let base;
    if (this.libName === 'mix'){
      base = [...bake('vintage'), ...bake('modern'), ...bake('future'), ...bake('classical')];
    } else {
      base = bake(this.libName);
    }
    if (season === 'christmas') base = base.concat(CAROLS);
    if (season === 'halloween') base = base.concat(HALLOWEEN_TUNES);
    if (season === 'valentines') base = base.concat(VALENTINE_TUNES);
    if (season === 'easter') base = base.concat(EASTER_TUNES);
    if (season === 'summer') base = base.concat(SUMMER_TUNES);
    this.tunes = base.map(t => ({ ...t, beatDur: 60 / t.tempo, loopBeats: t.meter * t.bars.length, events: buildTuneEvents(t) }));
    this.tuneIdx = -1;
  },
  note(midi){ return 440 * Math.pow(2, (midi - 69) / 12); },

  start(){
    if (this.on) return;
    if (!AudioHub.init()) return;
    if (!this.tunes) this.init();
    this.on = true;
    this.beginTune(this.pickTune(), AudioHub.ctx.currentTime + .18, true);
    this.setGain(this.ducked ? this.volume * this.duckLevel : this.volume, .5);
    this.timer = setInterval(() => this.tick(), 110);
    this.tick();
    syncMusicUI();
  },
  stop(){
    if (!this.on) return;
    this.on = false;
    clearInterval(this.timer); this.timer = null;
    this.setGain(0, .5);
    syncMusicUI();
  },
  toggle(){
    this.on ? this.stop() : this.start();
    this.prefOn = this.on;
    try{ localStorage.setItem('tb-music', this.on ? '1' : '0'); }catch(_){}
    syncMusicUI();
  },
  switchLibrary(name){
    this.libName = name;
    this.init();
    if (!this.on || !AudioHub.ctx){ this.tune = null; syncMusicUI(); return; }
    this.setGain(0, .45);
    this.tune = null;
    const at = AudioHub.ctx.currentTime + 1.15;
    this.beginTune(this.pickTune(), at, true);
    this.setGain(this.ducked ? this.volume * this.duckLevel : this.volume, 1.1);
    syncMusicUI();
  },
  playIndex(i){
    if (!AudioHub.init()) return;
    if (!this.tunes) this.init();
    const wasOff = !this.on;
    if (wasOff){ this.on = true; this.timer = setInterval(() => this.tick(), 110); }
    this.beginTune(this.tunes[i], AudioHub.ctx.currentTime + .12, true);
    this.setGain(this.ducked ? this.volume * this.duckLevel : this.volume, wasOff ? .45 : .3);
    this.prefOn = true;
    try{ localStorage.setItem('tb-music', '1'); }catch(_){}
    syncMusicUI();
  },
  playOneShot(def){
    if (!AudioHub.init()) return;
    if (!this.tunes) this.init();
    const wasOff = !this.on;
    if (wasOff){ this.on = true; this.timer = setInterval(() => this.tick(), 110); }
    const t = { ...def, inst: def.inst || INST[this.libName] || INST.vintage, beatDur: 60 / def.tempo, loopBeats: def.meter * def.bars.length, events: buildTuneEvents(def) };
    this.oneShot = true;
    this.beginTune(t, AudioHub.ctx.currentTime + .12, true);
    this.setGain(this.ducked ? this.volume * this.duckLevel : this.volume, wasOff ? .45 : .3);
    this.prefOn = true;
    try{ localStorage.setItem('tb-music', '1'); }catch(_){}
    syncMusicUI();
  },
  setGain(v, fade = .3){
    if (!AudioHub.ctx) return;
    const g = AudioHub.musicBus.gain, t = AudioHub.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v, t + fade);
  },
  duck(){ this.ducked = true; if (this.on) this.setGain(this.volume * this.duckLevel, .25); },
  unduck(){ this.ducked = false; if (this.on) this.setGain(this.volume, .9); },
  setVolume(v){
    this.volume = Math.min(1, Math.max(0, v));
    if (this.on && !this.ducked) this.setGain(this.volume, .15);
    try{ localStorage.setItem('tb-music-vol', this.volume); }catch(_){}
  },
  pickTune(){
    let i;
    do { i = rndInt(this.tunes.length); } while (this.tunes.length > 1 && i === this.tuneIdx);
    this.tuneIdx = i;
    return this.tunes[i];
  },
  beginTune(t, at, announce){
    this.tune = t; this.idx = 0; this.passStart = at; this.repeatsLeft = t.repeats;
    if (announce && this.on && AudioHub.ctx){
      const wait = Math.max(0, (at - AudioHub.ctx.currentTime - .05) * 1000);
      setTimeout(() => { if (this.on && this.tune === t) announceTune(t); }, wait);
    }
  },
  tick(){
    if (!AudioHub.ctx || !this.tune) return;
    const now = AudioHub.ctx.currentTime;
    let guard = 0;
    while (guard++ < 200){
      if (this.idx >= this.tune.events.length){
        if (this.repeatsLeft > 1){
          this.repeatsLeft--;
          this.passStart += this.tune.loopBeats * this.tune.beatDur;
          this.idx = 0;
          continue;
        }
        const nextAt = this.passStart + this.tune.loopBeats * this.tune.beatDur + (this.oneShot ? .8 : this.gap);
        this.oneShot = false;
        this.beginTune(this.pickTune(), nextAt, true);
        continue;
      }
      const ev = this.tune.events[this.idx];
      const t = this.passStart + ev.t * this.tune.beatDur;
      if (t > now + .9) break;
      if (t > now - .05) this.playEvent(ev, Math.max(t, now + .01));
      this.idx++;
    }
  },
  playEvent(ev, t){
    const ctx = AudioHub.ctx, T = this.tune, I = T.inst;
    const env = (peak, dur, attack = .02) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      g.connect(AudioHub.musicBus);
      return g;
    };
    if (ev.kind === 'bass'){
      const bd = I.bsDecay ? Math.min(ev.dur, I.bsDecay) : ev.dur;
      const o = ctx.createOscillator(); o.type = I.bass;
      o.frequency.value = this.note(ev.midi);
      o.connect(env(I.bassGain, bd)); o.start(t); o.stop(t + bd + .05);
    } else if (ev.kind === 'chord'){
      const cd = I.chDecay ? Math.min(ev.dur, I.chDecay) : ev.dur;
      ev.notes.forEach(m => {
        const o = ctx.createOscillator(); o.type = I.chord;
        o.frequency.value = this.note(m);
        o.connect(env(I.chordGain, cd)); o.start(t); o.stop(t + cd + .05);
      });
    } else if (ev.kind === 'mel'){
      const written = Math.max(.3, ev.dur * T.beatDur * .92);
      const dur = I.melDecay ? Math.min(written, I.melDecay) : written;
      const g = env(I.melGain, dur, I.detune ? .01 : .02);
      const o = ctx.createOscillator(); o.type = I.mel;
      o.frequency.value = this.note(ev.midi);
      o.connect(g); o.start(t); o.stop(t + dur + .05);
      if (I.detune){
        const o2 = ctx.createOscillator(); o2.type = I.mel;
        o2.frequency.value = this.note(ev.midi); o2.detune.value = 9;
        o2.connect(g); o2.start(t); o2.stop(t + dur + .05);
      }
      if (I.oct2){
        const o3 = ctx.createOscillator(); o3.type = 'sine';
        o3.frequency.value = this.note(ev.midi + 12);
        o3.connect(env(I.oct2, dur)); o3.start(t); o3.stop(t + dur + .05);
      }
      if (I.sub){
        const s = ctx.createOscillator(); s.type = 'sine';
        s.frequency.value = this.note(ev.midi - 12);
        s.connect(env(I.melGain * .33, dur)); s.start(t); s.stop(t + dur + .05);
      }
    }
    else if (ev.kind === 'k' && I.drumGain) this.kick(t, I.drumGain * .5);
    else if (ev.kind === 's' && I.drumGain) this.snare(t, I.drumGain * .45);
    else if (ev.kind === 'h' && I.drumGain) this.hat(t, I.drumGain * .5);
  },
  kick(t, v){
    const c = AudioHub.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + .11);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .3);
    o.connect(g); g.connect(AudioHub.musicBus); o.start(t); o.stop(t + .32);
  },
  snare(t, v){
    const c = AudioHub.ctx;
    const n = c.createBufferSource(); n.buffer = AudioHub.noise();
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = .8;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .17);
    n.connect(bp); bp.connect(g); g.connect(AudioHub.musicBus);
    n.start(t); n.stop(t + .2);
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 195;
    const g2 = c.createGain();
    g2.gain.setValueAtTime(v * .5, t);
    g2.gain.exponentialRampToValueAtTime(.0001, t + .08);
    o.connect(g2); g2.connect(AudioHub.musicBus); o.start(t); o.stop(t + .1);
  },
  hat(t, v){
    const c = AudioHub.ctx;
    const n = c.createBufferSource(); n.buffer = AudioHub.noise();
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7600;
    const g = c.createGain();
    g.gain.setValueAtTime(v * .35, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    n.connect(hp); hp.connect(g); g.connect(AudioHub.musicBus);
    n.start(t); n.stop(t + .07);
  }
};

/* ============================== 4. SFX + THE CALLER ============================== */

/* --- MP3 Voice Player --- */
const callBuffers = {};
async function loadCallBuffer(n) {
  if (callBuffers[n]) return callBuffers[n];
  if (callBuffers[n] === false) return false; // Already tried and failed
  try {
    const res = await fetch(`audio/calls/${n}.mp3`);
    if (!res.ok) throw new Error('Not found');
    const arr = await res.arrayBuffer();
    const buf = await AudioHub.ctx.decodeAudioData(arr);
    callBuffers[n] = buf;
    return buf;
  } catch(e) {
    callBuffers[n] = false; // Mark as missing so we don't try fetching it again
    return false;
  }
}
async function playCallAudio(n) {
  AudioHub.init(); // Force the audio engine to wake up
  if (!AudioHub.ctx) return false;
  const buffer = await loadCallBuffer(n);
  if (!buffer) return false; // File doesn't exist
  Music.duck();
  const source = AudioHub.ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(AudioHub.master);
  source.onended = () => Music.unduck();
  source.start(0);
  return true;
}

const phraseBuffers = {};
async function loadPhraseBuffer(name) {
  if (phraseBuffers[name]) return phraseBuffers[name];
  if (phraseBuffers[name] === false) return false;
  try {
    const res = await fetch(`audio/phrases/${name}.mp3`);
    if (!res.ok) throw new Error('Not found');
    const arr = await res.arrayBuffer();
    const buf = await AudioHub.ctx.decodeAudioData(arr);
    phraseBuffers[name] = buf;
    return buf;
  } catch(e) {
    phraseBuffers[name] = false; // Mark missing so we don't fetch again
    return false;
  }
}
async function playPhraseSequence(files, fallbackFn) {
  AudioHub.init();
  if (!AudioHub.ctx) { fallbackFn(); return; }
  
  // Check if the first file exists to prevent half-played sequences
  const firstBuf = await loadPhraseBuffer(files[0]);
  if (!firstBuf) { fallbackFn(); return; } 

  Music.duck();
  let delay = 0;
  for (const file of files) {
    const buf = await loadPhraseBuffer(file);
    if (buf) {
      const source = AudioHub.ctx.createBufferSource();
      source.buffer = buf;
      source.connect(AudioHub.master);
      source.start(AudioHub.ctx.currentTime + delay);
      delay += buf.duration + 0.35; // 350ms gap between audio clips
    }
  }
  // Unduck music after the last clip finishes
  setTimeout(() => Music.unduck(), delay * 1000);
}
function fallbackTTSNumber(n) {
  Speech.play([
    { text: `${CALLS[n]},`, rate: .88, pitch: .96, pause: 430 },
    { text: `${numWords(n)}!`, rate: .94, pitch: 1.05 }
  ]);
}

const SFX = {
  enabled: true,
  init(){ AudioHub.init(); },
  note(freq, type, t0, dur, vol){
    const c = AudioHub.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(AudioHub.master);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + .05);
  },
  ok(){ return this.enabled && AudioHub.ctx; },
  chime(){ if (!this.ok()) return; const t = AudioHub.ctx.currentTime; this.note(659.25,'sine',t,.2,.15); this.note(880,'sine',t+.15,.25,.15); },
  pop(){ if (!this.ok()) return; const t = AudioHub.ctx.currentTime; this.note(520,'sine',t,.16,.4); this.note(240,'sine',t+.02,.2,.3); },
  ding(){ if (!this.ok()) return; const t = AudioHub.ctx.currentTime; this.note(988,'sine',t,.5,.35); this.note(1319,'sine',t+.16,.55,.35); },
  fanfare(){ if (!this.ok()) return; const t = AudioHub.ctx.currentTime; [523,659,784,1047].forEach((f,i)=>this.note(f,'triangle',t+i*.13,.5,.35)); this.note(2093,'sine',t+.55,.7,.2); }
};
function fanfareBig(){
  if (!SFX.ok()) return;
  const t = AudioHub.ctx.currentTime;
  [523,659,784,1047,1319].forEach((f,i)=>SFX.note(f,'triangle',t+i*.11,.55,.38));
  SFX.note(1568,'sine',t+.62,.9,.28);
  SFX.note(2093,'sine',t+.74,.9,.22);
}

const Speech = {
  enabled: true, voices: [], voice: null, voiceURI: null, rateScale: 1,
  seq: 0, timer: null, delayTimer: null,
  supported: ('speechSynthesis' in window),

  init(){
    if (!this.supported) return;
    const pull = () => {
      const vs = speechSynthesis.getVoices() || [];
      if (vs.length && vs.length !== this.voices.length){
        this.voices = vs;
        this.refreshVoice();
        populateVoices();
      }
    };
    pull();
    speechSynthesis.addEventListener?.('voiceschanged', pull);
    [250, 700, 1600, 3200].forEach(t => setTimeout(pull, t));
  },
  scoreVoice(v){
    let s = 0;
    const nm = v.name || '';
    if (/^en[-_]GB/i.test(v.lang)) s += 140;
    else if (/^en[-_](AU|IE|NZ|ZA)/i.test(v.lang)) s += 60;
    else if (/^en/i.test(v.lang)) s += 50;
    if (/natural|neural/i.test(nm)) s += 60;
    if (/online/i.test(nm)) s += 25;
    if (/premium|enhanced/i.test(nm)) s += 30;
    if (/google/i.test(nm)) s += 15;
    if (/siri/i.test(nm)) s += 12;
    if (/microsoft/i.test(nm)) s += 4;
    if (v.localService === false) s += 6;
    if (/compact|espeak/i.test(nm)) s -= 60;
    if (v.default) s += 3;
    return s;
  },
  refreshVoice(){
    if (!this.voices.length) return;
    if (this.voiceURI){
      const saved = this.voices.find(v => v.voiceURI === this.voiceURI);
      if (saved){ this.voice = saved; return; }
    }
    const best = this.voices.slice().sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a))[0] || null;
    this.voice = best;
    this.voiceURI = best ? best.voiceURI : null;
  },
  setVoice(uri){
    this.voiceURI = uri;
    this.voice = this.voices.find(v => v.voiceURI === uri) || null;
    try{ localStorage.setItem('tb-voice-uri', uri); }catch(_){}
  },
  setRate(r){
    this.rateScale = r;
    try{ localStorage.setItem('tb-rate', r); }catch(_){}
  },
  play(parts, opts = {}){
    if (!this.supported) return;
    if (!this.enabled && !opts.force) return;
    if (!parts || !parts.length) return;
    const delay = opts.delay ?? 0;
    clearTimeout(this.delayTimer);
    if (delay <= 0){
      this.stop();
      this.timer = setTimeout(() => this.begin(parts), 60);
    } else {
      this.delayTimer = setTimeout(() => {
        this.stop();
        this.begin(parts);
      }, 60 + delay);
    }
  },
  begin(parts){
    Music.duck();
    const id = this.seq;
    let i = 0;
    const step = () => {
      if (id !== this.seq || i >= parts.length) return;
      const p = parts[i++];
      const isLast = i === parts.length;
      try{
        const u = new SpeechSynthesisUtterance(p.text);
        if (this.voice){ u.voice = this.voice; u.lang = this.voice.lang || 'en-GB'; }
        else u.lang = 'en-GB';
        const jitter = () => 1 + (rnd() - .5) * .04;
        u.rate   = Math.max(.5, Math.min(1.6, (p.rate ?? .92) * this.rateScale * jitter()));
        u.pitch  = Math.max(0,  Math.min(2,   (p.pitch ?? 1) * jitter()));
        u.volume = 1;
        u.onend = () => {
          if (id !== this.seq) return;
          if (isLast) Music.unduck();
          const gap = p.pause ?? 0;
          if (gap) this.timer = setTimeout(step, gap); else step();
        };
        u.onerror = () => { if (id !== this.seq) return; if (isLast) Music.unduck(); };
        speechSynthesis.speak(u);
      }catch(e){}
    };
    step();
  },
  stop(){
    this.seq++;
    clearTimeout(this.timer);
    clearTimeout(this.delayTimer);
    if (this.supported){ try{ speechSynthesis.cancel(); }catch(e){} }
    Music.unduck();
  },
  say(text, opts = {}){
    this.play([{ text, rate: opts.rate ?? .95, pitch: opts.pitch ?? 1 }],
              { force: opts.force, delay: opts.delay });
  },
  callNumber(n){
    SFX.chime(); // Play a soft chime right before speaking to grab attention
    
    // Try to play the MP3, fall back to robotic TTS if missing
    if (AudioHub.ctx) {
      playCallAudio(n).then(success => {
        if (!success) fallbackTTSNumber(n);
      });
    } else {
      fallbackTTSNumber(n);
    }
  },
  greeting(){
    // If custom hall name is set, we must use TTS. Otherwise, use MP3.
    if (hallName) {
      this.play([{ text: `Good evening, ${theHall()}!`, rate: .9, pitch: .98, pause: 320 }]);
    } else {
      playPhraseSequence(['greeting'], () => {
        this.play([{ text: 'Good evening, everybody!', rate: .9, pitch: .98, pause: 320 }]);
      });
      return;
    }
    const parts = [
      { text: 'Good evening, everybody!', rate: .9, pitch: .98, pause: 320 }
    ];
    if (season === 'christmas') parts.push({ text: "Happy Christmas, everybody!", rate: .9, pitch: 1.02, pause: 320 });
    if (season === 'halloween') parts.push({ text: "Happy Halloween, everybody!", rate: .9, pitch: 1, pause: 340 });
    if (season === 'valentines') parts.push({ text: "Happy Valentine's Day, everybody!", rate: .9, pitch: 1.02, pause: 320 });
    if (season === 'easter') parts.push({ text: "Happy Easter, everybody!", rate: .9, pitch: 1.02, pause: 320 });
    if (season === 'summer') parts.push({ text: "A very warm seaside welcome to you all!", rate: .9, pitch: 1.02, pause: 320 });
    parts.push(
      season === 'halloween'
        ? { text: "Eyes down… if you dare…", rate: .8, pitch: .9, pause: 520 }
        : { text: "Eyes down…", rate: .85, pitch: .95, pause: 420 },
      { text: "for a full house!", rate: .92, pitch: 1.06 }
    );
    this.play(parts);
  },
  announceLine(nosArray){
    const fallback = () => {
      const nos = nosArray.map(n => numWords(n)).join(' and ');
      this.play([
        { text: "We have a line!", rate: .9, pitch: 1.06, pause: 340 },
        { text: `Board number ${nos}!`, rate: .88, pitch: 1.02, pause: 380 },
        { text: "The caller takes a breather — carry on whenever you're ready.", rate: .9, pitch: .98 }
      ], { delay: 2300 });
    };
    const files = ['line_win', ...nosArray.map(n => `board_${n}`), 'line_breather'];
    setTimeout(() => playPhraseSequence(files, fallback), 2300);
  },
  announceHouse(nosArray, plural){
    const fallback = () => {
      const nos = nosArray.map(n => numWords(n)).join(' and ');
      this.play([
        { text: "Full house! Full house!", rate: .88, pitch: 1.08, pause: 360 },
        { text: `Board number ${nos} ${plural ? 'win' : 'wins'} the full house!`, rate: .9, pitch: 1.03, pause: 360 },
        { text: "Well done everybody, put the kettle on!", rate: .9, pitch: 1 }
      ], { delay: 2400 });
    };
    const files = ['house_win', ...nosArray.map(n => `board_${n}`), 'house_wins'];
    setTimeout(() => playPhraseSequence(files, fallback), 2400);
  },
  announceOneAway(nosArray, plural){
    const fallback = () => {
      const nos = nosArray.map(n => numWords(n)).join(' and ');
      this.play([
        { text: `Watch out — board number ${nos} ${plural ? 'are' : 'is'} one away!`, rate: .9, pitch: 1.04, pause: 300 },
        { text: "Any number now!", rate: .94, pitch: 1.08 }
      ], { delay: 2200 });
    };
    const files = ['one_away', ...nosArray.map(n => `board_${n}`), 'one_away_end'];
    setTimeout(() => playPhraseSequence(files, fallback), 2200);
  }
};

/* ============================== 5. THE DRUM ============================== */
const Roller = (() => {
  const TAU = Math.PI * 2, CHUTE = -0.62;
  let cv, ctx, W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 100, ballR = 10;
  let pcx = 0, pcy = 0, pR = 100;
  let balls = [], agit = 0, agitT = 0, cageA = 0, crankA = 0, eject = null, last = 0;
  let pal = { ink:'#26211A', glass:'#EFE3C9', face:'#FCF6E8', ballText:'#26211A',
              stroke:'rgba(38,33,26,.5)', cage:'rgba(38,33,26,.14)', rim:'rgba(38,33,26,.35)' };
  function setTheme(p){
    pal = { ...p, stroke: hexA(p.ink, .5), cage: hexA(p.ink, .14), rim: hexA(p.ink, .35) };
  }
  function resize(){
    const box = cv.parentElement.getBoundingClientRect();
    if (!box.width) return;
    W = box.width; H = box.height; DPR = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cx = W / 2; cy = H * .44; R = Math.min(W, H) * .355;
    ballR = Math.max(6, Math.min(14, R / 14));
    if (balls.length && pR){ const s = R / pR;
      for (const b of balls){ b.x = cx + (b.x - pcx) * s; b.y = cy + (b.y - pcy) * s; }
    }
    pcx = cx; pcy = cy; pR = R;
  }
  function init(canvas){
    cv = canvas; ctx = cv.getContext('2d');
    resize();
    new ResizeObserver(resize).observe(cv.parentElement);
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function setPool(list){
    balls = list.map(n => {
      const a = rnd() * TAU, d = rnd() * (R - ballR * 1.6);
      return { n, x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: (rnd() - .5) * 60, vy: (rnd() - .5) * 60 };
    });
  }
  function drawBall(n){
    return new Promise(res => {
      const b = balls.find(x => x.n === n);
      const tAgit = reduced ? 120 : 1450, tFly = reduced ? 260 : 680;
      agitT = 1;
      setTimeout(() => {
        agitT = 0;
        if (b){
          balls.splice(balls.indexOf(b), 1);
          const ex = cx + Math.cos(CHUTE) * (R + ballR * 1.5);
          const ey = cy + Math.sin(CHUTE) * (R + ballR * 1.5);
          eject = { b, t0: performance.now(), dur: tFly, x0: b.x, y0: b.y,
                    cxp: (b.x + ex) / 2, cyp: Math.min(b.y, ey) - R * .45, ex, ey };
        }
        setTimeout(res, tFly + (reduced ? 60 : 150));
      }, tAgit);
    });
  }
  function contain(b){
    const dx = b.x - cx, dy = b.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const maxD = R - ballR - 2.5;
    if (dist > maxD){
      const nx = dx / dist, ny = dy / dist;
      b.x = cx + nx * maxD; b.y = cy + ny * maxD;
      const vn = b.vx * nx + b.vy * ny;
      if (vn > 0){ b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny; }
      return true;
    }
    return false;
  }
  function step(dt){
    agit += (agitT - agit) * Math.min(1, dt * 5);
    const spin = .6 + agit * 6.5;
    cageA += spin * dt; crankA += spin * dt * 2.6;
    const G = 1500, swirl = 40 + agit * 3200;
    for (const b of balls){
      b.vy += G * dt;
      const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy) || 1;
      b.vx += (-dy / d) * swirl * dt;
      b.vy += ( dx / d) * swirl * dt * .4;
      if (!reduced && agit < .1){ b.vx += (rnd() - .5) * 260 * dt; b.vy += (rnd() - .5) * 260 * dt; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.vx *= (1 - .12 * dt); b.vy *= (1 - .12 * dt);
      if (contain(b)){
        const dx2 = b.x - cx, dy2 = b.y - cy, d2 = Math.hypot(dx2, dy2) || 1;
        b.vx += (-dy2 / d2) * spin * ballR * 1.1;
        b.vy += ( dx2 / d2) * spin * ballR * 1.1;
      }
      const sp = Math.hypot(b.vx, b.vy), cap = R * (3 + agit * 9);
      if (sp > cap){ b.vx *= cap / sp; b.vy *= cap / sp; }
    }
    const min = ballR * 2 * .96;
    for (let pass = 0; pass < 2; pass++){
      for (let i = 0; i < balls.length; i++){
        const a = balls[i];
        for (let j = i + 1; j < balls.length; j++){
          const c = balls[j];
          const dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 < min * min && d2 > .0001){
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (min - d) / 2;
            a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov;
            const va = a.vx * nx + a.vy * ny, vc = c.vx * nx + c.vy * ny;
            if (va > vc){ const e = (va - vc) * .9; a.vx -= e * nx; a.vy -= e * ny; c.vx += e * nx; c.vy += e * ny; }
          }
        }
      }
      for (const b of balls) contain(b);
    }
  }
  function ballShape(x, y, r, n){
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = dec(n); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = pal.stroke; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * .62, 0, TAU); ctx.fillStyle = pal.face; ctx.fill();
    if (r >= 7){
      ctx.fillStyle = pal.ballText; ctx.font = `800 ${r * .82}px Archivo`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n, x, y + r * .05);
    }
  }
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const qBez = (x0,y0,cx0,cy0,x1,y1,t) => ({
    x: (1-t)*(1-t)*x0 + 2*(1-t)*t*cx0 + t*t*x1,
    y: (1-t)*(1-t)*y0 + 2*(1-t)*t*cy0 + t*t*y1
  });
  function render(now){
    if (!ctx) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const ink = pal.ink;
    const baseY = cy + R + R * .34, spread = R * .62;
    ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    [[Math.PI * .78, -1], [Math.PI * .22, 1]].forEach(([a, s]) => {
      const lx = cx + Math.cos(a) * R * .92, ly = cy + Math.sin(a) * R * .92;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(cx + s * spread, baseY - 4); ctx.stroke();
    });
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx - spread * 1.1, baseY); ctx.lineTo(cx + spread * 1.1, baseY); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = pal.glass; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R - ballR * .15, 0, TAU); ctx.clip();
    ctx.strokeStyle = pal.cage; ctx.lineWidth = 2.5;
    const dirx = Math.cos(cageA), diry = Math.sin(cageA), px = -diry, py = dirx, sp = R / 3.1;
    for (let k = -3; k <= 3; k++){
      const ox = cx + px * k * sp, oy = cy + py * k * sp;
      const half = Math.sqrt(Math.max(0, R * R - (k * sp) * (k * sp)));
      ctx.beginPath(); ctx.moveTo(ox - dirx * half, oy - diry * half); ctx.lineTo(ox + dirx * half, oy + diry * half); ctx.stroke();
    }
    ctx.restore();
    for (const b of balls) ballShape(b.x, b.y, ballR, b.n);
    if (eject){
      const t = Math.min(1, (now - eject.t0) / eject.dur);
      const u = easeOut(Math.min(1, t / .8));
      const p = qBez(eject.x0, eject.y0, eject.cxp, eject.cyp, eject.ex, eject.ey, u);
      ctx.globalAlpha = t > .86 ? Math.max(0, 1 - (t - .86) / .14) : 1;
      ballShape(p.x, p.y, ballR * (1 + 1.15 * u), eject.b.n);
      ctx.globalAlpha = 1;
      if (t >= 1) eject = null;
    }
    ctx.beginPath(); ctx.arc(cx, cy, R * .82, -2.35, -1.2);
    ctx.strokeStyle = 'rgba(255,252,240,.5)'; ctx.lineWidth = R * .05; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R - ballR * .15, 0, TAU); ctx.lineWidth = 1.5; ctx.strokeStyle = pal.rim; ctx.stroke();
    for (let i = 0; i < 8; i++){
      const a = i / 8 * TAU + .39;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 2.4, 0, TAU); ctx.fillStyle = ink; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, R * .045), 0, TAU); ctx.fillStyle = ink; ctx.fill();
    const chx = Math.cos(CHUTE), chy = Math.sin(CHUTE), ox = -chy, oy = chx;
    ctx.lineWidth = 4;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx + chx * R * .98 + ox * s * ballR * .95, cy + chy * R * .98 + oy * s * ballR * .95);
      ctx.lineTo(cx + chx * R * 1.34 + ox * s * ballR * .8,  cy + chy * R * 1.34 + oy * s * ballR * .8);
      ctx.stroke();
    });
    const ca = crankA, cr = R * .27;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ca) * cr, cy + Math.sin(ca) * cr); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + Math.cos(ca) * cr, cy + Math.sin(ca) * cr, Math.max(4, R * .05), 0, TAU);
    ctx.fillStyle = pal.face; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
  }
  function frame(now){
    const dt = Math.min(.033, (now - last) / 1000) || .016; last = now;
    step(dt); render(now);
    requestAnimationFrame(frame);
  }
  return { init, setPool, drawBall, setTheme };
})();

/* ============================== 6. THE FIXED BOARDS ============================== */
const FIXED_BOARDS = [
  [[3,null,40,52,null],[null,22,35,null,76],[11,28,null,61,null],[7,null,47,null,68],[null,17,null,49,80]],
  [[null,null,44,57,72],[14,31,null,null,66],[null,19,33,63,null],[0,25,38,null,null],[9,null,null,50,79]],
  [[null,29,null,55,70],[5,null,41,62,null],[null,18,36,null,65],[16,24,null,49,null],[12,null,48,null,77]],
  [[1,27,null,null,74],[null,20,45,58,null],[13,32,34,null,null],[8,null,null,51,67],[null,null,39,64,80]],
  [[null,23,42,null,71],[10,30,null,60,null],[2,null,37,null,78],[null,17,null,53,66],[15,null,33,49,null]],
  [[null,26,46,56,null],[6,21,35,null,null],[14,null,null,63,75],[null,null,40,50,68],[0,31,null,null,80]],
  [[11,19,null,54,null],[4,null,38,null,69],[null,28,null,61,77],[16,null,43,49,null],[null,22,33,null,72]],
  [[9,25,36,null,null],[null,18,47,null,70],[1,null,41,null,66],[13,30,null,57,null],[null,21,null,50,78]],
  [[7,null,39,59,null],[15,24,33,null,null],[null,17,45,null,73],[3,null,48,null,65],[12,29,null,52,null]],
  [[null,31,42,62,null],[5,null,34,55,null],[10,20,46,null,null],[null,26,37,null,79],[0,null,44,null,68]],
  [[8,null,35,51,null],[null,21,48,null,75],[2,32,null,58,null],[14,null,40,null,67],[null,27,null,63,71]],
  [[null,null,44,60,70],[13,22,null,null,78],[null,28,38,54,null],[6,17,33,null,null],[1,null,null,64,66]],
  [[null,30,null,56,80],[12,null,41,49,null],[null,19,36,null,69],[4,25,null,62,null],[9,null,47,null,74]],
  [[15,23,null,null,72],[null,32,43,57,null],[7,18,39,null,null],[0,null,null,50,65],[null,null,34,61,79]],
  [[null,26,45,null,76],[3,20,null,55,null],[11,null,37,null,68],[null,31,null,60,80],[6,null,42,49,null]],
  [[null,29,40,58,null],[10,21,33,null,null],[2,null,null,63,77],[null,null,47,51,70],[13,24,null,null,74]],
  [[16,18,null,53,null],[5,null,36,null,71],[null,27,null,59,78],[8,null,44,49,null],[null,22,39,null,66]],
  [[1,25,43,null,null],[null,19,35,null,73],[12,null,46,null,67],[7,30,null,61,null],[null,17,null,52,80]],
  [[14,null,38,50,null],[4,23,42,null,null],[null,28,33,null,75],[9,null,47,null,69],[0,20,null,57,null]],
  [[null,31,40,64,null],[6,null,34,56,null],[11,22,45,null,null],[null,26,36,null,72],[3,null,48,null,79]],
  [[0,null,46,53,null],[null,24,38,null,66],[8,17,null,60,null],[5,null,41,null,79],[null,30,null,49,71]],
  [[null,null,37,59,76],[12,27,null,null,70],[null,21,43,51,null],[2,18,39,null,null],[15,null,null,63,68]],
  [[null,29,null,62,78],[13,null,48,55,null],[null,25,33,null,65],[7,19,null,50,null],[1,null,42,null,74]],
  [[9,20,null,null,67],[null,32,44,58,null],[3,23,35,null,null],[14,null,null,52,80],[null,null,40,61,73]],
  [[null,22,47,null,72],[16,31,null,54,null],[4,null,39,null,66],[null,17,null,60,79],[10,null,34,49,null]],
  [[null,25,36,57,null],[7,19,43,null,null],[0,null,null,63,77],[null,null,46,51,71],[12,28,null,null,75]],
  [[5,30,null,56,null],[14,null,41,null,70],[null,18,null,49,78],[2,null,37,62,null],[null,26,45,null,69]],
  [[11,23,33,null,null],[null,17,42,null,67],[6,null,38,null,80],[0,29,null,59,null],[null,21,null,53,74]],
  [[8,null,40,58,null],[13,24,44,null,null],[null,19,34,null,68],[1,null,47,null,76],[15,27,null,51,null]],
  [[null,18,46,61,null],[4,null,39,55,null],[9,30,33,null,null],[null,25,41,null,71],[2,null,48,null,78]]
];

/* ============================== MODES, BAND, SEASONS & BOARD SET ============================== */
let mode = 'vintage';
let band = 'auto';
let contrast = false;
const MODE_NAMES = { vintage:'Vintage', modern:'Modern', future:'Futuristic' };
const MODE_BLURB = {
  vintage:'Seaside charm and the brass band.',
  modern:'A clean new look, chilled new sounds.',
  future:'Neon lights and pure synthwave.'
};
const BAND_NAMES = {
  auto:'Following the hall', vintage:'The brass band', modern:'The lounge band',
  future:'The synthwave band', classical:'The concert grand', mix:'The lucky-dip band'
};
const PALS = {
  vintage:  { ink:'#26211A', glass:'#EFE3C9', face:'#FCF6E8', ballText:'#26211A' },
  modern:   { ink:'#22303F', glass:'#EDF2F7', face:'#FFFFFF', ballText:'#22303F' },
  future:   { ink:'#8BE9FF', glass:'#0D1730', face:'#F2FDFF', ballText:'#07101E' },
  halloween:{ ink:'#EDE6FA', glass:'#221936', face:'#F2EBFF', ballText:'#1A1228' },
  christmas:{ ink:'#F3ECDA', glass:'#0F2E1F', face:'#F6EFDC', ballText:'#122B1D' },
  valentines:{ ink:'#4A2438', glass:'#F3DEE6', face:'#FDF4F7', ballText:'#4A2438' },
  easter:    { ink:'#3A3524', glass:'#EDF3DC', face:'#FDFBF0', ballText:'#3A3524' },
  summer:    { ink:'#1E3A4C', glass:'#E3EEF5', face:'#FDFEFF', ballText:'#1E3A4C' },
  contrast: { ink:'#FFFFFF', glass:'#1D1D1D', face:'#FFFFFF', ballText:'#000000' }
};
function decKey(){ return season !== 'off' ? season : mode; }
function visualTheme(){ return contrast ? 'contrast' : decKey(); }
function resolveBand(){ return band === 'auto' ? mode : band; }

function applyVisual(){
  const t = visualTheme();
  document.documentElement.dataset.theme = t;
  DEC = DEC_SETS[decKey()] || DEC_SETS.vintage;
  Roller.setTheme(PALS[t] || PALS.vintage);
  refreshColours();
}
function applyFilter(){
  if (AudioHub.ctx) AudioHub.musicFilter.frequency.value = MUSIC_FILTERS[Music.libName] || 2600;
}
function setMode(m, silent){
  if (!LIBRARIES[m]) return;
  const changed = m !== mode;
  mode = m;
  applyVisual();
  $$('#modeCards .mode-card').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  try{ localStorage.setItem('tb-mode', m); }catch(_){}
  Music.switchLibrary(resolveBand());
  applyFilter();
  if (!$('#jukeOverlay').hidden) renderJukebox();
  if (changed && !silent && booted){
    if (season !== 'off') toast(`<strong>The ${MODE_NAMES[m]} look.</strong> The decorations stay — enjoy.`);
    else toast(`<strong>${MODE_NAMES[m]} mode.</strong> ${MODE_BLURB[m]}`);
  }
}
function setBand(b, silent){
  if (!BAND_NAMES[b]) return;
  const changed = b !== band;
  band = b;
  try{ localStorage.setItem('tb-band', b); }catch(_){}
  syncBandUI();
  Music.switchLibrary(resolveBand());
  applyFilter();
  if (!$('#jukeOverlay').hidden) renderJukebox();
  if (changed && !silent && booted){
    toast(`<strong>${BAND_NAMES[b]}.</strong> ${b === 'mix' ? 'Every tune in the book, all shuffled together.' : 'Strike up!'}`);
  }
}
function syncBandUI(){
  $$('#bandSeg .seg-b').forEach(b => b.setAttribute('aria-checked', String(b.dataset.band === band)));
}
function setContrast(on){
  contrast = on;
  $('#contrastToggle').setAttribute('aria-pressed', String(on));
  try{ localStorage.setItem('tb-contrast', on ? '1' : '0'); }catch(_){}
  applyVisual();
}
function setSeason(s, silent){
  const changed = s !== season;
  season = s;
  document.documentElement.dataset.season = s;
  try{ localStorage.setItem('tb-season', s); }catch(_){}
  $$('#seasonSeg .seg-b').forEach(b => b.setAttribute('aria-checked', String(b.dataset.season === s)));
  if (s === 'christmas') Snow.start(); else Snow.stop();
  if (s === 'halloween') Bats.start(); else Bats.stop();
  if (s === 'valentines') Hearts.start(); else Hearts.stop();
  if (s === 'easter') Petals.start(); else Petals.stop();
  if (s === 'summer') Gulls.start(); else Gulls.stop();
  applySeasonCopy();
  applyVisual();
  Music.switchLibrary(Music.libName);
  if (!$('#jukeOverlay').hidden) renderJukebox();
  if (changed && !silent && booted){
    if (s === 'christmas') toast("<strong>Christmas at the hall!</strong> The whole place is dressed for it — let it snow.");
    if (s === 'halloween') toast("<strong>Halloween at the hall!</strong> The whole place is dressed for it — mind the bats.");
    if (s === 'valentines') toast("<strong>Valentine's at the hall!</strong> The whole place is dressed for it — with love.");
    if (s === 'easter') toast("<strong>Easter at the hall!</strong> The whole place is dressed for it — petals and all.");
    if (s === 'summer') toast("<strong>A trip to the seaside!</strong> The whole hall is dressed for it — mind the gulls.");
    if (s === 'off') toast("<strong>Back to the usual hall.</strong> The decorations are packed away.");
  }
}

function activeCount(){ return boardOn.filter(Boolean).length; }
function matchesFirstN(n){ return boardOn.every((v, i) => v === (i < n)); }
function persistBoardSet(){
  try{ localStorage.setItem('tb-boardset', JSON.stringify(boardOn.map((v, i) => v ? i + 1 : null).filter(v => v))); }catch(_){}
}
function renderBoardGrid(){
  const g = $('#boardGrid'); if (!g) return;
  g.innerHTML = '';
  FIXED_BOARDS.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bchip';
    b.textContent = i + 1;
    b.dataset.b = i;
    b.setAttribute('aria-pressed', String(boardOn[i]));
    b.setAttribute('aria-label', `Board ${i + 1} ${boardOn[i] ? 'in play' : 'off the table'}`);
    g.append(b);
  });
}
function applyBoardSet(msg){
  const wasRunning = Game.started && !Game.over;
  buildBoards(FIXED_BOARDS.filter((_, i) => boardOn[i]));
  renderPreview();
  resetGame();
  renderBoardGrid();
  updateBoardCountUI();
  if (msg) toast(`${msg}${wasRunning ? ' A fresh drum it is.' : ''}`);
}
function toggleBoard(i){
  if (boardOn[i] && activeCount() <= 1){
    toast('<strong>Steady on!</strong> At least one board must stay on the table.');
    return;
  }
  boardOn[i] = !boardOn[i];
  persistBoardSet();
  applyBoardSet(`<strong>Board ${i + 1} ${boardOn[i] ? 'back on' : 'off'} the table.</strong>`);
}
function setBoardCount(n){
  if (!BOARD_OPTIONS.includes(n)) return;
  boardOn = FIXED_BOARDS.map((_, i) => i < n);
  persistBoardSet();
  applyBoardSet(`<strong>${numWords(n)} boards in play.</strong> ${n === MAX_BOARDS ? 'The full set.' : 'Only these fill in and can win.'}`);
}
function allBoardsOn(){
  if (boardOn.every(Boolean)) return;
  boardOn = boardOn.map(() => true);
  persistBoardSet();
  applyBoardSet('<strong>All thirty boards on the table.</strong> The full set.');
}
function updateBoardCountUI(){
  $$('#boardSeg .seg-b').forEach(b => {
    b.setAttribute('aria-checked', String(matchesFirstN(+b.dataset.count)));
  });
  const c = boards.length || activeCount();
  const word = numWords(c);
  const Word = word.charAt(0).toUpperCase() + word.slice(1);
  $('#boardsNote').innerHTML =
    `${Word} boards on the table tonight — five by five, with the blanks scattered about. ` +
    `Every one fills itself in as the numbers come up: a completed row takes the <strong>line</strong>, ` +
    `all fifteen takes the <strong>full house</strong>. <strong>The boards are fixed</strong> — they never change, ` +
    `so they always match your printouts. Tap any board to spotlight it on the big screen.`;
  $('#pdfBtnLabel').textContent = `Download all ${c} boards (PDF)`;
  $('#printBtnLabel').textContent = `Print all ${c} boards`;
  $('#pressFine').innerHTML =
    `One board per A4 page — ${word} in all, no cutting needed. The boards are <strong>built into this page ` +
    `and never change</strong>, so you can reprint any time and always get the same ones. ` +
    `Only the boards switched on in Hall settings are printed — flip on whichever you need for a bigger night. ` +
    `Tip: choose <strong>actual size (100%)</strong> rather than &ldquo;fit to page&rdquo; so the boards come out nice and big.`;
}
function refreshColours(){
  if (!boards.length) return;
  for (const [n, c] of cellMap){
    if (c.classList.contains('lit')){ c.style.background = dec(n); c.style.color = textOn(dec(n)); }
  }
  railEl.querySelectorAll('.ball').forEach(el => {
    const n = parseInt(el.querySelector('.ball-in')?.textContent, 10);
    if (!isNaN(n)) el.style.background = dec(n);
  });
  const bn = parseInt(bigNum.textContent, 10);
  if (!isNaN(bn)) bigBall.style.background = dec(bn);
  for (const b of boards) for (const n of b.daubed){
    const c = b.cells[n];
    if (c){ c.style.background = dec(n); c.style.color = textOn(dec(n)); }
  }
  if (Spotlight.no) Spotlight.render();
}

/* ============================== 7. FLASH BOARD / PODIUM / GAME ============================== */
const rollerCanvas = $('#roller'), railEl = $('#rail'), drumEl = $('#drumCount');
const bigBall = $('#bigBall'), bigNum = $('#bigNum'), callText = $('#callText'), callMeta = $('#callMeta');
const startBtn = $('#startBtn'), nextBtn = $('#nextBtn'), newBtn = $('#newBtn');
const paceSeg = $('#paceSeg');
const boardEl = $('#board'), boardStatus = $('#boardStatus');
const boardsEl = $('#boards'), toastWrap = $('#toastWrap');
const winOverlay = $('#winOverlay'), eyesdown = $('#eyesdown'), helpModal = $('#helpModal');
const voicePanel = $('#voicePanel'), voiceSettingsBtn = $('#voiceSettingsBtn');
const themePanel = $('#themePanel'), themeBtn = $('#themeBtn');
const actPanel = $('#actPanel'), actBtn = $('#actBtn');
const spotOverlay = $('#spotOverlay'), teaOverlay = $('#teaOverlay');
const quizOverlay = $('#quizOverlay'), jukeOverlay = $('#jukeOverlay');
const bdayPanel = $('#bdayPanel'), bdayOverlay = $('#bdayOverlay');
const winnersPanel = $('#winnersPanel');
const photoOverlay = $('#photoOverlay');
const repeatBtn = $('#repeatBtn');

const ICONS = {
  play:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>',
  meg:   '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l14-6v14L3 13zM17 8a4 4 0 0 1 0 8M5.5 13.5V19a1.5 1.5 0 0 0 3 0v-4"/></svg>'
};

const cellMap = new Map();
let lastJust = null;
function buildBoard(){
  boardEl.innerHTML = ''; cellMap.clear();
  const ranges = [[0,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,80]];
  ranges.forEach(([lo, hi]) => {
    const col = document.createElement('div'); col.className = 'bcol';
    const lab = document.createElement('span'); lab.className = 'bl';
    lab.textContent = hi === 80 ? '70–80' : `${lo}–${hi}`;
    col.append(lab);
    for (let n = lo; n <= hi; n++){
      const c = document.createElement('span');
      c.className = 'bc'; c.textContent = n;
      cellMap.set(n, c); col.append(c);
    }
    boardEl.append(col);
  });
}
function lightBoard(n){
  recentCalls.push(n);
  if (recentCalls.length > 3) recentCalls.shift();
  cellMap.forEach((c, num) => {
     if (!recentCalls.includes(num)) c.classList.remove('recent');
     else c.classList.add('recent');
  });
  if (lastJust) lastJust.classList.remove('just');
  const c = cellMap.get(n);
  c.classList.add('lit', 'just');
  c.style.background = dec(n); c.style.color = textOn(dec(n));
  lastJust = c;
}
function clearBoard(){
  recentCalls.length = 0;
  cellMap.forEach(c => { c.classList.remove('lit', 'just', 'recent'); c.removeAttribute('style'); });
  lastJust = null;
}
function railAdd(n){
  const empty = railEl.querySelector('.rail-empty'); if (empty) empty.remove();
  const s = document.createElement('span');
  s.className = 'ball pop'; s.style.background = dec(n);
  s.innerHTML = `<span class="ball-in">${n}</span>`;
  railEl.prepend(s);
  while (railEl.children.length > 6) railEl.lastElementChild.remove();
}
function pop(el){ el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function reveal(n){
  bigBall.style.background = dec(n);
  bigNum.textContent = n;
  pop(bigBall);
  callText.textContent = `“${CALLS[n]}”`;
}

let boards = [];
function boardGridEl(grid){
  const g = document.createElement('div'); g.className = 'bc-grid';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){
    const v = grid[r][c];
    const cell = document.createElement('span');
    cell.className = 'bcell' + (v == null ? ' bcell--blank' : '');
    if (v != null){ cell.textContent = v; cell.dataset.n = v; }
    g.append(cell);
  }
  return g;
}
function buildBoards(grids){
  boards = [];
  boardsEl.innerHTML = '';
  grids.forEach((grid, i) => {
    const nums = grid.flat().filter(v => v != null);
    const b = {
      grid,
      no: FIXED_BOARDS.indexOf(grid) + 1,
      set: new Set(nums),
      rows: grid.map(row => row.filter(v => v != null)),
      rowsDone: [false, false, false, false, false],
      daubed: new Set(), line: false, house: false, oneAway: false, cells: {}
    };
    const card = document.createElement('div');
    card.className = 'bcard'; card.setAttribute('role', 'listitem');
    card.tabIndex = 0;
    card.setAttribute('aria-label', `Board ${b.no} — ${nums.length} numbers, tap to view large`);
    card.addEventListener('click', () => Spotlight.open(b.no));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); Spotlight.open(b.no); }
    });
    const head = document.createElement('div'); head.className = 'bcard-head';
    head.innerHTML = `<span class="bcard-no">Board ${b.no}</span><span class="bcard-prog">0/15</span>`;
    const gEl = boardGridEl(grid);
    gEl.querySelectorAll('.bcell[data-n]').forEach(c => b.cells[+c.dataset.n] = c);
    const foot = document.createElement('div'); foot.className = 'bcard-foot';
    const badges = document.createElement('div'); badges.className = 'bcard-badges';
    foot.append(badges);
    card.append(head, gEl, foot);
    b.el = card; b.progEl = head.querySelector('.bcard-prog'); b.badgeEl = badges;
    boards.push(b); boardsEl.append(card);
  });
}
function resetDaubs(){
  for (const b of boards){
    b.daubed.clear(); b.line = false; b.house = false; b.oneAway = false;
    b.rowsDone = b.rowsDone.map(() => false);
    b.el.classList.remove('winner', 'linewon');
    b.el.querySelectorAll('.stamp,.win-tag').forEach(x => x.remove());
    Object.values(b.cells).forEach(c => { c.classList.remove('daubed', 'rowdone'); c.removeAttribute('style'); });
    b.progEl.textContent = '0/15';
  }
}
function addStamp(b, label, cls){
  const st = document.createElement('span');
  st.className = 'stamp' + (cls ? ' stamp--' + cls : '');
  st.textContent = label;
  b.badgeEl.append(st);
}
function daubBoards(n){
  const ev = { line: [], house: [], oneAway: [] };
  for (const b of boards){
    if (!b.set.has(n)) continue;
    b.daubed.add(n);
    const cell = b.cells[n];
    if (cell){ cell.classList.add('daubed'); cell.style.background = dec(n); cell.style.color = textOn(dec(n)); }
    b.progEl.textContent = `${b.daubed.size}/15`;
    b.rows.forEach((nums, r) => {
      if (b.rowsDone[r]) return;
      if (nums.every(x => b.daubed.has(x))){
        b.rowsDone[r] = true;
        nums.forEach(x => b.cells[x].classList.add('rowdone'));
        if (!b.line){ b.line = true; ev.line.push(b); addStamp(b, 'LINE'); b.el.classList.add('linewon'); }
      }
    });
    if (b.daubed.size === 14 && !b.oneAway){
      b.oneAway = true;
      ev.oneAway.push(b);
      addStamp(b, 'ONE TO GO!', 'one');
    }
    if (b.daubed.size === 15 && !b.house){
      b.house = true; ev.house.push(b); addStamp(b, 'FULL HOUSE', 'house');
      b.el.classList.add('winner');
      const tag = document.createElement('span'); tag.className = 'win-tag'; tag.textContent = 'WINNER';
      b.el.append(tag);
    }
  }
  return ev;
}

const podPrev = new Map();
function renderPodium(){
  const pod = $('#podium'); if (!pod || !boards.length) return;
  const sorted = [...boards]
    .sort((a, b) => b.daubed.size - a.daubed.size || a.no - b.no)
    .slice(0, 3);
  pod.innerHTML = '';
  sorted.forEach((b, i) => {
    const bumped = podPrev.get(b.no) !== b.daubed.size;
    const e = document.createElement('div');
    e.className = 'pentry' + (i === 0 ? ' first' : '') + (bumped ? ' bump' : '');
    e.setAttribute('role', 'listitem');
    e.addEventListener('click', () => Spotlight.open(b.no));
    const pct = Math.round(b.daubed.size / 15 * 100);
    const chip = b.house ? '<span class="pline pline--house">HOUSE</span>'
      : (b.daubed.size === 14) ? '<span class="pline pline--one">1 TO GO</span>'
      : b.line ? '<span class="pline">LINE</span>' : '';
    e.innerHTML =
      `<span class="medal medal--${i + 1}" aria-hidden="true">${i + 1}</span>` +
      `<span class="pmain">` +
        `<span class="ptop"><span class="pboard">Board ${b.no}</span>${chip}<span class="pcount">${b.daubed.size}/15</span></span>` +
        (getName(b.no) ? `<span class="pname">${esc(getName(b.no))}</span>` : '') +
        `<span class="pbar" aria-hidden="true"><span style="width:${pct}%"></span></span>` +
      `</span>`;
    e.setAttribute('aria-label', `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} place — Board ${b.no}${getName(b.no) ? ', ' + getName(b.no) : ''}, ${b.daubed.size} of 15 numbers marked${b.house ? ', full house' : b.line ? ', line won' : ''}`);
    pod.append(e);
  });
  podPrev.clear();
  sorted.forEach(b => podPrev.set(b.no, b.daubed.size));
}

function toast(html, ms = 4800){
  const el = document.createElement('div');
  el.className = 'toast'; el.innerHTML = html;
  toastWrap.append(el);
  while (toastWrap.children.length > 3) toastWrap.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 350); }, ms);
}

const Game = {
  pool: [], called: [], started: false, paused: false, over: false,
  mode: 'auto', pace: 6, timer: null, drawing: false, gen: 0,
  awards: { line: null, house: null },
  holdLine: false, lineAt: 0
};

const AutoPause = { wasAuto: false };
function pauseAutoForActivity(){
  AutoPause.wasAuto = Game.started && !Game.paused && !Game.over && !Game.holdLine && Game.mode === 'auto';
  if (AutoPause.wasAuto){ Game.paused = true; clearTimeout(Game.timer); syncControls(); }
}
function resumeAutoAfterActivity(){
  if (!AutoPause.wasAuto) return;
  AutoPause.wasAuto = false;
  Game.paused = false; syncControls();
  scheduleNext(1400);
}

function updateStatuses(){
  const g = Game;
  boardStatus.textContent = g.called.length
    ? `${g.called.length} called • ${g.pool.length} left in the drum`
    : 'Nothing called yet — the drum is full.';
  drumEl.textContent = `${g.pool.length} in the drum`;
  rollerCanvas.setAttribute('aria-label', `Bingo drum with ${g.pool.length} balls remaining`);
  if (g.called.length && !g.holdLine) callMeta.textContent = `Call ${g.called.length} of 81 • ${g.pool.length} left in the drum`;
}
function setStartBtn(icon, label){ startBtn.innerHTML = ICONS[icon] + `<span>${label}</span>`; }
function syncControls(){
  const g = Game;
  const holding = g.holdLine && !g.over;
  startBtn.hidden = g.started && g.mode === 'manual' && !holding;
  nextBtn.hidden = !(g.started && g.mode === 'manual' && !g.over && !holding);
  if (holding) setStartBtn('play', 'Carry on for the house');
  else if (!g.started) setStartBtn('play', 'Eyes down — play!');
  else if (g.over) setStartBtn('play', 'Play again');
  else if (g.mode === 'auto') setStartBtn(g.paused ? 'play' : 'pause', g.paused ? 'Resume the caller' : 'Pause the caller');
  if (g.started && g.mode === 'manual' && !nextBtn.innerHTML.trim()) nextBtn.innerHTML = ICONS.meg + '<span>Call the next number</span>';
  newBtn.hidden = !g.started;
  nextBtn.disabled = g.drawing;
}
function scheduleNext(delay){
  clearTimeout(Game.timer);
  if (Game.mode !== 'auto' || !Game.started || Game.paused || Game.over || Game.holdLine) return;
  Game.timer = setTimeout(() => drawNext(), delay ?? Game.pace * 1000);
}
async function drawNext(){
  const g = Game;
  if (g.drawing || g.over || !g.pool.length) return;
  g.drawing = true; syncControls();
  const gen = g.gen, n = g.pool.pop();
  updateStatuses();
  await Roller.drawBall(n);
  if (gen !== g.gen){ g.drawing = false; return; }
  commit(n);
  g.drawing = false; syncControls();
}
function commit(n){
  const g = Game;
  g.called.push(n);
  lightBoard(n); railAdd(n); reveal(n); updateStatuses();
  SFX.pop();
  Speech.callNumber(n);
  lastCall = n;
  if (repeatBtn) repeatBtn.hidden = false;

  const ev = daubBoards(n);
  renderPodium();
  if (Spotlight.no) Spotlight.render();

  if (ev.oneAway.length && oneAwayOn && !g.awards.line && !g.over){
    toast(`<strong>ONE TO GO!</strong> ${labelBoards(ev.oneAway)} — any number now!`);
    Speech.announceOneAway(ev.oneAway.map(b => b.no), ev.oneAway.length > 1);
  }

  if (ev.line.length && !g.awards.line){
    g.awards.line = ev.line;
    g.holdLine = true;
    g.lineAt = performance.now();
    const nos = ev.line.map(b => b.no).join(' & ');
    const spoken = ev.line.map(b => numWords(b.no)).join(' and ');
    if (ev.line.length > 1){
      tieFlash('line', ev.line);
      fanfareBig();
      Confetti.burst();
      toast(`<strong>${tieWord(ev.line.length).toUpperCase()} LINE!</strong> ${labelBoards(ev.line)} share it`);
      Speech.play([
        { text: `Remarkable — ${ev.line.length === 2 ? 'a double line!' : ev.line.length === 3 ? 'a triple line!' : 'lines all at once!'} ${namedNos(ev.line)} share the honours!`, rate: .9, pitch: 1.06, pause: 420 },
        { text: "The caller takes a breather — carry on whenever you're ready.", rate: .9, pitch: .98 }
      ], { delay: 2400 });
    } else {
      toast(`<strong>LINE!</strong> ${labelBoards(ev.line)} — the caller takes a breather`);
      SFX.ding();
      if (getName(ev.line[0].no)){
        Speech.play([
          { text: "We have a line!", rate: .9, pitch: 1.06, pause: 340 },
          { text: `${namedNos(ev.line)} — board number ${spoken}!`, rate: .88, pitch: 1.02, pause: 380 },
          { text: "The caller takes a breather — carry on whenever you're ready.", rate: .9, pitch: .98 }
        ], { delay: 2300 });
      } else {
        Speech.announceLine(ev.line.map(b => b.no));
      }
    }
    callMeta.textContent = `Line for Board ${nos} — press “Carry on for the house” when you\u2019re ready`;
    if (Results){
      Results.lineBoard = nos;
      if (!Results.lineName) Results.lineName = ev.line.map(b => getName(b.no)).filter(Boolean).join(' & ');
      if (!winnersPanel.hidden) renderWinners();
    }
    syncControls();
  }

  if (ev.house.length){
    g.awards.house = ev.house;
    endGame(ev.house, n);
  } else if (!g.holdLine){
    scheduleNext();
  } else {
    updatePromptBanner('We have a line! Take a break.');
  }
  saveSession();
}
function endGame(winners, n){
  const g = Game;
  g.over = true; clearTimeout(g.timer);
  clearSession();
  const tied = winners.length > 1;
  const nos = winners.map(b => b.no).join(' & ');
  const label = tied ? `Boards ${nos}` : `Board ${nos}`;
  const spoken = winners.map(b => numWords(b.no)).join(' and ');
  lastWinLabel = label;
  if (tied){
    fanfareBig();
    tieFlash('house', winners);
    setTimeout(() => Confetti.burst(), 650);
    setTimeout(() => Confetti.burst(), 1300);
  } else {
    SFX.fanfare();
  }
  $('#winNo').textContent = (!tied && getName(winners[0].no)) ? `${label} · ${getName(winners[0].no)}` : label;
  $('#winPrize').textContent = tied ? 'share tonight’s full house — extraordinary!' : 'wins tonight’s full house — well done!';
  $('#winOn').textContent = `All fifteen numbers marked — house called on ${n}, “${CALLS[n]}”`;
  const cheer = season === 'christmas' ? "Well done everybody — Merry Christmas!"
              : season === 'halloween' ? "Well done everybody — no tricks, only treats!"
              : season === 'valentines' ? "Well done everybody — isn't that lovely!"
              : season === 'easter' ? "Well done everybody — egg-cellent!"
              : season === 'summer' ? "Well done everybody — ice creams all round!"
              : "Well done everybody — put the kettle on!";
  if (tied){
    Speech.play([
      { text: `Stop the machine — a ${tieWord(winners.length).toLowerCase()} full house!`, rate: .88, pitch: 1.08, pause: 400 },
      { text: `${namedNos(winners)}, all finishing on ${numWords(n)}!`, rate: .9, pitch: 1.04, pause: 400 },
      { text: cheer, rate: .9, pitch: 1 }
    ], { delay: 2500 });
  } else if (getName(winners[0].no)){
    Speech.play([
      { text: "Full house! Full house!", rate: .88, pitch: 1.08, pause: 360 },
      { text: `${namedNos(winners)} — a full house!`, rate: .9, pitch: 1.03, pause: 360 },
      { text: cheer, rate: .9, pitch: 1 }
    ], { delay: 2400 });
  } else {
    Speech.announceHouse(winners.map(b => b.no), false);
  }
  setTimeout(() => { winOverlay.hidden = false; $('#againBtn').focus(); }, 900);
  if (!calmMode) Confetti.burst();
  updatePromptBanner('We have a winner! Well done!');
  if (Results){
    Results.houseBoard = nos;
    if (!Results.houseName) Results.houseName = winners.map(b => getName(b.no)).filter(Boolean).join(' & ');
    Archive.upsert(Results);
    renderArchive();
    if (!winnersPanel.hidden) renderWinners();
  }
  syncControls();
}
function eyesdownFlash(){
  eyesdown.hidden = false;
  setTimeout(() => { eyesdown.hidden = true; }, reduced ? 350 : 1500);
}
function resetGame(){
  const g = Game;
  g.gen++; clearTimeout(g.timer);
  g.pool = shuffle([...Array(81).keys()]);
  g.called = []; g.started = false; g.paused = false; g.over = false; g.drawing = false;
  g.awards = { line: null, house: null };
  g.holdLine = false; g.lineAt = 0;
  clearSession();
  Roller.setPool(g.pool.slice());
  clearBoard();
  railEl.innerHTML = '<span class="rail-empty">the drum is full…</span>';
  bigBall.removeAttribute('style'); bigNum.textContent = 'TK';
  callText.textContent = 'Eyes down for a full house!';
  callMeta.textContent = '81 balls in the drum — press the button and the caller does the rest.';
  resetDaubs();
  Spotlight.close();
  lastCall = null;
  if (repeatBtn) repeatBtn.hidden = true;
  podPrev.clear(); renderPodium();
  updateStatuses(); syncControls();
  updatePromptBanner('Press the Green Button to Start');
}
function startGame(){
  const g = Game;
  g.started = true; g.paused = false;
  hideAttract();
  Results = {
    gameId: Date.now(), t: Date.now(),
    dateStr: new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    lineBoard: null, lineName: '', houseBoard: null, houseName: '', calls: 0
  };
  if (!winnersPanel.hidden) renderWinners();
  SFX.init();
  syncControls();
  eyesdownFlash();
  Speech.greeting();
  updatePromptBanner('Listen for the number!');
  const gen = g.gen;
  setTimeout(() => {
    if (gen !== g.gen) return;
    if (g.mode === 'auto' && !g.paused && !g.holdLine) scheduleNext(300);
    else if (g.mode === 'manual') callMeta.textContent = 'Press “Call the next number” whenever you\u2019re ready.';
  }, 3600);
}

/* ============ SAY IT AGAIN, NAME TAGS, SESSION RECOVERY ============ */
let lastCall = null;
function sayAgain(){
  if (lastCall == null) return;
  lightBoard(lastCall);
  pop(bigBall);
  callText.textContent = `“${CALLS[lastCall]}”`;
  Speech.play([
    { text: 'Once again —', rate: .82, pitch: 1, pause: 300 },
    { text: `${CALLS[lastCall]},`, rate: .8, pitch: 1.02, pause: 500 },
    { text: `${numWords(lastCall)}!`, rate: .82, pitch: 1.04 }
  ]);
}
function namedNos(list){
  return list.map(b => getName(b.no)
    ? `${getName(b.no)} on board ${numWords(b.no)}`
    : `board number ${numWords(b.no)}`).join(' and ');
}
function labelBoards(list){
  return list.map(b => getName(b.no) ? `Board ${b.no} · ${esc(getName(b.no))}` : `Board ${b.no}`).join(' & ');
}
function renderNameChips(){
  const box = $('#nameChips'); if (!box) return;
  box.innerHTML = '';
  Object.keys(boardNames).sort((a, b) => a - b).forEach(no => {
    if (!boardNames[no] || !boardOn[no - 1]) return;
    const chip = document.createElement('span');
    chip.className = 'nm-chip';
    chip.innerHTML = `<b>${no}</b> ${esc(boardNames[no])} <button type="button" data-clear="${no}" aria-label="Remove name for board ${no}">×</button>`;
    box.append(chip);
  });
}
/* ---- the residents roster ---- */
function boardOf(name){
  for (const k of Object.keys(boardNames)) if (boardNames[k] === name) return +k;
  return null;
}
function renderRoster(){
  const box = $('#rosterChips'); if (!box) return;
  box.innerHTML = '';
  roster.forEach((nm, i) => {
    const no = boardOf(nm);
    const chip = document.createElement('span');
    chip.className = 'nm-chip' + (pickedResident === nm ? ' nm-chip--sel' : '') + (no ? '' : ' nm-chip--wait');
    chip.dataset.r = i;
    chip.title = no ? `Board ${no} — tap to move, × to remove` : 'Waiting for a board — tap to place';
    chip.innerHTML = (no ? `<b>B${no}</b>` : '') + `<span>${esc(nm)}</span> <button type="button" data-rm="${i}" aria-label="Remove ${esc(nm)}">×</button>`;
    box.append(chip);
  });
  const dealt = roster.filter(nm => boardOf(nm)).length;
  $('#rosterCount').textContent = roster.length ? `${dealt} of ${roster.length} on a board` : 'no residents yet';
}
function importRoster(replace){
  const names = $('#rosterImport').value
    .split('\n').map(s => s.trim().replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  if (!names.length){
    toast('<strong>Nothing to add.</strong> Paste the names first — one per line.');
    return;
  }
  roster = replace ? names : roster.concat(names.filter(nm => !roster.includes(nm)));
  saveRoster(); renderRoster();
  $('#rosterImport').value = '';
  toast(`<strong>Roster updated.</strong> ${roster.length} resident${roster.length === 1 ? '' : 's'} on the list.`);
}
function dealBoards(shuffleIt){
  if (!roster.length){
    toast('<strong>No residents yet.</strong> Paste your list above, then deal.');
    return;
  }
  const live = FIXED_BOARDS.map((_, i) => i + 1).filter(no => boardOn[no - 1]);
  if (!live.length){ toast('<strong>No boards on the table!</strong> Switch a few on first.'); return; }
  const people = roster.slice();
  if (shuffleIt) shuffle(people);
  boardNames = {};
  let dealt = 0;
  for (const nm of people){
    if (dealt >= live.length) break;
    boardNames[live[dealt]] = nm;
    dealt++;
  }
  pickedResident = null;
  saveNames(); renderNameChips(); renderRoster(); renderPodium();
  const waiting = roster.length - dealt;
  toast(`<strong>Eyes down!</strong> ${dealt} resident${dealt === 1 ? '' : 's'} on the boards${waiting > 0 ? ` — ${waiting} waiting` : ''}.`);
}

function saveSession(){
  try{
    if (!Game.started || Game.over){ localStorage.removeItem('tb-session'); return; }
    localStorage.setItem('tb-session', JSON.stringify({
      called: Game.called, paused: Game.paused, holdLine: Game.holdLine, results: Results
    }));
  }catch(_){}
}
function clearSession(){ try{ localStorage.removeItem('tb-session'); }catch(_){} }
function readSession(){ try{ return JSON.parse(localStorage.getItem('tb-session')); }catch(_){ return null; } }
function applySession(s){
  if (!s || !Array.isArray(s.called) || !s.called.length) return false;
  const g = Game;
  g.started = true; g.paused = !!s.paused; g.over = false; g.drawing = false;
  g.holdLine = !!s.holdLine;
  if (g.holdLine) g.lineAt = performance.now();
  Results = s.results || null;
  g.called = s.called.slice();
  const calledSet = new Set(g.called);
  g.pool = shuffle([...Array(81).keys()].filter(n => !calledSet.has(n)));
  for (const n of g.called){ daubBoards(n); lightBoard(n); railAdd(n); }
  const last = g.called[g.called.length - 1];
  bigBall.style.background = dec(last);
  bigNum.textContent = last;
  callText.textContent = `“${CALLS[last]}”`;
  lastCall = last;
  if (repeatBtn) repeatBtn.hidden = false;
  const lineWinners = boards.filter(b => b.line);
  const houseWinners = boards.filter(b => b.house);
  g.awards.line = lineWinners.length ? lineWinners : null;
  g.awards.house = houseWinners.length ? houseWinners : null;
  if (g.awards.house){ g.over = true; g.holdLine = false; }
  Roller.setPool(g.pool.slice());
  podPrev.clear(); renderPodium();
  updateStatuses(); syncControls();
  if (g.holdLine && g.awards.line){
    const nos = g.awards.line.map(b => b.no).join(' & ');
    callMeta.textContent = `Line for Board ${nos} — press “Carry on for the house” when you\u2019re ready`;
  }
  toast('<strong>Welcome back!</strong> The game picked up right where we left off.');
  saveSession();
  return true;
}

/* ============================== 8. RESULTS, ARCHIVE & PRINTING ============================== */
let Results = null;
const Archive = {
  key: 'tb-archive-v1', items: [],
  load(){ try{ this.items = JSON.parse(localStorage.getItem(this.key)) || []; }catch(_){ this.items = []; } },
  save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.items.slice(-60))); }catch(_){} },
  upsert(r){
    if (!r) return;
    const entry = { gameId:r.gameId, t:r.t, date:r.dateStr, lineBoard:r.lineBoard, lineName:r.lineName,
                    houseBoard:r.houseBoard, houseName:r.houseName, calls:r.calls };
    const i = this.items.findIndex(e => e.gameId === r.gameId);
    if (i >= 0) this.items[i] = entry; else this.items.push(entry);
    this.save();
  },
  syncNames(r){
    const e = this.items.find(e => e.gameId === r.gameId);
    if (e){ e.lineName = r.lineName; e.houseName = r.houseName; this.save(); }
  },
  clear(){ this.items = []; this.save(); }
};

function renderWinners(){
  const has = !!Results;
  $('#wEmpty').hidden = has;
  $('#wForm').hidden = !has;
  if (!has) return;
  $('#wLineBoard').textContent = Results.lineBoard != null ? `Board ${Results.lineBoard}` : 'Board —';
  $('#wHouseBoard').textContent = Results.houseBoard != null ? `Board ${Results.houseBoard}` : 'Board —';
  $('#wCalls').textContent = Results.calls ? `House called in ${Results.calls} numbers` : 'Game in progress…';
  const ln = $('#wLineName'), hn = $('#wHouseName');
  if (document.activeElement !== ln) ln.value = Results.lineName;
  if (document.activeElement !== hn) hn.value = Results.houseName;
}
function renderArchive(){
  const el = $('#archList');
  if (!Archive.items.length){
    el.innerHTML = '<p class="arch-empty">No games in the archive yet.</p>';
    return;
  }
  el.innerHTML = Archive.items.slice().reverse().map(e => {
    const when = new Date(e.t).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
    const L = e.lineBoard != null ? `Line: ${e.lineName ? esc(e.lineName) + ' ' : ''}(B${e.lineBoard})` : '';
    const H = e.houseBoard != null ? `House: ${e.houseName ? esc(e.houseName) + ' ' : ''}(B${e.houseBoard})` : '';
    const bits = [L, H].filter(Boolean).join(' · ') || 'no results';
    return `<div class="arch-item"><b>${when}</b> — ${bits}${e.calls ? ` · ${e.calls} calls` : ''}</div>`;
  }).join('');
}

function printGridEl(grid){
  const g = document.createElement('div'); g.className = 'tk-grid';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){
    const v = grid[r][c];
    const cell = document.createElement('span');
    cell.className = 'tc' + (v == null ? ' tc--blank' : '');
    if (v != null) cell.textContent = v;
    g.append(cell);
  }
  return g;
}
function renderPreview(){
  const b = boards[0]; if (!b) return;
  const holder = $('#pressPreview');
  holder.innerHTML = '';
  const tk = document.createElement('div'); tk.className = 'tk';
  const h = document.createElement('div'); h.className = 'tk-head';
  h.innerHTML = `<span class="tk-brand">${esc(theHall())} Bingo</span><span class="tk-no">Board ${b.no}</span>`;
  tk.append(h, printGridEl(b.grid));
  holder.append(tk);
  $('#previewCap').textContent = `Your fixed set — each board prints on its own A4 page`;
}
function hexRGB(hex){ const c = parseInt(hex.slice(1), 16); return [c >> 16 & 255, c >> 8 & 255, c & 255]; }

function boardsPDF(){
  if (!window.jspdf || !window.jspdf.jsPDF){
    toast('<strong>Hang on!</strong> The PDF engine could not load — use “Print all boards” instead.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const [kr, kg, kb] = hexRGB('#26211A'), [mr, mg, mb] = hexRGB('#6B6455');
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  boards.forEach((b, i) => {
    if (i > 0) doc.addPage();
    doc.setDrawColor(kr, kg, kb); doc.setLineWidth(.9);
    doc.rect(10, 10, 190, 277);
    doc.line(10, 27, 200, 27);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(kr, kg, kb);
    doc.setFontSize(20);
    doc.text(`${theHall().toUpperCase()} BINGO`, 17, 21.5);
    doc.setFontSize(34);
    doc.text(`BOARD ${b.no}`, 193, 22.5, { align: 'right' });
    const gx = 10, gy = 31, gw = 190, gh = 248, cw = gw / 5, ch = gh / 5;
    doc.setDrawColor(70, 70, 70); doc.setLineWidth(.4);
    doc.rect(gx, gy, gw, gh);
    for (let k = 1; k < 5; k++){
      doc.line(gx + k * cw, gy, gx + k * cw, gy + gh);
      doc.line(gx, gy + k * ch, gx + gw, gy + k * ch);
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(42); doc.setTextColor(20, 20, 20);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){
      const v = b.grid[r][c]; if (v == null) continue;
      doc.text(String(v), gx + c * cw + cw / 2, gy + r * ch + ch / 2, { align: 'center', baseline: 'middle' });
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(mr, mg, mb);
    doc.text(`Board ${b.no} of ${boards.length}  •  numbers 0–80  •  ${date}`, 105, 283.5, { align: 'center' });
  });
  doc.save(`bingo-boards-${boards.length}.pdf`);
  toast(`<strong>Boards ready!</strong> Your fixed ${boards.length} — one to a full A4 page.`);
}
function renderPrintBoards(){
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const area = $('#printArea');
  area.innerHTML = '';
  boards.forEach(b => {
    const board = document.createElement('div'); board.className = 'pa-board';
    const band = document.createElement('div'); band.className = 'pa-band';
    band.innerHTML = `<span class="pa-band-brand">${esc(theHall()).toUpperCase()} BINGO</span><span class="pa-band-no">BOARD ${b.no}</span>`;
    const foot = document.createElement('div'); foot.className = 'pa-foot';
    foot.textContent = `Board ${b.no} of ${boards.length} • numbers 0–80 • ${date}`;
    board.append(band, printGridEl(b.grid), foot);
    area.append(board);
  });
}
function printPoster(){
  if (!Results){
    toast('<strong>Nothing yet!</strong> Play a game first — the poster comes from tonight’s results.');
    return;
  }
  const who = s => s && s.trim() ? esc(s) : '—';
  const area = $('#printArea');
  area.innerHTML = `
    <div class="pa-poster">
      <div class="pp-brand">${esc(theHall())} BINGO</div>
      <h1 class="pp-title">Tonight&rsquo;s Winners</h1>
      <p class="pp-date">${esc(Results.dateStr)}</p>
      <div class="pp-rows">
        <div class="pp-row">
          <span class="pp-what">One Line</span>
          <span class="pp-who">${who(Results.lineName)}</span>
          <span class="pp-board">${Results.lineBoard != null ? 'Board ' + Results.lineBoard : '—'}</span>
        </div>
        <div class="pp-row">
          <span class="pp-what">Full House</span>
          <span class="pp-who">${who(Results.houseName)}</span>
          <span class="pp-board">${Results.houseBoard != null ? 'Board ' + Results.houseBoard : '—'}</span>
        </div>
      </div>
      <p class="pp-calls">${Results.calls ? `House called in ${Results.calls} numbers` : 'A grand game was had by all'}</p>
      <div class="pp-foot">Well done everybody — same time next week!</div>
    </div>`;
  window.print();
}
function printEveningPoster(){
  const today = new Date();
  const todays = Archive.items
    .filter(e => { const d = new Date(e.t);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); })
    .sort((a, b) => a.t - b.t);
  if (!todays.length){
    toast('<strong>Nothing yet tonight.</strong> Finish a game or two and the evening poster will have something to shout about.');
    return;
  }
  const dateStr = today.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const rows = todays.map((e, i) => {
    const L = e.lineBoard != null ? `Line: <b>${esc(e.lineName || '—')}</b> (B${e.lineBoard})` : '';
    const H = e.houseBoard != null ? `House: <b>${esc(e.houseName || '—')}</b> (B${e.houseBoard})` : '';
    const bits = [L, H].filter(Boolean).join('<br>') || 'no result recorded';
    return `<div class="pp-game">
      <span class="pp-g-no">Game ${i + 1}</span>
      <span class="pp-g-body">${bits}</span>
      <span class="pp-g-calls">${e.calls ? e.calls + ' calls' : ''}</span>
    </div>`;
  }).join('');
  $('#printArea').innerHTML = `
    <div class="pa-poster pa-poster--evening">
      <div class="pp-brand">${esc(theHall())} BINGO</div>
      <h1 class="pp-title">Tonight&rsquo;s Winners</h1>
      <p class="pp-date">${dateStr}</p>
      <div class="pp-rows">${rows}</div>
      <div class="pp-foot">${todays.length} game${todays.length > 1 ? 's' : ''} — well done everybody, same time next week!</div>
    </div>`;
  window.print();
}

/* ============================== 9. ACTIVITIES ============================== */
const Spotlight = {
  no: null,
  open(no){ this.no = no; spotOverlay.hidden = false; this.render(); },
  close(){ this.no = null; spotOverlay.hidden = true; },
  render(){
    const b = boards.find(x => x.no === this.no);
    if (!b) return this.close();
    $('#spotNo').textContent = `Board ${b.no}`;
    $('#spotProg').textContent = `${b.daubed.size}/15`;
    const badges = $('#spotBadges'); badges.innerHTML = '';
    const badge = (label, cls) => {
      const st = document.createElement('span');
      st.className = 'stamp' + (cls ? ' stamp--' + cls : '');
      st.textContent = label;
      badges.append(st);
    };
    if (b.house) badge('FULL HOUSE', 'house');
    if (b.oneAway && !b.house) badge('ONE TO GO!', 'one');
    if (b.line) badge('LINE');
    const g = $('#spotGrid'); g.innerHTML = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){
      const v = b.grid[r][c];
      const cell = document.createElement('span');
      cell.className = 'spot-cell';
      if (v == null){ cell.classList.add('spot-cell--blank'); }
      else {
        cell.textContent = v;
        if (b.daubed.has(v)){ cell.style.background = dec(v); cell.style.color = textOn(dec(v)); cell.style.borderColor = 'transparent'; }
        if (b.rowsDone[r]) cell.classList.add('spot-cell--row');
      }
      g.append(cell);
    }
  }
};

const Tea = { timer: null, endsAt: null };
function openTeaBreak(){
  if (!teaOverlay.hidden) return;
  pauseAutoForActivity();
  Tea.endsAt = null;
  $('#brkCdWrap').hidden = true;
  teaOverlay.hidden = false;
  teaTick();
  Tea.timer = setInterval(teaTick, 500);
}
function teaTick(){
  const now = new Date();
  $('#brkClock').textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  $('#brkDate').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  if (Tea.endsAt != null){
    const left = Tea.endsAt - Date.now();
    if (left <= 0){ finishTea(true); return; }
    const s = Math.ceil(left / 1000);
    $('#brkCd').textContent = `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }
}
function finishTea(auto){
  clearInterval(Tea.timer); Tea.timer = null; Tea.endsAt = null;
  teaOverlay.hidden = true;
  const resuming = AutoPause.wasAuto;
  resumeAutoAfterActivity();
  if (resuming){
    eyesdownFlash();
    SFX.ding();
    Speech.say(`Welcome back to ${theHall()} — eyes down!`);
  }
}

const Quiz = { deck: [], idx: 0, num: null, state: 'start', scores: { red: 0, blue: 0 }, winner: null, TARGET: 10 };
function openQuiz(){
  if (!quizOverlay.hidden) return;
  pauseAutoForActivity();
  quizOverlay.hidden = false;
  if (Quiz.state === 'start' || Quiz.state === 'winner') resetQuiz();
  else renderQuiz();
}
function closeQuiz(){
  quizOverlay.hidden = true;
  resumeAutoAfterActivity();
}
function resetQuiz(){
  Quiz.deck = shuffle([...Array(81).keys()]);
  Quiz.idx = 0;
  Quiz.scores = { red: 0, blue: 0 };
  Quiz.winner = null;
  nextQuiz();
}
function nextQuiz(){
  if (Quiz.idx >= Quiz.deck.length){ Quiz.deck = shuffle([...Array(81).keys()]); Quiz.idx = 0; }
  Quiz.num = Quiz.deck[Quiz.idx++];
  Quiz.state = 'question';
  renderQuiz();
}
function awardQuiz(team){
  Quiz.scores[team]++;
  if (Quiz.scores[team] >= Quiz.TARGET){
    Quiz.state = 'winner';
    Quiz.winner = team;
    renderQuiz();
    SFX.fanfare();
    Confetti.burst();
    Speech.say(`The ${team === 'red' ? 'Reds' : 'Blues'} win! Well done everybody!`, { delay: 300 });
  } else {
    nextQuiz();
  }
}
function renderQuiz(){
  $('#qRed').textContent = Quiz.scores.red;
  $('#qBlue').textContent = Quiz.scores.blue;
  const st = $('#quizStage');
  if (Quiz.state === 'start'){
    st.innerHTML = `
      <div class="qrules">
        <p><b>The rules, such as they are:</b></p>
        <p>A number comes up — shout the bingo call before we reveal it.</p>
        <p>One point to whichever team gets it right. First to ten wins the evening&rsquo;s glory.</p>
        <p>The caller reads the answer out, so everyone learns the calls as you play.</p>
      </div>
      <button class="btn btn-primary" data-q="start">Start the game</button>`;
  } else if (Quiz.state === 'question'){
    st.innerHTML = `
      <div class="ball big-ball qball pop" style="background:${dec(Quiz.num)}"><span class="ball-in">${Quiz.num}</span></div>
      <p class="qcall">Shout the call before we reveal it!</p>
      <button class="btn btn-primary" data-q="reveal">Reveal the call</button>`;
  } else if (Quiz.state === 'revealed'){
    st.innerHTML = `
      <p class="qcall" style="font-size:clamp(1.9rem,5vw,3rem)">“${CALLS[Quiz.num]}”</p>
      <p class="qtarget">Number ${Quiz.num} — well done if you got it!</p>
      <div class="qbtns">
        <button class="btn btn-red" data-q="red">A point to The Reds</button>
        <button class="btn btn-blue" data-q="blue">A point to The Blues</button>
        <button class="btn btn-ghost" data-q="none">No one got it</button>
      </div>`;
  } else if (Quiz.state === 'winner'){
    st.innerHTML = `
      <p class="qcall" style="font-size:clamp(2rem,6vw,3rem)">The ${Quiz.winner === 'red' ? 'Reds' : 'Blues'} win!</p>
      <p class="qtarget">${Quiz.scores.red} — ${Quiz.scores.blue} · a grand contest</p>
      <div class="qbtns">
        <button class="btn btn-primary" data-q="again">Play again</button>
        <button class="btn btn-ghost" data-q="leave">Leave the game</button>
      </div>`;
  }
}

function openJukebox(){
  if (!jukeOverlay.hidden) return;
  pauseAutoForActivity();
  jukeOverlay.hidden = false;
  renderJukebox();
}
function closeJukebox(){
  jukeOverlay.hidden = true;
  resumeAutoAfterActivity();
}
function renderJukebox(){
  if (!Music.tunes) Music.init();
  const list = $('#jukeList');
  list.innerHTML = '';
  Music.tunes.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'juke-t';
    b.dataset.juke = i;
    b.setAttribute('aria-pressed', String(Music.on && Music.tune === t));
    b.textContent = t.name;
    list.append(b);
  });
  const req = $('#jukeReq');
  req.innerHTML = '';
  const hb = document.createElement('button');
  hb.className = 'juke-t';
  hb.dataset.req = 'bday';
  hb.setAttribute('aria-pressed', String(Music.on && Music.tune && Music.tune.name === 'Happy Birthday'));
  hb.textContent = 'Happy Birthday';
  req.append(hb);
  $('#jukeNow').textContent = (Music.on && Music.tune) ? `Now playing — ${Music.tune.name}` : 'The band is resting.';
  $('#jukeVinyl').classList.toggle('paused', !Music.on);
  $('#jukeStop').textContent = Music.on ? 'Rest the band' : 'Strike up the band';
  $('#jukeVol').value = Music.volume;
}

function openBday(){
  bdayPanel.hidden = false;
  const inp = $('#bdayName');
  inp.value = '';
  inp.focus();
}
function celebrate(){
  const name = $('#bdayName').value.trim();
  if (!name){
    $('#bdayName').focus();
    toast("<strong>Who's the lucky one?</strong> Pop a name in first.");
    return;
  }
  bdayPanel.hidden = true;
  $('#bdayNameOut').textContent = name;
  bdayOverlay.hidden = false;
  Confetti.burst();
  setTimeout(() => Confetti.burst(), 1400);
  Music.playOneShot(HAPPY_BIRTHDAY);
  Speech.play([
    { text: `A very happy birthday to ${name}!`, rate: .9, pitch: 1.04, pause: 340 },
    { text: 'Hip hip — hooray!', rate: .95, pitch: 1.1 }
  ], { delay: 500 });
  setTimeout(() => { bdayOverlay.hidden = true; }, 9500);
}

function openActPanel(){
  actPanel.hidden = false;
  actBtn.setAttribute('aria-expanded', 'true');
  $('#actTea').focus();
}
function closeActPanel(){
  actPanel.hidden = true;
  actBtn.setAttribute('aria-expanded', 'false');
  actBtn.focus();
}
function openWinnersPanel(){
  renderWinners();
  winnersPanel.hidden = false;
}
function closeWinnersPanel(){
  winnersPanel.hidden = true;
}

/* ============================== 10. EFFECTS ============================== */
const Confetti = {
  cv: null, ctx: null, parts: [], raf: 0,
  burst(){
    if (reduced) return;
    this.cv = this.cv || $('#confetti');
    this.cv.style.display = 'block';
    this.cv.width = innerWidth; this.cv.height = innerHeight;
    this.ctx = this.cv.getContext('2d');
    this.parts = Array.from({length: 140}, () => ({
      x: rnd() * innerWidth, y: -30 - rnd() * innerHeight * .6,
      vx: (rnd() - .5) * 70, vy: 110 + rnd() * 190,
      r: 5 + rnd() * 8, col: DEC[rndInt(9)], n: rndInt(81),
      ph: rnd() * 6.28, rot: rnd() * 6.28, vr: (rnd() - .5) * 5
    }));
    cancelAnimationFrame(this.raf);
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      const c = this.ctx; c.clearRect(0, 0, this.cv.width, this.cv.height);
      this.parts = this.parts.filter(p => p.y < innerHeight + 40);
      if (!this.parts.length){ this.cv.style.display = 'none'; return; }
      for (const p of this.parts){
        p.y += p.vy * dt; p.x += p.vx * dt + Math.sin(now / 400 + p.ph) * 40 * dt; p.rot += p.vr * dt;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.beginPath(); c.arc(0, 0, p.r, 0, 6.29); c.fillStyle = p.col; c.fill();
        c.beginPath(); c.arc(0, 0, p.r * .6, 0, 6.29); c.fillStyle = '#F8F1E0'; c.fill();
        if (p.r > 6){ c.fillStyle = '#26211A'; c.font = `800 ${p.r * .8}px Archivo`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.n, 0, p.r * .06); }
        c.restore();
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
};

const Snow = {
  cv: null, ctx: null, flakes: [], raf: 0, on: false,
  start(){
    if (reduced) return;
    this.on = true;
    this.cv = this.cv || $('#snow');
    this.cv.style.display = 'block';
    if (!this.flakes.length){
      this.flakes = Array.from({length: 70}, () => ({
        x: rnd() * innerWidth, y: rnd() * innerHeight,
        r: 1 + rnd() * 2.2, v: 18 + rnd() * 34, ph: rnd() * 6.28
      }));
    }
    if (this.raf) return;
    let last = performance.now();
    const loop = now => {
      if (!this.on){ this.raf = 0; return; }
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      this.draw(now, dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  stop(){ this.on = false; if (this.cv) this.cv.style.display = 'none'; },
  draw(now, dt){
    const c = this.ctx || (this.ctx = this.cv.getContext('2d'));
    if (this.cv.width !== innerWidth) this.cv.width = innerWidth;
    if (this.cv.height !== innerHeight) this.cv.height = innerHeight;
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    for (const f of this.flakes){
      f.y += f.v * dt;
      f.x += Math.sin(now / 900 + f.ph) * 16 * dt;
      if (f.y > innerHeight + 6){ f.y = -6; f.x = rnd() * innerWidth; }
      if (f.x > innerWidth + 6) f.x = -6;
      if (f.x < -6) f.x = innerWidth + 6;
      c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.29);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.fill();
      c.lineWidth = .8; c.strokeStyle = 'rgba(110,140,170,.35)'; c.stroke();
    }
  }
};

const Bats = {
  cv: null, ctx: null, bats: [], raf: 0, on: false, spawnT: null, last: 0,
  start(){
    if (reduced) return;
    this.on = true;
    this.cv = this.cv || $('#bats');
    this.cv.style.display = 'block';
    if (!this.spawnT) this.arm();
    if (!this.raf){
      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.loop(t));
    }
  },
  stop(){
    this.on = false;
    clearTimeout(this.spawnT); this.spawnT = null;
    this.bats = [];
    if (this.cv) this.cv.style.display = 'none';
  },
  arm(){
    this.spawnT = setTimeout(() => {
      if (this.on) this.spawn();
      this.arm();
    }, 3600 + rnd() * 5600);
  },
  spawn(){
    const dir = rnd() < .5 ? 1 : -1;
    const y = innerHeight * (.06 + rnd() * .38);
    const n = 2 + rndInt(3);
    for (let i = 0; i < n; i++){
      this.bats.push({
        x: dir > 0 ? -50 - rnd() * 90 : innerWidth + 50 + rnd() * 90,
        y: y + (rnd() - .5) * 90,
        vx: dir * (65 + rnd() * 75),
        ph: rnd() * 6.28,
        flap: rnd() * 6.28,
        s: .8 + rnd() * .9
      });
    }
  },
  loop(now){
    if (!this.on){ this.raf = 0; return; }
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    this.draw(now, dt);
    this.raf = requestAnimationFrame(t => this.loop(t));
  },
  draw(now, dt){
    const c = this.ctx || (this.ctx = this.cv.getContext('2d'));
    if (this.cv.width !== innerWidth) this.cv.width = innerWidth;
    if (this.cv.height !== innerHeight) this.cv.height = innerHeight;
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    this.bats = this.bats.filter(b =>
      b.x > -140 && b.x < innerWidth + 140 && b.y > -120 && b.y < innerHeight + 120);
    for (const b of this.bats){
      b.x += b.vx * dt;
      b.y += Math.sin(now / 650 + b.ph) * 34 * dt;
      b.flap += dt * (9 + Math.abs(Math.sin(b.ph)) * 3);
      this.bat(c, b);
    }
  },
  bat(c, b){
    const wing = Math.sin(b.flap);
    const s = b.s;
    c.save();
    c.translate(b.x, b.y);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-5, -3 - wing * 3, -12, -2 - wing * 6);
    c.quadraticCurveTo(-11, 1 - wing, -8, 2.6 - wing * .6);
    c.quadraticCurveTo(-6, 3.6, -4, 2.4);
    c.quadraticCurveTo(-2, 3.4, 0, 1.4);
    c.quadraticCurveTo(2, 3.4, 4, 2.4);
    c.quadraticCurveTo(6, 3.6, 8, 2.6 - wing * .6);
    c.quadraticCurveTo(11, 1 - wing, 12, -2 - wing * 6);
    c.quadraticCurveTo(5, -3 - wing * 3, 0, 0);
    c.closePath();
    c.fillStyle = '#191226';
    c.fill();
    c.lineWidth = 1 / s;
    c.strokeStyle = 'rgba(190,180,215,.42)';
    c.stroke();
    c.restore();
  }
};

const Hearts = {
  cv: null, ctx: null, parts: [], raf: 0, on: false,
  start(){
    if (reduced) return;
    this.on = true;
    this.cv = this.cv || $('#hearts');
    this.cv.style.display = 'block';
    if (!this.parts.length){
      this.parts = Array.from({length: 26}, () => ({
        x: rnd() * innerWidth, y: rnd() * innerHeight,
        r: 7 + rnd() * 9, v: 14 + rnd() * 22,
        col: rnd() < .5 ? 'rgba(224,82,110,.5)' : 'rgba(232,121,143,.42)',
        ph: rnd() * 6.28, rot: (rnd() - .5) * .7, vr: (rnd() - .5) * .5
      }));
    }
    if (this.raf) return;
    let last = performance.now();
    const loop = now => {
      if (!this.on){ this.raf = 0; return; }
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      this.draw(now, dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  stop(){ this.on = false; if (this.cv) this.cv.style.display = 'none'; },
  draw(now, dt){
    const c = this.ctx || (this.ctx = this.cv.getContext('2d'));
    if (this.cv.width !== innerWidth) this.cv.width = innerWidth;
    if (this.cv.height !== innerHeight) this.cv.height = innerHeight;
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    for (const p of this.parts){
      p.y -= p.v * dt;
      p.x += Math.sin(now / 1100 + p.ph) * 22 * dt;
      p.rot += p.vr * dt;
      if (p.y < -40){ p.y = innerHeight + 30; p.x = rnd() * innerWidth; }
      if (p.x > innerWidth + 40) p.x = -30;
      if (p.x < -40) p.x = innerWidth + 30;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.beginPath();
      c.moveTo(0, p.r * .9);
      c.bezierCurveTo(-p.r * 1.1, p.r * .15, -p.r * .85, -p.r * .8, 0, -p.r * .3);
      c.bezierCurveTo(p.r * .85, -p.r * .8, p.r * 1.1, p.r * .15, 0, p.r * .9);
      c.closePath();
      c.fillStyle = p.col; c.fill();
      c.restore();
    }
  }
};

const Petals = {
  cv: null, ctx: null, parts: [], raf: 0, on: false,
  start(){
    if (reduced) return;
    this.on = true;
    this.cv = this.cv || $('#petals');
    this.cv.style.display = 'block';
    if (!this.parts.length){
      const cols = ['rgba(242,208,107,.85)','rgba(232,143,160,.8)','rgba(253,251,240,.95)','rgba(155,139,196,.75)'];
      this.parts = Array.from({length: 42}, () => ({
        x: rnd() * innerWidth, y: rnd() * innerHeight,
        w: 5 + rnd() * 6, v: 15 + rnd() * 24,
        col: cols[rndInt(cols.length)],
        ph: rnd() * 6.28, rot: rnd() * 6.28, vr: (rnd() - .5) * 2.4
      }));
    }
    if (this.raf) return;
    let last = performance.now();
    const loop = now => {
      if (!this.on){ this.raf = 0; return; }
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      this.draw(now, dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  stop(){ this.on = false; if (this.cv) this.cv.style.display = 'none'; },
  draw(now, dt){
    const c = this.ctx || (this.ctx = this.cv.getContext('2d'));
    if (this.cv.width !== innerWidth) this.cv.width = innerWidth;
    if (this.cv.height !== innerHeight) this.cv.height = innerHeight;
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    for (const p of this.parts){
      p.y += p.v * dt;
      p.x += Math.sin(now / 800 + p.ph) * 20 * dt;
      p.rot += p.vr * dt;
      if (p.y > innerHeight + 12){ p.y = -10; p.x = rnd() * innerWidth; }
      if (p.x > innerWidth + 10) p.x = -8;
      if (p.x < -10) p.x = innerWidth + 8;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.beginPath();
      c.ellipse(0, 0, p.w * .55, p.w, 0, 0, 6.29);
      c.fillStyle = p.col; c.fill();
      c.restore();
    }
  }
};

const Gulls = {
  cv: null, ctx: null, gulls: [], raf: 0, on: false, spawnT: null, last: 0,
  start(){
    if (reduced) return;
    this.on = true;
    this.cv = this.cv || $('#gulls');
    this.cv.style.display = 'block';
    if (!this.spawnT) this.arm();
    if (!this.raf){
      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.loop(t));
    }
  },
  stop(){
    this.on = false;
    clearTimeout(this.spawnT); this.spawnT = null;
    this.gulls = [];
    if (this.cv) this.cv.style.display = 'none';
  },
  arm(){
    this.spawnT = setTimeout(() => {
      if (this.on) this.spawn();
      this.arm();
    }, 7000 + rnd() * 9000);
  },
  spawn(){
    const dir = rnd() < .5 ? 1 : -1;
    const y = innerHeight * (.05 + rnd() * .3);
    const n = 1 + rndInt(2);
    for (let i = 0; i < n; i++){
      this.gulls.push({
        x: dir > 0 ? -60 - rnd() * 110 : innerWidth + 60 + rnd() * 110,
        y: y + (rnd() - .5) * 70,
        vx: dir * (38 + rnd() * 46),
        ph: rnd() * 6.28,
        flap: rnd() * 6.28,
        s: .9 + rnd() * .8
      });
    }
  },
  loop(now){
    if (!this.on){ this.raf = 0; return; }
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    this.draw(now, dt);
    this.raf = requestAnimationFrame(t => this.loop(t));
  },
  draw(now, dt){
    const c = this.ctx || (this.ctx = this.cv.getContext('2d'));
    if (this.cv.width !== innerWidth) this.cv.width = innerWidth;
    if (this.cv.height !== innerHeight) this.cv.height = innerHeight;
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    this.gulls = this.gulls.filter(b =>
      b.x > -160 && b.x < innerWidth + 160 && b.y > -120 && b.y < innerHeight + 120);
    for (const b of this.gulls){
      b.x += b.vx * dt;
      b.y += Math.sin(now / 800 + b.ph) * 26 * dt;
      b.flap += dt * (4.5 + Math.abs(Math.sin(b.ph)) * 2);
      this.gull(c, b);
    }
  },
  gull(c, b){
    const wing = Math.sin(b.flap);
    const s = b.s;
    c.save();
    c.translate(b.x, b.y);
    c.scale(s, s);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-6, -3 - wing * 4, -14, -3 - wing * 7);
    c.quadraticCurveTo(-7, 2.4, 0, 1.6);
    c.quadraticCurveTo(7, 2.4, 14, -3 - wing * 7);
    c.quadraticCurveTo(6, -3 - wing * 4, 0, 0);
    c.closePath();
    c.fillStyle = '#F7F9FB';
    c.fill();
    c.lineWidth = 1.1 / s;
    c.strokeStyle = 'rgba(30,58,76,.5)';
    c.stroke();
    c.restore();
  }
};

/* ---- shared wins ---- */
const TIE_WORDS = { 2:'Double', 3:'Triple', 4:'Quadruple' };
function tieWord(n){ return TIE_WORDS[n] || `${numWords(n)}-way`; }
function tieFlash(kind, winners){
  const n = winners.length;
  const el = $('#tieFlash');
  $('#tieFlashTitle').textContent = `${tieWord(n)} ${kind}!`;
  $('#tieFlashSub').textContent = `Boards ${winners.map(b => b.no).join(' & ')} — all on the same number!`;
  el.classList.toggle('tieflash--many', n > 2);
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, reduced ? 400 : 2400);
}

/* ---- photo moment ---- */
function openPhotoMoment(){
  $('#photoHall').textContent = `${theHall()} Bingo`;
  $('#photoBoard').textContent = lastWinLabel;
  $('#photoDate').textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  photoOverlay.hidden = false;
}

/* ---- attract screen ---- */
const attractScreenEl = $('#attractScreen');
const Attract = { timer: null, tick: null };
function fmtStartTime(){
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2,'0')} ${h < 12 ? 'am' : 'pm'}`;
}
function attractTick(){
  const now = new Date();
  $('#attractTime').textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  $('#attractDate').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
function anyPanelOpen(){
  return !themePanel.hidden || !voicePanel.hidden || !actPanel.hidden || !winnersPanel.hidden ||
         !bdayPanel.hidden || !spotOverlay.hidden || !quizOverlay.hidden || !jukeOverlay.hidden ||
         !teaOverlay.hidden || !helpModal.hidden || !winOverlay.hidden || !photoOverlay.hidden;
}
function showAttract(){
  if ((Game.started && !Game.over) || anyPanelOpen()) return;
  const when = fmtStartTime();
  $('#attractName').textContent = `${theHall()} Bingo`;
  $('#attractKicker').textContent = when ? `Bingo tonight — eyes down at ${when}` : 'Tonight at the hall';
  $('#attractHint').textContent = when ? 'Tap anywhere to take your seat' : 'Tap anywhere to start the game';
  attractTick();
  attractScreenEl.hidden = false;
  Attract.tick = setInterval(attractTick, 1000);
}
function hideAttract(){
  attractScreenEl.hidden = true;
  clearInterval(Attract.tick); Attract.tick = null;
}
function armAttract(){
  clearTimeout(Attract.timer);
  Attract.timer = setTimeout(showAttract, 3 * 60 * 1000);
}

/* ============================== 11. PANELS, WIRING, INIT ============================== */
function populateVoices(){
  const sel = $('#voiceSelect'); if (!sel) return;
  if (!Speech.supported){
    sel.innerHTML = '';
    const o = document.createElement('option');
    o.textContent = 'Speech is not available in this browser';
    sel.append(o);
    $('#voiceHint').textContent = '';
    return;
  }
  const vs = Speech.voices;
  if (!vs.length){
    sel.innerHTML = '';
    const o = document.createElement('option');
    o.textContent = 'Loading voices…';
    sel.append(o);
    $('#voiceHint').textContent = 'Voices can take a moment to appear. If nothing shows, tap elsewhere then open this again.';
    return;
  }
  const english = vs.filter(v => /^en/i.test(v.lang));
  const src = english.length ? english : vs;
  const scored = src.map(v => ({ v, s: Speech.scoreVoice(v) })).sort((a, b) => b.s - a.s);
  sel.innerHTML = '';
  scored.forEach(({ v }) => {
    const o = document.createElement('option');
    o.value = v.voiceURI;
    const q = /natural|neural/i.test(v.name) ? 'natural — lovely' : Speech.scoreVoice(v) >= 120 ? 'good' : 'basic';
    const uk = /^en[-_]GB/i.test(v.lang) ? ' · UK' : '';
    o.textContent = `${v.name} — ${q}${uk}`;
    sel.append(o);
  });
  if (Speech.voice) sel.value = Speech.voice.voiceURI;
  const hasNatural = vs.some(v => /natural|neural/i.test(v.name));
  $('#voiceHint').textContent = hasNatural
    ? 'You have natural-sounding voices on this device — pick one with “natural” after its name for the warmest caller.'
    : 'These voices are a bit robotic. Tip: Microsoft Edge (free, and already on Windows) has wonderfully natural UK voices — Sonia and Ryan. Open this page in Edge, then choose one here.';
}
function rateLabel(r){
  if (r <= .8)  return 'Very leisurely';
  if (r <= .9)  return 'Relaxed';
  if (r < 1)    return 'Steady';
  if (r <= 1.0) return 'Normal';
  if (r <= 1.05)return 'Brisk';
  return 'Very brisk';
}
function testVoice(){
  Speech.play([
    { text: 'Two little ducks,', rate: .88, pitch: .97, pause: 430 },
    { text: 'twenty two!', rate: .94, pitch: 1.05 }
  ], { force: true });
}
function refreshVoicePanel(){
  populateVoices();
  $('#rateRange').value = Speech.rateScale;
  $('#rateOut').textContent = rateLabel(Speech.rateScale);
  $('#voiceMutedNote').hidden = Speech.enabled;
}
function openVoicePanel(){
  refreshVoicePanel();
  voicePanel.hidden = false;
  voiceSettingsBtn.setAttribute('aria-expanded', 'true');
  $('#voiceSelect').focus();
}
function closeVoicePanel(){
  voicePanel.hidden = true;
  voiceSettingsBtn.setAttribute('aria-expanded', 'false');
  voiceSettingsBtn.focus();
}
function syncMusicUI(){
  const mb = $('#musicBtn');
  if (mb) mb.setAttribute('aria-pressed', String(Music.on));
  $$('#musicSeg .seg-b').forEach(b => b.setAttribute('aria-checked', String((b.dataset.on === '1') === Music.on)));
  $('#nowPlaying').textContent = (Music.on && Music.tune)
    ? `Now playing — ${Music.tune.name}`
    : 'The band is resting.';
}
function openThemePanel(){
  syncMusicUI();
  themePanel.hidden = false;
  themeBtn.setAttribute('aria-expanded', 'true');
  $('#musicVol').value = Music.volume;
  $('#modeCards .mode-card').focus();
}
function closeThemePanel(){
  themePanel.hidden = true;
  themeBtn.setAttribute('aria-expanded', 'false');
  themeBtn.focus();
}
function armMusicAutostart(){
  const go = () => {
    AudioHub.init();
    if (Music.prefOn && !Music.on) Music.start();
    syncMusicUI();
  };
  ['pointerdown', 'keydown'].forEach(evt => document.addEventListener(evt, go, { once: true }));
}
function openModal(m){ m.hidden = false; }
function closeModal(m){ m.hidden = true; }
function trap(modal, e){
  if (e.key !== 'Tab') return;
  const f = [...modal.querySelectorAll('button,[href],input,select,textarea')].filter(x => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
}
function buildCallsList(){
  const el = $('#callsList');
  el.innerHTML = Object.entries(CALLS).sort((a, b) => a[0] - b[0])
    .map(([n, c]) => `<div class="call-item"><b>${n}</b><span>${c}</span></div>`).join('');
}

function toggleCalmMode() {
    calmMode = !calmMode;
    document.documentElement.classList.toggle('calm-mode', calmMode);
    const btn = document.getElementById('calmModeBtn');
    if (btn) btn.setAttribute('aria-pressed', String(calmMode));
    try { localStorage.setItem('tb-calm', calmMode ? '1' : '0'); } catch(_){}
    if (calmMode) {
        Confetti.parts = []; // Clear current effects
        Snow.stop(); Bats.stop(); Hearts.stop(); Petals.stop(); Gulls.stop();
    } else {
        // Re-apply seasonal effects if turning back on
        if (season === 'christmas') Snow.start();
        if (season === 'halloween') Bats.start();
        if (season === 'valentines') Hearts.start();
        if (season === 'easter') Petals.start();
        if (season === 'summer') Gulls.start();
    }
}

function updatePromptBanner(text) {
    const banner = document.getElementById('promptBanner');
    if (banner) banner.textContent = text;
}

function injectAccessibilityUI() {
    // 1. What Do I Do? Banner
    const stage = document.querySelector('.stage');
    if (stage && !document.getElementById('promptBanner')) {
        const banner = document.createElement('div');
        banner.id = 'promptBanner';
        banner.className = 'prompt-banner';
        banner.textContent = 'Press the Green Button to Start';
        stage.prepend(banner);
    }

    // 2. Calm Mode Toggle Button
    const topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions && !document.getElementById('calmModeBtn')) {
        const btn = document.createElement('button');
        btn.id = 'calmModeBtn';
        btn.className = 'icon-btn';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('title', 'Toggle Simple/Calm Mode');
        btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>';
        btn.addEventListener('click', toggleCalmMode);
        topbarActions.prepend(btn);
    }

    // 3. Extra Slow Button
    const paceSeg = document.getElementById('paceSeg');
    if (paceSeg && !paceSeg.querySelector('[data-pace="12"]')) {
        const extraSlowBtn = document.createElement('button');
        extraSlowBtn.className = 'seg-b';
        extraSlowBtn.setAttribute('data-mode', 'auto');
        extraSlowBtn.setAttribute('data-pace', '12'); // 12 seconds delay
        extraSlowBtn.setAttribute('aria-checked', 'false');
        extraSlowBtn.textContent = 'Extra Slow';
        paceSeg.append(extraSlowBtn);
    }
}

function wireEvents(){
  startBtn.addEventListener('click', () => {
    const g = Game;
    if (g.holdLine && !g.over){
      g.holdLine = false; g.paused = false; syncControls();
      const sinceLine = performance.now() - g.lineAt;
      updateStatuses();
      if (g.mode === 'auto') scheduleNext(Math.max(1200, 5600 - sinceLine));
      else callMeta.textContent = 'Press “Call the next number” whenever you\u2019re ready.';
      if (sinceLine > 5600) Speech.say("Eyes down — we play on for the full house!", { rate: .9 });
      saveSession();
      return;
    }
    if (!g.started) startGame();
    else if (g.over){ resetGame(); startGame(); }
    else if (g.mode === 'auto'){ g.paused = !g.paused; if (g.paused) clearTimeout(g.timer); else scheduleNext(600); syncControls(); saveSession(); }
  });
  nextBtn.addEventListener('click', () => drawNext());
  newBtn.addEventListener('click', () => resetGame());

  paceSeg.addEventListener('click', e => {
    const b = e.target.closest('.seg-b'); if (!b || b.disabled) return;
    [...paceSeg.children].forEach(x => x.setAttribute('aria-checked', x === b));
    Game.mode = b.dataset.mode; Game.pace = +b.dataset.pace || Game.pace;
    try{ localStorage.setItem('tb-pace', b.dataset.mode === 'manual' ? 'manual' : b.dataset.pace); }catch(_){}
    if (Game.mode === 'manual') clearTimeout(Game.timer);
    else if (Game.started && !Game.paused && !Game.over && !Game.holdLine) scheduleNext(500);
    syncControls();
  });

  $('#pdfBtn').addEventListener('click', boardsPDF);
  $('#printBtn').addEventListener('click', () => { renderPrintBoards(); window.print(); });
  $('#wPrint').addEventListener('click', printPoster);
  $('#wEvening').addEventListener('click', printEveningPoster);

  $('#againBtn').addEventListener('click', () => { winOverlay.hidden = true; resetGame(); startGame(); });
  $('#browseBtn').addEventListener('click', () => { winOverlay.hidden = true; startBtn.focus(); });
  $('#photoBtn').addEventListener('click', openPhotoMoment);
  photoOverlay.addEventListener('click', () => { photoOverlay.hidden = true; });

  /* the hall's name + start time */
  $('#hallNameInput').addEventListener('input', e => {
    hallName = e.target.value.trim();
    try{ localStorage.setItem('tb-hallname', hallName); }catch(_){}
    applyHallName();
  });
  $('#startTimeInput').addEventListener('change', e => {
    startTime = e.target.value || '';
    try{ localStorage.setItem('tb-starttime', startTime); }catch(_){}
  });

  /* attract screen */
  attractScreenEl.addEventListener('click', () => { hideAttract(); armAttract(); });
  document.addEventListener('pointerdown', () => { if (!attractScreenEl.hidden) hideAttract(); armAttract(); }, true);
  document.addEventListener('keydown', () => { if (!attractScreenEl.hidden) hideAttract(); armAttract(); }, true);

  /* say it again */
  repeatBtn.addEventListener('click', sayAgain);
  
  // Any key (Spacebar/Enter) advance for manual mode
  document.addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        const t = (e.target.tagName || '').toUpperCase();
        if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
        if (!attractScreenEl.hidden || anyPanelOpen()) return;
        if (Game.started && Game.mode === 'manual' && !Game.over && !Game.drawing && !Game.holdLine) {
            e.preventDefault();
            drawNext();
        }
    }
  });

  document.addEventListener('keydown', e => {
    if ((e.key === 'r' || e.key === 'R') && !e.repeat){
      const t = (e.target.tagName || '').toUpperCase();
      if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') return;
      if (!attractScreenEl.hidden || anyPanelOpen()) return;
      sayAgain();
    }
  });

   /* the residents roster */
  $('#rosterAdd').addEventListener('click', () => importRoster(false));
  $('#rosterReplace').addEventListener('click', () => importRoster(true));
  $('#dealShuffle').addEventListener('click', () => dealBoards(true));
  $('#dealOrder').addEventListener('click', () => dealBoards(false));
  $('#dealClear').addEventListener('click', () => {
    if (!Object.keys(boardNames).length){ toast('No names on the boards already.'); return; }
    boardNames = {}; pickedResident = null;
    saveNames(); renderNameChips(); renderRoster(); renderPodium();
    toast('<strong>Names cleared.</strong> The boards are anonymous again.');
  });
  $('#rosterChips').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm){
      const i = +rm.dataset.rm, nm = roster[i];
      for (const k of Object.keys(boardNames)) if (boardNames[k] === nm) delete boardNames[k];
      roster.splice(i, 1);
      if (pickedResident === nm) pickedResident = null;
      saveRoster(); saveNames(); renderRoster(); renderNameChips(); renderPodium();
      return;
    }
    const chip = e.target.closest('[data-r]');
    if (chip){
      const nm = roster[+chip.dataset.r];
      pickedResident = (pickedResident === nm) ? null : nm;
      renderRoster();
    }
  });
  $('#nameChips').addEventListener('click', e => {
    const b = e.target.closest('[data-clear]'); if (!b) return;
    delete boardNames[+b.dataset.clear];
    saveNames(); renderNameChips(); renderRoster(); renderPodium();
  });

  /* music quick-toggle + hall panel */
  $('#musicBtn').addEventListener('click', () => Music.toggle());
  $('#musicSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg-b'); if (!b) return;
    const desired = b.dataset.on === '1';
    if (desired !== Music.on) Music.toggle(); else syncMusicUI();
  });
  $('#musicVol').addEventListener('input', e => Music.setVolume(+e.target.value));

  themeBtn.addEventListener('click', () => themePanel.hidden ? openThemePanel() : closeThemePanel());
  $('#themeClose').addEventListener('click', closeThemePanel);
  $('#themeDone').addEventListener('click', closeThemePanel);
  themePanel.addEventListener('click', e => { if (e.target === themePanel) closeThemePanel(); });
  $('#modeCards').addEventListener('click', e => {
    const b = e.target.closest('.mode-card'); if (!b) return;
    setMode(b.dataset.mode);
  });
  $('#contrastToggle').addEventListener('click', () => setContrast(!contrast));

  /* the band */
  $('#bandSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg-b'); if (!b) return;
    setBand(b.dataset.band);
  });

  /* boards in play */
  $('#boardSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg-b'); if (!b || b.disabled) return;
    setBoardCount(+b.dataset.count);
  });
   $('#boardGrid').addEventListener('click', e => {
    const b = e.target.closest('.bchip'); if (!b) return;
    const no = +b.dataset.b;
    if (pickedResident){
      if (!boardOn[no - 1]){
        toast('<strong>That board is off the table.</strong> Switch it on first, then place them.');
        return;
      }
      for (const k of Object.keys(boardNames)) if (boardNames[k] === pickedResident) delete boardNames[k];
      boardNames[no] = pickedResident;
      const placed = pickedResident;
      pickedResident = null;
      saveNames(); renderNameChips(); renderRoster(); renderPodium();
      toast(`<strong>Placed.</strong> ${esc(placed)} is on board ${no}.`);
      return;
    }
    toggleBoard(no);
  });
  $('#allOnBtn').addEventListener('click', allBoardsOn);

  $('#seasonSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg-b'); if (!b) return;
    setSeason(b.dataset.season);
  });
  $('#oneAwayToggle').addEventListener('click', e => {
    oneAwayOn = !oneAwayOn;
    e.currentTarget.setAttribute('aria-pressed', String(oneAwayOn));
    try{ localStorage.setItem('tb-oneaway', oneAwayOn ? '1' : '0'); }catch(_){}
  });

  /* activities */
  actBtn.addEventListener('click', () => actPanel.hidden ? openActPanel() : closeActPanel());
  $('#actClose').addEventListener('click', closeActPanel);
  $('#actDone').addEventListener('click', closeActPanel);
  actPanel.addEventListener('click', e => { if (e.target === actPanel) closeActPanel(); });
  $('#actTea').addEventListener('click', () => { closeActPanel(); openTeaBreak(); });
  $('#actJuke').addEventListener('click', () => { closeActPanel(); openJukebox(); });
  $('#actQuiz').addEventListener('click', () => { closeActPanel(); openQuiz(); });
  $('#actBday').addEventListener('click', () => { closeActPanel(); openBday(); });
  $('#actWinners').addEventListener('click', () => { closeActPanel(); openWinnersPanel(); });
  $('#teaBtn').addEventListener('click', openTeaBreak);

  /* spotlight */
  $('#spotClose').addEventListener('click', () => Spotlight.close());
  $('#spotBack').addEventListener('click', () => Spotlight.close());
  spotOverlay.addEventListener('click', e => { if (e.target === spotOverlay) Spotlight.close(); });

  /* tea break */
  $('#brkEnd').addEventListener('click', () => finishTea(false));
  $('#brkSeg').addEventListener('click', e => {
    const b = e.target.closest('.seg-b'); if (!b) return;
    Tea.endsAt = Date.now() + (+b.dataset.min) * 60000;
    $('#brkCdWrap').hidden = false;
    teaTick();
  });

  /* quiz */
  $('#quizClose').addEventListener('click', closeQuiz);
  quizOverlay.addEventListener('click', e => { if (e.target === quizOverlay) closeQuiz(); });
  $('#quizStage').addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const a = b.dataset.q;
    if (a === 'start' || a === 'again') resetQuiz();
    else if (a === 'reveal'){ Quiz.state = 'revealed'; renderQuiz(); Speech.callNumber(Quiz.num); }
    else if (a === 'red' || a === 'blue') awardQuiz(a);
    else if (a === 'none') nextQuiz();
    else if (a === 'leave') closeQuiz();
  });

  /* jukebox */
  $('#jukeClose').addEventListener('click', closeJukebox);
  jukeOverlay.addEventListener('click', e => { if (e.target === jukeOverlay) closeJukebox(); });
  $('#jukeList').addEventListener('click', e => {
    const b = e.target.closest('[data-juke]'); if (!b) return;
    Music.playIndex(+b.dataset.juke);
    renderJukebox();
  });
  $('#jukeReq').addEventListener('click', e => {
    if (!e.target.closest('[data-req]')) return;
    Music.playOneShot(HAPPY_BIRTHDAY);
    renderJukebox();
  });
  $('#jukeDip').addEventListener('click', () => {
    if (!Music.tunes) Music.init();
    Music.playIndex(rndInt(Music.tunes.length));
    renderJukebox();
  });
  $('#jukeStop').addEventListener('click', () => {
    if (Music.on) Music.stop(); else Music.start();
    Music.prefOn = Music.on;
    try{ localStorage.setItem('tb-music', Music.on ? '1' : '0'); }catch(_){}
    renderJukebox();
  });
  $('#jukeVol').addEventListener('input', e => Music.setVolume(+e.target.value));

  /* birthday */
  $('#bdayClose').addEventListener('click', () => { bdayPanel.hidden = true; });
  $('#bdayDone').addEventListener('click', () => { bdayPanel.hidden = true; });
  bdayPanel.addEventListener('click', e => { if (e.target === bdayPanel) bdayPanel.hidden = true; });
  $('#bdayGo').addEventListener('click', celebrate);
  $('#bdayName').addEventListener('keydown', e => { if (e.key === 'Enter') celebrate(); });

  /* winners */
  $('#wClose').addEventListener('click', closeWinnersPanel);
  $('#wDone').addEventListener('click', closeWinnersPanel);
  winnersPanel.addEventListener('click', e => { if (e.target === winnersPanel) closeWinnersPanel(); });
  $('#wLineName').addEventListener('input', e => {
    if (!Results) return;
    Results.lineName = e.target.value;
    Archive.syncNames(Results);
    renderArchive();
  });
  $('#wHouseName').addEventListener('input', e => {
    if (!Results) return;
    Results.houseName = e.target.value;
    Archive.syncNames(Results);
    renderArchive();
  });
  $('#wClear').addEventListener('click', e => {
    const btn = e.currentTarget;
    if (btn.dataset.armed){
      Archive.clear();
      renderArchive();
      delete btn.dataset.armed;
      btn.textContent = 'Clear the archive';
      toast('<strong>Archive cleared.</strong> A fresh start.');
    } else {
      btn.dataset.armed = '1';
      btn.textContent = 'Really clear it all?';
      setTimeout(() => { delete btn.dataset.armed; btn.textContent = 'Clear the archive'; }, 4000);
    }
  });

  /* voice on/off + settings */
  $('#voiceBtn').addEventListener('click', e => {
    Speech.enabled = !Speech.enabled;
    e.currentTarget.setAttribute('aria-pressed', Speech.enabled);
    try{ localStorage.setItem('tb-voice', Speech.enabled ? '1' : '0'); }catch(_){}
    if (Speech.enabled) Speech.say("Caller's back on!", { rate: .95, pitch: 1.05 });
    else Speech.stop();
    $('#voiceMutedNote').hidden = Speech.enabled;
  });
  voiceSettingsBtn.addEventListener('click', () => {
    voicePanel.hidden ? openVoicePanel() : closeVoicePanel();
  });
  $('#voiceClose').addEventListener('click', closeVoicePanel);
  $('#voiceDone').addEventListener('click', closeVoicePanel);
  voicePanel.addEventListener('click', e => { if (e.target === voicePanel) closeVoicePanel(); });
  $('#voiceSelect').addEventListener('change', e => {
    Speech.setVoice(e.target.value);
    testVoice();
  });
  $('#rateRange').addEventListener('input', e => {
    Speech.setRate(+e.target.value);
    $('#rateOut').textContent = rateLabel(+e.target.value);
  });
  $('#rateRange').addEventListener('change', testVoice);
  $('#voiceTest').addEventListener('click', testVoice);

  $('#helpBtn').addEventListener('click', () => { openModal(helpModal); $('#helpClose').focus(); });
  $('#helpClose').addEventListener('click', () => { closeModal(helpModal); $('#helpBtn').focus(); });
  helpModal.addEventListener('click', e => { if (e.target === helpModal) closeModal(helpModal); });
  helpModal.addEventListener('keydown', e => trap(helpModal, e));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!themePanel.hidden) closeThemePanel();
    else if (!voicePanel.hidden) closeVoicePanel();
    else if (!actPanel.hidden) closeActPanel();
    else if (!winnersPanel.hidden) closeWinnersPanel();
    else if (!bdayPanel.hidden) bdayPanel.hidden = true;
    else if (!photoOverlay.hidden) photoOverlay.hidden = true;
    else if (!spotOverlay.hidden) Spotlight.close();
    else if (!quizOverlay.hidden) closeQuiz();
    else if (!jukeOverlay.hidden) closeJukebox();
    else if (!teaOverlay.hidden) finishTea(false);
    else if (!helpModal.hidden) closeModal(helpModal);
    else if (!winOverlay.hidden) winOverlay.hidden = true;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.started && !Game.paused && !Game.over && !Game.holdLine && Game.mode === 'auto'){
      Game.paused = true; clearTimeout(Game.timer); syncControls(); saveSession();
      toast('<strong>Paused.</strong> The caller waits for no one — but he\u2019ll make an exception.');
    }
  });
}

function loadPrefs(){
  try{
    const v = localStorage.getItem('tb-voice'); if (v != null) Speech.enabled = v === '1';
    const s = localStorage.getItem('tb-sfx'); if (s != null) SFX.enabled = s === '1';
    const p = localStorage.getItem('tb-pace');
    if (p){
      const b = [...paceSeg.children].find(x => p === 'manual' ? x.dataset.mode === 'manual' : x.dataset.pace === p);
      if (b){ [...paceSeg.children].forEach(x => x.setAttribute('aria-checked', x === b));
              Game.mode = b.dataset.mode; Game.pace = +b.dataset.pace || 6; }
    }
    const hn = localStorage.getItem('tb-hallname'); if (hn != null) hallName = hn.trim();
    const stt = localStorage.getItem('tb-starttime'); if (stt != null) startTime = stt;
    const vu = localStorage.getItem('tb-voice-uri'); if (vu) Speech.voiceURI = vu;
    const vr = localStorage.getItem('tb-rate'); if (vr) Speech.rateScale = +vr || 1;
    const md = localStorage.getItem('tb-mode'); if (md && LIBRARIES[md]) mode = md;
    const bd = localStorage.getItem('tb-band'); if (bd && BAND_NAMES[bd]) band = bd;
    const ct = localStorage.getItem('tb-contrast'); if (ct != null) contrast = ct === '1';
    const sn = localStorage.getItem('tb-season');
    if (sn && ['christmas','halloween','valentines','easter','summer'].includes(sn)) season = sn;
    const oa = localStorage.getItem('tb-oneaway'); if (oa != null) oneAwayOn = oa === '1';
    const cm = localStorage.getItem('tb-calm'); if (cm != null) { calmMode = cm === '1'; document.documentElement.classList.toggle('calm-mode', calmMode); }
    const bs = localStorage.getItem('tb-boardset');
    if (bs){
      try{
        const on = JSON.parse(bs);
        if (Array.isArray(on) && on.length){
          boardOn = FIXED_BOARDS.map((_, i) => on.includes(i + 1));
          if (!activeCount()) boardOn = boardOn.map(() => true);
        }
      }catch(_){}
    } else {
      const bc = localStorage.getItem('tb-boards');
      if (bc){
        const n = +bc;
        if (BOARD_OPTIONS.includes(n)) boardOn = FIXED_BOARDS.map((_, i) => i < n);
      }
    }
    const mp = localStorage.getItem('tb-music'); if (mp != null) Music.prefOn = mp === '1';
    const mv = localStorage.getItem('tb-music-vol'); if (mv != null) Music.volume = Math.min(1, Math.max(0, +mv || 0));
  }catch(_){}
  Music.libName = resolveBand();
  syncBandUI();
  $('#voiceBtn').setAttribute('aria-pressed', Speech.enabled);
  $('#sfxBtn').setAttribute('aria-pressed', SFX.enabled);
  $('#oneAwayToggle').setAttribute('aria-pressed', String(oneAwayOn));
  $('#sfxBtn').addEventListener('click', e => {
    SFX.enabled = !SFX.enabled;
    e.currentTarget.setAttribute('aria-pressed', SFX.enabled);
    try{ localStorage.setItem('tb-sfx', SFX.enabled ? '1' : '0'); }catch(_){}
    if (SFX.enabled){ SFX.init(); SFX.pop(); }
  });
}

function init(){
  buildBoard();
  buildCallsList();
  loadPrefs();
  Roller.init(rollerCanvas);

  buildBoards(FIXED_BOARDS.filter((_, i) => boardOn[i]));
  renderPreview();
  renderPodium();
  renderBoardGrid();
  loadNames();
  loadRoster();
  renderNameChips();
  renderRoster();
  updateBoardCountUI();

  Archive.load();
  renderArchive();

  applyHallName();
  applySeasonCopy();
  setMode(mode, true);
  setContrast(contrast);
  setSeason(season, true);
  booted = true;

  const savedGame = readSession();
  resetGame();
  if (savedGame) applySession(savedGame);
  wireEvents();
  Speech.init();
  syncMusicUI();
  armMusicAutostart();
  $('#startTimeInput').value = startTime;
  injectAccessibilityUI();
  armAttract();
}
init();
})();
```
