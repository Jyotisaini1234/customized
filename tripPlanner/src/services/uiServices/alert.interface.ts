
export interface AlertData{
    title : string,
    messages : string[],
    actions : AlertActions[],
}
export interface AlertDialogData extends AlertData{
    show : boolean
}

export enum AlertActions{
    OK = 'OK',
    RETRY = 'RETRY' ,
    CLOSE = 'CLOSE',
    CANCEL = 'CANCEL'
}

// export interface  IconType{
//     name: any,
//     color: string
// }