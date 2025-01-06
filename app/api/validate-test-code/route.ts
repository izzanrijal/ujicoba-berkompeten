import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const questionPackagesDir = path.join(process.cwd(), 'public', 'question_packages')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testCode = searchParams.get('testCode')

  if (!testCode) {
    return NextResponse.json({ error: 'Test code is required' }, { status: 400 })
  }

  try {
    const files = await fs.readdir(questionPackagesDir)
    const matchingFile = files.find(file => file.toLowerCase() === `${testCode.toLowerCase()}.json`)

    if (!matchingFile) {
      return NextResponse.json({ error: 'Test code not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error validating test code:', error)
    return NextResponse.json({ error: 'Error validating test code' }, { status: 500 })
  }
}

