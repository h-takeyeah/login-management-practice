import { createHash } from 'crypto'
import { resolve } from 'path'
import { Database } from 'sqlite3'

export const db = new Database(resolve(__dirname, 'main.sqlite'))
db.run('create table if not exists users (userid text, hash text, token text)')

export class AuthError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

function getHash(pw: string): string {
  const salt = '::EVuCM0QwfI48Krpr'
  const hashsum = createHash('sha512')
  hashsum.update(pw + salt)
  return hashsum.digest('hex')
}

function getAuthToken(userId: string) {
  const time = (new Date()).getTime()
  return getHash(`${userId}:${time}`)
}

// search
export interface User {
  userid: string
  hash: string
  token: string
}

export function getUser(userid: string) {
  return new Promise<User | null>((resolve, reject) => {
    db.get('select * from users where userid = ?', [userid], (err: Error | null, row: any) => {
      if (err) {
        console.error('[db.getUser]', err)
        reject(err)
      } else {
        if (!row) {
          console.log(`[db.getUser] ${userid} not found`)
          resolve(null)
        } else {
          if (row?.userid && row?.hash && row?.token) {
            console.log(`[db.getUser] ${userid} found`)
            resolve({
              userid: row.userid,
              hash: row.hash,
              token: row.token
            })
          } else {
            /* not reachable!!! */
            // console.log('[db.getUser] ???')
          }
        }
      }
    })
  })
}

export function addUser(userid: string, passwd: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = getHash(passwd)
    const token = getAuthToken(userid)
    db.run('insert into users (userid, hash, token) values($userid, $hash, $token)', {
      $userid: userid,
      $hash: hash,
      $token: token
    }, (err: Error | null) => {
      if (err) {
        console.error('[db.addUser]', err)
        reject(err)
      }
      else resolve(token)
    })
  })
}

export function updateUser(user: User) {
  return new Promise<void>((resolve, reject) => {
    db.run('update users set userid = $userid, hash = $hash, token = $token where userid = $userid', {
      $userid: user.userid,
      $hash: user.hash,
      $token: user.token
    }, (err: Error | null) => {
      if(err) {
        console.error('[db.updateUser]', err)
        reject(err)
      }
      else resolve()
    })
  })
}

export async function checkToken(userid: string, token: string) {
  return getUser(userid).then(user => {
    if (user !== null && user.token !== token) {
      throw new AuthError('Authentication error')
    }
  })
}

export async function login(userid: string, passwd: string) {
  const hash = getHash(passwd)
  const token = getAuthToken(userid)
  const user = await getUser(userid)
  if (user === null) {
    throw new AuthError('User does not exist')
  } else if (user.hash !== hash) {
    throw new AuthError('Password is wrong')
  } else {
    user.token = token
    await updateUser(user)
    return user.token
  }
}

