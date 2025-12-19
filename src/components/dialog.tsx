import { Dialog as BaseDialog } from "@base-ui/react";
import Button from "@/components/button";

interface DialogProps {
	buttonText: string;
	title: string;
	caption?: string;
	action?: React.ReactNode;
}

const Dialog = ({buttonText, title, caption, action }: DialogProps) => {
  return (
    <BaseDialog.Root>
      <BaseDialog.Trigger>
        <Button variant="primary">{buttonText}</Button>
      </BaseDialog.Trigger>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <BaseDialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
          <BaseDialog.Title className="text-2xl font-semibold text-black">
            {title}
          </BaseDialog.Title>
          {caption && <BaseDialog.Description className="text-secondary mt-3 mb-6">
            {caption}
          </BaseDialog.Description>}
          <div className="flex justify-end">
            {action ? action : <BaseDialog.Close className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Close
            </BaseDialog.Close>}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
};

export default Dialog;