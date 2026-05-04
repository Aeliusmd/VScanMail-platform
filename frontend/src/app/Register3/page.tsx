"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Register3Redirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/register/step-3')
  }, [router])
  return null
}
