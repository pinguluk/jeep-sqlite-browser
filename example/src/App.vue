<template>
  <div class="container">
    <header>
      <h1>Jeep SQLite Browser Example</h1>
      <p class="subtitle">Demo CRUD</p>
    </header>

    <main v-if="initialized">
      <div class="card form-card">
        <h2>{{ editingId ? 'Edit User' : 'Add New User' }}</h2>
        <div class="form-group">
          <input v-model="form.name" placeholder="Full Name" type="text" />
          <div class="form-actions">
            <button @click="handleSubmit">{{ editingId ? 'Update User' : 'Add User' }}</button>
            <button v-if="editingId" class="secondary" @click="resetForm">Cancel</button>
          </div>
        </div>
      </div>

      <div class="user-list">
        <div v-for="user in users" :key="user.id" class="card user-item">
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
          </div>
          <div class="user-actions">
            <button class="secondary btn-sm" @click="startEdit(user)">Edit</button>
            <button class="danger btn-sm" @click="handleDelete(user.id)">Delete</button>
          </div>
        </div>
        <div v-if="users.length === 0" class="empty-state">
          No users found. Add your first user above!
        </div>
      </div>
    </main>

    <div v-else class="loading-state">
      Initializing database...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useSQLite } from './services/sqlite';

const { initPlugin, getUsers, addUser, updateUser, deleteUser } = useSQLite();

const initialized = ref(false);
const users = ref<any[]>([]);
const editingId = ref<number | null>(null);

const form = reactive({
  name: ''
});

onMounted(async () => {
  await initPlugin();
  await refreshUsers();
  initialized.value = true;
});

const refreshUsers = async () => {
  users.value = await getUsers();
};

const handleSubmit = async () => {
  if (!form.name) return;

  try {
    if (editingId.value) {
      await updateUser(editingId.value, form.name);
    } else {
      await addUser(form.name);
    }
    resetForm();
    await refreshUsers();
  } catch (err) {
    alert('Error saving user.');
  }
};

const startEdit = (user: any) => {
  editingId.value = user.id;
  form.name = user.name;
};

const resetForm = () => {
  editingId.value = null;
  form.name = '';
};

const handleDelete = async (id: number) => {
  if (confirm('Are you sure you want to delete this user?')) {
    await deleteUser(id);
    await refreshUsers();
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-item:hover {
  transform: scale(1.01);
  box-shadow: 0 8px 15px -3px rgb(0 0 0 / 0.2);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.user-{
  color: var(--text-muted);
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  border: 2px dashed var(--border);
  border-radius: 12px;
}

.loading-state {
  text-align: center;
  padding: 5rem;
  font-size: 1.2rem;
  color: var(--text-muted);
}
</style>
