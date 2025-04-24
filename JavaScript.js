//  Global Variables
let expenses = [];
let monthlyBudget = 0;
let chart = null;

// {DOM Elements}
// Budget elements
const budgetAmountEl = document.getElementById('budget-amount');
const spentAmountEl = document.getElementById('spent-amount');
const remainingAmountEl = document.getElementById('remaining-amount');
const progressBarEl = document.getElementById('progress-bar');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetModal = document.getElementById('budget-modal');
const budgetForm = document.getElementById('budget-form');
const budgetInput = document.getElementById('budget-input');

// Category totals
const foodTotalEl = document.getElementById('food-total');
const travelTotalEl = document.getElementById('travel-total');
const stationeryTotalEl = document.getElementById('stationery-total');
const miscTotalEl = document.getElementById('misc-total');

// Expense form elements
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');

// Expense list elements
const expenseItemsEl = document.getElementById('expense-items');
const noExpensesEl = document.getElementById('no-expenses');
const filterCategoryEl = document.getElementById('filter-category');
const filterPeriodEl = document.getElementById('filter-period');

// Edit modal elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editAmountInput = document.getElementById('edit-amount');
const editCategoryInput = document.getElementById('edit-category');
const editDateInput = document.getElementById('edit-date');
const editNotesInput = document.getElementById('edit-notes');

// Alert toast element
const alertToast = document.getElementById('alert-toast');
const alertMessage = document.getElementById('alert-message');

// Chart element
const expenseChart = document.getElementById('expense-chart');

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', init);
expenseForm.addEventListener('submit', addExpense);
budgetForm.addEventListener('submit', saveBudget);
setBudgetBtn.addEventListener('click', openBudgetModal);
editForm.addEventListener('submit', updateExpense);
filterCategoryEl.addEventListener('change', filterExpenses);
filterPeriodEl.addEventListener('change', filterExpenses);
themeToggle.addEventListener('click', toggleTheme);

// Close modals when clicking on X or outside the modal
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModals);
});

window.addEventListener('click', (e) => {
    if (e.target === budgetModal) closeModals();
    if (e.target === editModal) closeModals();
});

// ===== Initialize the Application =====
function init() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Load data from localStorage
    loadBudget();
    loadExpenses();
    
    // Update UI
    updateDashboard();
    renderExpenseList();
    createChart();
}

// ===== Data Management Functions =====
function loadBudget() {
    const savedBudget = localStorage.getItem('monthlyBudget');
    if (savedBudget) {
        monthlyBudget = parseFloat(savedBudget);
        budgetInput.value = monthlyBudget;
    }
}

function loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function saveBudget(e) {
    e.preventDefault();
    monthlyBudget = parseFloat(budgetInput.value);
    localStorage.setItem('monthlyBudget', monthlyBudget);
    updateDashboard();
    closeModals();
    
    // Show success notification
    showAlert('Budget saved successfully!', 'success');
}

// ===== Expense Management Functions =====
function addExpense(e) {
    e.preventDefault();
    
    // Get form values
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const notes = notesInput.value.trim();
    
    // Create new expense object
    const newExpense = {
        id: Date.now(), // Use timestamp as unique ID
        amount,
        category,
        date,
        notes
    };
    
    // Add to expenses array
    expenses.push(newExpense);
    
    // Save to localStorage
    saveExpenses();
    
    // Update UI
    updateDashboard();
    renderExpenseList();
    updateChart();
    
    // Reset form
    expenseForm.reset();
    dateInput.value = new Date().toISOString().split('T')[0]; // Reset to today
    
    // Show success message
    showAlert('Expense added successfully!', 'success');
    
    // Check if budget exceeded
    checkBudgetStatus();
}

function editExpense(id) {
    // Find expense by id
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;
    
    // Populate edit form
    editIdInput.value = expense.id;
    editAmountInput.value = expense.amount;
    editCategoryInput.value = expense.category;
    editDateInput.value = expense.date;
    editNotesInput.value = expense.notes;
    
    // Open edit modal
    editModal.style.display = 'flex';
}

function updateExpense(e) {
    e.preventDefault();
    
    const id = parseInt(editIdInput.value);
    const amount = parseFloat(editAmountInput.value);
    const category = editCategoryInput.value;
    const date = editDateInput.value;
    const notes = editNotesInput.value.trim();
    
    // Find and update expense
    const index = expenses.findIndex(exp => exp.id === id);
    if (index !== -1) {
        expenses[index] = {
            id,
            amount,
            category,
            date,
            notes
        };
        
        // Save to localStorage
        saveExpenses();
        
        // Update UI
        updateDashboard();
        renderExpenseList();
        updateChart();
        
        // Close modal
        closeModals();
        
        // Show success message
        showAlert('Expense updated successfully!', 'success');
        
        // Check budget status
        checkBudgetStatus();
    }
}

function deleteExpense(id) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this expense?')) {
        // Remove expense from array
        expenses = expenses.filter(exp => exp.id !== id);
        
        // Save to localStorage
        saveExpenses();
        
        // Update UI
        updateDashboard();
        renderExpenseList();
        updateChart();
        
        // Show success message
        showAlert('Expense deleted successfully!', 'success');
    }
}

// ===== UI Update Functions =====
function updateDashboard() {
    // Filter expenses for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    // Calculate total spent amount
    const totalSpent = monthlyExpenses.reduce((total, exp) => total + exp.amount, 0);
    
    // Calculate remaining budget
    const remainingBudget = monthlyBudget - totalSpent;
    
    // Update UI elements
    budgetAmountEl.textContent = `₹${monthlyBudget.toFixed(2)}`;
    spentAmountEl.textContent = `₹${totalSpent.toFixed(2)}`;
    remainingAmountEl.textContent = `₹${remainingBudget.toFixed(2)}`;
    
    // Update progress bar
    if (monthlyBudget > 0) {
        const percentage = (totalSpent / monthlyBudget) * 100;
        progressBarEl.style.width = `${Math.min(percentage, 100)}%`;
        
        // Change color based on percentage
        if (percentage >= 100) {
            progressBarEl.className = 'progress-bar danger';
        } else if (percentage >= 80) {
            progressBarEl.className = 'progress-bar warning';
        } else {
            progressBarEl.className = 'progress-bar';
        }
    } else {
        progressBarEl.style.width = '0%';
    }
    
    // Update category totals
    const categoryTotals = {
        food: 0,
        travel: 0,
        stationery: 0,
        misc: 0
    };
    
    monthlyExpenses.forEach(exp => {
        categoryTotals[exp.category] += exp.amount;
    });
    
    foodTotalEl.textContent = `₹${categoryTotals.food.toFixed(2)}`;
    travelTotalEl.textContent = `₹${categoryTotals.travel.toFixed(2)}`;
    stationeryTotalEl.textContent = `₹${categoryTotals.stationery.toFixed(2)}`;
    miscTotalEl.textContent = `₹${categoryTotals.misc.toFixed(2)}`;
}

function renderExpenseList() {
    // Clear expense list
    expenseItemsEl.innerHTML = '';
    
    // Get filtered expenses
    const filteredExpenses = getFilteredExpenses();
    
    // Check if there are expenses to display
    if (filteredExpenses.length === 0) {
        noExpensesEl.style.display = 'block';
        return;
    } else {
        noExpensesEl.style.display = 'none';
    }
    
    // Sort expenses by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create expense list items
    filteredExpenses.forEach(expense => {
        const tr = document.createElement('tr');
        
        // Format date
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="category-badge ${expense.category}">${expense.category}</span></td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td>${expense.notes || '-'}</td>
            <td class="expense-actions">
                <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        // Add event listeners to action buttons
        const editBtn = tr.querySelector('.edit-btn');
        const deleteBtn = tr.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => editExpense(expense.id));
        deleteBtn.addEventListener('click', () => deleteExpense(expense.id));
        
        expenseItemsEl.appendChild(tr);
    });
}

function getFilteredExpenses() {
    const categoryFilter = filterCategoryEl.value;
    const periodFilter = filterPeriodEl.value;
    
    // Filter by category
    let filteredByCategory = expenses;
    if (categoryFilter !== 'all') {
        filteredByCategory = expenses.filter(exp => exp.category === categoryFilter);
    }
    
    // Filter by time period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let filteredByPeriod = filteredByCategory;
    if (periodFilter === 'today') {
        filteredByPeriod = filteredByCategory.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.toDateString() === today.toDateString();
        });
    } else if (periodFilter === 'week') {
        filteredByPeriod = filteredByCategory.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startOfWeek;
        });
    } else if (periodFilter === 'month') {
        filteredByPeriod = filteredByCategory.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startOfMonth;
        });
    }
    
    return filteredByPeriod;
}

function filterExpenses() {
    renderExpenseList();
    updateChart();
}

// ===== Chart Functions =====
function createChart() {
    const ctx = expenseChart.getContext('2d');
    
    // Get category data
    const data = getCategoryData();
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Food', 'Travel', 'Stationery', 'Miscellaneous'],
            datasets: [{
                data: [data.food, data.travel, data.stationery, data.misc],
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--food-color'),
                    getComputedStyle(document.documentElement).getPropertyValue('--travel-color'),
                    getComputedStyle(document.documentElement).getPropertyValue('--stationery-color'),
                    getComputedStyle(document.documentElement).getPropertyValue('--misc-color')
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                },
                title: {
                    display: true,
                    text: 'Expense Distribution by Category',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

function updateChart() {
    // Get updated category data
    const data = getCategoryData();
    
    // Update chart data
    chart.data.datasets[0].data = [data.food, data.travel, data.stationery, data.misc];
    
    // Update chart colors based on current theme
    chart.data.datasets[0].backgroundColor = [
        getComputedStyle(document.documentElement).getPropertyValue('--food-color'),
        getComputedStyle(document.documentElement).getPropertyValue('--travel-color'),
        getComputedStyle(document.documentElement).getPropertyValue('--stationery-color'),
        getComputedStyle(document.documentElement).getPropertyValue('--misc-color')
    ];
    
    // Update legend and title colors
    chart.options.plugins.legend.labels.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    chart.options.plugins.title.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    
    // Update chart
    chart.update();
}

function getCategoryData() {
    // Get filtered expenses
    const filteredExpenses = getFilteredExpenses();
    
    // Calculate totals by category
    const data = {
        food: 0,
        travel: 0,
        stationery: 0,
        misc: 0
    };
    
    filteredExpenses.forEach(exp => {
        data[exp.category] += exp.amount;
    });
    
    return data;
}

// ===== Modal Functions =====
function openBudgetModal() {
    budgetModal.style.display = 'flex';
    budgetInput.value = monthlyBudget;
    budgetInput.focus();
}

function closeModals() {
    budgetModal.style.display = 'none';
    editModal.style.display = 'none';
}

// ===== Theme Functions =====
function toggleTheme() {
    const body = document.body;
    const iconEl = themeToggle.querySelector('i');
    
    if (body.classList.contains('dark-mode')) {
        // Switch to light mode
        body.classList.remove('dark-mode');
        iconEl.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to dark mode
        body.classList.add('dark-mode');
        iconEl.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
    
    // Update chart colors
    updateChart();
}

// ===== Utility Functions =====
function checkBudgetStatus() {
    // Calculate total spent this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const totalSpent = monthlyExpenses.reduce((total, exp) => total + exp.amount, 0);
    
    // Check if budget is exceeded
    if (monthlyBudget > 0 && totalSpent > monthlyBudget) {
        // Show alert
        showAlert('Budget limit exceeded! You\'ve spent ₹' + (totalSpent - monthlyBudget).toFixed(2) + ' over your budget.', 'danger');
        
        // Play sound effect
        playAlertSound();
        
        // Animate budget section
        document.querySelector('.budget-container').classList.add('pulse');
        setTimeout(() => {
            document.querySelector('.budget-container').classList.remove('pulse');
        }, 600);
    }
}

function showAlert(message, type = 'danger') {
    // Set message
    alertMessage.textContent = message;
    
    // Set color based on type
    if (type === 'success') {
        alertToast.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'warning') {
        alertToast.style.backgroundColor = 'var(--warning-color)';
    } else {
        alertToast.style.backgroundColor = 'var(--danger-color)';
    }
    
    // Show toast
    alertToast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        alertToast.classList.remove('show');
    }, 3000);
}


// Load theme preference from localStorage
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const iconEl = themeToggle.querySelector('i');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        iconEl.className = 'fas fa-sun';
    } else {
        body.classList.remove('dark-mode');
        iconEl.className = 'fas fa-moon';
    }
}

// Call this function on init
loadThemePreference();