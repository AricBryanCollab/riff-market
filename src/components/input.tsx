import { Field } from "@base-ui/react"

const Input = () => {
  return (
	<Field.Root className="flex flex-col items-start gap-1 w-full max-w-64">
		<Field.Label className="text-sm leading-5 font-medium">Username</Field.Label>
		 <Field.Control required placeholder="Required" className="border box-border pl-3 m-0 w-full h-10 rounded-md text-base bg-transparent focus:outline-2 focus:outline:primary" />
			<Field.Error className="" match="valueMissing">
				Please enter your name
			</Field.Error>

			<Field.Description className="m-0 text-sm leading-5">Your name</Field.Description>
	</Field.Root>
  )
}

export default Input;
