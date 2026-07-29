"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { BriefDTO, InsightDTO, ProjectDetailDTO, ProjectDTO, ResearchDTO } from "@/app/lib/data";
import { moduleMeta } from "@/app/lib/data";
import { briefToMarkdown } from "@/app/lib/brief-markdown";
import { ConfirmDialog, ErrorState, LoadingState } from "@/app/components/ui";
import { apiFetch,getSupabaseBrowser } from "@/lib/supabase-browser";

type View = "landing" | "projects" | "create" | "evidence" | "research" | "insights" | "brief" | "login";
type BriefField = keyof Pick<BriefDTO, "background" | "marketingObjective" | "positioning" | "persona" | "coreInsights" | "communication" | "contentSuggestions" | "channels" | "kpis" | "gtmStrategy" | "userJourney" | "localizationPlan" | "northStarMetrics">;
type BriefJsonField = keyof Pick<BriefDTO, "competitorMatrix" | "overseasChannels" | "kolStrategy" | "growthExperiments">;
type BriefTextField = keyof Pick<BriefDTO, "pricingEconomics" | "userInterviewPlan">;

function GtmBlock({ label, field, kind, draft, setDraft, readOnly }: { label: string; field: BriefJsonField | BriefTextField; kind: "matrix" | "text"; draft: BriefDTO; setDraft: (next: BriefDTO) => void; readOnly: boolean }) {
  const raw = (draft[field] as string) || (kind === "matrix" ? "[]" : "");
  let rows: Array<Record<string, string>> = [];
  let parseError = false;
  if (kind === "matrix") {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) rows = parsed as Array<Record<string, string>>; } catch { parseError = true; }
  }
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return (
    <section className="gtm-matrix">
      <span>GTM</span>
      <div>
        <small>{label}{parseError && <em className="matrix-error"> · JSON 格式有误，请检查</em>}</small>
        {kind === "matrix" && columns.length > 0 && (
          <div className="matrix-preview">
            <table>
              <thead><tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr></thead>
              <tbody>{rows.map((row, index) => <tr key={index}>{columns.map((col) => <td key={col}>{row[col] ?? ""}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        {!readOnly && (
          <textarea
            className={kind === "matrix" ? "matrix-json" : ""}
            rows={kind === "matrix" ? Math.max(3, rows.length + 2) : 5}
            aria-label={label}
            value={raw}
            onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
          />
        )}
      </div>
    </section>
  );
}

const currentProjectId = () => typeof window === "undefined" ? "oura-us" : window.location.pathname.split("/")[2] || "oura-us";
const stageLabel=(status:string)=>status==="BRIEF_READY"?"简报完成":status==="INSIGHTS"?"洞察整理":status==="RESEARCHING"||status==="READY"?"研究中":"等待研究";
const sourceTypeLabel:Record<string,string>={OFFICIAL:"官方资料",INSTITUTION:"机构资料",MEDIA:"媒体报道",COMMERCE:"电商与评价",COMMUNITY:"公开社区",OTHER:"其他信息来源"};

function Brand() {
  return <Link href="/" className="brand"><span className="brand-mark">B</span><span>BrandScope</span></Link>;
}

function AuthControls(){
  const[email,setEmail]=useState("");
  useEffect(()=>{const supabase=getSupabaseBrowser();if(!supabase)return;void supabase.auth.getUser().then(({data})=>setEmail(data.user?.email||""));const{data}=supabase.auth.onAuthStateChange((_,session)=>setEmail(session?.user.email||""));return()=>data.subscription.unsubscribe();},[]);
  async function signOut(){await getSupabaseBrowser()?.auth.signOut();window.location.href="/";}
  return email?<span className="auth-status"><small>{email}</small><button onClick={signOut}>退出</button></span>:<Link href="/login">登录 / 注册</Link>;
}

function useProject() {
  const [data, setData] = useState<ProjectDetailDTO | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await apiFetch(`/api/projects/${currentProjectId()}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).error);
      setData(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "项目加载失败。" );
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { data, error, load, setData };
}

function Landing() {
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [brandName, setBrandName] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  useEffect(() => { apiFetch("/api/projects", { cache: "no-store" }).then(response => response.ok ? response.json() : []).then(setProjects).catch(() => setProjects([])); }, []);
  function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams({ brandName, targetMarket });
    window.location.href = `/projects/new?${query.toString()}`;
  }
  const projectStage=(project:ProjectDTO)=>stageLabel(project.status);
  const benchmarkProjects=[{id:"oura-us",label:"Oura 美国案例"},{id:"whoop-us",label:"Whoop 美国案例"},{id:"ultrahuman-in",label:"Ultrahuman 印度案例"}];
  return <main className="landing landing-simple">
    <nav className="topbar product-top"><Brand/><p>帮助品牌团队完成品牌研究、洞察分析和品牌营销简报。</p><div className="top-auth"><Link href="/projects">全部项目</Link><AuthControls/></div></nav>
    <section className="home-workspace">
      <div className="home-primary"><span className="section-label">开始工作</span><h1>今天准备研究<br/>哪个品牌？</h1><div className="home-choice"><strong>查看公开 Benchmark</strong><span>或创建自己的真实研究项目</span></div><div className="benchmark-entry">{benchmarkProjects.map(item=><Link key={item.id} href={`/projects/${item.id}/research`}><span>{item.label}</span><i>→</i></Link>)}</div><form className="quick-start" onSubmit={begin}><label>品牌名称<input value={brandName} onChange={event => setBrandName(event.target.value)} required placeholder="例如：安克创新"/></label><label>目标市场<input value={targetMarket} onChange={event => setTargetMarket(event.target.value)} required placeholder="例如：德国"/></label><button className="button dark primary-action">创建真实研究 →</button><small>需邮箱登录；每位用户每天最多创建 2 个项目，公开额度用完后不会回退 Mock。</small></form></div>
      <div className="home-flow"><span>工作流程</span><ol><li><b>01</b>创建项目</li><li><b>02</b>品牌研究</li><li><b>03</b>核心洞察</li><li><b>04</b>品牌营销简报</li></ol></div>
      <section className="recent-projects"><div className="recent-head"><div><span className="section-label">最近项目</span><h2>继续研究</h2></div><Link href="/projects">查看全部 →</Link></div><div className="recent-list">{projects === null ? <p>正在读取项目…</p> : projects.slice(0, 3).map(project => <Link href={`/projects/${project.id}/research`} key={project.id}><span>{project.brandName.slice(0, 2).toUpperCase()}</span><div><strong>{project.name}</strong><small>更新于 {new Date(project.updatedAt).toLocaleDateString("zh-CN")} · {projectStage(project)}</small></div><i>→</i></Link>)}</div></section>
    </section>
  </main>;
}

function TopBar() {
  return <nav className="topbar app-top"><Brand/><div className="toplinks"><Link href="/projects">项目</Link><span className="muted">Evidence 研究工作流</span><AuthControls/></div></nav>;
}

function Sidebar({ project, active }: { project: ProjectDTO; active: View }) {
  return <aside className="sidebar">
    <Brand/>
    <Link className="back" href="/projects">← 返回项目列表</Link>
    <div className="side-project"><small>当前项目</small><strong>{project.brandName}</strong><span>{project.targetMarket} · {project.category}</span></div>
    <nav className="side-nav">
      <Link href="/projects"><span>01</span>项目</Link>
      <Link className={active === "evidence" ? "active" : ""} href={`/projects/${project.id}/evidence`}><span>02</span>资料证据</Link>
      <Link className={active === "research" ? "active" : ""} href={`/projects/${project.id}/research`}><span>03</span>品牌研究</Link>
      <Link className={active === "insights" ? "active" : ""} href={`/projects/${project.id}/insights`}><span>04</span>核心洞察</Link>
      <Link className={active === "brief" ? "active" : ""} href={`/projects/${project.id}/brief`}><span>05</span>品牌营销简报</Link>
    </nav>
    <div className="side-bottom"><span><i/> {project.readOnly?"公开 Demo":"AI 服务"}</span><span>{project.readOnly?"只读 Benchmark":"安全服务端调用"}</span></div>
  </aside>;
}

function ProjectEdit({ project, close, saved }: { project: ProjectDTO; close: () => void; saved: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await apiFetch(`/api/projects/${project.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { setError((await response.json()).error || "保存失败。"); setBusy(false); return; }
    saved();
  }
  return <form className="project-edit" onSubmit={submit}>
    <div className="edit-heading"><div><span>编辑项目</span><strong>{project.brandName}</strong></div><button type="button" onClick={close}>关闭</button></div>
    <div className="edit-grid">
      <label>项目名称<input name="name" defaultValue={project.name} required/></label>
      <label>品牌名称<input name="brandName" defaultValue={project.brandName} required/></label>
      <label>产品类别<input name="category" defaultValue={project.category} required/></label>
      <label>目标市场<input name="targetMarket" defaultValue={project.targetMarket} required/></label>
      <label>主要竞品<input name="competitors" defaultValue={project.competitors}/></label>
      <label>研究目标<textarea name="researchObjective" defaultValue={project.researchObjective} required/></label>
    </div>
    <p className="edit-warning">保存后，系统会清空旧研究、洞察和简报，避免项目输入与研究结果不一致。</p>
    {error && <p className="form-error">{error}</p>}
    <div className="edit-actions"><button type="button" onClick={close}>取消</button><button className="button dark" disabled={busy}>{busy ? "正在保存…" : "保存修改"}</button></div>
  </form>;
}

function Projects() {
  const [items, setItems] = useState<ProjectDTO[] | null>(null);
  const [editing, setEditing] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setError("");
      const response = await apiFetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setItems(await response.json());
    } catch { setError("项目列表加载失败，请检查数据库连接。"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function remove(id: string) {
    const response = await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
    if (response.ok) setItems(current => current?.filter(item => item.id !== id) || []); else setError("项目删除失败，请重试。");
    setDeleting(null);
  }
  if (error) return <><TopBar/><ErrorState message={error} retry={load}/></>;
  return <main className="app-page"><TopBar/><section className="page-wrap">
    <div className="page-heading"><div><span className="section-label">项目工作区</span><h1>品牌研究项目</h1><p>公开 Benchmark 可直接浏览；登录后可创建自己的真实 AI 研究。</p></div><Link className="button dark" href="/projects/new">创建真实研究 <span>+</span></Link></div>
    {editing && <ProjectEdit project={editing} close={() => setEditing(null)} saved={() => { setEditing(null); void load(); }}/>} 
    {items === null ? <LoadingState/> : items.length === 0 ? <div className="empty-card"><span>暂无项目</span><h2>从第一个市场问题开始。</h2><p>创建品牌研究项目后，AI 服务会生成完整的六模块研究。</p><Link className="button dark" href="/projects/new">创建第一个项目 →</Link></div> : <div className="project-table">
      <div className="table-head"><span>项目</span><span>目标市场</span><span>状态</span><span>更新时间</span><span/></div>
      {items.map(project => <div className="project-row" key={project.id}>
        <Link className="project-name" href={`/projects/${project.id}/research`}><span>{project.brandName.slice(0, 2).toUpperCase()}</span><div><strong>{project.name}</strong><small>{project.category} · {project.competitors.split(/[,，、]/).filter(item => item.trim()).length} 个竞品</small></div></Link>
        <span>{project.targetMarket}</span><span className="pill"><i className={project.status !== "DRAFT" ? "ready" : ""}/>{stageLabel(project.status)}</span><span>{new Date(project.updatedAt).toLocaleDateString("zh-CN")}</span>
        <div className="row-actions">{!project.readOnly&&<button onClick={() => setEditing(project)} aria-label="编辑项目">编辑</button>}<Link href={`/projects/${project.id}/research`} aria-label="打开项目">→</Link>{!project.readOnly&&<button onClick={() => setDeleting(project.id)} aria-label="删除项目">×</button>}</div>
      </div>)}
    </div>}
    <div className="page-footnote"><span>{items?.length || 0} 个项目</span><span>{items?.every(item=>item.readOnly)?"公开只读 Benchmark Demo":"PostgreSQL 私有持久化 · 真实 AI 服务"}</span></div><ConfirmDialog open={Boolean(deleting)} title="删除这个项目？" description="相关研究内容、核心洞察和品牌营销简报也会一并删除，此操作无法撤销。" confirmLabel="确认删除" onCancel={()=>setDeleting(null)} onConfirm={()=>deleting&&void remove(deleting)}/>
  </section></main>;
}

function CreateProject() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prefill, setPrefill] = useState({ brandName: "", targetMarket: "" });
  const[quota,setQuota]=useState<{remainingAiCalls:number;dailyAiCallLimit:number}|null>(null);
  useEffect(() => { const query = new URLSearchParams(window.location.search); setPrefill({ brandName: query.get("brandName") || "", targetMarket: query.get("targetMarket") || "" });void apiFetch("/api/quota").then(response=>response.json()).then(setQuota).catch(()=>{}); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values=Object.fromEntries(new FormData(event.currentTarget));const urls=String(values.evidenceUrls||"").split(/\n/).map(item=>item.trim()).filter(Boolean);delete values.evidenceUrls;
    if(urls.length>8){setError("单个项目最多提交 8 个 Evidence URL。");setBusy(false);return;}
    const response = await apiFetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) { if(response.status===401)window.location.href=`/login?next=${encodeURIComponent(window.location.href)}`;setError(result.error || "创建失败。"); setBusy(false); return; }
    for(const url of urls){const evidence=await apiFetch(`/api/projects/${result.id}/evidence`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url})});if(!evidence.ok){setError((await evidence.json()).error||"部分网页资料读取失败。");setBusy(false);return;}}
    window.location.href = `/projects/${result.id}/evidence`;
  }
  return <main className="app-page"><TopBar/><section className="form-shell">
    <div className="form-intro"><span className="section-label">创建项目</span><h1>定义一个清晰的市场问题。</h1><p>输入研究所需的最少信息，之后仍然可以继续修改。</p><div className="steps"><span className="active">01 创建项目</span><span>02 品牌研究</span><span>03 核心洞察</span><span>04 品牌营销简报</span></div></div>
    <form className="project-form" onSubmit={submit}>
      <label>项目名称 *<input name="name" required maxLength={120} autoFocus placeholder="例如：Aurora 美国市场进入研究"/></label>
      <label>品牌名称 *<input name="brandName" required maxLength={100} value={prefill.brandName} onChange={event => setPrefill({ ...prefill, brandName: event.target.value })} placeholder="例如：Aurora Skin"/></label>
      <div className="field-pair"><label>产品类别 *<input name="category" required maxLength={100} placeholder="例如：护肤品"/></label><label>目标市场 *<input name="targetMarket" required maxLength={100} value={prefill.targetMarket} onChange={event => setPrefill({ ...prefill, targetMarket: event.target.value })} placeholder="例如：美国"/></label></div>
      <label>主要竞品<input name="competitors" maxLength={500} placeholder="用逗号分隔"/><small>建议填写 2–5 个用户真正会比较的品牌。</small></label>
      <label>研究目标 *<textarea name="researchObjective" required maxLength={1200} rows={4} placeholder="这次研究需要帮助你做出什么决定？"/></label>
      <label>Evidence URL<textarea name="evidenceUrls" rows={5} placeholder={"每行一个公开网页 URL，最多 8 个\nhttps://example.com/article"}/><small>仅支持公开 HTTP/HTTPS 网页；系统会阻止本机、内网和危险重定向。</small></label>
      <div className="usage-notice"><strong>公开体验额度</strong><p>每位用户每天最多创建 2 个项目；每个项目仅可生成 1 次 Research、1 次 Insights 和 1 次 Brief。</p><p>{quota?`今日全站还可发起约 ${quota.remainingAiCalls}/${quota.dailyAiCallLimit} 次 AI 生成。`:"正在读取今日公开额度…"}</p><small>AI 可能产生错误或推断，请在用于工作前核验原始来源。额度用完后不会回退为模拟结果。</small></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><Link href="/projects">取消</Link><button className="button dark" disabled={busy}>{busy ? "正在创建…" : "创建并开始研究 →"}</button></div>
    </form>
  </section></main>;
}

function Research() {
  const { data, error, load } = useProject();
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  async function generate() {
    if (!data) return; setBusy(true); setActionError("");
    const response = await apiFetch(`/api/projects/${data.id}/research`, { method: "POST" });
    setBusy(false); if (response.ok) void load(); else setActionError((await response.json()).error||"研究生成失败，请重试。");
  }
  if (error) return <ErrorState message={error} retry={load}/>;
  if (!data) return <LoadingState/>;
  const current = data.research[active] as ResearchDTO | undefined;
  return <div className="workspace"><Sidebar project={data} active="research"/><main className="workspace-main">
    <header className="workspace-head"><div><span className="section-label">品牌研究</span><h1>保留来源，<br/>再形成判断。</h1><p>研究严格基于你提交并成功提取的 Evidence 网页正文。</p></div><div className="head-actions"><span>{data.research.length}/6 个模块完成</span>{data.readOnly?<span className="pill">公开只读 Demo</span>:data.research.length?<span className="pill">已生成 · 每项目限 1 次</span>:<button className="button light" disabled={busy} onClick={generate}>{busy ? "正在生成品牌研究…" : "生成品牌研究"}</button>}</div></header>
    {actionError&&<p className="action-error" role="alert">{actionError}</p>}
    {!current ? <div className="empty-card"><span>尚未生成研究内容</span><h2>先准备 Evidence，再运行一次真实研究。</h2><p>系统不会自动搜索；请先在资料证据中添加 1–8 个公开网页 URL。</p><button className="button dark" disabled={busy} onClick={generate}>{busy ? "正在生成品牌研究…" : "开始品牌研究 →"}</button></div> : <>
      <div className="research-layout"><nav className="module-list">{moduleMeta.map((module, index) => <button key={module[0]} className={index === active ? "active" : ""} onClick={() => setActive(index)}><span>0{index + 1}</span><b>{module[1]}</b><i>{data.research.some(item => item.module === module[0]) ? "✓" : "·"}</i></button>)}</nav>
        <article className="research-paper"><div className="paper-meta"><span>研究模块 0{active + 1} / 06</span><span>生成完成</span></div><header className="research-module-head"><span>一句话摘要</span><h2>{moduleMeta[active][1]}</h2><p>{current.title}</p></header><section className="research-detail"><span>研究摘要</span><p>{current.summary}</p></section>{current.keyFacts&&<section className="research-detail"><span>关键事实</span><p>{current.keyFacts}</p></section>}{current.marketSignals&&<section className="research-detail"><span>市场信号</span><p>{current.marketSignals}</p></section>}<section className="research-inference"><span>AI 判断与推断</span><p>{current.inference||"当前资料不足以得出确定结论"}</p></section>{current.marketingMeaning&&<section className="research-detail"><span>对品牌营销的意义</span><p>{current.marketingMeaning}</p></section>}{current.limitations&&<section className="research-detail"><span>研究边界</span><p>{current.limitations}</p></section>}
          <div className="source-block"><div className="source-title"><span className="section-label">引用 Evidence</span><span>{current.sources.length} 条</span></div>{current.sources.map(source => <a className="source-item" href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.id.slice(0,7)}</span><div><strong>{source.title}</strong><small>{source.publisher}{source.publishedAt ? ` · 发布于 ${new Date(source.publishedAt).toLocaleDateString("zh-CN")}` : ""} · {source.qualityGrade} 级来源 · {sourceTypeLabel[source.sourceType]||"其他来源"}</small><p>{source.summary}</p></div><i>↗</i></a>)}</div>
          <div className="paper-nav"><button disabled={active === 0} onClick={() => setActive(value => value - 1)}>← 上一模块</button><button disabled={active === 5} onClick={() => setActive(value => value + 1)}>下一模块 →</button></div>
        </article></div>
      <div className="workspace-next"><div><small>品牌研究已完成</small><strong>下一步：把资料转化为你认可的判断。</strong></div><Link className="button dark" href={`/projects/${data.id}/insights`}>进入核心洞察 →</Link></div>
    </>}
  </main></div>;
}

function Evidence(){
 const {data,error,load}=useProject();const[busy,setBusy]=useState(false);const[actionError,setActionError]=useState("");const[url,setUrl]=useState("");
 async function collect(event?:FormEvent<HTMLFormElement>){event?.preventDefault();if(!data||!url.trim())return;setBusy(true);setActionError("");const response=await apiFetch(`/api/projects/${data.id}/evidence`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url:url.trim()})});setBusy(false);if(response.ok){setUrl("");void load();}else setActionError((await response.json()).error||"网页资料读取失败。");}
 if(error)return <ErrorState message={error} retry={load}/>;if(!data)return <LoadingState/>;
 const cited=data.sources.filter(item=>(item._count?.research||0)>0).length;
 return <div className="workspace"><Sidebar project={data} active="evidence"/><main className="workspace-main">
  <header className="workspace-head"><div><span className="section-label">资料证据</span><h1>先建立证据，<br/>再形成判断。</h1><p>手动提交公开网页 URL；系统读取并清洗正文，单个项目最多 8 条。</p></div><div className="head-actions"><span>{data.sources.length}/8 条资料 · {cited} 条被引用</span>{data.readOnly&&<span className="pill">公开只读 Demo</span>}</div></header>
  {actionError&&<p className="action-error" role="alert">{actionError}</p>}
  {!data.readOnly&&data.sources.length<8&&<form className="evidence-add" onSubmit={collect}><label>添加 Evidence URL<input type="url" required value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://example.com/article"/></label><button className="button dark" disabled={busy}>{busy?"正在读取网页…":"读取并添加 →"}</button></form>}
  {!data.sources.length?<div className="empty-card"><span>暂无公开资料</span><h2>添加第一条真实网页资料。</h2><p>优先使用品牌官网、正式报告、行业机构或权威媒体的具体文章。</p></div>:<div className="evidence-table"><div className="evidence-head"><span>等级</span><span>资料</span><span>发布时间</span><span>正文</span><span>引用</span></div>{data.sources.map(item=><div className="evidence-row" key={item.id}><b className={`grade grade-${item.qualityGrade.toLowerCase()}`}>{item.qualityGrade}</b><div><a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a><small>{item.publisher} · {sourceTypeLabel[item.sourceType]||"其他来源"}</small></div><span>{item.publishedAt?new Date(item.publishedAt).toLocaleDateString("zh-CN"):"未标注"}</span><span>{item.extractionStatus==="SUCCESS"?`${item.content.length.toLocaleString("zh-CN")} 字`:"提取失败"}</span><span>{item._count?.research||0} 次</span></div>)}</div>}
  {data.sources.length>0&&<div className="workspace-next"><div><small>Evidence Bundle 已准备</small><strong>下一步：基于网页正文生成六模块研究。</strong></div><Link className="button dark" href={`/projects/${data.id}/research`}>进入品牌研究 →</Link></div>}
 </main></div>;
}

const insightLabels: Record<string, string> = { CORE: "核心判断", PAIN: "用户痛点", OPPORTUNITY: "市场机会", RISK: "潜在风险" };

function Insights() {
  const { data, error, load, setData } = useProject();
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  async function generateInsights(){if(!data)return;setBusy(true);setActionError("");const response=await apiFetch(`/api/projects/${data.id}/insights`,{method:"POST"});setBusy(false);if(response.ok)void load();else setActionError((await response.json()).error||"核心洞察生成失败。");}
  async function patch(item: InsightDTO, change: Partial<InsightDTO>) {
    if (!data) return; setActionError(""); const next = { ...item, ...change };
    const response=await apiFetch(`/api/insights/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
    if(!response.ok){ setActionError((await response.json()).error||"洞察保存失败。"); void load(); return; }
    setData({ ...data, insights: data.insights.map(current => current.id === item.id ? next : current) });
  }
  async function remove(id: string) {
    if (!data) return; const response=await apiFetch(`/api/insights/${id}`, { method: "DELETE" });
    if(!response.ok){ setActionError("洞察删除失败。"); return; }
    setData({ ...data, insights: data.insights.filter(item => item.id !== id) });
  }
  async function move(item: InsightDTO, direction: number) {
    if (!data) return; const group = data.insights.filter(current => current.type === item.type).sort((a, b) => a.position - b.position);
    const index = group.findIndex(current => current.id === item.id); const target = group[index + direction]; if (!target) return;
    const update=(insight:InsightDTO,position:number)=>apiFetch(`/api/insights/${insight.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({...insight,position})});
    const [first,second]=await Promise.all([update(item,target.position),update(target,item.position)]);
    if(!first.ok||!second.ok)setActionError("洞察排序失败，已恢复数据库中的顺序。");
    void load();
  }
  async function generateBrief() {
    if (!data) return; setBusy(true); const response = await apiFetch(`/api/projects/${data.id}/brief`, { method: "POST" }); setBusy(false);
    if (response.ok) window.location.href = `/projects/${data.id}/brief`; else setActionError((await response.json()).error||"简报生成失败，请重试。");
  }
  if (error) return <ErrorState message={error} retry={load}/>;
  if (!data) return <LoadingState/>;
  const confirmedCount=data.insights.filter(item => item.status === "CONFIRMED").length;
  return <div className="workspace"><Sidebar project={data} active="insights"/><main className="workspace-main insights-page">
    <header className="workspace-head decision-head"><div><span className="section-label">决策工作区</span><h1>审阅建议，<br/>确认你的判断。</h1><p>AI 负责整理候选洞察；你负责修改、排序并决定哪些内容进入简报。</p></div><div className="head-actions"><span>{confirmedCount} 条已确认</span>{data.readOnly?<span className="pill">公开只读 Demo</span>:<button className="button dark" disabled={busy||confirmedCount===0} onClick={generateBrief}>{busy ? "正在生成…" : confirmedCount===0 ? "请先确认洞察" : "生成品牌营销简报 →"}</button>}</div></header>
    {actionError&&<p className="action-error" role="alert">{actionError}</p>}<div className="decision-principle"><span>AI 建议</span><i>→</i><span>你的审阅与修改</span><i>→</i><strong>你的最终判断</strong></div>
    {data.insights.length === 0 ? <div className="empty-card"><h2>暂无核心洞察</h2><p>完成六个 Research 模块后，可运行一次真实 AI 洞察提炼。</p>{!data.readOnly&&<button className="button dark" disabled={busy||data.research.length!==6} onClick={generateInsights}>{busy?"正在提炼核心洞察…":data.research.length!==6?"请先完成品牌研究":"生成核心洞察 →"}</button>}</div> : <div className="insight-grid">{Object.entries(insightLabels).map(([type, label], groupIndex) => <section className="insight-group" key={type}><div className="group-head"><span>0{groupIndex + 1}</span><div><h2>{label}</h2><p>由你确认后才会进入简报</p></div></div>
      {data.insights.filter(item => item.type === type).sort((a, b) => a.position - b.position).map((item, index) => <article className={item.status === "CONFIRMED" ? "important" : ""} key={item.id}><span className="item-num">0{index + 1}</span><small className="decision-state">{item.status === "CONFIRMED" ? "你的判断" : "AI 建议"}</small>{editing === item.id ? <textarea autoFocus defaultValue={item.content} onBlur={event => { void patch(item, { content: event.target.value }); setEditing(null); }}/> : <p>{item.content}</p>}{!data.readOnly&&<><button className={`confirm-button ${item.status === "CONFIRMED" ? "active" : ""}`} onClick={() => void patch(item, { status: item.status === "CONFIRMED" ? "SUGGESTED" : "CONFIRMED" })}>{item.status === "CONFIRMED" ? "✓ 已确认" : "确认采用"}</button><div className="item-actions"><button onClick={() => move(item, -1)} aria-label="向上调整">上移</button><button onClick={() => move(item, 1)} aria-label="向下调整">下移</button><button onClick={() => setEditing(item.id)}>修改</button><button onClick={() => remove(item.id)}>删除</button></div></>}</article>)}
    </section>)}</div>}
  </main></div>;
}

const legacyBriefSections: { field: BriefField; label: string }[] = [
  { field: "background", label: "项目背景" }, { field: "marketingObjective", label: "营销目标" },
  { field: "positioning", label: "品牌定位" }, { field: "persona", label: "目标用户" },
  { field: "coreInsights", label: "核心洞察" }, { field: "communication", label: "传播方向" },
  { field: "contentSuggestions", label: "内容建议" }, { field: "channels", label: "渠道建议" },
  { field: "kpis", label: "衡量指标" },
];

const gtmBriefSections: { field: BriefField; label: string }[] = [
  { field: "background", label: "项目背景" }, { field: "marketingObjective", label: "营销与增长目标" },
  { field: "positioning", label: "品牌定位与价值主张" }, { field: "persona", label: "目标用户" },
  { field: "coreInsights", label: "核心洞察" }, { field: "gtmStrategy", label: "GTM 进入策略（0/30/60/90 天）" },
  { field: "userJourney", label: "用户旅程与转化漏斗" }, { field: "localizationPlan", label: "本地化运营" },
  { field: "northStarMetrics", label: "北极星指标与漏斗指标" },
];


function Brief() {
  const { data, error, load, setData } = useProject();
  const [draft, setDraft] = useState<BriefDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => { if (data?.brief && !draft) setDraft(data.brief); }, [data, draft]);
  async function generate() {
    if (!data) return; setBusy(true); setActionError(""); const response = await apiFetch(`/api/projects/${data.id}/brief`, { method: "POST" }); const result = await response.json(); setBusy(false);
    if (response.ok) { setData({ ...data, brief: result }); setDraft(result); } else setActionError(result.error||"简报生成失败，请重试。");
  }
  async function save() {
    if (!data || !draft) return; setBusy(true); const response = await apiFetch(`/api/projects/${data.id}/brief`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }); const result = await response.json(); setBusy(false);
    if (response.ok) { setDraft(result); setData({ ...data, brief: result }); setSaved(true); setTimeout(() => setSaved(false), 1500); } else setActionError(result.error||"简报保存失败，请重试。");
  }
  async function copy() { if (!draft||!data) return; try{await navigator.clipboard.writeText(briefToMarkdown(data.brandName,draft)); setCopied(true); setTimeout(() => setCopied(false), 1500);}catch{setActionError("复制失败，请检查浏览器的剪贴板权限。");} }
  async function download() { if (!draft || !data) return; if(!data.readOnly){const savedResponse=await apiFetch(`/api/projects/${data.id}/brief`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(draft)});if(!savedResponse.ok){setActionError("导出前保存简报失败，请重试。");return;}}const response=await apiFetch(`/api/projects/${data.id}/brief`);if(!response.ok){setActionError("Markdown 下载失败，请重试。");return;}const blob=await response.blob();const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`${data.brandName}-品牌营销简报.md`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(link.href); }
  if (error) return <ErrorState message={error} retry={load}/>;
  if (!data) return <LoadingState/>;
  if (!draft) return <div className="workspace"><Sidebar project={data} active="brief"/><main className="workspace-main"><div className="empty-card"><span>尚未生成简报</span><h2>使用已确认的洞察生成品牌营销简报。</h2><p>当前有 {data.insights.filter(item => item.status === "CONFIRMED").length} 条已确认洞察。生成后可以直接编辑每个章节。</p>{actionError&&<p className="action-error" role="alert">生成失败：{actionError}</p>}<button className="button dark" disabled={busy} onClick={generate}>{busy ? "正在生成品牌营销简报…" : "生成品牌营销简报 →"}</button></div></main></div>;
  const hasGtm = Boolean(draft.gtmStrategy || draft.competitorMatrix || draft.userJourney || draft.overseasChannels || draft.kolStrategy || draft.localizationPlan || draft.northStarMetrics || draft.pricingEconomics || draft.growthExperiments || draft.userInterviewPlan);
  const activeBriefSections = hasGtm ? gtmBriefSections : legacyBriefSections;
  return <div className="workspace"><Sidebar project={data} active="brief"/><main className="workspace-main brief-page">
    <header className="brief-head"><div><span className="section-label">{hasGtm ? "品牌 GTM 与营销简报" : "品牌营销简报"}</span><h1>{data.brandName}<br/><em>{draft.positioning ? draft.positioning.slice(0, 28) : hasGtm ? "GTM 策略简报" : "营销策略简报"}</em></h1><p>{data.targetMarket} · 更新于 {new Date(draft.updatedAt).toLocaleDateString("zh-CN")} {data.readOnly?"· 公开只读 Demo":""}</p></div><div className="brief-actions"><button className="button light" onClick={copy}>{copied ? "已复制" : "复制内容"}</button><button className="button light" onClick={() => void download()}>导出 Markdown ↓</button>{!data.readOnly&&<button className="button dark" disabled={busy} onClick={save}>{busy ? "正在保存…" : saved ? "已保存" : "保存简报"}</button>}</div></header>
    {actionError&&<p className="action-error" role="alert">{actionError}</p>}<article className="brief-document editable-brief">{activeBriefSections.map((section, index) => <section key={section.field}><span>0{index + 1}</span><div><small>{section.label}</small><textarea readOnly={data.readOnly} rows={Math.max(2,Math.ceil((draft[section.field] || "").length/56))} aria-label={section.label} value={draft[section.field] || ""} onChange={event => { setSaved(false); setDraft({ ...draft, [section.field]: event.target.value }); }}/></div></section>)}
      {hasGtm&&<>
      <GtmBlock label="竞品对比矩阵" field="competitorMatrix" kind="matrix" draft={draft} setDraft={(next) => { setSaved(false); setDraft(next); }} readOnly={Boolean(data.readOnly)} />
      <GtmBlock label="海外渠道矩阵" field="overseasChannels" kind="matrix" draft={draft} setDraft={(next) => { setSaved(false); setDraft(next); }} readOnly={Boolean(data.readOnly)} />
      <GtmBlock label="KOL / 达人策略" field="kolStrategy" kind="matrix" draft={draft} setDraft={(next) => { setSaved(false); setDraft(next); }} readOnly={Boolean(data.readOnly)} />
      <GtmBlock label="定价与单位经济" field="pricingEconomics" kind="text" draft={draft} setDraft={(next) => { setSaved(false); setDraft(next); }} readOnly={Boolean(data.readOnly)} />
      <GtmBlock label="上市前增长实验" field="growthExperiments" kind="matrix" draft={draft} setDraft={(next) => { setSaved(false); setDraft(next); }} readOnly={Boolean(data.readOnly)} />
      <GtmBlock label="用户访谈与洞察验证（内容/产品反馈闭环）" field="userInterviewPlan" kind="text" draft={draft} setDraft={(next) => { setSaved(false); setDraft(next); }} readOnly={Boolean(data.readOnly)} />
      </>}
    </article>
  </main></div>;
}

function Login(){
 const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[mode,setMode]=useState<"login"|"signup">("login");const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const supabase=getSupabaseBrowser();if(!supabase){setMessage("登录服务尚未配置。");return;}setBusy(true);setMessage("");const result=mode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});setBusy(false);if(result.error){const known:Record<string,string>={"Invalid login credentials":"邮箱或密码不正确。","User already registered":"该邮箱已经注册，请直接登录。","Password should be at least 6 characters.":"密码长度不足。"};setMessage(known[result.error.message]||"登录服务暂时不可用，请稍后重试。");return;}if(mode==="signup"&&!result.data.session){setMessage("注册成功，请打开邮箱完成确认后再登录。");return;}const next=new URLSearchParams(window.location.search).get("next")||"/projects";window.location.href=next;}
 return <main className="app-page"><TopBar/><section className="login-shell"><div><span className="section-label">公开真实研究</span><h1>{mode==="login"?"登录 BrandScope":"创建账户"}</h1><p>邮箱账户只用于隔离你的私人研究项目。Benchmark 始终公开可读。</p></div><form className="project-form auth-form" onSubmit={submit}><label>邮箱<input type="email" required value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email"/></label><label>密码<input type="password" required minLength={8} value={password} onChange={event=>setPassword(event.target.value)} autoComplete={mode==="login"?"current-password":"new-password"}/><small>至少 8 个字符。</small></label>{message&&<p className="form-error" role="alert">{message}</p>}<button className="button dark" disabled={busy}>{busy?"正在处理…":mode==="login"?"登录 →":"注册 →"}</button><button type="button" className="auth-switch" onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("");}}>{mode==="login"?"没有账户？创建一个":"已有账户？返回登录"}</button></form></section></main>;
}

export function BrandScopeApp({ view }: { view: View }) {
  if (view === "landing") return <Landing/>;
  if (view === "projects") return <Projects/>;
  if (view === "create") return <CreateProject/>;
  if (view === "login") return <Login/>;
  if (view === "evidence") return <Evidence/>;
  if (view === "research") return <Research/>;
  if (view === "insights") return <Insights/>;
  return <Brief/>;
}
