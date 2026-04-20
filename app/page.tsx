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
  id: number;
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
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [codingDemo, setCodingDemo] = useState(false);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

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

  const addInterview = () => {
    if (!selectedJob || !interviewDate) return;
    const newIt: Interview = { id: Date.now(), jobId: selectedJob.id, date: interviewDate, time: interviewTime, channel };
    saveInterviews([newIt, ...interviews]);
    setInterviewDate(""); setInterviewTime("");
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();
  const dayHasInterview = (date: string) => interviews.some(it => it.date === date);

  const handleSelectDay = (date: string) => {
    setSelectedDay(date);
    const found = interviews.find(it => it.date === date) || null;
    setCurrentInterview(found);
  };

  // --- 真实录音与语音识别逻辑 ---
  const startRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("当前浏览器不支持录音转文字，请尝试 Chrome。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setRecording(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      
      // 更新数据
      const updated = interviews.map(it => 
        it.date === selectedDay ? { ...it, transcript: finalTranscript } : it
      );
      saveInterviews(updated);
      if (currentInterview) setCurrentInterview({ ...currentInterview, transcript: finalTranscript });
    };

    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognition.start();
    // 15秒后自动停止，你可以根据需要调整
    setTimeout(() => { recognition.stop(); }, 15000);
  };

  const goToReport = () => {
    setReport("【AI复盘报告】\n1. 技术深度：您在回答中提到了多个核心概念，逻辑清晰。\n2. 改进建议：建议在解释异步编程时多结合实际业务场景。\n3. 预测：该轮面试通过概率较高。");
    setTopTab("复盘");
  };

  return (
    <div style={appContainer}>
      <div style={headerStyle}>
        <div style={logoStyle}>{bottomTab === "我的" ? "个人中心" : "求职助手 2026"}</div>
        {bottomTab !== "我的" && <input placeholder="搜索公司/岗位" style={searchStyle} />}
      </div>

      <div style={contentStyle}>
        {bottomTab === "首页" && (
          <>
            <div style={topTabBarStyle}>
              {["岗位", "面试", "复盘"].map((t) => (
                <div key={t} onClick={() => setTopTab(t as any)}
                  style={topTab === t ? topTabActiveStyle : topTabItemStyle}>{t}</div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div style={guideInPageStyle}>💡 提示：录入岗位后，点击状态即可快速排期面试并开启录音复盘。</div>
            )}

            {topTab === "岗位" && (
              <div style={listStyle}>
                {jobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={titleStyle}>{job.role}</div>
                    <div style={infoStyle}>{job.company} · {job.salary}</div>
                    <button onClick={() => { setTopTab("面试"); setSelectedJob(job); }} style={{ ...tagStyle, backgroundColor: "#3B82F6", border:'none', cursor:'pointer' }}>
                      {job.status} (点击排期)
                    </button>
                  </div>
                ))}
              </div>
            )}

            {topTab === "面试" && (
              <div style={interviewPageStyle}>
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

                <div style={addFormCardStyle}>
                  <div style={sectionTitleStyle}>新增面试安排</div>
                  <select style={inputStyle} value={selectedJob?.id || ""} onChange={(e) => setSelectedJob(jobs.find(j => j.id === +e.target.value) || null)}>
                    <option value="">选择岗位</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.company}</option>)}
                  </select>
                  <input style={inputStyle} type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                  <input style={inputStyle} type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                  <button onClick={addInterview} style={submitBtnStyle}>提交安排</button>
                </div>

                {selectedDay && currentInterview && (
                  <div style={interviewDetailCardStyle}>
                    <div style={sectionTitleStyle}>面试详情 ({currentInterview.time})</div>
                    <button onClick={startRecord} style={recordBtnStyle} disabled={recording}>{recording ? "🔊 正在听..." : "🎙️ 开始录音"}</button>
                    <div style={transcriptCardStyle}>
                      <div style={subTitleStyle}>实时转写内容：</div>
                      <div style={transcriptTextStyle}>{currentInterview.transcript || "等待说话..."}</div>
                    </div>
                    {currentInterview.transcript && <button onClick={goToReport} style={reportBtnStyle}>去AI复盘</button>}
                  </div>
                )}
              </div>
            )}

            {topTab === "复盘" && (
              <div style={reportPageStyle}>
                <div style={aiBubbleStyle}>{report || "完成录音后点击复盘按钮生成报告"}</div>
              </div>
            )}
          </>
        )}

        {bottomTab === "课程" && (
          <div style={coursePageStyle}>
            <div style={courseGridStyle}>
              <div style={courseCardStyle}>📝<br/>笔试真题</div>
              <div style={courseCardStyle}>👥<br/>面试真题</div>
              <div style={courseCardStyle}>🎯<br/>专项练习</div>
              <div style={{...courseCardStyle, border:'1px solid #3B82F6'}} onClick={() => setCodingDemo(true)}>💻<br/>在线编程</div>
            </div>
            <div style={demoListStyle}>
               <div style={sectionTitleStyle}>热门 Demo</div>
               <div style={demoItemStyle}>🔥 2026 快手春招前端 A 卷</div>
               <div style={demoItemStyle}>🔥 字节跳动：后端研发模拟考</div>
            </div>
            {codingDemo && (
              <div style={editorOverlay}>
                <div style={problemFloatingCard}><b>两数之和</b> <span onClick={() => setCodingDemo(false)} style={{float:'right'}}>✕</span></div>
                <textarea style={editorArea} defaultValue="function twoSum(nums, target) {}" />
                <button onClick={() => setCodingDemo(false)} style={modalBtnStyle}>完成退出</button>
              </div>
            )}
          </div>
        )}

        {bottomTab === "社区" && (
          <div style={listStyle}>
            <div style={cardStyle}>
              <div style={{color:'#3B82F6', fontSize:'12px'}}>@职场小助手</div>
              <div style={titleStyle}>2026年春招避雷指南</div>
              <div style={infoStyle}>最近很多大厂HC都在释放，大家注意简历细节...</div>
            </div>
            <div style={cardStyle}>
              <div style={{color:'#3B82F6', fontSize:'12px'}}>@面试官老王</div>
              <div style={titleStyle}>说说我最近面试遇到的奇葩事</div>
              <div style={infoStyle}>有些同学的代码基础真的很薄弱，连闭包都说不清...</div>
            </div>
          </div>
        )}

        {bottomTab === "我的" && (
          <div style={profilePageStyle}>
            <div style={profileHeaderLight}>
              <div style={userInfoCard}>
                <div style={avatarStyleLight}>头像</div>
                <div style={{marginLeft:'15px'}}><div style={{fontSize:'18px', fontWeight:'bold'}}>教父Corleone</div></div>
              </div>
            </div>
            <div style={gridMenu}>
              {[{n:'收藏', i:'⭐'}, {n:'Offer', i:'📄'}, {n:'钱包', i:'💰'}, {n:'设置', i:'⚙️'}].map(item => (
                <div key={item.n} style={gridItem}><div style={gridIconPlaceholder}>{item.i}</div><div>{item.n}</div></div>
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
            <input style={inputStyle} placeholder="公司" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="岗位" value={role} onChange={e=>setRole(e.target.value)} />
            <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={addJob} style={modalBtnStyle}>保存</button>
          </div>
        </div>
      )}

      {showAddPop && (
        <div style={modalStyle} onClick={() => setShowAddPop(false)}>
          <div style={modalContentStyle} onClick={e=>e.stopPropagation()}>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>新建岗位</button>
            <button onClick={() => { setBottomTab("首页"); setTopTab("面试"); setShowAddPop(false); }} style={modalBtnStyle}>安排面试</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 样式定义 ---
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
const calendarCardStyle: CSSProperties = { background: '#fff', borderRadius: '15px', padding: '15px', marginBottom: '15px' };
const calendarHeaderStyle: CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px' };
const arrowStyle: CSSProperties = { color: '#3B82F6', cursor: 'pointer' };
const monthStyle: CSSProperties = { fontSize: '16px', fontWeight: 'bold' };
const weekBarStyle: CSSProperties = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', textAlign:'center', marginBottom:'10px', fontSize:'12px', color:'#999' };
const daysGridStyle: CSSProperties = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px' };
const dayStyle: CSSProperties = { height:'35px', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'13px', borderRadius:'8px' };
const dayActiveStyle: CSSProperties = { ...dayStyle, background:'#3B82F6', color:'#fff' };
const addFormCardStyle: CSSProperties = { background:'#fff', borderRadius:'15px', padding:'15px', marginBottom:'15px' };
const inputStyle: CSSProperties = { width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #eee' };
const submitBtnStyle: CSSProperties = { width:'100%', background:'#3B82F6', color:'#fff', border:'none', padding:'12px', borderRadius:'8px' };
const interviewDetailCardStyle: CSSProperties = { background:'#fff', borderRadius:'15px', padding:'15px' };
const recordBtnStyle: CSSProperties = { width:'100%', background:'#EF4444', color:'#fff', border:'none', padding:'10px', borderRadius:'8px', margin:'10px 0' };
const transcriptCardStyle: CSSProperties = { background:'#F9FAFB', padding:'10px', borderRadius:'8px' };
const transcriptTextStyle: CSSProperties = { fontSize:'13px', color:'#444' };
const subTitleStyle: CSSProperties = { fontSize:'11px', color:'#999' };
const reportBtnStyle: CSSProperties = { width:'100%', background:'#10B981', color:'#fff', border:'none', padding:'12px', borderRadius:'8px', marginTop:'10px' };
const coursePageStyle: CSSProperties = { padding:'15px' };
const courseGridStyle: CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' };
const courseCardStyle: CSSProperties = { background:'#fff', borderRadius:'15px', padding:'15px', textAlign:'center' };
const demoListStyle: CSSProperties = { marginTop:'15px' };
const demoItemStyle: CSSProperties = { background:'#fff', padding:'12px', borderRadius:'10px', marginBottom:'8px', fontSize:'13px' };
const editorOverlay: CSSProperties = { position:'absolute', inset:0, background:'#1e1e1e', color:'#fff', zIndex:100, padding:'20px', display:'flex', flexDirection:'column' };
const problemFloatingCard: CSSProperties = { background:'#333', padding:'10px', borderRadius:'8px', marginBottom:'10px' };
const editorArea: CSSProperties = { flex:1, background:'#252526', color:'#fff', padding:'15px', fontFamily:'monospace', border:'none' };
const modalBtnStyle: CSSProperties = { background:'#3B82F6', color:'#fff', padding:'10px', border:'none', borderRadius:'8px' };
const bottomBarStyle: CSSProperties = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: CSSProperties = { fontSize: "12px", color: "#999" };
const bottomActiveStyle: CSSProperties = { ...bottomItemStyle, color: "#3B82F6" };
const bottomAddStyle: CSSProperties = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center' };
const modalStyle: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: CSSProperties = { width: "300px", background: "#fff", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" };
const modalCloseStyle: CSSProperties = { alignSelf: "flex-end", background: "none", border: "none" };
const guideInPageStyle: CSSProperties = { background:'#EFF6FF', color:'#1D4ED8', padding:'10px', margin:'10px', borderRadius:'8px', fontSize:'12px' };
const reportPageStyle: CSSProperties = { padding:'20px' };
const aiBubbleStyle: CSSProperties = { background:'#3B82F6', color:'#fff', padding:'15px', borderRadius:'15px 15px 15px 0', fontSize:'14px' };
const profilePageStyle: CSSProperties = { background: "#fff", height: "100%" };
const profileHeaderLight: CSSProperties = { padding: "30px 20px" };
const userInfoCard: CSSProperties = { display: "flex", alignItems: "center" };
const avatarStyleLight: CSSProperties = { width: "50px", height: "50px", borderRadius: "25px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px" };
const gridMenu: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "10px" };
const gridItem: CSSProperties = { textAlign: "center", fontSize: "12px" };
const gridIconPlaceholder: CSSProperties = { fontSize: "20px", marginBottom: "5px" };
const weekTextStyle: CSSProperties = {};
