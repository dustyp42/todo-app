let table;
let tablesort;
let taskData = {}; // This dictionary stores the task data. Keys are taskCreationTimes
let categoryMappings = {}; // Global variable to store category mappings
let selectedTaskId = null;

// Main function to fetch JSON and populate the UI
function populateFromServer() {
  fetch('/tasks', { cache: "no-store" })
    .then(response => response.json())
    .then(data => {
      categoryMappings = data.categories; // Emoji to category mappings
      taskData = data.tasks; // Now data.tasks is already an object with taskCreationTime as keys

      // NOTE: These two calls are here because it forces them to run AFTER the data is pulled from the server.
      // I could possibly restructure this better, but maybe no need. 
      populateCategoryDropdown();
      populateTaskTable();
    })
    .catch(error => console.error('Error loading tasks:', error));
}

// Populate the task table based on local object "taskData"
function populateTaskTable() {
  const tableBody = document.querySelector('#taskTable tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  // Loop through taskData and populate table
  for (const task of Object.values(taskData)) {
    // Skip tasks that are marked as completed (taskCompletionTime is non-zero)
    if (task.taskCompletionTime !== 0) continue;

    const categoryEmoji = categoryMappings[task.taskCategory] || '❔';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="task-name" data-id="${task.taskCreationTime}">${categoryEmoji + '&nbsp;&nbsp;' + task.taskName}</td>
      <td style="display: none;">${task.taskCreationTime}</td>
      <td style="display: none;">${task.taskCategory}</td>
      <td style="display: none;">${task.taskPriority}</td>
      <td style="display: none;">${task.taskDueTime}</td>
      <td style="display: none;">${task.taskCompletionTime}</td>
      <td style="display: none;">${task.daysToResurrect}</td>
    `;
    tableBody.appendChild(row);
  }

  // Attach click listeners to each task row
  document.querySelectorAll('.task-name').forEach(cell => {
    cell.addEventListener('mousedown', (e) => {
      const taskId = e.target.getAttribute('data-id');
      onTaskSelect(taskId);
    });
  });
}

// Function to populate the dropdown category selector
function populateCategoryDropdown() {

  const dropdown = document.getElementById('catSelect');
  dropdown.innerHTML = ''; // Clear existing options

  for (const [category, emoji] of Object.entries(categoryMappings)) {
    const option = document.createElement('option');
    option.value = category; // Set the value to the category name
    option.textContent = `${emoji} ${category}`; // Set the display text
    dropdown.appendChild(option); // Add the option to the dropdown
  }
}

// Upload updated json data to server
async function saveTaskDataToServer() {

  const jsonData = JSON.stringify({lastModified:Date.now(),categories:categoryMappings,tasks:taskData}, null, 2);

  try {
    const response = await fetch('/tasks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonData
    });

    if (!response.ok) {
      throw new Error('Failed to save tasks');
    }

    const data = await response.json();
    console.log(data.message); // Success message from the server
  } catch (error) {
    console.error('Error:', error);
  }
}

// This is what runs when a task item is clicked
function onTaskSelect(taskId) {
	
  selectedTaskId = taskId;
	
  // Remove highlight from previously selected row
  document.querySelectorAll('.selected-item').forEach(row => row.classList.remove('selected-item'));

  // Find the clicked row
  const selectedRow = document.querySelector(`.task-name[data-id="${taskId}"]`);

  // Highlight the selected row
  if (selectedRow) {
    selectedRow.parentElement.classList.add('selected-item');
    
    // Display notes for the selected task
    const task = taskData[taskId];
    const notesBox = document.getElementById('notesBox');
    notesBox.value = task.taskNotes;
    
    // And due date (if it's infinity, make this an empty string
    const dueBox = document.getElementById('dueBox');
	dueBox.value = task.taskDueTime === Infinity 
		? '' 
		: millisecToDate(task.taskDueTime);
    
    // Priority
	const priorityBox = document.getElementById('prioritySelect');
    priorityBox.value = task.taskPriority;
	
	// Name
    const nameBox = document.getElementById('nameBox');
    nameBox.value = task.taskName;
	
	// Category
	const catBox = document.getElementById('catSelect');
	catBox.value = task.taskCategory;
    
	// Resurrect
	const resurrectBox = document.getElementById('resurrectBox');
	resurrectBox.value = task.daysToResurrect;
  }
}

// Save form changes to the local taskData object
function updateTaskDataFromInputs() {
  if (selectedTaskId !== null) { // Ensure a task is selected
    const task = taskData[selectedTaskId];

  task.taskName = document.getElementById('nameBox').value;
  task.taskCategory = document.getElementById('catSelect').value;
	task.taskPriority = document.getElementById('prioritySelect').value;
	task.daysToResurrect = document.getElementById('resurrectBox').value;
	task.taskNotes = document.getElementById('notesBox').value;
	task.taskDueTime = document.getElementById('dueBox').value === '' 
		? Infinity 
		: dateToMillisec(document.getElementById('dueBox').value);
	
  }
}

// Sort table by indexed column (call this from buttons)
function sortByColumn(columnIndex) {
  const column = table.querySelectorAll("th")[columnIndex];
  tablesort.sortTable(column);
}

function millisecToDate(timestamp) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' };
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-GB', options); 
}

function dateToMillisec(dateString) {
  const options = { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric' };
  const localizedDateString = new Date(dateString).toLocaleString('en-US', options);
  const date = new Date(localizedDateString);
  return date.getTime();
}

// Add a new task to the taskData object (this bit doesn't do anything else)
function addNewTask() {
  const taskCreationTime = Date.now(); // Get the current timestamp

  // Add new task object to taskData
  taskData[taskCreationTime] = {
    taskCreationTime: taskCreationTime,
    taskName: "New thing",
    taskCategory: "idk",
    taskPriority: 0,
    taskDueTime: Infinity,
    taskCompletionTime: 0,
    taskNotes: "",
    daysToResurrect: 0
  };

  return taskCreationTime; // Return the taskCreationTime for selection
}

// Clear values from the form
function resetFormValues() {
  document.getElementById('nameBox').value = '';
  document.getElementById('catSelect').value = 'idk';
  document.getElementById('dueBox').value = '';
  document.getElementById('notesBox').value = '';
  document.getElementById('resurrectBox').value = 0;
  document.getElementById('prioritySelect').value = 0;
}

//DEBUG
function sortTasksByDate(order = 'newest') {
  const sortedTasks = Object.values(taskData).sort((a, b) => {
    return order === 'newest'
      ? b.taskCreationTime - a.taskCreationTime
      : a.taskCreationTime - b.taskCreationTime;
  });
  populateTaskTable(sortedTasks);
}

//#############################################################################
// On page load:
document.addEventListener('DOMContentLoaded', async () => {
  table = document.getElementById('taskTable');
  tablesort = new Tablesort(table);
  
  // Due date picker
  const options = {
  formatter: (input, date) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/New_York' };
    input.value = date.toLocaleDateString('en-GB', options);
    },
	customDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
	customMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  
  duePicker = new datepicker(document.getElementById('dueBox'), options);

  // Save button pressed
  document.getElementById('saveBtn').addEventListener('click', function() {
    updateTaskDataFromInputs(); // This updates the local taskData object from user inputs
	  saveTaskDataToServer(); // This pushes the new data to the server asynchronously
	  populateTaskTable(); // This repopulates the display table from the local taskData object
  });

  // New button pressed
  document.getElementById('newBtn').addEventListener('click', function() {
	  const newTaskId = addNewTask();
	  populateTaskTable();
	  sortByColumn(1);
	  onTaskSelect(newTaskId);
	  document.getElementById("taskContainer").scrollTop = 0;
	  
  });

  // Clear due date button
  document.getElementById('clearDue').addEventListener('click', function() {
      document.getElementById('dueBox').value = '';  // Clear the field
  });

  // Done button
  document.getElementById('doneBtn').addEventListener('click', function() {
    if (selectedTaskId !== null) { // Ensure a task is selected
      const task = taskData[selectedTaskId];
      task.taskCompletionTime = Date.now();
      saveTaskDataToServer();
      selectedTaskId = null;
      populateTaskTable();
      resetFormValues();
    }
  });
  
  // Test button
  document.getElementById('testBtn').addEventListener('click', function() {
    sortTasksByDate();
  });

  populateFromServer();
});