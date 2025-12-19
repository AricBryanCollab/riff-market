

import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/')({ component: App })

function App() {
 

  return (
    <div className="min-h-screen bg-[#f3f3f2]">
      <section className="relative py-20 px-6 text-center overflow-hidden">     
        <h1 className='text-4xl font-semibold text-secondary'>Test Rendering</h1>
        <div className="my-6">

        </div>

      </section>
    </div>
  )
}
