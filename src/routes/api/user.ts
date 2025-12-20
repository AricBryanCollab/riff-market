import { getUserByIdService } from '@/actions/user'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/user')({
  server: {
		handlers: {
			GET:async () => {
				try{
					const user = await getUserByIdService();

					return new Response(
						JSON.stringify(user)
					)
				} catch(error) {
					console.error(error);
					return new Response(
						JSON.stringify({ message: "Failed to query user data"}),  
						{ status: 500}
					)
				}
			}
		}
	}
})
