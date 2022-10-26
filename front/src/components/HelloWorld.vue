<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue'
import { useApi } from '../hooks/useApi'
import { useUserStore } from '../stores/userStore'

defineProps<{ msg: string }>()

const apiData = ref('')
const taskId = ref<number>(1)

const {
  handleApi,
  loading: submitLoading,
  errors: submitError
} = useApi(async () => {
  return await axios.get('https://jsonplaceholder.typicode.com/todos/1')
})

const onSubmitClicked = async () => {
  const res = await handleApi()
  console.log(res)
  if (res) {
    apiData.value = res.data
  }
  if (!submitError) {
    console.error(submitError)
  }
}

const user = useUserStore()
await user.login('Taro', 'ed')

const userName = ref('')
const password = ref('')

const onLoginClicked = async () => {
  try {
    await user.login(userName.value, password.value)
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <h1>{{ msg }}</h1>
  <template v-if="user.name !== ''">
    <h2 >Hello {{user.name}}</h2>
    <button @click="user.logout()">Logout</button>
  </template>
  <template v-else>
    <h2>You are not logged in</h2>
    <input type="text" v-model="userName" />
    <input type="password" v-model="password" />
    <button @click="onLoginClicked">Login</button>
  </template>

  <div class="card">
    <button type="button" :disabled="submitLoading" @click="onSubmitClicked">submit</button>
    <input type="number" v-model="taskId" min="1" />
  </div>
  <p>
    {{apiData}}
  </p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
