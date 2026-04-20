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

        {/* --- 修改部分：课程页面（添加广告banner和导航栏）--- */}
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

            {/* 广告banner */}
            <div style={adBannerStyle}>
              <div style={adBannerContent}>
                <div style={adBannerTitle}>🚀 限时特惠！面试突击班</div>
                <div style={adBannerSubtitle}>2026春招冲刺 | 名企导师1v1指导</div>
                <div style={adBannerPrice}>原价¥1999 <span style={{color:'#DC2626', fontSize:'18px', fontWeight:'bold'}}>现价¥999</span></div>
                <div style={adBannerButton}>立即抢购</div>
              </div>
            </div>

            {/* 导航栏 */}
            <div style={courseNavStyle}>
              {(['推荐', '热门', '学习', '已购'] as const).map(tab => (
                <div
                  key={tab}
                  onClick={() => setCourseTab(tab)}
                  style={courseTab === tab ? courseNavActiveStyle : courseNavItemStyle}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* 内容区域 - 根据选中标签显示不同内容 */}
            <div style={courseContentStyle}>
              {courseTab === '推荐' && (
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
              )}

              {courseTab === '热门' && (
                <div style={demoListStyle}>
                  <div style={sectionTitleStyle}>热门课程排行榜</div>
                  {[
                    { title: "🔥 大厂算法突击班 - 300+高频题精讲", students: "2.3万人在学" },
                    { title: "💼 产品经理求职实战营", students: "1.8万人在学" },
                    { title: "📊 数据分析师从0到offer", students: "1.5万人在学" },
                    { title: "🌐 前端架构师成长之路", students: "1.2万人在学" },
                    { title: "🤖 AI产品经理必修课", students: "9800人在学" },
                    { title: "📱 移动端开发全栈实战", students: "8600人在学" },
                    { title: "☁️ 云计算与DevOps进阶", students: "7200人在学" }
                  ].map((course, index) => (
                    <div key={index} style={hotCourseItemStyle}>
                      <div style={{fontWeight:'bold', fontSize:'14px'}}>{course.title}</div>
                      <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>{course.students}</div>
                    </div>
                  ))}
                </div>
              )}

              {courseTab === '学习' && (
                <div style={courseCardGridStyle}>
                  <div style={learningCourseCardStyle}>
                    <div style={learningCourseIcon}>📘</div>
                    <div style={learningCourseTitle}>系统设计精讲</div>
                    <div style={learningCourseDesc}>分布式、高并发、缓存策略</div>
                    <div style={learningCoursePrice}>¥399</div>
                  </div>
                  <div style={learningCourseCardStyle}>
                    <div style={learningCourseIcon}>📗</div>
                    <div style={learningCourseTitle}>行为面试指南</div>
                    <div style={learningCourseDesc}>STAR法则、项目经历包装</div>
                    <div style={learningCoursePrice}>¥299</div>
                  </div>
                  <div style={learningCourseCardStyle}>
                    <div style={learningCourseIcon}>📙</div>
                    <div style={learningCourseTitle}>简历优化实战</div>
                    <div style={learningCourseDesc}>HR筛选逻辑、关键词优化</div>
                    <div style={learningCoursePrice}>¥199</div>
                  </div>
                  <div style={learningCourseCardStyle}>
                    <div style={learningCourseIcon}>📕</div>
                    <div style={learningCourseTitle}>薪酬谈判技巧</div>
                    <div style={learningCourseDesc}>谈薪话术、福利争取</div>
                    <div style={learningCoursePrice}>¥159</div>
                  </div>
                </div>
              )}

              {courseTab === '已购' && (
                <div style={demoListStyle}>
                  <div style={sectionTitleStyle}>已购课程</div>
                  {[
                    { title: "前端工程师面试宝典", progress: "已完成", date: "2026-03-15购买" },
                    { title: "LeetCode刷题指南", progress: "学习进度 75%", date: "2026-02-28购买" },
                    { title: "产品经理入门课", progress: "学习进度 30%", date: "2026-01-10购买" }
                  ].map((course, index) => (
                    <div key={index} style={purchasedCourseItemStyle}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{fontWeight:'bold', fontSize:'14px'}}>{course.title}</div>
                        <div style={{fontSize:'12px', color:'#10B981'}}>{course.progress}</div>
                      </div>
                      <div style={{fontSize:'12px', color:'#999', marginTop:'4px'}}>{course.date}</div>
                      <button style={continueStudyBtnStyle}>继续学习</button>
                    </div>
                  ))}
                  <div style={emptyPurchasedStyle}>
                    <div style={{fontSize:'16px', color:'#999', marginBottom:'10px'}}>暂无更多已购课程</div>
                    <div style={{fontSize:'12px', color:'#666'}}>去首页探索更多优质课程</div>
                  </div>
                </div>
              )}
            </div>

            {codingDemo && (
              <div style={editorOverlay}>
                <div style={problemFloatingCard}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><b>题目：两数之和</b><span onClick={() => setCodingDemo(false)} style={{cursor:'pointer'}}>✕</span></div>
                  <p style={{fontSize:'12px', marginTop:'5px'}}>2026 字节跳动高频题：给定一个整数数组 nums 和目标值 target...</p>
                </div>
                <textarea style={editorArea} defaultValue={"/**\n * @param {number[]} nums\n * @param {number} target\n */\nvar twoSum = function(nums, target) {\n    \n};"} />
                <button onClick={() => setCodingDemo(false)} style={modalBtnStyle}>保存并退出</button>
              </div>
            )}
          </div>
        )}

        {/* --- 补充部分：社区页面 --- */}
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

        {/* --- 补充部分：我的页面 --- */}
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
              {[
                {n:'我的收藏', i:'⭐'}, {n:'我的offer', i:'📄'}, {n:'学习历史', i:'🕒'},
                {n:'购物车', i:'🛒'}, {n:'我的钱包', i:'💰'}, {n:'优惠券', i:'🎫'},
                {n:'购买记录', i:'🧾'}, {n:'面小助课程', i:'🎓'}
              ].map(item => (
                <div key={item.n} style={gridItem}>
                  <div style={gridIconPlaceholder}>{item.i}</div>
                  <div style={{fontSize:'12px', marginTop:'8px'}}>{item.n}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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

// ==================== 样式 (包含新增样式) ====================
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
const tagStyle: any = { fontSize: "11px", color: "#fff", padding: "3px 8px", borderRadius: "8px", border: "none", marginTop: "8px" };
const emptyStyle: any = { textAlign:'center', color:'#999', padding:'40px 0' };
const interviewPageStyle: any = { padding:'15px' };
const calendarCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px', marginBottom:'15px' };
const calendarHeaderStyle: any = { display:'flex', justifyContent:'space-between', marginBottom:'10px' };
const arrowStyle: any = { cursor:'pointer', color:'#3B82F6' };
const monthStyle: any = { fontWeight:'bold' };
const daysGridStyle: any = { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'5px' };
const dayStyle: any = { height:'35px', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'13px' };
const dayActiveStyle: any = { ...dayStyle, background:'#3B82F6', color:'#fff', borderRadius:'50%' };
const interviewDetailCardStyle: any = { background:'#fff', borderRadius:'15px', padding:'15px' };
const recordBtnStyle: any = { width:'100%', background:'#4F46E5', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', marginTop:'10px' };
const recordingControlsStyle: any = { marginTop:'10px' };
const stopRecordBtnStyle: any = { width:'100%', background:'#DC2626', color:'#fff', border:'none', padding:'12px', borderRadius:'12px' };
const recordingTimerStyle: any = { textAlign:'center', fontSize:'12px', color:'#DC2626', marginTop:'5px' };
const transcriptCardStyle: any = { background:'#F9FAFB', padding:'15px', borderRadius:'12px', marginTop:'10px' };
const transcriptTextStyle: any = { fontSize:'13px', lineHeight:'1.5' };
const reportBtnStyle: any = { width:'100%', background:'#10B981', color:'#fff', border:'none', padding:'12px', borderRadius:'12px', marginTop:'10px' };
const reportPageStyle: any = { padding:'20px' };
const aiBubbleStyle: any = { background:'#DBEAFE', padding:'20px', borderRadius:'15px', fontSize:'14px', whiteSpace:'pre-wrap' };

// 课程与社区样式
const coursePageStyle: any = { padding:'15px' };
const courseGridStyle: any = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' };
const courseCardStyle: any = { background:'#fff', padding:'20px', borderRadius:'15px', textAlign:'center', cursor:'pointer' };
const courseIconStyle: any = { fontSize:'24px', marginBottom:'8px' };
const demoListStyle: any = { marginTop:'20px' };
const demoItemStyle: any = { background:'#fff', padding:'12px', borderRadius:'10px', marginBottom:'10px', fontSize:'13px' };
const editorOverlay: any = { position:'absolute', inset:0, background:'#1e1e1e', color:'#fff', zIndex:100, padding:'20px', display:'flex', flexDirection:'column' };
const problemFloatingCard: any = { background:'#333', padding:'15px', borderRadius:'12px', marginBottom:'15px' };
const editorArea: any = { flex:1, background:'#252526', color:'#fff', padding:'15px', fontFamily:'monospace', border:'none', outline:'none', borderRadius:'8px' };
const sectionTitleStyle: any = { fontSize:'16px', fontWeight:'bold', margin:'15px 0 10px 0' };

// 我的页面样式
const profilePageStyle: any = { background: "#fff", height: "100%" };
const profileHeaderLight: any = { padding: "30px 20px" };
const userInfoCard: any = { display: "flex", alignItems: "center" };
const avatarStyleLight: any = { width: "50px", height: "50px", borderRadius: "25px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px" };
const levelCard: any = { margin:'0 20px', padding:'15px', background:'#f8f8f8', borderRadius:'12px', position:'relative' };
const progressBarBg: any = { height:'4px', background:'#eee', borderRadius:'2px', overflow:'hidden' };
const progressBarFill: any = { height:'100%', background:'#FFD700' };
const xTag: any = { position:'absolute', right:'15px', bottom:'10px', fontSize:'10px', color:'#999' };
const gridMenu: any = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "20px 10px", gap:'15px' };
const gridItem: any = { textAlign: "center" };
const gridIconPlaceholder: any = { fontSize: "22px" };

// 通用组件
const bottomBarStyle: any = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: any = { fontSize: "12px", color: "#999", cursor:'pointer' };
const bottomActiveStyle: any = { ...bottomItemStyle, color: "#3B82F6", fontWeight:'bold' };
const bottomAddStyle: any = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer' };
const modalStyle: any = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: any = { width: "300px", background: "#fff", borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", gap: "15px" };
const modalCloseStyle: any = { alignSelf: "flex-end", background: "none", border: "none", fontSize:'20px' };
const modalBtnStyle: any = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor:'pointer' };
const inputStyle: any = { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #eee' };
const subTitleStyle: any = { fontSize:'11px', color:'#999', marginBottom:'5px' };
const detailTextStyle: any = { fontSize:'14px', marginBottom:'5px' };
