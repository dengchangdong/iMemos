import { Hono } from 'hono'
import homeRoute from './routes/home.js'
import postRoute from './routes/post.js'
import tagRoute from './routes/tag.js'
import apiRoute from './routes/api.js'
import offlineRoute from './routes/offline.js'
import offlineImageRoute from './routes/offline-image.js'

const app = new Hono()

app.get('/', homeRoute)
app.get('/post/:name', postRoute)
app.get('/tag/:tag', tagRoute)
app.get('/api/v1/memo', apiRoute)
app.get('/offline.html', offlineRoute)
app.get('/offline-image.png', offlineImageRoute)

export default app 