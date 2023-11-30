import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import _ from "lodash";
import { Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SettingsForm } from "./settings-form";
import { Button } from "@/components/ui/button";
import { FormData, useFormData, useURLSearchParamsFactory } from "@/lib/hooks";

export function SettingsToggle() {
  const getNewParams = useURLSearchParamsFactory();
  const [data, setData] = useFormData();
  const [dirtyData, setDirtyData] = useState<Partial<FormData>>({});
  const combinedData = useMemo<FormData>(
    () => _.defaults(dirtyData, data),
    [data, dirtyData]
  );
  const isButtonsDisabled = useMemo(
    () => _.isEqual(combinedData, data),
    [combinedData, data]
  );

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"outline"} size="icon">
          <Settings2 className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Counter's settings</DialogTitle>
          <DialogDescription className="opacity-50">
            dummy description
          </DialogDescription>
        </DialogHeader>
        <SettingsForm data={combinedData} setData={setDirtyData} />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isButtonsDisabled}
            onClick={() => {
              const params = getNewParams(combinedData);
              window.open(`/?${params.toString()}`, "_blank");
              setDirtyData({});
            }}
          >
            Create new
          </Button>
          <Button
            disabled={isButtonsDisabled}
            onClick={() => {
              setData(dirtyData);
              setDirtyData({});
            }}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}