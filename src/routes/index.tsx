import Navbar from '@/components/navbar'
import { createFileRoute } from '@tanstack/react-router'

import Button from '@/components/button'
import Input from '@/components/input'
import Dialog from '@/components/dialog'

import { useDialogStore } from '@/store/dialog'


export const Route = createFileRoute('/')({ component: App })

function App() {
  const { setOpenDialog } = useDialogStore();

  return (
    <div className="min-h-screen bg-[#f3f3f2]">
      <Navbar/>
      <section className="relative py-20 px-6 text-center overflow-hidden">     
        <h1 className='text-4xl font-semibold text-secondary'>Test Rendering</h1>
        <div className="my-6">
          <Button action={() => setOpenDialog("test")} variant="primary">Test Button</Button>
        </div>
        <div className="w-fit">
          <Input id="test" label="Test" value="" onChange={() => {}} />
        </div>
        <Dialog type="test" title="Test Dialog" children={<p>Test Dialog Content</p>} />
      </section>
    </div>
  )
}
