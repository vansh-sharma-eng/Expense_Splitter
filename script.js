const $ = id => document.getElementById(id)

let members = []
let expenses = []
let balances = {}
let totalSpent = 0
let tripBudget = 0

enable(false)

function enable(v){
  ["memberInput","addMemberBtn","desc","amount","payer","addExpenseBtn","splitType"]
  .forEach(i => $(i).disabled = !v)
}

$("tripBtn").onclick = () => {
  let name = $("tripName").value.trim()

  if(!name){
    alert("Enter Trip Name")
    return
  }

  let budget = prompt("Enter Budget (optional)")
  tripBudget = budget ? Number(budget) : 0

  enable(true)
  save()
  renderStats()

  $("tripPopup").style.display = "flex"
}

$("closePopup").onclick = ()=>{
  $("tripPopup").style.display = "none"
}

$("newTripBtn").onclick = () => {
  if(confirm("Start New Trip?")){
    localStorage.removeItem("tripData")
    location.reload()
  }
}

$("addMemberBtn").onclick = addMember

$("memberInput").addEventListener("keydown", e=>{
  if(e.key==="Enter"){
    addMember()
  }
})

function addMember(){
  let name = $("memberInput").value.trim()

  if(!name){
    alert("Enter member name")
    return
  }

  if(members.includes(name)){
    alert("Member already exists")
    return
  }

  members.push(name)
  balances[name] = 0
  $("memberInput").value = ""
  renderMembers()
  save()
}

function renderMembers(){
  $("members").innerHTML = ""
  $("payer").innerHTML = ""

  members.forEach(m=>{
    $("members").innerHTML += `<span class="member-tag">${m}</span>`
    $("payer").innerHTML += `<option>${m}</option>`
  })
}

$("splitType").onchange = ()=>{
  let type = $("splitType").value
  $("extraInput").innerHTML = ""

  if(type==="unequal"){
    $("extraInput").innerHTML =
    `<input id="manualInput" placeholder="Example: 200,300,500">`
  }

  if(type==="percent"){
    $("extraInput").innerHTML =
    `<input id="percentInput" placeholder="Example: 20,30,50">`
  }
}

$("addExpenseBtn").onclick = ()=>{

  let desc = $("desc").value.trim()
  let amt = Number($("amount").value)
  let payer = $("payer").value
  let type = $("splitType").value

  if(!desc){
    alert("Enter description")
    return
  }

  if(amt <= 0){
    alert("Amount must be greater than 0")
    return
  }

  if(members.length===0){
    alert("Add at least one member")
    return
  }

  if(type==="equal"){
    let share = amt/members.length
    members.forEach(m=> balances[m] -= share)
  }

  if(type==="unequal"){
    let values = $("manualInput").value.split(",").map(Number)

    if(values.length !== members.length){
      alert("Enter amount for each member")
      return
    }

    members.forEach((m,i)=>{
      balances[m] -= values[i]
    })
  }

  if(type==="percent"){
    let per = $("percentInput").value.split(",").map(Number)

    if(per.length !== members.length){
      alert("Enter percentage for each member")
      return
    }

    let totalPercent = per.reduce((a,b)=>a+b,0)

    if(totalPercent !== 100){
      alert("Total percentage must be 100")
      return
    }

    members.forEach((m,i)=>{
      balances[m] -= (amt * per[i] / 100)
    })
  }

  balances[payer] += amt
  expenses.push({desc,amt,payer})
  totalSpent += amt

  $("desc").value = ""
  $("amount").value = ""

  render()
  save()
  generateQR()
}

function calculate(){
  let debt = []
  let credit = []
  let result = []

  for(let m in balances){
    if(balances[m] < 0) debt.push({n:m,a:-balances[m]})
    if(balances[m] > 0) credit.push({n:m,a:balances[m]})
  }

  let i=0, j=0

  while(i<debt.length && j<credit.length){
    let pay = Math.min(debt[i].a, credit[j].a)

    result.push(`${debt[i].n} → ${credit[j].n} : ₹${pay.toFixed(2)}`)

    debt[i].a -= pay
    credit[j].a -= pay

    if(debt[i].a===0) i++
    if(credit[j].a===0) j++
  }

  return result
}

function render(){

  $("history").innerHTML = ""

  if(expenses.length === 0){
    $("emptyState").style.display = "block"
  } else {
    $("emptyState").style.display = "none"
  }

  expenses.forEach(e=>{
    $("history").innerHTML +=
    `${e.desc} - ₹${e.amt} (Paid by ${e.payer})<br>`
  })

  $("settlement").innerHTML = ""

  let flows = calculate()

  if(!flows.length){
    $("settlement").innerHTML = "<tr><td>All Settled</td></tr>"
  } else {
    flows.forEach(r=>{
      $("settlement").innerHTML += `<tr><td>${r}</td></tr>`
    })
  }

  renderStats()
}

function renderStats(){
  $("spentStat").textContent = "₹" + totalSpent.toFixed(2)
  $("remainStat").textContent =
  tripBudget>0 ? "₹" + (tripBudget-totalSpent).toFixed(2) : "—"
}

function save(){
  localStorage.setItem("tripData",
  JSON.stringify({
    members,
    expenses,
    balances,
    totalSpent,
    tripBudget,
    name:$("tripName").value
  }))
}

(function(){
  let d = JSON.parse(localStorage.getItem("tripData"))
  if(!d) return

  members = d.members || []
  expenses = d.expenses || []
  balances = d.balances || {}
  totalSpent = d.totalSpent || 0
  tripBudget = d.tripBudget || 0

  $("tripName").value = d.name || ""

  enable(true)
  renderMembers()
  render()
})()

$("themeBtn").onclick = ()=>{
  document.body.classList.toggle("dark")
  localStorage.setItem("theme",
  document.body.classList.contains("dark")?"dark":"light")
}

if(localStorage.getItem("theme")==="dark"){
  document.body.classList.add("dark")
}

function generateQR(){
  let data = localStorage.getItem("tripData")
  if(!data) return

  $("qr").innerHTML = ""
  new QRCode("qr",{text:location.href,width:120,height:120})
}
