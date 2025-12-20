import { createFileRoute } from "@tanstack/react-router";
import { signInService } from "@/actions/auth";
import { SignInRequest } from "@/types/auth";

export const Route = createFileRoute('/api/auth/signin') ({
	server: {
		handlers: {
			POST: async({request}) => {
				try{
					const body = (await request.json()) as SignInRequest

					const authUser = await signInService(body)

					if(authUser.error) {
						return new Response(
							JSON.stringify({ error: authUser.error }),
							{ status: 400 }
						)
					}

					return new Response(JSON.stringify(authUser), { status: 200 })
				} catch(error) {
					return new Response(
						JSON.stringify({
							error: 'Invalid request data',
							details: 
								error instanceof Error ? error.message : 'Unknown error'
						}),
						{ status: 500 }
					)

				}
			}
		}
	}
})