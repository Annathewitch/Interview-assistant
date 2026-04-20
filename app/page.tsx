"use client";
import { useState, useEffect } from "react";

// --- 方案二：全局声明接口，解决 TypeScript 报错 ---
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
  audioData?: string;        // Base64编码的音频数据
  audioBlobUrl?: string;     // 用于播放的Blob URL
  recordingDuration?: number; // 录音时长（秒）
};

const STATUS = [
  "刚投递", "已测评", "一面", "二面", "三面", "HR面", "Offer", "已挂"
];

export default function Page() {
  const [topTab, setTopTab] = useState<"岗位" | "面试" | "复盘">("岗位");
  const [bottomTab, setBottomTab] = useState("首页");

  // 月份切换（2026年）
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4);

  // 岗位
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  // 面试
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [channel, setChannel] = useState("腾讯会议");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);

  // 录音
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [realTimeTranscript, setRealTimeTranscript] = useState("");

  // 本地存储
  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");

    const migratedInterviews = i.map((interview: any) => ({
      ...interview,
      audioData: interview.audioData || undefined,
      audioBlobUrl: interview.audioBlobUrl || undefined,
      recordingDuration: interview.recordingDuration || undefined
    }));

    setJobs(j);
    setInterviews(migratedInterviews);
  }, []);

  const saveJobs = (data: Job[]) => {
    setJobs(data);
    localStorage.setItem("jobs", JSON.stringify(data));
  };

  const saveInterviews = (data: Interview[]) => {
    setInterviews(data);
    localStorage.setItem("interviews", JSON.stringify(data));
  };

  const addJob = () => {
    if (!company || !role) return;
    const newJob: Job = {
      id: Date.now(), company, role, salary, location, status
    };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany("");
    setRole("");
  };

  const addInterview = () => {
    if (!selectedJob || !interviewDate || !interviewTime) return;
    const newInterview: Interview = {
      id: Date.now(),
      jobId: selectedJob.id,
      date: interviewDate,
      time: interviewTime,
      channel
    };
    const newList = [newInterview, ...interviews];
    saveInterviews(newList);

    setSelectedDay(interviewDate);
    setCurrentInterview(newInterview);
    setSelectedJob(null);
    setInterviewDate("");
    setInterviewTime("");
  };

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    const list = interviews.filter(it => it.date === day);
    setCurrentInterview(list[0] || null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkRecordingSupport = (): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && MediaRecorder);
  };

  const initializeRecording = async (): Promise<MediaRecorder | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        handleRecordingStop();
      };

      setMediaRecorder(recorder);
      return recorder;
    } catch (error) {
      console.error('录音初始化失败:', error);
      return null;
    }
  };

  const handleRecordingStop = () => {
    if (audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64data = reader.result as string;

      if (currentInterview) {
        const updated = interviews.map(it =>
          it.id === currentInterview.id ? {
            ...it,
            transcript: realTimeTranscript || "未检测到有效语音...",
            audioData: base64data,
            audioBlobUrl: audioUrl,
            recordingDuration: recordingTime
          } : it
        );

        saveInterviews(updated);
        setCurrentInterview({
          ...currentInterview,
          transcript: realTimeTranscript || "未检测到有效语音...",
          audioData: base64data,
          audioBlobUrl: audioUrl,
          recordingDuration: recordingTime
        });
      }
      setAudioChunks([]);
    };
  };

  const startRecording = async () => {
    if (!currentInterview) return;

    setRecording(true);
    setAudioChunks([]);
    setRecordingTime(0);
    setRealTimeTranscript("");

    if (!checkRecordingSupport()) {
      startRecord();
      return;
    }

    const recorder = await initializeRecording();
    if (!recorder) {
      startRecord();
      return;
    }

    recorder.start(1000);
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    window.recordingTimer = { current: timer };
    startSpeechRecognition();
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    stopSpeechRecognition(); // 同步停止识别
    setRecording(false);

    if (window.recordingTimer?.current) {
      clearInterval(window.recordingTimer.current);
      delete window.recordingTimer;
    }
  };

  const startSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        setRealTimeTranscript(finalTranscript + interimTranscript);
      };

      recognition.start();
      window.currentRecognition = recognition;
    } catch (error) {
      console.warn('Web Speech API不可用:', error);
    }
  };

  const stopSpeechRecognition = () => {
    if (window.currentRecognition) {
      try {
        window.currentRecognition.stop();
      } catch (e) {}
      delete window.currentRecognition;
    }
  };

  const startRecord = () => {
    if (!currentInterview) return;
    setRecording(true);
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) throw new Error();
      
      const recognition = new SpeechRecognition();
      recognition.lang = "zh-CN";
      recognition.start();
      recognition.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        const updated = interviews.map(it =>
          it.id === currentInterview.id ? { ...it, transcript: t } : it
        );
        saveInterviews(updated);
        setCurrentInterview({ ...currentInterview, transcript: t });
        setRecording(false);
      };
      recognition.onerror = () => { setRecording(false); };
    } catch (e) {
      setRecording(false);
    }
  };

  const goToReport = () => {
    if (!currentInterview) return;
    const job = jobs.find(j => j.id === currentInterview.jobId);
    setReport(`
【面试岗位】
${job?.company} | ${job?.role}

【面试内容】
${currentInterview.transcript || "暂无有效录音文字"}

【AI 复盘总结】
✅ 优点：回答要点覆盖全面，语速适中。
🔍 建议：针对分布式架构的理解可以再深入一些，多结合具体业务量级。
🚀 提升：下次可以尝试用 STAR 法则描述项目难点。
    `);
    setTopTab("复盘");
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();
  const dayHasInterview = (day: string) => interviews.some(it => it.date === day);
  const getStatusColor = (s: string) => {
    if (s.includes("面")) return "#4F46E5";
    if (s === "Offer") return "#10B981";
    if (s === "已挂") return "#9CA3AF";
    return "#3B82F6";
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
                {jobs.length === 0 && <div style={emptyStyle}>暂无岗位，点击下方“+”添加</div>}
                {jobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={titleStyle}>{job.role}</div>
                    <div style={infoStyle}>{job.company} · {job.salary}</div>
                    <div style={locationStyle}>{job.location}</div>
                    <button onClick={() => { setSelectedJob(job); setTopTab("面试"); }}
                      style={{ ...tagStyle, backgroundColor: getStatusColor(job.status), cursor:'pointer' }}>
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
                    <option value="">请选择岗位</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.company}</option>)}
                  </select>
                  <input style={inputStyle} type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                  <input style={inputStyle} type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                  <button onClick={addInterview} style={submitBtnStyle}>提交安排</button>
                </div>

                {selectedDay && currentInterview && (
                  <div style={interviewDetailCardStyle}>
                    <div style={sectionTitleStyle}>面试详情</div>
                    <div style={detailTextStyle}>公司：{jobs.find(j => j.id === currentInterview.jobId)?.company}</div>
                    <div style={detailTextStyle}>时间：{currentInterview.date} {currentInterview.time}</div>

                    {!recording ? (
                      <button onClick={startRecording} style={recordBtnStyle}>🎙️ 开始录音</button>
                    ) : (
                      <div style={recordingControlsStyle}>
                        <button onClick={stopRecording} style={stopRecordBtnStyle}>⏹️ 停止录音</button>
                        <div style={recordingTimerStyle}>🔴 正在转录: {formatTime(recordingTime)}</div>
                      </div>
                    )}

                    <div style={transcriptCardStyle}>
                      <div style={subTitleStyle}>实时转写预览：</div>
                      <div style={transcriptTextStyle}>{realTimeTranscript || currentInterview.transcript || "暂无内容"}</div>
                      {currentInterview.audioBlobUrl && !recording && (
                        <div style={audioPlayerStyle}>
                          <audio controls src={currentInterview.audioBlobUrl} style={audioElementStyle} />
                        </div>
                      )}
                    </div>
                    {!recording && (currentInterview.transcript || currentInterview.audioData) && (
                      <button onClick={goToReport} style={reportBtnStyle}>🚀 AI 复盘分析</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {topTab === "复盘" && (
              <div style={reportPageStyle}>
                <div style={aiBubbleStyle}>{report || "暂无复盘报告，请先完成面试录音。"}</div>
              </div>
            )}
          </>
        )}

        {bottomTab === "课程" && (
          <div style={coursePageStyle}>
            <div style={courseGridStyle}>
              <div style={courseCardStyle}>📘<br/>高频题库</div>
              <div style={courseCardStyle}>📗<br/>思维训练</div>
              <div style={courseCardStyle}>📙<br/>复盘模板</div>
              <div style={courseCardStyle}>📕<br/>大厂面经</div>
            </div>
            <div style={demoListStyle}>
               <div style={demoItemStyle}>Demo: 2026 互联网产品经理真题</div>
               <div style={demoItemStyle}>Demo: 简历优化 AI 工具推荐</div>
            </div>
          </div>
        )}

        {bottomTab === "社区" && (
          <div style={communityPageStyle}>
             <div style={communityNavStyle}><span style={navActiveStyle}>最新</span><span>热门</span></div>
             <div style={postGridStyle}>
                <div style={postCardStyle}>关于 2026 春招的趋势分析</div>
                <div style={postCardStyle}>我是如何拿到 5 个大厂 Offer 的</div>
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
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>记录岗位</button>
            <button onClick={() => { setTopTab("面试"); setShowAddPop(false); }} style={modalBtnStyle}>安排面试</button>
          </div>
        </div>
      )}

      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={modalCloseStyle} onClick={() => setShowJobForm(false)}>✕</button>
            <input style={inputStyle} placeholder="公司名称" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="岗位名称" value={role} onChange={e=>setRole(e.target.value)} />
            <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={addJob} style={modalBtnStyle}>保存岗位</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 样式 (优化版) ====================
const appContainer: any = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "30px", overflow: "hidden", position: "relative", border:'8px solid #333' };
const headerStyle: any = { background: "#fff", padding: "15px 20px", display: "flex", alignItems: "center", gap: "10px" };
const logoStyle: any = { fontSize: "16px", fontWeight: "bold" };
const searchStyle: any = { flex: 1, padding: "8px 14px", borderRadius: "20px", background: "#F3F4F6", border: "none" };
const topTabBarStyle: any = { display: "flex", background: "#fff", borderBottom: "1px solid #eee" };
const topTabItemStyle: any = { flex: 1, textAlign: "center", padding: "12px 0", fontSize: "14px", color: "#999" };
const topTabActiveStyle: any = { ...topTabItemStyle, color: "#3B82F6", fontWeight: "bold", borderBottom: "2px solid #3B82F6" };
const contentStyle: any = { height: "calc(100% - 150px)", overflowY: "auto" };
const listStyle: any = { padding: "15px" };
const cardStyle: any = { background: "#fff", borderRadius: "12px", padding: "16px", marginBottom: "10px", boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const titleStyle: any = { fontSize: "16px", fontWeight: "bold" };
const infoStyle: any = { fontSize: "13px", color: "#666", marginTop:'4px' };
const locationStyle: any = { fontSize: "12px", color: "#999" };
const tagStyle: any = { fontSize: "11px", color: "#fff", padding: "3px 8px", borderRadius: "8px", border: "none", marginTop: "8px" };
const emptyStyle: any = { textAlign:'center', color:'#999', padding:'40px 0' };
const interviewPageStyle: any = { padding:'15px' };
const calendarCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px', marginBottom:'15px' };
const calendarHeaderStyle: any = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' };
const arrowStyle: any = { cursor:'pointer', color:'#3B82F6' };
const monthStyle: any = { fontWeight:'bold' };
const weekBarStyle: any = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', textAlign:'center', fontSize:'12px', color:'#999' };
const weekTextStyle: any = {};
const daysGridStyle: any = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px', marginTop:'10px' };
const dayStyle: any = { height:'35px', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'13px' };
const dayActiveStyle: any = { ...dayStyle, background:'#3B82F6', color:'#fff', borderRadius:'50%' };
const addFormCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px', marginBottom:'15px' };
const sectionTitleStyle: any = { fontSize:'15px', fontWeight:'bold', marginBottom:'10px' };
const inputStyle: any = { width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #eee' };
const submitBtnStyle: any = { width:'100%', background:'#3B82F6', color:'#fff', border:'none', padding:'12px', borderRadius:'8px' };
const interviewDetailCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px' };
const detailTextStyle: any = { fontSize:'14px', marginBottom:'5px' };
const recordBtnStyle: any = { width:'100%', background:'#4F46E5', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', marginTop:'10px' };
const recordingControlsStyle: any = { marginTop:'10px' };
const stopRecordBtnStyle: any = { width:'100%', background:'#DC2626', color:'#fff', border:'none', padding:'12px', borderRadius:'12px' };
const recordingTimerStyle: any = { textAlign:'center', fontSize:'12px', color:'#DC2626', marginTop:'5px' };
const transcriptCardStyle: any = { background:'#F9FAFB', padding:'15px', borderRadius:'12px', marginTop:'10px' };
const subTitleStyle: any = { fontSize:'11px', color:'#999', marginBottom:'5px' };
const transcriptTextStyle: any = { fontSize:'13px', lineHeight:'1.5' };
const audioPlayerStyle: any = { marginTop:'10px' };
const audioElementStyle: any = { width:'100%' };
const reportBtnStyle: any = { width:'100%', background:'#10B981', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', marginTop:'10px' };
const coursePageStyle: any = { padding:'15px' };
const courseGridStyle: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' };
const courseCardStyle: any = { background:'#fff', padding:'20px', borderRadius:'15px', textAlign:'center' };
const courseIconStyle: any = { fontSize:'24px' };
const demoListStyle: any = { marginTop:'20px' };
const demoItemStyle: any = { background:'#fff', padding:'12px', borderRadius:'10px', marginBottom:'10px', fontSize:'13px' };
const reportPageStyle: any = { padding:'20px' };
const aiBubbleStyle: any = { background:'#DBEAFE', padding:'20px', borderRadius:'15px 15px 15px 0', fontSize:'14px', lineHeight:'1.6', whiteSpace:'pre-wrap' };
const communityPageStyle: any = { padding:'15px' };
const communityNavStyle: any = { display:'flex', gap:'20px', marginBottom:'15px', fontWeight:'bold' };
const navActiveStyle: any = { color:'#3B82F6' };
const postGridStyle: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' };
const postCardStyle: any = { background:'#fff', padding:'15px', borderRadius:'12px', fontSize:'12px' };
const bottomBarStyle: any = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: any = { fontSize: "12px", color: "#999" };
const bottomActiveStyle: any = { ...bottomItemStyle, color: "#3B82F6", fontWeight:'bold' };
const bottomAddStyle: any = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center' };
const modalStyle: any = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: any = { width: "300px", background: "#fff", borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", gap: "15px" };
const modalCloseStyle: any = { alignSelf: "flex-end", background: "none", border: "none", fontSize:'20px', color:'#999' };
const modalBtnStyle: any = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px" };
