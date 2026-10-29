/** Сущность «пользователь» (ответ API /auth/me). */

export interface User {
  id: number;
  email: string;
  display_name: string | null;
  created_at: string;
}
