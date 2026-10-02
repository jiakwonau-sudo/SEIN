const realFetch = window.fetch.bind(window);
const sessionKey = "sein_static_demo_session";
const dbName = "sein-handoff-local";
const dbVersion = 1;
const stateKey = "workspace";

const nowIso = () => new Date().toISOString();
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const clone = (v) => structuredClone(v);
const arrays = [
  "equipment","customers","deals","quotes","folders","files","memos","events","sheets","dashboardNotes",
  "cashEntries","cashAccounts","cashCategories","purchases","mailTemplates","mailCampaigns","logs","notifications","jobs"
];

function seedState() {
  const user = { id:"demo-master", name:"로컬 관리자", email:"master@example.test", role:"master", active:true, version:1, permissions:{}, searchPreferences:{recent:[],favorites:[]} };
  return {
    schema:1,
    legacyMigration:null,
    company:{ name:"세인코퍼레이션", englishName:"SEIN CORPORATION", address:"", phone:"", email:"" },
    tags:["확인 필요","견적 요청","물류","완료"],
    categories:[
      { id:"used", name:"중고 설비", type:"business", fixed:true, version:1 },
      { id:"asahi", name:"아사히 세이키", type:"drive", fixed:true, version:1 }
    ],
    users:[user],
    equipment:[], customers:[], deals:[], quotes:[], folders:[], files:[], memos:[], events:[], sheets:[], dashboardNotes:[],
    cashEntries:[], cashAccounts:[], cashCategories:[], purchases:[], mailTemplates:[], mailCampaigns:[], logs:[], notifications:[], jobs:[],
    storageLimitBytes:1_000_000_000,
    __revision:1
  };
}

function ensureState(s) {
  s ||= seedState();
  for (const k of arrays) if (!Array.isArray(s[k])) s[k] = [];
  if (!Array.isArray(s.tags)) s.tags = ["확인 필요","견적 요청","물류","완료"];
  if (!Array.isArray(s.categories)) s.categories = seedState().categories;
  if (!Array.isArray(s.users) || !s.users.length) s.users = seedState().users;
  if (!s.company) s.company = seedState().company;
  if (!s.storageLimitBytes) s.storageLimitBytes = 1_000_000_000;
  if (!s.__revision) s.__revision = 1;
  return s;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, dbVersion);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const req = tx.objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { const e = tx.error; db.close(); reject(e); };
  });
}

const DEMO_COVERAGE = {"equipmentBase":[["demo-eq-1","AIDA","NC1-200(D)","SEIN-U-2601","프레스","기계식 프레스",200,"공장",78000000,"Japan","양주 창고","검수완료","시운전완료",true],["demo-eq-2","KOMATSU","OBS-110-3","SEIN-U-2602","프레스","기계식 프레스",110,"공장",42000000,"Japan","인천 보세창고","검수완료","시운전완료",false],["demo-eq-3","AMADA","TP-150","SEIN-U-2603","프레스","기계식 프레스",150,"항구 이동",51000000,"Japan","요코하마","검수완료","미시운전",true],["demo-eq-4","MORI SEIKI","NVX5100","SEIN-U-2604","머시닝센터","수직 머시닝센터",0,"수입 완료",88000000,"Japan","부산항","검수완료","시운전완료",false],["demo-eq-5","OKUMA","MB-56VA","SEIN-U-2605","머시닝센터","수직 머시닝센터",0,"창고 입고",64000000,"Japan","양주 창고","검수완료","시운전완료",false],["demo-eq-6","MAZAK","INTEGREX 200","SEIN-U-2606","NC선반","복합가공기",0,"공장",92000000,"Japan","오사카 공장","미검수","미시운전",true],["demo-eq-7","ASAHI-SEIKI","TP-45","SEIN-U-2607","프레스","고속 프레스",45,"창고 입고",29000000,"Japan","평택 창고","검수완료","시운전완료",false],["demo-eq-8","BRUDERER","BSTA 60","SEIN-U-2608","프레스","고속 프레스",60,"공장",135000000,"Switzerland","독일 파트너 창고","검수완료","시운전완료",true],["demo-eq-9","MINSTER","P2-100","SEIN-U-2609","프레스","고속 프레스",100,"공장",118000000,"USA","미국 파트너 창고","검수완료","시운전완료",false],["demo-eq-10","FANUC","ROBODRILL α-D21","SEIN-U-2610","머시닝센터","드릴링센터(탭핑)",0,"수입 완료",37000000,"Japan","부산항","검수완료","미시운전",false],["demo-eq-11","DOOSAN","PUMA 2600","SEIN-U-2611","NC선반","NC 선반",0,"창고 입고",31000000,"Korea","양주 창고","검수완료","시운전완료",false],["demo-eq-12","HYUNDAI WIA","KH63G","SEIN-U-2612","머시닝센터","수평 머시닝센터",0,"공장",76000000,"Korea","창원 공장","미검수","미시운전",false]],"syntheticCustomers":[["demo-c-1","한빛정밀","Korea","End user","한국 End User(프레스)"],["demo-c-2","태성테크","Korea","Dealer","한국 딜러 (공작기계)"],["demo-c-3","Mirae Automation","Korea","End user","자동화 고객"],["demo-c-4","Nippon Machine Trading","Japan","Dealer","일본 딜러"],["demo-c-5","Pacific Industrial Equipment","USA","Dealer","미주 딜러"],["demo-c-6","Euro Forming Systems","Germany","Dealer","유럽딜러"],["demo-c-7","Siam Metal Works","Thailand","End user","동남아 End User"],["demo-c-8","Vietnam Precision","Vietnam","End user","동남아 End User"]],"dealBase":[["demo-deal-1","AIDA 200톤 제안","진행중",[["demo-eq-1",138000000,78000000]],"2026-09-20"],["demo-deal-2","고속프레스 2대 수출","확정",[["demo-eq-7",52000000,29000000],["demo-eq-8",198000000,135000000]],"2026-08-12"],["demo-deal-3","MORI SEIKI 머시닝센터 판매","확정",[["demo-eq-4",128000000,88000000]],"2026-07-03"],["demo-deal-4","MAZAK 복합가공기 수출 협의","진행중",[["demo-eq-6",146000000,92000000]],"2026-09-28"],["demo-deal-5","KOMATSU 110톤 제안","무산",[["demo-eq-2",69000000,42000000]],"2026-06-16"],["demo-deal-6","FANUC 탭핑센터 2차 견적","진행중",[["demo-eq-10",61000000,37000000]],"2026-10-01"],["demo-deal-7","DOOSAN 선반 국내 판매","확정",[["demo-eq-11",49000000,31000000]],"2026-09-05"],["demo-deal-8","HYUNDAI WIA 수평MC 제안","진행중",[["demo-eq-12",112000000,76000000]],"2026-09-30"]]};

function addMissingById(list, rows) {
  const ids = new Set((list || []).map(function(x){ return x.id; }));
  let added = 0;
  for (const row of rows) {
    if (!ids.has(row.id)) {
      list.push(row);
      ids.add(row.id);
      added++;
    }
  }
  return added;
}
function demoMeta(id, at) {
  return { id:id, version:1, createdAt:at || "2026-09-01T09:00:00+09:00", updatedAt:at || "2026-09-01T09:00:00+09:00", createdBy:"demo-master", updatedBy:"demo-master", lock:"none" };
}
function applyCoverage(s) {
  s = ensureState(s);
  if (Number(s.__coverageVersion || 0) >= 5) return false;
  let changed = false;

  const fillers = DEMO_COVERAGE.syntheticCustomers.map(function(r, i){
    return Object.assign({}, demoMeta(r[0], "2026-0" + ((i%8)+1) + "-0" + ((i%9)+1) + "T09:00:00+09:00"), {
      name:r[1], country:r[2], kind:r[3], groupName:r[4], blocked:false, importance:String((i%3)+1),
      registeredOn:"2026-0"+((i%8)+1)+"-0"+((i%9)+1),
      contacts:[{name:["김민수","박지훈","이서연","Kenji Sato","Alex Brown","Lena Fischer","Narin Chai","Minh Nguyen"][i],department:"구매팀",position:i%2?"Manager":"팀장",phone:"",email:"contact"+(i+1)+"@example.com"}],
      productInterest:i%2?"프레스 / 기계식 프레스":"머시닝센터 / 수직 머시닝센터",
      interestClass:i%2?"프레스":"머시닝센터", interestSubclass:i%2?"기계식 프레스":"수직 머시닝센터",
      legacyInterests:[], note:"로컬 데모 데이터 · 폼/대시보드 검증용", legacySourceId:"", legacyConsent:"동의", legacyOrigin:"local-demo", legacyUrl:""
    });
  });
  for (const row of fillers) {
    if (!s.customers.some(function(x){return x.id===row.id;})) { s.customers.push(row); changed=true; }
  }

  const customerExtras = [
    ["demo-c-1","프레스","기계식 프레스","프레스","기계식 프레스","100","300"],
    ["demo-c-2","머시닝센터","수직 머시닝센터","머시닝센터","수직 머시닝센터","0","0"],
    ["demo-c-3","자동화","기타 자동화","프레스","기계식 프레스","80","250"],
    ["demo-c-4","프레스","고속 프레스","프레스","고속 프레스","30","100"],
    ["demo-c-5","프레스","기계식 프레스","프레스","고속 프레스","50","300"],
    ["demo-c-6","프레스","기계식 프레스","프레스","기계식 프레스","100","500"],
    ["demo-c-7","프레스","유압 프레스","프레스","유압 프레스","150","500"],
    ["demo-c-8","NC선반","NC 선반","NC선반","복합가공기","0","0"]
  ];
  customerExtras.forEach(function(x,i){
    const row=s.customers.find(function(r){return r.id===x[0];});
    if(!row) return;
    const next={
      importance:row.importance||String((i%3)+1),registeredOn:row.registeredOn||("2026-0"+((i%8)+1)+"-0"+((i%9)+1)),
      interestClass:x[1],interestSubclass:x[2],wantedClass:x[3],wantedSubclass:x[4],
      wantedTonsMin:x[5],wantedTonsMax:x[6],productInterest:(row.productInterest||"")+" · "+x[1]+" / "+x[2],
      note:(row.note||"")+" · 주요 연락·설비 관심·톤수 범위 입력 완료"
    };
    Object.keys(next).forEach(function(k){ if(row[k]!==next[k]){row[k]=next[k];changed=true;} });
    if(Array.isArray(row.contacts)&&row.contacts[0]){
      const p=row.contacts[0];
      const phone=p.phone||("02-555-"+String(1100+i));
      const email=p.email||("contact"+(i+1)+"@example.com");
      const department=p.department||"구매팀";
      const position=p.position||"Manager";
      if(p.phone!==phone||p.email!==email||p.department!==department||p.position!==position){
        Object.assign(p,{phone:phone,email:email,department:department,position:position});changed=true;
      }
    }
  });

  const eqRows = DEMO_COVERAGE.equipmentBase.map(function(r, i){
    const id=r[0], maker=r[1], model=r[2], number=r[3], productClass=r[4], productSubclass=r[5], capacityTons=r[6], stage=r[7], buy=r[8], originCountry=r[9], storagePlace=r[10], inspectionStatus=r[11], testRunStatus=r[12], featured=r[13];
    return Object.assign({}, demoMeta(id, "2026-0"+((i%8)+1)+"-"+String((i%24)+1).padStart(2,"0")+"T09:00:00+09:00"), {
      maker:maker, model:model, number:number, categoryId:"used", productClass:productClass, productSubclass:productSubclass, capacityTons:capacityTons,
      stage:stage, buy:buy, currency:"KRW", vat:"excluded", taxRate:10, fx:1, note:maker+" "+model+" · 로컬 데모 설비",
      publicSpec:"Maker: "+maker+"\nModel: "+model+"\nCondition: inspected demo record",
      manufacturedYear:String(2008+(i%14)), manufacturedMonth:String((i%12)+1).padStart(2,"0"),
      dimensions:(3000+i*120)+" × "+(1800+i*45)+" × "+(2200+i*55)+" mm",
      dimensionLengthMm:3000+i*120, dimensionWidthMm:1800+i*45, dimensionHeightMm:2200+i*55,
      weightTons:String(8+i*1.5), originCountry:originCountry, storagePlace:storagePlace, inspectionStatus:inspectionStatus, testRunStatus:testRunStatus,
      similarEquipmentIds:[], featured:featured, askingPrice:Math.round(buy*1.28), askingCurrency:"KRW", saleTerms:"현장인도 / 협의 가능",
      listingStatus:"판매중", visibility:"노출", video:""
    });
  });
  if (addMissingById(s.equipment, eqRows)) changed=true;

  const equipmentExtras = [
    ["demo-eq-1",180,350,"Japan","양주 창고","현장도","양주","상차도","양주","계약금 30% / 잔금 출고 전"],
    ["demo-eq-2",150,320,"Japan","인천 보세창고","FOB","Yokohama","상차도","인천","계약금 20% / 잔금 출고 전"],
    ["demo-eq-3",140,300,"Japan","요코하마","현장도","Japan","CIF","Busan","T/T 50% + 50%"],
    ["demo-eq-4",0,0,"Japan","부산항","FOB","Osaka","상차도","부산","계약금 30% / 잔금 검수 후"],
    ["demo-eq-5",0,0,"Japan","양주 창고","현장도","Japan","상차도","양주","현금 / 협의"],
    ["demo-eq-6",0,0,"Japan","오사카 공장","FOB","Osaka","CIF","Busan","T/T"],
    ["demo-eq-7",40,220,"Japan","평택 창고","현장도","Japan","상차도","평택","계약금 30% / 잔금 출고 전"],
    ["demo-eq-8",25,200,"Switzerland","독일 파트너 창고","EXW","Germany","FOB","Hamburg","T/T"],
    ["demo-eq-9",50,260,"USA","미국 파트너 창고","EXW","USA","FOB","Long Beach","T/T"],
    ["demo-eq-10",0,0,"Japan","부산항","FOB","Japan","상차도","부산","현금 / 협의"],
    ["demo-eq-11",0,0,"Korea","양주 창고","상차도","양주","상차도","양주","계약금 30% / 잔금 출고 전"],
    ["demo-eq-12",0,0,"Korea","창원 공장","현장도","창원","상차도","창원","현금 / 협의"]
  ];
  equipmentExtras.forEach(function(x,i){
    const row=s.equipment.find(function(r){return r.id===x[0];});
    if(!row) return;
    const year=String(2008+(i%14)), month=String((i%12)+1).padStart(2,"0");
    const next={
      strokeMm:String(x[1]||""),dieHeightMm:String(x[2]||""),originCountry:x[3],equipmentLocation:x[4],
      transactionImportance:String((i%3)+1),transactionCountry:x[3],
      supplierId:row.supplierId||((s.customers[i%s.customers.length]||{}).id||""),introducedCustomerId:row.introducedCustomerId||((s.customers[(i+1)%s.customers.length]||{}).id||""),
      purchaseTerms:x[5],purchasePlace:x[6],saleTerms:x[7],salePlace:x[8],paymentTerms:x[9],
      askingCurrency:"KRW",listingStatus:row.listingStatus||"판매중",visibility:row.visibility||"노출",priceVisibility:"비노출",
      advertisingNumbers:"DEMO-"+String(i+1).padStart(3,"0"),descriptionKo:(row.descriptionKo||row.note||"")+" · 데모 국문 상품설명",
      descriptionEn:"Demo listing for "+row.maker+" "+row.model+". Inspected equipment for workflow testing.",
      descriptionJa:"デモ商品 "+row.maker+" "+row.model+"。業務フロー確認用です。",
      manufacturedYear:row.manufacturedYear||year,manufacturedMonth:row.manufacturedMonth||month,
      storagePlace:row.storagePlace||x[4],inspectionStatus:row.inspectionStatus||"검수완료",testRunStatus:row.testRunStatus||"시운전완료"
    };
    Object.keys(next).forEach(function(k){if(row[k]!==next[k]){row[k]=next[k];changed=true;}});
  });

  const customers = s.customers.filter(function(x){ return /^demo-c-/.test(x.id); });
  const cid = function(n){ return customers[n % customers.length] && customers[n % customers.length].id; };
  const dealRows = DEMO_COVERAGE.dealBase.map(function(r, i){
    const id=r[0], name=r[1], status=r[2], rawLines=r[3], day=r[4];
    return Object.assign({}, demoMeta(id, day+"T10:00:00+09:00"), {
      name:name, customerId:cid(i), categoryId:"used",
      lines:rawLines.map(function(x){ return {equipmentId:x[0], amount:x[1], buyKrw:x[2], sellKrw:status==="확정"?x[1]:undefined, cancelled:false}; }),
      currency:"KRW", vat:"excluded", taxRate:10, fx:1, fxSource:"KRW", fxDate:day, terms:"현장인도 · 결제조건 협의", status:status, ownerId:"demo-master",
      confirmedAt:status==="확정" ? day+"T14:00:00+09:00" : undefined
    });
  });
  if (addMissingById(s.deals, dealRows)) changed=true;

  const quoteSpecs = [
    ["demo-q-1","Q-2026-001","demo-deal-1",1,"ko"],["demo-q-2","Q-2026-002","demo-deal-2",1,"en"],
    ["demo-q-3","Q-2026-003","demo-deal-3",1,"ko"],["demo-q-4","Q-2026-004","demo-deal-4",1,"en"],
    ["demo-q-5","Q-2026-005","demo-deal-6",1,"ko"],["demo-q-6","Q-2026-006","demo-deal-8",1,"en"]
  ];
  const quoteRows = quoteSpecs.map(function(r, i){
    const d=s.deals.find(function(x){return x.id===r[2];});
    const customer=s.customers.find(function(x){return x.id===(d&&d.customerId);}) || {id:"",name:"고객 미지정",contacts:[]};
    return Object.assign({}, demoMeta(r[0], "2026-"+String(7+(i%4)).padStart(2,"0")+"-"+String(5+i*3).padStart(2,"0")+"T11:00:00+09:00"), {
      number:r[1], dealId:r[2], revision:r[3], language:r[4], terms:"Quotation valid for 30 days · Delivery/installation to be agreed",
      validUntil:"2026-11-30", currency:(d&&d.currency)||"KRW", vat:(d&&d.vat)||"excluded", taxRate:(d&&d.taxRate)||10, fx:(d&&d.fx)||1,
      fxDate:(d&&d.fxDate)||"2026-10-01", fxSource:(d&&d.fxSource)||"KRW",
      lines:((d&&d.lines)||[]).filter(function(x){return !x.cancelled;}).map(function(x){
        const e=s.equipment.find(function(q){return q.id===x.equipmentId;});
        return {equipmentId:x.equipmentId,model:e&&e.model||"",number:e&&e.number||"",amount:x.amount};
      }),
      customer:{id:customer.id,name:customer.name,contacts:customer.contacts||[]}
    });
  });
  if (addMissingById(s.quotes, quoteRows)) changed=true;

  const purchaseSpecs = [
    ["demo-pur-1","AIDA NC1-200 매입","확정",0,["demo-eq-1"],78000000],
    ["demo-pur-2","KOMATSU OBS-110 매입","확정",1,["demo-eq-2"],42000000],
    ["demo-pur-3","AMADA TP-150 매입 협의","진행중",2,["demo-eq-3"],51000000],
    ["demo-pur-4","OKUMA MB-56VA 매입","확정",3,["demo-eq-5"],64000000],
    ["demo-pur-5","BRUDERER BSTA60 매입 협의","진행중",4,["demo-eq-8"],135000000],
    ["demo-pur-6","HYUNDAI WIA KH63G 매입 검토","무산",5,["demo-eq-12"],76000000]
  ];
  const purchaseRows=purchaseSpecs.map(function(r,i){
    return Object.assign({},demoMeta(r[0],"2026-0"+(5+(i%4))+"-"+String(6+i*3).padStart(2,"0")+"T10:30:00+09:00"),{
      name:r[1],status:r[2],customerId:cid(r[3]),equipmentIds:r[4],amount:r[5],categoryId:"used",notes:"로컬 데모 매입 거래"
    });
  });
  if(addMissingById(s.purchases,purchaseRows)) changed=true;

  const accountRows=[
    Object.assign({},demoMeta("demo-ca-1"),{name:"국민은행 운영계좌",kind:"bank",openingDate:"2025-01-01",openingBalance:85000000,active:true}),
    Object.assign({},demoMeta("demo-ca-2"),{name:"기업은행 무역계좌",kind:"bank",openingDate:"2025-01-01",openingBalance:32000000,active:true}),
    Object.assign({},demoMeta("demo-ca-3"),{name:"현금 시재",kind:"cash",openingDate:"2025-01-01",openingBalance:3000000,active:true})
  ];
  if(addMissingById(s.cashAccounts,accountRows)) changed=true;

  const cashCatSpecs=[
    ["demo-cc-1","매출 입금","income"],["demo-cc-2","기타 수입","income"],["demo-cc-3","사무실·관리비","expense"],["demo-cc-4","인건비","expense"],
    ["demo-cc-5","차량·출장비","expense"],["demo-cc-6","수입 운송·통관","import"],["demo-cc-7","수출 운송·포장","export"],["demo-cc-8","외주·수리비","other"],
    ["demo-cc-9","광고·마케팅","expense"],["demo-cc-10","세금·수수료","other"]
  ];
  const cashCats=cashCatSpecs.map(function(r,i){return Object.assign({},demoMeta(r[0]),{name:r[1],group:r[2],active:true,order:(i+1)*10});});
  if(addMissingById(s.cashCategories,cashCats)) changed=true;

  const cashRows=[]; let order=1000;
  function addCash(id,date,kind,accountId,amount,categoryId,description,extra){
    cashRows.push(Object.assign({},demoMeta(id,date+"T09:00:00+09:00"),{date:date,kind:kind,accountId:accountId,toAccountId:"",amount:amount,categoryId:categoryId,description:description,fileIds:[],dealId:"",purchaseId:"",order:order++,cancelled:false},extra||{}));
  }
  addCash("demo-ce-2501","2025-09-05","income","demo-ca-1",92000000,"demo-cc-1","2025년 9월 설비 판매 입금");
  addCash("demo-ce-2502","2025-09-12","expense","demo-ca-1",18500000,"demo-cc-6","2025년 9월 수입 운송·통관");
  addCash("demo-ce-2503","2025-10-02","income","demo-ca-1",68000000,"demo-cc-1","2025년 10월 매출 입금");
  addCash("demo-ce-2504","2025-10-03","expense","demo-ca-1",4200000,"demo-cc-3","2025년 10월 관리비");
  const monthly=[["01",78000000,22000000],["02",54000000,19000000],["03",126000000,36000000],["04",88000000,27500000],["05",143000000,42000000],["06",61000000,23500000],["07",128000000,39000000],["08",250000000,96000000],["09",178000000,74000000],["10",49000000,9100000]];
  monthly.forEach(function(r,i){
    const m=r[0],inc=r[1],exp=r[2];
    addCash("demo-ce-26-"+m+"-i","2026-"+m+"-05","income","demo-ca-1",inc,"demo-cc-1",Number(m)+"월 설비 판매 입금",{dealId:i===7?"demo-deal-2":i===6?"demo-deal-3":i===8?"demo-deal-7":""});
    addCash("demo-ce-26-"+m+"-e","2026-"+m+"-10","expense","demo-ca-1",exp,"demo-cc-6",Number(m)+"월 운송·통관 및 운영비");
    addCash("demo-ce-26-"+m+"-a","2026-"+m+"-18","expense","demo-ca-1",3200000+(i%3)*500000,"demo-cc-3",Number(m)+"월 사무실·관리비");
  });
  addCash("demo-ce-transfer-1","2026-09-15","transfer","demo-ca-1",12000000,"","무역계좌 운영자금 이체",{toAccountId:"demo-ca-2"});
  addCash("demo-ce-1001","2026-10-01","income","demo-ca-1",28000000,"demo-cc-1","DOOSAN PUMA 계약금",{dealId:"demo-deal-7"});
  addCash("demo-ce-1002","2026-10-02","expense","demo-ca-1",1450000,"demo-cc-5","평택·부산 출장비");
  addCash("demo-ce-1003","2026-10-03","expense","demo-ca-2",2650000,"demo-cc-7","수출 포장 선급금");
  if(addMissingById(s.cashEntries,cashRows)) changed=true;

  const folders=[
    Object.assign({},demoMeta("demo-fol-1"),{name:"견적·계약",categoryId:"used",parentId:null}),
    Object.assign({},demoMeta("demo-fol-2"),{name:"설비 사진·사양",categoryId:"used",parentId:null}),
    Object.assign({},demoMeta("demo-fol-3"),{name:"2026 프로젝트",categoryId:"used",parentId:"demo-fol-1"}),
    Object.assign({},demoMeta("demo-tax-fol-1"),{name:"2026 세금계산서",categoryId:"tax-documents",parentId:null}),
    Object.assign({},demoMeta("demo-asahi-fol-1"),{name:"ASAHI 매뉴얼",categoryId:"asahi",parentId:null})
  ];
  if(addMissingById(s.folders,folders)) changed=true;

  const fileSpecs=[
    ["demo-file-1","AIDA_NC1-200_spec.pdf","application/pdf",1850000,"used","demo-fol-2"],["demo-file-2","KOMATSU_OBS110_photo.jpg","image/jpeg",2450000,"used","demo-fol-2"],
    ["demo-file-3","2026_Q3_sales_review.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",720000,"used","demo-fol-1"],["demo-file-4","MORI_SEIKI_quote.pdf","application/pdf",910000,"used","demo-fol-1"],
    ["demo-file-5","tax_2026_08_transport.pdf","application/pdf",420000,"tax-documents","demo-tax-fol-1"],["demo-file-6","tax_2026_09_office.pdf","application/pdf",390000,"tax-documents","demo-tax-fol-1"],
    ["demo-file-7","tax_2026_09_customs.pdf","application/pdf",610000,"tax-documents","demo-tax-fol-1"],["demo-file-8","ASAHI_TP45_manual.pdf","application/pdf",6300000,"asahi","demo-asahi-fol-1"]
  ];
  const files=fileSpecs.map(function(r,i){return Object.assign({},demoMeta(r[0],"2026-09-"+String(i+3).padStart(2,"0")+"T11:00:00+09:00"),{name:r[1],type:r[2],size:r[3],categoryId:r[4],parentId:r[5],status:"ready",referenceOnly:true,targetType:"",targetId:""});});
  if(addMissingById(s.files,files)) changed=true;
  const linkedEntry=s.cashEntries.find(function(x){return x.id==="demo-ce-26-09-e";});
  if(linkedEntry && !(linkedEntry.fileIds||[]).length){linkedEntry.fileIds=["demo-file-7"];changed=true;}

  const eventSpecs=[
    ["demo-ev-1","AIDA NC1-200 현장 검수","2026-10-05T10:00","2026-10-05T12:00","blue"],["demo-ev-2","부산항 통관 일정","2026-10-06T09:00","2026-10-06T11:00","green"],
    ["demo-ev-3","고객 견적 미팅","2026-10-07T14:00","2026-10-07T15:00","blue"],["demo-ev-4","수출 포장 확인","2026-10-08T13:00","2026-10-08T15:00","green"],
    ["demo-ev-5","월간 회계 마감","2026-10-31T09:00","2026-10-31T10:00","violet"],["demo-ev-6","일본 파트너 화상회의","2026-10-12T16:00","2026-10-12T17:00","amber"],
    ["demo-ev-7","창고 재고 실사","2026-10-15T09:00","2026-10-15T17:00","green"],["demo-ev-8","10월 영업 리뷰","2026-10-29T15:00","2026-10-29T16:30","violet"]
  ];
  const events=eventSpecs.map(function(r){return Object.assign({},demoMeta(r[0]),{title:r[1],start:r[2],end:r[3],allDay:false,color:r[4],repeat:{frequency:"none"},recipients:["demo-master"],channels:[],notes:"로컬 데모 일정"});});
  if(addMissingById(s.events,events)) changed=true;

  const sheets=[
    Object.assign({},demoMeta("demo-sheet-1"),{name:"2026 월별 예산·실적",year:2026,cells:[["항목","예산","실적","차이"],["매출","1200000000","1000000000","=C2-B2"],["운송·통관","220000000","200000000","=C3-B3"],["관리비","60000000","42000000","=C4-B4"],["광고","30000000","18000000","=C5-B5"]]}),
    Object.assign({},demoMeta("demo-sheet-2"),{name:"2026 프로젝트 비용",year:2026,cells:[["프로젝트","매입","물류","기타","합계"],["AIDA NC1-200","78000000","5500000","1200000","=B2+C2+D2"],["MORI NVX5100","88000000","7200000","1800000","=B3+C3+D3"]]})
  ];
  if(addMissingById(s.sheets,sheets)) changed=true;

  const templateSpecs=[
    ["demo-mail-ko","ko","국문 보유설비 안내","보유 설비 안내 · {{product_summary}}","안녕하세요.\\n아래 설비를 안내드립니다.\\n\\n{{products}}\\n\\n상세 자료와 견적이 필요하시면 회신 부탁드립니다.\\n\\n{{company}}"],
    ["demo-mail-en","en","English Used Equipment Offer","Used equipment available · {{product_summary}}","Dear Sir or Madam,\\n\\nPlease review the equipment below.\\n\\n{{products}}\\n\\nBest regards,\\n{{company}}"],
    ["demo-mail-ja","ja","日本語 中古設備案内","中古設備のご案内 · {{product_summary}}","お世話になっております。\\n\\n{{products}}\\n\\nよろしくお願いいたします。\\n{{company}}"],
    ["demo-mail-zh","zh","中文 二手设备介绍","现有二手设备 · {{product_summary}}","您好！\\n\\n{{products}}\\n\\n谢谢！\\n{{company}}"]
  ];
  const templates=templateSpecs.map(function(r){return Object.assign({},demoMeta(r[0]),{language:r[1],name:r[2],subject:r[3],body:r[4]});});
  if(addMissingById(s.mailTemplates,templates)) changed=true;

  const memoSpecs=[
    ["demo-memo-1","equipment","demo-eq-1","AIDA 200톤 검수 완료. 슬라이드 유격 양호.","검수"],["demo-memo-2","equipment","demo-eq-4","MORI NVX5100 부산항 도착. 통관 서류 확인 필요.","물류"],
    ["demo-memo-3","deals","demo-deal-1","고객이 2차 가격 제안 요청. 운송비 별도 조건.","견적 요청"],["demo-memo-4","deals","demo-deal-4","해외 고객 CIF 조건 문의. 포장 사양 확인 필요.","물류"],
    ["demo-memo-5","customers",cid(0),"AIDA/Komatsu 110~200톤급 프레스 관심.","확인 필요"],["demo-memo-6","customers",cid(1),"머시닝센터 및 NC선반 재고 리스트 정기 요청.","견적 요청"],
    ["demo-memo-7","equipment","demo-eq-8","BRUDERER 고속프레스 전기 사양 3상 380V 확인.","확인 필요"],["demo-memo-8","deals","demo-deal-6","FANUC 탭핑센터 10월 둘째 주 의사결정 예정.","확인 필요"]
  ];
  const memos=memoSpecs.map(function(r,i){return Object.assign({},demoMeta(r[0],"2026-09-"+String(10+i).padStart(2,"0")+"T13:00:00+09:00"),{targetType:r[1],targetId:r[2],body:"<p>"+r[3]+"</p>",text:r[3],tags:[r[4]]});});
  if(addMissingById(s.memos,memos)) changed=true;
  ["검수","견적 요청","물류","확인 필요"].forEach(function(tag){if(!s.tags.includes(tag)){s.tags.push(tag);changed=true;}});

  const notifications=[
    Object.assign({},demoMeta("demo-n-1"),{title:"AIDA NC1-200 현장 검수",at:"2026-10-05T10:00:00+09:00",read:false}),
    Object.assign({},demoMeta("demo-n-2"),{title:"고객 견적 미팅",at:"2026-10-07T14:00:00+09:00",read:false}),
    Object.assign({},demoMeta("demo-n-3"),{title:"월간 회계 마감",at:"2026-10-31T09:00:00+09:00",read:true})
  ];
  if(addMissingById(s.notifications,notifications)) changed=true;

  s.__coverageVersion=5;
  return true;
}

async function loadState() {
  let s = await idbGet(stateKey);
  if (!s) s = seedState();
  s = ensureState(s);
  const migrated = applyCoverage(s);
  if (migrated) {
    s.__revision = Number(s.__revision || 0) + 1;
    await idbSet(stateKey, s);
  }
  return s;
}

async function saveState(s) {
  s.__revision = Number(s.__revision || 0) + 1;
  await idbSet(stateKey, s);
  return s;
}

function projectState(s) {
  s = ensureState(clone(s));
  const me = s.users.find(x => x.id === "demo-master") || s.users[0];
  const out = { ...s, me:{...me, searchPreferences:me.searchPreferences || {recent:[],favorites:[]}} };
  delete out.__revision;
  delete out.jobs;
  for (const k of ["equipment","customers","deals","quotes","folders","files","memos","events","sheets","dashboardNotes","categories","cashEntries","purchases"])
    out[k] = (s[k] || []).filter(x => !x.deletedAt);
  out.users = (s.users || []).map(({searchPreferences, ...u}) => u);
  out.trash = [];
  for (const k of ["equipment","customers","folders","files","events","categories"])
    for (const o of (s[k] || []).filter(x => x.deletedAt)) out.trash.push({ id:o.id, type:k, name:o.name || o.model || o.title || "항목", deletedAt:o.deletedAt, version:o.version || 1 });
  out.logs = [...(s.logs || [])].reverse();
  out.notifications = [...(s.notifications || [])].reverse();
  out.storage = {
    used:(s.files || []).reduce((n,f)=>n+(f.referenceOnly?0:Number(f.size||0)),0),
    limit:s.storageLimitBytes || 1_000_000_000
  };
  return out;
}

const reply = (body, status=200) => new Response(JSON.stringify(body), { status, headers:{"Content-Type":"application/json; charset=utf-8"} });
function bodyJson(init) { try { return JSON.parse(init?.body || "{}"); } catch { return {}; } }
function stamp(old, data, userId="demo-master") {
  const now = nowIso();
  return { ...old, ...data, version:Number(old?.version || 0)+1, updatedAt:now, updatedBy:userId, ...(old?.createdAt ? {} : {createdAt:now, createdBy:userId}) };
}
function addLog(s, action, type, targetId, detail="") {
  s.logs.push({ id:uid(), at:nowIso(), userId:"demo-master", action, targetType:type || "system", targetId:targetId || null, detail });
}
function find(s, type, id) { return (s[type] || []).find(x => x.id === id); }
function upsert(s, type, targetId, data, defaults={}) {
  s[type] ||= [];
  if (targetId) {
    const old = find(s,type,targetId);
    if (!old) throw Error("저장할 항목을 찾을 수 없습니다.");
    Object.assign(old, stamp(old, data));
    return old;
  }
  const rec = stamp(null, { id:uid(), lock:"none", ...defaults, ...data });
  s[type].push(rec);
  return rec;
}

function applyCommand(s, cmd) {
  const {action, type, targetId, data={}} = cmd || {};
  if (action === "batch") {
    let resultId;
    for (const c of (data.commands || [])) resultId = applyCommand(s,c).resultId || resultId;
    return {resultId};
  }
  let result;
  if (action === "save") {
    const defaults = {};
    if (type === "deals") Object.assign(defaults,{status:"진행중",ownerId:"demo-master",lines:[]});
    if (type === "folders") Object.assign(defaults,{parentId:null});
    if (type === "events") Object.assign(defaults,{recipients:["demo-master"],channels:[],repeat:{frequency:"none"}});
    if (type === "categories") Object.assign(defaults,{type:"business",fixed:false});
    result = upsert(s,type,targetId,data,defaults);
    addLog(s, targetId ? "수정" : "등록", type, result.id, result.name || result.title || result.model || "");
  } else if (action === "mission-save") {
    const defaults = {};
    if (type === "cashAccounts") Object.assign(defaults,{active:true,kind:"bank",openingBalance:0});
    if (type === "cashCategories") Object.assign(defaults,{active:true,order:Date.now()});
    if (type === "cashEntries") Object.assign(defaults,{cancelled:false,order:Date.now()});
    if (type === "purchases") Object.assign(defaults,{status:"진행중",equipmentIds:[]});
    result = upsert(s,type,targetId,data,defaults);
    addLog(s, targetId ? "수정" : "등록", type, result.id, result.name || result.description || "");
  } else if (action === "mission-cancel") {
    result = find(s,type,targetId); if (!result) throw Error("항목을 찾을 수 없습니다.");
    Object.assign(result, stamp(result,{cancelled:true,cancelReason:String(data.reason||"")}));
    addLog(s,"취소",type,result.id,result.cancelReason);
  } else if (["confirm","correct","cancel"].includes(action) && type === "deals") {
    result = find(s,"deals",targetId); if (!result) throw Error("영업 건을 찾을 수 없습니다.");
    if (action === "confirm") Object.assign(result,{status:"확정",confirmedAt:nowIso(),finalQuoteId:data.quoteId || result.finalQuoteId});
    if (action === "correct") for (const line of (data.lines || [])) { const t=(result.lines||[]).find(x=>x.equipmentId===line.equipmentId&&!x.cancelled); if(t) t.amount=Number(line.amount); }
    if (action === "cancel") { for (const id of (data.equipmentIds || [])) { const t=(result.lines||[]).find(x=>x.equipmentId===id&&!x.cancelled); if(t){t.cancelled=true;t.cancelledAt=nowIso();} } if ((result.lines||[]).length && result.lines.every(x=>x.cancelled)) result.status="취소"; }
    Object.assign(result, stamp(result,{}));
    addLog(s, action === "confirm" ? "판매 확정" : action === "correct" ? "금액 정정" : "판매 취소", "deals", result.id, data.reason || "");
  } else if (action === "lose") {
    result=find(s,"deals",targetId); if(!result) throw Error("영업 건을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{status:"무산"})); addLog(s,"영업 무산","deals",result.id,data.reason||"");
  } else if (action === "lock") {
    result=find(s,type,targetId); if(!result) throw Error("항목을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{lock:data.lock || "none",lockVersion:uid()})); addLog(s,"잠금 변경",type,result.id);
  } else if (action === "delete") {
    result=find(s,type,targetId); if(!result) throw Error("항목을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{deletedAt:nowIso()})); addLog(s,"휴지통 이동",type,result.id);
  } else if (action === "restore") {
    result=find(s,type,targetId); if(!result) throw Error("항목을 찾을 수 없습니다.");
    delete result.deletedAt; Object.assign(result,stamp(result,{})); addLog(s,"복구",type,result.id);
  } else if (action === "file-edit") {
    result=find(s,"files",targetId); if(!result) throw Error("파일을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,data)); addLog(s,"파일 정보 수정","files",result.id);
  } else if (action === "permissions") {
    result=find(s,"users",targetId); if(!result) throw Error("계정을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{permissions:data.permissions || result.permissions,active:data.active !== false})); addLog(s,"권한 변경","users",result.id);
  } else if (action === "tags") {
    const name=String(data.name||"").trim(); if(!name) throw Error("태그를 입력해 주세요.");
    if(data.remove){ s.tags=s.tags.filter(x=>x!==name); for(const m of s.memos) m.tags=(m.tags||[]).filter(x=>x!==name); }
    else if(data.renameTo){ const n=String(data.renameTo).trim(); s.tags=s.tags.map(x=>x===name?n:x); for(const m of s.memos) m.tags=(m.tags||[]).map(x=>x===name?n:x); }
    else if(!s.tags.includes(name)) s.tags.push(name);
    result={id:name};
  } else if (action === "read-notification") {
    result=find(s,"notifications",targetId); if(result) result.read=true;
  } else if (action === "search-preferences") {
    const u=s.users.find(x=>x.id==="demo-master") || s.users[0];
    const p=u.searchPreferences || {recent:[],favorites:[]}; const term=String(data.term||"").trim();
    if(data.operation==="remember"&&term) p.recent=[term,...p.recent.filter(x=>x!==term)].slice(0,10);
    else if(data.operation==="toggle-favorite"&&term) p.favorites=p.favorites.includes(term)?p.favorites.filter(x=>x!==term):[term,...p.favorites].slice(0,20);
    else { if(Array.isArray(data.recent)) p.recent=[...new Set(data.recent)].slice(0,10); if(Array.isArray(data.favorites)) p.favorites=[...new Set(data.favorites)].slice(0,20); }
    u.searchPreferences=p; result={id:u.id};
  } else if (action === "company") {
    s.company={...s.company,...data}; result={id:"company"};
  } else if (action === "costs") {
    result=find(s,"equipment",targetId); if(!result) throw Error("상품을 찾을 수 없습니다.");
    Object.assign(result,stamp(result,{costs:(data.rows||[]).map(x=>({name:String(x.name||""),estimated:String(x.estimated||""),actual:String(x.actual||"")}))}));
  } else {
    throw Error("현재 로컬 저장 모드에서 지원하지 않는 작업입니다.");
  }
  return {resultId:result?.id};
}

window.fetch = async (input, init={}) => {
  const raw = typeof input === "string" ? input : input?.url || "";
  const url = new URL(raw, location.href);
  if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
  try {
    if (url.pathname === "/api/config") return reply({demo:true,company:"세인코퍼레이션",emailConfigured:false,localPersistence:true});
    if (url.pathname === "/api/login") {
      const body=bodyJson(init); if(!body.demo) return reply({error:"로컬 검토용 계정으로 시작해 주세요."},401);
      localStorage.setItem(sessionKey,"1"); return reply({ok:true});
    }
    if (url.pathname === "/api/logout") { localStorage.removeItem(sessionKey); return reply({ok:true}); }
    if (url.pathname === "/api/reset-password") return reply({message:"로컬 저장 모드에서는 비밀번호가 필요하지 않습니다."});
    if (url.pathname === "/api/unlock") return reply({ok:true});
    if (url.pathname === "/api/state") {
      if(localStorage.getItem(sessionKey)!=="1") return reply({error:"로그인이 필요합니다."},401);
      const s=await loadState();
      const requested=init?.headers?.["X-State-Revision"] || init?.headers?.get?.("X-State-Revision");
      const revision=`local-${s.__revision}`;
      if(requested===revision) return reply({unchanged:true,revision});
      return reply({state:projectState(s),digests:{},revision});
    }
    if (url.pathname === "/api/command") {
      if(localStorage.getItem(sessionKey)!=="1") return reply({error:"로그인이 필요합니다."},401);
      const s=await loadState();
      const r=applyCommand(s,bodyJson(init));
      await saveState(s);
      return reply({resultId:r.resultId,state:projectState(s),digests:{},revision:`local-${s.__revision}`});
    }
    if (url.pathname === "/api/jobs") return reply({emailConfigured:false,jobs:[]});
    if (url.pathname === "/api/mail/config") return reply({enabled:false,senders:[],sender:""});
    if (url.pathname === "/api/mail/campaigns") return reply({campaigns:[]});
    if (url.pathname === "/api/mail/draft") {
      if ((init.method || "GET").toUpperCase() === "GET") return reply({draft:(await idbGet("mailDraft")) || null});
      const previousDraft=(await idbGet("mailDraft")) || {};
      const draft=Object.assign({},bodyJson(init),{version:Number(previousDraft.version || 0)+1});
      await idbSet("mailDraft",draft);
      return reply({draft:draft});
    }
    if (url.pathname === "/api/quotes" && (init.method || "").toUpperCase() === "POST") {
      const body=bodyJson(init), s=await loadState(), deal=s.deals.find(function(d){return d.id===body.dealId;});
      if(!deal) return reply({error:"연결 영업을 찾을 수 없습니다."},400);
      const revision=Math.max.apply(null,[0].concat(s.quotes.filter(function(q){return q.dealId===deal.id;}).map(function(q){return Number(q.revision||0);})) )+1;
      const customer=s.customers.find(function(x){return x.id===deal.customerId;}) || {id:"",name:"고객 미지정",contacts:[]};
      const id=uid(), createdAt=nowIso();
      s.quotes.push(Object.assign({},demoMeta(id,createdAt),{
        number:"LQ-"+new Date().getFullYear()+"-"+String(s.quotes.length+1).padStart(3,"0"),
        dealId:deal.id,revision:revision,language:body.language||"ko",terms:body.terms||"",validUntil:body.validUntil||"",
        currency:(body.settings&&body.settings.currency)||deal.currency||"KRW",vat:(body.settings&&body.settings.vat)||deal.vat||"excluded",
        taxRate:Number((body.settings&&body.settings.taxRate)!=null?body.settings.taxRate:(deal.taxRate||10)),
        fx:Number((body.settings&&body.settings.fx)!=null?body.settings.fx:(deal.fx||1)),
        fxDate:(body.settings&&body.settings.fxDate)||deal.fxDate||"",fxSource:(body.settings&&body.settings.fxSource)||deal.fxSource||"직접 입력",
        lines:(body.lines||[]).map(function(x){return Object.assign({},x);}),
        customer:{id:customer.id,name:customer.name,contacts:customer.contacts||[]}
      }));
      await saveState(s);
      return reply({id:id});
    }
    if (url.pathname === "/api/rates") return reply({error:"환율 서버가 연결되지 않았습니다."},503);
    return reply({error:"현재 링크에서는 이 기능을 사용할 수 없습니다."},404);
  } catch (e) {
    return reply({error:e?.message || "로컬 저장 중 오류가 발생했습니다."},400);
  }
};