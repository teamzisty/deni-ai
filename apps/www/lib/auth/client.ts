'use client'

import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export class AuthService {
  private supabase = createClient()

  async loginWithForm(formData: FormData) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Login failed')
    }

    // Refresh the page to update auth state
    window.location.href = '/'
    
    return result
  }

  async signupWithForm(formData: FormData) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Signup failed')
    }
    
    return result
  }

  async logout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Logout failed')
    }

    // Refresh the page to update auth state
    window.location.href = '/'
    
    return result
  }
  async getUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession()
    return session
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
