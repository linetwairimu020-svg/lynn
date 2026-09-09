const categoryData = [
  { name: 'Housing', amount: 6200, percent: 82 },
  { name: 'Food', amount: 4800, percent: 66 },
  { name: 'Transport', amount: 3400, percent: 52 },
  { name: 'Savings', amount: 2900, percent: 44 },
  { name: 'Fun', amount: 1900, percent: 30 }
];

const formatCurrency = (value) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
  return `KSh ${safeValue.toLocaleString('en-KE')}`;
};

const getInputState = () => ({
  available: Math.max(0, Number(document.getElementById('input-available')?.value || 0)),
  spent: Math.max(0, Number(document.getElementById('input-spent')?.value || 0)),
  saved: Math.max(0, Number(document.getElementById('input-saved')?.value || 0)),
  bills: Math.max(0, Number(document.getElementById('input-bills')?.value || 0))
});

const buildBarData = ({ available, spent, saved, bills }) => {
  const values = [available, spent, saved, bills].filter((value) => Number.isFinite(value) && value >= 0);
  const maxValue = Math.max(...values, 100);

  return [
    { label: 'Avail', value: available },
    { label: 'Spent', value: spent },
    { label: 'Saved', value: saved },
    { label: 'Bills', value: bills }
  ].map((item) => ({
    ...item,
    height: maxValue > 0 ? (item.value / maxValue) * 100 : 0
  }));
};

const getRatioText = (spent, available) => {
  if (available <= 0) return '0%';
  const ratio = Math.min(100, (spent / available) * 100);
  return `${Math.round(ratio)}%`;
};

const renderBars = (data) => {
  const chart = document.getElementById('bar-chart');
  if (!chart) return;

  const barData = buildBarData(data);

  chart.innerHTML = barData
    .map((item) => {
      const height = Math.max(item.height, 18);
      const safeLabel = item.label || 'Item';
      return `
        <div class="bar-column">
          <span class="bar-fill" style="height: ${height}%"></span>
          <span>${safeLabel}</span>
        </div>
      `;
    })
    .join('');
};

const updateGoalProgress = (savedValue) => {
  const ring = document.querySelector('.goal-ring');
  const ringText = document.querySelector('.ring-inner strong');
  if (!ring || !ringText) return;

  const goalTarget = 100000;
  const percent = Math.min(100, (savedValue / goalTarget) * 100);
  ring.style.background = `conic-gradient(var(--warm) 0 ${percent}%, rgba(47, 42, 45, 0.1) ${percent}% 100%)`;
  ringText.textContent = `${Math.round(percent)}%`;
};

const updateSummaryCards = () => {
  const { available, spent, saved, bills } = getInputState();

  const balanceElement = document.getElementById('balance-value');
  const spentElement = document.getElementById('spent-value');
  const savedElement = document.getElementById('saved-value');
  const billsElement = document.getElementById('bills-value');

  const leftover = Math.max(0, available - spent - bills);

  if (balanceElement) balanceElement.textContent = formatCurrency(leftover);
  if (spentElement) spentElement.textContent = formatCurrency(spent);
  if (savedElement) savedElement.textContent = formatCurrency(saved);
  if (billsElement) billsElement.textContent = formatCurrency(bills);

  const balanceNote = document.getElementById('balance-note');
  const spentNote = document.getElementById('spent-note');
  const savedNote = document.getElementById('saved-note');
  const billsNote = document.getElementById('bills-note');

  if (balanceNote) {
    const monthlyBoost = Math.round(saved * 0.26);
    balanceNote.textContent = `${formatCurrency(leftover)} left after bills`;
  }

  if (spentNote) {
    const budget = Math.max(35000, spent || 35000);
    spentNote.textContent = `of ${formatCurrency(budget)} budget`;
  }

  if (savedNote) {
    const percentOfGoal = Math.min(100, Math.round((saved / 100000) * 100));
    savedNote.textContent = `${percentOfGoal}% of target`;
  }

  if (billsNote) {
    const upcoming = Math.max(1, Math.round(bills / 2000));
    billsNote.textContent = `${upcoming} upcoming`;
  }

  const leftoverValue = document.getElementById('leftover-value');
  const ratioValue = document.getElementById('ratio-value');

  if (leftoverValue) leftoverValue.textContent = formatCurrency(leftover);
  if (ratioValue) ratioValue.textContent = getRatioText(spent, available);

  const ratioBox = document.getElementById('ratio-box');
  if (ratioBox) {
    const ratio = available > 0 ? (spent / available) * 100 : 0;
    ratioBox.classList.toggle('warning', ratio >= 50);
  }

  updateGoalProgress(saved);
  renderBars({ available, spent, saved, bills });
};

const renderCategories = () => {
  const list = document.getElementById('category-list');
  if (!list) return;

  list.innerHTML = categoryData
    .map(
      (item) => `
        <div class="category-item">
          <div class="category-meta">
            <strong>${item.name}</strong>
            <div class="progress-track">
              <span class="progress-fill" style="width: ${item.percent}%"></span>
            </div>
          </div>
          <div class="category-amount">KSh ${item.amount.toLocaleString()}</div>
        </div>
      `
    )
    .join('');
};

const setActiveRange = (event) => {
  const buttons = document.querySelectorAll('.range-button');
  buttons.forEach((button) => {
    button.classList.toggle('active', button === event.currentTarget);
  });
};

const resetValues = () => {
  const defaults = {
    'input-available': 48120,
    'input-spent': 18680,
    'input-saved': 9240,
    'input-bills': 6200
  };

  Object.entries(defaults).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });

  updateSummaryCards();
};

const updateDateLabel = () => {
  const dateInput = document.getElementById('date-picker');
  if (!dateInput) return;

  const value = dateInput.value;
  if (!value) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

  const selectedDate = new Date(`${dateInput.value}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(selectedDate);

  dateInput.setAttribute('aria-label', formattedDate);
};

const resetDate = () => {
  const dateInput = document.getElementById('date-picker');
  if (!dateInput) return;

  const today = new Date();
  dateInput.value = today.toISOString().split('T')[0];
  updateDateLabel();
};

document.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  updateSummaryCards();
  updateDateLabel();

  ['input-available', 'input-spent', 'input-saved', 'input-bills'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateSummaryCards);
    }
  });

  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', resetValues);
  }

  const dateInput = document.getElementById('date-picker');
  if (dateInput) {
    dateInput.addEventListener('change', updateDateLabel);
    dateInput.addEventListener('input', updateDateLabel);
  }

  const dateResetButton = document.getElementById('date-reset');
  if (dateResetButton) {
    dateResetButton.addEventListener('click', resetDate);
  }

  document.querySelectorAll('.range-button').forEach((button) => {
    button.addEventListener('click', setActiveRange);
  });
});
