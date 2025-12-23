import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    WASM_SOURCE_LABELS,
} from '@/utils/settings';
import { dbHandler } from '@/utils/database-handler';
import { useAppDispatch } from '@/store/hooks';
import { scanDatabases } from '@/store/slices/databaseSlice';
import { clearTables } from '@/store/slices/tableSlice';
import { toast } from 'sonner';

export function SettingsDialog() {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [wasmSource, setWasmSource] = useState<string>('1.13.0');
    const [customWasmUrl, setCustomWasmUrl] = useState<string>('');
    const [customScriptUrl, setCustomScriptUrl] = useState<string>('');
    const [isApplying, setIsApplying] = useState(false);

    // Load settings on mount
    useEffect(() => {
        loadSettings().then((settings) => {
            setWasmSource(settings.wasmSource);
            setCustomWasmUrl(settings.customWasmUrl || '');
            setCustomScriptUrl(settings.customScriptUrl || '');
        });
    }, []);

    const handleApply = async () => {
        setIsApplying(true);
        try {
            // Validate custom CDN fields if custom mode selected
            if (wasmSource === 'custom' && !customWasmUrl) {
                toast.error('Custom WASM URL is required');
                setIsApplying(false);
                return;
            }

            // Save the settings
            await saveSettings({
                wasmSource,
                customWasmUrl: wasmSource === 'custom' ? customWasmUrl : undefined,
                customScriptUrl: wasmSource === 'custom' ? customScriptUrl : undefined,
            });
            
            // Reinitialize sql.js with new WASM source
            const result = await dbHandler.reinit(wasmSource);
            
            // Show toast notification with result
            if (result.success) {
                if (result.isAutoDetected) {
                    toast.success(`Auto-detected: Using sql.js v${result.version}`);
                } else if (result.version === 'custom') {
                    toast.success('Loaded custom WASM from CDN');
                } else {
                    toast.success(`Initialized with sql.js v${result.version}`);
                }
            }
            
            // Clear current state and rescan
            dispatch(clearTables());
            dispatch(scanDatabases());
            
            setOpen(false);
        } catch (error) {
            console.error('Failed to apply WASM settings:', error);
            toast.error(`Failed to apply settings: ${(error as Error).message}`);
        } finally {
            setIsApplying(false);
        }
    };

    const handleOpenChange = async (newOpen: boolean) => {
        if (newOpen) {
            // Reset to current saved setting when opening
            const settings = await loadSettings();
            setWasmSource(settings.wasmSource);
            setCustomWasmUrl(settings.customWasmUrl || '');
            setCustomScriptUrl(settings.customScriptUrl || '');
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
                            onValueChange={(value) => setWasmSource(value)}
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

                    {/* Custom CDN URL inputs */}
                    {wasmSource === 'custom' && (
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>
                                    Chrome MV3 restricts remote code execution. Custom CDN URLs may only work in Firefox or developer mode.
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="customWasmUrl" className="text-sm">
                                    WASM URL <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="customWasmUrl"
                                    type="url"
                                    placeholder="https://cdnjs.cloudflare.com/.../sql-wasm.wasm"
                                    value={customWasmUrl}
                                    onChange={(e) => setCustomWasmUrl(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="customScriptUrl" className="text-sm">
                                    Script URL (optional)
                                </Label>
                                <Input
                                    id="customScriptUrl"
                                    type="url"
                                    placeholder="https://cdnjs.cloudflare.com/.../sql-wasm.js"
                                    value={customScriptUrl}
                                    onChange={(e) => setCustomScriptUrl(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    )}
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
