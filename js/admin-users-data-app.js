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
            "app_id":appId,
            "data_type":dataType,
            "json_data":data
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
        updateUserData(dataRecord){
            var pos = this.getIndexById(dataRecord.id);
            if (pos>=0) Vue.set(this.dataRecordList, pos, dataRecord);
        },
        onDeleteUserData(dataRecord){
            var pos = this.getIndexById(dataRecord.id);
            this.dataRecordList.splice(pos,1);
        }
    },
    created(){
        eventBus.$on("onFetchUserData", dataList => this.onFetchUserData(dataList));
        eventBus.$on("onAddUserData", data => this.onAddUserData(data));
        eventBus.$on("onSaveUserData", data => this.updateUserData(data));
        eventBus.$on("onDeleteUserData", data => this.onDeleteUserData(data));
        eventBus.$on("onGetUserData", data => this.updateUserData(data));
        console.log('admin-users-data-table created')
    },
    template:
        `<table class="table table-hover table-condensed">
        <thead><tr>
            <th>ID</th>
            <th>User ID</th>
            <th>App ID</th>
            <th>Data type</th>
            <th>Modified</th>
            <th>Data</th>
        </tr></thead><tbody>
        <tr v-for="dataRecord in this.dataRecordList" @click="onRowClick(dataRecord)">
            <td>{{dataRecord.id}}</td>
            <td>{{dataRecord.user_id}}</td>
            <td>{{dataRecord.app_id}}</td>
            <td>{{dataRecord.data_type}}</td>
            <td>{{dataRecord.modified}}</td>
            <td>{{dataRecord.json_data}}</td>
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
                "app_id":"",
                "data_type":"",
                "modofied":"",
                "json_data":"",
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
                var appId = (this.dataRecord.app_id>0)? this.dataRecord.app_id: 0;
                var dataType = (this.dataRecord.data_type>0)? this.dataRecord.data_type: 0;
                adminUserDataApi.add(this.dataRecord.user_id, app_id, data_type, this.dataRecord.json_data);
                this.reset();
            }
        }
    },
    computed:{
        isNew:function(){
            return !(this.dataRecord.id>0);
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
                    <div class="col-md-9"><input name="user_id" class="form-control" v-model="dataRecord.user_id" :disabled="!isNew"></input></div>
                </div>
                <div class="form-group">
                    <label for="app_id" class="col-md-3 control-label">App ID</label>
                    <div class="col-md-9"><input name="app_id" class="form-control" v-model="dataRecord.app_id" :disabled="!isNew"></input></div>
                </div>
                <div class="form-group">
                    <label for="data_type" class="col-md-3 control-label">Data type</label>
                    <div class="col-md-9"><input name="data_type" class="form-control" v-model="dataRecord.data_type" :disabled="!isNew"></input></div>
                </div>
                <div class="form-group">
                    <label for="timestamp" class="col-md-3 control-label">Modified</label>
                    <div class="col-md-9"><input name="timestamp" class="form-control" v-model="dataRecord.modified" disabled></input></div>
                </div>
            </div>
            <div class="col-md-8">
                <div class="form-group">
                    <div class="col-md-12"><textarea name="json_data" class="form-control" rows="10" v-model="dataRecord.json_data"></textarea></div>
                </div>
            </div>
        </div>
        <div class="text-center">
            <button class="btn btn-default" @click="reset">Сброс</button>
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
            "app_id":"",
            "data_type":"",
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
            this.app_id="";
            this.data_type="";
            this.selectedUserHolder="";
        },
        startQuery(){
            console.log("startQuery() ", this.user_id, this.app_id, this.data_type);
            if(this.user_id!='' && this.app_id!='' && this.data_type!=''){
                adminUserDataApi.fetchAllByDataType(this.user_id, this.app_id, this.data_type);
            }else if(this.app_id!='' && this.user_id!=''){
                adminUserDataApi.fetchAllByAppId(this.user_id, this.app_id);
            }else if(this.user_id!=''){
                adminUserDataApi.fetchAllByUserId(this.user_id)
            }else{
                console.log("not enough params for query");
            }
        },
        validateInput(){
            if (this.selectedUser.id!=this.user_id) this.selectedUser = "";
            if (''==this.user_id) return false;
            if (''==this.app_id && ''!=this.data_type) return false;
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
            <div class="form-group"><input name="app_id" class="form-control" placeholder="App ID" v-model="app_id" @changed='validateInput'></input></div>
            <div class="form-group"><input name="data_type" class="form-control" placeholder="Data Type" v-model="data_type" @changed='validateInput'></input></div>
            <div class="form-group"><button class="btn btn-primary" @click="startQuery" :disabled="!readyForQuery">Поиск</button></div>
        </div>
    </div>
    `
});