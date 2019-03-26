class UserApi{
    constructor(baseUrl, vueEventBus){
        this.baseUrl = baseUrl;
        this.apiAdapter = apiConnect(this.baseUrl);
        this.eventBus = vueEventBus;
        
        if (null==this.eventBus) throw "UserApi() Vue event bus is now defined";
        console.log('UserApi("' + this.baseUrl + '") created');
    }
    copyNonEmptyFields(obj){
        let objOut = {};
        for(const [k,v] of Object.entries(obj)){
            if(''!=v) objOut[k] = v;
        }
        return objOut;
    }
    fetchUsers(){
        this.apiAdapter.get('/').then(json => this.eventBus.$emit("onFetchUsers", json));
    }
    addUser(user){
        let userFields = this.copyNonEmptyFields(user);
        this.apiAdapter.post('/', userFields).then(u => this.eventBus.$emit("onAddUser", u) );
    }
    saveUser(user){
        this.apiAdapter.post('/' + user.id, user).then(u => this.eventBus.$emit("onSaveUser", u) );
    }
    deleteUser(user){
        this.apiAdapter.del('/' + user.id).then(() => this.eventBus.$emit("onDeleteUser", user) );
    }
}

Vue.component("users-table", {
    data(){
        return {
            users:[]
        }
    },
    methods:{
        onRowClick(user){
            eventBus.$emit('showUserDetails', user);
        },
        onDeleteClick(user){
            //eventBus.$emit('deleteUser', user);
            userApi.deleteUser(user);
        },
        getUserIndexById(id){
           return this.users.findIndex( u => id==u.id );
        },
        onFetchUsers(usersList){
            this.users = usersList;
        },
        onAddUser(user){
            console.log('addUser response: ', user);
            this.users.push(user);
        },
        onSaveUser(user){
            console.log('saveUser response: ', user);
            var pos = this.getUserIndexById(user.id);
            Vue.set(this.users, pos, user);
        },
        onDeleteUser(user){
            console.log('deleteUser response: ', user);
            var pos = this.users.indexOf(user);
            this.users.splice(pos,1);
        }
    },
    created(){
        eventBus.$on("onFetchUsers", ul => this.onFetchUsers(ul));
        eventBus.$on("onAddUser", u => this.onAddUser(u));
        eventBus.$on("onSaveUser", u => this.onSaveUser(u));
        eventBus.$on("onDeleteUser", u => this.onDeleteUser(u));
        console.log('users-table created')
    },
    template:
        `<table class="table table-hover table-condensed">
        <thead><tr>
            <th>ID</th>
            <th>Login</th>
            <th>Fullname</th>
            <th>Status</th>
            <th>Roles</th>
        </tr></thead><tbody>
        <tr v-for="user in this.users" @click="onRowClick(user)">
            <td>{{user.id}}</td>
            <td>{{user.login}}</td>
            <td>{{user.fullname}}</td>
            <td>{{user.status}}</td>
            <td>{{user.roles}}</td>
            <td><button class="btn btn-default btn-xs" @click.stop="onDeleteClick(user)">Удалить</button></td>
        </tr></tbody></table>`
});

Vue.component("user-details", {
    data(){
        return{
            user:null,
            styles:null
        }
    },
    methods:{
        showUserDetails(user){
            this.user = Object.assign({}, user);
        },
        reset(){
            this.user = {
                "id":"",
                "login":"",
                "fullname":"",
                "password":"",
                "status":"",
                "roles":""
            };
            this.styles = {
                "login":"",
                "password":""
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
            this.user.roles = ("" + this.user.roles).split(',');
            if (this.user.id>0){
                userApi.saveUser(this.user);
                this.reset();
            }else{
                if (this.validateForm()){
                    userApi.addUser(this.user);
                    this.reset();
                }
            }
        }
    },
    created(){
        this.reset();
        eventBus.$on("showUserDetails", u => this.showUserDetails(u));
        eventBus.$on("resetUserDetails", () => this.reset());
        console.log('users-details created')
    },
    template:
    `<div><form class="form-horizontal">
        <div class="form-group">
            <label for="user_id" class="col-md-1 control-label">ID</label>
            <div class="col-md-10"><input name="user_id" class="form-control" v-model="user.id" disabled></input></div>
        </div>
        <div class="form-group" v-bind:class="[this.styles.login]">
            <label for="user_login" class="col-md-1 control-label">*Login</label>
            <div class="col-md-10"><input name="user_login" class="form-control" v-model="user.login"></input></div>
        </div>
        <div class="form-group">
            <label for="user_fullname" class="col-md-1 control-label">Full name</label>
            <div class="col-md-10"><input name="user_fullname" class="form-control" v-model="user.fullname"></input></div>
        </div>
        <div class="form-group" v-bind:class="[this.styles.password]">
            <label for="user_password" class="col-md-1 control-label">*Password</label>
            <div class="col-md-10"><input name="user_password" class="form-control" v-model="user.password"></input></div>
        </div>
        <div class="form-group">
            <label for="user_status" class="col-md-1 control-label">Status</label>
            <div class="col-md-10"><input name="user_status" class="form-control" v-model="user.status"></input></div>
        </div>
        <div class="form-group">
            <label for="user_roles" class="col-md-1 control-label">Roles</label>
            <div class="col-md-10"><input name="user_roles" class="form-control" v-model="user.roles"></input></div>
        </div>
    </form>
    <div class="text-center">
        <button class="btn btn-default" @click="reset">Очистить</button>
        <button class="btn btn-success" @click="commit">Сохранить</button>
    </div>
    </div>
    `

});
