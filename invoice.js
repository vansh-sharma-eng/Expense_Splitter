let data = null;
const params = new URLSearchParams(window.location.search);

try {
  if (params.has("data")) {
    data = JSON.parse(atob(params.get("data")));
  } else {
    data = JSON.parse(localStorage.getItem("tripData"));
  }
} catch {
  data = null;
}

if (!data) {
  document.body.innerHTML = "<h2>No invoice data found</h2>";
  throw new Error("Invoice data missing");
}

const symbols = { INR:"₹", USD:"$", EUR:"€" };
const currency = symbols[data.currency] || "₹";

document.getElementById("tripName").textContent = data.name || "Trip";
document.getElementById("invoiceNo").textContent =
  "INV-" + Math.floor(100000 + Math.random() * 900000);
document.getElementById("invoiceDate").textContent =
  new Date().toLocaleDateString();

document.getElementById("totalSpent").textContent =
  currency + (data.totalSpent || 0).toFixed(2);

const expBody = document.getElementById("expenseRows");

if (data.expenses && data.expenses.length > 0) {
  data.expenses.forEach((e, i) => {
    expBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${e.desc || "-"}</td>
        <td>${e.payer || "-"}</td>
        <td>${currency}${(e.amt || 0).toFixed(2)}</td>
      </tr>
    `;
  });
} else {
  expBody.innerHTML = `<tr><td colspan="4">No expenses</td></tr>`;
}

function calculateWhoPaysWhom(balances) {
  if (!balances) return [];

  const debtors = [], creditors = [], result = [];

  for (let m in balances) {
    if (balances[m] < 0)
      debtors.push({ name: m, amt: -balances[m] });
    if (balances[m] > 0)
      creditors.push({ name: m, amt: balances[m] });
  }

  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);

    result.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amt: pay
    });

    debtors[i].amt -= pay;
    creditors[j].amt -= pay;

    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }

  return result;
}

const setBody = document.getElementById("settlementRows");
const flows = calculateWhoPaysWhom(data.balances);

if (!flows.length) {
  setBody.innerHTML = `<tr><td colspan="3">All settled</td></tr>`;
} else {
  flows.forEach(f => {
    setBody.innerHTML += `
      <tr>
        <td>${f.from}</td>
        <td>${f.to}</td>
        <td>${currency}${f.amt.toFixed(2)}</td>
      </tr>
    `;
  });
}

window.addEventListener("load", () => {
  setTimeout(async () => {

    const element = document.getElementById("bill");

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true
    });

    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

    pdf.save((data.name || "invoice") + "-invoice.pdf");

  }, 500);
});
