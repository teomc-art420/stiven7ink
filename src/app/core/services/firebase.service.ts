import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, authState } from '@angular/fire/auth';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class FirebaseService {
    constructor(private auth: Auth, private firestore: Firestore, private storage: Storage, private router: Router) { }

    // Métodos de autenticación
    async login(email: string, password: string) {
        // Aquí irá la lógica de login
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async register(email: string, password: string) {

    }

    async logout() {
        // Aquí irá la lógica de logout
        try {
            await signOut(this.auth);
            this.router.navigate(['/admin/login']);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        // Aquí irá la lógica para obtener el usuario actual
        return this.auth.currentUser;
    }

    // Observable para escuchar cambios en el estado de autenticación
    getAuthState() {
        return authState(this.auth);
    }

    // Métodos de Firestore
    async getCollection(collectionName: string): Promise<any[]> {
        try {
            const collectionRef = collection(this.firestore, collectionName);
            const q = query(collectionRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error: any) {
            console.error('Error getting collection:', error);
            return [];
        }
    }

    async addDocument(collectionName: string, data: any): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const collectionRef = collection(this.firestore, collectionName);
            const docRef = await addDoc(collectionRef, {
                ...data,
                createdAt: new Date()
            });
            return { success: true, id: docRef.id };
        } catch (error: any) {
            console.error('Error adding document:', error);
            return { success: false, error: error.message };
        }
    }

    async updateDocument(collectionName: string, id: string, data: any): Promise<{ success: boolean; error?: string }> {
        try {
            const docRef = doc(this.firestore, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error: any) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteDocument(collectionName: string, id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const docRef = doc(this.firestore, collectionName, id);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    }

    // Métodos de Storage
    async uploadFile(path: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return { success: true, url };
        } catch (error: any) {
            console.error('Error uploading file:', error);
            return { success: false, error: error.message };
        }
    }

    async getFileUrl(path: string): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            const storageRef = ref(this.storage, path);
            const url = await getDownloadURL(storageRef);
            return { success: true, url };
        } catch (error: any) {
            console.error('Error getting file URL:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
        try {
            const storageRef = ref(this.storage, path);
            await deleteObject(storageRef);
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting file:', error);
            return { success: false, error: error.message };
        }
    }
}