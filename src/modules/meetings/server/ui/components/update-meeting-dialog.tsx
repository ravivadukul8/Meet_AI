import { ResponsiveDialog } from "@/components/responsive-dialog";
import React from "react";
import { MeetingGetOne } from "@/modules/meetings/types";
import MeetingForm from "./meeting-form";

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: MeetingGetOne;
}

const UpdateMeetingDialog = ({
  open,
  onOpenChange,
  initialValue,
}: NewMeetingDialogProps) => {
  return (
    <ResponsiveDialog
      title="Update Meeting"
      description="Update a meeting"
      open={open}
      onOpenChange={onOpenChange}
    >
      <MeetingForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValue}
      />
    </ResponsiveDialog>
  );
};

export default UpdateMeetingDialog;
