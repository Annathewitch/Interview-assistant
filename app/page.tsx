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
  
  // 1. 用户指引状态
  const [showGuide, setShowGuide] = useState(false);

  // 2. 课程二级页面与代码编辑状态
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

  // 初始化逻辑
  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    setJobs(j);
    // 如果没有岗位，触发新手引导
    if (j.length === 0) setShowGuide(true);
  }, []);

  const saveJobs = (data: Job[]) => {
    setJobs(data);
    localStorage.setItem("jobs", JSON.stringify(data));
  };

  const addJob = () => {
    if (!company || !role) return;
    const newJob: Job = { id: Date.now(), company, role, salary: "15k-25k", location: "远程", status: "刚投递" };
    saveJobs([newJob, ...jobs]);
    setShowJobForm(false);
    setCompany(""); setRole("");
    setShowGuide(false); // 完成创建，关闭引导
  };

  return (
    <div style={appContainer}>
      {/* 顶部标题栏 */}
      <div style={headerStyle}>
        <div style={logoStyle}>{bottomTab === "我的" ? "个人中心" : "求职助手"}</div>
        {bottomTab !== "我的" && <input placeholder="搜索公司/岗位" style={searchStyle} />}
      </div>

      <div style={contentStyle}>
        {/* 首页内容 */}
        {bottomTab === "首页" && (
          <>
            <div style={topTabBarStyle}>
              {["岗位", "面试", "复盘"].map((t) => (
                <div key={t} onClick={() => setTopTab(t as any)}
                  style={topTab === t ? topTabActiveStyle : topTabItemStyle}>{t}</div>
              ))}
            </div>
            <div style={listStyle}>
              {jobs.length === 0 && <div style={emptyStyle}>暂无岗位，点击下方 + 开始</div>}
              {jobs.map(job => (
                <div key={job.id} style={cardStyle}>
                  <div style={titleStyle}>{job.role}</div>
                  <div style={infoStyle}>{job.company}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 课程页面 (包含题库和编程测试) */}
        {bottomTab === "课程" && (
          <div style={coursePageStyle}>
            {!courseSubPage ? (
              <div style={courseGridStyle}>
                <div style={courseCardStyle} onClick={() => setCourseSubPage("笔试题库")}>
                  <div style={courseIconStyle}>📝</div><div>笔试题库</div>
                </div>
                <div style={courseCardStyle}><div style={courseIconStyle}>📘</div><div>面试高频题</div></div>
              </div>
            ) : (
              <div>
                <div style={subHeaderTabs}>
                  {["专项练习", "笔试真题", "在线编程"].map(t => (
                    <span key={t} onClick={() => setCourseSubPage(t)} style={courseSubPage === t ? subTabActive : subTab}>{t}</span>
                  ))}
                </div>
                {codingDemo ? (
                   /* 代码编辑功能部分 */
                   <div style={editorOverlay}>
                    <div style={problemFloatingCard}>
                      <b>题目：两数之和</b>
                      <p style={{fontSize:'12px', margin:'5px 0 0'}}>给定一个整数数组 nums 和一个目标值 target，请在该数组中找出和为目标值的那两个整数。</p>
                    </div>
                    <textarea style={editorArea} defaultValue={`function twoSum(nums, target) {\n  // 在这里编写代码\n}`} />
                    <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                      <button onClick={() => setCodingDemo(false)} style={{...modalBtnStyle, background:'#666'}}>退出</button>
                      <button style={{...modalBtnStyle, flex:2}}>运行代码</button>
                    </div>
                   </div>
                ) : (
                  <div style={listStyle}>
                    <div style={cardStyle} onClick={() => setCodingDemo(true)}>
                       <div style={titleStyle}>LeetCode 1. 两数之和</div>
                       <div style={{...infoStyle, color:'#3B82F6', marginTop:'5px'}}>点击进入在线编程Demo</div>
                    </div>
                    <button onClick={() => setCourseSubPage(null)} style={{background:'none', border:'none', color:'#999', marginTop:'20px'}}>← 返回</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* “我的” 页面 (去掉紫色，保持原有浅色调) */}
        {bottomTab === "我的" && (
          <div style={profilePageStyle}>
            <div style={profileHeaderLight}>
              <div style={{display:'flex', justifyContent:'space-between', padding:'10px 20px', fontSize:'18px'}}>
                <span>⚙️</span><span>🔍 ✉️</span>
              </div>
              <div style={userInfoCard}>
                <div style={avatarStyleLight}>头像</div>
                <div style={{marginLeft:'15px'}}>
                  <div style={{fontSize:'18px', fontWeight:'bold', color:'#333'}}>教父Corleone <span>&gt;</span></div>
                  <div style={{fontSize:'12px', color:'#999', marginTop:'5px'}}>0 粉丝 · 5 关注 · 2 动态</div>
                </div>
              </div>
            </div>

            <div style={levelCard}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'8px'}}>
                <span>KG.0 <span style={{color:'#999', fontSize:'11px'}}>570成长值</span></span>
                <span style={{color:'#999'}}>等级中心 &gt;</span>
              </div>
              <div style={progressBarBg}>
                <div style={{...progressBarFill, width:'45%'}}></div>
              </div>
              <span style={xTag}>x1.0</span>
            </div>

            <div style={sectionBar}>
              <span>徽章</span>
              <span style={{color:'#999'}}>1 &gt;</span>
            </div>

            <div style={gridMenu}>
              {[
                {n:'我的收藏', i:'⭐'}, {n:'我的offer', i:'📄'}, {n:'学习历史', i:'🕒'},
                {n:'购物车', i:'🛒'}, {n:'我的钱包', i:'💰'}, {n:'优惠券', i:'🎫'},
                {n:'购买记录', i:'🧾'}, {n:'面小助课程', i:'🎓'}
              ].map(item => (
                <div key={item.n} style={gridItem}>
                  <div style={gridIconPlaceholder}>{item.i}</div>
                  <div style={{fontSize:'12px', marginTop:'8px', color:'#444'}}>{item.n}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div style={bottomBarStyle}>
        {["首页", "课程", "+", "社区", "我的"].map((tab) => (
          tab === "+" ? 
          <div key={tab} onClick={() => setShowAddPop(true)} style={bottomAddStyle}>+</div> :
          <div key={tab} onClick={() => setBottomTab(tab)} style={bottomTab === tab ? bottomActiveStyle : bottomItemStyle}>{tab}</div>
        ))}
      </div>

      {/* 3. 用户指引层 */}
      {showGuide && (
        <div style={guideOverlay}>
          <div style={guideBubble}>
            <h3 style={{margin:'0 0 10px'}}>新手任务 🚀</h3>
            <p style={{fontSize:'14px', color:'#666', lineHeight:'1.5'}}>欢迎！你还没有投递岗位，请点击下方的 <b style={{color:'#3B82F6'}}>“+”</b> 号按钮创建第一个岗位，开启你的求职之旅。</p>
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:'15px'}}>
               <button onClick={() => setShowGuide(false)} style={guideBtn}>我知道了</button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗部分 */}
      {showAddPop && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={modalCloseStyle} onClick={() => setShowAddPop(false)}>✕</button>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>新建岗位</button>
            <button onClick={() => setShowAddPop(false)} style={{...modalBtnStyle, background:'#f3f4f6', color:'#666'}}>取消</button>
          </div>
        </div>
      )}

      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3 style={{margin:'0 0 10px'}}>添加新投递</h3>
            <input style={inputStyle} placeholder="公司名称" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="投递岗位" value={role} onChange={e=>setRole(e.target.value)} />
            <button onClick={addJob} style={modalBtnStyle}>确认保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 样式定义 ---
const appContainer: CSSProperties = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "35px", overflow: "hidden", position: "relative", boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border:'8px solid #333' };
const headerStyle: CSSProperties = { background: "#fff", padding: "20px 20px 10px", display: "flex", alignItems: "center", gap: "10px" };
const logoStyle: CSSProperties = { fontSize: "18px", fontWeight: "bold", color:'#333' };
const searchStyle: CSSProperties = { flex: 1, padding: "8px 14px", borderRadius: "20px", background: "#F3F4F6", border: "none", outline: "none" };
const topTabBarStyle: CSSProperties = { display: "flex", background: "#fff", borderBottom: "1px solid #eee" };
const topTabItemStyle: CSSProperties = { flex: 1, textAlign: "center", padding: "12px 0", fontSize: "14px", color: "#999" };
const topTabActiveStyle: CSSProperties = { ...topTabItemStyle, color: "#3B82F6", fontWeight: 600, borderBottom: "2px solid #3B82F6" };
const contentStyle: CSSProperties = { height: "calc(100% - 150px)", overflowY: "auto" };
const listStyle: CSSProperties = { padding: "15px" };
const cardStyle: CSSProperties = { background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const titleStyle: CSSProperties = { fontSize: "16px", fontWeight: 600 };
const infoStyle: CSSProperties = { fontSize: "14px", color: "#666", marginTop:'4px' };
const emptyStyle: CSSProperties = { textAlign: "center", color: "#999", marginTop: "100px" };

// “我的” 页面 - 浅色调样式
const profilePageStyle: CSSProperties = { background: "#fff", height: "100%" };
const profileHeaderLight: CSSProperties = { background: "#fff", paddingBottom: "20px" };
const userInfoCard: CSSProperties = { display: "flex", alignItems: "center", padding: "10px 20px" };
const avatarStyleLight: CSSProperties = { width: "65px", height: "65px", borderRadius: "50%", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "12px", color: "#999", border:'2px solid #fff', boxShadow:'0 2px 10px rgba(0,0,0,0.1)' };
const levelCard: CSSProperties = { margin: "0 15px 15px", background: "#fff", borderRadius: "16px", padding: "18px", boxShadow: "0 8px 20px rgba(0,0,0,0.06)", border:'1px solid #f0f0f0' };
const progressBarBg: CSSProperties = { height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" };
const progressBarFill: CSSProperties = { height: "100%", background: "#3B82F6" };
const xTag: CSSProperties = { fontSize: "10px", color: "#fff", background: "#3B82F6", padding: "2px 8px", borderRadius: "10px", marginTop: "8px", display: "inline-block" };
const sectionBar: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "15px 20px", borderTop: "8px solid #f9f9f9", fontWeight: 500 };
const gridMenu: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "10px" }; // 改为4列更清爽
const gridItem: CSSProperties = { textAlign: "center", padding: "15px 5px" };
const gridIconPlaceholder: CSSProperties = { width: "40px", height: "40px", background: "#fff", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", borderRadius:'10px', border:'1px solid #eee' };

// 引导层样式
const guideOverlay: CSSProperties = { position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" };
const guideBubble: CSSProperties = { background: "#fff", padding: "25px", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", textAlign: "left" };
const guideBtn: CSSProperties = { background: "#3B82F6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "12px", fontWeight: "bold" };

// 底部导航与通用
const bottomBarStyle: CSSProperties = { position: "absolute", bottom: 0, width: "100%", height: "80px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingBottom:'10px' };
const bottomItemStyle: CSSProperties = { fontSize: "12px", color: "#bbb" };
const bottomActiveStyle: CSSProperties = { ...bottomItemStyle, color: "#3B82F6", fontWeight:'bold' };
const bottomAddStyle: CSSProperties = { width: "50px", height: "50px", background: "#3B82F6", borderRadius: "50%", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "28px", boxShadow:'0 4px 15px rgba(59, 130, 246, 0.4)' };
const modalStyle: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 };
const modalContentStyle: CSSProperties = { width: "320px", background: "#fff", borderRadius: "24px", padding: "25px", display: "flex", flexDirection: "column", gap: "15px" };
const modalCloseStyle: CSSProperties = { alignSelf: "flex-end", background: "none", border: "none", color:'#ccc', fontSize:'20px' };
const modalBtnStyle: CSSProperties = { background: "#3B82F6", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontWeight:'bold' };
const inputStyle: CSSProperties = { padding: "14px", border: "1px solid #eee", borderRadius: "12px", outline:'none', background:'#f9f9f9' };

// 课程题库及编辑器样式
const coursePageStyle: CSSProperties = { padding: '20px' };
const courseGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const courseCardStyle: CSSProperties = { background: '#fff', borderRadius: '16px', padding: '25px 15px', textAlign: 'center', boxShadow:'0 4px 12px rgba(0,0,0,0.04)' };
const courseIconStyle: CSSProperties = { fontSize: '32px', marginBottom: '10px' };
const subHeaderTabs: CSSProperties = { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' };
const subTab: CSSProperties = { fontSize: '14px', color: '#999' };
const subTabActive: CSSProperties = { ...subTab, color: '#3B82F6', fontWeight: 'bold' };
const editorOverlay: CSSProperties = { position: 'absolute', inset: 0, background: '#1e1e1e', color: '#fff', zIndex: 100, padding: '20px', display:'flex', flexDirection:'column' };
const problemFloatingCard: CSSProperties = { background: '#2d2d2d', padding: '15px', borderRadius: '12px', marginBottom: '15px', borderLeft:'4px solid #3B82F6' };
const editorArea: CSSProperties = { flex:1, background: '#252526', color: '#d4d4d4', padding: '15px', fontFamily: 'monospace', border: 'none', borderRadius:'12px', resize:'none', outline:'none', fontSize:'14px', lineHeight:'1.6' };
