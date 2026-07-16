import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Camera, Archive, Printer } from 'lucide-react';
import { usePOSSettings } from '../../../hooks/usePOSSettings';
import { cn } from '@/lib/utils';

function ToggleSwitch({ checked, onChange, label, description, icon: Icon }) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-surface hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-md", checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button 
        type="button"
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500",
          checked ? "bg-emerald-600" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

export function POSSettingsDialog() {
  const [open, setOpen] = useState(false);
  const { enableScanner, enableHoldCart, enableReprint, toggleSetting } = usePOSSettings();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          POS Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terminal Settings</DialogTitle>
          <DialogDescription>
            Toggle features on or off for the POS terminal. These settings are applied instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <ToggleSwitch 
            checked={enableScanner} 
            onChange={() => toggleSetting('enableScanner')} 
            label="Barcode Scanner" 
            description="Allow camera access for scanning barcodes." 
            icon={Camera} 
          />
          <ToggleSwitch 
            checked={enableHoldCart} 
            onChange={() => toggleSetting('enableHoldCart')} 
            label="Hold Cart" 
            description="Allow cashiers to hold and recall carts." 
            icon={Archive} 
          />
          <ToggleSwitch 
            checked={enableReprint} 
            onChange={() => toggleSetting('enableReprint')} 
            label="Reprint Receipt" 
            description="Allow cashiers to reprint past invoices." 
            icon={Printer} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
