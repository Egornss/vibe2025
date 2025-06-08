@@ -1,87 +1,147 @@
const http = require('http');
const fs = require('fs');
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

const PORT = 3000;

// Database connection settings
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'todolist',
  };
  host: '127.0.0.1',
  user: 'root',
  password: '1234',
  database: 'todolist',
  port: 3306
};


  async function retrieveListItems() {
    try {
      // Create a connection to the database
      const connection = await mysql.createConnection(dbConfig);

      // Query to select all items from the database
      const query = 'SELECT id, text FROM items';

      // Execute the query
      const [rows] = await connection.execute(query);

      // Close the connection
      await connection.end();

      // Return the retrieved items as a JSON array
      return rows;
    } catch (error) {
      console.error('Error retrieving list items:', error);
      throw error; // Re-throw the error
    }
async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Успешное подключение к MySQL');
    await connection.end();
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
    process.exit(1);
  }
}

// Stub function for generating HTML rows
async function getHtmlRows() {
    // Example data - replace with actual DB data later
    /*
    const todoItems = [
        { id: 1, text: 'First todo item' },
        { id: 2, text: 'Second todo item' }
    ];*/
async function retrieveListItems() {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT id, text FROM items ORDER BY id');
  await connection.end();
  return rows;
}

    const todoItems = await retrieveListItems();
async function addItem(text) {
  const connection = await mysql.createConnection(dbConfig);
  const [result] = await connection.execute(
    'INSERT INTO items (text) VALUES (?)',
    [text]
  );
  await connection.end();
  return result.insertId;
}

    // Generate HTML for each item
    return todoItems.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.text}</td>
            <td><button class="delete-btn">×</button></td>
        </tr>
    `).join('');
async function deleteItem(id) {
  const connection = await mysql.createConnection(dbConfig);
  await connection.execute('DELETE FROM items WHERE id = ?', [id]);
  await connection.end();
}

async function updateItem(id, text) {
  const connection = await mysql.createConnection(dbConfig);
  await connection.execute(
    'UPDATE items SET text = ? WHERE id = ?',
    [text, id]
  );
  await connection.end();
}

// Modified request handler with template replacement
async function handleRequest(req, res) {
    if (req.url === '/') {
        try {
            const html = await fs.promises.readFile(
                path.join(__dirname, 'index.html'), 
                'utf8'
            );

            // Replace template placeholder with actual content
            const processedHtml = html.replace('{{rows}}', await getHtmlRows());

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(processedHtml);
        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading index.html');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
  // Добавляем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/' && req.method === 'GET') {
    try {
      const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
      const items = await retrieveListItems();

      const rows = items.map(item => `
        <tr data-id="${item.id}">
          <td>${item.id}</td>
          <td>${item.text}</td>
          <td>
            <button class="edit-btn" data-id="${item.id}">Edit</button>
            <button class="delete-btn" data-id="${item.id}">×</button>
          </td>
        </tr>
      `).join('');

      const processedHtml = html.replace('{{rows}}', rows);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(processedHtml);
    } catch (err) {
      console.error('Ошибка:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Ошибка загрузки страницы');
    }
  } 
  else if (req.url === '/api/items' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        const id = await addItem(text);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, text }));
      } catch (error) {
        console.error(error);
        res.writeHead(500);
        res.end('Error adding item');
      }
    });
  }
  else if (req.url.startsWith('/api/items/') && req.method === 'DELETE') {
    const id = req.url.split('/')[3];
    try {
      await deleteItem(id);
      res.writeHead(204);
      res.end();
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Error deleting item');
    }
  }
  else if (req.url.startsWith('/api/items/') && req.method === 'PUT') {
    const id = req.url.split('/')[3];
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        await updateItem(id, text);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, text }));
      } catch (error) {
        console.error(error);
        res.writeHead(500);
        res.end('Error updating item');
      }
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

async function startServer() {
  await testConnection();
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
}

// Create and start server
const server = http.createServer(handleRequest);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
startServer();
Footer
© 2025 GitHub, Inc.
Footer navigation
Terms
