"use client";
import { useState, useEffect } from "react";

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

  // 本地存储
  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");
    setJobs(j);
    setInterviews(i);
  }, []);

  const saveJobs = (data: Job[]) => {
    setJobs(data);
    localStorage.setItem("jobs", JSON.stringify(data));
  };

  const saveInterviews = (data: Interview[]) => {
    setInterviews(data);
    localStorage.setItem("interviews", JSON.stringify(data));
  };

  // 添加岗位
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

  // 提交面试安排
  const addInterview = () => {
    if (!selectedJob || !interviewDate || !interviewTime) return;
    const newInterview: Interview = {
      id: Date.now(),
      jobId: selectedJob.id,
      date: interviewDate,
      time: interviewTime,
      channel
    };
    const newList = [...interviews, newInterview];
    saveInterviews(newList);

    setSelectedDay(interviewDate);
    setCurrentInterview(newInterview);

    setSelectedJob(null);
    setInterviewDate("");
    setInterviewTime("");
  };

  // 点击日期
  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    const list = interviews.filter(it => it.date === day);
    setCurrentInterview(list[0] || null);
  };

  // 录音
  const startRecord = () => {
    if (!currentInterview) return;
    setRecording(true);
    try {
      const SpeechRecognition = 
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "zh-CN";
      recognition.start();
      recognition.onresult = (e) => {
        const t = e.results[0][0].transcript;
        const updated = interviews.map(it =>
          it.id === currentInterview.id ? { ...it, transcript: t } : it
        );
        saveInterviews(updated);
        setCurrentInterview({ ...currentInterview, transcript: t });
        setRecording(false);
      };
      recognition.onerror = () => {
        const t = "演示：面试官您好，我擅长产品设计与需求分析。";
        const updated = interviews.map(it =>
          it.id === currentInterview.id ? { ...it, transcript: t } : it
        );
        saveInterviews(updated);
        setCurrentInterview({ ...currentInterview, transcript: t });
        setRecording(false);
      };
    } catch (e) {
      const t = "演示：面试官您好，我擅长产品设计与需求分析。";
      const updated = interviews.map(it =>
        it.id === currentInterview.id ? { ...it, transcript: t } : it
      );
      saveInterviews(updated);
      setCurrentInterview({ ...currentInterview, transcript: t });
      setRecording(false);
    }
  };

  // 去复盘
  const goToReport = () => {
    if (!currentInterview) return;
    const job = jobs.find(j => j.id === currentInterview.jobId);
    setReport(`
【面试岗位】
${job?.company} | ${job?.role}

【面试内容】
${currentInterview.transcript || "暂无录音"}

【AI 复盘总结】
✅ 优点：表达清晰、逻辑顺畅
🔍 问题：项目亮点不足
🚀 提升：强化数据、准备高频题
    `);
    setTopTab("复盘");
  };

  // 获取当月天数
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

  // 获取当月1号是周几（0=周日，1=周一...6=周六）
  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m - 1, 1).getDay();
  };

  // 判断日期是否有面试
  const dayHasInterview = (day: string) => {
    return interviews.some(it => it.date === day);
  };

  // 状态颜色
  const getStatusColor = (s: string) => {
    if (s.includes("面")) return "#4F46E5";
    if (s === "Offer") return "#10B981";
    if (s === "已挂") return "#9CA3AF";
    return "#3B82F6";
  };

  return (
    <div style={appContainer}>
      {/* 顶部 */}
      <div style={headerStyle}>
        <div style={logoStyle}>求职助手</div>
        <input placeholder="搜索公司/岗位" style={searchStyle} />
      </div>

      {/* 只在【首页】显示顶部标签：岗位/面试/复盘 */}
      {bottomTab === "首页" && (
        <div style={topTabBarStyle}>
          <div onClick={() => setTopTab("岗位")}
            style={topTab === "岗位" ? topTabActiveStyle : topTabItemStyle}>
            岗位
          </div>
          <div onClick={() => setTopTab("面试")}
            style={topTab === "面试" ? topTabActiveStyle : topTabItemStyle}>
            面试
          </div>
          <div onClick={() => setTopTab("复盘")}
            style={topTab === "复盘" ? topTabActiveStyle : topTabItemStyle}>
            复盘
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div style={contentStyle}>
        {bottomTab === "首页" && (
          <>
            {/* 岗位 */}
            {topTab === "岗位" && (
              <div style={listStyle}>
                {jobs.length === 0 && <div style={emptyStyle}>暂无岗位，点击 + 添加</div>}
                {jobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={titleStyle}>{job.role}</div>
                    <div style={infoStyle}>{job.company} · {job.salary}</div>
                    <div style={locationStyle}>{job.location}</div>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setTopTab("面试");
                      }}
                      style={{ ...tagStyle, backgroundColor: getStatusColor(job.status) }}
                    >
                      {job.status}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 面试页面（2026年真实日历） */}
            {topTab === "面试" && (
              <div style={interviewPageStyle}>
                <div style={calendarCardStyle}>
                  {/* 月份切换 */}
                  <div style={calendarHeaderStyle}>
                    <div onClick={() => {
                      if (currentMonth === 1) {
                        setCurrentMonth(12);
                        setCurrentYear(2025);
                      } else {
                        setCurrentMonth(currentMonth - 1);
                      }
                    }} style={arrowStyle}>◀</div>

                    <div style={monthStyle}>{currentYear}年{currentMonth}月</div>

                    <div onClick={() => {
                      if (currentMonth === 12) {
                        setCurrentMonth(1);
                        setCurrentYear(2027);
                      } else {
                        setCurrentMonth(currentMonth + 1);
                      }
                    }} style={arrowStyle}>▶</div>
                  </div>

                  <div style={weekBarStyle}>
                    {["日", "一", "二", "三", "四", "五", "六"].map(d => (
                      <div key={d} style={weekTextStyle}>{d}</div>
                    ))}
                  </div>

                  <div style={daysGridStyle}>
                    {/* 前面空白占位 */}
                    {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, i) => (
                      <div key={`blank-${i}`} style={dayStyle}></div>
                    ))}
                    {/* 日期 */}
                    {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => {
                      const day = (i + 1).toString().padStart(2, "0");
                      const monthStr = currentMonth.toString().padStart(2, "0");
                      const date = `${currentYear}-${monthStr}-${day}`;
                      const has = dayHasInterview(date);
                      return (
                        <div
                          key={date}
                          onClick={() => handleSelectDay(date)}
                          style={has ? dayActiveStyle : dayStyle}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 新增面试 */}
                <div style={addFormCardStyle}>
                  <div style={sectionTitleStyle}>新增面试安排</div>
                  <select
                    style={inputStyle}
                    value={selectedJob?.id || ""}
                    onChange={(e) => setSelectedJob(jobs.find(j => j.id === +e.target.value) || null)}
                  >
                    <option value="">请选择岗位</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.company} - {j.role}</option>
                    ))}
                  </select>

                  <input
                    style={inputStyle}
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                  />

                  <select
                    style={inputStyle}
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option>腾讯会议</option>
                    <option>飞书会议</option>
                    <option>线下面试</option>
                    <option>电话面试</option>
                  </select>

                  <button onClick={addInterview} style={submitBtnStyle}>
                    提交面试安排
                  </button>
                </div>

                {/* 面试详情 */}
                {selectedDay && currentInterview && (
                  <div style={interviewDetailCardStyle}>
                    <div style={sectionTitleStyle}>面试详情</div>
                    <div style={detailTextStyle}>公司：{jobs.find(j => j.id === currentInterview.jobId)?.company}</div>
                    <div style={detailTextStyle}>岗位：{jobs.find(j => j.id === currentInterview.jobId)?.role}</div>
                    <div style={detailTextStyle}>时间：{currentInterview.date} {currentInterview.time}</div>
                    <div style={detailTextStyle}>方式：{currentInterview.channel}</div>

                    <button onClick={startRecord} style={recordBtnStyle} disabled={recording}>
                      {recording ? "🔴 录音中..." : "🎙️ 开始录音"}
                    </button>

                    <div style={transcriptCardStyle}>
                      <div style={subTitleStyle}>语音转文字</div>
                      <div style={transcriptTextStyle}>{currentInterview.transcript || "暂无录音"}</div>
                    </div>

                    {currentInterview.transcript && (
                      <button onClick={goToReport} style={reportBtnStyle}>去复盘</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 复盘 */}
            {topTab === "复盘" && (
              <div style={reportPageStyle}>
                <div style={aiBubbleStyle}>{report || "完成录音后生成复盘"}</div>
              </div>
            )}
          </>
        )}

        {/* 课程 */}
        {bottomTab === "课程" && (
          <div style={coursePageStyle}>
            <div style={courseGridStyle}>
              <div style={courseCardStyle}><div style={courseIconStyle}>📘</div><div>面试高频题</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📗</div><div>产品思维课</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📙</div><div>项目复盘</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📕</div><div>行业面经</div></div>
            </div>
            <div style={demoListStyle}>
              <div style={demoItemStyle}>Demo：产品经典面试100题</div>
              <div style={demoItemStyle}>Demo：大厂面经合集</div>
              <div style={demoItemStyle}>Demo：面试必问问题</div>
            </div>
          </div>
        )}

        {/* 社区 */}
        {bottomTab === "社区" && (
          <div style={communityPageStyle}>
            <div style={communityNavStyle}>
              <span style={navActiveStyle}>最新</span>
              <span style={navItemStyle}>热门</span>
              <span style={navItemStyle}>分区</span>
              <div style={navIconsStyle}><span>🔍</span><span>🔔</span></div>
            </div>
            <div style={communityTabsStyle}>
              <div>Offer选择</div><div>校招捡漏</div><div>笔试面经</div><div>求职避坑</div>
            </div>
            <div style={postGridStyle}>
              <div style={postCardStyle}><div>建发外派vs济南四大</div></div>
              <div style={postCardStyle}><div>未来发展比薪资重要</div></div>
              <div style={postCardStyle}><div>中石化or华力求建议</div></div>
              <div style={postCardStyle}><div>黎阳航发vs英维克</div></div>
            </div>
          </div>
        )}

        {bottomTab === "我的" && <div style={emptyStyle}>个人中心</div>}
      </div>

      {/* 底部导航 */}
      <div style={bottomBarStyle}>
        <div onClick={() => setBottomTab("首页")} style={bottomTab === "首页" ? bottomActiveStyle : bottomItemStyle}>首页</div>
        <div onClick={() => setBottomTab("课程")} style={bottomTab === "课程" ? bottomActiveStyle : bottomItemStyle}>课程</div>
        <div onClick={() => setShowAddPop(true)} style={bottomAddStyle}>+</div>
        <div onClick={() => setBottomTab("社区")} style={bottomTab === "社区" ? bottomActiveStyle : bottomItemStyle}>社区</div>
        <div onClick={() => setBottomTab("我的")} style={bottomTab === "我的" ? bottomActiveStyle : bottomItemStyle}>我的</div>
      </div>

      {/* 弹窗 */}
      {showAddPop && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={modalCloseStyle} onClick={() => setShowAddPop(false)}>✕</button>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>新建岗位</button>
            <button onClick={() => { setTopTab("面试"); setShowAddPop(false); }} style={modalBtnStyle}>安排面试</button>
          </div>
        </div>
      )}

      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={modalCloseStyle} onClick={() => setShowJobForm(false)}>✕</button>
            <input style={inputStyle} placeholder="公司" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="岗位" value={role} onChange={e=>setRole(e.target.value)} />
            <input style={inputStyle} placeholder="薪资" value={salary} onChange={e=>setSalary(e.target.value)} />
            <input style={inputStyle} placeholder="地点" value={location} onChange={e=>setLocation(e.target.value)} />
            <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={addJob} style={modalBtnStyle}>保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 样式 ====================
const appContainer = {
  width: "390px",
  height: "844px",
  margin: "20px auto",
  background: "#F9FAFB",
  borderRadius: "20px",
  overflow: "hidden",
  position: "relative",
  fontFamily: "system-ui, sans-serif",
};

const headerStyle = {
  background: "#fff",
  padding: "15px 20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const logoStyle = {
  fontSize: "16px",
  fontWeight: 600,
};

const searchStyle = {
  flex: 1,
  padding: "8px 14px",
  borderRadius: "20px",
  background: "#F3F4F6",
  border: "none",
  outline: "none",
};

const topTabBarStyle = {
  display: "flex",
  background: "#fff",
  borderBottom: "1px solid #E5E7EB",
};

const topTabItemStyle = {
  flex: 1,
  textAlign: "center",
  padding: "12px 0",
  fontSize: "14px",
  color: "#9CA3AF",
};

const topTabActiveStyle = {
  flex: 1,
  textAlign: "center",
  padding: "12px 0",
  fontSize: "14px",
  fontWeight: 600,
  color: "#3B82F6",
  borderBottom: "2px solid #3B82F6",
};

const contentStyle = {
  height: "calc(100% - 190px)",
  overflowY: "auto",
  padding: "10px",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
};

const titleStyle = {
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "4px",
};

const infoStyle = {
  fontSize: "14px",
  color: "#4B5563",
};

const locationStyle = {
  fontSize: "13px",
  color: "#9CA3AF",
  marginBottom: "8px",
};

const tagStyle = {
  fontSize: "12px",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: "12px",
  border: "none",
};

const emptyStyle = {
  textAlign: "center",
  color: "#9CA3AF",
  padding: "40px 0",
};

// 面试
const interviewPageStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  paddingBottom: "20px",
};

const calendarCardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "16px",
};

const calendarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const arrowStyle = {
  fontSize: "16px",
  padding: "4px 10px",
  cursor: "pointer",
};

const monthStyle = {
  fontSize: "16px",
  fontWeight: 500,
};

const weekBarStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
};

const weekTextStyle = {
  textAlign: "center",
  fontSize: "12px",
  color: "#9CA3AF",
};

const daysGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "4px",
  marginTop: "8px",
};

const dayStyle = {
  textAlign: "center",
  padding: "8px",
  fontSize: "14px",
};

const dayActiveStyle = {
  textAlign: "center",
  padding: "8px",
  fontSize: "14px",
  background: "#DBEAFE",
  borderRadius: "50%",
  color: "#3B82F6",
  fontWeight: 500,
};

const addFormCardStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const sectionTitleStyle = {
  fontSize: "15px",
  fontWeight: 600,
  marginBottom: "4px",
};

const inputStyle = {
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  outline: "none",
};

const submitBtnStyle = {
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 0",
  fontSize: "14px",
  marginTop: "4px",
};

const interviewDetailCardStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const detailTextStyle = {
  fontSize: "14px",
  color: "#374151",
};

const recordBtnStyle = {
  background: "#4F46E5",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 0",
  fontSize: "14px",
};

const transcriptCardStyle = {
  background: "#F9FAFB",
  borderRadius: "12px",
  padding: "12px",
  minHeight: "80px",
};

const subTitleStyle = {
  fontSize: "13px",
  color: "#6B7280",
  marginBottom: "6px",
};

const transcriptTextStyle = {
  fontSize: "14px",
  lineHeight: "1.5",
};

const reportBtnStyle = {
  background: "#10B981",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 0",
  fontSize: "14px",
  marginTop: "4px",
};

const reportPageStyle = {
  padding: "10px",
};

const aiBubbleStyle = {
  background: "#DBEAFE",
  borderRadius: "16px",
  padding: "16px",
  fontSize: "14px",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5,
};

// 课程
const coursePageStyle = {
  padding: "15px",
};

const courseGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "15px",
};

const courseCardStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
};

const courseIconStyle = {
  fontSize: "24px",
  marginBottom: "8px",
};

const demoListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const demoItemStyle = {
  background: "#fff",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "13px",
};

// 社区
const communityPageStyle = {
  padding: "15px",
};

const communityNavStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "15px",
};

const navActiveStyle = {
  fontSize: "16px",
  fontWeight: 600,
};

const navItemStyle = {
  fontSize: "16px",
  color: "#9CA3AF",
};

const navIconsStyle = {
  marginLeft: "auto",
  display: "flex",
  gap: "16px",
};

const communityTabsStyle = {
  display: "flex",
  justifyContent: "space-around",
  marginBottom: "15px",
  fontSize: "13px",
};

const postGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const postCardStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "12px",
};

// 底部
const bottomBarStyle = {
  position: "absolute",
  bottom: 0,
  width: "100%",
  height: "70px",
  background: "#fff",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  borderTop: "1px solid #E5E7EB",
};

const bottomItemStyle = {
  fontSize: "13px",
  color: "#9CA3AF",
};

const bottomActiveStyle = {
  fontSize: "13px",
  color: "#3B82F6",
  fontWeight: 500,
};

const bottomAddStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: "#3B82F6",
  color: "#fff",
  fontSize: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// 弹窗
const modalStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modalContentStyle = {
  width: "320px",
  background: "#fff",
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  position: "relative",
};

const modalCloseStyle = {
  position: "absolute",
  top: "12px",
  right: "16px",
  background: "none",
  border: "none",
  fontSize: "18px",
  color: "#9CA3AF",
};

const modalBtnStyle = {
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 0",
};
