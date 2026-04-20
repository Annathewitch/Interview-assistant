"use client";
import { useState, useEffect, useRef } from "react";

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
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  
  // 表单状态
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  // 面试与录音状态
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [channel, setChannel] = useState("腾讯会议");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [realTimeTranscript, setRealTimeTranscript] = useState("");

  // 使用 ref 解决录音回调中的闭包问题
  const transcriptRef = useRef("");
  const durationRef = useRef(0);

  const [codingDemo, setCodingDemo] = useState(false);
  const [courseTab, setCourseTab] = useState<'推荐' | '热门' | '学习' | '已购'>('推荐');

  // 本地存储初始化
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
    const newJob: Job = { id: Date.now(), company, role, salary: salary || "薪资面议", location: location || "远程/待定", status };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany(""); setRole(""); setSalary(""); setLocation(""); setStatus("刚投递");
  };

  // 1. 确认排期并立即激活高亮
  const addInterview = () => {
    if (!selectedJob || !interviewDate || !interviewTime) return;
    const newInterview: Interview = { 
      id: Date.now(), 
      jobId: selectedJob.id, 
      date: interviewDate, 
      time: interviewTime, 
      channel,
      transcript: "" 
    };
    const updated = [newInterview, ...interviews];
    saveInterviews(updated);
    
    // 立即选中当天并显示详情
    setSelectedDay(interviewDate);
    setCurrentInterview(newInterview);
    
    setInterviewDate(""); setInterviewTime("");
  };

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    const found = interviews.find(it => it.date === day) || null;
    setCurrentInterview(found);
    setRealTimeTranscript(""); // 切换日期重置临时文字
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!currentInterview) return;
    setRecording(true); 
    setAudioChunks([]); 
    setRecordingTime(0); 
    setRealTimeTranscript("");
    transcriptRef.current = "";
    durationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 使用 Ref 中的最新值进行保存
        const finalTranscript = transcriptRef.current || "未检测到语音内容";
        const finalDuration = durationRef.current;

        const updated = interviews.map(it => 
          it.id === currentInterview.id 
          ? { ...it, transcript: finalTranscript, audioBlobUrl: audioUrl, recordingDuration: finalDuration } 
          : it
        );
        
        saveInterviews(updated);
        setCurrentInterview(prev => prev ? { ...prev, transcript: finalTranscript, audioBlobUrl: audioUrl, recordingDuration: finalDuration } : null);
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      
      const timer = setInterval(() => {
        setRecordingTime(v => {
          durationRef.current = v + 1;
          return v + 1;
        });
      }, 1000);
      window.recordingTimer = { current: timer };
      startSpeechRecognition();
    } catch (e) { 
      console.error(e); 
      setRecording(false); 
      alert("请检查麦克风权限");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) { mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t => t.stop()); }
    stopSpeechRecognition();
    setRecording(false);
    if (window.recordingTimer?.current) { clearInterval(window.recordingTimer.current); delete window.recordingTimer; }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; recognition.continuous = true; recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) { text += event.results[i][0].transcript; }
      setRealTimeTranscript(text);
      transcriptRef.current = text; // 同步到 Ref
    };
    recognition.start();
    window.currentRecognition = recognition;
  };

  const stopSpeechRecognition = () => {
    if (window.currentRecognition) { window.currentRecognition.stop(); delete window.currentRecognition; }
  };

  // 一键生成复盘并跳转
  const goToReport = () => {
    if (!currentInterview) return;
    const jobInfo = jobs.find(j => j.id === currentInterview.jobId);
    const content = currentInterview.transcript || realTimeTranscript;
    
    setReport(`【2026 AI 深度面试复盘】\n公司：${jobInfo?.company}\n岗位：${jobInfo?.role}\n\n内容摘要：${content?.substring(0, 100)}...\n\nAI 建议：本次面试中你对项目难点的描述非常清晰。但在技术深度上，建议针对分布式架构的幂等性设计再做进一步准备。`);
    setTopTab("复盘");
  };

  return (
    <div style={appContainer}>
      <div style={headerStyle}>
        <div style={logoStyle}>求职助手 2026</div>
        <input placeholder="搜索公司/岗位" style={searchStyle} />
      </div>

      {bottomTab === "首页" && (
        <div style={topTabBarStyle}>
          {["岗位", "面试", "复盘"].map((t) => (
            <div key={t} onClick={() => setTopTab(t as any)}
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
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div style={titleStyle}>{job.role}</div>
                      <span style={{fontSize:'12px', color:'#3B82F6', fontWeight:'bold'}}>{job.salary}</span>
                    </div>
                    <div style={infoStyle}>{job.company} · {job.location}</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px'}}>
                      <button style={{ ...tagStyle, backgroundColor: "#EEF2FF", color: "#4F46E5", border:'1px solid #C7D2FE' }}>{job.status}</button>
                      <button onClick={() => { setSelectedJob(job); setTopTab("面试"); }} style={{ ...tagStyle, backgroundColor: "#3B82F6", color:'#fff', cursor:'pointer' }}>去排期</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topTab === "面试" && (
              <div style={interviewPageStyle}>
                <div style={calendarCardStyle}>
                  <div style={calendarHeaderStyle}>
                    <div onClick={() => setCurrentMonth(m => m === 1 ? 12 : m - 1)} style={arrowStyle}>◀</div>
                    <div style={monthStyle}>{currentYear}年{currentMonth}月</div>
                    <div onClick={() => setCurrentMonth(m => m === 12 ? 1 : m + 1)} style={arrowStyle}>▶</div>
                  </div>
                  <div style={daysGridStyle}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2,'0')}-${(i+1).toString().padStart(2,'0')}`;
                      const hasInterview = interviews.some(it => it.date === dateStr);
                      return (
                        <div key={dateStr} onClick={() => handleSelectDay(dateStr)} style={selectedDay === dateStr ? dayActiveStyle : dayStyle}>
                          {i+1}
                          {hasInterview && <div style={{width:'4px', height:'4px', background:'#10B981', borderRadius:'50%', position:'absolute', bottom:'2px'}}></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedDay && !currentInterview && (
                  <div style={interviewDetailCardStyle}>
                    <div style={sectionTitleStyle}>安排面试 - {selectedDay}</div>
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                      <select style={inputStyle} value={selectedJob?.id || ""} onChange={e => setSelectedJob(jobs.find(j=>j.id===Number(e.target.value)) || null)}>
                        <option value="">选择关联岗位</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.company}-{j.role}</option>)}
                      </select>
                      <input type="time" style={inputStyle} value={interviewTime} onChange={e=>setInterviewTime(e.target.value)} />
                      <input placeholder="面试渠道（如：腾讯会议）" style={inputStyle} value={channel} onChange={e=>setChannel(e.target.value)} />
                      <button onClick={addInterview} style={recordBtnStyle}>确认排期并开启详情</button>
                    </div>
                  </div>
                )}

                {selectedDay && currentInterview && (
                  <div style={interviewDetailCardStyle}>
                    <div style={sectionTitleStyle}>面试详情</div>
                    <div style={detailTextStyle}><b>公司：</b>{jobs.find(j => j.id === currentInterview.jobId)?.company}</div>
                    <div style={detailTextStyle}><b>时间：</b>{currentInterview.time}</div>
                    
                    <hr style={{margin:'15px 0', border:'none', borderTop:'1px solid #eee'}} />

                    {!recording ? (
                      <button onClick={startRecording} style={recordBtnStyle}>🎙️ 开始面试录音</button>
                    ) : (
                      <div style={recordingControlsStyle}>
                        <button onClick={stopRecording} style={stopRecordBtnStyle}>⏹️ 停止并保存</button>
                        <div style={recordingTimerStyle}>🔴 正在实时转录: {formatTime(recordingTime)}</div>
                      </div>
                    )}

                    <div style={transcriptCardStyle}>
                      <div style={{fontSize:'12px', color:'#999', marginBottom:'5px'}}>转文字内容：</div>
                      <div style={transcriptTextStyle}>{realTimeTranscript || currentInterview.transcript || "暂无录音记录"}</div>
                    </div>
                    
                    {!recording && (currentInterview.transcript || realTimeTranscript) && (
                      <button onClick={goToReport} style={reportBtnStyle}>🚀 AI 智能复盘报告</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {topTab === "复盘" && <div style={reportPageStyle}><div style={aiBubbleStyle}>{report || "请先在“面试”页面结束一段录音后点击 AI 复盘"}</div></div>}
          </>
        )}

        {/* --- 课程/社区/我的 保持原样 --- */}
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
               <div style={demoListStyle}>
                  {courseTab === '推荐' && ["2026年快手春招笔试真题", "2026年腾讯暑期实习测评"].map(item => <div key={item} style={demoItemStyle}>🔥 {item}</div>)}
                  {courseTab === '热门' && <div style={hotCourseItemStyle}><b>大厂算法突击班</b><div style={{fontSize:'12px', color:'#666'}}>2.3万人在学</div></div>}
               </div>
            </div>
          </div>
        )}

        {bottomTab === "社区" && (
          <div style={listStyle}>
            <div style={sectionTitleStyle}>2026 求职社区广场</div>
            {[{u:"职场萌新", t:"春招好卷", c:"投了20家，只有3个面试。"}].map((post, i) => (
              <div key={i} style={cardStyle}>
                <div style={{fontSize:'12px', color:'#3B82F6'}}>@{post.u}</div>
                <div style={{fontWeight:'bold'}}>{post.t}</div>
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
                <div style={{marginLeft:'15px'}}><div style={{fontSize:'18px', fontWeight:'bold'}}>教父Corleone &gt;</div></div>
              </div>
            </div>
            <div style={gridMenu}>
              {[{n:'我的收藏', i:'⭐'}, {n:'我的offer', i:'📄'}, {n:'简历中心', i:'📂'}].map(item => (
                <div key={item.n} style={gridItem}>
                  <div style={gridIconPlaceholder}>{item.i}</div>
                  <div style={{fontSize:'12px'}}>{item.n}</div>
                </div>
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

      {showAddPop && (
        <div style={modalStyle} onClick={() => setShowAddPop(false)}>
          <div style={modalContentStyle} onClick={e=>e.stopPropagation()}>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>📝 记录新岗位</button>
            <button onClick={() => { setTopTab("面试"); setShowAddPop(false); }} style={modalBtnStyle}>📅 安排面试排期</button>
          </div>
        </div>
      )}

      {showJobForm && (
        <div style={modalStyle}>
          <div style={{...modalContentStyle, width:'320px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <b style={{fontSize:'18px'}}>录入岗位详情</b>
              <button style={modalCloseStyle} onClick={() => setShowJobForm(false)}>✕</button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <input style={inputStyle} placeholder="公司名称" value={company} onChange={e=>setCompany(e.target.value)} />
              <input style={inputStyle} placeholder="招聘岗位" value={role} onChange={e=>setRole(e.target.value)} />
              <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={addJob} style={{...modalBtnStyle, marginTop:'10px'}}>确认保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 样式定义 (保持原样) ====================
const appContainer: any = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "30px", overflow: "hidden", position: "relative", border:'8px solid #333' };
const headerStyle: any = { background: "#fff", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" };
const logoStyle: any = { fontSize: "16px", fontWeight: "bold" };
const searchStyle: any = { flex: 1, padding: "8px 14px", borderRadius: "20px", background: "#F3F4F6", border: "none" };
const topTabBarStyle: any = { display: "flex", background: "#fff", borderBottom: "1px solid #eee" };
const topTabItemStyle: any = { flex: 1, textAlign: "center", padding: "12px 0", fontSize: "14px", color: "#999" };
const topTabActiveStyle: any = { ...topTabItemStyle, color: "#3B82F6", fontWeight: "bold", borderBottom: "2px solid #3B82F6" };
const contentStyle: any = { height: "calc(100% - 140px)", overflowY: "auto" };
const listStyle: any = { padding: "15px" };
const cardStyle: any = { background: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "10px", boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const titleStyle: any = { fontSize: "16px", fontWeight: "bold" };
const infoStyle: any = { fontSize: "13px", color: "#666", marginTop:'4px' };
const tagStyle: any = { fontSize: "11px", padding: "3px 8px", borderRadius: "8px", border: "none" };
const emptyStyle: any = { textAlign:'center', color:'#999', padding:'40px 0' };
const interviewPageStyle: any = { padding:'15px' };
const calendarCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px', marginBottom:'15px' };
const calendarHeaderStyle: any = { display:'flex', justifyContent:'space-between', marginBottom:'10px' };
const arrowStyle: any = { cursor:'pointer', color:'#3B82F6' };
const monthStyle: any = { fontWeight:'bold' };
const daysGridStyle: any = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px' };
const dayStyle: any = { height:'35px', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'13px', position:'relative', cursor:'pointer' };
const dayActiveStyle: any = { ...dayStyle, background:'#3B82F6', color:'#fff', borderRadius:'50%' };
const interviewDetailCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px' };
const sectionTitleStyle: any = { fontSize:'16px', fontWeight:'bold', margin:'10px 0' };
const detailTextStyle: any = { fontSize:'14px', color:'#333', marginBottom:'8px' };
const recordBtnStyle: any = { width:'100%', background:'#4F46E5', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', marginTop:'10px', fontWeight:'bold' };
const recordingControlsStyle: any = { marginTop:'10px' };
const stopRecordBtnStyle: any = { width:'100%', background:'#DC2626', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', fontWeight:'bold' };
const recordingTimerStyle: any = { textAlign:'center', fontSize:'12px', color:'#DC2626', marginTop:'5px' };
const transcriptCardStyle: any = { background:'#F3F4F6', padding:'15px', borderRadius:'12px', marginTop:'15px', minHeight:'100px' };
const transcriptTextStyle: any = { fontSize:'13px', lineHeight:'1.6', color:'#4B5563' };
const reportBtnStyle: any = { width:'100%', background:'#10B981', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', marginTop:'15px', fontWeight:'bold' };
const reportPageStyle: any = { padding:'20px' };
const aiBubbleStyle: any = { background:'#DBEAFE', padding:'20px', borderRadius:'15px', fontSize:'14px', whiteSpace:'pre-wrap' };
const coursePageStyle: any = { padding:'15px' };
const courseGridStyle: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' };
const courseCardStyle: any = { background:'#fff', padding:'20px', borderRadius:'15px', textAlign:'center', cursor:'pointer' };
const courseIconStyle: any = { fontSize:'24px', marginBottom:'8px' };
const adBannerStyle: any = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '15px', padding: '20px', margin: '20px 0', color: '#fff' };
const adBannerContent: any = { display:'flex', flexDirection:'column', gap:'5px' };
const adBannerTitle: any = { fontSize: '18px', fontWeight: 'bold' };
const adBannerSubtitle: any = { fontSize: '12px', opacity: 0.8 };
const adBannerPrice: any = { fontSize: '12px', margin: '5px 0' };
const adBannerButton: any = { background: '#FFD700', color: '#333', padding: '8px 16px', borderRadius: '25px', textAlign: 'center', fontWeight: 'bold', width: 'fit-content', fontSize:'12px' };
const courseNavStyle: any = { display:'flex', gap:'20px', marginBottom:'15px', borderBottom:'1px solid #eee' };
const courseNavItemStyle: any = { padding:'10px 0', fontSize:'14px', color:'#999', cursor:'pointer' };
const courseNavActiveStyle: any = { ...courseNavItemStyle, color:'#3B82F6', fontWeight:'bold', borderBottom:'2px solid #3B82F6' };
const courseContentStyle: any = { minHeight:'100px' };
const demoListStyle: any = { display:'flex', flexDirection:'column', gap:'10px' };
const demoItemStyle: any = { background:'#fff', padding:'12px', borderRadius:'10px', fontSize:'13px' };
const hotCourseItemStyle: any = { background:'#fff', padding:'15px', borderRadius:'12px', marginBottom:'10px' };
const bottomBarStyle: any = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: any = { fontSize: "12px", color: "#999", cursor:'pointer' };
const bottomActiveStyle: any = { ...bottomItemStyle, color: "#3B82F6", fontWeight:'bold' };
const bottomAddStyle: any = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer' };
const modalStyle: any = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: any = { background: "#fff", borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", gap: "15px" };
const modalCloseStyle: any = { background: "none", border: "none", fontSize:'20px', cursor:'pointer' };
const modalBtnStyle: any = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor:'pointer', fontWeight:'bold' };
const inputStyle: any = { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #eee', background:'#F9FAFB', fontSize:'14px' };
const profilePageStyle: any = { background: "#F9FAFB", height: "100%" };
const profileHeaderLight: any = { padding: "40px 20px 20px 20px", background:'#fff' };
const userInfoCard: any = { display:'flex', alignItems:'center' };
const avatarStyleLight: any = { width:'60px', height:'60px', borderRadius:'50%', background:'#eee', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'12px', color:'#999' };
const gridMenu: any = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'15px', padding:'20px', background:'#fff', marginTop:'10px' };
const gridItem: any = { textAlign:'center', cursor:'pointer' };
const gridIconPlaceholder: any = { fontSize:'24px' };
