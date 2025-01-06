import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'
import { v4 as uuidv4 } from 'uuid'

const dataDir = path.join(process.cwd(), 'data')
const usersFilePath = path.join(dataDir, 'users.json')

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const user_id = uuidv4()
    const userData = { ...data, user_id }

    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true })

    let users = []
    try {
      // Try to read the existing users file
      const fileContents = await fs.readFile(usersFilePath, 'utf8')
      users = JSON.parse(fileContents)
    } catch (error) {
      // If the file doesn't exist, we'll create it with an empty array
      if (error.code === 'ENOENT') {
        await fs.writeFile(usersFilePath, '[]', 'utf8')
      } else {
        console.error('Error reading users file:', error)
        throw error
      }
    }

    users.push(userData)

    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error in users API route:', error)
    return NextResponse.json({ error: 'An error occurred while creating the user' }, { status: 500 })
  }
}

