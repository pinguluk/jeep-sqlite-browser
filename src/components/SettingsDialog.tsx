import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    loadSettings,
    saveSettings,
    type WasmSource,
    WASM_SOURCE_LABELS,
} from '@/utils/settings';
import { dbHandler } from '@/utils/database-handler';
import { useAppDispatch } from '@/store/hooks';
import { scanDatabases } from '@/store/slices/databaseSlice';
import { clearTables } from '@/store/slices/tableSlice';

export function SettingsDialog() {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [wasmSource, setWasmSource] = useState<WasmSource>(() => loadSettings().wasmSource);
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = async () => {
        setIsApplying(true);
        try {
            // Save the setting
            saveSettings({ wasmSource });
            
            // Reinitialize sql.js with new WASM source
            await dbHandler.reinit(wasmSource);
            
            // Clear current state and rescan
            dispatch(clearTables());
            dispatch(scanDatabases());
            
            setOpen(false);
        } catch (error) {
            console.error('Failed to apply WASM settings:', error);
            alert('Failed to apply settings. Check console for details.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            // Reset to current saved setting when opening
            setWasmSource(loadSettings().wasmSource);
        }
        setOpen(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Settings">
                    <SettingsIcon className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure extension behavior
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">WASM Source</Label>
                        <p className="text-xs text-muted-foreground">
                            Select which sql.js WASM binary to use for database operations.
                        </p>
                        <RadioGroup
                            value={wasmSource}
                            onValueChange={(value) => setWasmSource(value as WasmSource)}
                            className="space-y-2"
                        >
                            {Object.entries(WASM_SOURCE_LABELS).map(([key, label]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <RadioGroupItem value={key} id={key} />
                                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={isApplying}>
                        {isApplying ? 'Applying...' : 'Apply & Reload'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
