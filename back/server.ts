import { createServer } from "http"
import e, { Request } from "express"
import * as db from "./database"

const app = e()
const server = createServer(app)
app.use(e.json())
server.listen(3001, () => {
  console.log('[start]')
})

interface AddUserRequest extends Request {
  body: {
    [key in 'userid' | 'passwd']: string
  }
}

app.post('/api/adduser', (req: AddUserRequest, res) => {
  const userid = req.body.userid
  const passwd = req.body.passwd
  if (!userid || !passwd) {
    return res.status(400).json({success: false, msg: 'empty param'})
  }

  db.getUser(userid).then((user) => {
    if (user) {
      return res.status(400).json({success: false, msg: 'user already exists'})
    }

    db.addUser(userid, passwd).then((token) => {
      if (!token) {
        return res.status(500).json({success: false, msg: 'internal server error'})
      }
      console.log(`[addUser] ${userid} added`)
      return res.json({success: true, token})
    })
  }).catch((reason) => {
    console.error(reason)
    return res.status(500).json({success: false, msg: 'internal server error'})
  })
})

interface LoginRequest extends Request {
  body: {
    [key in 'userid' | 'passwd']: string
  }
}

app.post('/api/login', (req: LoginRequest, res) => {
  const userid = req.body.userid
  const passwd = req.body.passwd
  if (!userid || !passwd) {
    return res.status(400).json({success: false, msg: 'empty param'})
  }

  db.login(userid, passwd).then((token) => {
    if (!token) throw new Error('token has not enough length')
    else return res.json({success: true, token})
  }).catch((reason) => {
    console.error(reason)
    if (reason instanceof db.AuthError) {
      return res.status(400).json({success: false, msg: String(reason.message) || 'error'})
    }
    return res.status(500).json({success: false, msg: 'internal server error'})
  })
})