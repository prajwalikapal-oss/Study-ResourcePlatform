import { useEffect, useState, useRef } from "react";
import "./App.css";

const API = "https://study-resourceplatform.onrender.com";

// ─── Helpers ───────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("sn_token");
const getUser  = () => JSON.parse(localStorage.getItem("sn_user") || "null");

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className="sn-toast">{msg}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH PAGE
// ═══════════════════════════════════════════════════════════════════════════
function AuthPage({ onLogin }) {
  const [mode, setMode]       = useState("login"); // login | register
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const body = mode === "login"
        ? { email, password }
        : { name, email, password };
      const res  = await fetch(`${API}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong"); return; }
      if (mode === "login") {
        localStorage.setItem("sn_token", data.token);
        localStorage.setItem("sn_user", JSON.stringify({ 
        email, 
        name: data.name || email.split("@")[0] 
        }));
        onLogin();
      } else {
        setMode("login");
        setErr("✅ Registered! Please log in.");
      }
    } catch(err) { setErr("Error: " + err.message); }
    finally { setLoading(false); }
  };

  

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">Edu<span>Flow</span></div>
        <p className="auth-sub">Your all-in-one study companion</p>

        <div className="auth-tabs">
          <button className={mode==="login"?"active":""} onClick={()=>{ setMode("login"); setErr(""); }}>Login</button>
          <button className={mode==="register"?"active":""} onClick={()=>{ setMode("register"); setErr(""); }}>Register</button>
        </div>

        {mode==="register" && (
          <div className="form-group">
            <label>Full Name</label>
            <input placeholder="Prajwalika Pal" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
        )}
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </div>

        {err && <p className="auth-err">{err}</p>}

        <button className="btn btn-primary auth-submit" onClick={submit} disabled={loading}>
          {loading ? "Please wait…" : mode==="login" ? "Login →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({ resources, tasks }) {
  const done  = tasks.filter(t=>t.completed).length;
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const vals  = [75,90,45,80,60,30,50];
  const upcoming = tasks.filter(t=>!t.completed).slice(0,3);
  const user = getUser();

  return (
    <div>
      <div className="topbar">
        <div>
          <h2 className="page-title">Good day, {user?.name || "Student"} 👋</h2>
          <p className="page-sub">Let's keep studying! 📚</p>
        </div>
      </div>

      <div className="grid-4 mb24">
        {[
          { label:"Resources Uploaded", val: resources.length, sub:"in your library", cls:"stat-purple" },
          { label:"Tasks Completed",    val: done,             sub:`of ${tasks.length} total`, cls:"stat-green" },
          { label:"Pending Tasks",      val: tasks.length-done, sub:"to complete",    cls:"stat-pink" },
          { label:"Study Streak",       val: "🔥 5",           sub:"days in a row",  cls:"stat-yellow" },
        ].map((s,i)=>(
          <div key={i} className={`card ${s.cls}`}>
            <div className="card-accent"></div>
            <div className="card-title">{s.label}</div>
            <div className="card-value">{s.val}</div>
            <div className="card-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">📈 Weekly Study Progress</h3>
          {days.map((d,i)=>(
            <div key={d} className="prog-row">
              <span className="prog-label">{d}</span>
              <div className="progress-bar"><div className="progress-fill" style={{width:vals[i]+"%"}}></div></div>
              <span className="prog-val">{vals[i]}%</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="section-title">📌 Pending Tasks</h3>
          {upcoming.length ? upcoming.map(t=>(
            <div key={t._id} className="dash-task">
              <div className="dash-dot"></div>
              <span className="dash-task-text">{t.text}</span>
            </div>
          )) : <p className="muted">All tasks done! 🎉</p>}

          <div className="card">
            <h3 className="section-title" style={{marginBottom:"12px"}}>📊 Task Overview</h3>
            <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"6px"}}>
                  <span className="muted">Completion</span>
                  <span style={{color:"var(--accent3)",fontWeight:600}}>{tasks.length ? Math.round((done/tasks.length)*100) : 0}%</span>
                </div>
                <div className="progress-bar" style={{height:"10px"}}>
                  <div className="progress-fill" style={{width:(tasks.length?Math.round((done/tasks.length)*100):0)+"%",background:"var(--accent3)"}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  RESOURCES PAGE
// ═══════════════════════════════════════════════════════════════════════════
function ResourcesPage({ resources, onRefresh, toast }) {
  const [title, setTitle]         = useState("");
  const [desc,  setDesc]          = useState("");
  const [file,  setFile]          = useState(null);
  const [search,setSearch]        = useState("");
  const [loading,setLoading]      = useState(false);
  const [drag,  setDrag]          = useState(false);
  const [subject, setSubject]     = useState("General");
  const [resourceType, setResourceType] = useState("Notes");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const fileRef = useRef();

  const upload = async () => {
    if (!title.trim() || !desc.trim()) { toast("⚠️ Title and description required"); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", desc);
    fd.append("subject", subject);
    fd.append("resourceType", resourceType);
    if (file) fd.append("file", file);
    try {
      const res = await fetch(`${API}/resources`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` },
        body: fd,
      });
      if (res.status === 401) { toast("⚠️ Please log in again"); return; }
      const data = await res.json();
      if (!res.ok) { toast("❌ " + (data.error || "Upload failed")); return; }
      setTitle(""); setDesc(""); setFile(null);
      setShowModal(false);
      toast("✅ Resource uploaded!");
      onRefresh();
    } catch { toast("❌ Network error"); }
    finally { setLoading(false); }
  };

  const trackDownload = async (id) => {
    try {
      await fetch(`${API}/resources/${id}/download`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      onRefresh();
    } catch {}
  };
  
  const rateResource = async (id, stars) => {
    try {
      const res = await fetch(`${API}/resources/${id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ stars }),
      });
      const data = await res.json();
      if (!res.ok) { toast("❌ " + (data.error || "Rating failed")); return; }
      toast(`⭐ Rated ${stars} star${stars > 1 ? "s" : ""}!`);
      onRefresh();
    } catch { toast("❌ Network error"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await fetch(`${API}/resources/${id}`, { method:"DELETE", headers: authHeaders() });
      toast("🗑 Resource deleted"); onRefresh();
    } catch { toast("❌ Delete failed"); }
  };

  const filtered = resources.filter(r =>
    ((r.title||"").toLowerCase().includes(search.toLowerCase()) ||
    (r.description||"").toLowerCase().includes(search.toLowerCase())) &&
    (!filterSubject || r.subject === filterSubject) &&
    (!filterType    || r.resourceType === filterType)
  );

  const renderStars = (resource) => {
    const avg = resource.avgRating || 0;
    const total = resource.ratings?.length || 0;
    return (
      <div style={{margin:"8px 0"}}>
        <div style={{display:"flex",gap:"2px",marginBottom:"3px"}}>
          {[1,2,3,4,5].map(star=>(
            <span key={star} onClick={()=>rateResource(resource._id, star)}
              style={{fontSize:"16px",cursor:"pointer",color:star<=Math.round(avg)?"var(--yellow)":"var(--border)",transition:"color .15s"}}
              title={`Rate ${star} star${star>1?"s":""}`}>★</span>
          ))}
        </div>
        <div style={{fontSize:"11px",color:"var(--muted)"}}>
          {avg > 0 ? `${avg} ⭐ avg · ${total} rating${total!==1?"s":""}` : "No ratings yet"}
        </div>
      </div>
    );
  };

  const typeIcon = (url) => {
    if (!url) return "📄";
    const ext = url.split(".").pop().toLowerCase();
    if (ext==="pdf") return "📕";
    if (["doc","docx"].includes(ext)) return "📘";
    if (["ppt","pptx"].includes(ext)) return "📙";
    if (["zip","rar"].includes(ext)) return "📦";
    return "📄";
  };

  const SUBJECTS = ["General","Python","C/C++","HTML/CSS","JavaScript","React","DBMS","Math","Other"];
  const TYPES    = ["Notes","PDF","Paper","PPT","Other"];

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
        <div>
          <h2 className="page-title">📂 Resource Hub</h2>
          <p className="page-sub">Upload, search and download study materials</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
          ⬆ Upload
        </button>
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{display:"flex",gap:"12px",marginBottom:"24px",flexWrap:"wrap"}}>
        <input
          style={{flex:1,minWidth:"200px",background:"var(--card)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:"10px",padding:"10px 14px",fontFamily:"inherit",fontSize:"14px",outline:"none"}}
          placeholder="🔍  Search resources by name or subject…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <select
          style={{width:"160px",background:"var(--card2)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:"10px",padding:"10px 14px",fontFamily:"inherit",fontSize:"14px",outline:"none"}}
          value={filterSubject} onChange={e=>setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select
          style={{width:"130px",background:"var(--card2)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:"10px",padding:"10px 14px",fontFamily:"inherit",fontSize:"14px",outline:"none"}}
          value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* RESOURCE GRID */}
      {filtered.length === 0
        ? <div className="empty-state">No resources found. Upload your first one!</div>
        : <div className="grid-3">
            {filtered.map(r=>(
              <div key={r._id} className="resource-card">
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
                  <div style={{fontSize:"36px"}}>{typeIcon(r.fileUrl)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="resource-title" style={{fontSize:"16px",marginBottom:"4px"}}>{r.title}</div>
                    <div style={{fontSize:"12px",color:"var(--muted)"}}>
                      {r.subject} · {r.resourceType} · ⬇ {r.downloadCount||0} downloads
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:"6px",marginBottom:"8px",flexWrap:"wrap"}}>
                  {r.subject && <span className="tag tag-purple">{r.subject}</span>}
                  {r.resourceType && <span className="tag tag-yellow">{r.resourceType}</span>}
                </div>
                <p className="resource-desc" style={{marginBottom:"10px"}}>{r.description}</p>
                {renderStars(r)}
                <div className="resource-actions" style={{marginTop:"12px"}}>
                  {r.fileUrl
                    ? <a className="btn btn-primary btn-sm"
                        href={`${API}/uploads/${r.fileUrl}`}
                        target="_blank" rel="noreferrer"
                        download
                        onClick={()=>trackDownload(r._id)}>⬇ Download</a>
                    : <span className="tag tag-muted">No file</span>
                  }
                  <button className="btn btn-danger btn-sm" onClick={()=>del(r._id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
      }

      {/* UPLOAD MODAL */}
      {showModal && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false); }}>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto",animation:"fadeUp .3s ease"}}>

            {/* Modal Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
              <h3 style={{fontSize:"20px",fontWeight:800}}>📤 Upload Resource</h3>
              <button onClick={()=>setShowModal(false)}
                style={{background:"none",border:"none",color:"var(--muted)",fontSize:"22px",cursor:"pointer",lineHeight:1}}>✕</button>
            </div>

            {/* Title */}
            <div className="form-group">
              <label>Title</label>
              <input placeholder="e.g. Python OOP Notes" value={title} onChange={e=>setTitle(e.target.value)}/>
            </div>

            {/* Subject + Type */}
            <div className="grid-2">
              <div className="form-group">
                <label>Subject</label>
                <select value={subject} onChange={e=>setSubject(e.target.value)}>
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={resourceType} onChange={e=>setResourceType(e.target.value)}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} placeholder="Brief description of the resource…"
                value={desc} onChange={e=>setDesc(e.target.value)}
                style={{background:"var(--card2)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:"10px",padding:"10px 14px",fontFamily:"inherit",fontSize:"14px",width:"100%",outline:"none",resize:"vertical"}}/>
            </div>

            {/* File Drop */}
            <div className="form-group">
              <label>File (optional)</label>
              <div className={`dropzone${drag?" drag":""}`}
                onClick={()=>fileRef.current.click()}
                onDragOver={e=>{e.preventDefault();setDrag(true)}}
                onDragLeave={()=>setDrag(false)}
                onDrop={e=>{e.preventDefault();setDrag(false);setFile(e.dataTransfer.files[0])}}>
                <div className="dz-icon">📁</div>
                <p><strong>Click to browse</strong> or drag & drop file here</p>
                <p style={{fontSize:"12px",color:"var(--muted)"}}>PDF, PPT, DOC, ZIP — up to 25MB</p>
                {file && <p style={{color:"var(--accent3)",marginTop:"8px",fontSize:"13px"}}>✅ {file.name}</p>}
                <input type="file" ref={fileRef} style={{display:"none"}} onChange={e=>setFile(e.target.files[0])}/>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",marginTop:"8px"}}>
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={upload} disabled={loading}>
                {loading ? "Uploading…" : "Upload Resource"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  TASKS / TO-DO PAGE
// ═══════════════════════════════════════════════════════════════════════════
function TasksPage({ tasks, onRefresh, toast }) {
  const [text,     setText]    = useState("");
  const [subject,  setSubject] = useState("General");
  const [priority, setPriority]= useState("medium");
  const [dueDate,  setDueDate] = useState("");
  const [filter,   setFilter]  = useState("all");

  const SUBJECTS  = ["General","Python","C/C++","HTML/CSS","JavaScript","React","DBMS","Math","Other"];
  const PRIORITIES = [
    { val:"high",   label:"🔴 High",   color:"var(--red)"     },
    { val:"medium", label:"🟡 Medium", color:"var(--yellow)"  },
    { val:"low",    label:"🟢 Low",    color:"var(--accent3)" },
  ];

  const add = async () => {
    if (!text.trim()) { toast("⚠️ Enter a task"); return; }
    try {
      await fetch(`${API}/tasks`, {
        method:"POST",
        headers:{"Content-Type":"application/json", ...authHeaders()},
        body: JSON.stringify({ text, subject, priority, dueDate: dueDate||null }),
      });
      setText(""); setSubject("General"); setPriority("medium"); setDueDate("");
      onRefresh();
      toast("✅ Task added!");
    } catch { toast("❌ Network error"); }
  };

  const toggle = async (id, completed) => {
    try {
      await fetch(`${API}/tasks/${id}`, {
        method:"PUT",
        headers:{"Content-Type":"application/json", ...authHeaders()},
        body: JSON.stringify({ completed: !completed }),
      });
      onRefresh();
    } catch { toast("❌ Update failed"); }
  };

  const del = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method:"DELETE", headers: authHeaders() });
      onRefresh(); toast("🗑 Task deleted");
    } catch { toast("❌ Delete failed"); }
  };

  const shown = tasks.filter(t =>
    filter==="all" ? true : filter==="done" ? t.completed : !t.completed
  );

  const priorityColor = { high:"var(--red)", medium:"var(--yellow)", low:"var(--accent3)" };
  const priorityBg    = { high:"rgba(239,71,111,.15)", medium:"rgba(255,209,102,.15)", low:"rgba(67,233,123,.15)" };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">✅ To-Do List</h2>
        <p className="page-sub">Manage your tasks — synced with MongoDB</p>
      </div>

      <div className="grid-2">
        {/* ADD TASK CARD */}
        <div className="card">
          <h3 className="section-title">Add New Task</h3>
          <div className="form-group">
            <label>Task Description</label>
            <input placeholder="e.g. Complete React project…"
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&add()}/>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Subject</label>
              <select value={subject} onChange={e=>setSubject(e.target.value)}>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={e=>setPriority(e.target.value)}>
                {PRIORITIES.map(p=><option key={p.val} value={p.val}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
          </div>
          <button className="btn btn-primary" style={{width:"100%"}} onClick={add}>+ Add Task</button>
        </div>

        {/* TASK LIST CARD */}
        <div className="card">
          <div className="tasks-header">
            <h3 className="section-title">My Tasks ({shown.length})</h3>
            <div className="filter-btns">
              {["all","pending","done"].map(f=>(
                <button key={f} className={`btn btn-sm ${filter===f?"btn-primary":"btn-ghost"}`}
                  onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
              ))}
            </div>
          </div>

          <div className="task-list">
            {shown.length===0
              ? <p className="muted" style={{textAlign:"center",padding:"20px"}}>No tasks here.</p>
              : shown.map(t=>(
                <div key={t._id} className={`todo-item${t.completed?" done":""}`}
                  style={{alignItems:"flex-start",gap:"10px"}}>
                  <input type="checkbox" className="todo-checkbox"
                    style={{marginTop:"3px",flexShrink:0}}
                    checked={t.completed} onChange={()=>toggle(t._id, t.completed)}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="todo-text" style={{marginBottom:"4px"}}>{t.text}</div>
                    <div style={{fontSize:"11px",color:"var(--muted)"}}>
                      {t.subject && <span>{t.subject}</span>}
                      {t.dueDate && <span> · Due: {t.dueDate}</span>}
                    </div>
                  </div>
                  {t.priority && (
                    <span style={{
                      fontSize:"10px", fontWeight:700, padding:"3px 8px",
                      borderRadius:"6px", flexShrink:0,
                      background: priorityBg[t.priority]||priorityBg.medium,
                      color: priorityColor[t.priority]||priorityColor.medium,
                      textTransform:"uppercase", letterSpacing:".3px"
                    }}>{t.priority}</span>
                  )}
                  <button className="icon-btn" style={{flexShrink:0}} onClick={()=>del(t._id)}>🗑</button>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  STUDY PLANNER PAGE
// ═══════════════════════════════════════════════════════════════════════════
function PlannerPage() {
  const [sessions, setSessions] = useState([
    { subject:"React Hooks Study", day:"Monday",    start:"09:00", end:"10:30", type:"" },
    { subject:"Short Break",       day:"Monday",    start:"10:30", end:"10:45", type:"break" },
    { subject:"C/C++ Practice",    day:"Tuesday",   start:"08:00", end:"09:30", type:"" },
    { subject:"JavaScript ES6",    day:"Wednesday", start:"10:00", end:"11:30", type:"" },
    { subject:"Exam Revision",     day:"Friday",    start:"14:00", end:"16:00", type:"exam" },
  ]);
  const [subject, setSubject] = useState("");
  const [day,     setDay]     = useState("Monday");
  const [start,   setStart]   = useState("09:00");
  const [end,     setEnd]     = useState("10:30");
  const [type,    setType]    = useState("");

  const add = () => {
    if (!subject.trim()) return;
    setSessions([...sessions, { subject, day, start, end, type }]);
    setSubject("");
  };

  const del = (idx) => setSessions(sessions.filter((_,i)=>i!==idx));

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const typeColor = { "":"var(--accent)", break:"var(--accent3)", exam:"var(--accent2)" };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📅 Study Planner</h2>
        <p className="page-sub">Plan your daily study schedule</p>
      </div>

      <div className="card mb24">
        <h3 className="section-title">Add Study Session</h3>
        <div className="grid-3">
          <div className="form-group">
            <label>Subject</label>
            <input placeholder="e.g. React Hooks" value={subject} onChange={e=>setSubject(e.target.value)}/>
          </div>
          <div className="form-group">
            <label>Day</label>
            <select value={day} onChange={e=>setDay(e.target.value)}>
              {days.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e=>setType(e.target.value)}>
              <option value="">Study</option>
              <option value="break">Break</option>
              <option value="exam">Exam Prep</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start</label>
            <input type="time" value={start} onChange={e=>setStart(e.target.value)}/>
          </div>
          <div className="form-group">
            <label>End</label>
            <input type="time" value={end} onChange={e=>setEnd(e.target.value)}/>
          </div>
          <div className="form-group" style={{display:"flex",alignItems:"flex-end"}}>
            <button className="btn btn-primary" style={{width:"100%"}} onClick={add}>+ Add Session</button>
          </div>
        </div>
      </div>

      {days.map(d=>{
        const ds = sessions.filter(s=>s.day===d);
        if (!ds.length) return null;
        return (
          <div key={d} className="card mb14">
            <div className="schedule-header">{d}</div>
            {ds.map((s,i)=>(
              <div key={i} className="schedule-slot" style={{borderLeftColor:typeColor[s.type]||"var(--accent)"}}>
                <span className="slot-time">{s.start} – {s.end}</span>
                <span className="slot-subject">{s.subject}</span>
                <span className="tag" style={{marginLeft:"auto",background:"rgba(108,99,255,.15)",color:"var(--accent)",fontSize:"11px"}}>
                  {s.type||"Study"}
                </span>
                <button className="icon-btn" onClick={()=>del(sessions.indexOf(s))}>🗑</button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  POMODORO PAGE
// ═══════════════════════════════════════════════════════════════════════════
function PomodoroPage() {
  const MODES = [
    { label:"🎯 Focus",       mins:25, phase:"Focus" },
    { label:"☕ Short Break", mins:5,  phase:"Short Break" },
    { label:"🛌 Long Break",  mins:15, phase:"Long Break" },
  ];
  const [modeIdx,  setModeIdx]  = useState(0);
  const [secs,     setSecs]     = useState(25*60);
  const [total,    setTotal]    = useState(25*60);
  const [running,  setRunning]  = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusMins,setFocusMins]= useState(0);
  const [log,      setLog]      = useState([]);
  const timerRef = useRef(null);

  useEffect(()=>{
    if (running) {
      timerRef.current = setInterval(()=>{
        setSecs(s=>{
          if (s<=1) {
            clearInterval(timerRef.current);
            setRunning(false);
            const m = MODES[modeIdx];
            setSessions(n=>n+1);
            if (m.phase==="Focus") setFocusMins(f=>f+m.mins);
            setLog(l=>[{ phase:m.phase, mins:m.mins, time:new Date().toLocaleTimeString() }, ...l.slice(0,9)]);
            return 0;
          }
          return s-1;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  }, [running]);

  const switchMode = (i) => {
    if (running) return;
    setModeIdx(i);
    setSecs(MODES[i].mins*60);
    setTotal(MODES[i].mins*60);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setSecs(MODES[modeIdx].mins*60);
    setTotal(MODES[modeIdx].mins*60);
  };

  const mm = String(Math.floor(secs/60)).padStart(2,"0");
  const ss = String(secs%60).padStart(2,"0");
  const pct = secs/total;
  const R = 100, circ = 2*Math.PI*R;
  const offset = circ*(1-pct);
  const color = modeIdx===0 ? "var(--accent)" : modeIdx===1 ? "var(--accent3)" : "var(--accent2)";

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">🍅 Pomodoro Timer</h2>
        <p className="page-sub">Stay focused with the Pomodoro technique</p>
      </div>

      <div className="grid-2">
        <div className="card" style={{textAlign:"center",padding:"36px 24px"}}>
          <div className="pomo-modes">
            {MODES.map((m,i)=>(
              <button key={i} className={`pomo-mode-btn${modeIdx===i?" active":""}`} onClick={()=>switchMode(i)}>{m.label}</button>
            ))}
          </div>

          <div className="pomo-ring">
            <svg viewBox="0 0 240 240" width="220" height="220" style={{transform:"rotate(-90deg)"}}>
              <circle cx="120" cy="120" r={R} fill="none" stroke="var(--border)" strokeWidth="12"/>
              <circle cx="120" cy="120" r={R} fill="none" stroke={color} strokeWidth="12"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{transition:"stroke-dashoffset 1s linear, stroke .3s"}}/>
            </svg>
            <div className="pomo-time">{mm}:{ss}</div>
            <div className="pomo-phase">{MODES[modeIdx].phase} 🎯</div>
          </div>

          <div className="pomo-controls">
            <button className="btn btn-primary" style={{padding:"12px 32px",fontSize:"16px"}} onClick={()=>setRunning(r=>!r)}>
              {running ? "⏸ Pause" : "▶ Start"}
            </button>
            <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
          </div>
          <p className="muted" style={{marginTop:"16px",fontSize:"13px"}}>
            Sessions: <strong style={{color:"var(--accent)"}}>{sessions}</strong>&nbsp;·&nbsp;
            Focus time: <strong style={{color:"var(--accent3)"}}>{focusMins}m</strong>
          </p>
        </div>

        <div>
          <div className="card mb20">
            <h3 className="section-title">How it works</h3>
            {[
              ["1️⃣","Pick a task","From your to-do list"],
              ["2️⃣","Focus 25 min","Zero distractions!"],
              ["3️⃣","5-min break","Rest your brain"],
              ["4️⃣","Every 4 → long break","15 min recharge"],
            ].map(([ico,title,sub])=>(
              <div key={title} className="how-row">
                <div className="how-ico">{ico}</div>
                <div><div className="how-title">{title}</div><div className="how-sub">{sub}</div></div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="section-title">Session Log</h3>
            {log.length===0
              ? <p className="muted" style={{fontSize:"13px"}}>No sessions yet. Start your first Pomodoro!</p>
              : log.map((l,i)=>(
                <div key={i} className="log-row">
                  <span style={{color:"var(--accent)"}}>🍅</span>
                  <span style={{flex:1,fontSize:"13px"}}>{l.phase} ({l.mins}m)</span>
                  <span className="muted" style={{fontSize:"12px"}}>{l.time}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
function AdminPage({ resources, tasks, onRefresh, toast }) {
  const delRes = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      await fetch(`${API}/resources/${id}`, { method:"DELETE", headers: authHeaders() });
      toast("🗑 Deleted"); onRefresh();
    } catch { toast("❌ Failed"); }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">🛠 Admin Panel</h2>
        <p className="page-sub">Manage all resources and tasks</p>
      </div>

      <div className="grid-3 mb24">
        {[
          { label:"Total Resources", val:resources.length, cls:"stat-purple" },
          { label:"Total Tasks",     val:tasks.length,     cls:"stat-green"  },
          { label:"Completed Tasks", val:tasks.filter(t=>t.completed).length, cls:"stat-pink" },
        ].map((s,i)=>(
          <div key={i} className={`card ${s.cls}`}>
            <div className="card-accent"></div>
            <div className="card-title">{s.label}</div>
            <div className="card-value">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="section-title mb14">📋 All Resources</h3>
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Description</th><th>File</th><th>Action</th></tr>
          </thead>
          <tbody>
            {resources.length===0
              ? <tr><td colSpan={4} className="muted" style={{textAlign:"center",padding:"20px"}}>No resources</td></tr>
              : resources.map(r=>(
                <tr key={r._id}>
                  <td><strong>{r.title}</strong></td>
                  <td className="muted">{r.description?.slice(0,50)}{r.description?.length>50?"…":""}</td>
                  <td>{r.fileUrl
                    ? <a className="tag tag-purple" href={`${API}/uploads/${r.fileUrl}`} target="_blank" rel="noreferrer">⬇ File</a>
                    : <span className="tag tag-muted">—</span>}
                  </td>
                  <td><button className="btn btn-danger btn-sm" onClick={()=>delRes(r._id)}>🗑 Delete</button></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div className="card" style={{marginTop:"20px"}}>
        <h3 className="section-title mb14">📋 All Tasks</h3>
        <table className="admin-table">
          <thead>
            <tr><th>Task</th><th>Status</th></tr>
          </thead>
          <tbody>
            {tasks.length===0
              ? <tr><td colSpan={2} className="muted" style={{textAlign:"center",padding:"20px"}}>No tasks</td></tr>
              : tasks.map(t=>(
                <tr key={t._id}>
                  <td style={{textDecoration:t.completed?"line-through":"none",color:t.completed?"var(--muted)":"var(--text)"}}>{t.text}</td>
                  <td><span className={`tag ${t.completed?"tag-green":"tag-yellow"}`}>{t.completed?"Done":"Pending"}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authed,    setAuthed]    = useState(!!getToken());
  const [page,      setPage]      = useState("dashboard");
  const [resources, setResources] = useState([]);
  const [tasks,     setTasks]     = useState([]);
  const [toastMsg,  setToastMsg]  = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wake up Render backend on app load
  useEffect(() => {
    fetch(`${API}/health`).catch(()=>{});
  }, []);

  const toast = (msg) => setToastMsg(msg);

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API}/resources`, { headers: authHeaders() });
      // if (res.status===401) { 
      //   // console.log("401 on fetchResources - token:", getToken());  *Just for Debug not for production*
      //   return; 
      // }
      if (res.status===401) { logout(); return; }
      const data = await res.json();
      // console.log("fetchResources data:", data);     *Just for Debug not for production*
      setResources(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/tasks`, { headers: authHeaders() });
      if (res.status===401) { logout(); return; }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {}
  };

  const refreshAll = () => { fetchResources(); fetchTasks(); };

  useEffect(() => { if (authed) refreshAll(); }, [authed]);

  const logout = () => {
    localStorage.removeItem("sn_token");
    localStorage.removeItem("sn_user");
    setAuthed(false);
    setPage("dashboard");
  };

  if (!authed) return <AuthPage onLogin={()=>setAuthed(true)}/>;

  const navItems = [
    { id:"dashboard", ico:"🏠", label:"Dashboard" },
    { id:"resources", ico:"📂", label:"Resources"  },
    { id:"planner",   ico:"📅", label:"Planner"    },
    { id:"todo",      ico:"✅", label:"To-Do"       },
    { id:"pomodoro",  ico:"🍅", label:"Pomodoro"   },
    null,
    { id:"admin",     ico:"🛠", label:"Admin"       },
  ];

  const user = getUser();

  return (
    <div className="app-shell">

      {/* TOP NAVBAR */}
      <div style={{
        position:"fixed", top:0, left:0, right:0, height:"56px",
        background:"var(--card)", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px", zIndex:140
      }}>
        {/* LEFT — Hamburger + Logo */}
        <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <button onClick={()=>setSidebarOpen(o=>!o)}
            style={{
              background:"none", border:"1px solid var(--border)",
              borderRadius:"8px", padding:"6px 10px", cursor:"pointer",
              fontSize:"18px", color:"var(--text)", lineHeight:1
            }}>☰</button>
          <div className="logo" style={{fontSize:"20px",margin:0}}>Edu<span>Flow</span></div>
        </div>

        {/* RIGHT — User name + Logout */}
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div className="avatar" style={{width:"30px",height:"30px",fontSize:"12px"}}>
              {(user?.name||"U")[0].toUpperCase()}
            </div>
            <span style={{fontSize:"13px",fontWeight:600,color:"var(--text)"}}>
              {user?.name||"Student"}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>🚪 Logout</button>
        </div>
      </div>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)}
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
            zIndex:150, backdropFilter:"blur(2px)"
          }}/>
      )}

      {/* SIDEBAR */}
      <nav className="sidebar" style={{
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .3s ease",
        zIndex:160
      }}>
        {/* Sidebar header */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"24px"}}>
          <button onClick={()=>setSidebarOpen(false)}
            style={{background:"none",border:"none",color:"var(--muted)",fontSize:"22px",cursor:"pointer"}}>✕</button>
        </div>
        {navItems.map((n,i)=>
          n===null
            ? <hr key={i} className="nav-divider"/>
            : <button key={n.id} className={`nav-btn${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
                <span className="ico">{n.ico}</span><span>{n.label}</span>
              </button>
        )}
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">{(user?.name||"U")[0].toUpperCase()}</div>
            <div>
              <div style={{fontSize:"13px",fontWeight:600}}>{user?.name||"Student"}</div>
              <div style={{fontSize:"11px",color:"var(--muted)"}}>Student</div>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="main">
        {page==="dashboard" && <Dashboard resources={resources} tasks={tasks}/>}
        {page==="resources" && <ResourcesPage resources={resources} onRefresh={refreshAll} toast={toast}/>}
        {page==="planner"   && <PlannerPage/>}
        {page==="todo"      && <TasksPage tasks={tasks} onRefresh={fetchTasks} toast={toast}/>}
        {page==="pomodoro"  && <PomodoroPage/>}
        {page==="admin"     && <AdminPage resources={resources} tasks={tasks} onRefresh={refreshAll} toast={toast}/>}
      </main>

      <Toast msg={toastMsg} onDone={()=>setToastMsg("")}/>
    </div>
  );
}
