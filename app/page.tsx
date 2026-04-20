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
  
  // 引导状态
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  // 课程二级页面状态
  const [courseSubPage, setCourseSubPage] = useState<string | null>(null);
  const [codingDemo, setCodingDemo] = useState(false);

  // 数据状态
  const [jobs, setJobs] = useState<Job[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  // 表单状态
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  // 面试相关
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

  // 初始化与持久化
  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");
    setJobs(j);
    setInterviews(i);
    // 如果没有岗位，显示引导
    if (j.length === 0) {
      setShowGuide(true);
    }
  }, []);

  const saveJobs = (data: Job[]) => {
    setJobs(data);
    localStorage.setItem("jobs", JSON.stringify(data));
  };

  const addJob = () => {
    if (!company || !role) return;
    const newJob: Job = { id: Date.now(), company, role, salary, location, status };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany(""); setRole("");
    setShowGuide(false); // 创建第一个岗位后关闭引导
  };

  // --- 渲染逻辑 ---
  return (
    <div style={appContainer}>
      {/* 顶部搜索 */}
      <div style={headerStyle}>
        <div style={logoStyle}>求职助手</div>
        <input placeholder="搜索公司/岗位" style={searchStyle} />
      </div>

      {/* 内容区域 */}
      <div style={contentStyle}>
        {bottomTab === "首页" && (
          <>
            <div style={topTabBarStyle}>
              {["岗位", "面试", "复盘"].map((t) => (
                <div key={t} onClick={() => setTopTab(t as any)}
                  style={topTab === t ? topTabActiveStyle : topTabItemStyle}>{t}</div>
              ))}
            </div>
            {topTab === "岗位" && (
              <div style={listStyle}>
                {jobs.length === 0 && <div style={emptyStyle}>暂无岗位，点击下方 + 开始</div>}
                {jobs.map(job => (
                  <div key={job.id} style={cardStyle}>
                    <div style={titleStyle}>{job.role}</div>
                    <div style={infoStyle}>{job.company} · {job.salary}</div>
                    <button style={{ ...tagStyle, backgroundColor: "#3B82F6" }}>{job.status}</button>
                  </div>
                ))}
              </div>
            )}
            {/* 面试/复盘逻辑保留... */}
          </>
        )}

        {bottomTab === "课程" && !courseSubPage && (
          <div style={coursePageStyle}>
            <div style={courseGridStyle}>
              <div style={courseCardStyle} onClick={() => setCourseSubPage("笔试题库")}>
                <div style={courseIconStyle}>📝</div><div>笔试题库</div>
              </div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📘</div><div>面试高频题</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📙</div><div>项目复盘</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📕</div><div>行业面经</div></div>
            </div>
          </div>
        )}

        {/* 笔试题库二级页面 */}
        {bottomTab === "课程" && courseSubPage === "笔试题库" && !codingDemo && (
          <div style={{ padding: "10px" }}>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" }}>
              {["专项练习", "笔试真题", "面试真题", "在线编程"].map(tab => (
                <span key={tab} onClick={() => setCourseSubPage(tab)} 
                  style={tab === courseSubPage ? { color: "#3B82F6", fontWeight: "bold" } : { color: "#666" }}>
                  {tab}
                </span>
              ))}
            </div>
            <div style={listStyle}>
              <div style={cardStyle} onClick={() => setCodingDemo(true)}>
                <div style={titleStyle}>LeetCode 1. 两数之和</div>
                <div style={infoStyle}>难度：简单 | 掌握度：80%</div>
              </div>
              <div style={cardStyle}>
                <div style={titleStyle}>字节跳动2026校招笔试真题</div>
                <div style={infoStyle}>共5题 | 120分钟</div>
              </div>
            </div>
            <button onClick={() => setCourseSubPage(null)} style={{ marginTop: "20px", color: "#3B82F6", border: "none", background: "none" }}>← 返回</button>
          </div>
        )}

        {/* 在线编程 Demo */}
        {codingDemo && (
          <div style={editorOverlay}>
            <div style={problemFloatingCard}>
              <div style={{ fontWeight: "bold" }}>题目：两数之和</div>
              <div style={{ fontSize: "12px", color: "#444" }}>给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那两个整数。</div>
            </div>
            <textarea 
              style={editorArea} 
              defaultValue={`function twoSum(nums, target) {\n  // 在这里输入代码...\n}`}
            />
            <div style={editorFooter}>
              <button onClick={() => setCodingDemo(false)} style={modalBtnStyle}>退出</button>
              <button style={{ ...modalBtnStyle, background: "#10B981" }}>提交运行</button>
            </div>
          </div>
        )}

        {/* 社区/我的 保持原样... */}
      </div>

      {/* 底部导航 */}
      <div style={bottomBarStyle}>
        <div onClick={() => {setBottomTab("首页"); setCourseSubPage(null)}} style={bottomTab === "首页" ? bottomActiveStyle : bottomItemStyle}>首页</div>
        <div onClick={() => setBottomTab("课程")} style={bottomTab === "课程" ? bottomActiveStyle : bottomItemStyle}>课程</div>
        <div onClick={() => setShowAddPop(true)} style={bottomAddStyle}>+</div>
        <div onClick={() => setBottomTab("社区")} style={bottomTab === "社区" ? bottomActiveStyle : bottomItemStyle}>社区</div>
        <div onClick={() => setBottomTab("我的")} style={bottomTab === "我的" ? bottomActiveStyle : bottomItemStyle}>我的</div>
      </div>

      {/* 用户引导层 */}
      {showGuide && (
        <div style={guideOverlay}>
          {guideStep === 1 && (
            <div style={guideBubbleBottom}>
              <p>欢迎使用！点击这里创建你的第一个求职岗位 🚀</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setShowGuide(false)} style={guideBtnMinor}>跳过</button>
                <button onClick={() => setGuideStep(2)} style={guideBtn}>下一步</button>
              </div>
            </div>
          )}
          {guideStep === 2 && (
            <div style={guideBubbleCenter}>
              <p>创建岗位后，你可以安排面试、录音并获取 AI 复盘总结。</p>
              <button onClick={() => {setShowGuide(false); setShowAddPop(true)}} style={guideBtn}>立即去创建</button>
            </div>
          )}
        </div>
      )}

      {/* 原有的弹窗逻辑 (AddPop / JobForm) ... */}
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
            <button onClick={addJob} style={modalBtnStyle}>保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 样式定义 (仅列出新增或修改部分) ---
const guideOverlay: CSSProperties = {
  position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000,
  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
};

const guideBubbleBottom: CSSProperties = {
  position: "absolute", bottom: "80px", left: "20px", right: "20px",
  background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 0 20px rgba(255,255,255,0.2)"
};

const guideBubbleCenter: CSSProperties = {
  width: "280px", background: "#fff", padding: "20px", borderRadius: "16px", textAlign: "center"
};

const guideBtn: CSSProperties = {
  background: "#3B82F6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px"
};

const guideBtnMinor: CSSProperties = {
  background: "none", border: "none", color: "#999", fontSize: "14px"
};

const editorOverlay: CSSProperties = {
  position: "absolute", inset: 0, background: "#1e1e1e", zIndex: 100, display: "flex", flexDirection: "column"
};

const problemFloatingCard: CSSProperties = {
  background: "rgba(255,255,255,0.9)", margin: "10px", padding: "12px", borderRadius: "8px",
  borderLeft: "4px solid #3B82F6", position: "relative", zIndex: 110
};

const editorArea: CSSProperties = {
  flex: 1, background: "#1e1e1e", color: "#d4d4d4", padding: "15px", border: "none",
  fontFamily: "monospace", fontSize: "14px", outline: "none", resize: "none"
};

const editorFooter: CSSProperties = {
  padding: "10px", display: "flex", gap: "10px", background: "#252526"
};

// ==================== 样式 (修复类型错误) ====================
const appContainer: CSSProperties = {
  width: "390px",
  height: "844px",
  margin: "20px auto",
  background: "#F9FAFB",
  borderRadius: "20px",
  overflow: "hidden",
  position: "relative",
  fontFamily: "system-ui, sans-serif",
};

const headerStyle: CSSProperties = {
  background: "#fff",
  padding: "15px 20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const logoStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
};

const searchStyle: CSSProperties = {
  flex: 1,
  padding: "8px 14px",
  borderRadius: "20px",
  background: "#F3F4F6",
  border: "none",
  outline: "none",
};

const topTabBarStyle: CSSProperties = {
  display: "flex",
  background: "#fff",
  borderBottom: "1px solid #E5E7EB",
};

const topTabItemStyle: CSSProperties = {
  flex: 1,
  textAlign: "center",
  padding: "12px 0",
  fontSize: "14px",
  color: "#9CA3AF",
};

const topTabActiveStyle: CSSProperties = {
  flex: 1,
  textAlign: "center",
  padding: "12px 0",
  fontSize: "14px",
  fontWeight: 600,
  color: "#3B82F6",
  borderBottom: "2px solid #3B82F6",
};

const contentStyle: CSSProperties = {
  height: "calc(100% - 190px)",
  overflowY: "auto",
  padding: "10px",
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const cardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
};

const titleStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "4px",
};

const infoStyle: CSSProperties = {
  fontSize: "14px",
  color: "#4B5563",
};

const locationStyle: CSSProperties = {
  fontSize: "13px",
  color: "#9CA3AF",
  marginBottom: "8px",
};

const tagStyle: CSSProperties = {
  fontSize: "12px",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: "12px",
  border: "none",
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  color: "#9CA3AF",
  padding: "40px 0",
};

const interviewPageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  paddingBottom: "20px",
};

const calendarCardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "16px",
};

const calendarHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const arrowStyle: CSSProperties = {
  fontSize: "16px",
  padding: "4px 10px",
  cursor: "pointer",
};

const monthStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 500,
};

const weekBarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
};

const weekTextStyle: CSSProperties = {
  textAlign: "center",
  fontSize: "12px",
  color: "#9CA3AF",
};

const daysGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "4px",
  marginTop: "8px",
};

const dayStyle: CSSProperties = {
  textAlign: "center",
  padding: "8px",
  fontSize: "14px",
};

const dayActiveStyle: CSSProperties = {
  textAlign: "center",
  padding: "8px",
  fontSize: "14px",
  background: "#DBEAFE",
  borderRadius: "50%",
  color: "#3B82F6",
  fontWeight: 500,
};

const addFormCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  marginBottom: "4px",
};

const inputStyle: CSSProperties = {
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  outline: "none",
};

const submitBtnStyle: CSSProperties = {
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 0",
  fontSize: "14px",
  marginTop: "4px",
};

const interviewDetailCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const detailTextStyle: CSSProperties = {
  fontSize: "14px",
  color: "#374151",
};

const recordBtnStyle: CSSProperties = {
  background: "#4F46E5",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 0",
  fontSize: "14px",
};

const transcriptCardStyle: CSSProperties = {
  background: "#F9FAFB",
  borderRadius: "12px",
  padding: "12px",
  minHeight: "80px",
};

const subTitleStyle: CSSProperties = {
  fontSize: "13px",
  color: "#6B7280",
  marginBottom: "6px",
};

const transcriptTextStyle: CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.5",
};

const reportBtnStyle: CSSProperties = {
  background: "#10B981",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 0",
  fontSize: "14px",
  marginTop: "4px",
};

const reportPageStyle: CSSProperties = {
  padding: "10px",
};

const aiBubbleStyle: CSSProperties = {
  background: "#DBEAFE",
  borderRadius: "16px",
  padding: "16px",
  fontSize: "14px",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5,
};

const coursePageStyle: CSSProperties = {
  padding: "15px",
};

const courseGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "15px",
};

const courseCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center",
};

const courseIconStyle: CSSProperties = {
  fontSize: "24px",
  marginBottom: "8px",
};

const demoListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const demoItemStyle: CSSProperties = {
  background: "#fff",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "13px",
};

const communityPageStyle: CSSProperties = {
  padding: "15px",
};

const communityNavStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "15px",
};

const navActiveStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
};

const navItemStyle: CSSProperties = {
  fontSize: "16px",
  color: "#9CA3AF",
};

const navIconsStyle: CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  gap: "16px",
};

const communityTabsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  marginBottom: "15px",
  fontSize: "13px",
};

const postGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const postCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "12px",
  padding: "12px",
};

const bottomBarStyle: CSSProperties = {
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

const bottomItemStyle: CSSProperties = {
  fontSize: "13px",
  color: "#9CA3AF",
};

const bottomActiveStyle: CSSProperties = {
  fontSize: "13px",
  color: "#3B82F6",
  fontWeight: 500,
};

const bottomAddStyle: CSSProperties = {
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

const modalStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modalContentStyle: CSSProperties = {
  width: "320px",
  background: "#fff",
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  position: "relative",
};

const modalCloseStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "16px",
  background: "none",
  border: "none",
  fontSize: "18px",
  color: "#9CA3AF",
};

const modalBtnStyle: CSSProperties = {
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 0",
};
