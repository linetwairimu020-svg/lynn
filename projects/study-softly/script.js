const STORAGE_KEY = 'study-softly.tasks';
const MOOD_KEY = 'study-softly.mood';
const STREAK_KEY = 'study-softly.streak';
const LAST_STUDY_DATE_KEY = 'study-softly.lastStudyDate';
const THEME_KEY = 'study-softly.theme';
const WEEKLY_PROGRESS_KEY = 'study-softly.weekly-progress';

const defaultTasks = [
  { id: crypto.randomUUID(), title: 'Review chemistry notes', subject: 'Chemistry', duration: 25, completed: false },
  { id: crypto.randomUUID(), title: 'Practice algebra set', subject: 'Math', duration: 35, completed: false },
  { id: crypto.randomUUID(), title: 'Read one chapter of literature', subject: 'English', duration: 20, completed: true }
];

const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const subjectInput = document.querySelector('#task-subject');
const durationInput = document.querySelector('#task-duration');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const doneCount = document.querySelector('#done-count');
const focusMinutes = document.querySelector('#focus-minutes');
const streakCount = document.querySelector('#streak-count');
const todayDate = document.querySelector('#today-date');
const clearCompletedBtn = document.querySelector('#clear-completed');
const chart = document.querySelector('#progress-chart');

const timerDisplay = document.querySelector('#timer-display');
const startTimerBtn = document.querySelector('#start-timer');
const pauseTimerBtn = document.querySelector('#pause-timer');
const timerStatus = document.querySelector('#timer-status');
const moodOptions = document.querySelectorAll('input[name="mood"]');
const themeToggle = document.querySelector('.theme-toggle');

const getWeeklyProgress = () => {
  const raw = localStorage.getItem(WEEKLY_PROGRESS_KEY);

  if (!raw) {
    const initial = Array(7).fill(0);
    localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 7) {
      const fallback = Array(7).fill(0);
      localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(fallback));
      return fallback;
    }
    return parsed.map((value) => Math.max(0, Number(value) || 0));
  } catch (error) {
    const fallback = Array(7).fill(0);
    localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(fallback));
    return fallback;
  }
};

const updateWeeklyProgress = (minutesDelta) => {
  const data = getWeeklyProgress();
  const currentDayIndex = new Date().getDay();
  data[currentDayIndex] = Math.max(0, data[currentDayIndex] + minutesDelta);
  localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(data));
};

const loadTasks = () => {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return defaultTasks;
  }

  try {
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultTasks;
  } catch (error) {
    return defaultTasks;
  }
};

let tasks = loadTasks();
let timer = {
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  intervalId: null,
  active: false
};

const setDateLabel = () => {
  const now = new Date();
  todayDate.textContent = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(now);
};

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const setMood = (value) => {
  localStorage.setItem(MOOD_KEY, value);
  moodOptions.forEach((option) => {
    const label = option.closest('.mood-option');
    const isSelected = option.value === value;
    option.checked = isSelected;
    label?.classList.toggle('is-selected', isSelected);
  });
};

const loadMood = () => {
  const savedMood = localStorage.getItem(MOOD_KEY) || 'calm';
  setMood(savedMood);
};

const setTheme = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);

  if (themeToggle) {
    const isDark = nextTheme === 'dark';
    const toggleLabel = themeToggle.querySelector('.toggle-label');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    if (toggleLabel) {
      toggleLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
    }
  }
};

const loadTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(savedTheme);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const updateStreak = () => {
  const today = new Date().toDateString();
  const lastStudyDate = localStorage.getItem(LAST_STUDY_DATE_KEY);
  const hasCompletedTaskToday = tasks.some((task) => task.completed);

  let streak = Number(localStorage.getItem(STREAK_KEY) || '1');

  if (hasCompletedTaskToday && lastStudyDate !== today) {
    const lastDate = lastStudyDate ? new Date(lastStudyDate) : null;
    const previousDay = lastDate ? new Date(lastDate) : null;
    const difference = previousDay ? Math.round((new Date(today) - previousDay) / 86400000) : 1;

    streak = difference === 1 ? streak + 1 : 1;
    localStorage.setItem(STREAK_KEY, String(streak));
    localStorage.setItem(LAST_STUDY_DATE_KEY, today);
  } else if (!hasCompletedTaskToday && lastStudyDate !== today) {
    localStorage.setItem(LAST_STUDY_DATE_KEY, today);
  }

  streakCount.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
};

const renderChart = () => {
  if (!chart) {
    return;
  }

  const data = getWeeklyProgress();
  const maxValue = Math.max(...data, 40);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  chart.innerHTML = data
    .map((value, index) => {
      const percent = Math.max((value / maxValue) * 100, value > 0 ? 12 : 6);
      const label = dayNames[index];
      return `
        <div class="chart-column">
          <span class="chart-fill" style="height: ${percent}%"></span>
          <small>${label}</small>
        </div>
      `;
    })
    .join('');
};

const updateTaskSummary = () => {
  const completed = tasks.filter((task) => task.completed).length;
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.completed ? Number(task.duration) : 0), 0);

  taskCount.textContent = String(tasks.length);
  doneCount.textContent = String(completed);
  focusMinutes.textContent = `${totalMinutes}m`;
  renderChart();
  updateStreak();
};

const renderTasks = () => {
  if (!tasks.length) {
    taskList.innerHTML = '<li class="empty-state">No tasks yet. Add your first gentle study step.</li>';
    updateTaskSummary();
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const completedClass = task.completed ? 'completed' : '';
      return `
        <li class="task-item ${completedClass}" data-id="${task.id}">
          <input class="task-check" type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark ${task.title} complete" />
          <div class="task-main">
            <p class="task-title">${task.title}</p>
            <div class="task-meta">
              <span class="pill">${task.subject}</span>
              <span class="pill">${task.duration} min</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="delete-button" type="button" aria-label="Delete ${task.title}">×</button>
          </div>
        </li>
      `;
    })
    .join('');

  updateTaskSummary();
};

const addTask = (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const duration = Number(durationInput.value);

  if (!title || !subject || !duration) {
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    subject,
    duration,
    completed: false
  });

  saveTasks();
  renderTasks();
  form.reset();
  durationInput.value = '25';
  titleInput.focus();
};

const toggleTask = (taskId) => {
  const targetTask = tasks.find((task) => task.id === taskId);

  if (!targetTask) {
    return;
  }

  const wasCompleted = targetTask.completed;
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );

  const minutesDelta = wasCompleted ? -Number(targetTask.duration) : Number(targetTask.duration);
  updateWeeklyProgress(minutesDelta);
  saveTasks();
  updateTaskSummary();
  renderTasks();
};

const deleteTask = (taskId) => {
  const targetTask = tasks.find((task) => task.id === taskId);

  if (targetTask && targetTask.completed) {
    updateWeeklyProgress(-Number(targetTask.duration));
  }

  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
};

const clearCompletedTasks = () => {
  const completedMinutes = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + Number(task.duration), 0);

  if (completedMinutes > 0) {
    updateWeeklyProgress(-completedMinutes);
  }

  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
};

const attachTaskEvents = () => {
  if (!taskList) {
    return;
  }

  taskList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete-button');
    const checkbox = event.target.closest('.task-check');
    const item = event.target.closest('.task-item');

    if (deleteButton && item) {
      deleteTask(item.dataset.id);
      return;
    }

    if (checkbox && item) {
      toggleTask(item.dataset.id);
    }
  });
};

const updateTimerDisplay = () => {
  timerDisplay.textContent = formatTime(timer.remainingSeconds);
};

const resetTimer = (minutes = 25) => {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.active = false;
  timer.totalSeconds = minutes * 60;
  timer.remainingSeconds = minutes * 60;
  updateTimerDisplay();
  timerStatus.textContent = 'A calm session starts with one deep breath.';
};

const startTimer = () => {
  if (timer.active) {
    return;
  }

  timer.active = true;
  timerStatus.textContent = 'You’re in the zone. Keep your attention gentle and steady.';

  timer.intervalId = setInterval(() => {
    if (timer.remainingSeconds > 0) {
      timer.remainingSeconds -= 1;
      updateTimerDisplay();
      return;
    }

    clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.active = false;
    timerStatus.textContent = 'Session complete. Take a soft pause before starting the next one.';
  }, 1000);
};

const pauseTimer = () => {
  if (!timer.active) {
    return;
  }

  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.active = false;
  timerStatus.textContent = 'Paused. You can jump back in when you’re ready.';
};

const handleQuickTimer = () => {
  const firstTask = tasks.find((task) => !task.completed);
  if (firstTask) {
    resetTimer(Number(firstTask.duration));
    timerStatus.textContent = `Focused on: ${firstTask.title}.`;
    return true;
  }

  resetTimer();
  return false;
};

if (form) {
  form.addEventListener('submit', addTask);
}

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);
}

if (startTimerBtn) {
  startTimerBtn.addEventListener('click', () => {
    if (!timer.active) {
      const isFreshTimer = timer.remainingSeconds === timer.totalSeconds && timer.totalSeconds === 25 * 60;
      if (isFreshTimer) {
        handleQuickTimer();
      }
      startTimer();
    }
  });
}

if (pauseTimerBtn) {
  pauseTimerBtn.addEventListener('click', pauseTimer);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}

moodOptions.forEach((option) => {
  option.addEventListener('change', (event) => setMood(event.target.value));
});

setDateLabel();
loadTheme();
loadMood();

if (taskList) {
  attachTaskEvents();
  renderTasks();
}

if (timerDisplay) {
  resetTimer();
}
