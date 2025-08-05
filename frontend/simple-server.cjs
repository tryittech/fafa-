const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3000
const DIST_DIR = path.join(__dirname, 'dist')

// MIME 類型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

const server = http.createServer((req, res) => {
  // 處理 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  // API 代理到後端
  if (req.url.startsWith('/api')) {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: req.url,
      method: req.method,
      headers: req.headers
    }
    
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })
    
    proxy.on('error', (err) => {
      console.error('代理錯誤:', err)
      res.writeHead(500)
      res.end('代理錯誤')
    })
    
    req.pipe(proxy)
    return
  }
  
  // 處理靜態文件
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url)
  
  // 如果文件不存在，回傳 index.html (用於 SPA 路由)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html')
  }
  
  try {
    const data = fs.readFileSync(filePath)
    const ext = path.extname(filePath)
    const contentType = mimeTypes[ext] || 'text/plain'
    
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  } catch (error) {
    console.error('讀取文件錯誤:', error)
    res.writeHead(404)
    res.end('文件不存在')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 前端服務器已啟動`)
  console.log(`📍 地址: http://localhost:${PORT}`)
  console.log(`📁 服務目錄: ${DIST_DIR}`)
  console.log(`🔄 API 代理: http://localhost:5001`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`)
    process.exit(1)
  } else {
    console.error('服務器錯誤:', err)
  }
})