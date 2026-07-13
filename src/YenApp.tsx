// @ts-nocheck
import { useState, useRef, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Supabase ──
const SURL = import.meta.env.VITE_SUPABASE_URL;
const SKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let USER_ID = "default_user";
let SBTOKEN = SKEY;
const AUTH_TIMEOUT_MS = 15000;

const withAuthTimeout = async (promise, message = "認証サーバーから応答がありません。公開URLで再度お試しください。") => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
};

const sbReq = async (method, table, body = null, query = "") => {
  try {
    const res = await fetch(`${SURL}/rest/v1/${table}${query}`, {
      method,
      headers: {
        apikey: SKEY,
        Authorization: `Bearer ${SBTOKEN}`,
        "Content-Type": "application/json",
        Prefer: method === "POST" ? "return=representation" : "",
      },
      body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  } catch { return null; }
};
const loadTable = async (table) => {
  const data = await sbReq("GET", table, null, `?user_id=eq.${USER_ID}&order=created_at.asc`);
  return data ? data.map(r => r.data) : [];
};
const saveTable = async (table, rows) => {
  await sbReq("DELETE", table, null, `?user_id=eq.${USER_ID}`);
  if (rows.length > 0) await sbReq("POST", table, rows.map(r => ({ data: r, user_id: USER_ID })));
};
const loadUser = async () => {
  const data = await sbReq("GET", "userdata", null, `?id=eq.${USER_ID}`);
  return data?.[0]?.data || null;
};
const saveUser = async (payload) => {
  await sbReq("DELETE", "userdata", null, `?id=eq.${USER_ID}`);
  await sbReq("POST", "userdata", { id: USER_ID, data: payload });
};

// ── localStorage hook ──
const useLS = (key, init) => {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const set = v => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, set];
};

// ── Design tokens ──
const C = {
  bg:"transparent", bs:"rgba(255,255,255,0.88)", bc:"#FFFFFF", b2:"#EEF3FF",
  bd:"#C8D8FF", ac:"#3B82F6", aD:"#3B82F620",
  go:"#F59E0B", gr:"#10B981", gD:"#10B98118",
  re:"#EF4444", rD:"#EF444418",
  pu:"#8B5CF6", cy:"#06B6D4",
  t1:"#0F172A", t2:"#475569", t3:"#94A3B8",
  // game accent colors
  g1:"#FF6B6B", g2:"#FFD93D", g3:"#6BCB77", g4:"#4D96FF",
};
const F = `'Fredoka','Nunito','Noto Sans JP',system-ui,sans-serif`;
const M = `'JetBrains Mono',monospace`;
const fmt  = n => "¥" + Number(n).toLocaleString("ja-JP");
const fmtK = n => n >= 100000000 ? (n/100000000).toFixed(1)+"億" : n >= 10000 ? (n/10000).toFixed(1)+"万" : fmt(n);

const TITLES = [
  {id:"beginner",l:"—",c:C.t3,min:0},
  {id:"hustler",l:"Hustler",c:"#22C55E",min:10000},
  {id:"seller",l:"Seller",c:"#2F8BFF",min:100000},
  {id:"closer",l:"Closer",c:"#FFB020",min:500000},
  {id:"millionaire",l:"Millionaire",c:"#FF7A00",min:1000000},
  {id:"tycoon",l:"Tycoon",c:"#A855F7",min:10000000},
  {id:"legend",l:"Legend",c:"#FF3B6B",min:50000000},
];
const getTitle = n => [...TITLES].reverse().find(t => n >= t.min) || TITLES[0];

const card = { background:"linear-gradient(160deg,#FFFFFF 0%,#F0F6FF 100%)", border:`2.5px solid rgba(59,130,246,0.18)`, borderRadius:26, boxShadow:"inset 0 2px 0 rgba(255,255,255,1), 0 8px 0 rgba(59,130,246,0.12), 0 16px 32px -8px rgba(59,130,246,0.22), 0 2px 8px rgba(0,0,0,0.04)" };
const iSt  = { width:"100%", padding:"13px 15px", borderRadius:16, background:"#F0F5FF", border:`2px solid ${C.bd}`, color:C.t1, fontSize:14, outline:"none", fontFamily:F, fontWeight:600, boxSizing:"border-box", boxShadow:"inset 0 2px 6px rgba(59,130,246,0.08)" };
const lbSt = { fontSize:12, color:C.t2, marginBottom:6, display:"block", fontWeight:800, letterSpacing:0.3 };



const TEAM = [
  {name:"田中 太郎",role:"CEO",av:"田",st:"active"},
  {name:"山田 花子",role:"CTO",av:"山",st:"active"},
  {name:"佐藤 一郎",role:"マーケ",av:"佐",st:"idle"},
  {name:"鈴木 美咲",role:"デザイン",av:"鈴",st:"offline"},
];

// ── Atomic UI components ──
const Av = memo(({ name, size=36 }) => {
  const p = [["#2A4B8C","#4F7FFF"],["#8B2A2A","#FF5C5C"],["#1A6B5A","#22C97A"],["#5A2A8B","#A855F7"],["#7A5A1A","#F59E0B"],["#2A5A6B","#06B6D4"]];
  const i = name ? name.charCodeAt(0) % p.length : 0;
  return <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${p[i][0]},${p[i][1]})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:700,color:"#fff",flexShrink:0}}>{name?name[0]:"?"}</div>;
});

const VI = ({size=13}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill={C.ac}/>
    <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TB = ({id}) => {
  const t = TITLES.find(x => x.id === id) || TITLES[0];
  if (t.id === "beginner") return null;
  return <span style={{fontSize:9,color:t.c,background:t.c+"14",borderRadius:3,padding:"2px 6px",fontWeight:600,border:`1px solid ${t.c}28`,letterSpacing:.5,textTransform:"uppercase",fontFamily:M}}>{t.l}</span>;
};

const shadeDark = (hex) => {
  const h = hex.replace("#",""); const n = parseInt(h.length===3?h.split("").map(c=>c+c).join(""):h,16);
  const r=Math.max(0,((n>>16)&255)-40), g=Math.max(0,((n>>8)&255)-40), b=Math.max(0,(n&255)-40);
  return `rgb(${r},${g},${b})`;
};
const Btn = ({onClick,children,color=C.ac,style={}}) => (
  <button onClick={onClick} className="yen-btn3d" style={{padding:"11px 20px",borderRadius:16,border:"none",background:`linear-gradient(180deg,${color} 0%,${shadeDark(color)} 100%)`,color:"#fff",fontSize:14,fontWeight:900,letterSpacing:0.4,cursor:"pointer",boxShadow:`inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -3px 0 ${shadeDark(color)}, 0 5px 0 ${shadeDark(color)}, 0 8px 16px -3px ${color}66`,textShadow:"0 1px 2px rgba(0,0,0,0.2)",...style}}>{children}</button>
);
const OutBtn = ({onClick,children}) => (
  <button onClick={onClick} className="yen-btn3d" style={{padding:"11px 20px",borderRadius:16,border:`2.5px solid ${C.bd}`,background:"linear-gradient(180deg,#FFFFFF,#EEF3FF)",color:C.t2,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 0 rgba(59,130,246,0.15), 0 6px 12px rgba(59,130,246,0.08)"}}>{children}</button>
);


const Spin = ({size=24}) => (
  <div style={{width:size,height:size,borderRadius:"50%",border:`2px solid ${C.ac}`,borderTopColor:"transparent",animation:"yen_spin .8s linear infinite",flexShrink:0}}/>
);

const Empty = ({text}) => (
  <div style={{...card,textAlign:"center",padding:"36px 20px"}}>
    <div style={{fontSize:12,color:C.t3}}>{text}</div>
  </div>
);

const BottomSheet = ({onClose,title,children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.65)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:"linear-gradient(180deg,#FFFFFF 0%,#F0F6FF 100%)",borderRadius:"28px 28px 0 0",width:"100%",maxWidth:480,border:`2.5px solid rgba(59,130,246,0.2)`,borderBottom:"none",padding:"0 0 48px",maxHeight:"90dvh",overflowY:"auto",boxShadow:"0 -8px 32px rgba(59,130,246,0.15)"}}>
      <div style={{width:36,height:4,background:"linear-gradient(90deg,#3B82F6,#8B5CF6)",borderRadius:4,margin:"14px auto 20px"}}/>
      <div style={{padding:"0 20px"}}>
        <div style={{fontSize:17,fontWeight:900,color:C.t1,marginBottom:20}}>{title}</div>
        {children}
      </div>
    </div>
  </div>
);

const FullScreen = ({onClose,title,action,children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:500,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:`1px solid ${C.bd}`,background:C.bs}}>
      <button onClick={onClose} style={{fontSize:13,color:C.t2,background:"transparent",border:"none",cursor:"pointer"}}>✕ 閉じる</button>
      <div style={{fontSize:13,fontWeight:700,color:C.t1}}>{title}</div>
      {action||<div style={{width:60}}/>}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"16px 18px",background:C.bg}}>{children}</div>
  </div>
);

// ─────────────────────────────────────────
// HOME TAB  (defined outside App → stable identity)
// Sub-views are render functions, not components → no hook rule violation
// ─────────────────────────────────────────
const HomeTab = ({
  uname, companyName, genre, monthlyGoal,
  tasks, setTasks, projects, setProjects,
  deals, setDeals, finances, setFinances,
  cashflow, setCashflow, invoices, setInvoices,
  schedule, setSchedule, memos, setMemos,
  competitors, setCompetitors, bmc, setBmc,
}) => {
  const [sub,  setSub]  = useState("hub");

  // ── modals ──
  const [taskModal,  setTaskModal]  = useState(null);
  const [projModal,  setProjModal]  = useState(null);
  const [dealModal,  setDealModal]  = useState(null);
  const [finModal,   setFinModal]   = useState(false);
  const [cfModal,    setCfModal]    = useState(false);
  const [schedModal, setSchedModal] = useState(false);
  const [memoModal,  setMemoModal]  = useState(null);
  const [compModal,  setCompModal]  = useState(null);
  const [invModal,   setInvModal]   = useState(null);
  

  // ── forms ──
  const [tf,  setTf]  = useState({text:"",priority:"medium",assignee:"田",projectId:null,due:"",note:""});
  const [pf,  setPf]  = useState({name:"",status:"進行中",due:"",color:C.ac,desc:""});
  const [df,  setDf]  = useState({company:"",contact:"",stage:"リード",value:"",due:"",prob:50,note:""});
  const [ff,  setFf]  = useState({type:"revenue",amount:"",label:"",tag:"売上"});
  const [cff, setCff] = useState({label:"",amount:"",type:"in",date:"",recurring:false});
  const [sf,  setSf]  = useState({title:"",date:"",time:"",duration:60,location:"Zoom",attendees:[]});
  const [mf,  setMf]  = useState({title:"",content:"",tag:"メモ"});
  const [cf,  setCf]  = useState({name:"",strength:"",weakness:"",share:"中",rating:3});
  const [ivf, setIvf] = useState({company:"",amount:"",due:"",note:"",status:"未送付"});

  // ── view-local filter states (lifted here to avoid component identity issues) ──
  const [taskFilter, setTaskFilter] = useState("all");
  const [crmFilter,  setCrmFilter]  = useState("all");
  const [finFilter,  setFinFilter]  = useState("all");


  // ── computed ──
  const totalRev = finances.filter(f=>f.type==="revenue").reduce((a,b)=>a+b.amount,0);
  const totalExp = finances.filter(f=>f.type==="expense").reduce((a,b)=>a+b.amount,0);
  const pipeline = deals.reduce((a,b)=>a+b.value*(b.prob/100),0);
  const pendingInv = invoices.filter(i=>i.status==="入金待ち");

  const priC = {high:C.re,medium:C.go,low:C.t3};
  const priL = {high:"高",medium:"中",low:"低"};
  const stgC = {"リード":C.t2,"提案中":C.go,"商談":C.ac,"見積":C.pu,"クローズ":C.gr};
  const stC  = {"進行中":C.ac,"最終確認":C.gr,"完了":C.t3,"保留":C.go};
  const invStC = {"未送付":C.t3,"送付済み":C.go,"入金待ち":C.ac,"入金済み":C.gr,"キャンセル":C.re};
  const shrC = {"大":C.re,"中":C.go,"小":C.gr};

  const toggleTask = id => setTasks(p=>p.map(x=>x.id===id?{...x,done:!x.done}:x));
  const updProg = (id,v) => setProjects(p=>p.map(x=>x.id===id?{...x,progress:Math.max(0,Math.min(100,v))}:x));

  const saveTask = () => {
    if (!tf.text.trim()) return;
    taskModal==="new" ? setTasks(p=>[...p,{...tf,id:Date.now(),done:false}]) : setTasks(p=>p.map(x=>x.id===taskModal.id?{...x,...tf}:x));
    setTaskModal(null);
  };
  const saveProj = () => {
    if (!pf.name.trim()) return;
    projModal==="new" ? setProjects(p=>[...p,{...pf,id:Date.now(),progress:0}]) : setProjects(p=>p.map(x=>x.id===projModal.id?{...x,...pf}:x));
    setProjModal(null);
  };
  const saveDeal = () => {
    if (!df.company.trim()) return;
    dealModal==="new" ? setDeals(p=>[...p,{...df,id:Date.now(),value:parseInt(df.value)||0}]) : setDeals(p=>p.map(x=>x.id===dealModal.id?{...x,...df,value:parseInt(df.value)||0}:x));
    setDealModal(null);
  };
  const saveFin = () => {
    if (!ff.amount||!ff.label.trim()) return;
    const now = new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
    setFinances(p=>[{id:Date.now(),...ff,amount:parseInt(ff.amount),date:now},...p]);
    setFinModal(false);
    setFf({type:"revenue",amount:"",label:"",tag:"売上"});
  };
  const saveCf = () => {
    if (!cff.label.trim()||!cff.amount) return;
    setCashflow(p=>[...p,{...cff,id:Date.now(),amount:parseInt(cff.amount)}]);
    setCfModal(false);
    setCff({label:"",amount:"",type:"in",date:"",recurring:false});
  };
  const saveSched = () => {
    if (!sf.title.trim()||!sf.date) return;
    setSchedule(p=>[...p,{id:Date.now(),...sf,done:false}]);
    setSchedModal(false);
    setSf({title:"",date:"",time:"",duration:60,location:"Zoom",attendees:[]});
  };
  const saveMemo = () => {
    if (!mf.title.trim()) return;
    const now = new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
    memoModal==="new" ? setMemos(p=>[{id:Date.now(),...mf,updated:now},...p]) : setMemos(p=>p.map(x=>x.id===memoModal.id?{...x,...mf,updated:now}:x));
    setMemoModal(null);
  };
  const saveComp = () => {
    if (!cf.name.trim()) return;
    compModal==="new" ? setCompetitors(p=>[...p,{...cf,id:Date.now()}]) : setCompetitors(p=>p.map(x=>x.id===compModal.id?{...x,...cf}:x));
    setCompModal(null);
  };
  const saveInv = () => {
    if (!ivf.company.trim()||!ivf.amount) return;
    const now = new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
    invModal==="new" ? setInvoices(p=>[...p,{...ivf,id:Date.now(),amount:parseInt(ivf.amount),issued:now}]) : setInvoices(p=>p.map(x=>x.id===invModal.id?{...x,...ivf,amount:parseInt(ivf.amount)}:x));
    setInvModal(null);
  };


  const SUBTABS = [];
  const headerAction = {};


  // ──────── render functions (NOT components – avoids hook rule issues) ────────

  const renderHub = () => {
    const now = new Date();
    const days = ["日","月","火","水","木","金","土"];
    const dateStr = `${now.getMonth()+1}/${now.getDate()} ${days[now.getDay()]}`;

    // ── Founder metrics ──
    const cashIn  = cashflow.filter(c=>c.type==="in").reduce((a,b)=>a+b.amount,0);
    const cashOut = cashflow.filter(c=>c.type==="out").reduce((a,b)=>a+b.amount,0);
    const cashBalance = cashIn - cashOut + (totalRev - totalExp);
    const monthlyBurn = cashflow.filter(c=>c.type==="out"&&c.recurring).reduce((a,b)=>a+b.amount,0)
      || (cashOut > 0 ? cashOut/6 : 0)
      || (totalExp > 0 ? totalExp/3 : 0);
    const runwayMonths = monthlyBurn>0 ? cashBalance/monthlyBurn : 0;
    const runwayLabel = cashBalance<=0 ? "—" : monthlyBurn<=0 ? "∞" : runwayMonths>=24 ? "24m+" : `${runwayMonths.toFixed(1)}m`;
    const runwayColor = cashBalance<=0 ? C.re : runwayMonths<3 ? C.re : runwayMonths<6 ? C.go : C.gr;

    const ideaCount = memos.length;
    const unpaidCount = invoices.filter(i=>i.status!=="入金済").length;
    const unpaidAmount = invoices.filter(i=>i.status!=="入金済").reduce((a,b)=>a+(b.amount||0),0);

    const seeds = [...memos, ...invoices, ...cashflow, ...finances]
      .map(x=>x.id).filter(Boolean).sort((a,b)=>a-b);
    const dayNum = seeds.length > 0
      ? Math.max(1, Math.floor((Date.now() - seeds[0]) / 86400000) + 1)
      : 1;

    return (
      <div style={{padding:16}}>
        {/* Founder header */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:C.t3,fontWeight:800,fontFamily:M,letterSpacing:1.5,marginBottom:4}}>DAY {dayNum} · {dateStr}</div>
          <div style={{fontSize:22,fontWeight:900,color:C.t1,letterSpacing:-0.5,marginBottom:2}}>{uname||"Founder"}</div>
          <div style={{fontSize:12,color:C.t2,fontWeight:700}}>{companyName||"stealth"}{genre?` · ${genre}`:""}</div>
        </div>

        {/* Metrics */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[
            {l:"RUNWAY",   v:runwayLabel,             d:`残高 ${fmtK(Math.max(0,cashBalance))}`, c:runwayColor},
            {l:"REVENUE",  v:fmtK(totalRev),          d:`純利 ${fmtK(totalRev-totalExp)}`,       c:C.gr},
            {l:"UNPAID",   v:fmtK(unpaidAmount),      d:`${unpaidCount} 請求 未回収`,            c:C.go},
            {l:"IDEAS",    v:`${ideaCount}`,          d:`アイデア在庫`,                          c:C.pu},
          ].map((k,i)=>(
            <div key={i} style={{...card,padding:"13px 14px"}}>
              <div style={{fontSize:9,color:C.t3,fontWeight:900,letterSpacing:1.5,fontFamily:M,marginBottom:6}}>{k.l}</div>
              <div style={{fontSize:20,fontWeight:900,color:k.c,fontFamily:M,letterSpacing:-0.5,marginBottom:2}}>{k.v}</div>
              <div style={{fontSize:10,color:C.t3,fontWeight:700}}>{k.d}</div>
            </div>
          ))}
        </div>

        {/* Quick create */}
        <div style={{fontSize:10,color:C.t3,fontWeight:900,marginBottom:8,letterSpacing:1.5,fontFamily:M}}>CREATE</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {[
            {l:"アイデア",   c:C.pu, fn:()=>{setMf({title:"",content:"",tag:"アイデア"});setMemoModal("new");}},
            {l:"資金繰り",   c:C.cy, fn:()=>setCfModal(true)},
            {l:"請求",       c:C.go, fn:()=>{setIvf({company:"",amount:"",due:"",note:"",status:"未送付"});setInvModal("new");}},
          ].map((a,i)=>(
            <button key={i} onClick={a.fn} style={{...card,padding:"11px 8px",cursor:"pointer",fontSize:11,fontWeight:800,color:a.c,borderLeft:`3px solid ${a.c}`}}>
              + {a.l}
            </button>
          ))}
        </div>

        {/* Ideas */}
        {memos.length>0 && (
          <>
            <div style={{fontSize:10,color:C.t3,fontWeight:900,marginBottom:8,letterSpacing:1.5,fontFamily:M}}>IDEAS</div>
            {memos.slice(0,5).map(m=>(
              <div key={m.id} onClick={()=>{setMf({title:m.title,content:m.content,tag:m.tag});setMemoModal(m);}} style={{...card,padding:"11px 13px",marginBottom:7,cursor:"pointer",borderLeft:`3px solid ${C.pu}`}}>
                <div style={{fontSize:12,fontWeight:800,color:C.t1,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
                {m.content && <div style={{fontSize:10,color:C.t3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.content}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };



  const renderTasks = () => {
    const filtered = tasks.filter(t=>taskFilter==="all"?true:taskFilter==="active"?!t.done:t.done);
    return (
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[{id:"all",l:"すべて"},{id:"active",l:"進行中"},{id:"done",l:"完了"}].map(x=>(
            <button key={x.id} onClick={()=>setTaskFilter(x.id)} style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid ${taskFilter===x.id?C.ac:C.bd}`,background:taskFilter===x.id?C.aD:"transparent",color:taskFilter===x.id?C.ac:C.t2,cursor:"pointer"}}>{x.l}</button>
          ))}
        </div>
        {filtered.map(t=>{
          const proj = projects.find(p=>p.id===t.projectId);
          return (
            <div key={t.id} style={{...card,marginBottom:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <button onClick={()=>toggleTask(t.id)} style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${t.done?C.gr:C.bd}`,background:t.done?C.gr:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:2}}>
                  {t.done&&<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </button>
                <div style={{flex:1}} onClick={()=>{setTf({...t});setTaskModal(t);}}>
                  <div style={{fontSize:13,fontWeight:600,color:t.done?C.t3:C.t1,textDecoration:t.done?"line-through":"none",marginBottom:5}}>{t.text}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:9,color:priC[t.priority],background:priC[t.priority]+"14",borderRadius:4,padding:"2px 6px",fontWeight:700}}>{priL[t.priority]}優先</span>
                    {proj&&<span style={{fontSize:9,color:proj.color,background:proj.color+"14",borderRadius:4,padding:"2px 6px"}}>{proj.name}</span>}
                    {t.due&&<span style={{fontSize:10,color:C.t3}}>期限 {t.due}</span>}
                  </div>
                </div>
                <div style={{width:24,height:24,borderRadius:"50%",background:C.b2,border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.t2,fontWeight:600,flexShrink:0}}>{t.assignee}</div>
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<Empty text="タスクがありません"/>}
      </div>
    );
  };

  const renderProjects = () => (
    <div style={{padding:16}}>
      {projects.map(p=>{
        const pt=tasks.filter(t=>t.projectId===p.id);const dt=pt.filter(t=>t.done).length;
        return (
          <div key={p.id} style={{...card,marginBottom:12,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:4}}>{p.name}</div>
                {p.desc&&<div style={{fontSize:11,color:C.t2,marginBottom:6,lineHeight:1.6}}>{p.desc}</div>}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:stC[p.status]||C.ac,background:(stC[p.status]||C.ac)+"14",borderRadius:4,padding:"2px 7px",fontWeight:600}}>{p.status}</span>
                  {p.due&&<span style={{fontSize:10,color:C.t3}}>期限 {p.due}</span>}
                </div>
              </div>
              <button onClick={()=>{setPf({...p});setProjModal(p);}} style={{width:30,height:30,borderRadius:8,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.t3} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{flex:1,height:4,background:C.b2,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${p.progress}%`,background:p.color,borderRadius:2,transition:"width .4s"}}/>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>updProg(p.id,p.progress-5)} style={{width:22,height:22,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",color:C.t2,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontSize:12,fontWeight:700,color:p.color,fontFamily:M,width:36,textAlign:"center"}}>{p.progress}%</span>
                <button onClick={()=>updProg(p.id,p.progress+5)} style={{width:22,height:22,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",color:C.t2,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
              </div>
            </div>
            {pt.length>0&&(
              <div style={{borderTop:`1px solid ${C.bd}`,paddingTop:10}}>
                <div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>タスク {dt}/{pt.length}</div>
                {pt.map((t,i)=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<pt.length-1?`1px solid ${C.bd}`:"none"}}>
                    <button onClick={()=>toggleTask(t.id)} style={{width:15,height:15,borderRadius:"50%",border:`1.5px solid ${t.done?C.gr:C.bd}`,background:t.done?C.gr:"transparent",cursor:"pointer",flexShrink:0}}/>
                    <div style={{flex:1,fontSize:12,color:t.done?C.t3:C.t1,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
                    <div style={{width:20,height:20,borderRadius:"50%",background:C.b2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.t2}}>{t.assignee}</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>{setTf({text:"",priority:"medium",assignee:"田",projectId:p.id,due:"",note:""});setTaskModal("new");}} style={{width:"100%",marginTop:10,padding:"7px",borderRadius:7,border:`1px dashed ${C.bd}`,background:"transparent",color:C.t3,fontSize:11,cursor:"pointer"}}>+ タスクを追加</button>
          </div>
        );
      })}
      {projects.length===0&&<Empty text="プロジェクトがありません"/>}
    </div>
  );

  const renderCRM = () => {
    const filtered = crmFilter==="all" ? deals : deals.filter(d=>d.stage===crmFilter);
    return (
      <div style={{padding:16}}>
        <div style={{...card,padding:"13px 16px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
          <div><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>PIPELINE 期待値</div><div style={{fontSize:22,fontWeight:700,color:C.gr,fontFamily:M}}>+{fmtK(pipeline)}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>ACTIVE DEALS</div><div style={{fontSize:22,fontWeight:700,color:C.t1,fontFamily:M}}>{deals.length}件</div></div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
          {[{id:"all",l:"すべて"},...["リード","提案中","商談","見積","クローズ"].map(s=>({id:s,l:s}))].map(x=>(
            <button key={x.id} onClick={()=>setCrmFilter(x.id)} style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid ${crmFilter===x.id?stgC[x.id]||C.ac:C.bd}`,background:crmFilter===x.id?(stgC[x.id]||C.ac)+"18":"transparent",color:crmFilter===x.id?stgC[x.id]||C.ac:C.t2,cursor:"pointer",flexShrink:0}}>{x.l}</button>
          ))}
        </div>
        {filtered.map(d=>(
          <div key={d.id} style={{...card,marginBottom:10,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:3}}>{d.company}</div>
                <div style={{fontSize:11,color:C.t2,marginBottom:6}}>{d.contact}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:stgC[d.stage],background:stgC[d.stage]+"14",borderRadius:4,padding:"2px 7px",fontWeight:600}}>{d.stage}</span>
                  {d.due&&<span style={{fontSize:10,color:C.t3}}>期限 {d.due}</span>}
                  <span style={{fontSize:10,color:C.t3}}>確率 {d.prob}%</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                <div style={{fontSize:16,fontWeight:700,color:C.go,fontFamily:M}}>{fmtK(d.value)}</div>
                <div style={{fontSize:10,color:C.gr,fontWeight:600,marginTop:2}}>≒{fmtK(d.value*(d.prob/100))}</div>
              </div>
            </div>
            {d.note&&<div style={{fontSize:11,color:C.t3,background:C.b2,borderRadius:8,padding:"8px 10px",marginBottom:8}}>{d.note}</div>}
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              {["リード","提案中","商談","見積","クローズ"].map(s=>(
                <button key={s} onClick={()=>setDeals(p=>p.map(x=>x.id===d.id?{...x,stage:s}:x))} style={{flex:1,padding:"6px 0",borderRadius:6,border:`1px solid ${d.stage===s?stgC[s]:C.bd}`,background:d.stage===s?stgC[s]+"18":"transparent",color:d.stage===s?stgC[s]:C.t3,fontSize:9,fontWeight:600,cursor:"pointer"}}>{s}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6,borderTop:`1px solid ${C.bd}`,paddingTop:10}}>
              <button onClick={()=>{setDf({...d,value:String(d.value)});setDealModal(d);}} style={{flex:1,padding:"7px 12px",borderRadius:8,border:`1px solid ${C.bd}`,background:"transparent",color:C.t2,fontSize:11,cursor:"pointer"}}>編集</button>
            </div>
          </div>
        ))}
        {filtered.length===0&&<Empty text="案件がありません"/>}
      </div>
    );
  };

  const renderFinance = () => {
    const filtered = finFilter==="all" ? finances : finances.filter(x=>x.type===finFilter);
    return (
      <div style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{...card,padding:14,borderColor:C.gr+"40"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>REVENUE</div><div style={{fontSize:20,fontWeight:700,color:C.gr,fontFamily:M}}>+{fmtK(totalRev)}</div></div>
          <div style={{...card,padding:14,borderColor:C.re+"40"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>BURN</div><div style={{fontSize:20,fontWeight:700,color:C.re,fontFamily:M}}>-{fmtK(totalExp)}</div></div>
        </div>
        <div style={{...card,padding:"13px 16px",marginBottom:14,borderColor:(totalRev-totalExp)>=0?C.gr+"40":C.re+"40"}}>
          <div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:4,textTransform:"uppercase"}}>NET</div>
          <div style={{fontSize:24,fontWeight:700,color:(totalRev-totalExp)>=0?C.gr:C.re,fontFamily:M}}>{(totalRev-totalExp)>=0?"+":""}{fmtK(totalRev-totalExp)}</div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[{id:"all",l:"すべて"},{id:"revenue",l:"収入"},{id:"expense",l:"支出"}].map(x=>(
            <button key={x.id} onClick={()=>setFinFilter(x.id)} style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,border:`1px solid ${finFilter===x.id?C.ac:C.bd}`,background:finFilter===x.id?C.aD:"transparent",color:finFilter===x.id?C.ac:C.t2,cursor:"pointer"}}>{x.l}</button>
          ))}
        </div>
        {filtered.map(f2=>(
          <div key={f2.id} style={{...card,display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"12px 14px",borderLeft:`2px solid ${f2.type==="revenue"?C.gr:C.re}`}}>
            <div style={{width:34,height:34,borderRadius:8,background:f2.type==="revenue"?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{f2.type==="revenue"?"↑":"↓"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:2}}>{f2.label}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:9,color:C.t3,background:C.b2,borderRadius:4,padding:"1px 6px"}}>{f2.tag}</span>
                <span style={{fontSize:10,color:C.t3}}>{f2.date}</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:14,fontWeight:700,color:f2.type==="revenue"?C.gr:C.re,fontFamily:M,flexShrink:0}}>{f2.type==="revenue"?"+":"-"}{fmtK(f2.amount)}</div>
              <button onClick={()=>setFinances(p=>p.filter(x=>x.id!==f2.id))} style={{width:22,height:22,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        ))}
        {filtered.length===0&&<Empty text="データがありません"/>}
      </div>
    );
  };

  const renderCashflow = () => {
    const sorted = [...cashflow].sort((a,b)=>{
      const da=a.date?parseInt(a.date.replace("/",""),10):0;
      const db=b.date?parseInt(b.date.replace("/",""),10):0;
      return da-db;
    });
    const totalIn  = cashflow.filter(c=>c.type==="in").reduce((a,b)=>a+b.amount,0);
    const totalOut = cashflow.filter(c=>c.type==="out").reduce((a,b)=>a+b.amount,0);
    const balance  = totalIn-totalOut;
    let running=0;
    const withBal = sorted.map(c=>{running+=c.type==="in"?c.amount:-c.amount;return{...c,balance:running};});
    return (
      <div style={{padding:16}}>
        <div style={{...card,padding:14,marginBottom:12}}>
          <div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:4,textTransform:"uppercase"}}>RUNWAY 予測</div>
          <div style={{fontSize:28,fontWeight:700,color:balance>=0?C.gr:C.re,fontFamily:M,marginBottom:12}}>{balance>=0?"+":""}{fmtK(balance)}</div>
          <div style={{display:"flex"}}>
            <div style={{flex:1,paddingRight:16}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:4,textTransform:"uppercase"}}>入金予定</div><div style={{fontSize:16,fontWeight:700,color:C.gr,fontFamily:M}}>+{fmtK(totalIn)}</div></div>
            <div style={{flex:1,paddingLeft:16,borderLeft:`1px solid ${C.bd}`}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:4,textTransform:"uppercase"}}>出金予定</div><div style={{fontSize:16,fontWeight:700,color:C.re,fontFamily:M}}>-{fmtK(totalOut)}</div></div>
          </div>
        </div>
        {withBal.map((c,i)=>(
          <div key={c.id} style={{...card,marginBottom:8,padding:"12px 14px",borderLeft:`2px solid ${c.type==="in"?C.gr:C.re}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:c.type==="in"?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.type==="in"?"↑":"↓"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{c.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:c.type==="in"?C.gr:C.re,fontFamily:M,flexShrink:0,marginLeft:8}}>{c.type==="in"?"+":"-"}{fmtK(c.amount)}</div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:C.t3}}>{c.date}</span>
                    {c.recurring&&<span style={{fontSize:9,color:C.ac,background:C.aD,borderRadius:4,padding:"1px 5px"}}>毎月</span>}
                  </div>
                  <div style={{fontSize:10,color:C.t3,fontFamily:M}}>残高 {fmtK(c.balance)}</div>
                </div>
              </div>
              <button onClick={()=>setCashflow(p=>p.filter(x=>x.id!==c.id))} style={{width:22,height:22,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        ))}
        {cashflow.length===0&&<Empty text="キャッシュフローがありません"/>}
      </div>
    );
  };

  const renderSchedule = () => (
    <div style={{padding:16}}>
      {schedule.map(s=>(
        <div key={s.id} style={{...card,marginBottom:10,padding:14,opacity:s.done?.5:1}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:C.t1,marginBottom:5}}>{s.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <span style={{fontSize:11,color:C.ac,fontFamily:M,fontWeight:600}}>{s.date} {s.time}</span>
                <span style={{fontSize:10,color:C.t3}}>{s.duration}分</span>
                <span style={{fontSize:10,color:C.t2}}>📍 {s.location}</span>
              </div>
              {s.attendees.length>0&&<div style={{display:"flex",gap:4}}>{s.attendees.map(a=><Av key={a} name={a} size={22}/>)}</div>}
            </div>
            <button onClick={()=>setSchedule(p=>p.map(x=>x.id===s.id?{...x,done:!x.done}:x))} style={{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${s.done?C.gr:C.bd}`,background:s.done?C.gr:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              {s.done&&<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </button>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setSchedule(p=>p.filter(x=>x.id!==s.id))} style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${C.re}20`,background:C.rD,color:C.re,fontSize:11,cursor:"pointer"}}>削除</button>
          </div>
        </div>
      ))}
      {schedule.length===0&&<Empty text="予定がありません"/>}
    </div>
  );

  const renderMemos = () => (
    <div style={{padding:16}}>
      {memos.map(m=>(
        <div key={m.id} onClick={()=>{setMf({title:m.title,content:m.content,tag:m.tag});setMemoModal(m);}} style={{...card,marginBottom:10,padding:14,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{fontSize:14,fontWeight:600,color:C.t1}}>{m.title}</div>
            <span style={{fontSize:9,color:C.ac,background:C.aD,borderRadius:4,padding:"2px 7px",flexShrink:0,marginLeft:8}}>{m.tag}</span>
          </div>
          <div style={{fontSize:12,color:C.t2,lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{m.content}</div>
          <div style={{fontSize:10,color:C.t3,marginTop:8}}>{m.updated}</div>
        </div>
      ))}
      {memos.length===0&&<Empty text="メモがありません"/>}
    </div>
  );


  const renderInvoice = () => {
    const totalPending = invoices.filter(i=>i.status==="入金待ち").reduce((a,b)=>a+b.amount,0);
    const totalDone    = invoices.filter(i=>i.status==="入金済み").reduce((a,b)=>a+b.amount,0);
    return (
      <div style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <div style={{...card,padding:14,borderColor:C.ac+"40"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>入金待ち</div><div style={{fontSize:20,fontWeight:700,color:C.ac,fontFamily:M}}>{fmtK(totalPending)}</div></div>
          <div style={{...card,padding:14,borderColor:C.gr+"40"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>入金済み</div><div style={{fontSize:20,fontWeight:700,color:C.gr,fontFamily:M}}>{fmtK(totalDone)}</div></div>
        </div>
        {invoices.map(inv=>(
          <div key={inv.id} style={{...card,marginBottom:10,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:4}}>{inv.company}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:invStC[inv.status],background:invStC[inv.status]+"14",borderRadius:4,padding:"2px 7px",fontWeight:600}}>{inv.status}</span>
                  <span style={{fontSize:10,color:C.t3}}>発行 {inv.issued}</span>
                  {inv.due&&<span style={{fontSize:10,color:C.t3}}>期限 {inv.due}</span>}
                </div>
                {inv.note&&<div style={{fontSize:11,color:C.t3,marginTop:6}}>{inv.note}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                <div style={{fontSize:16,fontWeight:700,color:C.go,fontFamily:M}}>{fmtK(inv.amount)}</div>
                <button onClick={()=>{setIvf({company:inv.company,amount:String(inv.amount),due:inv.due||"",note:inv.note||"",status:inv.status});setInvModal(inv);}} style={{marginTop:6,padding:"4px 10px",borderRadius:7,border:`1px solid ${C.bd}`,background:"transparent",color:C.t2,fontSize:11,cursor:"pointer"}}>編集</button>
              </div>
            </div>
            <div style={{display:"flex",gap:5}}>
              {["未送付","送付済み","入金待ち","入金済み"].map(s=>(
                <button key={s} onClick={()=>setInvoices(p=>p.map(x=>x.id===inv.id?{...x,status:s}:x))} style={{flex:1,padding:"6px 0",borderRadius:6,border:`1px solid ${inv.status===s?invStC[s]:C.bd}`,background:inv.status===s?invStC[s]+"18":"transparent",color:inv.status===s?invStC[s]:C.t3,fontSize:9,fontWeight:600,cursor:"pointer"}}>{s}</button>
              ))}
            </div>
          </div>
        ))}
        {invoices.length===0&&<Empty text="請求書がありません"/>}
      </div>
    );
  };

  // ─── main render ───
  return (
    <div style={{background:C.bg,minHeight:"100%"}}>

      {/* ── Task Modal ── */}
      {taskModal!==null&&(
        <BottomSheet onClose={()=>setTaskModal(null)} title={taskModal==="new"?"タスクを作成":"タスクを編集"}>
          <label style={lbSt}>タスク名</label>
          <input style={{...iSt,marginBottom:14}} placeholder="タスクを入力..." value={tf.text} onChange={e=>setTf(p=>({...p,text:e.target.value}))} autoFocus/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div>
              <label style={lbSt}>優先度</label>
              <div style={{display:"flex",gap:5}}>
                {["high","medium","low"].map(pr=>(
                  <button key={pr} onClick={()=>setTf(p=>({...p,priority:pr}))} style={{flex:1,padding:"8px 0",borderRadius:7,border:`1px solid ${tf.priority===pr?priC[pr]:C.bd}`,background:tf.priority===pr?priC[pr]+"18":"transparent",color:tf.priority===pr?priC[pr]:C.t3,fontSize:11,fontWeight:600,cursor:"pointer"}}>{priL[pr]}</button>
                ))}
              </div>
            </div>
            <div><label style={lbSt}>期限</label><input style={iSt} placeholder="5/15" value={tf.due} onChange={e=>setTf(p=>({...p,due:e.target.value}))}/></div>
          </div>
          <label style={lbSt}>担当者</label>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {TEAM.map(m=>(
              <button key={m.av} onClick={()=>setTf(p=>({...p,assignee:m.av}))} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:8,border:`1px solid ${tf.assignee===m.av?C.ac:C.bd}`,background:tf.assignee===m.av?C.aD:"transparent",cursor:"pointer"}}>
                <Av name={m.av} size={20}/>
                <span style={{fontSize:11,color:tf.assignee===m.av?C.ac:C.t2}}>{m.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
          <label style={lbSt}>メモ</label>
          <textarea style={{...iSt,height:72,resize:"none",marginBottom:18}} placeholder="補足..." value={tf.note} onChange={e=>setTf(p=>({...p,note:e.target.value}))}/>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setTaskModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveTask} style={{flex:2,padding:12,opacity:tf.text.trim()?1:.4}}>{taskModal==="new"?"作成する":"保存する"}</Btn>
          </div>
          {taskModal!=="new"&&<button onClick={()=>{setTasks(p=>p.filter(x=>x.id!==taskModal.id));setTaskModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </BottomSheet>
      )}

      {/* ── Project Modal ── */}
      {projModal!==null&&(
        <BottomSheet onClose={()=>setProjModal(null)} title={projModal==="new"?"プロジェクト作成":"プロジェクト編集"}>
          <label style={lbSt}>プロジェクト名</label>
          <input style={{...iSt,marginBottom:14}} value={pf.name} onChange={e=>setPf(p=>({...p,name:e.target.value}))} autoFocus/>
          <label style={lbSt}>ステータス</label>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {["進行中","最終確認","完了","保留"].map(s=>(
              <button key={s} onClick={()=>setPf(p=>({...p,status:s}))} style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${pf.status===s?stC[s]||C.ac:C.bd}`,background:pf.status===s?(stC[s]||C.ac)+"18":"transparent",color:pf.status===s?stC[s]||C.ac:C.t2,fontSize:11,fontWeight:600,cursor:"pointer"}}>{s}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={lbSt}>期限</label><input style={iSt} placeholder="5/15" value={pf.due} onChange={e=>setPf(p=>({...p,due:e.target.value}))}/></div>
            {projModal!=="new"&&<div><label style={lbSt}>進捗 {pf.progress??projModal.progress}%</label><input type="range" min={0} max={100} value={pf.progress??projModal.progress} onChange={e=>setPf(p=>({...p,progress:parseInt(e.target.value)}))} style={{width:"100%",accentColor:C.ac,marginTop:8}}/></div>}
          </div>
          <label style={lbSt}>カラー</label>
          <div style={{display:"flex",gap:8,marginBottom:14}}>{[C.ac,C.pu,C.gr,C.go,C.re,C.cy].map(col=><button key={col} onClick={()=>setPf(p=>({...p,color:col}))} style={{width:26,height:26,borderRadius:"50%",background:col,border:`3px solid ${pf.color===col?"#fff":"transparent"}`,cursor:"pointer",boxShadow:pf.color===col?`0 0 0 2px ${col}`:""}}/>)}</div>
          <label style={lbSt}>概要</label>
          <textarea style={{...iSt,height:72,resize:"none",marginBottom:18}} value={pf.desc} onChange={e=>setPf(p=>({...p,desc:e.target.value}))}/>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setProjModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveProj} style={{flex:2,padding:12,opacity:pf.name.trim()?1:.4}}>{projModal==="new"?"作成する":"保存する"}</Btn>
          </div>
          {projModal!=="new"&&<button onClick={()=>{setProjects(p=>p.filter(x=>x.id!==projModal.id));setProjModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </BottomSheet>
      )}

      {/* ── Deal Modal ── */}
      {dealModal!==null&&(
        <BottomSheet onClose={()=>setDealModal(null)} title={dealModal==="new"?"商談を追加":"商談を編集"}>
          {[{l:"会社名",k:"company",ph:"株式会社〇〇"},{l:"担当者",k:"contact",ph:"山田 部長"},{l:"期限",k:"due",ph:"5/15"}].map(f=>(
            <div key={f.k} style={{marginBottom:12}}><label style={lbSt}>{f.l}</label><input style={iSt} placeholder={f.ph} value={df[f.k]} onChange={e=>setDf(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={lbSt}>ステージ</label>{["リード","提案中","商談","見積","クローズ"].map(s=><button key={s} onClick={()=>setDf(p=>({...p,stage:s}))} style={{display:"block",width:"100%",marginBottom:4,padding:"6px 10px",borderRadius:7,border:`1px solid ${df.stage===s?stgC[s]:C.bd}`,background:df.stage===s?stgC[s]+"18":"transparent",color:df.stage===s?stgC[s]:C.t2,fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left"}}>{s}</button>)}</div>
            <div>
              <label style={lbSt}>商談金額</label>
              <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:10}}><span style={{color:C.go,fontFamily:M,marginRight:6}}>¥</span><input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:15,fontFamily:M,padding:"10px 0"}} placeholder="0" value={df.value} onChange={e=>setDf(p=>({...p,value:e.target.value}))}/></div>
              <label style={lbSt}>確率 {df.prob}%</label>
              <input type="range" min={0} max={100} value={df.prob} onChange={e=>setDf(p=>({...p,prob:parseInt(e.target.value)}))} style={{width:"100%",accentColor:C.ac}}/>
            </div>
          </div>
          <label style={lbSt}>メモ</label>
          <textarea style={{...iSt,height:64,resize:"none",marginBottom:18}} value={df.note} onChange={e=>setDf(p=>({...p,note:e.target.value}))}/>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setDealModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveDeal} style={{flex:2,padding:12,opacity:df.company.trim()?1:.4}}>{dealModal==="new"?"追加する":"保存する"}</Btn>
          </div>
          {dealModal!=="new"&&<button onClick={()=>{setDeals(p=>p.filter(x=>x.id!==dealModal.id));setDealModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </BottomSheet>
      )}

      {/* ── Finance Modal (was missing!) ── */}
      {finModal&&(
        <BottomSheet onClose={()=>setFinModal(false)} title="収支を記録">
          <div style={{display:"flex",background:C.bc,borderRadius:9,padding:3,marginBottom:14,border:`1px solid ${C.bd}`}}>
            {[{id:"revenue",l:"収入"},{id:"expense",l:"支出"}].map(t=>(
              <button key={t.id} onClick={()=>setFf(p=>({...p,type:t.id}))} style={{flex:1,padding:"8px",borderRadius:7,border:"none",background:ff.type===t.id?(t.id==="revenue"?C.gr:C.re):"transparent",color:ff.type===t.id?"#fff":C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
            ))}
          </div>
          <label style={lbSt}>内容</label>
          <input style={{...iSt,marginBottom:12}} placeholder="例: クライアントA社 案件" value={ff.label} onChange={e=>setFf(p=>({...p,label:e.target.value}))} autoFocus/>
          <label style={lbSt}>金額</label>
          <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:12}}>
            <span style={{color:ff.type==="revenue"?C.gr:C.re,fontFamily:M,marginRight:6,fontWeight:700}}>¥</span>
            <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:18,fontFamily:M,padding:"12px 0"}} placeholder="0" value={ff.amount} onChange={e=>setFf(p=>({...p,amount:e.target.value}))}/>
          </div>
          <label style={lbSt}>タグ</label>
          <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
            {["売上","業務委託","広告","外注","固定費","その他"].map(t=>(
              <button key={t} onClick={()=>setFf(p=>({...p,tag:t}))} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${ff.tag===t?C.ac:C.bd}`,background:ff.tag===t?C.aD:"transparent",color:ff.tag===t?C.ac:C.t2,fontSize:11,cursor:"pointer"}}>{t}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setFinModal(false)}>キャンセル</OutBtn>
            <Btn onClick={saveFin} style={{flex:2,padding:12,opacity:(ff.amount&&ff.label.trim())?1:.4}}>記録する</Btn>
          </div>
        </BottomSheet>
      )}

      {/* ── Cashflow Modal ── */}
      {cfModal&&(
        <BottomSheet onClose={()=>setCfModal(false)} title="キャッシュフローを追加">
          <div style={{display:"flex",background:C.bc,borderRadius:9,padding:3,marginBottom:14,border:`1px solid ${C.bd}`}}>
            {[{id:"in",l:"入金予定"},{id:"out",l:"出金予定"}].map(t=>(
              <button key={t.id} onClick={()=>setCff(p=>({...p,type:t.id}))} style={{flex:1,padding:"8px",borderRadius:7,border:"none",background:cff.type===t.id?(t.id==="in"?C.gr:C.re):"transparent",color:cff.type===t.id?"#fff":C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
            ))}
          </div>
          <label style={lbSt}>内容</label>
          <input style={{...iSt,marginBottom:12}} placeholder="例: クライアントA社 入金" value={cff.label} onChange={e=>setCff(p=>({...p,label:e.target.value}))} autoFocus/>
          <label style={lbSt}>金額</label>
          <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:12}}>
            <span style={{color:cff.type==="in"?C.gr:C.re,fontFamily:M,marginRight:6,fontWeight:700}}>¥</span>
            <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:18,fontFamily:M,padding:"12px 0"}} placeholder="0" value={cff.amount} onChange={e=>setCff(p=>({...p,amount:e.target.value}))}/>
          </div>
          <label style={lbSt}>予定日</label>
          <input style={{...iSt,marginBottom:12}} placeholder="5/15" value={cff.date} onChange={e=>setCff(p=>({...p,date:e.target.value}))}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <button onClick={()=>setCff(p=>({...p,recurring:!p.recurring}))} style={{width:22,height:22,borderRadius:6,border:`1px solid ${cff.recurring?C.ac:C.bd}`,background:cff.recurring?C.ac:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              {cff.recurring&&<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </button>
            <span style={{fontSize:12,color:C.t2}}>毎月繰り返す</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setCfModal(false)}>キャンセル</OutBtn>
            <Btn onClick={saveCf} style={{flex:2,padding:12,opacity:(cff.label.trim()&&cff.amount)?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}

      {/* ── Schedule Modal ── */}
      {schedModal&&(
        <BottomSheet onClose={()=>setSchedModal(false)} title="予定を追加">
          <input style={{...iSt,marginBottom:12}} placeholder="商談・予定・作業..." value={sf.title} onChange={e=>setSf(p=>({...p,title:e.target.value}))} autoFocus/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={lbSt}>日付</label><input style={iSt} placeholder="5/15" value={sf.date} onChange={e=>setSf(p=>({...p,date:e.target.value}))}/></div>
            <div><label style={lbSt}>時間</label><input style={iSt} placeholder="14:00" value={sf.time} onChange={e=>setSf(p=>({...p,time:e.target.value}))}/></div>
          </div>
          <label style={lbSt}>所要時間</label>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[30,45,60,90,120].map(d=>(
              <button key={d} onClick={()=>setSf(p=>({...p,duration:d}))} style={{flex:1,padding:"7px 0",borderRadius:7,border:`1px solid ${sf.duration===d?C.ac:C.bd}`,background:sf.duration===d?C.aD:"transparent",color:sf.duration===d?C.ac:C.t2,fontSize:11,cursor:"pointer"}}>{d}分</button>
            ))}
          </div>
          <input style={{...iSt,marginBottom:12}} placeholder="場所 / URL" value={sf.location} onChange={e=>setSf(p=>({...p,location:e.target.value}))}/>
          <label style={lbSt}>参加者</label>
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            {TEAM.map(m=>{const sel=sf.attendees.includes(m.av);return(
              <button key={m.av} onClick={()=>setSf(p=>({...p,attendees:sel?p.attendees.filter(a=>a!==m.av):[...p.attendees,m.av]}))} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:8,border:`1px solid ${sel?C.ac:C.bd}`,background:sel?C.aD:"transparent",cursor:"pointer"}}>
                <Av name={m.av} size={20}/><span style={{fontSize:11,color:sel?C.ac:C.t2}}>{m.name.split(" ")[0]}</span>
              </button>
            );})}
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setSchedModal(false)}>キャンセル</OutBtn>
            <Btn onClick={saveSched} style={{flex:2,padding:12,opacity:(sf.title.trim()&&sf.date)?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}

      {/* ── Memo Modal (fullscreen) ── */}
      {memoModal!==null&&(
        <FullScreen onClose={()=>setMemoModal(null)} title={memoModal==="new"?"アイデアを追加":"アイデアを編集"} action={<button onClick={saveMemo} disabled={!mf.title.trim()} style={{fontSize:13,color:mf.title.trim()?C.ac:C.t3,background:"transparent",border:"none",cursor:mf.title.trim()?"pointer":"default",fontWeight:600}}>保存</button>}>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {["戦略","議事録","採用","タスク","メモ","アイデア"].map(t=>(
              <button key={t} onClick={()=>setMf(p=>({...p,tag:t}))} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${mf.tag===t?C.ac:C.bd}`,background:mf.tag===t?C.aD:"transparent",color:mf.tag===t?C.ac:C.t3,fontSize:10,cursor:"pointer"}}>{t}</button>
            ))}
          </div>
          <input style={{background:"transparent",border:"none",outline:"none",color:C.t1,fontSize:20,fontWeight:700,fontFamily:F,marginBottom:12,padding:0,width:"100%"}} placeholder="タイトル" value={mf.title} onChange={e=>setMf(p=>({...p,title:e.target.value}))} autoFocus/>
          <textarea style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.t2,fontSize:14,fontFamily:F,lineHeight:1.8,resize:"none",minHeight:400,padding:0}} placeholder="内容を入力..." value={mf.content} onChange={e=>setMf(p=>({...p,content:e.target.value}))}/>
          {memoModal!=="new"&&<button onClick={()=>{setMemos(p=>p.filter(x=>x.id!==memoModal.id));setMemoModal(null);}} style={{marginTop:20,width:"100%",padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </FullScreen>
      )}

      {/* ── Competitor Modal ── */}
      {compModal!==null&&(
        <BottomSheet onClose={()=>setCompModal(null)} title={compModal==="new"?"競合を追加":"競合を編集"}>
          {[{l:"競合名",k:"name",ph:"Shopify, BASE..."},{l:"強み",k:"strength",ph:"強みを入力"},{l:"弱み",k:"weakness",ph:"弱みを入力"}].map(f=>(
            <div key={f.k} style={{marginBottom:12}}><label style={lbSt}>{f.l}</label><input style={iSt} placeholder={f.ph} value={cf[f.k]} onChange={e=>setCf(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
            <div><label style={lbSt}>市場シェア</label><div style={{display:"flex",gap:5}}>{["大","中","小"].map(s=><button key={s} onClick={()=>setCf(p=>({...p,share:s}))} style={{flex:1,padding:"7px 0",borderRadius:7,border:`1px solid ${cf.share===s?shrC[s]:C.bd}`,background:cf.share===s?shrC[s]+"18":"transparent",color:cf.share===s?shrC[s]:C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>)}</div></div>
            <div><label style={lbSt}>脅威度 {cf.rating}/5</label><input type="range" min={1} max={5} value={cf.rating} onChange={e=>setCf(p=>({...p,rating:parseInt(e.target.value)}))} style={{width:"100%",accentColor:C.ac,marginTop:8}}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setCompModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveComp} style={{flex:2,padding:12,opacity:cf.name.trim()?1:.4}}>{compModal==="new"?"追加する":"保存する"}</Btn>
          </div>
          {compModal!=="new"&&<button onClick={()=>{setCompetitors(p=>p.filter(x=>x.id!==compModal.id));setCompModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </BottomSheet>
      )}

      {/* ── Invoice Modal ── */}
      {invModal!==null&&(
        <BottomSheet onClose={()=>setInvModal(null)} title={invModal==="new"?"請求書を発行":"請求書を編集"}>
          {[{l:"請求先",k:"company",ph:"株式会社〇〇"},{l:"支払期限",k:"due",ph:"5/31"},{l:"備考",k:"note",ph:"備考・件名など"}].map(f=>(
            <div key={f.k} style={{marginBottom:12}}><label style={lbSt}>{f.l}</label><input style={iSt} placeholder={f.ph} value={ivf[f.k]} onChange={e=>setIvf(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
          <label style={lbSt}>請求金額</label>
          <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:14}}>
            <span style={{color:C.go,fontFamily:M,marginRight:6,fontWeight:700}}>¥</span>
            <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:18,fontFamily:M,padding:"12px 0"}} placeholder="0" value={ivf.amount} onChange={e=>setIvf(p=>({...p,amount:e.target.value}))}/>
          </div>
          <label style={lbSt}>ステータス</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
            {["未送付","送付済み","入金待ち","入金済み","キャンセル"].map(s=>(
              <button key={s} onClick={()=>setIvf(p=>({...p,status:s}))} style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${ivf.status===s?invStC[s]:C.bd}`,background:ivf.status===s?invStC[s]+"18":"transparent",color:ivf.status===s?invStC[s]:C.t2,fontSize:11,fontWeight:600,cursor:"pointer"}}>{s}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setInvModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveInv} style={{flex:2,padding:12,opacity:(ivf.company.trim()&&ivf.amount)?1:.4}}>{invModal==="new"?"発行する":"保存する"}</Btn>
          </div>
          {invModal!=="new"&&<button onClick={()=>{setInvoices(p=>p.filter(x=>x.id!==invModal.id));setInvModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </BottomSheet>
      )}


      {/* ── Header (sticky) ── */}
      <div style={{padding:"14px 18px 0",background:C.bs,borderBottom:`1px solid ${C.bd}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:C.t1}}>{uname||"Founder"}</div>
            <div style={{fontSize:11,color:C.t2,marginTop:2,fontFamily:M,fontWeight:700}}>{companyName||"stealth"}{genre?` · ${genre}`:""}</div>
          </div>
          <div>{headerAction[sub]}</div>
        </div>
        <div style={{display:"flex",gap:0,overflowX:"auto",marginBottom:-1}}>
          {SUBTABS.map(t=>(
            <button key={t.id} onClick={()=>setSub(t.id)} style={{padding:"8px 10px",border:"none",background:"transparent",color:sub===t.id?C.ac:C.t3,fontSize:11,fontWeight:sub===t.id?700:400,cursor:"pointer",borderBottom:`2px solid ${sub===t.id?C.ac:"transparent"}`,whiteSpace:"nowrap",flexShrink:0}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {sub==="hub"      && renderHub()}
      {sub==="cashflow" && renderCashflow()}
      {sub==="memos"    && renderMemos()}
      {sub==="invoice"  && renderInvoice()}


      <style>{`@keyframes yen_spin{to{transform:rotate(360deg)}}@keyframes yen_pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
};

// ─────────────────────────────────────────
// STARTUP TAB
// ─────────────────────────────────────────
const genCode = () => {
  const s = () => Math.random().toString(36).substring(2,6).toUpperCase();
  return `${s()}-${s()}-${s()}`;
};

const STAGES = ["アイデア","検証中","MVP","成長中","スケール"];
const stageC = {"アイデア":C.t3,"検証中":C.go,"MVP":C.ac,"成長中":C.gr,"スケール":C.pu};

const StartupTab = ({ventures, setVentures, tasks, setTasks, finances, setFinances, deals, setDeals, okrs, setOkrs, gigs, setGigs, gigOrders, setGigOrders}) => {
  const [ventureModal, setVentureModal] = useState(null);
  const [memberModal,  setMemberModal]  = useState(null);
  const [msModal,      setMsModal]      = useState(null);
  const [copiedId,     setCopiedId]     = useState(null);
  const [workspace,    setWorkspace]    = useState(null);
  const [wsTab,        setWsTab]        = useState("okr");
  const [qtModal,      setQtModal]      = useState(false);
  const [qfModal,      setQfModal]      = useState(false);
  const [qdModal,      setQdModal]      = useState(false);
  const [okrModal,     setOkrModal]     = useState(false);
  const [gigModal,     setGigModal]     = useState(false);
  const [orderModal,   setOrderModal]   = useState(false);

  const [vf,  setVf]  = useState({name:"",desc:"",genre:"",stage:"アイデア",pitch:"",customer:"",problem:"",solution:"",model:"サブスク"});
  const [mf,  setMf]  = useState({name:"",role:"",phone:""});
  const [msf, setMsf] = useState({text:""});
  const [qtf, setQtf] = useState({text:"",priority:"medium",due:""});
  const [qff, setQff] = useState({type:"revenue",amount:"",label:"",tag:"売上"});
  const [qdf, setQdf] = useState({company:"",contact:"",stage:"リード",value:""});
  const [okrf,setOkrf]= useState({objective:"",kr1:"",kr1Target:"",kr1Cur:"",kr2:"",kr2Target:"",kr2Cur:"",kr3:"",kr3Target:"",kr3Cur:"",quarter:""});
  const [gigf,setGigf]= useState({title:"",desc:"",price:"",unit:"件"});
  const [ordf,setOrdf]= useState({gigId:"",client:"",amount:"",status:"進行中"});

  const saveVenture = () => {
    if (!vf.name.trim()) return;
    ventureModal==="new"
      ? setVentures(p=>[...p,{...vf,id:Date.now(),inviteCode:genCode(),members:[],milestones:[],founded:new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"numeric",day:"numeric"})}])
      : setVentures(p=>p.map(x=>x.id===ventureModal.id?{...x,...vf}:x));
    setVentureModal(null);
  };
  const saveMember = (vid) => {
    if (!mf.name.trim()) return;
    setVentures(p=>p.map(x=>x.id===vid?{...x,members:[...x.members,{...mf,id:Date.now()}]}:x));
    setMemberModal(null); setMf({name:"",role:"",phone:""});
  };
  const saveMilestone = (vid) => {
    if (!msf.text.trim()) return;
    setVentures(p=>p.map(x=>x.id===vid?{...x,milestones:[...x.milestones,{id:Date.now(),text:msf.text,done:false}]}:x));
    setMsModal(null); setMsf({text:""});
  };
  const toggleMs = (vid,mid) => setVentures(p=>p.map(x=>x.id===vid?{...x,milestones:x.milestones.map(m=>m.id===mid?{...m,done:!m.done}:m)}:x));
  const copyCode = (id,code) => {
    navigator.clipboard.writeText(code).catch(()=>{});
    setCopiedId(id); setTimeout(()=>setCopiedId(null),2000);
  };
  const addTask = (vid) => {
    if (!qtf.text.trim()) return;
    setTasks(p=>[...p,{id:Date.now(),text:qtf.text,priority:qtf.priority,due:qtf.due,done:false,assignee:"田",note:"",projectId:null,ventureId:vid}]);
    setQtModal(false); setQtf({text:"",priority:"medium",due:""});
  };
  const addFinance = (vid) => {
    if (!qff.amount||!qff.label.trim()) return;
    const now=new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
    setFinances(p=>[{id:Date.now(),...qff,amount:parseInt(qff.amount),date:now,ventureId:vid},...p]);
    setQfModal(false); setQff({type:"revenue",amount:"",label:"",tag:"売上"});
  };
  const addDeal = (vid) => {
    if (!qdf.company.trim()) return;
    setDeals(p=>[...p,{id:Date.now(),...qdf,value:parseInt(qdf.value)||0,note:"",due:"",prob:50,ventureId:vid}]);
    setQdModal(false); setQdf({company:"",contact:"",stage:"リード",value:""});
  };
  const addOkr = (vid) => {
    if (!okrf.objective.trim()) return;
    setOkrs(p=>[...p,{id:Date.now(),ventureId:vid,...okrf,kr1Target:parseFloat(okrf.kr1Target)||0,kr1Cur:parseFloat(okrf.kr1Cur)||0,kr2Target:parseFloat(okrf.kr2Target)||0,kr2Cur:parseFloat(okrf.kr2Cur)||0,kr3Target:parseFloat(okrf.kr3Target)||0,kr3Cur:parseFloat(okrf.kr3Cur)||0}]);
    setOkrModal(false); setOkrf({objective:"",kr1:"",kr1Target:"",kr1Cur:"",kr2:"",kr2Target:"",kr2Cur:"",kr3:"",kr3Target:"",kr3Cur:"",quarter:""});
  };
  const updKr = (oid,k,v) => setOkrs(p=>p.map(o=>o.id===oid?{...o,[k]:parseFloat(v)||0}:o));
  const addGig = (vid) => {
    if (!gigf.title.trim()) return;
    setGigs(p=>[...p,{id:Date.now(),ventureId:vid,...gigf,price:parseInt(gigf.price)||0}]);
    setGigModal(false); setGigf({title:"",desc:"",price:"",unit:"件"});
  };
  const addOrder = (vid) => {
    if (!ordf.gigId||!ordf.client.trim()) return;
    const now=new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
    setGigOrders(p=>[...p,{id:Date.now(),ventureId:vid,...ordf,amount:parseInt(ordf.amount)||0,date:now}]);
    if (ordf.status==="入金済み") {
      setFinances(p=>[{id:Date.now()+1,type:"revenue",amount:parseInt(ordf.amount)||0,label:`案件: ${ordf.client}`,tag:"副業",date:now,ventureId:vid},...p]);
    }
    setOrderModal(false); setOrdf({gigId:"",client:"",amount:"",status:"進行中"});
  };
  const markPaid = (orderId) => {
    const o = gigOrders.find(x=>x.id===orderId);
    if (!o || o.status==="入金済み") return;
    const now=new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
    setGigOrders(p=>p.map(x=>x.id===orderId?{...x,status:"入金済み"}:x));
    setFinances(p=>[{id:Date.now(),type:"revenue",amount:o.amount,label:`案件: ${o.client}`,tag:"副業",date:now,ventureId:o.ventureId},...p]);
  };

  const priC2={high:C.re,medium:C.go,low:C.t3};
  const priL2={high:"高",medium:"中",low:"低"};
  const stgC2={"リード":C.t2,"提案中":C.go,"商談":C.ac,"見積":C.pu,"クローズ":C.gr};
  const ordC ={"進行中":C.ac,"納品済み":C.go,"入金済み":C.gr,"キャンセル":C.t3};

  const wsV    = workspace ? ventures.find(v=>v.id===workspace) : null;
  const wsT    = tasks.filter(t=>t.ventureId===workspace);
  const wsF    = finances.filter(f=>f.ventureId===workspace);
  const wsD    = deals.filter(d=>d.ventureId===workspace);
  const wsO    = okrs.filter(o=>o.ventureId===workspace);
  const wsG    = gigs.filter(g=>g.ventureId===workspace);
  const wsOrd  = gigOrders.filter(o=>o.ventureId===workspace);
  const wsRev  = wsF.filter(f=>f.type==="revenue").reduce((a,b)=>a+b.amount,0);
  const wsExp  = wsF.filter(f=>f.type==="expense").reduce((a,b)=>a+b.amount,0);
  const wsRun  = wsRev - wsExp;
  const okrProg = (o) => {
    const ks=[[o.kr1Cur,o.kr1Target],[o.kr2Cur,o.kr2Target],[o.kr3Cur,o.kr3Target]].filter(([_,t])=>t>0);
    if (!ks.length) return 0;
    return Math.round(ks.reduce((a,[c,t])=>a+Math.min(100,(c/t)*100),0)/ks.length);
  };


  // ── Workspace view ──
  if (workspace && wsV) return (
    <div style={{background:C.bg,minHeight:"100%"}}>
      <div style={{background:C.bs,borderBottom:`1px solid ${C.bd}`,padding:"14px 18px 0",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={()=>setWorkspace(null)} style={{width:32,height:32,borderRadius:9,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:C.t1}}>{wsV.name}</div>
            <span style={{fontSize:10,color:stageC[wsV.stage],background:stageC[wsV.stage]+"14",borderRadius:4,padding:"1px 7px",fontWeight:600}}>{wsV.stage}</span>
          </div>
          {wsTab==="tasks"    &&<Btn onClick={()=>setQtModal(true)}>+ タスク</Btn>}
          {wsTab==="finance"  &&<Btn onClick={()=>setQfModal(true)}>+ 記録</Btn>}
          {wsTab==="deals"    &&<Btn onClick={()=>setQdModal(true)}>+ 案件</Btn>}
          {wsTab==="okr"      &&<Btn onClick={()=>setOkrModal(true)}>+ OKR</Btn>}
          {wsTab==="earnings" &&<Btn onClick={()=>setOrderModal(true)}>+ 案件記録</Btn>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
          {[
            {l:"売上",v:fmtK(wsRev),c:C.gr},
            {l:"純利益",v:(wsRun>=0?"+":"")+fmtK(Math.abs(wsRun)),c:wsRun>=0?C.gr:C.re},
            {l:"OKR",v:wsO.length?Math.round(wsO.reduce((a,o)=>a+okrProg(o),0)/wsO.length)+"%":"—",c:C.pu},
            {l:"案件",v:`${wsOrd.filter(o=>o.status!=="キャンセル").length}件`,c:C.ac},
          ].map((k,i)=>(
            <div key={i} style={{background:C.b2,borderRadius:9,padding:"7px 8px"}}>
              <div style={{fontSize:8,color:C.t3,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{k.l}</div>
              <div style={{fontSize:12,fontWeight:700,color:k.c,fontFamily:M}}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:0,marginBottom:-1,overflowX:"auto"}}>
          {[{id:"okr",l:"OKR"},{id:"earnings",l:"収益化"},{id:"tasks",l:"タスク"},{id:"finance",l:"財務"},{id:"deals",l:"案件"},{id:"milestones",l:"道標"},{id:"team",l:"チーム"}].map(t=>(
            <button key={t.id} onClick={()=>setWsTab(t.id)} style={{padding:"8px 11px",border:"none",background:"transparent",color:wsTab===t.id?C.ac:C.t3,fontSize:11,fontWeight:wsTab===t.id?700:400,cursor:"pointer",borderBottom:`2px solid ${wsTab===t.id?C.ac:"transparent"}`,whiteSpace:"nowrap",flexShrink:0}}>{t.l}</button>
          ))}
        </div>
      </div>
      <div style={{padding:16}}>
        {wsTab==="okr"&&<>
          {(wsV.pitch||wsV.customer||wsV.problem||wsV.solution)&&(
            <div style={{...card,padding:14,marginBottom:14,background:`linear-gradient(135deg,${C.ac}08,${C.pu}08)`}}>
              <div style={{fontSize:9,color:C.t3,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>ピッチ</div>
              {wsV.pitch&&<div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:10,lineHeight:1.5}}>"{wsV.pitch}"</div>}
              {[
                {l:"顧客",v:wsV.customer},
                {l:"課題",v:wsV.problem},
                {l:"解決策",v:wsV.solution},
                {l:"収益モデル",v:wsV.model},
              ].filter(x=>x.v).map((x,i)=>(
                <div key={i} style={{marginBottom:6,fontSize:12}}>
                  <span style={{color:C.t3,fontWeight:600,marginRight:8}}>{x.l}:</span>
                  <span style={{color:C.t1}}>{x.v}</span>
                </div>
              ))}
            </div>
          )}
          {wsO.length===0&&<Empty text="OKRを設定して目標を可視化"/>}
          {wsO.map(o=>{
            const prog=okrProg(o);
            return (
              <div key={o.id} style={{...card,padding:14,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{flex:1}}>
                    {o.quarter&&<div style={{fontSize:9,color:C.pu,fontWeight:700,letterSpacing:1,marginBottom:3}}>{o.quarter}</div>}
                    <div style={{fontSize:14,fontWeight:700,color:C.t1,lineHeight:1.4}}>{o.objective}</div>
                  </div>
                  <div style={{textAlign:"right",marginLeft:10}}>
                    <div style={{fontSize:18,fontWeight:800,color:prog>=70?C.gr:prog>=40?C.go:C.re,fontFamily:M}}>{prog}%</div>
                    <button onClick={()=>setOkrs(p=>p.filter(x=>x.id!==o.id))} style={{fontSize:9,color:C.re,background:"transparent",border:"none",cursor:"pointer",padding:0,marginTop:2}}>削除</button>
                  </div>
                </div>
                <div style={{height:5,background:C.b2,borderRadius:3,overflow:"hidden",marginBottom:12}}>
                  <div style={{width:`${prog}%`,height:"100%",background:`linear-gradient(90deg,${C.ac},${C.pu})`,transition:"width 0.3s"}}/>
                </div>
                {[["kr1","kr1Cur","kr1Target"],["kr2","kr2Cur","kr2Target"],["kr3","kr3Cur","kr3Target"]].map(([k,ck,tk],i)=>o[k]&&(
                  <div key={i} style={{marginBottom:10,padding:"8px 10px",background:C.b2,borderRadius:8}}>
                    <div style={{fontSize:11,color:C.t1,fontWeight:600,marginBottom:6}}>KR{i+1}: {o[k]}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="number" value={o[ck]} onChange={e=>updKr(o.id,ck,e.target.value)} style={{width:70,padding:"5px 7px",borderRadius:5,border:`1px solid ${C.bd}`,background:"#fff",fontSize:11,fontFamily:M,outline:"none"}}/>
                      <span style={{fontSize:11,color:C.t3}}>/ {o[tk]}</span>
                      <div style={{flex:1,height:4,background:C.bd,borderRadius:2,overflow:"hidden"}}>
                        <div style={{width:`${Math.min(100,(o[ck]/o[tk])*100||0)}%`,height:"100%",background:C.gr}}/>
                      </div>
                      <span style={{fontSize:10,color:C.t3,fontFamily:M,minWidth:32,textAlign:"right"}}>{Math.round(Math.min(100,(o[ck]/o[tk])*100||0))}%</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>}
        {wsTab==="earnings"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{...card,padding:12}}>
              <div style={{fontSize:8,color:C.t3,letterSpacing:1.5,marginBottom:4,textTransform:"uppercase"}}>累計売上</div>
              <div style={{fontSize:18,fontWeight:800,color:C.gr,fontFamily:M}}>{fmtK(wsRev)}</div>
            </div>
            <div style={{...card,padding:12}}>
              <div style={{fontSize:8,color:C.t3,letterSpacing:1.5,marginBottom:4,textTransform:"uppercase"}}>未入金</div>
              <div style={{fontSize:18,fontWeight:800,color:C.go,fontFamily:M}}>{fmtK(wsOrd.filter(o=>o.status!=="入金済み"&&o.status!=="キャンセル").reduce((a,b)=>a+b.amount,0))}</div>
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:C.t3,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>商品 / スキル</div>
          <button onClick={()=>setGigModal(true)} style={{width:"100%",marginBottom:10,padding:"10px",borderRadius:9,border:`1px dashed ${C.bd}`,background:"transparent",color:C.t3,fontSize:12,cursor:"pointer"}}>+ 商品・スキルを登録</button>
          {wsG.map(g=>{
            const sold=wsOrd.filter(o=>o.gigId===g.id&&o.status!=="キャンセル").length;
            const earned=wsOrd.filter(o=>o.gigId===g.id&&o.status==="入金済み").reduce((a,b)=>a+b.amount,0);
            return (
              <div key={g.id} style={{...card,padding:12,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:3}}>{g.title}</div>
                    {g.desc&&<div style={{fontSize:11,color:C.t2,marginBottom:6,lineHeight:1.5}}>{g.desc}</div>}
                    <div style={{display:"flex",gap:10,fontSize:10,color:C.t3}}>
                      <span style={{color:C.go,fontWeight:700,fontFamily:M}}>{fmt(g.price)} / {g.unit}</span>
                      <span>受注 {sold}件</span>
                      <span style={{color:C.gr,fontFamily:M}}>入金 {fmtK(earned)}</span>
                    </div>
                  </div>
                  <button onClick={()=>setGigs(p=>p.filter(x=>x.id!==g.id))} style={{width:20,height:20,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
          {wsG.length===0&&<div style={{fontSize:11,color:C.t3,textAlign:"center",padding:"12px 0"}}>動画編集・コンサル等のスキルや商品を登録して受注</div>}
          <div style={{fontSize:11,fontWeight:700,color:C.t3,letterSpacing:1.5,textTransform:"uppercase",marginTop:18,marginBottom:8}}>案件履歴</div>
          {wsOrd.length===0&&<Empty text="案件記録がありません"/>}
          {wsOrd.map(o=>{
            const g=wsG.find(x=>x.id===o.gigId);
            return (
              <div key={o.id} style={{...card,padding:12,marginBottom:8,borderLeft:`3px solid ${ordC[o.status]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.t1}}>{o.client}</div>
                    <div style={{fontSize:10,color:C.t3,marginTop:2}}>{g?.title||"—"} · {o.date}</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:C.go,fontFamily:M}}>{fmtK(o.amount)}</div>
                </div>
                <div style={{display:"flex",gap:4,marginTop:8}}>
                  {["進行中","納品済み","入金済み","キャンセル"].map(s=>(
                    <button key={s} onClick={()=>{
                      if (s==="入金済み"&&o.status!=="入金済み") markPaid(o.id);
                      else setGigOrders(p=>p.map(x=>x.id===o.id?{...x,status:s}:x));
                    }} style={{flex:1,padding:"5px 0",borderRadius:5,border:`1px solid ${o.status===s?ordC[s]:C.bd}`,background:o.status===s?ordC[s]+"18":"transparent",color:o.status===s?ordC[s]:C.t3,fontSize:9,fontWeight:600,cursor:"pointer"}}>{s}</button>
                  ))}
                </div>
                <button onClick={()=>setGigOrders(p=>p.filter(x=>x.id!==o.id))} style={{marginTop:6,fontSize:10,color:C.re,background:"transparent",border:"none",cursor:"pointer",padding:0}}>削除</button>
              </div>
            );
          })}
        </>}
        {wsTab==="tasks"&&<>
          {wsT.map(t=>(
            <div key={t.id} style={{...card,marginBottom:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${t.done?C.gr:C.bd}`,background:t.done?C.gr:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  {t.done&&<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </button>
                <div style={{flex:1,fontSize:13,color:t.done?C.t3:C.t1,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
                <span style={{fontSize:9,color:priC2[t.priority],background:priC2[t.priority]+"14",borderRadius:4,padding:"2px 6px",fontWeight:700,flexShrink:0}}>{priL2[t.priority]}</span>
                {t.due&&<span style={{fontSize:10,color:C.t3,flexShrink:0}}>{t.due}</span>}
                <button onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))} style={{width:20,height:20,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
          {wsT.length===0&&<Empty text="タスクがありません"/>}
        </>}
        {wsTab==="finance"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{...card,padding:14,borderColor:C.gr+"40"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>収入</div><div style={{fontSize:18,fontWeight:700,color:C.gr,fontFamily:M}}>+{fmtK(wsRev)}</div></div>
            <div style={{...card,padding:14,borderColor:C.re+"40"}}><div style={{fontSize:9,color:C.t3,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>支出</div><div style={{fontSize:18,fontWeight:700,color:C.re,fontFamily:M}}>-{fmtK(wsExp)}</div></div>
          </div>
          {wsF.map(f=>(
            <div key={f.id} style={{...card,display:"flex",alignItems:"center",gap:12,marginBottom:8,padding:"12px 14px",borderLeft:`2px solid ${f.type==="revenue"?C.gr:C.re}`}}>
              <div style={{width:32,height:32,borderRadius:8,background:f.type==="revenue"?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{f.type==="revenue"?"↑":"↓"}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{f.label}</div><div style={{fontSize:10,color:C.t3}}>{f.tag} · {f.date}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:13,fontWeight:700,color:f.type==="revenue"?C.gr:C.re,fontFamily:M}}>{f.type==="revenue"?"+":"-"}{fmtK(f.amount)}</div>
                <button onClick={()=>setFinances(p=>p.filter(x=>x.id!==f.id))} style={{width:20,height:20,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
          {wsF.length===0&&<Empty text="収支がありません"/>}
        </>}
        {wsTab==="deals"&&<>
          {wsD.map(d=>(
            <div key={d.id} style={{...card,marginBottom:10,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:3}}>{d.company}</div>
                  {d.contact&&<div style={{fontSize:11,color:C.t2,marginBottom:6}}>{d.contact}</div>}
                  <span style={{fontSize:10,color:stgC2[d.stage],background:stgC2[d.stage]+"14",borderRadius:4,padding:"2px 7px",fontWeight:600}}>{d.stage}</span>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.go,fontFamily:M}}>{fmtK(d.value)}</div>
                  <button onClick={()=>setDeals(p=>p.filter(x=>x.id!==d.id))} style={{marginTop:4,fontSize:10,color:C.re,background:"transparent",border:"none",cursor:"pointer"}}>削除</button>
                </div>
              </div>
              <div style={{display:"flex",gap:4}}>
                {["リード","提案中","商談","見積","クローズ"].map(s=>(
                  <button key={s} onClick={()=>setDeals(p=>p.map(x=>x.id===d.id?{...x,stage:s}:x))} style={{flex:1,padding:"5px 0",borderRadius:5,border:`1px solid ${d.stage===s?stgC2[s]:C.bd}`,background:d.stage===s?stgC2[s]+"18":"transparent",color:d.stage===s?stgC2[s]:C.t3,fontSize:8,fontWeight:600,cursor:"pointer"}}>{s}</button>
                ))}
              </div>
            </div>
          ))}
          {wsD.length===0&&<Empty text="案件がありません"/>}
        </>}
        {wsTab==="milestones"&&<>
          <button onClick={()=>{setMsf({text:""});setMsModal(workspace);}} style={{width:"100%",marginBottom:14,padding:"10px",borderRadius:9,border:`1px dashed ${C.bd}`,background:"transparent",color:C.t3,fontSize:12,cursor:"pointer"}}>+ マイルストーンを追加</button>
          {wsV.milestones.map(m=>(
            <div key={m.id} style={{...card,display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"12px 14px"}}>
              <button onClick={()=>toggleMs(workspace,m.id)} style={{width:20,height:20,borderRadius:"50%",border:`1.5px solid ${m.done?C.gr:C.bd}`,background:m.done?C.gr:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                {m.done&&<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </button>
              <div style={{flex:1,fontSize:13,color:m.done?C.t3:C.t1,textDecoration:m.done?"line-through":"none"}}>{m.text}</div>
              <button onClick={()=>setVentures(p=>p.map(x=>x.id===workspace?{...x,milestones:x.milestones.filter(ms=>ms.id!==m.id)}:x))} style={{width:20,height:20,borderRadius:5,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
          {wsV.milestones.length===0&&<Empty text="マイルストーンがありません"/>}
        </>}
        {wsTab==="team"&&<>
          <div style={{...card,padding:"10px 14px",marginBottom:14}}>
            <div style={{fontSize:9,color:C.t3,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>招待コード</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{fontSize:15,fontWeight:700,color:C.t1,fontFamily:M,letterSpacing:2}}>{wsV.inviteCode}</div>
              <button onClick={()=>copyCode(workspace,wsV.inviteCode)} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${copiedId===workspace?C.gr:C.bd}`,background:copiedId===workspace?C.gD:"transparent",color:copiedId===workspace?C.gr:C.t2,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {copiedId===workspace?"✓ コピー済み":"コピー"}
              </button>
            </div>
          </div>
          <button onClick={()=>{setMf({name:"",role:"",phone:""});setMemberModal(workspace);}} style={{width:"100%",marginBottom:14,padding:"10px",borderRadius:9,border:`1px dashed ${C.bd}`,background:"transparent",color:C.t3,fontSize:12,cursor:"pointer"}}>+ メンバーを追加</button>
          {wsV.members.map(m=>(
            <div key={m.id} style={{...card,display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"12px 14px"}}>
              <Av name={m.name} size={36}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{m.name}</div><div style={{fontSize:11,color:C.t2}}>{m.role}</div></div>
              {m.phone&&<a href={`tel:${m.phone}`} style={{padding:"6px 12px",borderRadius:8,background:C.aD,border:`1px solid ${C.ac}30`,color:C.ac,fontSize:11,fontWeight:600,textDecoration:"none"}}>📞 電話</a>}
              <button onClick={()=>setVentures(p=>p.map(x=>x.id===workspace?{...x,members:x.members.filter(mb=>mb.id!==m.id)}:x))} style={{width:24,height:24,borderRadius:6,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={C.t3} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
          {wsV.members.length===0&&<Empty text="メンバーがいません"/>}
        </>}
      </div>

      {/* Workspace quick-add modals */}
      {qtModal&&(
        <BottomSheet onClose={()=>setQtModal(false)} title="タスクを追加">
          <label style={lbSt}>タスク名</label>
          <input style={{...iSt,marginBottom:12}} placeholder="タスクを入力..." value={qtf.text} onChange={e=>setQtf(p=>({...p,text:e.target.value}))} autoFocus/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={lbSt}>優先度</label>
              <div style={{display:"flex",gap:5}}>
                {["high","medium","low"].map(pr=>(
                  <button key={pr} onClick={()=>setQtf(p=>({...p,priority:pr}))} style={{flex:1,padding:"7px 0",borderRadius:7,border:`1px solid ${qtf.priority===pr?priC2[pr]:C.bd}`,background:qtf.priority===pr?priC2[pr]+"18":"transparent",color:qtf.priority===pr?priC2[pr]:C.t3,fontSize:11,fontWeight:600,cursor:"pointer"}}>{priL2[pr]}</button>
                ))}
              </div>
            </div>
            <div><label style={lbSt}>期限</label><input style={iSt} placeholder="5/15" value={qtf.due} onChange={e=>setQtf(p=>({...p,due:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setQtModal(false)}>キャンセル</OutBtn>
            <Btn onClick={()=>addTask(workspace)} style={{flex:2,padding:12,opacity:qtf.text.trim()?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}
      {qfModal&&(
        <BottomSheet onClose={()=>setQfModal(false)} title="収支を記録">
          <div style={{display:"flex",background:C.bc,borderRadius:9,padding:3,marginBottom:14,border:`1px solid ${C.bd}`}}>
            {[{id:"revenue",l:"収入"},{id:"expense",l:"支出"}].map(t=>(
              <button key={t.id} onClick={()=>setQff(p=>({...p,type:t.id}))} style={{flex:1,padding:"8px",borderRadius:7,border:"none",background:qff.type===t.id?(t.id==="revenue"?C.gr:C.re):"transparent",color:qff.type===t.id?"#fff":C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
            ))}
          </div>
          <label style={lbSt}>内容</label>
          <input style={{...iSt,marginBottom:12}} placeholder="例: 初回売上" value={qff.label} onChange={e=>setQff(p=>({...p,label:e.target.value}))} autoFocus/>
          <label style={lbSt}>金額</label>
          <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:14}}>
            <span style={{color:qff.type==="revenue"?C.gr:C.re,fontFamily:M,marginRight:6,fontWeight:700}}>¥</span>
            <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:18,fontFamily:M,padding:"12px 0"}} placeholder="0" value={qff.amount} onChange={e=>setQff(p=>({...p,amount:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setQfModal(false)}>キャンセル</OutBtn>
            <Btn onClick={()=>addFinance(workspace)} style={{flex:2,padding:12,opacity:(qff.amount&&qff.label.trim())?1:.4}}>記録する</Btn>
          </div>
        </BottomSheet>
      )}
      {qdModal&&(
        <BottomSheet onClose={()=>setQdModal(false)} title="商談を追加">
          <label style={lbSt}>会社名</label>
          <input style={{...iSt,marginBottom:12}} placeholder="株式会社〇〇" value={qdf.company} onChange={e=>setQdf(p=>({...p,company:e.target.value}))} autoFocus/>
          <label style={lbSt}>担当者</label>
          <input style={{...iSt,marginBottom:12}} placeholder="山田 部長" value={qdf.contact} onChange={e=>setQdf(p=>({...p,contact:e.target.value}))}/>
          <label style={lbSt}>商談金額</label>
          <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:14}}>
            <span style={{color:C.go,fontFamily:M,marginRight:6}}>¥</span>
            <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:15,fontFamily:M,padding:"10px 0"}} placeholder="0" value={qdf.value} onChange={e=>setQdf(p=>({...p,value:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setQdModal(false)}>キャンセル</OutBtn>
            <Btn onClick={()=>addDeal(workspace)} style={{flex:2,padding:12,opacity:qdf.company.trim()?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}
      {memberModal!==null&&(
        <BottomSheet onClose={()=>setMemberModal(null)} title="メンバーを追加">
          {[{l:"氏名",k:"name",ph:"山田 太郎"},{l:"役割",k:"role",ph:"エンジニア / デザイナー"},{l:"電話番号",k:"phone",ph:"090-0000-0000"}].map(f=>(
            <div key={f.k} style={{marginBottom:12}}><label style={lbSt}>{f.l}</label><input style={iSt} placeholder={f.ph} value={mf[f.k]} onChange={e=>setMf(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setMemberModal(null)}>キャンセル</OutBtn>
            <Btn onClick={()=>saveMember(memberModal)} style={{flex:2,padding:12,opacity:mf.name.trim()?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}
      {msModal!==null&&(
        <BottomSheet onClose={()=>setMsModal(null)} title="マイルストーンを追加">
          <label style={lbSt}>内容</label>
          <input style={{...iSt,marginBottom:18}} placeholder="例: 初売上を達成する" value={msf.text} onChange={e=>setMsf(p=>({...p,text:e.target.value}))} autoFocus/>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setMsModal(null)}>キャンセル</OutBtn>
            <Btn onClick={()=>saveMilestone(msModal)} style={{flex:2,padding:12,opacity:msf.text.trim()?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}
      {okrModal&&(
        <BottomSheet onClose={()=>setOkrModal(false)} title="OKRを追加">
          <label style={lbSt}>四半期（任意）</label>
          <input style={{...iSt,marginBottom:12}} placeholder="例: 2026 Q3" value={okrf.quarter} onChange={e=>setOkrf(p=>({...p,quarter:e.target.value}))}/>
          <label style={lbSt}>Objective（達成したい状態）</label>
          <input style={{...iSt,marginBottom:14}} placeholder="例: 国内No.1のサービスになる" value={okrf.objective} onChange={e=>setOkrf(p=>({...p,objective:e.target.value}))} autoFocus/>
          {[1,2,3].map(n=>(
            <div key={n} style={{marginBottom:12,padding:10,background:C.b2,borderRadius:8}}>
              <label style={lbSt}>Key Result {n}</label>
              <input style={{...iSt,marginBottom:8}} placeholder={n===1?"例: 月商を100万円にする":"指標"} value={okrf["kr"+n]} onChange={e=>setOkrf(p=>({...p,["kr"+n]:e.target.value}))}/>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><label style={{...lbSt,fontSize:9}}>現状</label><input type="number" style={iSt} placeholder="0" value={okrf["kr"+n+"Cur"]} onChange={e=>setOkrf(p=>({...p,["kr"+n+"Cur"]:e.target.value}))}/></div>
                <div style={{flex:1}}><label style={{...lbSt,fontSize:9}}>目標</label><input type="number" style={iSt} placeholder="100" value={okrf["kr"+n+"Target"]} onChange={e=>setOkrf(p=>({...p,["kr"+n+"Target"]:e.target.value}))}/></div>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <OutBtn onClick={()=>setOkrModal(false)}>キャンセル</OutBtn>
            <Btn onClick={()=>addOkr(workspace)} style={{flex:2,padding:12,opacity:okrf.objective.trim()?1:.4}}>追加する</Btn>
          </div>
        </BottomSheet>
      )}
      {gigModal&&(
        <BottomSheet onClose={()=>setGigModal(false)} title="商品・スキルを登録">
          <label style={lbSt}>タイトル</label>
          <input style={{...iSt,marginBottom:12}} placeholder="例: 動画編集 / Webサイト制作" value={gigf.title} onChange={e=>setGigf(p=>({...p,title:e.target.value}))} autoFocus/>
          <label style={lbSt}>説明</label>
          <textarea style={{...iSt,height:60,resize:"none",marginBottom:12}} placeholder="提供内容・納期など" value={gigf.desc} onChange={e=>setGigf(p=>({...p,desc:e.target.value}))}/>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={lbSt}>価格</label>
              <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 10px"}}>
                <span style={{color:C.go,fontFamily:M,marginRight:4}}>¥</span>
                <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,fontFamily:M,padding:"10px 0"}} placeholder="10000" value={gigf.price} onChange={e=>setGigf(p=>({...p,price:e.target.value}))}/>
              </div>
            </div>
            <div><label style={lbSt}>単位</label><input style={iSt} placeholder="件" value={gigf.unit} onChange={e=>setGigf(p=>({...p,unit:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setGigModal(false)}>キャンセル</OutBtn>
            <Btn onClick={()=>addGig(workspace)} style={{flex:2,padding:12,opacity:gigf.title.trim()?1:.4}}>登録する</Btn>
          </div>
        </BottomSheet>
      )}
      {orderModal&&(
        <BottomSheet onClose={()=>setOrderModal(false)} title="案件を記録">
          <label style={lbSt}>商品・スキル</label>
          {wsG.length===0?(
            <div style={{fontSize:11,color:C.t3,padding:"8px 10px",background:C.b2,borderRadius:8,marginBottom:12}}>先に商品・スキルを登録してください</div>
          ):(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {wsG.map(g=>(
                <button key={g.id} onClick={()=>setOrdf(p=>({...p,gigId:g.id,amount:String(g.price)}))} style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${ordf.gigId===g.id?C.ac:C.bd}`,background:ordf.gigId===g.id?C.aD:"transparent",color:ordf.gigId===g.id?C.ac:C.t2,fontSize:11,fontWeight:600,cursor:"pointer"}}>{g.title}</button>
              ))}
            </div>
          )}
          <label style={lbSt}>クライアント名</label>
          <input style={{...iSt,marginBottom:12}} placeholder="例: 〇〇株式会社 / 山田様" value={ordf.client} onChange={e=>setOrdf(p=>({...p,client:e.target.value}))}/>
          <label style={lbSt}>金額</label>
          <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:12}}>
            <span style={{color:C.go,fontFamily:M,marginRight:6}}>¥</span>
            <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",fontSize:15,fontFamily:M,padding:"10px 0"}} placeholder="0" value={ordf.amount} onChange={e=>setOrdf(p=>({...p,amount:e.target.value}))}/>
          </div>
          <label style={lbSt}>ステータス</label>
          <div style={{display:"flex",gap:5,marginBottom:14}}>
            {["進行中","納品済み","入金済み"].map(s=>(
              <button key={s} onClick={()=>setOrdf(p=>({...p,status:s}))} style={{flex:1,padding:"7px 0",borderRadius:7,border:`1px solid ${ordf.status===s?ordC[s]:C.bd}`,background:ordf.status===s?ordC[s]+"18":"transparent",color:ordf.status===s?ordC[s]:C.t3,fontSize:11,fontWeight:600,cursor:"pointer"}}>{s}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setOrderModal(false)}>キャンセル</OutBtn>
            <Btn onClick={()=>addOrder(workspace)} style={{flex:2,padding:12,opacity:(ordf.gigId&&ordf.client.trim())?1:.4}}>記録する</Btn>
          </div>
        </BottomSheet>
      )}
    </div>
  );

  // ── List view: "ビジネスをつくる場所" — Roblox for businesses ──
  const EMOJIS = ["🚀","💎","🔥","⚡","🌙","🛸","🪐","🎨","🎮","🎧","📸","☕","🍜","🌸","🏝️","🌋","🦊","🐉","🦄","🦁","👑","🗝️","💼","🛠️","🧪","📚","🎬","🪄","🧠","🎯","🌈","✨"];
  const THEMES = [
    {id:"violet",   g:"linear-gradient(135deg,#7C3AED 0%,#EC4899 100%)", solid:"#7C3AED"},
    {id:"sunset",   g:"linear-gradient(135deg,#F97316 0%,#EF4444 100%)", solid:"#F97316"},
    {id:"ocean",    g:"linear-gradient(135deg,#0EA5E9 0%,#6366F1 100%)", solid:"#0EA5E9"},
    {id:"forest",   g:"linear-gradient(135deg,#10B981 0%,#0891B2 100%)", solid:"#10B981"},
    {id:"gold",     g:"linear-gradient(135deg,#F59E0B 0%,#B8860B 100%)", solid:"#F59E0B"},
    {id:"mono",     g:"linear-gradient(135deg,#374151 0%,#0F172A 100%)", solid:"#374151"},
    {id:"candy",    g:"linear-gradient(135deg,#F472B6 0%,#A78BFA 100%)", solid:"#F472B6"},
    {id:"matrix",   g:"linear-gradient(135deg,#22C55E 0%,#064E3B 100%)", solid:"#22C55E"},
  ];
  const themeOf = (v) => THEMES.find(t=>t.id===v?.theme) || THEMES[0];
  const emojiOf = (v) => v?.emoji || "🚀";
  const [advOpen,setAdvOpen] = useState(false);

  return (
    <div style={{background:C.bg,minHeight:"100%",paddingBottom:40}}>
      {/* Hero header */}
      <div style={{position:"relative",padding:"24px 18px 22px",background:"linear-gradient(160deg,#0F172A 0%,#1E1B4B 55%,#312E81 100%)",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-20,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,#7C3AED55,transparent 70%)",filter:"blur(8px)"}}/>
        <div style={{position:"absolute",bottom:-40,left:-20,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,#EC489955,transparent 70%)",filter:"blur(8px)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:10,color:"#A5B4FC",letterSpacing:3,marginBottom:6,textTransform:"uppercase",fontFamily:M,fontWeight:700}}>YEN. Studio</div>
          <div style={{fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.15,letterSpacing:-0.5,marginBottom:6}}>ビジネスを、<br/>つくろう。</div>
          <div style={{fontSize:12,color:"#CBD5E1",lineHeight:1.6,marginBottom:16,maxWidth:280}}>あなただけの事業を、ゼロから創造する場所。<br/>世界観もチームもルールも、ぜんぶ自由。</div>
          <button onClick={()=>{setVf({name:"",desc:"",genre:"",stage:"アイデア",pitch:"",customer:"",problem:"",solution:"",model:"サブスク",emoji:EMOJIS[Math.floor(Math.random()*EMOJIS.length)],theme:THEMES[Math.floor(Math.random()*THEMES.length)].id});setAdvOpen(false);setVentureModal("new");}} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:999,border:"none",background:"linear-gradient(135deg,#F472B6,#A78BFA)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 24px rgba(167,139,250,0.45)"}}>
            <span style={{fontSize:16,lineHeight:1}}>＋</span> 新しい世界を創る
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {ventures.length>0&&(
        <div style={{display:"flex",gap:8,padding:"14px 18px 4px",overflowX:"auto"}}>
          {[
            {l:"WORLDS",v:ventures.length},
            {l:"BUILDING",v:ventures.filter(v=>v.stage!=="拡大").length},
            {l:"LIVE",v:ventures.filter(v=>v.stage==="ローンチ"||v.stage==="拡大").length},
          ].map((s,i)=>(
            <div key={i} style={{flex:1,minWidth:80,padding:"10px 12px",borderRadius:12,background:C.bs,border:`1px solid ${C.bd}`}}>
              <div style={{fontSize:8,color:C.t3,letterSpacing:1.5,fontWeight:700,marginBottom:3}}>{s.l}</div>
              <div style={{fontSize:18,fontWeight:800,color:C.t1,fontFamily:M}}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{padding:"16px 16px 0"}}>
        {ventures.length===0&&(
          <div style={{textAlign:"center",padding:"48px 20px 30px"}}>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:18,fontSize:38,filter:"drop-shadow(0 6px 12px rgba(124,58,237,0.25))"}}>
              <span style={{transform:"rotate(-12deg)"}}>🚀</span>
              <span style={{transform:"translateY(-6px)"}}>💎</span>
              <span style={{transform:"rotate(10deg)"}}>🔥</span>
            </div>
            <div style={{fontSize:16,fontWeight:800,color:C.t1,marginBottom:8}}>まだ世界がありません</div>
            <div style={{fontSize:12,color:C.t2,lineHeight:1.8}}>カフェ、SaaS、レーベル、なんでもいい。<br/>あなたの最初のビジネスを生み出そう。</div>
          </div>
        )}

        {ventures.map(v=>{
          const th = themeOf(v);
          const em = emojiOf(v);
          const vRev=finances.filter(f=>f.ventureId===v.id&&f.type==="revenue").reduce((a,b)=>a+b.amount,0);
          const vT=tasks.filter(t=>t.ventureId===v.id&&!t.done).length;
          const vD=deals.filter(d=>d.ventureId===v.id).length;
          const vMem=(v.members?.length||0)+1;
          return (
            <div key={v.id} style={{position:"relative",marginBottom:16,borderRadius:18,overflow:"hidden",background:C.bs,border:`1px solid ${C.bd}`,boxShadow:"0 4px 14px rgba(15,23,42,0.06)"}}>
              {/* Cover */}
              <button onClick={()=>{setWorkspace(v.id);setWsTab("okr");}} style={{display:"block",width:"100%",padding:0,border:"none",cursor:"pointer",background:th.g,position:"relative",height:130,overflow:"hidden",textAlign:"left"}}>
                <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%)"}}/>
                <div style={{position:"absolute",top:12,left:14,display:"inline-flex",alignItems:"center",gap:6,padding:"4px 9px",borderRadius:999,background:"rgba(255,255,255,0.22)",backdropFilter:"blur(8px)",fontSize:9,fontWeight:700,color:"#fff",letterSpacing:1}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/> {v.stage}
                </div>
                <div style={{position:"absolute",top:10,right:10,display:"flex",gap:6}}>
                  <span onClick={(e)=>{e.stopPropagation();setVf({name:v.name,desc:v.desc||"",genre:v.genre||"",stage:v.stage,pitch:v.pitch||"",customer:v.customer||"",problem:v.problem||"",solution:v.solution||"",model:v.model||"サブスク",emoji:v.emoji||"🚀",theme:v.theme||"violet"});setAdvOpen(false);setVentureModal(v);}} style={{width:30,height:30,borderRadius:8,background:"rgba(0,0,0,0.25)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </span>
                </div>
                <div style={{position:"absolute",bottom:-10,left:14,fontSize:78,lineHeight:1,filter:"drop-shadow(0 6px 14px rgba(0,0,0,0.3))"}}>{em}</div>
              </button>

              {/* Body */}
              <div style={{padding:"14px 16px 14px"}}>
                <div style={{fontSize:17,fontWeight:800,color:C.t1,letterSpacing:-0.3,marginBottom:3}}>{v.name}</div>
                <div style={{fontSize:11.5,color:C.t2,lineHeight:1.55,marginBottom:12,minHeight:18}}>
                  {v.pitch || v.desc || v.genre || "ピッチを書いて世界観を伝えよう"}
                </div>
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  <div style={{flex:"1 1 70px",padding:"7px 9px",borderRadius:9,background:C.b2}}>
                    <div style={{fontSize:8,color:C.t3,letterSpacing:1,fontWeight:700}}>REVENUE</div>
                    <div style={{fontSize:13,fontWeight:800,color:C.gr,fontFamily:M}}>{fmtK(vRev)}</div>
                  </div>
                  <div style={{flex:"1 1 50px",padding:"7px 9px",borderRadius:9,background:C.b2}}>
                    <div style={{fontSize:8,color:C.t3,letterSpacing:1,fontWeight:700}}>CREW</div>
                    <div style={{fontSize:13,fontWeight:800,color:C.t1,fontFamily:M}}>{vMem}</div>
                  </div>
                  <div style={{flex:"1 1 50px",padding:"7px 9px",borderRadius:9,background:C.b2}}>
                    <div style={{fontSize:8,color:C.t3,letterSpacing:1,fontWeight:700}}>TASK</div>
                    <div style={{fontSize:13,fontWeight:800,color:C.ac,fontFamily:M}}>{vT}</div>
                  </div>
                  <div style={{flex:"1 1 50px",padding:"7px 9px",borderRadius:9,background:C.b2}}>
                    <div style={{fontSize:8,color:C.t3,letterSpacing:1,fontWeight:700}}>DEAL</div>
                    <div style={{fontSize:13,fontWeight:800,color:C.pu,fontFamily:M}}>{vD}</div>
                  </div>
                </div>
                <button onClick={()=>{setWorkspace(v.id);setWsTab("okr");}} style={{width:"100%",padding:"12px",borderRadius:11,border:"none",background:th.g,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",letterSpacing:0.3,boxShadow:`0 6px 16px ${th.solid}40`}}>
                  ▶ この世界に入る
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {ventureModal!==null&&(
        <BottomSheet onClose={()=>setVentureModal(null)} title={ventureModal==="new"?"新しい世界を創る":"世界を編集"}>
          {/* Live preview */}
          <div style={{borderRadius:14,overflow:"hidden",marginBottom:16,background:themeOf(vf).g,padding:"18px 16px",position:"relative",height:110}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%)"}}/>
            <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:54,lineHeight:1,filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.3))"}}>{vf.emoji||"🚀"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:17,fontWeight:800,color:"#fff",letterSpacing:-0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vf.name||"無題の世界"}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",lineHeight:1.4,marginTop:3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{vf.pitch||"ピッチを書こう"}</div>
              </div>
            </div>
          </div>

          {/* Emoji picker */}
          <label style={lbSt}>シンボル</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5,marginBottom:14,padding:8,background:C.b2,borderRadius:10}}>
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=>setVf(p=>({...p,emoji:e}))} style={{padding:6,fontSize:20,borderRadius:7,border:"none",background:vf.emoji===e?"#fff":"transparent",cursor:"pointer",boxShadow:vf.emoji===e?"0 2px 6px rgba(0,0,0,0.1)":"none",transform:vf.emoji===e?"scale(1.08)":"scale(1)",transition:"all 0.15s"}}>{e}</button>
            ))}
          </div>

          {/* Theme picker */}
          <label style={lbSt}>カラーテーマ</label>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {THEMES.map(t=>(
              <button key={t.id} onClick={()=>setVf(p=>({...p,theme:t.id}))} style={{width:38,height:38,borderRadius:"50%",border:vf.theme===t.id?"3px solid #111":"3px solid transparent",background:t.g,cursor:"pointer",padding:0,boxShadow:vf.theme===t.id?`0 4px 10px ${t.solid}60`:"none"}}/>
            ))}
          </div>

          <label style={lbSt}>世界の名前</label>
          <input style={{...iSt,marginBottom:12,fontSize:15,fontWeight:700}} placeholder="例: 月夜のカフェ / NeoSaaS / Studio名" value={vf.name} onChange={e=>setVf(p=>({...p,name:e.target.value}))} autoFocus/>

          <label style={lbSt}>一行で世界観を語る</label>
          <input style={{...iSt,marginBottom:14}} placeholder="例: 深夜だけ開く、思想に出会えるカフェ" value={vf.pitch} onChange={e=>setVf(p=>({...p,pitch:e.target.value}))}/>

          <label style={lbSt}>ステージ</label>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {STAGES.map(s=>(
              <button key={s} onClick={()=>setVf(p=>({...p,stage:s}))} style={{padding:"7px 12px",borderRadius:999,border:`1px solid ${vf.stage===s?stageC[s]:C.bd}`,background:vf.stage===s?stageC[s]+"18":"transparent",color:vf.stage===s?stageC[s]:C.t2,fontSize:11,fontWeight:700,cursor:"pointer"}}>{s}</button>
            ))}
          </div>

          {/* Advanced (collapsible, optional) */}
          <button onClick={()=>setAdvOpen(o=>!o)} style={{width:"100%",padding:"10px",borderRadius:9,border:`1px dashed ${C.bd}`,background:"transparent",color:C.t2,fontSize:11,fontWeight:600,cursor:"pointer",marginBottom:advOpen?12:18}}>
            {advOpen?"− 詳細を閉じる":"+ もっと深く設計する (任意)"}
          </button>
          {advOpen&&(
            <div style={{padding:12,background:C.b2,borderRadius:10,marginBottom:16}}>
              <label style={lbSt}>ジャンル</label>
              <input style={{...iSt,marginBottom:10}} placeholder="SaaS / EC / カフェ / レーベル..." value={vf.genre} onChange={e=>setVf(p=>({...p,genre:e.target.value}))}/>
              <label style={lbSt}>誰のための世界?</label>
              <input style={{...iSt,marginBottom:10}} placeholder="ターゲット顧客" value={vf.customer} onChange={e=>setVf(p=>({...p,customer:e.target.value}))}/>
              <label style={lbSt}>解く課題</label>
              <textarea style={{...iSt,height:48,resize:"none",marginBottom:10}} placeholder="どんな痛みを消す?" value={vf.problem} onChange={e=>setVf(p=>({...p,problem:e.target.value}))}/>
              <label style={lbSt}>解決のしかた</label>
              <textarea style={{...iSt,height:48,resize:"none",marginBottom:10}} placeholder="どう解決する?" value={vf.solution} onChange={e=>setVf(p=>({...p,solution:e.target.value}))}/>
              <label style={lbSt}>稼ぎ方</label>
              <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                {["サブスク","単発販売","広告","副業案件","手数料","その他"].map(m=>(
                  <button key={m} onClick={()=>setVf(p=>({...p,model:m}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${vf.model===m?C.ac:C.bd}`,background:vf.model===m?C.aD:"#fff",color:vf.model===m?C.ac:C.t2,fontSize:11,fontWeight:600,cursor:"pointer"}}>{m}</button>
                ))}
              </div>
              <label style={lbSt}>メモ</label>
              <textarea style={{...iSt,height:52,resize:"none"}} placeholder="自由に書く" value={vf.desc} onChange={e=>setVf(p=>({...p,desc:e.target.value}))}/>
            </div>
          )}

          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setVentureModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveVenture} style={{flex:2,padding:13,opacity:vf.name.trim()?1:.4,background:themeOf(vf).g,border:"none"}}>{ventureModal==="new"?"世界を創る ✨":"保存する"}</Btn>
          </div>
          {ventureModal!=="new"&&<button onClick={()=>{setVentures(p=>p.filter(x=>x.id!==ventureModal.id));setVentureModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>この世界を削除</button>}
        </BottomSheet>
      )}
    </div>
  );
};




// ─────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────
const ProfileTab = ({uname,setUname,companyName,setCompanyName,genre,setGenre,bizDesc,setBizDesc,founded,setFounded,instagram,setInstagram,twitter,setTwitter,youtube,setYoutube,monthlyGoal,setMonthlyGoal,setLoggedIn,balance=0}) => {
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState({});
  const [contacts, setContacts] = useLS("yen_contacts",[]);
  const [contactModal,setContactModal] = useState(null);
  const [ctf,setCtf] = useState({name:"",company:"",role:"",phone:"",email:"",sns:"",note:""});
  const [pwModal,setPwModal] = useState(false);
  const [pwNew,setPwNew] = useState("");
  const [pwConf,setPwConf] = useState("");
  const [pwErr,setPwErr] = useState("");
  const [pwInfo,setPwInfo] = useState("");
  const [pwLoading,setPwLoading] = useState(false);

  const saveContact = () => {
    if (!ctf.name.trim()) return;
    contactModal==="new" ? setContacts(p=>[...p,{...ctf,id:Date.now()}]) : setContacts(p=>p.map(x=>x.id===contactModal.id?{...x,...ctf}:x));
    setContactModal(null);
  };

  const openPwModal = () => { setPwNew(""); setPwConf(""); setPwErr(""); setPwInfo(""); setPwModal(true); };
  const handleChangePassword = async () => {
    setPwErr(""); setPwInfo("");
    if (pwNew.length < 6) { setPwErr("パスワードは6文字以上で入力してください"); return; }
    if (pwNew !== pwConf) { setPwErr("パスワードが一致しません"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (error) { setPwErr(error.message || "変更に失敗しました"); return; }
    setPwInfo("パスワードを変更しました");
    setPwNew(""); setPwConf("");
    setTimeout(()=>setPwModal(false), 1200);
  };

  return (
    <div style={{background:C.bg,minHeight:"100%"}}>
      <div style={{background:C.bs,padding:"24px 18px 18px",borderBottom:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
          <div style={{width:64,height:64,borderRadius:16,background:`linear-gradient(135deg,${C.ac},${C.pu})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#fff",flexShrink:0}}>{uname?uname[0]:"?"}</div>
          <div style={{flex:1,paddingTop:2}}>
            <div style={{fontSize:18,fontWeight:700,color:C.t1,marginBottom:3}}>{uname||"名前未設定"}</div>
            {companyName&&<div style={{fontSize:13,color:C.t2,marginBottom:4}}>{companyName}</div>}
            {genre&&<div style={{fontSize:11,color:C.t3,marginTop:4}}>{genre}</div>}
          </div>
        </div>
        {bizDesc&&<div style={{fontSize:12,color:C.t2,lineHeight:1.7,marginBottom:12,padding:"10px 12px",background:C.b2,borderRadius:9}}>{bizDesc}</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {instagram&&<a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#E1306C",background:"#E1306C12",borderRadius:6,padding:"4px 10px",textDecoration:"none",fontWeight:600}}>📷 @{instagram}</a>}
          {twitter&&<a href={`https://x.com/${twitter}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.t1,background:C.b2,borderRadius:6,padding:"4px 10px",textDecoration:"none",fontWeight:600}}>✕ @{twitter}</a>}
          {youtube&&<a href={`https://youtube.com/@${youtube}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#FF0000",background:"#FF000012",borderRadius:6,padding:"4px 10px",textDecoration:"none",fontWeight:600}}>▶ {youtube}</a>}
          {founded&&<span style={{fontSize:11,color:C.t3,background:C.b2,borderRadius:6,padding:"4px 10px"}}>設立 {founded}</span>}
        </div>
      </div>
      <div style={{padding:16}}>
        <div style={{padding:18,marginBottom:14,borderRadius:14,background:"linear-gradient(135deg,#0F1E3D 0%,#1E3A6E 55%,#2C5282 100%)",color:"#fff",boxShadow:"0 6px 20px -8px rgba(15,30,61,.4)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:3,opacity:.7,marginBottom:8,fontFamily:M}}>YEN WALLET · 残高</div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <div style={{fontSize:32,fontWeight:900,fontFamily:M,letterSpacing:.5}}>{fmt(balance)}</div>
            <div style={{fontSize:14,fontWeight:800,opacity:.85,letterSpacing:2,fontFamily:M}}>YEN</div>
          </div>
          <div style={{fontSize:10.5,opacity:.7,marginTop:6,lineHeight:1.6}}>YEN. 内で使える仮想通貨。サービスの売買・決済に利用できます。</div>
        </div>

        {editing?(
          <div style={{...card,padding:14,marginBottom:14}}>
            <div style={{fontSize:10,color:C.t3,letterSpacing:2,marginBottom:14,textTransform:"uppercase"}}>プロフィールを編集</div>
            {[{l:"氏名・屋号",k:"uname",v:tmp.uname??uname},{l:"会社名",k:"companyName",v:tmp.companyName??companyName},{l:"事業内容・ジャンル",k:"genre",v:tmp.genre??genre},{l:"事業説明",k:"bizDesc",v:tmp.bizDesc??bizDesc},{l:"設立日",k:"founded",v:tmp.founded??founded,ph:"例: 2024年4月"},{l:"Instagram ID",k:"instagram",v:tmp.instagram??instagram,ph:"@なしで入力"},{l:"X (Twitter) ID",k:"twitter",v:tmp.twitter??twitter,ph:"@なしで入力"},{l:"YouTubeチャンネル",k:"youtube",v:tmp.youtube??youtube}].map(f=>(
              <div key={f.k} style={{marginBottom:10}}>
                <label style={lbSt}>{f.l}</label>
                <input style={iSt} placeholder={f.ph||""} value={f.v||""} onChange={e=>setTmp(p=>({...p,[f.k]:e.target.value}))}/>
              </div>
            ))}
            <label style={lbSt}>月次売上目標</label>
            <div style={{display:"flex",alignItems:"center",background:C.b2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"0 12px",marginBottom:14}}>
              <span style={{color:C.gr,fontFamily:M,marginRight:6,fontWeight:700}}>¥</span>
              <input type="number" style={{flex:1,background:"none",border:"none",outline:"none",color:C.t1,fontSize:15,fontFamily:M,padding:"10px 0"}} placeholder="0" value={tmp.monthlyGoal??monthlyGoal} onChange={e=>setTmp(p=>({...p,monthlyGoal:parseInt(e.target.value)||0}))}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <OutBtn onClick={()=>setEditing(false)}>キャンセル</OutBtn>
              <Btn onClick={()=>{
                if(tmp.uname!==undefined)setUname(tmp.uname);
                if(tmp.companyName!==undefined)setCompanyName(tmp.companyName);
                if(tmp.genre!==undefined)setGenre(tmp.genre);
                if(tmp.bizDesc!==undefined)setBizDesc(tmp.bizDesc);
                if(tmp.founded!==undefined)setFounded(tmp.founded);
                if(tmp.instagram!==undefined)setInstagram(tmp.instagram);
                if(tmp.twitter!==undefined)setTwitter(tmp.twitter);
                if(tmp.youtube!==undefined)setYoutube(tmp.youtube);
                if(tmp.monthlyGoal!==undefined)setMonthlyGoal(tmp.monthlyGoal);
                setEditing(false);
              }} style={{flex:2,padding:12}}>保存する</Btn>
            </div>
          </div>
        ):(
          <button onClick={()=>{setEditing(true);setTmp({});}} style={{width:"100%",marginBottom:14,padding:"11px",borderRadius:10,border:`1px solid ${C.bd}`,background:"transparent",color:C.t2,fontSize:13,cursor:"pointer"}}>✏️ プロフィールを編集</button>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,color:C.t3,letterSpacing:2,textTransform:"uppercase"}}>コンタクト</div>
          <button onClick={()=>{setCtf({name:"",company:"",role:"",phone:"",email:"",sns:"",note:""});setContactModal("new");}} style={{fontSize:11,color:C.ac,background:"transparent",border:"none",cursor:"pointer",fontWeight:600}}>+ 追加</button>
        </div>
        {contacts.length>0?(
          <div style={{...card,padding:0,overflow:"hidden",marginBottom:14}}>
            {contacts.map((c,i)=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:i<contacts.length-1?`1px solid ${C.bd}`:"none"}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.ac},${C.pu})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>{c.name[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:2}}>{c.name}</div>
                  <div style={{fontSize:11,color:C.t2}}>{c.company}{c.role&&` · ${c.role}`}</div>
                  {c.phone&&<div style={{fontSize:11,color:C.ac,marginTop:2}}>{c.phone}</div>}
                </div>
                <button onClick={()=>{setCtf({...c});setContactModal(c);}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${C.bd}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.t3} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            ))}
          </div>
        ):(
          <div style={{...card,textAlign:"center",padding:"24px 20px",marginBottom:14}}><div style={{fontSize:12,color:C.t3}}>コンタクトがありません</div></div>
        )}
        <button onClick={openPwModal} style={{width:"100%",marginBottom:8,padding:"12px",borderRadius:10,border:`1px solid ${C.bd}`,background:"transparent",color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>🔒 パスワードを変更</button>
        <button onClick={()=>setLoggedIn(false)} style={{width:"100%",padding:"12px",borderRadius:10,border:`1px solid ${C.re}28`,background:C.rD,color:C.re,fontSize:13,fontWeight:600,cursor:"pointer"}}>ログアウト</button>
      </div>

      {pwModal&&(
        <BottomSheet onClose={()=>setPwModal(false)} title="パスワードを変更">
          <div style={{marginBottom:10}}>
            <label style={lbSt}>新しいパスワード</label>
            <input type="password" autoComplete="new-password" style={iSt} placeholder="6文字以上" value={pwNew} onChange={e=>setPwNew(e.target.value)}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={lbSt}>新しいパスワード（確認）</label>
            <input type="password" autoComplete="new-password" style={iSt} placeholder="もう一度入力" value={pwConf} onChange={e=>setPwConf(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleChangePassword()}/>
          </div>
          {pwErr&&<div style={{fontSize:12,color:C.re,marginBottom:10,padding:"8px 10px",background:C.rD,borderRadius:8}}>{pwErr}</div>}
          {pwInfo&&<div style={{fontSize:12,color:C.gr,marginBottom:10,padding:"8px 10px",background:C.gD,borderRadius:8}}>{pwInfo}</div>}
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setPwModal(false)}>キャンセル</OutBtn>
            <Btn onClick={handleChangePassword} style={{flex:2,padding:12,opacity:pwLoading?.6:1}}>{pwLoading?"変更中...":"変更する"}</Btn>
          </div>
        </BottomSheet>
      )}

      {contactModal!==null&&(
        <BottomSheet onClose={()=>setContactModal(null)} title={contactModal==="new"?"コンタクトを追加":"コンタクトを編集"}>
          {[{l:"氏名",k:"name",ph:"山田 太郎"},{l:"会社名",k:"company",ph:"株式会社〇〇"},{l:"役職",k:"role",ph:"代表取締役"},{l:"電話番号",k:"phone",ph:"090-0000-0000"},{l:"メール",k:"email",ph:"example@gmail.com"},{l:"SNS",k:"sns",ph:"@username"},{l:"メモ",k:"note",ph:"備考"}].map(f=>(
            <div key={f.k} style={{marginBottom:10}}><label style={lbSt}>{f.l}</label><input style={iSt} placeholder={f.ph} value={ctf[f.k]} onChange={e=>setCtf(p=>({...p,[f.k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <OutBtn onClick={()=>setContactModal(null)}>キャンセル</OutBtn>
            <Btn onClick={saveContact} style={{flex:2,padding:12,opacity:ctf.name.trim()?1:.4}}>{contactModal==="new"?"追加する":"保存する"}</Btn>
          </div>
          {contactModal!=="new"&&<button onClick={()=>{setContacts(p=>p.filter(x=>x.id!==contactModal.id));setContactModal(null);}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12,fontWeight:600,cursor:"pointer"}}>削除する</button>}
        </BottomSheet>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// MARKETPLACE TAB
// ─────────────────────────────────────────
const CATS = ["コンサルティング","プロフェッショナルサービス","SaaS / プロダクト","業務委託","リサーチ / 調査","その他"];

const MarketTab = ({uname, currentUserId, balance=0, reloadWallet}) => {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [scope,    setScope]    = useState("all");
  const [modal,    setModal]    = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [form,     setForm]     = useState({title:"",description:"",category:"コンサルティング",price:"",unit:"件",contact:"",image_url:""});
  const [saving,   setSaving]   = useState(false);
  const [buying,   setBuying]   = useState(false);
  const [buyMsg,   setBuyMsg]   = useState(null); // {ok:boolean,text:string}


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("listings").select("*").order("created_at",{ascending:false});
    if (!error && data) setListings(data);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const openNew = () => { setForm({title:"",description:"",category:"コンサルティング",price:"",unit:"件",contact:"",image_url:""}); setModal("new"); };
  const openEdit = (l) => { setForm({title:l.title,description:l.description||"",category:l.category,price:String(l.price||""),unit:l.unit||"件",contact:l.contact||"",image_url:l.image_url||""}); setModal(l); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      seller_id: currentUserId,
      seller_name: uname || "匿名",
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseInt(form.price)||0,
      unit: form.unit||"件",
      contact: form.contact.trim(),
      image_url: form.image_url.trim() || null,
      status: "active",
    };
    if (modal === "new") await supabase.from("listings").insert(payload);
    else await supabase.from("listings").update(payload).eq("id", modal.id);
    setSaving(false); setModal(null); load();
  };

  const remove = async (id) => {
    if (!confirm("この掲載を取り下げますか？")) return;
    await supabase.from("listings").delete().eq("id", id);
    setModal(null); setDetail(null); load();
  };

  const handlePurchase = async () => {
    if (!detail) return;
    setBuyMsg(null);
    if (balance < (detail.price||0)) { setBuyMsg({ok:false,text:`YEN残高が不足しています（残高: ${fmt(balance)} YEN）`}); return; }
    if (!confirm(`${fmt(detail.price)} YEN で「${detail.title}」を購入しますか？`)) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.rpc("purchase_listing", { p_listing_id: detail.id });
      if (error) throw error;
      if (data?.ok) {
        setBuyMsg({ok:true,text:`購入が完了しました。残高: ${fmt(data.balance)} YEN`});
        reloadWallet && reloadWallet();
      } else {
        setBuyMsg({ok:false,text:data?.error || "購入に失敗しました"});
      }
    } catch(e) {
      setBuyMsg({ok:false,text:e?.message || "購入に失敗しました"});
    }
    setBuying(false);
  };


  const visible = listings.filter(l => {
    if (scope==="mine" && l.seller_id !== currentUserId) return false;
    if (filter!=="all" && l.category !== filter) return false;
    return true;
  });

  const chipSt = (a) => ({padding:"6px 12px",borderRadius:999,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${a?C.ac:C.bd}`,background:a?C.ac:"#fff",color:a?"#fff":C.t2,whiteSpace:"nowrap"});

  return (
    <div style={{background:C.bg,minHeight:"100%",paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#0F1E3D 0%,#1E3A6E 60%,#2C5282 100%)",padding:"22px 18px 26px",color:"#fff",borderBottom:`1px solid ${C.bd}`}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:4,opacity:.75,marginBottom:6,fontFamily:M}}>BUSINESS DIRECTORY</div>
        <div style={{fontSize:22,fontWeight:800,marginBottom:6,letterSpacing:.2}}>事業 ＆ サービス ショーケース</div>
        <div style={{fontSize:11.5,opacity:.85,lineHeight:1.55}}>起業家・事業者が提供するサービスを掲載し、提携・受発注のきっかけを生み出す場</div>
        <div style={{display:"flex",gap:14,marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,.15)"}}>
          <div><div style={{fontSize:9,letterSpacing:2,opacity:.7,fontFamily:M}}>LISTED</div><div style={{fontSize:16,fontWeight:700,fontFamily:M}}>{listings.length}</div></div>
          <div><div style={{fontSize:9,letterSpacing:2,opacity:.7,fontFamily:M}}>MINE</div><div style={{fontSize:16,fontWeight:700,fontFamily:M}}>{listings.filter(l=>l.seller_id===currentUserId).length}</div></div>
        </div>
      </div>

      <div style={{padding:"14px 16px 8px",display:"flex",gap:8}}>
        <button onClick={()=>setScope("all")} style={{flex:1,padding:"10px",borderRadius:6,border:`1px solid ${scope==="all"?C.t1:C.bd}`,background:scope==="all"?C.t1:"#fff",color:scope==="all"?"#fff":C.t2,fontSize:11.5,fontWeight:600,cursor:"pointer",letterSpacing:.5}}>全ての事業</button>
        <button onClick={()=>setScope("mine")} style={{flex:1,padding:"10px",borderRadius:6,border:`1px solid ${scope==="mine"?C.t1:C.bd}`,background:scope==="mine"?C.t1:"#fff",color:scope==="mine"?"#fff":C.t2,fontSize:11.5,fontWeight:600,cursor:"pointer",letterSpacing:.5}}>自社の掲載</button>
      </div>

      <div style={{padding:"4px 16px 12px",display:"flex",gap:6,overflowX:"auto"}}>
        <div onClick={()=>setFilter("all")} style={chipSt(filter==="all")}>すべての業種</div>
        {CATS.map(c=>(<div key={c} onClick={()=>setFilter(c)} style={chipSt(filter===c)}>{c}</div>))}
      </div>

      <div style={{padding:"0 16px 14px"}}>
        <button onClick={openNew} style={{width:"100%",padding:"13px",borderRadius:6,border:`1px solid ${C.t1}`,background:C.t1,color:"#fff",fontSize:12.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,letterSpacing:1}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          サービスを掲載する
        </button>
      </div>

      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:10}}>
        {loading && <div style={{...card,padding:20,textAlign:"center",fontSize:12,color:C.t3}}>読み込み中...</div>}
        {!loading && visible.length===0 && <div style={{...card,padding:30,textAlign:"center",fontSize:12,color:C.t3}}>該当する掲載はまだありません</div>}
        {!loading && visible.map(l=>{
          const initials = (l.seller_name||"匿").trim().slice(0,2).toUpperCase();
          return (
          <div key={l.id} onClick={()=>setDetail(l)} style={{...card,padding:0,cursor:"pointer",borderRadius:8,overflow:"hidden",borderLeft:`3px solid ${C.t1}`}}>
            <div style={{padding:"14px 14px 12px",display:"flex",gap:12,alignItems:"flex-start"}}>
              {l.image_url ? (
                <img src={l.image_url} alt="" style={{width:54,height:54,borderRadius:4,objectFit:"cover",flexShrink:0,background:C.b2}}/>
              ):(
                <div style={{width:54,height:54,borderRadius:4,background:"linear-gradient(135deg,#1E3A6E,#2C5282)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",fontFamily:M,letterSpacing:.5}}>{initials}</div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,fontWeight:700,color:C.t2,background:C.b2,padding:"2px 7px",borderRadius:3,letterSpacing:.5,border:`1px solid ${C.bd}`}}>{l.category}</span>
                  {l.seller_id===currentUserId && <span style={{fontSize:9,fontWeight:700,color:C.gr,background:C.gD,padding:"2px 7px",borderRadius:3,letterSpacing:.5}}>自社</span>}
                </div>
                <div style={{fontSize:13.5,fontWeight:700,color:C.t1,marginBottom:3,lineHeight:1.35,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{l.title}</div>
                <div style={{fontSize:10.5,color:C.t3,fontWeight:500,letterSpacing:.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>事業者：{l.seller_name||"匿名"}</div>
              </div>
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${C.bd}`,background:C.b2,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:9.5,color:C.t3,fontWeight:600,letterSpacing:1.5,fontFamily:M}}>STARTING FROM</div>
              <div style={{fontSize:15,fontWeight:800,color:C.t1,fontFamily:M}}>{fmt(l.price)}<span style={{fontSize:10,color:C.t3,fontWeight:500,marginLeft:3}}>/ {l.unit}</span></div>
            </div>
          </div>
        );})}
      </div>


      {detail && (
        <div onClick={()=>setDetail(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:480,borderRadius:"16px 16px 0 0",padding:20,maxHeight:"85vh",overflowY:"auto"}}>
            {detail.image_url && <img src={detail.image_url} alt="" style={{width:"100%",height:200,objectFit:"cover",borderRadius:10,marginBottom:12,background:C.b2}}/>}
            <div style={{fontSize:9.5,fontWeight:700,color:C.t2,background:C.b2,padding:"3px 8px",borderRadius:3,display:"inline-block",marginBottom:8,letterSpacing:1,border:`1px solid ${C.bd}`}}>{detail.category}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.t1,marginBottom:6,lineHeight:1.35}}>{detail.title}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.bd}`}}>
              <div style={{fontSize:9,color:C.t3,fontWeight:600,letterSpacing:1.5,fontFamily:M}}>FROM</div>
              <div style={{fontSize:22,fontWeight:800,color:C.t1,fontFamily:M}}>{fmt(detail.price)}<span style={{fontSize:12,color:C.t3,fontWeight:500,marginLeft:3}}>/ {detail.unit}</span></div>
            </div>
            <div style={{fontSize:10,color:C.t3,marginBottom:4,fontWeight:700,letterSpacing:1.5,fontFamily:M}}>PROVIDER</div>
            <div style={{fontSize:13,color:C.t1,marginBottom:14,fontWeight:600}}>{detail.seller_name||"匿名"}</div>
            {detail.description && <><div style={{fontSize:10,color:C.t3,marginBottom:4,fontWeight:700,letterSpacing:1.5,fontFamily:M}}>OVERVIEW</div><div style={{fontSize:13,color:C.t1,whiteSpace:"pre-wrap",marginBottom:14,lineHeight:1.7}}>{detail.description}</div></>}
            {detail.contact && <><div style={{fontSize:10,color:C.t3,marginBottom:4,fontWeight:700,letterSpacing:1.5,fontFamily:M}}>CONTACT</div><div style={{fontSize:13,color:C.ac,marginBottom:16,wordBreak:"break-all",fontWeight:600}}>{detail.contact}</div></>}
            {detail.seller_id===currentUserId ? (
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{const d=detail;setDetail(null);openEdit(d);}} style={{flex:1,padding:"12px",borderRadius:6,border:`1px solid ${C.bd}`,background:"#fff",color:C.t1,fontSize:12.5,fontWeight:600,cursor:"pointer",letterSpacing:.5}}>内容を編集</button>
                <button onClick={()=>remove(detail.id)} style={{flex:1,padding:"12px",borderRadius:6,border:`1px solid ${C.re}30`,background:C.rD,color:C.re,fontSize:12.5,fontWeight:600,cursor:"pointer",letterSpacing:.5}}>掲載を取り下げ</button>
              </div>
            ):(
              <div>
                <div style={{padding:"10px 12px",borderRadius:8,background:C.b2,border:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:10.5,color:C.t3,fontWeight:700,letterSpacing:1.5,fontFamily:M}}>YOUR BALANCE</span>
                  <span style={{fontSize:14,fontWeight:800,color:C.t1,fontFamily:M}}>{fmt(balance)} <span style={{fontSize:10,color:C.t3,fontWeight:600}}>YEN</span></span>
                </div>
                {buyMsg && <div style={{fontSize:12,padding:"8px 10px",borderRadius:8,marginBottom:10,background:buyMsg.ok?C.gD:C.rD,color:buyMsg.ok?C.gr:C.re,fontWeight:600}}>{buyMsg.text}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setDetail(null);setBuyMsg(null);}} style={{flex:1,padding:"12px",borderRadius:6,border:`1px solid ${C.bd}`,background:"#fff",color:C.t2,fontSize:12.5,fontWeight:600,cursor:"pointer",letterSpacing:.5}}>閉じる</button>
                  <button disabled={buying||balance<(detail.price||0)} onClick={handlePurchase} style={{flex:2,padding:"12px",borderRadius:6,border:"none",background:balance<(detail.price||0)?C.bd:C.t1,color:"#fff",fontSize:12.5,fontWeight:700,cursor:(buying||balance<(detail.price||0))?"default":"pointer",letterSpacing:1,opacity:buying?.6:1}}>{buying?"処理中...":`${fmt(detail.price)} YEN で購入`}</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {modal && (
        <div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"100%",maxWidth:480,borderRadius:"16px 16px 0 0",padding:20,maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:2,marginBottom:4,fontFamily:M}}>{modal==="new"?"NEW LISTING":"EDIT LISTING"}</div>
            <div style={{fontSize:17,fontWeight:800,color:C.t1,marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${C.bd}`}}>{modal==="new"?"サービスを掲載":"掲載内容を編集"}</div>
            <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>サービス名 *</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="例：BtoB向け業務改善コンサルティング" style={{...iSt,marginBottom:12}}/>
            <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>業種カテゴリ</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={{...iSt,marginBottom:12}}>
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:2}}>
                <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>提供料金 (円)</label>
                <input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="100000" style={iSt}/>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>単位</label>
                <input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="月 / 案件" style={iSt}/>
              </div>
            </div>
            <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>事業概要 / 提供価値</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="ターゲット顧客、解決する課題、納期や成果物など" rows={4} style={{...iSt,resize:"vertical",fontFamily:F,marginBottom:12}}/>
            <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>ロゴ / 事例画像URL (任意)</label>
            <input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." style={{...iSt,marginBottom:12}}/>
            <label style={{fontSize:10.5,fontWeight:700,color:C.t2,marginBottom:5,display:"block",letterSpacing:.5}}>問合せ窓口 (メール / 法人サイト等)</label>
            <input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="contact@company.co.jp" style={{...iSt,marginBottom:18}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"12px",borderRadius:6,border:`1px solid ${C.bd}`,background:"#fff",color:C.t2,fontSize:12.5,fontWeight:600,cursor:"pointer",letterSpacing:.5}}>キャンセル</button>
              <button disabled={saving||!form.title.trim()} onClick={save} style={{flex:2,padding:"12px",borderRadius:6,border:"none",background:C.t1,color:"#fff",fontSize:12.5,fontWeight:700,cursor:saving?"default":"pointer",opacity:(saving||!form.title.trim())?.5:1,letterSpacing:1}}>{saving?"保存中...":(modal==="new"?"掲載する":"更新する")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────
export default function App() {
  const [splash,    setSplash]    = useState(true);
  const [loggedIn,  setLoggedIn]  = useState(true); // ログイン画面を一時的にスキップ（中身完成後に戻す）
  const [authReady, setAuthReady] = useState(false);
  const [tab,       setTab]       = useState("home");

  // ── Auth (email/password) ──
  const [authMode, setAuthMode] = useState("login"); // login | signup | forgot
  const [authEmail, setAuthEmail] = useState("");
  const [authPw, setAuthPw] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [resetPw, setResetPw] = useState("");
  const [resetPwConf, setResetPwConf] = useState("");

  const getAuthRedirectUrl = () => {
    const publishedUrl = "https://merge-magic-link.lovable.app";
    if (typeof window === "undefined") return publishedUrl;
    const origin = window.location.origin;
    return origin.includes("localhost") || origin.includes("127.0.0.1") ? publishedUrl : origin;
  };

  const applySession = (session) => {
    if (session?.user) {
      USER_ID = session.user.id;
      SBTOKEN = session.access_token;
      setLoggedIn(true);
    } else {
      USER_ID = "default_user";
      SBTOKEN = SKEY;
      // ログイン画面を一時的に無効化中：setLoggedIn(false) は呼ばない
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (params.has("code") || params.get("reset-password") === "1" || hashParams.get("type") === "recovery") {
        setPasswordRecovery(true);
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      applySession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    setAuthErr(""); setAuthInfo("");
    if (resetPw.length < 6) { setAuthErr("パスワードは6文字以上で入力してください"); return; }
    if (resetPw !== resetPwConf) { setAuthErr("パスワードが一致しません"); return; }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: resetPw });
      if (error) throw error;
      setAuthInfo("パスワードを変更しました");
      setPasswordRecovery(false);
      setAuthMode("login");
      setResetPw(""); setResetPwConf("");
      if (typeof window !== "undefined") window.history.replaceState({}, "", "/");
    } catch (e) {
      setAuthErr(e?.message || "パスワード変更に失敗しました");
    }
    setAuthLoading(false);
  };

  const handleAuth = async () => {
    setAuthErr(""); setAuthInfo("");
    if (!authEmail) { setAuthErr("メールアドレスを入力してください"); return; }
    if (authMode !== "forgot" && !authPw) { setAuthErr("パスワードを入力してください"); return; }
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await withAuthTimeout(
          supabase.auth.signUp({
            email: authEmail, password: authPw,
            options: { emailRedirectTo: getAuthRedirectUrl() },
          }),
        );
        if (error) throw error;
        if (data.session) applySession(data.session);
        if (!data.session) setAuthInfo("確認メールを送信しました。メールのリンクから認証してください。");
      } else if (authMode === "forgot") {
        const { error } = await withAuthTimeout(
          supabase.auth.resetPasswordForEmail(authEmail, {
            redirectTo: `${getAuthRedirectUrl()}?reset-password=1`,
          }),
        );
        if (error) throw error;
        setAuthInfo("パスワードリセット用のメールを送信しました。メールをご確認ください。");
      } else {
        const { data, error } = await withAuthTimeout(
          supabase.auth.signInWithPassword({ email: authEmail, password: authPw }),
          "認証サーバーから応答がありません。プレビューで止まる場合は公開URLでログインしてください。",
        );
        if (error) throw error;
        if (data.session) applySession(data.session);
      }
    } catch (e) {
      setAuthErr(e?.message || "認証に失敗しました");
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };


  // user profile
  const [uname,       setUname]       = useLS("yen_uname","");
  const [companyName, setCompanyName] = useLS("yen_company","");
  const [founded,     setFounded]     = useLS("yen_founded","");
  const [bizDesc,     setBizDesc]     = useLS("yen_bizdesc","");
  const [instagram,   setInstagram]   = useLS("yen_ig","");
  const [twitter,     setTwitter]     = useLS("yen_tw","");
  const [youtube,     setYoutube]     = useLS("yen_yt","");
  const [monthlyGoal, setMonthlyGoal] = useLS("yen_mgoal",0);
  const [genre,       setGenre]       = useLS("yen_genre","");

  // business data
  const [tasks,       setTasks]       = useLS("yen_tasks",[]);
  const [projects,    setProjects]    = useLS("yen_projects",[]);
  const [deals,       setDeals]       = useLS("yen_deals",[]);
  const [finances,    setFinances]    = useLS("yen_finances",[]);
  const [cashflow,    setCashflow]    = useLS("yen_cashflow",[]);
  const [invoices,    setInvoices]    = useLS("yen_invoices",[]);
  const [schedule,    setSchedule]    = useLS("yen_schedule",[]);
  const [memos,       setMemos]       = useLS("yen_memos",[]);
  const [competitors, setCompetitors] = useLS("yen_competitors",[]);
  const [bmc,         setBmc]         = useLS("yen_bmc",{keyPartners:"",keyActivities:"",keyResources:"",valueProps:"",customerRelations:"",channels:"",customerSegments:"",costStructure:"",revenueStreams:""});
  const [feed,        setFeed]        = useLS("yen_feed",[]);
  const [ventures,    setVentures]    = useLS("yen_ventures",[]);
  const [okrs,        setOkrs]        = useLS("yen_okrs",[]);
  const [gigs,        setGigs]        = useLS("yen_gigs",[]);
  const [gigOrders,   setGigOrders]   = useLS("yen_gigorders",[]);

  // YEN wallet
  const [balance, setBalance] = useState(0);
  const loadWallet = async () => {
    try {
      const { data, error } = await supabase.from("yen_wallets").select("balance").maybeSingle();
      if (!error && data) setBalance(Number(data.balance)||0);
    } catch(e){ console.error(e); }
  };

  // sync
  const [syncing,  setSyncing]  = useState(false);
  const [lastSync, setLastSync] = useLS("yen_lastsync","");


  const syncToCloud = async () => {
    setSyncing(true);
    try {
      await Promise.all([
        saveTable("tasks",tasks), saveTable("projects",projects), saveTable("deals",deals),
        saveTable("invoices",invoices), saveTable("cashflow",cashflow), saveTable("memos",memos),
        saveTable("schedule",schedule), saveUser({uname,genre,bmc}),
      ]);
      setLastSync(new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"}));
    } catch(e){console.error(e);}
    setSyncing(false);
  };

  const syncFromCloud = async () => {
    setSyncing(true);
    try {
      const [t,p,d,inv,cf,m,sc,u] = await Promise.all([
        loadTable("tasks"),loadTable("projects"),loadTable("deals"),
        loadTable("invoices"),loadTable("cashflow"),loadTable("memos"),
        loadTable("schedule"),loadUser(),
      ]);
      if(t?.length)setTasks(t); if(p?.length)setProjects(p); if(d?.length)setDeals(d);
      if(inv?.length)setInvoices(inv); if(cf?.length)setCashflow(cf); if(m?.length)setMemos(m);
      if(sc?.length)setSchedule(sc);
      if(u){if(u.uname)setUname(u.uname);if(u.genre)setGenre(u.genre);if(u.bmc)setBmc(u.bmc);}
      setLastSync(new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"}));
    } catch(e){console.error(e);}
    setSyncing(false);
  };

  useEffect(()=>{setTimeout(()=>setSplash(false),1600);},[]);
  useEffect(()=>{if(loggedIn){syncFromCloud();loadWallet();}},[loggedIn]);

  if(splash) return(
    <div style={{position:"fixed",inset:0,background:"#4F7FFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:F}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{fontSize:44,fontWeight:800,letterSpacing:10,color:"#fff",fontFamily:M,marginBottom:8}}>YEN.</div>
      <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",letterSpacing:4,textTransform:"uppercase"}}>Company OS</div>
    </div>
  );

  if(passwordRecovery) return(
    <div style={{minHeight:"100vh",background:"#F7F8FC",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",fontFamily:F,maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:42,fontWeight:800,letterSpacing:8,color:C.t1,fontFamily:M,marginBottom:8}}>YEN.</div>
        <div style={{fontSize:10,color:C.t3,letterSpacing:4,textTransform:"uppercase",marginBottom:12}}>Company OS</div>
        <div style={{fontSize:13,color:C.t2,lineHeight:1.7}}>新しいパスワードを設定</div>
      </div>
      <div style={{width:"100%"}}>
        <label style={lbSt}>新しいパスワード</label>
        <input type="password" autoComplete="new-password" value={resetPw} onChange={e=>setResetPw(e.target.value)} placeholder="6文字以上" style={{...iSt,marginBottom:12}}/>
        <label style={lbSt}>新しいパスワード（確認）</label>
        <input type="password" autoComplete="new-password" value={resetPwConf} onChange={e=>setResetPwConf(e.target.value)} placeholder="もう一度入力" style={{...iSt,marginBottom:12}} onKeyDown={e=>e.key==="Enter"&&handleResetPassword()}/>
        {authErr && <div style={{fontSize:12,color:C.re,background:C.rD,padding:"8px 10px",borderRadius:8,marginBottom:10}}>{authErr}</div>}
        {authInfo && <div style={{fontSize:12,color:C.gr,background:C.gD,padding:"8px 10px",borderRadius:8,marginBottom:10}}>{authInfo}</div>}
        <button disabled={authLoading} onClick={handleResetPassword} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:C.ac,color:"#fff",fontSize:14,fontWeight:600,cursor:authLoading?"default":"pointer",marginBottom:12,opacity:authLoading?.6:1}}>
          {authLoading?"変更中...":"パスワードを変更"}
        </button>
      </div>
    </div>
  );

  if(!loggedIn) return(
    <div style={{minHeight:"100vh",background:"#F7F8FC",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",fontFamily:F,maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:42,fontWeight:800,letterSpacing:8,color:C.t1,fontFamily:M,marginBottom:8}}>YEN.</div>
        <div style={{fontSize:10,color:C.t3,letterSpacing:4,textTransform:"uppercase",marginBottom:12}}>Company OS</div>
        <div style={{fontSize:13,color:C.t2,lineHeight:1.7}}>
          {authMode==="login"?"アカウントにログイン":authMode==="signup"?"新規アカウント作成":"パスワードをリセット"}
        </div>
      </div>
      <div style={{width:"100%"}}>
        <label style={lbSt}>メール</label>
        <input type="email" autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" style={{...iSt,marginBottom:12}}/>
        {authMode !== "forgot" && (
          <>
            <label style={lbSt}>パスワード</label>
            <div style={{position:"relative",marginBottom:12}}>
              <input type={showPw?"text":"password"} autoComplete={authMode==="login"?"current-password":"new-password"} value={authPw} onChange={e=>setAuthPw(e.target.value)} placeholder="••••••••" style={{...iSt,paddingRight:"40px"}} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
              <button onClick={()=>setShowPw(s=>!s)} type="button" style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {showPw?(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.t3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>
                ):(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.t3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </>
        )}
        {authErr && <div style={{fontSize:12,color:C.re,background:C.rD,padding:"8px 10px",borderRadius:8,marginBottom:10}}>{authErr}</div>}
        {authInfo && <div style={{fontSize:12,color:C.gr,background:C.gD,padding:"8px 10px",borderRadius:8,marginBottom:10}}>{authInfo}</div>}
        <button disabled={authLoading} onClick={handleAuth} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:C.ac,color:"#fff",fontSize:14,fontWeight:600,cursor:authLoading?"default":"pointer",marginBottom:12,opacity:authLoading?.6:1}}>
          {authLoading?"処理中...":(authMode==="login"?"ログイン":authMode==="signup"?"アカウント作成":"リセットメールを送信")}
        </button>
        {authMode !== "forgot" && (
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0",color:C.t3,fontSize:11}}>
              <div style={{flex:1,height:1,background:C.bd}}/>または<div style={{flex:1,height:1,background:C.bd}}/>
            </div>
            <button disabled={authLoading} onClick={async()=>{
              setAuthErr("");setAuthInfo("");setAuthLoading(true);
              try{
                const { lovable } = await import("@/integrations/lovable");
                const result = await withAuthTimeout(
                  lovable.auth.signInWithOAuth("google",{ redirect_uri: window.location.origin }),
                  "Googleログインの応答がありません。プレビューで止まる場合は公開URLでログインしてください。",
                );
                if(result.error){ setAuthErr(result.error.message||"Googleログインに失敗しました"); }
                if(!result.redirected){
                  const { data } = await supabase.auth.getSession();
                  applySession(data.session);
                }
              }catch(err:any){ setAuthErr(err?.message||"Googleログインに失敗しました"); }
              finally{ setAuthLoading(false); }
            }} style={{width:"100%",padding:"14px",borderRadius:10,border:`1px solid ${C.bd}`,background:"#fff",color:C.t1,fontSize:14,fontWeight:600,cursor:authLoading?"default":"pointer",marginBottom:12,opacity:authLoading?.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Googleで{authMode==="signup"?"新規登録":"ログイン"}
            </button>
          </>
        )}
        {authMode === "login" && (
          <button onClick={()=>{setAuthMode("forgot");setAuthErr("");setAuthInfo("");}} style={{width:"100%",padding:"10px",borderRadius:10,background:"transparent",border:"none",color:C.t3,fontSize:12,fontWeight:500,cursor:"pointer",marginBottom:8}}>
            パスワードを忘れた場合
          </button>
        )}
        <button onClick={()=>{
          if (authMode === "forgot") { setAuthMode("login"); }
          else { setAuthMode(authMode==="login"?"signup":"login"); }
          setAuthErr("");setAuthInfo("");
        }} style={{width:"100%",padding:"12px",borderRadius:10,background:"transparent",border:`1px solid ${C.bd}`,color:C.t2,fontSize:13,fontWeight:500,cursor:"pointer"}}>
          {authMode==="login"?"アカウントを作成":authMode==="signup"?"ログインへ戻る":"ログイン画面へ戻る"}
        </button>
      </div>
    </div>
  );

  const homeProps = {
    uname,companyName,genre,monthlyGoal,
    tasks,setTasks,projects,setProjects,
    deals,setDeals,finances,setFinances,
    cashflow,setCashflow,invoices,setInvoices,
    schedule,setSchedule,memos,setMemos,
    competitors,setCompetitors,bmc,setBmc,
  };

  const TABS = [
    {id:"home",   l:"ダッシュ", emoji:"🏠", icon:(a)=><svg width="20" height="20" viewBox="0 0 24 24" fill={a?"#3B82F6":"none"} stroke={a?"#3B82F6":C.t3} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
    {id:"startup", l:"ビジネス", emoji:"🚀", icon:(a)=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?"#8B5CF6":C.t3} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>},
    {id:"market",  l:"マーケット", emoji:"🛍", icon:(a)=><svg width="20" height="20" viewBox="0 0 24 24" fill={a?"#10B981":"none"} stroke={a?"#10B981":C.t3} strokeWidth="2"><path d="M3 9h18l-2 11H5z"/><path d="M8 9V5a4 4 0 0 1 8 0v4"/></svg>},
    {id:"profile", l:"マイページ", emoji:"👤", icon:(a)=><svg width="20" height="20" viewBox="0 0 24 24" fill={a?"#F59E0B":"none"} stroke={a?"#F59E0B":C.t3} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
  ];
  const tabColors = {home:"#3B82F6",startup:"#8B5CF6",market:"#10B981",profile:"#F59E0B"};

  return(
    <div style={{minHeight:"100vh",height:"100dvh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:F,maxWidth:480,margin:"0 auto",overflow:"hidden",position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>

      {/* Top bar */}
      <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,246,255,0.95))",borderBottom:`2px solid rgba(59,130,246,0.15)`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,backdropFilter:"blur(12px)",boxShadow:"0 4px 16px rgba(59,130,246,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 8px rgba(59,130,246,0.4)"}}>
            <span style={{fontSize:16,fontWeight:900,color:"#fff",fontFamily:M}}>Y</span>
          </div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:3,background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:F}}>YEN.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {balance!==null&&(
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:"linear-gradient(135deg,#FFD93D22,#FF6B6B22)",border:"1.5px solid #FFD93D44"}}>
              <span style={{fontSize:13}}>💰</span>
              <span style={{fontSize:12,fontWeight:800,color:"#B45309",fontFamily:M}}>{Number(balance).toLocaleString()} YEN</span>
            </div>
          )}
          <button onClick={syncing?null:syncToCloud} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,border:`1.5px solid ${C.bd}`,background:"rgba(255,255,255,0.8)",cursor:syncing?"default":"pointer",boxShadow:"0 2px 4px rgba(59,130,246,0.1)"}}>
            {syncing?<Spin size={13}/>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ac} strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
          </button>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
        {tab==="home"      && <HomeTab {...homeProps}/>}
        {tab==="startup"    && <StartupTab ventures={ventures} setVentures={setVentures} tasks={tasks} setTasks={setTasks} finances={finances} setFinances={setFinances} deals={deals} setDeals={setDeals} okrs={okrs} setOkrs={setOkrs} gigs={gigs} setGigs={setGigs} gigOrders={gigOrders} setGigOrders={setGigOrders}/>}
        {tab==="market"    && <MarketTab uname={uname} currentUserId={USER_ID} balance={balance} reloadWallet={loadWallet}/>}
        {tab==="profile"   && <ProfileTab uname={uname} setUname={setUname} companyName={companyName} setCompanyName={setCompanyName} genre={genre} setGenre={setGenre} bizDesc={bizDesc} setBizDesc={setBizDesc} founded={founded} setFounded={setFounded} instagram={instagram} setInstagram={setInstagram} twitter={twitter} setTwitter={setTwitter} youtube={youtube} setYoutube={setYoutube} monthlyGoal={monthlyGoal} setMonthlyGoal={setMonthlyGoal} setLoggedIn={handleLogout} balance={balance}/>}
      </div>

      {/* Bottom nav */}
      <div style={{display:"flex",gap:6,background:"linear-gradient(180deg,rgba(255,255,255,0.95),#F8FBFF)",flexShrink:0,padding:"10px 10px",paddingBottom:"calc(10px + env(safe-area-inset-bottom,0px))",boxShadow:"0 -6px 24px rgba(59,130,246,0.12)",borderTop:"2px solid rgba(59,130,246,0.12)"}}>
        {TABS.map(t=>{
          const active = tab===t.id;
          const col = tabColors[t.id];
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 4px 6px",border:"none",background:active?`${col}18`:"transparent",borderRadius:20,cursor:"pointer",position:"relative",transition:"all .2s cubic-bezier(.34,1.56,.64,1)",transform:active?"translateY(-4px)":"none",boxShadow:active?`0 6px 16px ${col}30`:"none"}}>
              {active&&<div style={{position:"absolute",top:-2,left:"50%",transform:"translateX(-50%)",width:24,height:3,background:`linear-gradient(90deg,${col},${col}88)`,borderRadius:"0 0 6px 6px"}}/>}
              <div style={{fontSize:active?24:20,transition:"all .2s cubic-bezier(.34,1.56,.64,1)",filter:active?"drop-shadow(0 2px 4px "+col+"66)":"none",marginBottom:2}}>{t.emoji}</div>
              <span style={{fontSize:10,fontWeight:active?900:600,color:active?col:C.t3,letterSpacing:0.2}}>{t.l}</span>
            </button>
          );
        })}
      </div>


      <style>{`
        *{-webkit-tap-highlight-color:transparent;font-family:${F}}
        ::-webkit-scrollbar{width:0}
        input::placeholder{color:${C.t3}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        html,body{font-family:${F}}
        body{
          background:
            radial-gradient(ellipse at 5% 5%, #FFD6E7 0%, transparent 38%),
            radial-gradient(ellipse at 95% 8%, #C7DFFF 0%, transparent 40%),
            radial-gradient(ellipse at 80% 90%, #DDD6FE 0%, transparent 40%),
            radial-gradient(ellipse at 15% 85%, #BBF7D0 0%, transparent 38%),
            radial-gradient(ellipse at 50% 50%, #EEF2FF 0%, transparent 70%),
            linear-gradient(150deg, #EEF4FF 0%, #F3EEFF 50%, #FFF0F8 100%);
          background-attachment:fixed;
          min-height:100vh;
        }
        body::before{
          content:"⭐ 🌟 ✨ 💫 ⭐ 🌟 ✨ 💫 ⭐ 🌟 ✨ 💫 ⭐ 🌟 ✨ 💫";
          position:fixed;inset:0;pointer-events:none;z-index:0;
          font-size:18px;line-height:3.5;letter-spacing:3.5em;
          opacity:0.06;word-break:break-all;overflow:hidden;
          animation:drift 30s linear infinite;
        }
        button{font-family:${F} !important}
        .yen-btn3d{transition:transform .12s cubic-bezier(.34,1.56,.64,1), filter .15s ease, box-shadow .12s ease}
        .yen-btn3d:active{transform:translateY(4px) scale(0.97) !important; filter:brightness(.92); box-shadow:none !important}
        input,textarea,select{font-family:${F} !important;transition:border-color .15s ease, box-shadow .15s ease}
        input:focus,textarea:focus,select:focus{border-color:${C.ac} !important;box-shadow:0 0 0 4px ${C.aD}, inset 0 2px 4px rgba(59,130,246,0.08) !important}
        @keyframes pop-in{0%{transform:scale(.75) translateY(12px);opacity:0}60%{transform:scale(1.04) translateY(-3px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}
        @keyframes bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes wiggle{0%,100%{transform:rotate(0)}20%{transform:rotate(-6deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(4deg)}}
        @keyframes float-up{0%{opacity:0;transform:translateY(16px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes glow-pulse{0%,100%{box-shadow:0 0 0 0 #3B82F644,0 6px 0 rgba(59,130,246,0.12)}50%{box-shadow:0 0 0 8px #3B82F600,0 6px 0 rgba(59,130,246,0.12)}}
        @keyframes drift{0%{transform:translateY(0)}100%{transform:translateY(-60px)}}
        @keyframes sparkle{0%,100%{opacity:.2;transform:scale(.7) rotate(0deg)}50%{opacity:1;transform:scale(1.3) rotate(20deg)}}
        @keyframes bounce-in{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.1)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes slide-up{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}
        .yen-card{animation:pop-in .45s cubic-bezier(.34,1.56,.64,1) both;position:relative;overflow:hidden}
        .yen-card::after{content:"";position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(255,255,255,0.8),transparent);pointer-events:none;border-radius:26px 26px 0 0}
        .yen-bob{animation:bob 2.8s ease-in-out infinite}
        .yen-wiggle{animation:wiggle .6s ease-in-out}
        .yen-pop{transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s ease}
        .yen-pop:active{transform:scale(0.96) !important}
        .yen-float{animation:float-up .5s cubic-bezier(.34,1.56,.64,1) both}
        .yen-glow{animation:glow-pulse 2.5s ease-in-out infinite}
        .yen-shimmer{background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,0.7) 50%,transparent 75%);background-size:200% 100%;animation:shimmer 2s linear infinite}
        .yen-bounce{animation:bounce-in .5s cubic-bezier(.34,1.56,.64,1) both}
        .yen-slide{animation:slide-up .4s cubic-bezier(.34,1.56,.64,1) both}
        @keyframes yen_spin{to{transform:rotate(360deg)}}
        @keyframes yen_pulse{0%,100%{opacity:.3}50%{opacity:1}}
      `}</style>


    </div>
  );
}
