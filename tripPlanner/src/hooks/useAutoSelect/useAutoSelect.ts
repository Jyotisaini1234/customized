import { useEffect ,useState} from "react";

export const useAutoSelect = (productDetails:any,actionLabel?:any) =>{
    const [data, setData] = useState(null);

    const paxCheckCount = (paxDetails:any) =>{
        let  count = 0;
        paxDetails.forEach((each:any)=>{
              each.enabled && count++  
        })
        return count === 1
    }

    useEffect(() => {
        if(productDetails?.itineraries ){
            const itineraries = productDetails?.itineraries.reduce((finalIternary:any[],each:any)=>{
              if(paxCheckCount(each.paxDetails)|| actionLabel=='invoice'){  
                if(productDetails.flightType.toLowerCase()=='o'|| productDetails.specialRoundTrip){
                    const itineraryDetails = each.paxDetails.map((each:any)=>each.paxId)
                      finalIternary.push({itineraryId:each.flightId,itineraryDetails})
                      return finalIternary
                }
              }
          },[])
            setData((prev:any)=>({...prev,itineraries:itineraries||[]}))
        }
    }, [productDetails]);
    return data;
}