const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Serve static files in the 'public' folder
app.use(express.static('public'));

// Endpoint to serve the todo list JSON
app.get('/tasks', (req, res) => {
  fs.readFile('./taskList.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading task list:', err);
      res.status(500).json({ error: 'Failed to load tasks' });
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Endpoint to save new JSON file from client
app.put('/tasks', (req, res) => {
  let updatedTasks = '';
  
  req.on('data', chunk => { updatedTasks += chunk; });
  req.on('end', () => {
    fs.writeFile('./taskList.json', updatedTasks, (err) => {
      if (err) {
        console.error('Error saving tasks:', err);
        res.status(500).json({ error: 'Failed to save tasks' });
        return;
      }
      res.json({ message: 'Tasks saved successfully' });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
