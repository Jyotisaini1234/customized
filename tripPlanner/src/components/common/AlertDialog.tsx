import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { AppDispatch } from "../../store/store";
import { AlertDialogData } from "../../services/uiServices/alert.interface";
import React from 'react';
export default function AlertDialog(props: AlertDialogData) {
    const alertDisapatch = useDispatch<AppDispatch>();
    
    function triggerAction(_action: string) {
        alertDisapatch(hideAlert());
    }

    return (
        <div>
            <Dialog open={props.show}>
                <DialogTitle>
                    {props.title === 'Error' ? (
                        <IconButton sx={{ padding: '0px', marginRight: '6px' }}>
                        </IconButton>
                    ) : (
                        <IconButton sx={{ padding: '0px', marginRight: '6px' }}>
                        </IconButton>
                    )}
                    {props.title}
                    <IconButton onClick={() => triggerAction('OK')}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack direction="column">
                        {props.messages.map((message, index) => (
                            <span key={index}>{message}</span>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    {props?.actions.map((action) => (
                        <Button key={action} variant="contained" onClick={() => triggerAction(action)}>{action}</Button>
                    ))}
                </DialogActions>
            </Dialog>
        </div>
    );
}

function hideAlert(): any {
    throw new Error("Function not implemented.");
}
