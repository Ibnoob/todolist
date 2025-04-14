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

const pastelColors = [
  'bg-pink-100 border-pink-200',
  'bg-yellow-100 border-yellow-200',
  'bg-green-100 border-green-200',
  'bg-blue-100 border-blue-200',
  'bg-purple-100 border-purple-200',
  'bg-orange-100 border-orange-200',
];

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

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
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
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

    return `${hours}j ${minutes}m ${seconds}s`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Catatan',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Judul tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
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
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Catatan',
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Nama tugas" value="${task.text}">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${new Date(task.deadline).toISOString().slice(0, 16)}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
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

      await updateDoc(doc(db, 'tasks', task.id), {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
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
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h1 className="text-4xl text-center font-bold text-indigo-600 mb-8">
        📝 Catatan Tugas
      </h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-5 py-2 rounded-full transition duration-200 shadow"
        >
          + Tambah Catatan
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
          {tasks.map((task, index) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const pastelClass = pastelColors[index % pastelColors.length];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl border shadow ${pastelClass} relative`}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => editTask(task)}
                    className="text-xs text-white bg-indigo-400 hover:bg-indigo-500 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-xs text-white bg-red-400 hover:bg-red-500 px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </div>
                <div
                  onClick={() => toggleTask(task.id)}
                  className={`cursor-pointer ${
                    task.completed
                      ? 'line-through text-gray-500'
                      : 'text-gray-800 font-semibold'
                  } text-lg mb-2`}
                >
                  {task.text}
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  🗓️ {new Date(task.deadline).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
