import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const dataDir = path.join(process.cwd(), 'data')
const answersFilePath = path.join(dataDir, 'answers.json')
const resultsFilePath = path.join(dataDir, 'results.json')

async function ensureFileExists(filePath: string) {
  try {
    await fs.access(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]', 'utf8')
    } else {
      throw error
    }
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true })

    // Ensure answers.json and results.json exist
    await ensureFileExists(answersFilePath)
    await ensureFileExists(resultsFilePath)
    
    let answers = []
    let results = []

    try {
      const answersFileContents = await fs.readFile(answersFilePath, 'utf8')
      answers = JSON.parse(answersFileContents)
    } catch (error) {
      console.error('Error reading answers file:', error)
    }

    try {
      const resultsFileContents = await fs.readFile(resultsFilePath, 'utf8')
      results = JSON.parse(resultsFileContents)
    } catch (error) {
      console.error('Error reading results file:', error)
    }

    // Process answers
    const processedAnswers = data.answers.map((answer: any) => ({
      user_id: data.userId,
      question_id: answer.question_id,
      answer: answer.answer,
      confidence: answer.confidence,
      correct_answer: answer.correct_answer,
      subtopic_id: answer.subtopic_id,
      competence: answer.competence
    }))

    answers.push(...processedAnswers)

    // Process results
    const correctAnswers = data.answers.filter((answer: any) => answer.answer === answer.correct_answer).length
    const totalQuestions = data.answers.length
    const score = (correctAnswers / totalQuestions) * 100

    const confidenceCounts = {
      'very-confident': 0,
      'unsure': 0,
      'dont-know': 0
    }

    data.answers.forEach((answer: any) => {
      if (answer.confidence in confidenceCounts) {
        confidenceCounts[answer.confidence as keyof typeof confidenceCounts]++
      }
    })

    const result = {
      user_id: data.userId,
      test_code: data.testCode,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      confidence_counts: confidenceCounts,
      end_time: data.endTime
    }

    results.push(result)

    await fs.writeFile(answersFilePath, JSON.stringify(answers, null, 2))
    await fs.writeFile(resultsFilePath, JSON.stringify(results, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in submit-test API route:', error)
    return NextResponse.json({ success: false, error: 'An error occurred while submitting the test' }, { status: 500 })
  }
}

