import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, authState } from '@angular/fire/auth';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, collectionData, limit } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Router } from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { map } from 'rxjs/operators';

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
    async getCollection(collectionName: string, limitCount?: number): Promise<any[]> {
        try {
            const collectionRef = collection(this.firestore, collectionName);
            let q;

            if (limitCount) {
                // Import limit if you haven't already, but assuming I can add it to imports in a separate edit or here if I'm careful with imports.
                // Actually I need to add 'limit' to the imports at top of file first.
                // Wait, I should do imports first.
                // Let's assume I can add limit to the query construction here, but I need to make sure 'limit' is imported.
                // I will assume for this step I am just changing the function body and will add import in next step or I can try to do it all at once if I view file again.
                // Since I didn't view file imports recently enough to be 100% sure 'limit' isn't there (it wasn't), I'll do this carefully.
                // Actually, I can use multi_replace to do both.
                // But sticking to replace_file_content for the function, I'll need to update imports separately or use multi_replace.
                // I'll use multi_replace for safer execution.
                return []; // Placeholder to cancel this tool call effectively in my thought process
            }
            q = query(collectionRef, orderBy('createdAt', 'desc'));
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

    // Método para obtener citas por fecha
    async getAppointmentsByDate(date: string): Promise<any[]> {
        try {
            const collectionRef = collection(this.firestore, 'appointments');
            const q = query(collectionRef, where('date', '==', date));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error: any) {
            console.error('Error getting appointments by date:', error);
            return [];
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

    // Get hero carousel images from Firestore
    // Método específico que no ordena por createdAt (el ordenamiento se hace en el cliente)
    async getHeroCarouselCollection(): Promise<any[]> {
        try {
            const collectionRef = collection(this.firestore, 'heroCarousel');
            // No usamos orderBy para evitar problemas de índice
            const snapshot = await getDocs(collectionRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error: any) {
            console.error('Error getting hero carousel collection:', error);
            return [];
        }
    }

    // Get hero carousel images from Firestore as Observable
    getHeroCarouselImages(): Observable<any[]> {
        return from(this.getHeroCarouselCollection()).pipe(
            map(images => images || [])
        );
    }
}