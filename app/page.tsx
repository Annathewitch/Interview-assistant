"use client";
import { useState, useEffect } from "react";

// --- 全局声明接口 ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    recordingTimer?: { current: NodeJS.Timeout };
    currentRecognition?: any;
  }
}

type Job = {
  id: number;
  company: string;
  role: string;
  salary: string;
  location: string;
  status: string;
};

type Interview = {
  id: number;
  jobId: number;
  date: string;
  time: string;
  channel: string;
  transcript?: string;
  audioData?: string;
  audioBlobUrl?: string;
  recordingDuration?: number;
};

const STATUS = ["刚投递", "已测评", "一面", "二面", "三面", "HR面", "Offer", "已挂"];

export default function Page() {
  const [topTab, setTopTab] = useState<"岗位" | "面试" | "复盘">("岗位");
  const [bottomTab, setBottomTab] = useState("首页");

  // 基础状态
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  
  // 表单状态
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  // 新手引导状态：0-无引导, 1-高亮加号, 2-高亮面试页签
  const [guideStep, setGuideStep] = useState(0);

  // 课程/面试其他状态
  const [currentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4);
  const [codingDemo, setCodingDemo] = useState(false);
  const [courseTab, setCourseTab] = useState<'推荐' | '热门' | '学习' | '已购'>('推荐');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [recording, setRecording] = useState(false);
  const [realTimeTranscript, setRealTimeTranscript] = useState("");
  const [report, setReport] = useState("");

  // 初始化加载与引导触发
  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");
    setJobs(j);
    setInterviews(i);
    
    // 如果是全新用户，3秒后开启引导
    if (j.length === 0) {
      setTimeout(() => setGuideStep(1), 1000);
    }
  }, []);

  const saveJobs = (data: Job[]) => { setJobs(data); localStorage.setItem("jobs", JSON.stringify(data)); };
  
  const addJob = () => {
    if (!company || !role) return;
    const newJob: Job = { id: Date.now(), company, role, salary, location, status };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany(""); setRole(""); setSalary(""); setLocation(""); setStatus("刚投递");
    // 如果在引导中，进入下一步
    if (guideStep === 1) setGuideStep(2);
  };

  return (
    <div style={appContainer}>
      {/* --- 新手引导遮罩层 --- */}
      {guideStep > 0 && (
        <div style={guideOverlay}>
          {guideStep === 1 && (
            <div style={guideBox}>
              <div style={guideArrowDown}>↓</div>
              <div style={guideText}>点击这里开启你的第一份岗位记录</div>
              <button style={guideSkipBtn} onClick={() => setGuideStep(0)}>跳过引导</button>
            </div>
          )}
          {guideStep === 2 && (
            <div style={{...guideBox, top: '120px'}}>
              <div style={guideText}>太棒了！现在去“面试”板块<br/>开启AI面试录音复盘吧</div>
              <div style={guideArrowUp}>↑</div>
              <button style={guideSkipBtn} onClick={() => setGuideStep(0)}>我知道了</button>
            </div>
          )}
        </div>
      )}

      <div style={headerStyle}>
        <div style={logoStyle}>求职助手 2026</div>
        <input placeholder="搜索公司/岗位" style={searchStyle} />
      </div>

      {bottomTab === "首页" && (
        <div style={{...topTabBarStyle, zIndex: guideStep === 2 ? 1001 : 1, position:'relative'}}>
          {["岗位", "面试", "复盘"].map((t) => (
            <div key={t} onClick={() => { setTopTab(t as any); if(guideStep === 2) setGuideStep(0); }}
              style={topTab === t ? topTabActiveStyle : topTabItemStyle}>{t}</div>
          ))}
        </div>
      )}

      <div style={contentStyle}>
        {bottomTab === "首页" && (
          <>
            {topTab === "岗位" && (
              <div style={listStyle}>
                {jobs.length === 0 && <div style={emptyStyle}>暂无岗位，点击下方"+"添加</div>}
                {jobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div style={titleStyle}>{job.role}</div>
                        <div style={{color:'#3B82F6', fontSize:'12px'}}>{job.salary}</div>
                    </div>
                    <div style={infoStyle}>{job.company} · {job.location}</div>
                    <button style={{ ...tagStyle, backgroundColor: "#3B82F6" }}>{job.status}</button>
                  </div>
                ))}
              </div>
            )}
            {/* 面试/复盘逻辑省略（保持与之前一致） */}
          </>
        )}

        {/* 课程页面、社区页面、我的页面内容保持不变... */}
        {bottomTab === "课程" && <div style={coursePageStyle}>/* 之前提供的课程UI代码 */</div>}
      </div>

      {/* 底部导航 */}
      <div style={bottomBarStyle}>
        <div onClick={() => setBottomTab("首页")} style={bottomTab === "首页" ? bottomActiveStyle : bottomItemStyle}>首页</div>
        <div onClick={() => setBottomTab("课程")} style={bottomTab === "课程" ? bottomActiveStyle : bottomItemStyle}>课程</div>
        
        {/* 加号按钮：引导状态下增加高亮类 */}
        <div 
          onClick={() => setShowAddPop(true)} 
          style={{
            ...bottomAddStyle, 
            zIndex: guideStep === 1 ? 1001 : 1,
            boxShadow: guideStep === 1 ? '0 0 0 9999px rgba(0,0,0,0.8), 0 0 20px #fff' : 'none'
          }}
        >+</div>
        
        <div onClick={() => setBottomTab("社区")} style={bottomTab === "社区" ? bottomActiveStyle : bottomItemStyle}>社区</div>
        <div onClick={() => setBottomTab("我的")} style={bottomTab === "我的" ? bottomActiveStyle : bottomItemStyle}>我的</div>
      </div>

      {/* 岗位录入弹窗：补全了所有字段 */}
      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{display:'flex', justifyContent:'space-between'}}><b>录入新岗位</b><span onClick={()=>setShowJobForm(false)}>✕</span></div>
            <input style={inputStyle} placeholder="公司名称" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="招聘岗位" value={role} onChange={e=>setRole(e.target.value)} />
            <div style={{display:'flex', gap:'10px'}}>
                <input style={{...inputStyle, flex:1}} placeholder="薪资估算" value={salary} onChange={e=>setSalary(e.target.value)} />
                <input style={{...inputStyle, flex:1}} placeholder="工作城市" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
            <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={addJob} style={modalBtnStyle}>确认添加</button>
          </div>
        </div>
      )}

      {/* 添加按钮弹窗 */}
      {showAddPop && (
        <div style={modalStyle} onClick={() => setShowAddPop(false)}>
          <div style={modalContentStyle} onClick={e=>e.stopPropagation()}>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>📝 记录新岗位</button>
            <button onClick={() => { setTopTab("面试"); setShowAddPop(false); setBottomTab("首页"); }} style={modalBtnStyle}>📅 安排面试</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 样式定义 ---
const appContainer: any = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "30px", overflow: "hidden", position: "relative", border:'8px solid #333', fontFamily:'sans-serif' };

// 引导专属样式
const guideOverlay: any = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, pointerEvents: 'none' };
const guideBox: any = { position:'absolute', bottom:'100px', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', color:'#fff', padding:'20px' };
const guideText: any = { fontSize:'18px', fontWeight:'bold', textAlign:'center', marginBottom:'15px', lineHeight:'1.4' };
const guideArrowDown: any = { fontSize:'30px', animation:'bounce 1s infinite' };
const guideArrowUp: any = { fontSize:'30px', animation:'bounceUp 1s infinite' };
const guideSkipBtn: any = { marginTop:'20px', background:'rgba(255,255,255,0.2)', border:'1px solid #fff', color:'#fff', padding:'5px 15px', borderRadius:'15px', fontSize:'12px', pointerEvents:'auto', cursor:'pointer' };

// 基础组件样式
const headerStyle: any = { background: "#fff", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" };
const logoStyle: any = { fontSize: "16px", fontWeight: "bold", color:'#3B82F6' };
const searchStyle: any = { flex: 1, padding: "8px 14px", borderRadius: "20px", background: "#F3F4F6", border: "none", fontSize:'13px' };
const topTabBarStyle: any = { display: "flex", background: "#fff", borderBottom: "1px solid #eee" };
const topTabItemStyle: any = { flex: 1, textAlign: "center", padding: "12px 0", fontSize: "14px", color: "#999", cursor:'pointer' };
const topTabActiveStyle: any = { ...topTabItemStyle, color: "#3B82F6", fontWeight: "bold", borderBottom: "2px solid #3B82F6" };
const contentStyle: any = { height: "calc(100% - 140px)", overflowY: "auto" };
const listStyle: any = { padding: "15px" };
const cardStyle: any = { background: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "10px", boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const titleStyle: any = { fontSize: "16px", fontWeight: "bold" };
const infoStyle: any = { fontSize: "13px", color: "#666", marginTop:'4px' };
const tagStyle: any = { fontSize: "11px", color: "#fff", padding: "3px 8px", borderRadius: "8px", border: "none", marginTop: "8px" };
const emptyStyle: any = { textAlign:'center', color:'#999', padding:'40px 0' };

const bottomBarStyle: any = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee", zIndex: 1001 };
const bottomItemStyle: any = { fontSize: "12px", color: "#999", cursor:'pointer' };
const bottomActiveStyle: any = { ...bottomItemStyle, color: "#3B82F6", fontWeight:'bold' };
const bottomAddStyle: any = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer', transition:'0.3s' };

const modalStyle: any = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: any = { width: "320px", background: "#fff", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" };
const modalBtnStyle: any = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor:'pointer', fontWeight:'bold' };
const inputStyle: any = { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #eee', background:'#F9FAFB', fontSize:'14px' };

// 注入动画Keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
    @keyframes bounceUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `;
  document.head.appendChild(style);
}

// 其他页面样式（保持你代码中的定义...）
const coursePageStyle: any = { padding:'15px' };
// ...（此处省略你之前提供的冗长 CSS 样式代码，建议在实际项目中保持样式表完整）
