function apiConnect(baseUrl){
    function get(route){
        return fetch(baseUrl + route,{
            credentials: "include",
            method: 'GET'
        }).then( resp => {
            if (resp.ok) return resp.json();
            console.log(resp);
        })
    }
    function post(route, dataObj){
        return fetch(baseUrl + route, {
            credentials: "include",
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },                
            body: JSON.stringify(dataObj)
        }).then(resp => {
            if (resp.ok) return resp.json();
            console.log(resp);
        })
    }    
    function postRaw(route, rawData){
        return fetch(baseUrl + route, {
            credentials: "include",
            method: 'POST',
            body: rawData
        }).then(resp => {
            if (resp.ok) return resp.json();
            console.log(resp);
        })
    }    
    function del(route){
        return fetch(baseUrl + route, {
            credentials: "include",
            method: 'DELETE',
        }).then(resp => {
            if (resp.ok) return;
            console.log(resp);
        })
    }
    return {get, post, postRaw, del};        
}
