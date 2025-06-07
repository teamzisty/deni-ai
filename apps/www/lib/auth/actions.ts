'use client'

import { authService } from './client'

export async function loginAction(formData: FormData) {
  try {
    await authService.loginWithForm(formData)
  } catch (error) {
    console.error('Login error:', error)
    // エラーハンドリングをここで行う
    throw error
  }
}

export async function signupAction(formData: FormData) {
  try {
    await authService.signupWithForm(formData)
  } catch (error) {
    console.error('Signup error:', error)
    // エラーハンドリングをここで行う
    throw error
  }
}

export async function logoutAction() {
  try {
    await authService.logout()
  } catch (error) {
    console.error('Logout error:', error)
    // エラーハンドリングをここで行う
    throw error
  }
}
