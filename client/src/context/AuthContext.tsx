import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import axios from "../api/axios"

export type User = {
  id: number
  username: string
  email: string
  role: string
  token: string
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
  isIdentityVerified?: boolean
  phoneNumber?: string
  firstName?: string
  lastName?: string
  lastLoginAt?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  const login = (user: User) => {
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("token", user.token)
    setUser(user)
  }

   const logout = async () => {
    try {
      await axios.post("/Auth/logout")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      setUser(null)
    }
  }

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await axios.get("/Auth/current-user")
      const userData = response.data
      
      // Add token to user data since backend doesn't return it
      const userWithToken = { ...userData, token }
      setUser(userWithToken)
    } catch (error) {
      console.error("Auth check failed:", error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const isAuthenticated = !!user && !!user.token;

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        logout()
        return
      }
      const response = await axios.get("/Auth/current-user")
      const userData = response.data
      const userWithToken = { ...userData, token }
      setUser(userWithToken)
    } catch (error) {
      console.error("Failed to refresh user data:", error)
      logout()
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      checkAuth, 
      refreshUser, 
      updateUser, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}