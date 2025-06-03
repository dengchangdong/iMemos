import { Hono } from 'hono'
import { routes } from './routes.js'

const app = new Hono()

app.get('/', routes.home)
app.get('/post/:name', routes.post)
app.get('/tag/:tag', routes.tag)
app.get('/api/v1/memo', routes.api)

export default app 