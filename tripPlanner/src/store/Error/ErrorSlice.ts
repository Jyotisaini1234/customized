import { createSlice } from "@reduxjs/toolkit";


const errorSlice = createSlice({
    name : 'error',
    initialState : {
        isPageNotFound : false,
        noResultFound : false,
    },
    reducers : {
        setError(state){
            state.isPageNotFound = true
        },
        setNoResultFound(state){
            state.noResultFound = true
        },
        removeNoResultFound(state){
            state.noResultFound = false
        },
        removeError(state){
            state.isPageNotFound =  false
        }
    }
})

export const { setError , removeError , setNoResultFound, removeNoResultFound } =  errorSlice.actions;
export const errorReducer = errorSlice.reducer;