const realFetch = window.fetch.bind(window);
const key = "sein_static_demo_session";
const state = {
  schema: 1,
  legacyMigration: null,
  company: { name: "세인코퍼레이션", englishName: "SEIN CORPORATION", address: "", phone: "", email: "" },
  tags: ["확인 필요", "견적 요청", "물류", "완료"],
  categories: [
    { id: "used", name: "중고 설비", type: "business", fixed: true, version: 1 },
    { id: "asahi", name: "아사히 세이키", type: "drive", fixed: true, version: 1 }
  ],
  users: [{ id: "demo-master", name: "로컬 관리자", email: "master@example.test", role: "master", active: true, version: 1, permissions: {} }],
  me: { id: "demo-master", name: "로컬 관리자", email: "master@example.test", role: "master", active: true, version: 1, permissions: {}, searchPreferences: { recent: [], favorites: [] } },
  equipment: [], customers: [], deals: [], quotes: [], folders: [], files: [], memos: [], events: [], sheets: [], dashboardNotes: [],
  cashEntries: [], cashAccounts: [], cashCategories: [], purchases: [], mailTemplates: [], logs: [], notifications: [], trash: [],
  storage: { used: 0, limit: 1000000000 }
};
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8" }
});
window.fetch = async (input, init = {}) => {
  const raw = typeof input === "string" ? input : input?.url || "";
  const url = new URL(raw, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  if (url.pathname === "/api/config")
    return reply({ demo: true, company: "세인코퍼레이션", emailConfigured: false });
  if (url.pathname === "/api/login") {
    let body = {};
    try { body = JSON.parse(init.body || "{}"); } catch {}
    if (!body.demo) return reply({ error: "로컬 검토용 계정으로 시작해 주세요." }, 401);
    localStorage.setItem(key, "1");
    return reply({ ok: true });
  }
  if (url.pathname === "/api/logout") {
    localStorage.removeItem(key);
    return reply({ ok: true });
  }
  if (url.pathname === "/api/state") {
    if (localStorage.getItem(key) !== "1")
      return reply({ error: "로그인이 필요합니다." }, 401);
    return reply({ state: structuredClone(state), digests: {}, revision: "static-demo-1" });
  }
  if (url.pathname === "/api/rates")
    return reply({ error: "환율 서버가 연결되지 않았습니다." }, 503);
  if (url.pathname === "/api/command")
    return reply({ error: "현재 링크는 화면 확인용 정적 미리보기입니다." }, 400);
  return reply({ error: "현재 링크에서는 이 기능을 사용할 수 없습니다." }, 404);
};