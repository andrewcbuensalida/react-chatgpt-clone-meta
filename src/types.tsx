export interface User {
  user_id: number
  username: string
  email: string
  password: string
  created_at: Date
}

export interface Chat {
  title: string
  chat_id: number
  user_id: number
  created_at: Date
}

export interface Message {
  message_id: string
  role: string
  chat_id: number
  sender_id: number
  content: string
  created_at: Date
}
