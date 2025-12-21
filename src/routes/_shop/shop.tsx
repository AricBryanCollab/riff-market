import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_shop/shop')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='border border-teal-500 w-xl h-screen'>Hello "/_shop/shop"!</div>
}
