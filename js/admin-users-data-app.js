class AdminUserDataApi{
    constructor(baseUrl, vueEventBus){
        this.baseUrl = baseUrl;
        this.apiAdapter = apiConnect(this.baseUrl);
        this.eventBus = vueEventBus;
        
        if (null==this.eventBus) throw "AdminUserDataApi() Vue event bus is now defined";
        console.log('AdminUserDataApi("' + this.baseUrl + '") created');
    }
    fetchAllByUserId(userId){
        this.apiAdapter.get('/' + userId + '/data').then(json => this.eventBus.$emit("onFetchUserData", json));
    }
    fetchAllByAppId(userId, appId){
        this.apiAdapter.get('/' + userId + '/data/' + appId).then(json => this.eventBus.$emit("onFetchUserData", json));
    }
    fetchAllByDataType(userId, appId, dataType){
        this.apiAdapter.get('/' + userId + '/data/' + appId + '/' + dataType).then(json => this.eventBus.$emit("onFetchUserData", json));
    }
    add(userId, appId, dataType, data){
        let dataRecord = {
            "id":null,
            "user_id":userId,
            "appId":appId,
            "dataType":dataType,
            "jsonData":data
        }
        this.apiAdapter.postRaw('/' + userId + '/data/' + appId + '/' + dataType, data).then(resp => {
            dataRecord.id = resp.id;
            this.eventBus.$emit("onAddUserData", dataRecord);
        });
    }
    get(id){
        this.apiAdapter.get('/data/' + id).then(data => this.eventBus.$emit("onGetUserData", data));
    }    
    save(dataRecord){
        this.apiAdapter.postRaw('/data/' + dataRecord.id, dataRecord.jsonData).then( () => this.eventBus.$emit("onSaveUserData", dataRecord) );
    }
    del(dataRecord){
        this.apiAdapter.del('/data/' + dataRecord.id).then(() => this.eventBus.$emit("onDeleteUserData", dataRecord) );
    }
}

Vue.component("admin-users-data-table", {
    data(){
        return {
            dataRecordList:[]
        }
    },
    methods:{
        onRowClick(dataRecord){
            eventBus.$emit('showDataRecordDetails', dataRecord);
        },
        onDeleteClick(dataRecord){
            adminUserDataApi.del(dataRecord);
        },
        getIndexById(id){
           return this.dataRecordList.findIndex( e => id==e.id );
        },
        onFetchUserData(dataRecordList){
            this.dataRecordList = dataRecordList;
        },
        onAddUserData(dataRecord){
            this.dataRecordList.push(dataRecord);
        },
        onSaveUserData(dataRecord){
            var pos = this.getIndexById(dataRecord.id);
            Vue.set(this.dataRecordList, pos, dataRecord);
        },
        onDeleteUserData(dataRecord){
            var pos = this.getIndexById(dataRecord.id);
            this.dataRecordList.splice(pos,1);
        }
    },
    created(){
        eventBus.$on("onFetchUserData", dataList => this.onFetchUserData(dataList));
        eventBus.$on("onAddUserData", data => this.onAddUserData(data));
        eventBus.$on("onSaveUserData", data => this.onSaveUserData(data));
        eventBus.$on("onDeleteUserData", data => this.onDeleteUserData(data));
        console.log('admin-users-data-table created')
    },
    template:
        `<table class="table table-hover table-condensed">
        <thead><tr>
            <th>ID</th>
            <th>User ID</th>
            <th>App ID</th>
            <th>Data type</th>
            <th>Data</th>
        </tr></thead><tbody>
        <tr v-for="dataRecord in this.dataRecordList" @click="onRowClick(dataRecord)">
            <td>{{dataRecord.id}}</td>
            <td>{{dataRecord.user_id}}</td>
            <td>{{dataRecord.appId}}</td>
            <td>{{dataRecord.dataType}}</td>
            <td>{{dataRecord.jsonData}}</td>
            <td><button class="btn btn-default btn-xs" @click.stop="onDeleteClick(dataRecord)">Удалить</button></td>
        </tr></tbody></table>`
});

Vue.component("user-data-details", {
    data(){
        return{
            dataRecord:null,
            styles:null
        }
    },
    methods:{
        showDetails(dataRecord){
            this.dataRecord = Object.assign({}, dataRecord);
        },
        reset(){
            this.dataRecord = {
                "id":"",
                "user_id":"",
                "appId":"",
                "dataType":"",
                "jsonData":"",
            };
            this.styles = {
            }
        },
        validateForm(){
            var result = true;

            if (this.user.login!=null && this.user.login.trim()!=''){
                this.styles.login = "has-success";
            }else{
                this.styles.login = "has-error";
                result = false;
            }

            if (this.user.password!=null && this.user.password.trim()!=''){
                this.styles.password = "has-success";
            }else{
                this.styles.password = "has-error";
                result = false;
            }

            return result;
        },
        commit(){
            if (this.dataRecord.id>0){
                adminUserDataApi.save(this.dataRecord);
                this.reset();
            }else{
                var appId = (this.dataRecord.appId>0)? this.dataRecord.appId: 0;
                var dataType = (this.dataRecord.dataType>0)? this.dataRecord.dataType: 0;
                adminUserDataApi.add(this.dataRecord.user_id, appId, dataType, this.dataRecord.jsonData);
                this.reset();
            }
        }
    },
    created(){
        this.reset();
        eventBus.$on("showDataRecordDetails", dataRecord => this.showDetails(dataRecord));
        eventBus.$on("resetUserDetails", () => this.reset());
        console.log('users-details created')
    },
    template:
    `<div class="container form-horizontal">
        <div class="row">
            <div class="col-md-4">
                <div class="form-group">
                    <label for="id" class="col-md-3 control-label">ID</label>
                    <div class="col-md-9"><input name="id" class="form-control" v-model="dataRecord.id" disabled></input></div>
                </div>
                <div class="form-group">
                    <label for="user_id" class="col-md-3 control-label">User ID</label>
                    <div class="col-md-9"><input name="user_id" class="form-control" v-model="dataRecord.user_id"></input></div>
                </div>
                <div class="form-group">
                    <label for="app_id" class="col-md-3 control-label">App ID</label>
                    <div class="col-md-9"><input name="app_id" class="form-control" v-model="dataRecord.appId"></input></div>
                </div>
                <div class="form-group">
                    <label for="data_type" class="col-md-3 control-label">dataType</label>
                    <div class="col-md-9"><input name="data_type" class="form-control" v-model="dataRecord.dataType"></input></div>
                </div>
            </div>
            <div class="col-md-8">
                <div class="form-group">
                    <div class="col-md-12"><textarea name="json_data" class="form-control" rows="8" v-model="dataRecord.jsonData"></textarea></div>
                </div>
            </div>
        </div>
        <div class="text-center">
            <button class="btn btn-default" @click="reset">Очистить</button>
            <button class="btn btn-success" @click="commit">Сохранить</button>
        </div>
    </div>
    `
});

Vue.component('user-data-query',{
    data(){
        return{
            "usersList":[],
            "user_id":"",
            "appId":"",
            "dataType":"",
            "selectedUser":"",
        }
    },
    computed:{
        readyForQuery:function(){
            return this.validateInput();
        }
    },
    methods:{
        reset(){
            this.userList=[];
            this.user_id="";
            this.appId="";
            this.dataType="";
            this.selectedUserHolder="";
        },
        startQuery(){
            console.log("startQuery() ", this.user_id, this.appId, this.dataType);
            if(this.user_id!='' && this.appId!='' && this.dataType!=''){
                adminUserDataApi.fetchAllByDataType(this.user_id, this.appId, this.dataType);
            }else if(this.appId!='' && this.user_id!=''){
                adminUserDataApi.fetchAllByAppId(this.user_id, this.appId);
            }else if(this.user_id!=''){
                adminUserDataApi.fetchAllByUserId(this.user_id)
            }else{
                console.log("not enough params for query");
            }
        },
        validateInput(){
            if (this.selectedUser.id!=this.user_id) this.selectedUser = "";
            if (''==this.user_id) return false;
            if (''==this.appId && ''!=this.dataType) return false;
            return true;
        },
        onFetchUsers(usersList){
            this.usersList = usersList;
        },
        onSelectUser(){
            this.user_id = this.selectedUser.id;
        }
    },
    created(){
        this.reset();
        eventBus.$on("onFetchUsers", ul => this.onFetchUsers(ul));
    },
    template:
    `
    <div class="container text-center">
        <div class="form-inline">
            <div class="form-group"><button class="btn btn-default" @click="reset">Сброс</button></div>
            <div class="form-group"><select class="form-control" v-model="selectedUser" @change="onSelectUser"><option v-for="u in usersList" :value="u">{{u.login}}</option></select></div>
            <div class="form-group"><input name="user_id" class="form-control" placeholder="User ID" v-model="user_id" @changed='validateInput' @keyup.enter='startQuery'></input></div>
            <div class="form-group"><input name="app_id" class="form-control" placeholder="App ID" v-model="appId" @changed='validateInput'></input></div>
            <div class="form-group"><input name="data_type" class="form-control" placeholder="Data Type" v-model="dataType" @changed='validateInput'></input></div>
            <div class="form-group"><button class="btn btn-primary" @click="startQuery" :disabled="!readyForQuery">Поиск</button></div>
        </div>
    </div>
    `
});