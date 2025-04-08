import { useDispatch } from 'react-redux';
import { AppDispatch } from  '../../store/store';
import { AlertData, AlertDialogData } from "./alert.interface";

const dispatch = useDispatch<AppDispatch>();

export const AlertService = {
    success : function(alertData : AlertData ){
        const data : AlertDialogData = { ...alertData , show : true }
        dispatch(showAlert(data));
    },
    error : function(alertData : AlertData ){
        const data : AlertDialogData = { ...alertData , show : true }
        dispatch(showAlert(data));
    }
    
    
}

function showAlert(_data: AlertDialogData): any {
    throw new Error('Function not implemented.');
}
