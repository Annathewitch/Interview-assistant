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
  const [codingDemo, setCodingDemo] = useState(false);
  const [courseTab, setCourseTab] = useState<'推荐' | '热门' | '学习' | '已购'>('推荐');

  // 初始化加载与引导触发
  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");
    setJobs(j);
    setInterviews(i);
    
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
          </>
        )}

        {bottomTab === "课程" && (
          <div style={coursePageStyle}>
            <div style={courseGridStyle}>
              <div style={courseCardStyle}><div style={courseIconStyle}>📝</div><div>笔试真题</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>👥</div><div>面试真题</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>🎯</div><div>专项练习</div></div>
              <div style={{...courseCardStyle, border:'1px solid #3B82F6'}} onClick={() => setCodingDemo(true)}>
                <div style={courseIconStyle}>💻</div><div>在线编程</div>
              </div>
            </div>

            <div style={adBannerStyle}>
              <div style={adBannerContent}>
                <div style={adBannerTitle}>🚀 限时特惠！面试突击班</div>
                <div style={adBannerSubtitle}>2026春招冲刺 | 名企导师1v1指导</div>
                <div style={adBannerPrice}>原价¥1999 <span style={{color:'#DC2626', fontSize:'18px', fontWeight:'bold'}}>现价¥999</span></div>
                <div style={adBannerButton}>立即抢购</div>
              </div>
            </div>

            <div style={courseNavStyle}>
              {(['推荐', '热门', '学习', '已购'] as const).map(tab => (
                <div key={tab} onClick={() => setCourseTab(tab)} style={courseTab === tab ? courseNavActiveStyle : courseNavItemStyle}>{tab}</div>
              ))}
            </div>

            <div style={courseContentStyle}>
              {courseTab === '推荐' && (
                <div style={demoListStyle}>
                  <div style={sectionTitleStyle}>2026 春招实时练习</div>
                  {["2026年快手春招笔试真题（前端A卷）", "2026年腾讯暑期实习：产品综合素质测评", "字节跳动：后端研发 2026 第一场笔试模拟"].map(item => (
                    <div key={item} style={demoItemStyle}>🔥 {item}</div>
                  ))}
                </div>
              )}
              {courseTab === '热门' && (
                <div style={demoListStyle}>
                  <div style={sectionTitleStyle}>热门课程排行榜</div>
                  {[{ title: "🔥 大厂算法突击班", students: "2.3万人在学" }].map((course, index) => (
                    <div key={index} style={hotCourseItemStyle}>
                      <div style={{fontWeight:'bold', fontSize:'14px'}}>{course.title}</div>
                      <div style={{fontSize:'12px', color:'#666'}}>{course.students}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {codingDemo && (
              <div style={editorOverlay}>
                <div style={problemFloatingCard}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><b>题目：两数之和</b><span onClick={() => setCodingDemo(false)} style={{cursor:'pointer'}}>✕</span></div>
                </div>
                <textarea style={editorArea} defaultValue={"var twoSum = function(nums, target) {};"} />
                <button onClick={() => setCodingDemo(false)} style={modalBtnStyle}>保存并退出</button>
              </div>
            )}
          </div>
        )}

        {bottomTab === "社区" && (
          <div style={listStyle}>
            <div style={sectionTitleStyle}>2026 求职社区广场</div>
            {[{u:"职场萌新", t:"2026年春招感觉比去年还卷", c:"投了20家，只有3个面试。"}].map((post, i) => (
              <div key={i} style={cardStyle}>
                <div style={{fontSize:'12px', color:'#3B82F6'}}>@{post.u}</div>
                <div style={{fontWeight:'bold', margin:'5px 0'}}>{post.t}</div>
                <div style={{fontSize:'13px', color:'#666'}}>{post.c}</div>
              </div>
            ))}
          </div>
        )}

        {bottomTab === "我的" && (
          <div style={profilePageStyle}>
            <div style={profileHeaderLight}>
              <div style={userInfoCard}>
                <div style={avatarStyleLight}>头像</div>
                <div style={{marginLeft:'15px'}}>
                  <div style={{fontSize:'18px', fontWeight:'bold'}}>教父Corleone &gt;</div>
                </div>
              </div>
            </div>
            <div style={gridMenu}>
              {[{n:'我的收藏', i:'⭐'}, {n:'我的offer', i:'📄'}, {n:'学习历史', i:'🕒'}].map(item => (
                <div key={item.n} style={gridItem}>
                  <div style={gridIconPlaceholder}>{item.i}</div>
                  <div style={{fontSize:'12px', marginTop:'8px'}}>{item.n}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={bottomBarStyle}>
        <div onClick={() => setBottomTab("首页")} style={bottomTab === "首页" ? bottomActiveStyle : bottomItemStyle}>首页</div>
        <div onClick={() => setBottomTab("课程")} style={bottomTab === "课程" ? bottomActiveStyle : bottomItemStyle}>课程</div>
        <div onClick={() => setShowAddPop(true)} style={{...bottomAddStyle, zIndex: guideStep === 1 ? 1001 : 1, boxShadow: guideStep === 1 ? '0 0 0 9999px rgba(0,0,0,0.8), 0 0 20px #fff' : 'none'}}>+</div>
        <div onClick={() => setBottomTab("社区")} style={bottomTab === "社区" ? bottomActiveStyle : bottomItemStyle}>社区</div>
        <div onClick={() => setBottomTab("我的")} style={bottomTab === "我的" ? bottomActiveStyle : bottomItemStyle}>我的</div>
      </div>

      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div style={{display:'flex', justifyContent:'space-between'}}><b>录入新岗位</b><span onClick={()=>setShowJobForm(false)}>✕</span></div>
            <input style={inputStyle} placeholder="公司名称" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="招聘岗位" value={role} onChange={e=>setRole(e.target.value)} />
            <button onClick={addJob} style={modalBtnStyle}>确认添加</button>
          </div>
        </div>
      )}

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

// --- 样式定义 (修复重复声明并补全缺失样式) ---
const appContainer: any = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "30px", overflow: "hidden", position: "relative", border:'8px solid #333', fontFamily:'sans-serif' };
const guideOverlay: any = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, pointerEvents: 'none' };
const guideBox: any = { position:'absolute', bottom:'100px', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', color:'#fff', padding:'20px' };
const guideText: any = { fontSize:'18px', fontWeight:'bold', textAlign:'center', marginBottom:'15px' };
const guideArrowDown: any = { fontSize:'30px', animation:'bounce 1s infinite' };
const guideArrowUp: any = { fontSize:'30px', animation:'bounceUp 1s infinite' };
const guideSkipBtn: any = { marginTop:'20px', background:'rgba(255,255,255,0.2)', border:'1px solid #fff', color:'#fff', padding:'5px 15px', borderRadius:'15px', pointerEvents:'auto' };

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

const bottomBarStyle: any = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: any = { fontSize: "12px", color: "#999", cursor:'pointer' };
const bottomActiveStyle: any = { ...bottomItemStyle, color: "#3B82F6", fontWeight:'bold' };
const bottomAddStyle: any = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer' };

const modalStyle: any = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: any = { width: "300px", background: "#fff", borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", gap: "15px" };
const modalBtnStyle: any = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor:'pointer', fontWeight:'bold' };
const inputStyle: any = { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #eee' };

// 补全缺失的课程/社区/我的样式
const coursePageStyle: any = { padding:'15px' };
const courseGridStyle: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' };
const courseCardStyle: any = { background:'#fff', padding:'20px', borderRadius:'15px', textAlign:'center' };
const courseIconStyle: any = { fontSize:'24px', marginBottom:'8px' };
const adBannerStyle: any = { background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: '15px', padding: '20px', color: '#fff', margin: '20px 0' };
const adBannerContent: any = { display: 'flex', flexDirection: 'column', gap: '8px' };
const adBannerTitle: any = { fontWeight: 'bold', fontSize: '16px' };
const adBannerSubtitle: any = { fontSize: '12px', opacity: 0.9 };
const adBannerPrice: any = { fontSize: '14px' };
const adBannerButton: any = { background: '#fff', color: '#3B82F6', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', marginTop: '5px' };
const courseNavStyle: any = { display: 'flex', gap: '20px', margin: '20px 0', borderBottom: '1px solid #eee' };
const courseNavItemStyle: any = { paddingBottom: '10px', color: '#999', fontSize: '14px' };
const courseNavActiveStyle: any = { ...courseNavItemStyle, color: '#3B82F6', borderBottom: '2px solid #3B82F6', fontWeight: 'bold' };
const courseContentStyle: any = { paddingBottom: '20px' };
const demoListStyle: any = { display: 'flex', flexDirection: 'column', gap: '10px' };
const sectionTitleStyle: any = { fontSize: '16px', fontWeight: 'bold', margin: '10px 0' };
const demoItemStyle: any = { background: '#fff', padding: '15px', borderRadius: '10px', fontSize: '14px' };
const hotCourseItemStyle: any = { background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '10px' };
const editorOverlay: any = { position:'absolute', inset:0, background:'#1e1e1e', color:'#fff', zIndex:100, padding:'20px', display:'flex', flexDirection:'column' };
const problemFloatingCard: any = { background:'#333', padding:'15px', borderRadius:'12px', marginBottom:'15px' };
const editorArea: any = { flex:1, background:'#252526', color:'#fff', padding:'15px', fontFamily:'monospace', borderRadius:'8px', marginBottom: '10px' };
const profilePageStyle: any = { background: "#fff", height: "100%" };
const profileHeaderLight: any = { padding: "30px 20px" };
const userInfoCard: any = { display: "flex", alignItems: "center" };
const avatarStyleLight: any = { width: "50px", height: "50px", borderRadius: "25px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center" };
const gridMenu: any = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "20px 10px", gap:'15px' };
const gridItem: any = { textAlign: "center" };
const gridIconPlaceholder: any = { fontSize: "22px" };

// 注入动画
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
    @keyframes bounceUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `;
  document.head.appendChild(style);
}
