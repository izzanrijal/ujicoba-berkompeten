import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testCode = searchParams.get('testCode')

  if (!testCode) {
    return NextResponse.json({ error: 'Test code is required' }, { status: 400 })
  }

  const questionPackagesDir = path.join(process.cwd(), 'public', 'question_packages')

  try {
    const files = await fs.readdir(questionPackagesDir)
    const matchingFile = files.find(file => file.toLowerCase() === `${testCode.toLowerCase()}.json`)

    if (!matchingFile) {
      return NextResponse.json({ error: 'Question package not found' }, { status: 404 })
    }

    const fileContents = await fs.readFile(path.join(questionPackagesDir, matchingFile), 'utf8')
    const questions = JSON.parse(fileContents)

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error reading question package:', error)
    return NextResponse.json({ error: 'Error reading question package' }, { status: 500 })
  }
}

