const realFetch = window.fetch.bind(window);
const sessionKey = "sein_static_demo_session";
const dbName = "sein-handoff-local";
const dbVersion = 1;
const stateKey = "workspace";

const nowIso = () => new Date().toISOString();
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const clone = (v) => structuredClone(v);
const arrays = [
  "equipment","customers","deals","quotes","folders","files","memos","events","sheets","dashboardNotes",
  "cashEntries","cashAccounts","cashCategories","purchases","mailTemplates","mailCampaigns","logs","notifications","jobs"
];

function seedState() {
  const user = { id:"demo-master", name:"로컬 관리자", email:"master@example.test", role:"master", active:true, version:1, permissions:{}, searchPreferences:{recent:[],favorites:[]} };
  return {
    schema:1,
    legacyMigration:null,
    company:{ name:"세인코퍼레이션", englishName:"SEIN CORPORATION", address:"", phone:"", email:"" },
    tags:["확인 필요","견적 요청","물류","완료"],
    categories:[
      { id:"used", name:"중고 설비", type:"business", fixed:true, version:1 },
      { id:"asahi", name:"아사히 세이키", type:"drive", fixed:true, version:1 }
    ],
    users:[user],
    equipment:[], customers:[], deals:[], quotes:[], folders:[], files:[], memos:[], events:[], sheets:[], dashboardNotes:[],
    cashEntries:[], cashAccounts:[], cashCategories:[], purchases:[], mailTemplates:[], mailCampaigns:[], logs:[], notifications:[], jobs:[],
    storageLimitBytes:1_000_000_000,
    __revision:1
  };
}

function ensureState(s) {
  s ||= seedState();
  for (const k of arrays) if (!Array.isArray(s[k])) s[k] = [];
  if (!Array.isArray(s.tags)) s.tags = ["확인 필요","견적 요청","물류","완료"];
  if (!Array.isArray(s.categories)) s.categories = seedState().categories;
  if (!Array.isArray(s.users) || !s.users.length) s.users = seedState().users;
  if (!s.company) s.company = seedState().company;
  if (!s.storageLimitBytes) s.storageLimitBytes = 1_000_000_000;
  if (!s.__revision) s.__revision = 1;
  return s;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, dbVersion);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { const e = tx.error; db.close(); reject(e); };
  });
}

async function loadState() {
  let s = await idbGet(stateKey);
  if (!s) {
    s = seedState();
    await idbSet(stateKey, s);
  }
  return ensureState(s);
}

async function saveState(s) {
  s.__revision = Number(s.__revision || 0) + 1;
  await idbSet(stateKey, s);
  return s;
}

function projectState(s) {
  s = ensureState(clone(s));
  const me = s.users.find(x => x.id === "demo-master") || s.users[0];
  const out = { ...s, me:{...me, searchPreferences:me.searchPreferences || {recent:[],favorites:[]}} };
  delete out.__revision;
  delete out.jobs;
  for (const k of ["equipment","customers","deals","quotes","folders","files","memos","events","sheets","dashboardNotes","categories","cashEntries","purchases"])
    out[k] = (s[k] || []).filter(x => !x.deletedAt);
  out.users = (s.users || []).map(({searchPreferences, ...u}) => u);
  out.trash = [];
  for (const k of ["equipment","customers","folders","files","events","categories"])
    for (const o of (s[k] || []).filter(x => x.deletedAt)) out.trash.push({ id:o.id, type:k, name:o.name || o.model || o.title || "항목", deletedAt:o.deletedAt, version:o.version || 1 });
  out.logs = [...(s.logs || [])].reverse();
  out.notifications = [...(s.notifications || [])].reverse();
  out.storage = {
    used:(s.files || []).reduce((n,f)=>n+(f.referenceOnly?0:Number(f.size||0)),0),
    limit:s.storageLimitBytes || 1_000_000_000
  };
  return out;
}

const reply = (body, status=200) => new Response(JSON.stringify(body), { status, headers:{"Content-Type":"application/json; charset=utf-8"} });
function bodyJson(init) { try { return JSON.parse(init?.body || "{}"); } catch { return {}; } }
function stamp(old, data, userId="demo-master") {
  const now = nowIso();
  return { ...old, ...data, version:Number(old?.version || 0)+1, updatedAt:now, updatedBy:userId, ...(old?.createdAt ? {} : {createdAt:now, createdBy:userId}) };
}
function addLog(s, action, type, targetId, detail="") {
  s.logs.push({ id:uid(), at:nowIso(), userId:"demo-master", action, targetType:type || "system", targetId:targetId || null, detail });
}
function find(s, type, id) { return (s[type] || []).find(x => x.id === id); }
function upsert(s, type, targetId, data, defaults={}) {
  s[type] ||= [];
  if (targetId) {
    const old = find(s,type,targetId);
    if (!old) throw Error("저장할 항목을 찾을 수 없습니다.");
    Object.assign(old, stamp(old, data));
    return old;
  }
  const rec = stamp(null, { id:uid(), lock:"none", ...defaults, ...data });
  s[type].push(rec);
  return rec;
}

function applyCommand(s, cmd) {
  const {action, type, targetId, data={}} = cmd || {};
  if (action === "batch") {
    let resultId;
    for (const c of (data.commands || [])) resultId = applyCommand(s,c).resultId || resultId;
    return {resultId};
  }
  let result;
  if (action === "save") {
    const defaults = {};
    if (type === "deals") Object.assign(defaults,{status:"진행중",ownerId:"demo-master",lines:[]});
    if (type === "folders") Object.assign(defaults,{parentId:null});
    if (type === "events") Object.assign(defaults,{recipients:["demo-master"],channels:[],repeat:{frequency:"none"}});
    if (type === "categories") Object.assign(defaults,{type:"business",fixed:false});
    result = upsert(s,type,targetId,data,defaults);
    addLog(s, targetId ? "수정" : "등록", type, result.id, result.name || result.title || result.model || "");
  } else if (action === "mission-save") {
    const defaults = {};
    if (type === "cashAccounts") Object.assign(defaults,{active:true,kind:"bank",openingBalance:0});
    if (type === "cashCategories") Object.assign(defaults,{active:true,order:Date.now()});
    if (type === "cashEntries") Object.assign(defaults,{cancelled:false,order:Date.now()});
    if (type === "purchases") Object.assign(defaults,{status:"진행중",equipmentIds:[]});
    result = upsert(s,type,targetId,data,defaults);
    addLog(s, targetId ? "수정" : "등록", type, result.id, result.name || result.description || "");
  } else if (action === "mission-cancel") {
    result = find(s,type,targetId); if (!result) throw Error("항목을 찾을 수 없습니다.");
    Object.assign(result, stamp(result,{cancelled:true,cancelReason:String(data.reason||"")}));
    addLog(s,"취소",type,result.id,result.cancelReason);
  } else if (["confirm","correct","cancel"].includes(action) && type === "deals") {
    result = find(s,"deals",targetId); if (!result) throw Error("영업 건을 찾을 수 없습니다.");
    if (action === "confirm") Object.assign(result,{status:"확정",confirmedAt:nowIso(),finalQuoteId:data.quoteId || result.finalQuoteId});
    if (action === "correct") for (const line of (data.lines || [])) { const t=(result.lines||[]).find(x=>x.equipmentId===line.equipmentId&&!x.cancelled); if(t) t.amount=Number(line.amount); }
    if (action === "cancel") { for (const id of (data.equipmentIds || [])) { const t=(result.lines||[]).find(x=>x.equipmentId===id&&!x.cancelled); if(t){t.cancelled=true;t.cancelledAt=nowIso();} } if ((result.lines||[]).length && result.lines.every(x=>x.cancelled)) result.status="취소"; }
    Object.assign(result, stamp(result,{}));
    addLog(s, action === "confirm" ? "판매 확정" : action === "correct" ? "금액 정정" : "판매 취소", "deals", result.id, data.reason || "");
  } else if (action === "lose") {
    result=find(s,"deals",targetId); if(!result) throw Error("영업 건을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{status:"무산"})); addLog(s,"영업 무산","deals",result.id,data.reason||"");
  } else if (action === "lock") {
    result=find(s,type,targetId); if(!result) throw Error("항목을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{lock:data.lock || "none",lockVersion:uid()})); addLog(s,"잠금 변경",type,result.id);
  } else if (action === "delete") {
    result=find(s,type,targetId); if(!result) throw Error("항목을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{deletedAt:nowIso()})); addLog(s,"휴지통 이동",type,result.id);
  } else if (action === "restore") {
    result=find(s,type,targetId); if(!result) throw Error("항목을 찾을 수 없습니다.");
    delete result.deletedAt; Object.assign(result,stamp(result,{})); addLog(s,"복구",type,result.id);
  } else if (action === "file-edit") {
    result=find(s,"files",targetId); if(!result) throw Error("파일을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,data)); addLog(s,"파일 정보 수정","files",result.id);
  } else if (action === "permissions") {
    result=find(s,"users",targetId); if(!result) throw Error("계정을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{permissions:data.permissions || result.permissions,active:data.active !== false})); addLog(s,"권한 변경","users",result.id);
  } else if (action === "tags") {
    const name=String(data.name||"").trim(); if(!name) throw Error("태그를 입력해 주세요.");
    if(data.remove){ s.tags=s.tags.filter(x=>x!==name); for(const m of s.memos) m.tags=(m.tags||[]).filter(x=>x!==name); }
    else if(data.renameTo){ const n=String(data.renameTo).trim(); s.tags=s.tags.map(x=>x===name?n:x); for(const m of s.memos) m.tags=(m.tags||[]).map(x=>x===name?n:x); }
    else if(!s.tags.includes(name)) s.tags.push(name);
    result={id:name};
  } else if (action === "read-notification") {
    result=find(s,"notifications",targetId); if(result) result.read=true;
  } else if (action === "search-preferences") {
    const u=s.users.find(x=>x.id==="demo-master") || s.users[0];
    const p=u.searchPreferences || {recent:[],favorites:[]}; const term=String(data.term||"").trim();
    if(data.operation==="remember"&&term) p.recent=[term,...p.recent.filter(x=>x!==term)].slice(0,10);
    else if(data.operation==="toggle-favorite"&&term) p.favorites=p.favorites.includes(term)?p.favorites.filter(x=>x!==term):[term,...p.favorites].slice(0,20);
    else { if(Array.isArray(data.recent)) p.recent=[...new Set(data.recent)].slice(0,10); if(Array.isArray(data.favorites)) p.favorites=[...new Set(data.favorites)].slice(0,20); }
    u.searchPreferences=p; result={id:u.id};
  } else if (action === "company") {
    s.company={...s.company,...data}; result={id:"company"};
  } else if (action === "costs") {
    result=find(s,"equipment",targetId); if(!result) throw Error("상품을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{costs:(data.rows||[]).map(x=>({name:String(x.name||""),estimated:String(x.estimated||""),actual:String(x.actual||"")}))}));
  } else {
    throw Error("현재 로컬 저장 모드에서 지원하지 않는 작업입니다.");
  }
  return {resultId:result?.id};
}

window.fetch = async (input, init={}) => {
  const raw = typeof input === "string" ? input : input?.url || "";
  const url = new URL(raw, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  try {
    if (url.pathname === "/api/config") return reply({demo:true,company:"세인코퍼레이션",emailConfigured:false,localPersistence:true});
    if (url.pathname === "/api/login") {
      const body=bodyJson(init); if(!body.demo) return reply({error:"로컬 검토용 계정으로 시작해 주세요."},401);
      localStorage.setItem(sessionKey,"1"); return reply({ok:true});
    }
    if (url.pathname === "/api/logout") { localStorage.removeItem(sessionKey); return reply({ok:true}); }
    if (url.pathname === "/api/reset-password") return reply({message:"로컬 저장 모드에서는 비밀번호가 필요하지 않습니다."});
    if (url.pathname === "/api/unlock") return reply({ok:true});
    if (url.pathname === "/api/state") {
      if(localStorage.getItem(sessionKey)!=="1") return reply({error:"로그인이 필요합니다."},401);
      const s=await loadState();
      const requested=init?.headers?.["X-State-Revision"] || init?.headers?.get?.("X-State-Revision");
      const revision=`local-${s.__revision}`;
      if(requested===revision) return reply({unchanged:true,revision});
      return reply({state:projectState(s),digests:{},revision});
    }
    if (url.pathname === "/api/command") {
      if(localStorage.getItem(sessionKey)!=="1") return reply({error:"로그인이 필요합니다."},401);
      const s=await loadState();
      const r=applyCommand(s,bodyJson(init));
      await saveState(s);
      return reply({resultId:r.resultId,state:projectState(s),digests:{},revision:`local-${s.__revision}`});
    }
    if (url.pathname === "/api/rates") return reply({error:"환율 서버가 연결되지 않았습니다."},503);
    return reply({error:"현재 링크에서는 이 기능을 사용할 수 없습니다."},404);
  } catch (e) {
    return reply({error:e?.message || "로컬 저장 중 오류가 발생했습니다."},400);
  }
};