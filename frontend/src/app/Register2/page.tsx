"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Register2Redirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/register/step-2')
  }, [router])
  return null
}
