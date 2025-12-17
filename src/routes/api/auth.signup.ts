import { createFileRoute } from '@tanstack/react-router'
import { signUpService } from '@/actions/auth'
import type { SignUpRequest } from '@/types/auth'

export const Route = createFileRoute('/api/auth/signup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as SignUpRequest
          const newUser = await signUpService(body)

          if (newUser.error) {
            return new Response(
              JSON.stringify({ error: newUser.error }),
              { status: 400 }
            )
          }

          return new Response(JSON.stringify(newUser), { status: 201 })
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: 'Invalid request data',
              details:
                error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 400 }
          )
        }
      },
    },
  },
})
