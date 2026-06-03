declare function openKkiapayWidget(config: {
    amount: number;
    position?: string;
    callback?: string;
    data?: string;
    key: string;
    sandbox?: boolean;
    name?: string;
    email?: string;
    phone?: string;
}): void;

interface Window {
    addKkiapayListener: (event: string, callback: (data: any) => void) => void;
    removeKkiapayListener: (event: string, callback: (data: any) => void) => void;
}
