import { cookies } from 'next/headers'

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return null
    }
    
    const sessionData = JSON.parse(sessionCookie.value)
    
    // Verificar se a sessão não expirou (7 dias)
    const now = Date.now()
    const sessionAge = now - sessionData.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 dias em ms
    
    if (sessionAge > maxAge) {
      return null
    }
    
    return sessionData
  } catch (error) {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
