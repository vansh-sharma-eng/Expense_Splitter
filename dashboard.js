const $ = id => document.getElementById(id);

let members = [];
let expenses = [];
let balances = {};
let totalSpent = 0;
let scannedUrl = null;

/* ENABLE INPUTS */
function enable(v){
  ["memberInput","desc","amount","payer","addExpenseBtn"]
    .forEach(i=>$(i).disabled=!v);
}

/* SAVE TRIP */
$("tripBtn").onclick = ()=>{
  if(!$("tripName").value || !$("tripBudget").value){
    alert("Enter trip name and budget");
    return;
  }
  enable(true);
  save();
  generateQR();
};

/* MEMBERS */
$("memberInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    const name=e.target.value.trim();
    if(!name || members.includes(name)) return;
    members.push(name);
    balances[name]=0;
    e.target.value="";
    renderMembers();
    save(); generateQR();
  }
});

function renderMembers(){
  $("members").innerHTML="";
  $("payer").innerHTML="";
  members.forEach(m=>{
    $("members").innerHTML+=`<span>${m}</span> `;
    $("payer").innerHTML+=`<option>${m}</option>`;
  });
}

/* EXPENSE */
$("addExpenseBtn").onclick=()=>{
  const amt=+ $("amount").value;
  if(!amt||!$("desc").value) return;

  const share=amt/members.length;
  members.forEach(m=>balances[m]-=share);
  balances[$("payer").value]+=amt;

  expenses.push({desc:$("desc").value,amt,payer:$("payer").value});
  totalSpent+=amt;

  $("desc").value=$("amount").value="";
  render(); save(); generateQR();
};

/* SETTLEMENT */
function calculate(){
  const d=[],c=[],r=[];
  for(let m in balances){
    if(balances[m]<0) d.push({m,amt:-balances[m]});
    if(balances[m]>0) c.push({m,amt:balances[m]});
  }
  let i=0,j=0;
  while(i<d.length && j<c.length){
    const p=Math.min(d[i].amt,c[j].amt);
    r.push({from:d[i].m,to:c[j].m,amt:p});
    d[i].amt-=p; c[j].amt-=p;
    if(!d[i].amt)i++; if(!c[j].amt)j++;
  }
  return r;
}

/* RENDER */
function render(){
  $("history").innerHTML="";
  expenses.forEach(e=>{
    $("history").innerHTML+=`${e.desc} - ₹${e.amt}<br>`;
  });

  $("settlement").innerHTML="";
  const f=calculate();
  if(!f.length) $("settlement").innerHTML="<tr><td>All settled</td></tr>";
  f.forEach(x=>{
    $("settlement").innerHTML+=
      `<tr><td>${x.from} → ${x.to}</td><td>₹${x.amt}</td></tr>`;
  });

  $("spentStat").textContent="₹"+totalSpent;
  $("remainStat").textContent=
    "₹"+($("tripBudget").value-totalSpent);
}

/* QR GENERATE */
function generateQR(){
  const data=localStorage.getItem("tripData");
  if(!data) return;
  const url=location.origin+
    location.pathname.replace("dashboard.html","")+
    "invoice.html?data="+btoa(data);

  $("qr").innerHTML="";
  new QRCode("qr",{text:url,width:120,height:120});
}

/* DOWNLOAD */
function downloadInvoice(){
  window.open("invoice.html","_blank");
}

/* QR SCANNER */
let qrScanner;

function openScanner(){
  $("scannerModal").style.display="flex";
  $("downloadBtn").style.display="none";
  scannedUrl=null;

  qrScanner=new Html5Qrcode("qr-reader");
  qrScanner.start(
    {facingMode:"environment"},
    {fps:10,qrbox:220},
    txt=>{
      scannedUrl = txt;
      $("downloadBtn").style.display="block";
      qrScanner.stop().catch(()=>{});
    }
  );
}

/* DOWNLOAD BUTTON INSIDE SCANNER */
$("downloadBtn").onclick = ()=>{
  if(scannedUrl) window.open(scannedUrl,"_blank");
};

/* CLOSE */
function closeScanner(){
  $("scannerModal").style.display="none";
  if(qrScanner) qrScanner.stop().catch(()=>{});
}

/* STORAGE */
function save(){
  localStorage.setItem("tripData",JSON.stringify({
    members,expenses,balances,totalSpent,
    name:$("tripName").value,
    budget:$("tripBudget").value
  }));
}

(function restore(){
  const d=JSON.parse(localStorage.getItem("tripData"));
  if(!d) return;
  ({members,expenses,balances,totalSpent}=d);
  $("tripName").value=d.name;
  $("tripBudget").value=d.budget;
  enable(true);
  renderMembers(); render(); generateQR();
})();
function openScanner(){
  const scanner = new Html5Qrcode("qr-reader");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 220 },
    txt => {
      window.open(txt, "_blank");
      scanner.stop();
    }
  );
}
