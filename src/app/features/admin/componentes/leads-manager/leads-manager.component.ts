import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-leads-manager',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    templateUrl: './leads-manager.component.html',
    styleUrls: ['./leads-manager.component.scss']
})
export class LeadsManagerComponent implements OnInit {
    messages: any[] = [];
    loading: boolean = false;

    constructor(
        private firebaseService: FirebaseService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadMessages();
    }

    async loadMessages() {
        this.loading = true;
        try {
            this.messages = await this.firebaseService.getCollection('contacts');
            // Ordenar por fecha descendente si no viene ordenado
            this.messages.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
                const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showSnackBar('Error al cargar los mensajes', 'Cerrar');
        } finally {
            this.loading = false;
        }
    }

    async markAsRead(message: any) {
        try {
            const result = await this.firebaseService.updateDocument('contacts', message.id, { read: true });
            if (result.success) {
                message.read = true;
                this.showSnackBar('Mensaje marcado como leído', 'OK');
            }
        } catch (error) {
            console.error('Error updating message:', error);
            this.showSnackBar('Error al actualizar', 'Cerrar');
        }
    }

    async deleteMessage(message: any) {
        if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

        try {
            const result = await this.firebaseService.deleteDocument('contacts', message.id);
            if (result.success) {
                this.messages = this.messages.filter(m => m.id !== message.id);
                this.showSnackBar('Mensaje eliminado', 'OK');
            } else {
                this.showSnackBar('Error al eliminar', 'Cerrar');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showSnackBar('Error al eliminar', 'Cerrar');
        }
    }

    private showSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
        });
    }
}
