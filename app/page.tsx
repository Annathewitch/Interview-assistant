"use client";

import { useState, useEffect, CSSProperties } from "react";

// --- 类型定义 ---
type Job = {
  id: number;
  company: string;
  role: string;
  salary: string;
  location: string;
  status: string;
};

type Interview = {
  id: number; // 必须有 ID
  jobId: number;
  date: string;
  time: string;
  channel: string;
  transcript?: string;
};

const STATUS = ["刚投递", "已测评", "一面", "二面", "三面", "HR面", "Offer", "已挂"];

export default function Page() {
  const [bottomTab, setBottomTab] = useState("首页");
  const [topTab, setTopTab] = useState<"岗位" | "面试" | "复盘">("岗位");
  
  // 核心数据状态
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [codingDemo, setCodingDemo] = useState(false);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  // 表单状态
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  // 面试日历逻辑
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [channel, setChannel] = useState("腾讯会议");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState("");

  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");
    setJobs(j);
    setInterviews(i);
  }, []);

  const saveJobs = (data: Job[]) => { setJobs(data); localStorage.setItem("jobs", JSON.stringify(data)); };
  const saveInterviews = (data: Interview[]) => { setInterviews(data); localStorage.setItem("interviews", JSON.stringify(data)); };

  const addJob = () => {
    if (!company || !role) return;
    const newJob: Job = { id: Date.now(), company, role, salary, location, status };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany(""); setRole(""); setSalary(""); setLocation(""); setStatus("刚投递");
  };

  // 修复后的添加面试逻辑
  const addInterview = () => {
    if (!selectedJob || !interviewDate) return;
    const newIt: Interview = { 
      id: Date.now(), // 修复编译错误：补全 ID
      jobId: selectedJob.id, 
      date: interviewDate, 
      time: interviewTime, 
      channel 
    };
    saveInterviews([newIt, ...interviews]);
    setInterviewDate(""); setInterviewTime("");
  };

  // 日历助手函数
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();
  const dayHasInterview = (date: string) => interviews.some(it => it.date === date);

  const handleSelectDay = (date: string) => {
    setSelectedDay(date);
    setCurrentInterview(interviews.find(it => it.date === date) || null);
  };

  const startRecord = () => {
    setRecording(true);
    setTimeout(() => {
      const updated = interviews.map(it => it.date === selectedDay ? { ...it, transcript: "面试官：请先做下自我介绍。\n候选人：好的，我是一名具有3年经验的前端开发，熟悉 React 和 Next.js..." } : it);
      saveInterviews(updated);
      setRecording(false);
    }, 2000);
  };

  const goToReport = () => {
    setReport("【AI复盘报告 - 2026版】\n1. 表现评估：逻辑清晰，技术基础扎实。\n2. 改进点：在谈到分布式架构时，细节支撑略显不足。\n3. 下一步建议：重点复习 CAP 理论及其实际应用场景。");
    setTopTab("复盘");
  };

  return (
    <div style={appContainer}>
      <div style={headerStyle}>
        <div style={logoStyle}>{bottomTab === "我的" ? "个人中心" : "求职助手 2026"}</div>
        {bottomTab !== "我的" && <input placeholder="搜索公司/岗位" style={searchStyle} />}
      </div>

      <div style={contentStyle}>
        {/* 首页 */}
        {bottomTab === "首页" && (
          <>
            <div style={topTabBarStyle}>
              {["岗位", "面试", "复盘"].map((t) => (
                <div key={t} onClick={() => setTopTab(t as any)}
                  style={topTab === t ? topTabActiveStyle : topTabItemStyle}>{t}</div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div style={guideInPageStyle}>💡 操作指引：点击下方“+”记录新岗位，在岗位卡片上点击“状态”可直接排期面试。</div>
            )}

            {topTab === "岗位" && (
              <div style={listStyle}>
                {jobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={titleStyle}>{job.role}</div>
                    <div style={infoStyle}>{job.company} · {job.salary}</div>
                    <div style={{fontSize:'12px', color:'#999'}}>{job.location}</div>
                    <button 
                      onClick={() => { setTopTab("面试"); setSelectedJob(job); }}
                      style={{ ...tagStyle, backgroundColor: "#3B82F6", cursor:'pointer', border:'none' }}
                    >
                      {job.status} (点击排期)
                    </button>
                  </div>
                ))}
              </div>
            )}

            {topTab === "面试" && (
              <div style={interviewPageStyle}>
                {/* 2026年日历逻辑 */}
                <div style={calendarCardStyle}>
                  <div style={calendarHeaderStyle}>
                    <div onClick={() => { if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear-1); } else setCurrentMonth(currentMonth-1); }} style={arrowStyle}>◀</div>
                    <div style={monthStyle}>{currentYear}年{currentMonth}月</div>
                    <div onClick={() => { if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear+1); } else setCurrentMonth(currentMonth+1); }} style={arrowStyle}>▶</div>
                  </div>
                  <div style={weekBarStyle}>
                    {["日", "一", "二", "三", "四", "五", "六"].map(d => <div key={d} style={weekTextStyle}>{d}</div>)}
                  </div>
                  <div style={daysGridStyle}>
                    {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, i) => <div key={i} style={dayStyle}></div>)}
                    {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => {
                      const d = (i + 1).toString().padStart(2, "0");
                      const m = currentMonth.toString().padStart(2, "0");
                      const date = `${currentYear}-${m}-${d}`;
                      return <div key={date} onClick={() => handleSelectDay(date)} style={dayHasInterview(date) ? dayActiveStyle : (selectedDay === date ? { ...dayStyle, border:'1px solid #3B82F6'} : dayStyle)}>{i+1}</div>
                    })}
                  </div>
                </div>

                {/* 新增面试安排 */}
                <div style={addFormCardStyle}>
                  <div style={sectionTitleStyle}>新增面试安排</div>
                  <select style={inputStyle} value={selectedJob?.id || ""} onChange={(e) => setSelectedJob(jobs.find(j => j.id === +e.target.value) || null)}>
                    <option value="">请选择岗位</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.company} - {j.role}</option>)}
                  </select>
                  <input style={inputStyle} type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                  <input style={inputStyle} type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                  <select style={inputStyle} value={channel} onChange={(e) => setChannel(e.target.value)}>
                    <option>腾讯会议</option><option>飞书会议</option><option>线下面试</option><option>电话面试</option>
                  </select>
                  <button onClick={addInterview} style={submitBtnStyle}>提交面试安排</button>
                </div>

                {/* 面试详情与录音 */}
                {selectedDay && currentInterview && (
                  <div style={interviewDetailCardStyle}>
                    <div style={sectionTitleStyle}>面试详情</div>
                    <div style={detailTextStyle}>公司：{jobs.find(j => j.id === currentInterview.jobId)?.company}</div>
                    <div style={detailTextStyle}>时间：{currentInterview.date} {currentInterview.time}</div>
                    <button onClick={startRecord} style={recordBtnStyle} disabled={recording}>{recording ? "🔴 录音中..." : "🎙️ 开始录音"}</button>
                    <div style={transcriptCardStyle}>
                      <div style={subTitleStyle}>转写预览：</div>
                      <div style={transcriptTextStyle}>{currentInterview.transcript || "等待录音..."}</div>
                    </div>
                    {currentInterview.transcript && <button onClick={goToReport} style={reportBtnStyle}>一键AI复盘</button>}
                  </div>
                )}
              </div>
            )}

            {topTab === "复盘" && (
              <div style={reportPageStyle}>
                <div style={aiBubbleStyle}>{report || "完成面试录音后，点击“一键AI复盘”查看详细评估报告。"}</div>
                {report && (
                   <div style={{marginTop:'20px'}}>
                      <div style={sectionTitleStyle}>Demo：推荐练习题</div>
                      <div style={cardStyle}>根据本次面试表现，建议练习：<b>“LRU 缓存机制实现”</b></div>
                   </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 课程页面 */}
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

            <div style={demoListStyle}>
              <div style={sectionTitleStyle}>2026 春招实时练习</div>
              {[
                "2026年快手春招笔试真题（前端A卷）",
                "2026年腾讯暑期实习：产品综合素质测评",
                "字节跳动：后端研发 2026 第一场笔试模拟",
                "阿里巴巴：2026 校园招聘技术面经精选",
                "专项：计算机网络高频 50 题挑战"
              ].map(item => (
                <div key={item} style={demoItemStyle}>🔥 {item}</div>
              ))}
            </div>

            {codingDemo && (
              <div style={editorOverlay}>
                <div style={problemFloatingCard}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><b>题目：两数之和</b><span onClick={() => setCodingDemo(false)}>✕</span></div>
                  <p style={{fontSize:'12px', marginTop:'5px'}}>2026 字节跳动高频题：给定一个整数数组 nums 和目标值 target...</p>
                </div>
                <textarea style={editorArea} defaultValue="/**\n * @param {number[]} nums\n * @param {number} target\n */\nvar twoSum = function(nums, target) {\n    \n};" />
                <button onClick={() => setCodingDemo(false)} style={modalBtnStyle}>保存并退出</button>
              </div>
            )}
          </div>
        )}

        {/* 社区页面 */}
        {bottomTab === "社区" && (
          <div style={listStyle}>
            <div style={sectionTitleStyle}>2026 求职社区广场</div>
            {[
              {u:"职场萌新", t:"2026年春招感觉比去年还卷，大家投了几家了？", c:"目前投了20家，只有3个面试，坐标上海。"},
              {u:"Offer收割机", t:"美团2026届校招面经分享", c:"一共三轮技术面+一轮HR面，主要考察工程能力。"},
              {u:"面试官阿强", t:"给2026届同学的几个建议", c:"现在更看重基础，不要只盯着框架看。"},
              {u:"快手打工人", t:"快手春招内推直通车，欢迎私信！", c:"部门直招，HC多多，欢迎各位优秀学子。"}
            ].map((post, i) => (
              <div key={i} style={cardStyle}>
                <div style={{fontSize:'12px', color:'#3B82F6'}}>@{post.u}</div>
                <div style={{fontWeight:'bold', margin:'5px 0'}}>{post.t}</div>
                <div style={{fontSize:'13px', color:'#666'}}>{post.c}</div>
              </div>
            ))}
          </div>
        )}

        {/* 我的页面 */}
        {bottomTab === "我的" && (
          <div style={profilePageStyle}>
            <div style={profileHeaderLight}>
              <div style={userInfoCard}>
                <div style={avatarStyleLight}>头像</div>
                <div style={{marginLeft:'15px'}}>
                  <div style={{fontSize:'18px', fontWeight:'bold'}}>教父Corleone &gt;</div>
                  <div style={{fontSize:'12px', color:'#999', marginTop:'4px'}}>0 粉丝 · 5 关注 · 2 动态</div>
                </div>
              </div>
            </div>
            <div style={levelCard}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'8px'}}>
                <span style={{color:'#999', fontSize:'11px'}}>570成长值</span><span style={{color:'#999'}}>等级中心 &gt;</span>
              </div>
              <div style={progressBarBg}><div style={{...progressBarFill, width:'45%'}}></div></div>
              <span style={xTag}>x1.0</span>
            </div>
            <div style={gridMenu}>
              {[{n:'我的收藏', i:'⭐'}, {n:'我的offer', i:'📄'}, {n:'学习历史', i:'🕒'}, {n:'购物车', i:'🛒'}, {n:'我的钱包', i:'💰'}, {n:'优惠券', i:'🎫'}, {n:'购买记录', i:'🧾'}, {n:'面小助课程', i:'🎓'}].map(item => (
                <div key={item.n} style={gridItem}><div style={gridIconPlaceholder}>{item.i}</div><div style={{fontSize:'12px', marginTop:'8px'}}>{item.n}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={bottomBarStyle}>
        {["首页", "课程", "+", "社区", "我的"].map((tab) => (
          tab === "+" ? 
          <div key={tab} onClick={() => setShowAddPop(true)} style={bottomAddStyle}>+</div> :
          <div key={tab} onClick={() => setBottomTab(tab)} style={bottomTab === tab ? bottomActiveStyle : bottomItemStyle}>{tab}</div>
        ))}
      </div>

      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={modalCloseStyle} onClick={() => setShowJobForm(false)}>✕</button>
            <h3 style={{margin:0}}>新建投递岗位</h3>
            <input style={inputStyle} placeholder="公司名称" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="岗位名称" value={role} onChange={e=>setRole(e.target.value)} />
            <input style={inputStyle} placeholder="薪资 (例如: 20-30k)" value={salary} onChange={e=>setSalary(e.target.value)} />
            <input style={inputStyle} placeholder="Base 地 (例如: 北京)" value={location} onChange={e=>setLocation(e.target.value)} />
            <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={addJob} style={modalBtnStyle}>确认添加</button>
          </div>
        </div>
      )}

      {showAddPop && (
        <div style={modalStyle} onClick={() => setShowAddPop(false)}>
          <div style={modalContentStyle} onClick={e=>e.stopPropagation()}>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>记录新岗位</button>
            <button onClick={() => { setBottomTab("首页"); setTopTab("面试"); setShowAddPop(false); }} style={modalBtnStyle}>安排新面试</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 样式对象 (与之前保持一致) ---
const appContainer: CSSProperties = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "30px", overflow: "hidden", position: "relative", border:'8px solid #333' };
const headerStyle: CSSProperties = { background: "#fff", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" };
const logoStyle: CSSProperties = { fontSize: "16px", fontWeight: "bold" };
const searchStyle: CSSProperties = { flex: 1, padding: "8px 14px", borderRadius: "20px", background: "#F3F4F6", border: "none" };
const topTabBarStyle: CSSProperties = { display: "flex", background: "#fff", borderBottom: "1px solid #eee" };
const topTabItemStyle: CSSProperties = { flex: 1, textAlign: "center", padding: "12px 0", fontSize: "14px", color: "#999" };
const topTabActiveStyle: CSSProperties = { ...topTabItemStyle, color: "#3B82F6", fontWeight: "bold", borderBottom: "2px solid #3B82F6" };
const contentStyle: CSSProperties = { height: "calc(100% - 150px)", overflowY: "auto" };
const listStyle: CSSProperties = { padding: "15px" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "10px", boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const titleStyle: CSSProperties = { fontSize: "16px", fontWeight: "bold" };
const infoStyle: CSSProperties = { fontSize: "13px", color: "#666", marginTop:'4px' };
const tagStyle: CSSProperties = { fontSize: "11px", color: "#fff", padding: "3px 8px", borderRadius: "8px", border: "none", marginTop: "8px" };
const sectionTitleStyle: CSSProperties = { fontSize: "15px", fontWeight: "bold", margin: "10px 0" };
const interviewPageStyle: CSSProperties = { padding: '15px' };
const calendarCardStyle: CSSProperties = { background: '#fff', borderRadius: '15px', padding: '15px', marginBottom: '15px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' };
const calendarHeaderStyle: CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px' };
const arrowStyle: CSSProperties = { padding: '5px 10px', color: '#3B82F6', cursor: 'pointer' };
const monthStyle: CSSProperties = { fontSize: '16px', fontWeight: 'bold' };
const weekBarStyle: CSSProperties = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', textAlign:'center', marginBottom:'10px' };
const weekTextStyle: CSSProperties = { fontSize:'12px', color:'#999' };
const daysGridStyle: CSSProperties = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px' };
const dayStyle: CSSProperties = { height:'35px', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'13px', borderRadius:'8px' };
const dayActiveStyle: CSSProperties = { ...dayStyle, background:'#3B82F6', color:'#fff', fontWeight:'bold' };
const addFormCardStyle: CSSProperties = { background:'#fff', borderRadius:'15px', padding:'15px', marginBottom:'15px' };
const inputStyle: CSSProperties = { width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #eee', outline:'none' };
const submitBtnStyle: CSSProperties = { width:'100%', background:'#3B82F6', color:'#fff', border:'none', padding:'12px', borderRadius:'8px', fontWeight:'bold' };
const interviewDetailCardStyle: CSSProperties = { background:'#fff', borderRadius:'15px', padding:'15px' };
const detailTextStyle: CSSProperties = { fontSize:'14px', margin:'5px 0' };
const recordBtnStyle: CSSProperties = { width:'100%', background:'#EF4444', color:'#fff', border:'none', padding:'10px', borderRadius:'8px', margin:'10px 0' };
const transcriptCardStyle: CSSProperties = { background:'#F9FAFB', padding:'10px', borderRadius:'8px', marginTop:'10px' };
const subTitleStyle: CSSProperties = { fontSize:'12px', color:'#999', marginBottom:'5px' };
const transcriptTextStyle: CSSProperties = { fontSize:'13px', lineHeight:'1.6', color:'#444' };
const reportBtnStyle: CSSProperties = { width:'100%', background:'#10B981', color:'#fff', border:'none', padding:'12px', borderRadius:'8px', marginTop:'10px', fontWeight:'bold' };
const coursePageStyle: CSSProperties = { padding:'15px' };
const courseGridStyle: CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' };
const courseCardStyle: CSSProperties = { background:'#fff', borderRadius:'15px', padding:'20px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' };
const courseIconStyle: CSSProperties = { fontSize:'28px', marginBottom:'8px' };
const demoListStyle: CSSProperties = { marginTop:'20px' };
const demoItemStyle: CSSProperties = { background:'#fff', padding:'15px', borderRadius:'12px', marginBottom:'8px', border:'1px solid #eee', fontSize:'13px' };
const reportPageStyle: CSSProperties = { padding:'20px' };
const aiBubbleStyle: CSSProperties = { background:'#3B82F6', color:'#fff', padding:'15px', borderRadius:'15px 15px 15px 0', fontSize:'14px', lineHeight:'1.6', whiteSpace:'pre-wrap' };
const editorOverlay: CSSProperties = { position:'absolute', inset:0, background:'#1e1e1e', color:'#fff', zIndex:100, padding:'20px', display:'flex', flexDirection:'column' };
const problemFloatingCard: CSSProperties = { background:'#333', padding:'15px', borderRadius:'12px', marginBottom:'15px' };
const editorArea: CSSProperties = { flex:1, background:'#252526', color:'#d4d4d4', padding:'15px', fontFamily:'monospace', border:'none', outline:'none', borderRadius:'12px', lineHeight:1.6 };
const profilePageStyle: CSSProperties = { background: "#fff", height: "100%" };
const profileHeaderLight: CSSProperties = { padding: "30px 20px 10px" };
const userInfoCard: CSSProperties = { display: "flex", alignItems: "center" };
const avatarStyleLight: CSSProperties = { width: "60px", height: "60px", borderRadius: "30px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "12px" };
const levelCard: CSSProperties = { margin: "15px", background: "#fff", borderRadius: "12px", padding: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" };
const progressBarBg: CSSProperties = { height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" };
const progressBarFill: CSSProperties = { height: "100%", background: "#3B82F6" };
const xTag: CSSProperties = { fontSize: "10px", color: "#fff", background: "#3B82F6", padding: "2px 6px", borderRadius: "10px", marginTop: "5px", display: "inline-block" };
const gridMenu: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "10px" };
const gridItem: CSSProperties = { textAlign: "center", padding: "15px 5px" };
const gridIconPlaceholder: CSSProperties = { width: "40px", height: "40px", background: "#f9f9f9", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", borderRadius:'8px', border:'1px solid #eee' };
const bottomBarStyle: CSSProperties = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: CSSProperties = { fontSize: "12px", color: "#999" };
const bottomActiveStyle: CSSProperties = { ...bottomItemStyle, color: "#3B82F6", fontWeight: 'bold' };
const bottomAddStyle: CSSProperties = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center' };
const guideInPageStyle: CSSProperties = { background:'#EFF6FF', color:'#1D4ED8', padding:'10px 15px', margin:'10px 15px', borderRadius:'10px', fontSize:'12px', border:'1px solid #BFDBFE' };
const modalStyle: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: CSSProperties = { width: "320px", background: "#fff", borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", gap: "15px" };
const modalCloseStyle: CSSProperties = { alignSelf: "flex-end", background: "none", border: "none", fontSize: "18px" };
const modalBtnStyle: CSSProperties = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold" };
