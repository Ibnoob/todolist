'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        if (!task.completed) {
          newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
        } else {
          newTimeRemaining[task.id] = 'Selesai';
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const showPopup = async (title: string, icon: 'success' | 'info') => {
    await Swal.fire({
      icon,
      title,
      showConfirmButton: false,
      timer: 2000,
      background: '#1E293B',
      color: '#F1F5F9',
    });
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan Tugas Baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#9CA3AF',
      background: '#1E293B',
      color: '#F1F5F9',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
      await showPopup('Tugas berhasil ditambahkan!', 'success');
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#9CA3AF',
      background: '#1E293B',
      color: '#F1F5F9',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = {
        ...task,
        text: formValues[0],
        deadline: formValues[1],
      };

      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      await showPopup('Tugas berhasil diubah!', 'success');
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });

    const justCompleted = updatedTasks.find((t) => t.id === id)?.completed;
    if (justCompleted) {
      await showPopup('Tugas selesai!', 'info');
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin ingin menghapus tugas ini?',
      showCancelButton: true,
      confirmButtonText: 'Iya',
      cancelButtonText: 'Tidak',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#9CA3AF',
      background: '#1E293B',
      color: '#F1F5F9',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(tasks.filter((task) => task.id !== id));
      await showPopup('Tugas telah dihapus.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10">
      <div className="max-w-2xl mx-auto p-6 bg-blue-50 shadow-xl rounded-xl border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-4">
          📘 Catatan Tugas
        </h1>
        <p className="text-lg text-gray-700 text-center mb-6">
          Kelola tugas-tugas harianmu dengan mudah dan terorganisir.
        </p>

        <ul className="space-y-4">
          <AnimatePresence>
            {[...tasks]
              .sort(
                (a, b) =>
                  new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
              )
              .map((task) => {
                const timeLeft = timeRemaining[task.id] || 'Menghitung...';
                const taskColor = task.completed
                  ? 'bg-blue-100'
                  : timeLeft === 'Waktu habis!'
                  ? 'bg-red-100'
                  : 'bg-white';

                return (
                  <motion.li
                    key={task.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col justify-between p-4 border rounded-xl ${taskColor} shadow`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        onClick={() => toggleTask(task.id)}
                        className={`cursor-pointer text-base ${
                          task.completed
                            ? 'line-through text-gray-400'
                            : 'font-medium text-gray-800'
                        }`}
                      >
                        {task.text}
                      </span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => editTask(task)}
                          className="text-white text-sm px-3 py-1 rounded bg-blue-500 hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-white text-sm px-3 py-1 rounded bg-red-500 hover:bg-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                      ⏰ Deadline: {new Date(task.deadline).toLocaleString()}
                    </p>
                    <p className={`text-xs font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                      ⏳ {task.completed ? 'Selesai' : timeLeft}
                    </p>
                  </motion.li>
                );
              })}
          </AnimatePresence>
        </ul>

        <div className="flex justify-end mt-8">
          <button
            onClick={addTask}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md"
          >
            + Tambah Tugas
          </button>
        </div>
      </div>
    </div>
  );
}
