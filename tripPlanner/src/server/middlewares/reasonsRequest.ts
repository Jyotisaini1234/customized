// import { commonApi } from "../../commonApi/commonApi";
// // import { ALERT_DIALOG } from "../../constants/commonConstants";
// import { REASON_REQUEST } from "../../model/ReasonData";
// import { showAlert } from "../../store/Alert/alertSlice";
// import { GET_REASONS_S2S } from "../../utils/ApiConstants";

// const reasonsRequest = async (store: any, cookie: any) => {
//     let req = { ...REASON_REQUEST };
//     store.dispatch(commonApi.endpoints.postApi.initiate({ cookie, url: GET_REASONS_S2S, data: req })).then((res: any) => {
//         try {
//             if (res.data.success) {
//                 //TODO : MANIPULATE DATA   
//                 return JSON.parse(res.data);
//             }
//         } catch (e) {
//             console.log(e)
//             let alertData = {
//                 title: ALERT_DIALOG.DIALOG_TITLE,
//                 messages: [ALERT_DIALOG.TRY_AGAIN_MESSAGE],
//                 actions: ['OK'],
//             };
//             // store.dispatch(showAlert(alertData));
//         }
//     })
//     return Promise.all(store.dispatch(commonApi.util.getRunningQueriesThunk()));
// };
// export { reasonsRequest };
