import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, limit, writeBatch } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
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
            const q = limitCount && limitCount > 0
                ? query(collectionRef, orderBy('createdAt', 'desc'), limit(limitCount))
                : query(collectionRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
        } catch (error: any) {
            console.error('Error getting collection:', error);
            return [];
        }
    }

    /** Franjas ocupadas para una fecha (solo date + timeSlot; sin datos personales). */
    async getBusySlotsByDate(date: string): Promise<{ id: string; date: string; timeSlot: string }[]> {
        try {
            const collectionRef = collection(this.firestore, 'busySlots');
            const q = query(collectionRef, where('date', '==', date));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({
                id: d.id,
                ...(d.data() as { date: string; timeSlot: string })
            }));
        } catch (error: any) {
            console.error('Error getting busy slots:', error);
            return [];
        }
    }

    /**
     * Reserva franja y crea la solicitud en una sola escritura atómica (requerido por las reglas de seguridad).
     */
    async createPublicAppointmentWithSlot(payload: {
        name: string;
        email: string;
        phone: string;
        date: string;
        timeSlot: string;
        style: string;
        size: string;
        description: string;
        referenceImageUrl: string | null;
    }): Promise<{ success: boolean; error?: string }> {
        const slotId = `${payload.date}_${payload.timeSlot}`;
        const busyRef = doc(this.firestore, 'busySlots', slotId);
        const aptRef = doc(collection(this.firestore, 'appointments'));

        const appointmentPayload = {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            date: payload.date,
            timeSlot: payload.timeSlot,
            style: payload.style,
            size: payload.size,
            description: payload.description,
            referenceImageUrl: payload.referenceImageUrl,
            status: 'pending' as const,
            createdAt: new Date()
        };

        const batch = writeBatch(this.firestore);
        batch.set(busyRef, { date: payload.date, timeSlot: payload.timeSlot });
        batch.set(aptRef, appointmentPayload);

        try {
            await batch.commit();
            return { success: true };
        } catch (error: any) {
            console.error('Error committing appointment batch:', error);
            return { success: false, error: error.message };
        }
    }

    /** Libera la franja al cancelar o eliminar una cita (solo admin autenticado). */
    async deleteBusySlot(date: string, timeSlot: string): Promise<void> {
        if (!date || !timeSlot) {
            return;
        }
        const slotId = `${date}_${timeSlot}`;
        try {
            await deleteDoc(doc(this.firestore, 'busySlots', slotId));
        } catch (error: any) {
            console.warn('deleteBusySlot: documento inexistente u otro error', error);
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