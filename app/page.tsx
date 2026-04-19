"use client";
import { useState, useEffect } from "react";

const STATUS = [
  "刚投递", "已测评", "一面", "二面", "三面", "HR面", "Offer", "已挂"
];

export default function Page() {
  const [topTab, setTopTab] = useState("岗位");
  const [bottomTab, setBottomTab] = useState("首页");

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4);

  const [jobs, setJobs] = useState([]);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  const [interviews, setInterviews] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [channel, setChannel] = useState("腾讯会议");
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentInterview, setCurrentInterview] = useState(null);

  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState("");

  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    const i = JSON.parse(localStorage.getItem("interviews") || "[]");
    setJobs(j);
    setInterviews(i);
  }, []);

  const saveJobs = (data) => {
    setJobs(data);
    localStorage.setItem("jobs", JSON.stringify(data));
  };

  const saveInterviews = (data) => {
    setInterviews(data);
    localStorage.setItem("interviews", JSON.stringify(data));
  };

  const addJob = () => {
    if (!company || !role) return;
    const newJob = {
      id: Date.now(), company, role, salary, location, status
    };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany("");
    setRole("");
  };

  const addInterview = () => {
    if (!selectedJob || !interviewDate || !interviewTime) return;
    const newInterview = {
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

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    const list = interviews.filter(it => it.date === day);
    setCurrentInterview(list[0] || null);
  };

  const startRecord = () => {
    if (!currentInterview || typeof window === "undefined") return;

    setRecording(true);

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) throw new Error();

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
        fallbackTranscript();
      };
    } catch (e) {
      fallbackTranscript();
    }
  };

  const fallbackTranscript = () => {
    const t = "演示：面试官您好，我擅长产品设计与需求分析。";
    const updated = interviews.map(it =>
      it.id === currentInterview.id ? { ...it, transcript: t } : it
    );
    saveInterviews(updated);
    setCurrentInterview({ ...currentInterview, transcript: t });
    setRecording(false);
  };

  const goToReport = () => {
    if (!currentInterview) return;
    const job = jobs.find(j => j.id === currentInterview.jobId);
    setReport(`
【面试岗位】
${job?.company} | ${job?.role}

【面试内容】
${currentInterview.transcript || "暂无录音"}

【AI复盘】
表达清晰，但项目亮点不足，建议补充数据支撑。
    `);
    setTopTab("复盘");
  };

  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m - 1, 1).getDay();
  const dayHasInterview = (day) => interviews.some(it => it.date === day);

  const getStatusColor = (s) => {
    if (s.includes("面")) return "#4F46E5";
    if (s === "Offer") return "#10B981";
    if (s === "已挂") return "#9CA3AF";
    return "#3B82F6";
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>求职助手（已修复 TS）</h2>
      <button onClick={addJob}>测试添加岗位</button>
      {jobs.map(j => (
        <div key={j.id}>{j.company} - {j.role}</div>
      ))}
    </div>
  );
}
