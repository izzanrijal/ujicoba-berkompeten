import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const dataDir = path.join(process.cwd(), 'data')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testCode = searchParams.get('testCode')
  const userId = searchParams.get('userId')

  if (!testCode || !userId) {
    return NextResponse.json({ error: 'Test code and user ID are required' }, { status: 400 })
  }

  const resultsFilePath = path.join(dataDir, 'results.json')

  try {
    const fileContents = await fs.readFile(resultsFilePath, 'utf8')
    const results = JSON.parse(fileContents)

    const userResult = results.find((result: any) => 
      result.user_id === userId && result.test_code === testCode
    )

    if (!userResult) {
      return NextResponse.json({ error: 'No results found for this user and test code' }, { status: 404 })
    }

    return NextResponse.json(userResult)
  } catch (error) {
    console.error('Error reading results:', error)
    return NextResponse.json({ error: 'Error reading or processing results' }, { status: 500 })
  }
}

