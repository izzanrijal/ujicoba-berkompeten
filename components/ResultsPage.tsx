'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TestResults {
  score: number
  total_questions: number
  correct_answers: number
  confidence_counts: {
    'very-confident': number
    'unsure': number
    'dont-know': number
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testCode = searchParams.get('testCode')
  const [userData, setUserData] = useState<{ name: string, user_id: string }>({ name: '', user_id: '' })
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData')
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData)
      setUserData(parsedUserData)
    }

    const fetchResults = async () => {
      if (!testCode || !userData.user_id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/results?testCode=${testCode}&userId=${userData.user_id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        setTestResults(data)
      } catch (error) {
        console.error('Error loading results:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
        setTestResults(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [testCode, userData.user_id])

  if (isLoading) {
    return <div>Loading results...</div>
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!testResults) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>No Results Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No test results were found for this test code and user.</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
        <CardDescription>
          Thank you for completing the test, {userData.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Your Score</h2>
            <div className="text-5xl font-bold text-primary">
              {testResults.score.toFixed(2)}%
            </div>
            <p className="mt-2">
              Correct Answers: {testResults.correct_answers} / {testResults.total_questions}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Response Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Very Confident
                </span>
                <span className="font-semibold">{testResults.confidence_counts['very-confident']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  Unsure
                </span>
                <span className="font-semibold">{testResults.confidence_counts['unsure']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Don't Know
                </span>
                <span className="font-semibold">{testResults.confidence_counts['dont-know']}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </CardFooter>
    </Card>
  )
}

