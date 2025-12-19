import Button from '@/components/button'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/')({ component: App })

function App() {
 

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-400 via-slate-600 to-slate-500">
      <section className="relative py-20 px-6 text-center overflow-hidden">     
        <h1 className='text-4xl font-semibold text-white'>Test Rendering</h1>
        <div className="my-6">
          <Button variant='primary'>Test Button</Button>
        </div>
      </section>
    </div>
  )
}
