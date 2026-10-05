import * as XLSX from 'xlsx';

export const exportIncomeToExcel = (incomeList, lang = 'ta') => {
  const isTa = lang === 'ta';
  const data = incomeList.map((item, index) => ({
    [isTa ? 'வ.எண்' : 'S.No']: index + 1,
    [isTa ? 'தேதி' : 'Date']: item.date,
    [isTa ? 'வருமான மூலம்' : 'Source']: item.source,
    [isTa ? 'செலுத்தியவர் / வழங்கியவர்' : 'Paid By / Contributor']: item.paid_by || '-',
    [isTa ? 'விளக்கம்' : 'Description']: item.description || '-',
    [isTa ? 'தொகை (₹)' : 'Amount (₹)']: Number(item.amount),
    [isTa ? 'பெற்றுக் கொண்டவர்' : 'Collected By']: item.collected_by || '-',
    [isTa ? 'குறிப்பு' : 'Notes']: item.notes || '-',
  }));

  const totalAmount = incomeList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  data.push({
    [isTa ? 'வ.எண்' : 'S.No']: '',
    [isTa ? 'தேதி' : 'Date']: isTa ? 'மொத்த வருமானம்' : 'Total Income',
    [isTa ? 'வருமான மூலம்' : 'Source']: '',
    [isTa ? 'செலுத்தியவர் / வழங்கியவர்' : 'Paid By / Contributor']: '',
    [isTa ? 'விளக்கம்' : 'Description']: '',
    [isTa ? 'தொகை (₹)' : 'Amount (₹)']: totalAmount,
    [isTa ? 'பெற்றுக் கொண்டவர்' : 'Collected By']: '',
    [isTa ? 'குறிப்பு' : 'Notes']: '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isTa ? 'வருமானம்' : 'Income');
  XLSX.writeFile(wb, `Vadambai_Income_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportExpensesToExcel = (expenseList, lang = 'ta') => {
  const isTa = lang === 'ta';
  const data = expenseList.map((item, index) => ({
    [isTa ? 'வ.எண்' : 'S.No']: index + 1,
    [isTa ? 'தேதி' : 'Date']: item.date,
    [isTa ? 'செலவு பிரிவு' : 'Category']: item.category,
    [isTa ? 'விளக்கம்' : 'Description']: item.description || '-',
    [isTa ? 'தொகை (₹)' : 'Amount (₹)']: Number(item.amount),
    [isTa ? 'செலவு செய்தவர்' : 'Paid By']: item.paid_by || '-',
    [isTa ? 'குறிப்பு' : 'Notes']: item.notes || '-',
  }));

  const totalAmount = expenseList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  data.push({
    [isTa ? 'வ.எண்' : 'S.No']: '',
    [isTa ? 'தேதி' : 'Date']: isTa ? 'மொத்த செலவுகள்' : 'Total Expenses',
    [isTa ? 'செலவு பிரிவு' : 'Category']: '',
    [isTa ? 'விளக்கம்' : 'Description']: '',
    [isTa ? 'தொகை (₹)' : 'Amount (₹)']: totalAmount,
    [isTa ? 'செலவு செய்தவர்' : 'Paid By']: '',
    [isTa ? 'குறிப்பு' : 'Notes']: '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isTa ? 'செலவுகள்' : 'Expenses');
  XLSX.writeFile(wb, `Vadambai_Expenses_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportFinancialStatementToExcel = (incomeList, expenseList, lang = 'ta') => {
  const isTa = lang === 'ta';
  const totalIncome = incomeList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpenses = expenseList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const balance = totalIncome - totalExpenses;

  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    {
      [isTa ? 'விவரம்' : 'Particulars']: isTa ? 'குழுவின் பெயர்' : 'Group Name',
      [isTa ? 'மதிப்பு / தொகை' : 'Value / Amount']: isTa ? 'வதம்பை இளந்தளிர் குழு' : 'Vadambai Ilanthazhir Kuzhu',
    },
    {
      [isTa ? 'விவரம்' : 'Particulars']: isTa ? 'அறிக்கை உருவாக்கப்பட்ட தேதி' : 'Statement Date',
      [isTa ? 'மதிப்பு / தொகை' : 'Value / Amount']: new Date().toLocaleDateString(isTa ? 'ta-IN' : 'en-IN'),
    },
    {
      [isTa ? 'விவரம்' : 'Particulars']: '----------------------------------',
      [isTa ? 'மதிப்பு / தொகை' : 'Value / Amount']: '----------------------------------',
    },
    {
      [isTa ? 'விவரம்' : 'Particulars']: isTa ? 'மொத்த வருமானம் (Total Income)' : 'Total Income',
      [isTa ? 'மதிப்பு / தொகை' : 'Value / Amount']: `₹ ${totalIncome.toLocaleString('en-IN')}`,
    },
    {
      [isTa ? 'விவரம்' : 'Particulars']: isTa ? 'மொத்த செலவுகள் (Total Expenses)' : 'Total Expenses',
      [isTa ? 'மதிப்பு / தொகை' : 'Value / Amount']: `₹ ${totalExpenses.toLocaleString('en-IN')}`,
    },
    {
      [isTa ? 'விவரம்' : 'Particulars']: isTa ? 'தற்போதைய கையிருப்பு (Net Balance)' : 'Current Balance',
      [isTa ? 'மதிப்பு / தொகை' : 'Value / Amount']: `₹ ${balance.toLocaleString('en-IN')}`,
    },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, isTa ? 'நிதிச் சுருக்கம்' : 'Summary');

  // 2. Income Sheet
  const incomeData = incomeList.map((item, idx) => ({
    [isTa ? 'வ.எண்' : 'S.No']: idx + 1,
    [isTa ? 'தேதி' : 'Date']: item.date,
    [isTa ? 'வருமான மூலம்' : 'Source']: item.source,
    [isTa ? 'செலுத்தியவர் / வழங்கியவர்' : 'Paid By / Contributor']: item.paid_by || '-',
    [isTa ? 'விளக்கம்' : 'Description']: item.description || '-',
    [isTa ? 'தொகை (₹)' : 'Amount (₹)']: Number(item.amount),
    [isTa ? 'பெற்றுக் கொண்டவர்' : 'Collected By']: item.collected_by || '-',
  }));
  const incomeWs = XLSX.utils.json_to_sheet(incomeData);
  XLSX.utils.book_append_sheet(wb, incomeWs, isTa ? 'வருமானம்' : 'Income');

  // 3. Expense Sheet
  const expenseData = expenseList.map((item, idx) => ({
    [isTa ? 'வ.எண்' : 'S.No']: idx + 1,
    [isTa ? 'தேதி' : 'Date']: item.date,
    [isTa ? 'செலவு பிரிவு' : 'Category']: item.category,
    [isTa ? 'விளக்கம்' : 'Description']: item.description || '-',
    [isTa ? 'தொகை (₹)' : 'Amount (₹)']: Number(item.amount),
    [isTa ? 'செலவு செய்தவர்' : 'Paid By']: item.paid_by || '-',
  }));
  const expenseWs = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(wb, expenseWs, isTa ? 'செலவுகள்' : 'Expenses');

  XLSX.writeFile(wb, `Vadambai_Full_Financial_Statement_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCsv = (filename, rows) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
