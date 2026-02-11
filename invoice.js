let data;
const params = new URLSearchParams(window.location.search);

if (params.has("data")) {
  data = JSON.parse(atob(params.get("data")));
} else {
  data = JSON.parse(localStorage.getItem("tripData"));
}

if (!data) {
  alert("No invoice data found");
}
const symbols = { INR:"₹", USD:"$", EUR:"€" };

document.getElementById("tripName").textContent = data.name;
document.getElementById("invoiceNo").textContent =
  "INV-" + Math.floor(100000 + Math.random() * 900000);
document.getElementById("invoiceDate").textContent =
  new Date().toLocaleDateString();

document.getElementById("totalSpent").textContent =
  symbols[data.currency] + data.totalSpent.toFixed(2);

const expBody = document.getElementById("expenseRows");
data.expenses.forEach((e, i) => {
  expBody.innerHTML += `
    <tr>
      <td>${i + 1}</td>
      <td>${e.desc}</td>
      <td>${e.payer}</td>
      <td>${symbols[data.currency]}${e.amt.toFixed(2)}</td>
    </tr>
  `;
});

function calculateWhoPaysWhom(balances) {
  const debtors = [], creditors = [], res = [];

  for (let m in balances) {
    if (balances[m] < 0) debtors.push({ name: m, amt: -balances[m] });
    if (balances[m] > 0) creditors.push({ name: m, amt: balances[m] });
  }

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    res.push({ from: debtors[i].name, to: creditors[j].name, amt: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (!debtors[i].amt) i++;
    if (!creditors[j].amt) j++;
  }
  return res;
}
const setBody = document.getElementById("settlementRows");
const flows = calculateWhoPaysWhom(data.balances);

if (!flows.length) {
  setBody.innerHTML = `<tr><td colspan="3">All settled</td></tr>`;
}

flows.forEach(f => {
  setBody.innerHTML += `
    <tr>
      <td>${f.from}</td>
      <td>${f.to}</td>
      <td>${symbols[data.currency]}${f.amt.toFixed(2)}</td>
    </tr>
  `;
});

window.onload = async () => {
  const canvas = await html2canvas(document.getElementById("bill"), { scale: 2 });
  const img = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const w = 210;
  const h = canvas.height * w / canvas.width;

  pdf.addImage(img, "PNG", 0, 0, w, h);
  pdf.save(`${data.name}-invoice.pdf`);
};