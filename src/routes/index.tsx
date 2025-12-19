import Navbar from '@/components/navbar'
import { createFileRoute } from '@tanstack/react-router'

import Button from '@/components/button'

export const Route = createFileRoute('/')({ component: App })

function App() {
 

  return (
    <div className="min-h-screen bg-[#f3f3f2]">
      <Navbar/>
      <section className="relative py-20 px-6 text-center overflow-hidden">     
        <h1 className='text-4xl font-semibold text-secondary'>Test Rendering</h1>
        <div className="my-6">
          <Button variant="primary">Test Button</Button>
        </div>

      </section>
    </div>
  )
}
