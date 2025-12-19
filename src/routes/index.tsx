import Input from '@/components/input'
import Button from '@/components/button'
import Dialog from '@/components/dialog'

import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/')({ component: App })

function App() {
 

  return (
    <div className="min-h-screen bg-[#f3f3f2]">
      <section className="relative py-20 px-6 text-center overflow-hidden">     
        <h1 className='text-4xl font-semibold text-secondary'>Test Rendering</h1>
        <div className="my-6">
          <Input/>
        </div>
        <Dialog buttonText='Open It' title="Test Dialog" caption='Hello World. This is a test dialog to confirm if it works' />
      </section>
    </div>
  )
}
