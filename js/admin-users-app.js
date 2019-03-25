let eventBus = new Vue();

Vue.component("users-repository", {
    data(){
        return {
            baseUrl:"https://127.0.0.1:8433"
        }
    },
    methods:{
        copyNonEmptyFields(obj){
            let objOut = {};
            for([k,v] of Object.entries(obj)){
                if(''!=v){
                    objOut[k] = v;
                }
            }
            return objOut;
        },
        fetchUsers(){
            let url = this.baseUrl + "/admin/user/";                        
            fetch(url,{
                credentials: "include",
                method: 'GET'
            }).then(response => response.json() )
            .then(json => eventBus.$emit("onFetchUsers", json));
        },
        addUser(user){
            let url = this.baseUrl + "/admin/user/";   
            var userFields = this.copyNonEmptyFields(user);
            fetch(url, {
                credentials: "include",
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },                
                body: JSON.stringify(userFields)
            }).then(resp => resp.json())
            .then(u => eventBus.$emit("onAddUser", u) )
        },
        saveUser(user){
            let url = this.baseUrl + "/admin/user/" + user.id;                        
            fetch(url, {
                credentials: "include",
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                },                
                body: JSON.stringify(user)
            }).then(resp => resp.json())
            .then(u => eventBus.$emit("onSaveUser", u) )
        },
        deleteUser(user){
            let url = this.baseUrl + "/admin/user/" + user.id;
            fetch(url, {
                credentials: "include",
                method: 'DELETE',
            }).then(resp => {
                if (resp.ok) eventBus.$emit("onDeleteUser", user)
            })
        }

    },
    created(){
        eventBus.$on("fetchUsers", () => this.fetchUsers());
        eventBus.$on("addUser", u => this.addUser(u));
        eventBus.$on("saveUser", u => this.saveUser(u));
        eventBus.$on("deleteUser", u => this.deleteUser(u));
        console.log('users-repository created');
    },
    template:' '
});

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
            eventBus.$emit('deleteUser', user);
        },
        getUserIndexById(id){
            for(const [i,e] of this.users.entries()){
                if (e.id==id) return i;
            };
            return -1;
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
        eventBus.$on("onFetchUsers", u => this.onFetchUsers(u));
        eventBus.$on("onAddUser", u => this.onAddUser(u));
        eventBus.$on("onSaveUser", u => this.onSaveUser(u));
        eventBus.$on("onDeleteUser", u => this.onDeleteUser(u));
        
        eventBus.$emit("fetchUsers");        
        console.log('users-table created')
    },
    template:
        `<table class="table table-hover">
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
                eventBus.$emit("saveUser", this.user);
                this.reset();
            }else{
                if (this.validateForm()){
                    eventBus.$emit("addUser", this.user);
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
    <div>
        <button class="btn btn-default" @click="reset">Новый</button>
        <button class="btn btn-success" @click="commit">Сохранить</button>
    </div>
    </div>
    `

});

var vueApp = new Vue({
    el: "#admin-users-app",
});