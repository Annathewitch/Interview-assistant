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

const STATUS = ["刚投递", "已测评", "一面", "二面", "三面", "HR面", "Offer", "已挂"];

export default function Page() {
  const [bottomTab, setBottomTab] = useState("首页");
  const [topTab, setTopTab] = useState<"岗位" | "面试" | "复盘">("岗位");
  
  // 功能状态
  const [showGuide, setShowGuide] = useState(false);
  const [codingDemo, setCodingDemo] = useState(false);

  // 核心数据
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showAddPop, setShowAddPop] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  // 岗位表单字段
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("刚投递");

  useEffect(() => {
    const j = JSON.parse(localStorage.getItem("jobs") || "[]");
    setJobs(j);
    if (j.length === 0) setShowGuide(true);
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
    setCompany(""); setRole(""); setSalary(""); setLocation(""); setStatus("刚投递");
    setShowGuide(false);
  };

  return (
    <div style={appContainer}>
      {/* 顶部 Header */}
      <div style={headerStyle}>
        <div style={logoStyle}>{bottomTab === "我的" ? "个人中心" : "求职助手"}</div>
        {bottomTab !== "我的" && <input placeholder="搜索公司/岗位" style={searchStyle} />}
      </div>

      <div style={contentStyle}>
        {/* 1. 首页逻辑 */}
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
                    <div style={{fontSize:'12px', color:'#999', marginTop:'2px'}}>{job.location}</div>
                    <button style={{ ...tagStyle, backgroundColor: "#3B82F6" }}>{job.status}</button>
                  </div>
                ))}
              </div>
            )}
            {topTab !== "岗位" && <div style={emptyStyle}>内容开发中...</div>}
          </>
        )}

        {/* 2. 课程页面：按照你要求的结构重组 */}
        {bottomTab === "课程" && (
          <div style={coursePageStyle}>
            {/* 上部网格卡片 */}
            <div style={courseGridStyle}>
              <div style={courseCardStyle}><div style={courseIconStyle}>📘</div><div>面试高频题</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📗</div><div>产品思维课</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📙</div><div>项目复盘</div></div>
              <div style={courseCardStyle}><div style={courseIconStyle}>📕</div><div>行业面经</div></div>
            </div>

            {/* 下部 Demo 列表 */}
            <div style={demoListStyle}>
              <div style={demoItemStyle}>Demo：笔试真题</div>
              <div style={demoItemStyle}>Demo：面试真题</div>
              <div style={demoItemStyle}>Demo：专项练习</div>
              <div style={{...demoItemStyle, color:'#3B82F6', fontWeight:'bold'}} onClick={() => setCodingDemo(true)}>
                Demo：在线编程 (可点击测试)
              </div>
            </div>

            {/* 在线编程代码编辑层 */}
            {codingDemo && (
              <div style={editorOverlay}>
                <div style={problemFloatingCard}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <b>题目：两数之和</b>
                    <span onClick={() => setCodingDemo(false)} style={{cursor:'pointer'}}>✕</span>
                  </div>
                  <p style={{fontSize:'12px', marginTop:'5px'}}>给定 nums = [2, 7, 11, 15], target = 9。找出索引。</p>
                </div>
                <textarea style={editorArea} defaultValue={`function twoSum(nums, target) {\n  // 模拟编程区域\n}`} />
                <button onClick={() => setCodingDemo(false)} style={modalBtnStyle}>提交代码并退出</button>
              </div>
            )}
          </div>
        )}

        {/* 3. “我的”页面：删除 KG.0 */}
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
                <span style={{color:'#999', fontSize:'11px'}}>570成长值</span>
                <span style={{color:'#999'}}>等级中心 &gt;</span>
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

      {/* 底部 Tab */}
      <div style={bottomBarStyle}>
        {["首页", "课程", "+", "社区", "我的"].map((tab) => (
          tab === "+" ? 
          <div key={tab} onClick={() => setShowAddPop(true)} style={bottomAddStyle}>+</div> :
          <div key={tab} onClick={() => setBottomTab(tab)} style={bottomTab === tab ? bottomActiveStyle : bottomItemStyle}>{tab}</div>
        ))}
      </div>

      {/* 新手引导 */}
      {showGuide && (
        <div style={guideOverlay}>
          <div style={guideBubble}>
            <h3 style={{margin:'0 0 10px'}}>Hello 🚀</h3>
            <p style={{fontSize:'14px', lineHeight:1.5}}>欢迎来到求职助手！点击下方的 <b style={{color:'#3B82F6'}}>“+”</b> 开启你的第一份投递记录吧。</p>
            <button onClick={() => setShowGuide(false)} style={guideBtn}>开始探索</button>
          </div>
        </div>
      )}

      {/* 新建岗位弹窗 */}
      {showJobForm && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button style={modalCloseStyle} onClick={() => setShowJobForm(false)}>✕</button>
            <h3 style={{margin:'0 0 10px'}}>新建投递</h3>
            <input style={inputStyle} placeholder="公司" value={company} onChange={e=>setCompany(e.target.value)} />
            <input style={inputStyle} placeholder="岗位" value={role} onChange={e=>setRole(e.target.value)} />
            <input style={inputStyle} placeholder="薪资" value={salary} onChange={e=>setSalary(e.target.value)} />
            <input style={inputStyle} placeholder="Base地" value={location} onChange={e=>setLocation(e.target.value)} />
            <select style={inputStyle} value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={addJob} style={modalBtnStyle}>确认</button>
          </div>
        </div>
      )}

      {showAddPop && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => { setShowJobForm(true); setShowAddPop(false); }} style={modalBtnStyle}>新建岗位</button>
            <button onClick={() => setShowAddPop(false)} style={{background:'none', border:'none', color:'#999'}}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 样式定义 ---
const appContainer: CSSProperties = { width: "390px", height: "844px", margin: "20px auto", background: "#F9FAFB", borderRadius: "30px", overflow: "hidden", position: "relative", border:'1px solid #ddd' };
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
const emptyStyle: CSSProperties = { textAlign: "center", color: "#999", marginTop: "100px" };

// 课程页面特有样式
const coursePageStyle: CSSProperties = { padding: '15px' };
const courseGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' };
const courseCardStyle: CSSProperties = { background: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const courseIconStyle: CSSProperties = { fontSize: '30px', marginBottom: '10px' };
const demoListStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const demoItemStyle: CSSProperties = { background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', cursor: 'pointer' };

// 我的页面样式
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

// 导航与通用
const bottomBarStyle: CSSProperties = { position: "absolute", bottom: 0, width: "100%", height: "70px", background: "#fff", display: "flex", justifyContent: "space-around", alignItems: "center", borderTop: "1px solid #eee" };
const bottomItemStyle: CSSProperties = { fontSize: "12px", color: "#999" };
const bottomActiveStyle: CSSProperties = { ...bottomItemStyle, color: "#3B82F6", fontWeight: 'bold' };
const bottomAddStyle: CSSProperties = { width: "45px", height: "45px", background: "#3B82F6", borderRadius: "50%", color: "#fff", fontSize: "24px", display:'flex', justifyContent:'center', alignItems:'center' };
const modalStyle: CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContentStyle: CSSProperties = { width: "320px", background: "#fff", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" };
const modalCloseStyle: CSSProperties = { alignSelf: "flex-end", background: "none", border: "none", fontSize: "18px" };
const modalBtnStyle: CSSProperties = { background: "#3B82F6", color: "#fff", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold" };
const inputStyle: CSSProperties = { padding: "12px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "14px" };
const guideOverlay: CSSProperties = { position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display:'flex', justifyContent:'center', alignItems:'center' };
const guideBubble: CSSProperties = { background: "#fff", padding: "20px", borderRadius: "15px", width: "280px" };
const guideBtn: CSSProperties = { background: "#3B82F6", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", marginTop: "15px" };
const editorOverlay: CSSProperties = { position: 'absolute', inset: 0, background: '#1e1e1e', color: '#fff', zIndex: 100, padding: '20px', display:'flex', flexDirection:'column' };
const problemFloatingCard: CSSProperties = { background: '#333', padding: '15px', borderRadius: '10px', marginBottom: '10px' };
const editorArea: CSSProperties = { flex: 1, background: '#252526', color: '#fff', padding: '10px', fontFamily: 'monospace', border: 'none', borderRadius: '8px', marginBottom:'10px' };
